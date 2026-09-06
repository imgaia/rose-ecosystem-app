import { env } from "~/env";
import { PrismaClient } from "../../generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const createPrismaClient = () => {
  const logLevels =
    env.NODE_ENV === "development"
      ? (["query", "error", "warn"] as const)
      : (["error"] as const);

  // If Turso credentials are present (production on Vercel), use the
  // libSQL driver adapter to talk to the remote database over HTTP.
  // Pass a plain config object directly — the adapter builds its own
  // client internally (passing a pre-built client instance here does
  // NOT work with this version of the adapter).
  if (process.env.TURSO_DATABASE_URL) {
    const adapter = new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log: [...logLevels] });
  }

  // Otherwise (local development), fall back to the plain local SQLite
  // file, exactly as before.
  return new PrismaClient({ log: [...logLevels] });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;