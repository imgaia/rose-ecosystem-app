// scripts/init-turso.mjs
// One-time setup: applies your schema (as plain SQL) to the live Turso
// database. Run with: node scripts/init-turso.mjs
// Requires .env.production.local to exist (from `vercel env pull`).

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.production.local" });

const sql = readFileSync("turso-init.sql", "utf-8");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log("Applying schema to Turso...");
await client.executeMultiple(sql);
console.log("Done. Your Turso database now has all your tables.");