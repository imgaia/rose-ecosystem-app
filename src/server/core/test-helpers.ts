// src/server/core/test-helpers.ts
// For tests only. Builds a throwaway SQLite database in the system temp
// folder from scripts/migrations/v08-schema.sql, so tests never touch the
// local, dev or production databases. Plus small helpers to make people,
// collections and funded accounts.

import { createClient } from "@libsql/client";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { roles } from "~/server/rules";
import { PrismaClient } from "../../../generated/prisma";
import { ledgerBalance, postTransaction } from "./ledger";

export async function createTestDb() {
  const dir = mkdtempSync(path.join(tmpdir(), "rose-core-test-"));
  const url = `file:${path.join(dir, "test.db")}`;

  const sql = readFileSync(path.join(process.cwd(), "scripts/migrations/v08-schema.sql"), "utf-8");
  const client = createClient({ url });
  await client.executeMultiple(sql);
  client.close();

  const db = new PrismaClient({ datasourceUrl: url });

  // Reference data the core needs: the roles, and the two currencies.
  for (const key of [...roles.native, ...roles.optional]) {
    await db.role.create({ data: { key, label: key, native: roles.native.includes(key) } });
  }
  const chf = await db.currency.create({ data: { name: "Swiss franc", code: "CHF", kind: "FIAT" } });
  const rcc = await db.currency.create({ data: { name: "Rose Currency Contribution", code: "RCC", kind: "COMMUNITY" } });

  let counter = 0;

  /** An individual holding all three native roles on itself (R-GOV-02). */
  async function person(name: string) {
    counter += 1;
    const node = await db.node.create({
      data: { kind: "INDIVIDUAL", name, firstName: name, username: `${name.toLowerCase()}${counter}` },
    });
    await db.roleAssignment.createMany({
      data: roles.native.map((roleKey) => ({ scopeNodeId: node.id, holderNodeId: node.id, roleKey })),
    });
    return node;
  }

  /** A collection, with the roles each member holds in it. */
  async function collection(name: string, members: { node: { id: string }; roles: string[] }[]) {
    const node = await db.node.create({ data: { kind: "COLLECTION", name } });
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
      where: { nodeId_currencyId_isReserve: { nodeId, currencyId, isReserve: false } },
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
