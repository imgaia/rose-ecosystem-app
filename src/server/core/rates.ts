// src/server/core/rates.ts
// Exchange rates (R-FIN-05, R-FIN-15): the single way to read and write the
// ExchangeRate table. Nothing else touches that table, so a different source
// can replace the daily feed (rateFeed.ts) without changing anything else.
//
// Rows come from four places, each valid from a date until the next one for
// the same pair (in either direction) replaces it (R-FIN-05):
//   - fiat to fiat (CHF -> EUR), from the feed or set by hand;
//   - a fiat-backed currency's price in its reserve fiat, written from its
//     reserve ratio (R-FIN-01) by currencies.ts;
//   - every accepted trade (R-FIN-16), written by interactions.ts;
//   - a starting rate carried over (INITIAL: RCC's 1 CHF from Phase 1).
// For a pair, the most recent row counts, whatever its source. Any other pair
// is worked out through the shortest chain of current rates, at most
// MAX_CHAIN steps; with none, there is no price yet (findRate returns null).
//
// Rates are kept as text ("1", "0.95", or "1/3" when a trade's rate has no
// exact decimal) and worked with as exact fractions (BigInt), so no float
// rounding ever touches money. A converted amount is rounded down to the
// receiving currency's minor unit.

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

/** A stored rate's text: a decimal ("1.25"), or a fraction ("100/107") as rateOf writes it. */
export function parseRate(text: string): Rate {
  const parts = text.trim().split("/");
  if (parts.length === 2 && /^\d+$/.test(parts[0]!) && /^\d+$/.test(parts[1]!)) {
    const [num, den] = [BigInt(parts[0]!), BigInt(parts[1]!)];
    if (num === 0n || den === 0n) throw new Error(`"${text}" must be above 0`);
    return rateOf(num, den);
  }
  const d = parseDecimal(text);
  return rateOf(d.num, d.den);
}

export const sameRate = (a: Rate, b: Rate) => a.num * b.den === b.num * a.den;
const times = (a: Rate, b: Rate) => rateOf(a.num * b.num, a.den * b.den);
const inverse = (r: Rate) => rateOf(r.den, r.num);

/**
 * `amount` minor units of a currency with `fromDecimals`, at `rate`, in minor
 * units of a currency with `toDecimals`, rounded down.
 */
export function applyRate(amount: bigint, fromDecimals: number, toDecimals: number, rate: Rate): bigint {
  return (amount * 10n ** BigInt(toDecimals) * rate.num) / (10n ** BigInt(fromDecimals) * rate.den);
}

/** The longest chain of current rates findRate follows (CO -> CHF -> EUR -> LF is 3). */
export const MAX_CHAIN = 3;

/** Every row valid at `at`, most recent first (validFrom, then when it was written). */
function rowsValidAt(db: Db, at: Date, where: object = {}) {
  return db.exchangeRate.findMany({
    where: { ...where, validFrom: { lte: at }, OR: [{ validTo: null }, { validTo: { gt: at } }] },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
  });
}

/**
 * The rate from one currency to another at `at` (now by default), or null
 * when there is no price yet; never a guess (R-FIN-05).
 *   1. The pair's most recent row, in either direction (inverted as needed),
 *      whatever its source (R-FIN-16).
 *   2. Otherwise the shortest chain of rates valid at `at`, at most
 *      `maxSteps` long; among equally short chains, the one through the most
 *      recent rows. Pass maxSteps 1 to look at the pair's own rows only.
 */
export async function findRate(
  db: Db,
  fromCurrencyId: string,
  toCurrencyId: string,
  at = new Date(),
  { maxSteps = MAX_CHAIN } = {},
): Promise<Rate | null> {
  if (fromCurrencyId === toCurrencyId) return rateOf(1n, 1n);
  const rows = await rowsValidAt(db, at);

  // Each row is an edge both ways. Rows come most recent first, so the first
  // edge seen for a pair is the one that counts.
  const edges = new Map<string, Map<string, Rate>>();
  const addEdge = (a: string, b: string, rate: Rate) => {
    const out = edges.get(a) ?? new Map<string, Rate>();
    if (!out.has(b)) out.set(b, rate);
    edges.set(a, out);
  };
  for (const row of rows) {
    const rate = parseRate(row.rate);
    addEdge(row.fromCurrencyId, row.toCurrencyId, rate);
    addEdge(row.toCurrencyId, row.fromCurrencyId, inverse(rate));
  }

  // Breadth first: the first time we reach `to` is through a shortest chain.
  let frontier = new Map<string, Rate>([[fromCurrencyId, rateOf(1n, 1n)]]);
  const seen = new Set([fromCurrencyId]);
  for (let step = 0; step < maxSteps && frontier.size > 0; step++) {
    const next = new Map<string, Rate>();
    for (const [currencyId, soFar] of frontier) {
      for (const [neighbour, rate] of edges.get(currencyId) ?? []) {
        if (seen.has(neighbour)) continue;
        const total = times(soFar, rate);
        if (neighbour === toCurrencyId) return total;
        seen.add(neighbour);
        next.set(neighbour, total);
      }
    }
    frontier = next;
  }
  return null;
}

/** As findRate, but a missing rate is an error naming R-FIN-05 (for actions that can't go ahead without one). */
export async function getRate(db: Db, fromCurrencyId: string, toCurrencyId: string, at = new Date()): Promise<Rate> {
  const rate = await findRate(db, fromCurrencyId, toCurrencyId, at);
  if (rate) return rate;
  const names = await db.currency.findMany({ where: { id: { in: [fromCurrencyId, toCurrencyId] } }, select: { id: true, code: true, name: true } });
  const name = (id: string) => {
    const c = names.find((n) => n.id === id);
    return c?.code ?? c?.name ?? id;
  };
  throw new RuleError(`No price yet from ${name(fromCurrencyId)} to ${name(toCurrencyId)}`, ["R-FIN-05"]);
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
  parseRate(input.rate); // refuses anything that isn't a positive decimal or fraction
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

/**
 * R-FIN-16: publish a rate from now (an accepted trade). If the pair's current
 * row was written in this same millisecond, the new one starts just after it,
 * so the most recent always wins.
 */
export async function publishRate(db: Db, input: Omit<SetRateInput, "validFrom">) {
  return inTransaction(db, async (tx) => {
    const current = await tx.exchangeRate.findFirst({
      where: {
        validTo: null,
        OR: [
          { fromCurrencyId: input.fromCurrencyId, toCurrencyId: input.toCurrencyId },
          { fromCurrencyId: input.toCurrencyId, toCurrencyId: input.fromCurrencyId },
        ],
      },
      orderBy: { validFrom: "desc" },
    });
    const now = Date.now();
    const validFrom = new Date(current && current.validFrom.getTime() >= now ? current.validFrom.getTime() + 1 : now);
    return setRate(tx, { ...input, validFrom });
  });
}

/**
 * Close (set validTo on) every current row from one source that involves a
 * currency, e.g. its reserve-ratio price once it becomes free. Nothing else
 * changes. Returns how many rows were closed.
 */
export async function closeCurrentRates(db: Db, input: { currencyId: string; source: RateSource; at: Date }) {
  const { count } = await db.exchangeRate.updateMany({
    where: { validTo: null, source: input.source, OR: [{ fromCurrencyId: input.currencyId }, { toCurrencyId: input.currencyId }] },
    data: { validTo: input.at },
  });
  return count;
}

/**
 * A rate with where it came from (R-FIN-05), for screens: the pair's own
 * current row (inverted if stored the other way round), or, when the pair has
 * none, the chain findRate works out, with source "CHAIN". Null: no price yet.
 */
export async function rateWithSource(
  db: Db,
  fromCurrencyId: string,
  toCurrencyId: string,
): Promise<{ rate: Rate; source: RateSource | "CHAIN"; validFrom: Date | null } | null> {
  // In AND: rowsValidAt has an OR of its own (validTo).
  const pair = { OR: [{ fromCurrencyId, toCurrencyId }, { fromCurrencyId: toCurrencyId, toCurrencyId: fromCurrencyId }] };
  const [own] = await rowsValidAt(db, new Date(), { AND: [pair] });
  if (own) {
    const rate = parseRate(own.rate);
    return { rate: own.fromCurrencyId === fromCurrencyId ? rate : inverse(rate), source: own.source, validFrom: own.validFrom };
  }
  const chained = await findRate(db, fromCurrencyId, toCurrencyId);
  return chained && { rate: chained, source: "CHAIN", validFrom: null };
}

/**
 * The latest rates published by accepted trades involving a currency
 * (R-FIN-16), newest first, each as one unit of `currencyId` in the other
 * currency. Only the rows: never who traded.
 */
export async function recentTradeRates(db: Db, currencyId: string, take = 5) {
  const rows = await db.exchangeRate.findMany({
    where: { source: "TRADE", OR: [{ fromCurrencyId: currencyId }, { toCurrencyId: currencyId }] },
    orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
    take,
  });
  return rows.map((row) => {
    const rate = parseRate(row.rate);
    const forward = row.fromCurrencyId === currencyId;
    return { id: row.id, otherCurrencyId: forward ? row.toCurrencyId : row.fromCurrencyId, rate: forward ? rate : inverse(rate), validFrom: row.validFrom };
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
