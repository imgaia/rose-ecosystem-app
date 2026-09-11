// scripts/migrate-names.ts
// One-time backfill after adding firstName/lastName/username to Member.
// For each existing member: firstName = old name, lastName = old name
// (a deliberate placeholder — each person corrects their own later),
// username = old name (case preserved; login already matches
// case-insensitively).
//
// Usage:
//   npx tsx scripts/migrate-names.ts                       (local)
//   DB_TARGET=production npx tsx scripts/migrate-names.ts  (production)

import { readFileSync } from "fs";
import { parse } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

let tursoUrl: string | undefined;
let tursoAuthToken: string | undefined;

if (process.env.DB_TARGET === "production") {
  const parsed = parse(readFileSync(".env.production.local", "utf-8"));
  tursoUrl = parsed.TURSO_DATABASE_URL;
  tursoAuthToken = parsed.TURSO_AUTH_TOKEN;
  console.log("Migrating names in PRODUCTION (Turso).");
} else {
  console.log("Migrating names in LOCAL database.");
}

const prisma = tursoUrl
  ? new PrismaClient({ adapter: new PrismaLibSql({ url: tursoUrl, authToken: tursoAuthToken }) })
  : new PrismaClient();

async function main() {
  // Read via raw SQL so this script works whether `name` is still declared
  // in schema.prisma or not — only the physical column needs to still exist.
  const members = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
    `SELECT id, name FROM "Member"`
  );

  for (const m of members) {
    await prisma.member.update({
      where: { id: m.id },
      data: {
        firstName: m.name,
        lastName: m.name, // deliberate placeholder — member corrects later
        username: m.name,
      },
    });
    console.log(`  ${m.name} -> firstName/lastName/username = "${m.name}"`);
  }

  console.log(`Done. Migrated ${members.length} members.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });