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

const backupFileArg = process.argv[2];
if (!backupFileArg) {
  console.error("Usage: npx tsx scripts/restore.ts <path-to-backup.json>");
  process.exit(1);
}
const backupFile: string = backupFileArg;

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

// A backup member row might be in the old shape (just `name`, from before
// today's firstName/lastName/username migration) or the new shape. Handle
// both so old backup files stay restorable, not just recent ones.
interface BackupMember {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string | null;
  phoneNumber?: string | null;
  passwordHash?: string | null;
  createdAt: string;
}

async function main(file: string) {
  const data = JSON.parse(readFileSync(file, "utf-8")) as {
    members: BackupMember[];
    memberRoles: { id: string; memberId: string; role: "SPONSOR" | "CURATOR" | "MAKER" }[];
    wallets: { id: string; memberId: string; currency: string; balance: number }[];
    transactions: Record<string, unknown>[];
    rewards: Record<string, unknown>[];
    evaluations: Record<string, unknown>[];
    relationshipStrengths: { id: string; memberAId: string; memberBId: string; strength: number }[];
  };

  await prisma.relationshipStrength.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.memberRole.deleteMany();
  await prisma.member.deleteMany();

  for (const m of data.members) {
    const fallback = m.name ?? "Unknown";
    await prisma.member.create({
      data: {
        id: m.id,
        firstName: m.firstName ?? fallback,
        lastName: m.lastName ?? fallback,
        username: m.username ?? fallback,
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
    await prisma.transaction.create({ data: { ...t, createdAt: new Date(t.createdAt as string) } as never });
  }
  for (const r of data.rewards) {
    await prisma.reward.create({ data: { ...r, createdAt: new Date(r.createdAt as string) } as never });
  }
  for (const e of data.evaluations) {
    await prisma.evaluation.create({ data: { ...e, createdAt: new Date(e.createdAt as string) } as never });
  }
  for (const rs of data.relationshipStrengths) {
    await prisma.relationshipStrength.create({ data: rs });
  }

  console.log("Restore complete.");
}

main(backupFile)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });