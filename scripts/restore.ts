// scripts/restore.ts
// Restores a database from a format 2 backup made by backup.ts.
// WARNING: this is a full replace, not a merge. It drops EVERY table in the
// target, recreates the tables (and indexes) exactly as the backup recorded
// them, then loads the rows. So it also works across schemas: a backup of the
// old Member/Wallet schema puts a v0.8 database back on the old schema.
//
// It all happens in one database transaction: it all goes in or nothing does.
//
// Usage:
//   npx tsx scripts/restore.ts backups/backup-local-....json
//   DB_TARGET=dev npx tsx scripts/restore.ts backups/backup-dev-....json

import { readFileSync } from "fs";
import { getDbTarget, createPrismaFor } from "./db-target";

interface Backup {
  format: number;
  schema: Record<string, string>;
  indexes?: Record<string, string>;
  tables: Record<string, Record<string, unknown>[]>;
}

const backupFileArg = process.argv[2];
if (!backupFileArg) {
  console.error("Usage: npx tsx scripts/restore.ts <path-to-backup.json>");
  process.exit(1);
}
const backupFile: string = backupFileArg;

const target = getDbTarget();
console.log(`Restoring into the ${target.toUpperCase()} database from ${backupFile}`);
const prisma = createPrismaFor(target);

const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
// Rows per INSERT: fewer round trips to Turso, well under SQLite's parameter limit.
const CHUNK = 50;

async function main(file: string) {
  const backup = JSON.parse(readFileSync(file, "utf-8")) as Backup;
  if (backup.format !== 2 || !backup.schema || !backup.tables) {
    throw new Error("Not a format 2 backup (needs format: 2, schema and tables). Older backups can't be restored with this script.");
  }
  const indexes = backup.indexes ?? {};
  if (!backup.indexes) console.warn("This backup has no indexes (made before step 8); tables come back without them.");

  const current = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%'`,
  );

  await prisma.$transaction(
    async (tx) => {
      // Foreign keys are checked once, at commit, so the order of drops and inserts doesn't matter.
      await tx.$executeRawUnsafe("PRAGMA defer_foreign_keys = ON");

      for (const { name } of current) await tx.$executeRawUnsafe(`DROP TABLE ${quote(name)}`);
      for (const sql of Object.values(backup.schema)) await tx.$executeRawUnsafe(sql);
      for (const sql of Object.values(indexes)) await tx.$executeRawUnsafe(sql);

      for (const [table, rows] of Object.entries(backup.tables)) {
        if (rows.length === 0) continue;
        // The backup holds dates as ISO text. Turn them back into dates so the
        // database client stores them the way the app itself does.
        const info = await tx.$queryRawUnsafe<{ name: string; type: string }[]>(`PRAGMA table_info(${quote(table)})`);
        const dateColumns = new Set(info.filter((c) => /DATE|TIME/i.test(c.type)).map((c) => c.name));
        const columns = info.map((c) => c.name);

        for (let i = 0; i < rows.length; i += CHUNK) {
          const chunk = rows.slice(i, i + CHUNK);
          const values = chunk.flatMap((row) =>
            columns.map((c) => {
              const v = row[c] ?? null;
              return dateColumns.has(c) && typeof v === "string" ? new Date(v) : v;
            }),
          );
          const placeholders = chunk.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
          await tx.$executeRawUnsafe(
            `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES ${placeholders}`,
            ...values,
          );
        }
      }
    },
    { timeout: 300_000 },
  );

  // Check: every table has the backup's row count.
  let ok = true;
  console.log(`Dropped ${current.length} tables; recreated ${Object.keys(backup.schema).length} tables and ${Object.keys(indexes).length} indexes.`);
  for (const [table, rows] of Object.entries(backup.tables)) {
    const [{ n } = { n: -1 }] = await prisma.$queryRawUnsafe<{ n: number | bigint }[]>(`SELECT COUNT(*) AS n FROM ${quote(table)}`);
    const match = Number(n) === rows.length;
    if (!match) ok = false;
    console.log(`  ${table.padEnd(24)} ${String(rows.length).padStart(5)} ${String(n).padStart(5)}  ${match ? "ok" : "MISMATCH"}`);
  }
  console.log(ok ? "Restore complete." : "RESTORE CHECK FAILED");
  if (!ok) process.exitCode = 1;
}

main(backupFile)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
