// src/server/core/wallet.ts
// A node's own money actions (PRD 3.5): add funds (UC-FIN-04), exchange
// (UC-FIN-03) and mint its own currency (UC-FIN-05). Each one checks the
// capability first, then moves value only through postTransaction (ledger.ts).
//
// Community currency only ever exists with fiat locked behind it:
//   - mint: fiat into your OWN currency. The fiat goes into your reserve.
//   - exchange: fiat into a currency ANOTHER node issues (RCC, issued by
//     ROSE Org) = buying it from that issuer. The fiat goes into the
//     issuer's reserve and the units are minted to you at the issuer's
//     reserve ratio.
// Exchanging out of a community currency, and fiat to fiat, are not offered yet.
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
      comment: `Deposit ${input.reference.trim()}`,
      effectiveDate: input.depositedOn,
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

/**
 * UC-FIN-03: what buying `toCurrencyId` with `amount` from a fiat account would
 * give, at the rates-file rate divided by the issuer's reserve ratio. Moves nothing.
 */
export async function quoteExchange(
  db: Db,
  actor: Actor,
  input: { fromAccountId: string; toCurrencyId: string; amount: number },
) {
  const from = await ownAccount(db, actor.actingNodeId, input.fromAccountId);
  const currency = await db.currency.findUniqueOrThrow({ where: { id: input.toCurrencyId } });
  if (from.currency.kind !== "FIAT") throw new RuleError("Exchanging out of a community currency is not offered yet");
  if (currency.kind === "FIAT") throw new RuleError("Exchanging between fiat currencies is not offered yet");
  if (!currency.issuerNodeId) throw new RuleError("This currency has no issuer to buy it from", ["R-FIN-02"]);
  if (currency.issuerNodeId === actor.actingNodeId) {
    throw new RuleError("This node issues that currency: use Mint instead", ["R-FIN-02"]);
  }

  const issuer = await db.node.findUniqueOrThrow({
    where: { id: currency.issuerNodeId },
    select: { id: true, name: true, status: true },
  });
  if (issuer.status !== "ACTIVE") throw new RuleError(`${issuer.name} is not active`);
  const ratio = await reserveRatio(db, issuer.id);
  const { toAmount: units, rate } = convert(input.amount, from.currency, currency, ratio);
  if (units <= 0) throw new RuleError("That amount is too small to exchange");
  return {
    from,
    currency,
    issuer: { id: issuer.id, name: issuer.name },
    amount: input.amount,
    units,
    rate,
    reserveRatio: ratio,
    summary: `${money(input.amount, from)} → ${formatAmount(units, currency.decimals, currency.code)}`,
  };
}

/**
 * UC-FIN-03: buy a currency another node issues. Two ledger rows sharing one
 * groupId: the fiat into the issuer's reserve (R-FIN-02), then the units
 * minted to the buyer.
 */
export async function exchange(
  db: Db,
  actor: Actor,
  input: { fromAccountId: string; toCurrencyId: string; amount: number; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "EXCHANGE");
    const quote = await quoteExchange(tx, actor, input);
    const issuerReserve = await tx.account.upsert({
      where: {
        nodeId_currencyId_isReserve: { nodeId: quote.issuer.id, currencyId: quote.from.currencyId, isReserve: true },
      },
      create: { nodeId: quote.issuer.id, currencyId: quote.from.currencyId, isReserve: true },
      update: {},
    });
    const units = await unitsAccount(tx, actor.actingNodeId, quote.currency.id);
    const buyer = await tx.node.findUniqueOrThrow({ where: { id: actor.actingNodeId }, select: { name: true } });

    const groupId = randomUUID();
    const base = {
      comment: textOrNull(input.comment) ?? `Exchange ${quote.summary}`,
      groupId,
      rate: quote.rate,
      actedByPersonId: actor.personId,
    };
    const unitsText = formatAmount(quote.units, quote.currency.decimals, quote.currency.code);
    const paid = await postTransaction(tx, {
      ...base,
      kind: "EXCHANGE",
      fromAccountId: quote.from.id,
      toAccountId: issuerReserve.id,
      amount: quote.amount,
      summary: `${buyer.name} paid ${money(quote.amount, quote.from)} into ${quote.issuer.name}'s reserve for ${unitsText}`,
    });
    const minted = await postTransaction(tx, {
      ...base,
      kind: "MINT",
      toAccountId: units.id,
      amount: quote.units,
      summary: `${quote.issuer.name} minted ${unitsText} for ${buyer.name}`,
    });
    return { groupId, paid, minted };
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
  if (source.currency.kind !== "FIAT") {
    throw new RuleError("Mint from a fiat account: community currency only exists with fiat behind it", ["R-FIN-02"]);
  }

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
    const units = await unitsAccount(tx, actor.actingNodeId, quote.currency.id);

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

/** The node's spending account in this currency, opened the first time it receives some. */
function unitsAccount(tx: Tx, nodeId: string, currencyId: string) {
  return tx.account.upsert({
    where: { nodeId_currencyId_isReserve: { nodeId, currencyId, isReserve: false } },
    create: { nodeId, currencyId },
    update: {},
  });
}

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
