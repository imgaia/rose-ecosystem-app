// src/server/core/wallet.ts
// A node's own money actions (PRD 3.5): add funds (UC-FIN-04) and mint its
// own currency (UC-FIN-05). Each one checks the capability first, then moves
// value only through postTransaction (ledger.ts). Converting between
// currencies (UC-FIN-03) is in currencies.ts.
//
// Minting: fiat into your OWN currency. The fiat goes into the currency's
// reserve, and the units minted are that value divided by the currency's
// reserve ratio (R-FIN-01).
//
// The quote functions do the same arithmetic without moving anything, so a
// screen can show "you will receive ..." before the person confirms.

import { randomUUID } from "crypto";
import { formatAmount } from "~/lib/money";
import type { Account } from "../../../generated/prisma";
import { label, mintRate, ownAccount, primaryFiatAccount, reserveAccount, reserveRatio, unitsAccount } from "./currencies";
import { inTransaction, type Db } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { applyRate } from "./rates";
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

// ───────────────────────── Mint ─────────────────────────

/**
 * UC-FIN-05: how many units minting would create: the source amount, in the
 * currency's reserve fiat, divided by the currency's reserve ratio (R-FIN-01).
 * Moves nothing.
 */
export async function quoteMint(
  db: Db,
  actor: Actor,
  input: { sourceAccountId: string; amount: number; currencyId?: string },
) {
  const source = await ownAccount(db, actor.actingNodeId, input.sourceAccountId);
  const issued = await db.currency.findMany({ where: { issuerNodeId: actor.actingNodeId, kind: "COMMUNITY", status: "ACTIVE" } });
  const currency = input.currencyId ? issued.find((c) => c.id === input.currencyId) : issued[0];
  if (input.currencyId && !currency) {
    const asked = await db.currency.findUnique({ where: { id: input.currencyId } });
    if (asked?.issuerNodeId === actor.actingNodeId && asked.status === "RETIRED") {
      throw new RuleError(`${label(asked)} is retired: no new units`, ["R-FIN-12"]);
    }
  }
  if (!currency || (!input.currencyId && issued.length > 1)) {
    throw new RuleError(
      issued.length === 0 ? "This node does not issue a currency" : "Pick which of this node's currencies to mint",
      ["R-FIN-04"],
    );
  }
  if (source.currency.kind !== "FIAT") {
    throw new RuleError("Mint from a fiat account: community currency only exists with fiat behind it", ["R-FIN-02"]);
  }
  if (source.currencyId !== currency.reserveCurrencyId) {
    throw new RuleError(`Mint from ${label(currency)}'s reserve fiat`, ["R-FIN-14"]);
  }

  const ratio = await reserveRatio(db, currency.id);
  const rate = mintRate(ratio);
  const units = applyRate(input.amount, source.currency.decimals, currency.decimals, rate);
  if (units <= 0) throw new RuleError("That amount is too small to mint anything");
  return {
    source,
    currency,
    amount: input.amount,
    units,
    rate: rate.text,
    reserveRatio: ratio,
    summary: `${money(input.amount, source)} locked in reserve → ${formatAmount(units, currency.decimals, currency.code)} minted`,
  };
}

/**
 * UC-FIN-05: lock the source amount in the currency's own reserve (R-FIN-02)
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
    const reserve = await reserveAccount(tx, quote.currency);
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

// ───────────────────────── Helpers ─────────────────────────

function money(amount: number, account: Account & { currency: { decimals: number; code: string | null } }) {
  return formatAmount(amount, account.currency.decimals, account.currency.code);
}
