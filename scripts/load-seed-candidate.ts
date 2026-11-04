// scripts/load-seed-candidate.ts
// Loads a seed candidate (prisma/seed-candidates/*.json) into the local
// database, or into a throwaway SQLite file. Never into dev or production:
// it refuses if DB_TARGET is set, and only ever writes to a file: database.
//
// Like restore.ts (which it runs), this is a full replace: the target's
// tables are dropped first. Everyone in a candidate logs in with its test
// password (see prisma/seed-candidates/README.md).
//
// Usage:
//   npx tsx scripts/load-seed-candidate.ts prisma/seed-candidates/2026-11-04-dev.json
//       -> the local database (DATABASE_URL in .env, prisma/db.sqlite)
//   npx tsx scripts/load-seed-candidate.ts prisma/seed-candidates/2026-11-04-dev.json --db /tmp/try.sqlite
//       -> a throwaway SQLite file (created if missing)

import { execFileSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { parse } from "dotenv";

const args = process.argv.slice(2);
const dbFlag = args.indexOf("--db");
const dbPath = dbFlag >= 0 ? args[dbFlag + 1] : undefined;
const candidate = args.find((a, i) => !a.startsWith("--") && (dbFlag < 0 || i !== dbFlag + 1));

if (!candidate || (dbFlag >= 0 && !dbPath)) {
  console.error("Usage: npx tsx scripts/load-seed-candidate.ts <candidate.json> [--db <path/to/throwaway.sqlite>]");
  process.exit(1);
}
if (!existsSync(candidate)) {
  console.error(`${candidate} not found.`);
  process.exit(1);
}
if (process.env.DB_TARGET) {
  console.error(`Refusing: DB_TARGET=${process.env.DB_TARGET}. Seed candidates load into the local database or a throwaway file only.`);
  process.exit(1);
}

// The database restore.ts will see. Anything that isn't a plain file is refused,
// so a Turso URL in DATABASE_URL can't slip through.
let url: string;
if (dbPath) {
  if (dbPath.includes("://")) {
    console.error(`Refusing: --db takes a file path, not a URL (${dbPath}).`);
    process.exit(1);
  }
  url = `file:${path.resolve(dbPath)}`;
} else {
  // What Prisma itself would use: the environment first, then .env.
  url = process.env.DATABASE_URL ?? (existsSync(".env") ? parse(readFileSync(".env", "utf-8")).DATABASE_URL : undefined) ?? "";
  if (!url.startsWith("file:")) {
    console.error("Refusing: DATABASE_URL is not a local file: database.");
    process.exit(1);
  }
}

console.log(`Loading ${candidate} into ${dbPath ? `the throwaway database ${url}` : "the LOCAL database"}.`);
const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url };
delete env.DB_TARGET;
execFileSync("npx", ["tsx", "scripts/restore.ts", candidate], { stdio: "inherit", env });
