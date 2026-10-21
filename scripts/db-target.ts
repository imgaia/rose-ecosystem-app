// scripts/db-target.ts
// One place that decides which database a script talks to.
//
//   (unset)            -> the local SQLite file
//   DB_TARGET=dev      -> the dev Turso database   (.env.dev.local)
//   DB_TARGET=production -> the live Turso database (.env.production.local)
//
// Refuses to run if the dev settings point at the same database as
// production, so a copy-paste slip can't make a "dev" command touch live data.

import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";
import { PrismaClient } from "../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export type DbTarget = "local" | "dev" | "production";

const ENV_FILES = { dev: ".env.dev.local", production: ".env.production.local" } as const;

export function getDbTarget(varName = "DB_TARGET"): DbTarget {
  const raw = process.env[varName];
  if (!raw) return "local";
  if (raw === "dev" || raw === "production") return raw;
  throw new Error(`Unknown ${varName}="${raw}". Use "dev" or "production", or leave it unset for local.`);
}

function readTurso(file: string): { url: string; authToken?: string } {
  if (!existsSync(file)) throw new Error(`${file} not found. Create it first (see the dev setup steps).`);
  const parsed = parse(readFileSync(file, "utf-8"));
  if (!parsed.TURSO_DATABASE_URL) throw new Error(`${file} has no TURSO_DATABASE_URL.`);
  return { url: parsed.TURSO_DATABASE_URL, authToken: parsed.TURSO_AUTH_TOKEN };
}

export function createPrismaFor(target: DbTarget): PrismaClient {
  if (target === "local") return new PrismaClient();
  const creds = readTurso(ENV_FILES[target]);
  if (target === "dev" && existsSync(ENV_FILES.production)) {
    const prod = readTurso(ENV_FILES.production);
    if (prod.url === creds.url) {
      throw new Error("STOP: .env.dev.local points at the PRODUCTION database. Fix it before running dev commands.");
    }
  }
  return new PrismaClient({ adapter: new PrismaLibSql({ url: creds.url, authToken: creds.authToken }) });
}
