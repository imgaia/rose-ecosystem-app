// scripts/backup.ts
// Dumps the full database (every table) to a timestamped JSON file under
// backups/. Run locally by default; add DB_TARGET=production to back up
// the live Turso database instead.
//
// Usage:
//   npx tsx scripts/backup.ts                          (local)
//   DB_TARGET=production npx tsx scripts/backup.ts     (production)

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { parse } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

let tursoUrl: string | undefined;
let tursoAuthToken: string | undefined;

if (process.env.DB_TARGET === "production") {
  const parsed = parse(readFileSync(".env.production.local", "utf-8"));
  tursoUrl = parsed.TURSO_DATABASE_URL;
  tursoAuthToken = parsed.TURSO_AUTH_TOKEN;
  console.log("Backing up PRODUCTION (Turso).");
} else {
  console.log("Backing up LOCAL database.");
}

const prisma = tursoUrl
  ? new PrismaClient({ adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken }) })
  : new PrismaClient();

async function main() {
  const target = process.env.DB_TARGET === "production" ? "production" : "local";

  const data = {
    exportedAt: new Date().toISOString(),
    target,
    // Member fetched via raw SQL, not the typed Prisma model — this makes
    // the backup script resilient to schema differences between what's
    // currently in schema.prisma and what columns actually exist on the
    // target database (e.g. running this just before a migration).
    members: await prisma.$queryRawUnsafe(`SELECT * FROM "Member"`),
    memberRoles: await prisma.memberRole.findMany(),
    wallets: await prisma.wallet.findMany(),
    transactions: await prisma.transaction.findMany(),
    rewards: await prisma.reward.findMany(),
    evaluations: await prisma.evaluation.findMany(),
    relationshipStrengths: await prisma.relationshipStrength.findMany(),
    // passwordResetTokens deliberately excluded — short-lived and sensitive,
    // no reason to preserve them across a backup/restore cycle.
  };

  mkdirSync("backups", { recursive: true });
  const filename = `backups/backup-${target}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(filename, JSON.stringify(data, null, 2));

  const members = data.members as unknown[];
  console.log(`Backup written to ${filename}`);
  console.log(
    `Members: ${members.length}, Transactions: ${data.transactions.length}, ` +
    `Rewards: ${data.rewards.length}, Evaluations: ${data.evaluations.length}, ` +
    `Relationships: ${data.relationshipStrengths.length}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });