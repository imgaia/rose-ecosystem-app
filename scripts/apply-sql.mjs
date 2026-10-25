// scripts/apply-sql.mjs
// Applies a SQL file to a Turso database. The target must be named
// explicitly, so a migration meant for dev can never reach production
// by default.
//
// Usage:
//   DB_TARGET=dev node scripts/apply-sql.mjs <path-to-sql-file>
//   DB_TARGET=production node scripts/apply-sql.mjs <path-to-sql-file>

import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";

const ENV_FILES = { dev: ".env.dev.local", production: ".env.prod-secrets" };
const target = process.env.DB_TARGET;
if (target !== "dev" && target !== "production") {
  console.error("Set DB_TARGET=dev or DB_TARGET=production. Nothing was applied.");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: DB_TARGET=dev node scripts/apply-sql.mjs <path-to-sql-file>");
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

const client = createClient({ url: creds.TURSO_DATABASE_URL, authToken: creds.TURSO_AUTH_TOKEN });
console.log(`Applying ${sqlFile} to the ${target.toUpperCase()} database...`);
await client.executeMultiple(readFileSync(sqlFile, "utf-8"));
console.log("Done.");
