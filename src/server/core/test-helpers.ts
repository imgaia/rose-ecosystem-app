// src/server/core/test-helpers.ts
// For tests only. Builds a throwaway SQLite database in the system temp
// folder from scripts/migrations/v08-schema.sql plus the v10 and v11 files
// (so those migrations are exercised too), so tests never touch the
// local, dev or production databases. Plus small helpers to make people,
// collections and funded accounts.

import { createClient } from "@libsql/client";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { roles } from "~/server/rules";
import { PrismaClient } from "../../../generated/prisma";
import { ledgerBalance, postTransaction } from "./ledger";
import { setRate } from "./rates";

export async function createTestDb() {
  const dir = mkdtempSync(path.join(tmpdir(), "rose-core-test-"));
  const url = `file:${path.join(dir, "test.db")}`;

  const client = createClient({ url });
  for (const file of ["v08-schema.sql", "v10-currencies.sql", "v10-reserves.sql", "v11-free-currencies.sql"]) {
    await client.executeMultiple(readFileSync(path.join(process.cwd(), "scripts/migrations", file), "utf-8"));
  }
  client.close();

  const db = new PrismaClient({ datasourceUrl: url });

  // Reference data the core needs: the roles, CHF on the fiat list, and RCC,
  // free (R-FIN-17) with a starting rate of 1 CHF since the start of 2026.
  for (const key of [...roles.native, ...roles.optional]) {
    await db.role.create({ data: { key, label: key, native: roles.native.includes(key) } });
  }
  const chf = await db.currency.create({ data: { name: "Swiss franc", code: "CHF", kind: "FIAT", country: "CH" } });
  const rcc = await db.currency.create({
    data: { name: "Rose Currency Contribution", code: "RCC", kind: "COMMUNITY", reserveCurrencyId: chf.id },
  });
  await setRate(db, {
    fromCurrencyId: rcc.id,
    toCurrencyId: chf.id,
    rate: "1",
    validFrom: new Date("2026-01-01"),
    source: "INITIAL",
    setBy: "test",
  });

  let counter = 0;

  /** An individual holding all three native roles on itself (R-GOV-02). */
  async function person(name: string) {
    counter += 1;
    const node = await db.node.create({
      data: { kind: "INDIVIDUAL", name, firstName: name, username: `${name.toLowerCase()}${counter}`, country: "CH" },
    });
    await db.roleAssignment.createMany({
      data: roles.native.map((roleKey) => ({ scopeNodeId: node.id, holderNodeId: node.id, roleKey })),
    });
    return node;
  }

  /** A collection, with the roles each member holds in it. */
  async function collection(name: string, members: { node: { id: string }; roles: string[] }[]) {
    const node = await db.node.create({ data: { kind: "COLLECTION", name, country: "CH" } });
    await db.roleAssignment.createMany({
      data: members.flatMap((m) =>
        m.roles.map((roleKey) => ({ scopeNodeId: node.id, holderNodeId: m.node.id, roleKey })),
      ),
    });
    return node;
  }

  /** An account, funded through the ledger (a deposit), so balance = ledger from the start. */
  async function account(nodeId: string, currencyId: string, opening = 0) {
    const acc = await db.account.create({ data: { nodeId, currencyId } });
    if (opening > 0) {
      await postTransaction(db, {
        kind: "DEPOSIT",
        toAccountId: acc.id,
        amount: opening,
        comment: "Test deposit",
        actedByPersonId: nodeId,
      });
    }
    return acc;
  }

  async function balanceOf(nodeId: string, currencyId: string) {
    const acc = await db.account.findUnique({
      where: { nodeId_currencyId_isReserve_backsCurrencyId: { nodeId, currencyId, isReserve: false, backsCurrencyId: "" } },
    });
    return acc?.balance ?? 0;
  }

  /** Every account whose stored balance differs from the sum of its ledger rows. */
  async function balancesNotMatchingLedger() {
    const mismatches = [];
    for (const acc of await db.account.findMany()) {
      const fromLedger = await ledgerBalance(db, acc.id);
      if (fromLedger !== acc.balance) mismatches.push({ accountId: acc.id, stored: acc.balance, fromLedger });
    }
    return mismatches;
  }

  async function cleanup() {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  }

  return { db, chf, rcc, person, collection, account, balanceOf, balancesNotMatchingLedger, cleanup };
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/**
 * A throwaway SQLite copy of a format 2 backup (a seed candidate, say), built
 * the way scripts/restore.ts does it: the backup's own tables and indexes,
 * then its rows (dates turned back into dates). Then each extra SQL file from
 * scripts/migrations, in order, as a migration would run on that database.
 */
export async function createDbFromBackup(backupFile: string, migrations: string[] = []) {
  const dir = mkdtempSync(path.join(tmpdir(), "rose-backup-test-"));
  const url = `file:${path.join(dir, "test.db")}`;
  const backup = JSON.parse(readFileSync(backupFile, "utf-8")) as {
    schema: Record<string, string>;
    indexes?: Record<string, string>;
    tables: Record<string, Record<string, unknown>[]>;
  };
  const client = createClient({ url });
  await client.executeMultiple([...Object.values(backup.schema), ...Object.values(backup.indexes ?? {})].map((sql) => `${sql};`).join("\n"));
  client.close();

  const db = new PrismaClient({ datasourceUrl: url });
  const quote = (name: string) => `"${name.replace(/"/g, '""')}"`;
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("PRAGMA defer_foreign_keys = ON");
    for (const [table, rows] of Object.entries(backup.tables)) {
      const info = await tx.$queryRawUnsafe<{ name: string; type: string }[]>(`PRAGMA table_info(${quote(table)})`);
      const dates = new Set(info.filter((c) => /DATE|TIME/i.test(c.type)).map((c) => c.name));
      const columns = info.map((c) => c.name);
      for (const row of rows) {
        const values = columns.map((c) => {
          const v = row[c] ?? null;
          return dates.has(c) && typeof v === "string" ? new Date(v) : v;
        });
        await tx.$executeRawUnsafe(
          `INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
          ...values,
        );
      }
    }
  });
  for (const file of migrations) {
    const migrate = createClient({ url }); // as scripts/apply-sql.mjs does it
    await migrate.executeMultiple(readFileSync(path.join(process.cwd(), "scripts/migrations", file), "utf-8"));
    migrate.close();
  }

  async function cleanup() {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  }
  return { db, cleanup };
}
