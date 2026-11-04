// src/server/core/wallet.ts
// A node's own money actions (PRD 3.5): add funds (UC-FIN-04) and mint its
// own currency (UC-FIN-05). Each one checks the capability first, then moves
// value only through postTransaction (ledger.ts). Converting between
// currencies (UC-FIN-03) is in currencies.ts.
//
// Minting your OWN currency. A free one (R-FIN-17): any amount, nothing is
// locked and no rate is written. A fiat-backed one: from fiat, which goes into
// the currency's reserve (R-FIN-02), and the units minted are that value
// divided by its reserve ratio (R-FIN-01).
//
// The quote functions do the same arithmetic without moving anything, so a
// screen can show "you will receive ..." before the person confirms.

import { randomUUID } from "crypto";
import { formatAmount } from "~/lib/money";
import type { Account, Currency } from "../../../generated/prisma";
import { backedRatio, label, mintRate, ownAccount, postMint, primaryFiatAccount, unitsAccount } from "./currencies";
import { inTransaction, type Db } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { applyRate, findRate } from "./rates";
import { assertCan } from "./rules";

// ───────────────────────── Add funds ─────────────────────────

/**
 * UC-FIN-04, first version: the Treasurer has paid fiat into the bank outside
 * the app and records it here. The node's primary fiat account is credited.
 */
export async function addFunds(
  db: Db,
  actor: Actor,
  input: { amount: bigint; reference: string; depositedOn: Date },
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
 * UC-FIN-05: what minting would do. Moves nothing.
 *   - Free currency: `amount` is the units to mint; no source, nothing locked.
 *   - Fiat-backed: `amount` is fiat from the source account; the units are
 *     that amount divided by the reserve ratio (R-FIN-01).
 */
export async function quoteMint(
  db: Db,
  actor: Actor,
  input: { sourceAccountId?: string; amount: bigint; currencyId?: string },
) {
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
  if (currency.backing === "FREE") {
    return {
      backing: currency.backing,
      source: null,
      currency,
      amount: input.amount,
      units: input.amount,
      rate: null,
      reserveRatio: null,
      summary: `${formatAmount(input.amount, currency.decimals, currency.code)} minted; nothing is locked, and it has no price until traded`,
    };
  }
  if (!input.sourceAccountId) throw new RuleError(`Mint ${label(currency)} from a fiat account`, ["R-FIN-02"]);
  const source = await ownAccount(db, actor.actingNodeId, input.sourceAccountId);
  if (source.currency.kind !== "FIAT") {
    throw new RuleError("Mint from a fiat account: community currency only exists with fiat behind it", ["R-FIN-02"]);
  }
  if (source.currencyId !== currency.reserveCurrencyId) {
    throw new RuleError(`Mint from ${label(currency)}'s reserve fiat`, ["R-FIN-14"]);
  }

  const ratio = await backedRatio(db, currency);
  const rate = mintRate(ratio);
  const units = applyRate(input.amount, source.currency.decimals, currency.decimals, rate);
  if (units <= 0n) throw new RuleError("That amount is too small to mint anything");
  return {
    backing: currency.backing,
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
 * UC-FIN-05. Free: one ledger row crediting the new units (R-FIN-17).
 * Fiat-backed: lock the source amount in the currency's own reserve
 * (R-FIN-02) and credit the newly minted units; two rows sharing one groupId.
 */
export async function mint(
  db: Db,
  actor: Actor,
  input: { sourceAccountId?: string; amount: bigint; currencyId?: string; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "MINT");
    const quote = await quoteMint(tx, actor, input);
    if (!quote.source) {
      const groupId = randomUUID();
      const units = await unitsAccount(tx, actor.actingNodeId, quote.currency.id);
      const minted = await postTransaction(tx, {
        kind: "MINT",
        toAccountId: units.id,
        amount: quote.units,
        comment: textOrNull(input.comment) ?? `Mint: ${quote.summary}`,
        groupId,
        actedByPersonId: actor.personId,
      });
      return { groupId, locked: null, minted };
    }
    return postMint(tx, actor, {
      sourceAccountId: quote.source.id,
      currency: quote.currency,
      amount: quote.amount,
      units: quote.units,
      rate: quote.rate,
      comment: textOrNull(input.comment) ?? `Mint: ${quote.summary}`,
    });
  });
}

// ───────────────────────── Total ─────────────────────────

/**
 * UC-FIN-02: the node's spending balances added up in one currency at
 * current rates (reserves are locked, so left out). A currency with no price
 * yet (R-FIN-17) is left out of the amount and named in `unpriced`, so the
 * screen can say so; it is never guessed.
 */
export async function walletTotal(db: Db, nodeId: string, currency: Currency) {
  const accounts = await db.account.findMany({ where: { nodeId, isReserve: false, balance: { not: 0n } }, include: { currency: true }, orderBy: { createdAt: "asc" } });
  let amount = 0n;
  const unpriced: string[] = [];
  for (const a of accounts) {
    const rate = await findRate(db, a.currencyId, currency.id);
    if (!rate) {
      unpriced.push(label(a.currency));
      continue;
    }
    // Round towards zero either way: what is owed isn't made bigger by rounding.
    const converted = applyRate(a.balance < 0n ? -a.balance : a.balance, a.currency.decimals, currency.decimals, rate);
    amount += a.balance < 0n ? -converted : converted;
  }
  return { currency, amount, unpriced };
}

// ───────────────────────── Helpers ─────────────────────────

function money(amount: bigint, account: Account & { currency: { decimals: number; code: string | null } }) {
  return formatAmount(amount, account.currency.decimals, account.currency.code);
}
