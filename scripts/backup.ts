// scripts/backup.ts
// Dumps the full database (every table) to a timestamped JSON file under
// backups/. Runs against the local database by default; set DB_TARGET to
// back up the dev or the live Turso database instead.
//
// Schema-independent: it reads the table list from sqlite_master and dumps
// each table with plain SQL, so it works on the old (Member/Wallet) schema
// and the v0.8 (Node/Account) schema alike. Read-only.
//
// File format:
//   { format: 2, exportedAt, target,
//     schema: { <table>: "CREATE TABLE ..." },
//     tables: { <table>: [ {column: value, ...}, ... ] } }
//
// Usage:
//   npx tsx scripts/backup.ts                          (local)
//   DB_TARGET=dev npx tsx scripts/backup.ts            (dev)
//   DB_TARGET=production npx tsx scripts/backup.ts     (production)

import { writeFileSync, mkdirSync } from "fs";
import { getDbTarget, createPrismaFor } from "./db-target";

const target = getDbTarget();
console.log(`Backing up the ${target.toUpperCase()} database.`);
const prisma = createPrismaFor(target);

async function main() {
  // Skip SQLite's and libSQL's own internal tables.
  const tableList = await prisma.$queryRawUnsafe<{ name: string; sql: string }[]>(
    `SELECT name, sql FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%'
     ORDER BY name`,
  );

  const schema: Record<string, string> = {};
  const tables: Record<string, unknown[]> = {};
  for (const { name, sql } of tableList) {
    schema[name] = sql;
    tables[name] = await prisma.$queryRawUnsafe(`SELECT * FROM "${name.replace(/"/g, '""')}"`);
  }

  const data = { format: 2, exportedAt: new Date().toISOString(), target, schema, tables };

  mkdirSync("backups", { recursive: true });
  const filename = `backups/backup-${target}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  // Raw SQL can return BigInt for integer columns, which JSON can't hold.
  // Keep it a number when that is exact, otherwise a string.
  const replacer = (_key: string, value: unknown) =>
    typeof value === "bigint"
      ? Number.isSafeInteger(Number(value)) ? Number(value) : value.toString()
      : value;
  writeFileSync(filename, JSON.stringify(data, replacer, 2));

  console.log(`Backup written to ${filename}`);
  for (const [name, rows] of Object.entries(tables)) {
    console.log(`  ${name.padEnd(24)} ${rows.length}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
