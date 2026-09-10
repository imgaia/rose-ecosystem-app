// scripts/apply-sql.mjs
// Applies any SQL file directly to the live Turso database.
// Usage: node scripts/apply-sql.mjs <path-to-sql-file>
// Requires .env.production.local to exist (from `vercel env pull`).

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.production.local" });

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Usage: node scripts/apply-sql.mjs <path-to-sql-file>");
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf-8");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log(`Applying ${sqlFile} to Turso...`);
await client.executeMultiple(sql);
console.log("Done.");
