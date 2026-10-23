// src/server/core/ledger.ts
// The ledger: the only code that changes an account balance.
//
// postTransaction writes one Transaction row and updates both balances in a
// single database transaction. Ledger rows are never edited or deleted, so a
// balance can always be recomputed from them (recomputeBalance).
//
// Amounts are whole numbers of minor units (cents). A row's `amount` leaves
// the from-account; the to-account receives `toAmount` when the currency
// changes (exchange, mint), otherwise the same `amount`.

import { formatAmount } from "~/lib/money";
import { getRule } from "~/server/rules";
import type { Transaction, TransactionKind } from "../../../generated/prisma";
import { recordActivity } from "./activity";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError } from "./errors";

export interface PostTransactionInput {
  kind: TransactionKind;
  fromAccountId?: string | null; // null for a deposit or newly minted units
  toAccountId?: string | null; // null for a withdrawal
  amount: number;
  toAmount?: number; // only when the two accounts have different currencies
  rate?: string;
  comment: string; // required (R-PAY-03)
  interactionId?: string | null;
  groupId?: string | null;
  actedByPersonId: string;
}

function assertWholePositive(value: number, what: string) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RuleError(`${what} must be a whole number of minor units above 0 (got ${value})`);
  }
}

/**
 * R-PAY-02: how far below zero this node's balances may go, in minor units.
 * The node's own value if it set one, otherwise the default in rules.yaml.
 * 0 means a balance may not go negative at all.
 */
export async function negativeBalanceLimit(db: Db, nodeId: string): Promise<number> {
  const own = await db.nodeRuleValue.findUnique({
    where: { nodeId_ruleId: { nodeId, ruleId: "R-PAY-02" } },
  });
  const raw = own?.value ?? getRule("R-PAY-02")?.default ?? 0;
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error(`R-PAY-02 value "${raw}" for node ${nodeId} is not a whole number of 0 or more`);
  }
  return limit;
}

/** How much can leave this account right now without breaking R-PAY-02. */
export async function spendable(db: Db, accountId: string): Promise<number> {
  const account = await db.account.findUniqueOrThrow({ where: { id: accountId } });
  return account.balance + (await negativeBalanceLimit(db, account.nodeId));
}

export async function postTransaction(db: Db, input: PostTransactionInput) {
  assertWholePositive(input.amount, "Amount");
  if (input.toAmount !== undefined) assertWholePositive(input.toAmount, "Received amount");
  if (!input.comment.trim()) throw new RuleError("Every transaction needs a comment", ["R-PAY-03"]);
  if (!input.fromAccountId && !input.toAccountId) throw new RuleError("A transaction needs at least one account");
  if (input.fromAccountId && input.fromAccountId === input.toAccountId) {
    throw new RuleError("From and to accounts must differ");
  }

  return inTransaction(db, async (tx) => {
    const from = input.fromAccountId
      ? await tx.account.findUniqueOrThrow({ where: { id: input.fromAccountId } })
      : null;
    const to = input.toAccountId ? await tx.account.findUniqueOrThrow({ where: { id: input.toAccountId } }) : null;

    const changesCurrency = !!from && !!to && from.currencyId !== to.currencyId;
    if (changesCurrency && input.toAmount === undefined) {
      throw new RuleError("Moving between currencies needs the received amount (toAmount)");
    }
    if (!changesCurrency && input.toAmount !== undefined && input.toAmount !== input.amount) {
      throw new RuleError("toAmount is only for moves between different currencies");
    }

    if (from) {
      // One statement does the check and the decrement together:
      // "take amount off, but only if the balance stays at or above -limit".
      // If no row matched, the payment would break the limit.
      const limit = await negativeBalanceLimit(tx, from.nodeId);
      const { count } = await tx.account.updateMany({
        where: { id: from.id, balance: { gte: input.amount - limit } },
        data: { balance: { decrement: input.amount } },
      });
      if (count === 0) {
        throw new RuleError(
          `Not enough funds: this would take the balance below ${-limit} (negative-balance limit)`,
          ["R-PAY-02"],
        );
      }
    }

    if (to) {
      await tx.account.update({
        where: { id: to.id },
        data: { balance: { increment: changesCurrency ? input.toAmount! : input.amount } },
      });
    }

    const row = await tx.transaction.create({
      data: {
        kind: input.kind,
        fromAccountId: from?.id ?? null,
        toAccountId: to?.id ?? null,
        amount: input.amount,
        toAmount: changesCurrency ? input.toAmount : null,
        rate: input.rate ?? null,
        comment: input.comment.trim(),
        interactionId: input.interactionId ?? null,
        groupId: input.groupId ?? null,
        actedByPersonId: input.actedByPersonId,
      },
    });
    await recordTransactionActivity(tx, row);
    return row;
  });
}

/** One activity entry per movement of value, for the node(s) whose accounts it touched. */
async function recordTransactionActivity(tx: Tx, row: Transaction) {
  const ids = [row.fromAccountId, row.toAccountId].filter((id): id is string => !!id);
  const accounts = await tx.account.findMany({
    where: { id: { in: ids } },
    include: { node: { select: { name: true } }, currency: { select: { code: true, decimals: true } } },
  });
  const from = accounts.find((a) => a.id === row.fromAccountId);
  const to = accounts.find((a) => a.id === row.toAccountId);
  const sent = from ? formatAmount(row.amount, from.currency.decimals, from.currency.code) : "";
  const received = to ? formatAmount(row.toAmount ?? row.amount, to.currency.decimals, to.currency.code) : "";
  const payer = from?.node.name ?? "";
  const payee = to?.node.name ?? "";

  const summaries: Record<TransactionKind, string> = {
    PAYMENT: `${payer} paid ${payee} ${sent}`,
    GIFT: `${payer} gave ${payee} a gift of ${sent}`,
    EXCHANGE: `${payer} exchanged ${sent} for ${received}`,
    // A mint is two rows: the source amount locked in the reserve, then the new units.
    MINT: from ? `${payer} locked ${sent} in the reserve` : `${payee} minted ${received}`,
    DEPOSIT: `${payee} recorded a deposit of ${received}`,
    WITHDRAWAL: `${payer} withdrew ${sent}`,
    OPENING_BALANCE: `Opening balance of ${received} for ${payee}`,
  };
  await recordActivity(tx, {
    type: `transaction.${row.kind.toLowerCase()}`,
    refId: row.id,
    nodeIds: accounts.map((a) => a.nodeId),
    summary: summaries[row.kind],
  });
}

/** The balance this account should have: everything in minus everything out. */
export async function ledgerBalance(db: Db, accountId: string): Promise<number> {
  const [inSame, inConverted, out] = await Promise.all([
    db.transaction.aggregate({ where: { toAccountId: accountId, toAmount: null }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { toAccountId: accountId, toAmount: { not: null } }, _sum: { toAmount: true } }),
    db.transaction.aggregate({ where: { fromAccountId: accountId }, _sum: { amount: true } }),
  ]);
  return (inSame._sum.amount ?? 0) + (inConverted._sum.toAmount ?? 0) - (out._sum.amount ?? 0);
}

/**
 * Recompute an account's balance from the ledger and store it.
 * Returns both numbers so a caller can log or alert on a mismatch;
 * `changed` should always be false.
 */
export async function recomputeBalance(db: Db, accountId: string) {
  return inTransaction(db, async (tx) => {
    const account = await tx.account.findUniqueOrThrow({ where: { id: accountId } });
    const fromLedger = await ledgerBalance(tx, accountId);
    if (fromLedger !== account.balance) {
      await tx.account.update({ where: { id: accountId }, data: { balance: fromLedger } });
    }
    return { accountId, stored: account.balance, fromLedger, changed: fromLedger !== account.balance };
  });
}
