// scripts/apply-sql.mjs
// Applies a SQL file to a Turso database. The target must be named
// explicitly, so a migration meant for dev can never reach production
// by default.
//
// By default the statements run one after another (executeMultiple): if one
// fails, the ones before it stay applied. With --atomic they are sent as one
// write batch, which commits all of them or none. --atomic splits the file on
// semicolons at the end of a line and drops whole-line "--" comments, so each
// statement must end with ";" at the end of its last line.
//
// Usage:
//   DB_TARGET=dev node scripts/apply-sql.mjs <path-to-sql-file>
//   DB_TARGET=dev node scripts/apply-sql.mjs --atomic <path-to-sql-file>
//   DB_TARGET=production node scripts/apply-sql.mjs --atomic <path-to-sql-file>

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";

const ENV_FILES = { dev: ".env.dev.local", production: ".env.prod-secrets" };
const target = process.env.DB_TARGET;
if (target !== "dev" && target !== "production") {
  console.error("Set DB_TARGET=dev or DB_TARGET=production. Nothing was applied.");
  process.exit(1);
}

const args = process.argv.slice(2);
const atomic = args.includes("--atomic");
const sqlFile = args.find((a) => a !== "--atomic");
if (!sqlFile) {
  console.error("Usage: DB_TARGET=dev node scripts/apply-sql.mjs [--atomic] <path-to-sql-file>");
  process.exit(1);
}

const read = (file) => {
  if (!existsSync(file)) { console.error(`${file} not found.`); process.exit(1); }
  return parse(readFileSync(file, "utf-8"));
};
const creds = read(ENV_FILES[target]);
if (target === "dev" && existsSync(ENV_FILES.production) && read(ENV_FILES.production).TURSO_DATABASE_URL === creds.TURSO_DATABASE_URL) {
  console.error("STOP: .env.dev.local points at the PRODUCTION database. Nothing was applied.");
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf-8");
const client = createClient({ url: creds.TURSO_DATABASE_URL, authToken: creds.TURSO_AUTH_TOKEN });

if (atomic) {
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;[ \t]*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  console.log(`Applying ${sqlFile} to the ${target.toUpperCase()} database as one batch of ${statements.length} statements (all or nothing)...`);
  try {
    await client.batch(statements, "write");
  } catch (e) {
    console.error(`Failed, nothing was applied: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  }
} else {
  console.log(`Applying ${sqlFile} to the ${target.toUpperCase()} database...`);
  await client.executeMultiple(sql);
}
console.log("Done.");
