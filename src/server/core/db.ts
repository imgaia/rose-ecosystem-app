// src/server/core/db.ts
// Every core function takes the database as its first argument instead of
// importing the app's client. That way the app passes its own client, tests
// pass a throwaway SQLite database, and one core function can call another
// inside the same database transaction.

import type { Prisma, PrismaClient } from "../../../generated/prisma";

/** Either the full client, or the client inside a running transaction. */
export type Db = PrismaClient | Prisma.TransactionClient;
export type Tx = Prisma.TransactionClient;

/**
 * Run `fn` inside one database transaction: it all goes in or nothing does.
 * If we are already inside a transaction, reuse it (Prisma can't nest them).
 */
export function inTransaction<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return "$transaction" in db ? db.$transaction(fn) : fn(db);
}
