// scripts/restore.ts
// Restores a database from a backup JSON file produced by backup.ts.
// WARNING: this clears all existing data first, then reloads from the
// backup file — it's a full replace, not a merge.
//
// Usage:
//   npx tsx scripts/restore.ts backups/backup-local-....json
//   DB_TARGET=production npx tsx scripts/restore.ts backups/backup-production-....json

import { readFileSync } from "fs";
import { parse } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("Usage: npx tsx scripts/restore.ts <path-to-backup.json>");
  process.exit(1);
}

let tursoUrl: string | undefined;
let tursoAuthToken: string | undefined;

if (process.env.DB_TARGET === "production") {
  const parsed = parse(readFileSync(".env.production.local", "utf-8"));
  tursoUrl = parsed.TURSO_DATABASE_URL;
  tursoAuthToken = parsed.TURSO_AUTH_TOKEN;
  console.log(`Restoring into PRODUCTION (Turso) from ${backupFile}`);
} else {
  console.log(`Restoring into LOCAL database from ${backupFile}`);
}

const prisma = tursoUrl
  ? new PrismaClient({ adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken }) })
  : new PrismaClient();

async function main() {
  const data = JSON.parse(readFileSync(backupFile, "utf-8"));

  // Clear existing data first, respecting foreign key order (children first).
  await prisma.relationshipStrength.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.memberRole.deleteMany();
  await prisma.member.deleteMany();

  // Restore in parent-first order, preserving original IDs so relationships
  // between records stay intact exactly as they were.
  for (const m of data.members) {
    await prisma.member.create({
      data: {
        id: m.id,
        name: m.name,
        email: m.email ?? null,
        phoneNumber: m.phoneNumber ?? null,
        passwordHash: m.passwordHash ?? null,
        createdAt: new Date(m.createdAt),
      },
    });
  }
  for (const r of data.memberRoles) {
    await prisma.memberRole.create({ data: { id: r.id, memberId: r.memberId, role: r.role } });
  }
  for (const w of data.wallets) {
    await prisma.wallet.create({ data: { id: w.id, memberId: w.memberId, currency: w.currency, balance: w.balance } });
  }
  for (const t of data.transactions) {
    await prisma.transaction.create({ data: { ...t, createdAt: new Date(t.createdAt) } });
  }
  for (const r of data.rewards) {
    await prisma.reward.create({ data: { ...r, createdAt: new Date(r.createdAt) } });
  }
  for (const e of data.evaluations) {
    await prisma.evaluation.create({ data: { ...e, createdAt: new Date(e.createdAt) } });
  }
  for (const rs of data.relationshipStrengths) {
    await prisma.relationshipStrength.create({ data: rs });
  }

  console.log("Restore complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });