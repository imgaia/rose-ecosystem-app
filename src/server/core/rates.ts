// src/server/core/rates.ts
// Exchange rates (R-FIN-05, R-FIN-15): the single way to read and write the
// ExchangeRate table. Nothing else touches that table, so a different source
// can replace the daily feed (rateFeed.ts) without changing anything else.
//
// Two kinds of rows are stored, each valid from a date until the next one for
// the same pair replaces it:
//   - fiat to fiat (CHF -> EUR), from the feed or set by hand;
//   - a node currency's price in its reserve fiat (RCC -> CHF), written from
//     its reserve ratio (R-FIN-01) by currencies.ts.
// Any other pair is worked out from these when asked (getRate).
//
// Rates are kept as text ("1", "0.95") and worked with as exact fractions
// (BigInt), so no float rounding ever touches money. A converted amount is
// rounded down to the receiving currency's minor unit.

import type { RateSource } from "../../../generated/prisma";
import { inTransaction, type Db } from "./db";
import { RuleError } from "./errors";

/** An exact rate: one unit of `from` is worth num/den units of `to`. */
export interface Rate {
  num: bigint;
  den: bigint;
  text: string; // as recorded on a transaction: "1.0712", or "100/107" when it has no exact decimal
}

/** "1.25" -> { num: 125n, den: 100n }. Refuses anything that isn't a plain positive decimal. */
export function parseDecimal(text: string): { num: bigint; den: bigint } {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text.trim());
  if (!match) throw new Error(`"${text}" is not a decimal number`);
  const fraction = match[2] ?? "";
  const num = BigInt(match[1]! + fraction);
  if (num === 0n) throw new Error(`"${text}" must be above 0`);
  return { num, den: 10n ** BigInt(fraction.length) };
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

/** A fraction in lowest terms, with its text: a decimal when it has an exact one, else "num/den". */
export function rateOf(num: bigint, den: bigint): Rate {
  const g = gcd(num, den);
  const [n, d] = [num / g, den / g];
  // A fraction has an exact decimal when its denominator has no prime factors but 2 and 5.
  let rest = d;
  let places = 0;
  while (rest % 2n === 0n || rest % 5n === 0n) {
    rest = rest % 2n === 0n ? rest / 2n : rest / 5n;
    places += 1;
  }
  if (rest !== 1n) return { num: n, den: d, text: `${n}/${d}` };
  const digits = ((n * 10n ** BigInt(places)) / d).toString().padStart(places + 1, "0");
  const whole = digits.slice(0, digits.length - places);
  const fraction = digits.slice(digits.length - places).replace(/0+$/, "");
  return { num: n, den: d, text: fraction ? `${whole}.${fraction}` : whole };
}

const fromText = (text: string) => rateOf(parseDecimal(text).num, parseDecimal(text).den);
export const sameRate = (a: Rate, b: Rate) => a.num * b.den === b.num * a.den;
const times = (a: Rate, b: Rate) => rateOf(a.num * b.num, a.den * b.den);
const inverse = (r: Rate) => rateOf(r.den, r.num);

/**
 * `amount` minor units of a currency with `fromDecimals`, at `rate`, in minor
 * units of a currency with `toDecimals`, rounded down.
 */
export function applyRate(amount: number, fromDecimals: number, toDecimals: number, rate: Rate): number {
  const top = BigInt(amount) * 10n ** BigInt(toDecimals) * rate.num;
  const bottom = 10n ** BigInt(fromDecimals) * rate.den;
  return Number(top / bottom);
}

/** The stored row valid at `at` for this pair, in this direction only. */
async function storedRow(db: Db, fromCurrencyId: string, toCurrencyId: string, at: Date) {
  return db.exchangeRate.findFirst({
    where: { fromCurrencyId, toCurrencyId, validFrom: { lte: at }, OR: [{ validTo: null }, { validTo: { gt: at } }] },
    orderBy: { validFrom: "desc" },
  });
}

/** A stored rate valid at `at`, in either direction (inverted when stored the other way), or null. */
async function storedRate(db: Db, fromCurrencyId: string, toCurrencyId: string, at: Date): Promise<Rate | null> {
  const direct = await storedRow(db, fromCurrencyId, toCurrencyId, at);
  if (direct) return fromText(direct.rate);
  const reverse = await storedRow(db, toCurrencyId, fromCurrencyId, at);
  return reverse ? inverse(fromText(reverse.rate)) : null;
}

/**
 * A currency's value in fiat at `at`: itself for fiat; for a node currency,
 * its price in its reserve fiat. Null when it has no price yet.
 */
async function inFiat(db: Db, currencyId: string, at: Date): Promise<{ fiatId: string; rate: Rate } | null> {
  const currency = await db.currency.findUniqueOrThrow({ where: { id: currencyId }, select: { kind: true, reserveCurrencyId: true } });
  if (currency.kind === "FIAT") return { fiatId: currencyId, rate: rateOf(1n, 1n) };
  if (!currency.reserveCurrencyId) return null;
  const price = await storedRate(db, currencyId, currency.reserveCurrencyId, at);
  return price ? { fiatId: currency.reserveCurrencyId, rate: price } : null;
}

/**
 * The rate from one currency to another at `at` (now by default): a stored
 * row for the pair if there is one, otherwise worked out through the two
 * currencies' fiats (price of `from`, then fiat to fiat, then 1 / price of `to`).
 * Throws a RuleError (R-FIN-05) when there is no way to work it out.
 */
export async function getRate(db: Db, fromCurrencyId: string, toCurrencyId: string, at = new Date()): Promise<Rate> {
  if (fromCurrencyId === toCurrencyId) return rateOf(1n, 1n);
  const stored = await storedRate(db, fromCurrencyId, toCurrencyId, at);
  if (stored) return stored;

  const [from, to] = await Promise.all([inFiat(db, fromCurrencyId, at), inFiat(db, toCurrencyId, at)]);
  const fiatRate = from && to ? (from.fiatId === to.fiatId ? rateOf(1n, 1n) : await storedRate(db, from.fiatId, to.fiatId, at)) : null;
  if (!from || !to || !fiatRate) {
    const names = await db.currency.findMany({ where: { id: { in: [fromCurrencyId, toCurrencyId] } }, select: { id: true, code: true, name: true } });
    const name = (id: string) => {
      const c = names.find((n) => n.id === id);
      return c?.code ?? c?.name ?? id;
    };
    throw new RuleError(`No exchange rate from ${name(fromCurrencyId)} to ${name(toCurrencyId)}`, ["R-FIN-05"]);
  }
  return times(times(from.rate, fiatRate), inverse(to.rate));
}

export interface SetRateInput {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: string; // exact decimal as text
  validFrom: Date;
  source: RateSource;
  setBy: string;
}

/**
 * R-FIN-15: add a new rate for a pair. The current row for the pair (in either
 * direction) is closed at the new row's validFrom, in the same database
 * transaction. Nothing is ever changed but that validTo.
 */
export async function setRate(db: Db, input: SetRateInput) {
  parseDecimal(input.rate); // refuses anything that isn't a positive decimal
  if (input.fromCurrencyId === input.toCurrencyId) throw new RuleError("A rate needs two different currencies");
  return inTransaction(db, async (tx) => {
    const pair = [
      { fromCurrencyId: input.fromCurrencyId, toCurrencyId: input.toCurrencyId },
      { fromCurrencyId: input.toCurrencyId, toCurrencyId: input.fromCurrencyId },
    ];
    const current = await tx.exchangeRate.findMany({ where: { validTo: null, OR: pair } });
    if (current.some((row) => row.validFrom >= input.validFrom)) {
      throw new RuleError("A new rate must start after the current one", ["R-FIN-15"]);
    }
    await tx.exchangeRate.updateMany({ where: { id: { in: current.map((r) => r.id) } }, data: { validTo: input.validFrom } });
    return tx.exchangeRate.create({ data: { ...input, rate: input.rate.trim() } });
  });
}

/** Every row for a pair, newest first, both directions: a currency's price history, say. */
export async function rateHistory(db: Db, fromCurrencyId: string, toCurrencyId: string) {
  return db.exchangeRate.findMany({
    where: {
      OR: [
        { fromCurrencyId, toCurrencyId },
        { fromCurrencyId: toCurrencyId, toCurrencyId: fromCurrencyId },
      ],
    },
    orderBy: { validFrom: "desc" },
  });
}

/**
 * The one exception to "never deleted": deleting a currency nobody ever held
 * (R-FIN-12) takes its price rows with it, since they priced nothing.
 */
export async function deleteRatesOfUnheldCurrency(db: Db, currencyId: string) {
  await db.exchangeRate.deleteMany({ where: { OR: [{ fromCurrencyId: currencyId }, { toCurrencyId: currencyId }] } });
}
