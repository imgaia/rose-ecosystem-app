// src/server/core/wallet.ts
// A node's own money actions (PRD 3.5): add funds (UC-FIN-04), exchange
// between its own accounts (UC-FIN-03) and mint its own currency (UC-FIN-05).
// Each one checks the capability first, then moves value only through
// postTransaction (ledger.ts).
//
// The quote functions do the same arithmetic without moving anything, so a
// screen can show "you will receive ..." before the person confirms.

import { randomUUID } from "crypto";
import { formatAmount } from "~/lib/money";
import { getRule } from "~/server/rules";
import type { Account } from "../../../generated/prisma";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { convert } from "./rates";
import { assertCan } from "./rules";

// ───────────────────────── Add funds ─────────────────────────

/**
 * UC-FIN-04, first version: the Treasurer has paid fiat into the bank outside
 * the app and records it here. The node's primary fiat account is credited.
 */
export async function addFunds(
  db: Db,
  actor: Actor,
  input: { amount: number; reference: string; depositedOn: Date },
) {
  if (!input.reference.trim()) throw new RuleError("Enter the bank reference of the deposit", ["R-PAY-03"]);
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "ADD_FUNDS");
    const account = await primaryFiatAccount(tx, actor.actingNodeId);
    return postTransaction(tx, {
      kind: "DEPOSIT",
      toAccountId: account.id,
      amount: input.amount,
      comment: `Deposit ${input.reference.trim()} on ${input.depositedOn.toISOString().slice(0, 10)}`,
      actedByPersonId: actor.personId,
    });
  });
}

/**
 * R-FIN-07: every node has one primary fiat account. A node that has none yet
 * (a collection made before this rule, for instance) gets a CHF one now.
 */
async function primaryFiatAccount(tx: Tx, nodeId: string) {
  const existing = await tx.account.findFirst({ where: { nodeId, isPrimaryFiat: true } });
  if (existing) return existing;
  const chf = await tx.currency.findFirst({ where: { kind: "FIAT", code: "CHF" } });
  if (!chf) throw new RuleError("No CHF currency is set up", ["R-FIN-07"]);
  return tx.account.upsert({
    where: { nodeId_currencyId_isReserve: { nodeId, currencyId: chf.id, isReserve: false } },
    create: { nodeId, currencyId: chf.id, isPrimaryFiat: true },
    update: { isPrimaryFiat: true },
  });
}

// ───────────────────────── Exchange ─────────────────────────

/** UC-FIN-03: what an exchange would give, at the rate in the rates file. Moves nothing. */
export async function quoteExchange(
  db: Db,
  actor: Actor,
  input: { fromAccountId: string; toAccountId: string; amount: number },
) {
  const [from, to] = await Promise.all([
    ownAccount(db, actor.actingNodeId, input.fromAccountId),
    ownAccount(db, actor.actingNodeId, input.toAccountId),
  ]);
  if (from.currencyId === to.currencyId) throw new RuleError("Pick two accounts in different currencies");
  const { toAmount, rate } = convert(input.amount, from.currency, to.currency);
  if (toAmount <= 0) throw new RuleError("That amount is too small to exchange");
  return { from, to, amount: input.amount, toAmount, rate, summary: `${money(input.amount, from)} → ${money(toAmount, to)}` };
}

/** UC-FIN-03: move value between two of the node's own accounts, recorded with its rate. No minting. */
export async function exchange(
  db: Db,
  actor: Actor,
  input: { fromAccountId: string; toAccountId: string; amount: number; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "EXCHANGE");
    const quote = await quoteExchange(tx, actor, input);
    return postTransaction(tx, {
      kind: "EXCHANGE",
      fromAccountId: quote.from.id,
      toAccountId: quote.to.id,
      amount: quote.amount,
      toAmount: quote.toAmount,
      rate: quote.rate,
      comment: textOrNull(input.comment) ?? `Exchange ${quote.summary}`,
      actedByPersonId: actor.personId,
    });
  });
}

// ───────────────────────── Mint ─────────────────────────

/**
 * UC-FIN-05: how many units minting would create. The source amount is
 * converted to the node's currency at the rates-file rate, then divided by
 * the node's reserve ratio (R-FIN-01). Moves nothing.
 */
export async function quoteMint(
  db: Db,
  actor: Actor,
  input: { sourceAccountId: string; amount: number; currencyId?: string },
) {
  const source = await ownAccount(db, actor.actingNodeId, input.sourceAccountId);
  const issued = await db.currency.findMany({ where: { issuerNodeId: actor.actingNodeId, kind: "COMMUNITY" } });
  const currency = input.currencyId ? issued.find((c) => c.id === input.currencyId) : issued[0];
  if (!currency || (!input.currencyId && issued.length > 1)) {
    throw new RuleError(
      issued.length === 0 ? "This node does not issue a currency" : "Pick which of this node's currencies to mint",
      ["R-FIN-04"],
    );
  }
  if (source.currencyId === currency.id) throw new RuleError("Mint from an account in another currency");

  const ratio = await reserveRatio(db, actor.actingNodeId);
  const { toAmount: units, rate } = convert(input.amount, source.currency, currency, ratio);
  if (units <= 0) throw new RuleError("That amount is too small to mint anything");
  return {
    source,
    currency,
    amount: input.amount,
    units,
    rate,
    reserveRatio: ratio,
    summary: `${money(input.amount, source)} locked in reserve → ${formatAmount(units, currency.decimals, currency.code)} minted`,
  };
}

/**
 * UC-FIN-05: lock the source amount in the node's reserve account (R-FIN-02)
 * and credit the newly minted units. Two ledger rows sharing one groupId.
 */
export async function mint(
  db: Db,
  actor: Actor,
  input: { sourceAccountId: string; amount: number; currencyId?: string; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "MINT");
    const quote = await quoteMint(tx, actor, input);
    const reserve = await tx.account.upsert({
      where: {
        nodeId_currencyId_isReserve: { nodeId: actor.actingNodeId, currencyId: quote.source.currencyId, isReserve: true },
      },
      create: { nodeId: actor.actingNodeId, currencyId: quote.source.currencyId, isReserve: true },
      update: {},
    });
    const units = await tx.account.upsert({
      where: {
        nodeId_currencyId_isReserve: { nodeId: actor.actingNodeId, currencyId: quote.currency.id, isReserve: false },
      },
      create: { nodeId: actor.actingNodeId, currencyId: quote.currency.id },
      update: {},
    });

    const groupId = randomUUID();
    const comment = textOrNull(input.comment) ?? `Mint: ${quote.summary}`;
    const base = { kind: "MINT", comment, groupId, rate: quote.rate, actedByPersonId: actor.personId } as const;
    const locked = await postTransaction(tx, {
      ...base,
      fromAccountId: quote.source.id,
      toAccountId: reserve.id,
      amount: quote.amount,
    });
    const minted = await postTransaction(tx, { ...base, toAccountId: units.id, amount: quote.units });
    return { groupId, locked, minted };
  });
}

/** R-FIN-01: the node's own reserve ratio, or the default from rules.yaml. */
async function reserveRatio(db: Db, nodeId: string): Promise<string> {
  const own = await db.nodeRuleValue.findUnique({ where: { nodeId_ruleId: { nodeId, ruleId: "R-FIN-01" } } });
  return String(own?.value ?? getRule("R-FIN-01")?.default ?? "1");
}

// ───────────────────────── Helpers ─────────────────────────

/** One of the acting node's own spending accounts (never its locked reserve). */
async function ownAccount(db: Db, nodeId: string, accountId: string) {
  const account = await db.account.findUnique({ where: { id: accountId }, include: { currency: true } });
  if (account?.nodeId !== nodeId) throw new RuleError("That account does not belong to this node");
  if (account.isReserve) throw new RuleError("Reserve accounts are locked", ["R-FIN-02"]);
  return account;
}

function money(amount: number, account: Account & { currency: { decimals: number; code: string | null } }) {
  return formatAmount(amount, account.currency.decimals, account.currency.code);
}
