// src/server/core/rateFeed.ts
// The daily fiat-to-fiat rate feed (R-FIN-05). Fetches the latest rate for
// every fiat on the fiat list against the first one (CHF), and writes a FEED
// row through rates.ts only when a rate has changed.
//
// The fetch goes through a small adapter (RateSourceAdapter), so the source
// can be swapped. The default is Frankfurter (https://api.frankfurter.dev):
// free, no key, central-bank rates based on the European Central Bank.
//
// If the feed fails, nothing is written: the last rate stays in force and
// the failure is logged. A rate is never invented.
//
// Runs from the daily cron route (/api/cron/due-payments) and by hand
// (scripts/fetch-rates.ts).

import type { Db } from "./db";
import { getRate, parseDecimal, rateOf, sameRate, setRate } from "./rates";

export interface RateSourceAdapter {
  name: string;
  /** One unit of `base` in each of `symbols`, as exact decimal text. */
  latest(base: string, symbols: string[]): Promise<Record<string, string>>;
}

/** Frankfurter's latest rates: GET /v1/latest?base=CHF&symbols=EUR -> { rates: { EUR: 1.0712 } }. */
export const frankfurter: RateSourceAdapter = {
  name: "Frankfurter",
  async latest(base, symbols) {
    const query = `base=${encodeURIComponent(base)}&symbols=${symbols.map(encodeURIComponent).join(",")}`;
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?${query}`, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Frankfurter answered ${response.status}`);
    const body = (await response.json()) as { rates?: Record<string, unknown> };
    const rates: Record<string, string> = {};
    for (const [code, value] of Object.entries(body.rates ?? {})) {
      // JSON numbers like 1.0712 print back exactly as they were sent.
      if (typeof value === "number" && Number.isFinite(value) && value > 0) rates[code] = String(value);
    }
    return rates;
  },
};

export interface RateFeedResult {
  source: string;
  written: { from: string; to: string; rate: string }[];
  unchanged: string[];
  missing: string[]; // fiats the feed had no rate for; their last rate stays
  error: string | null; // the feed failed: nothing was written
}

export async function runRateFeed(db: Db, source: RateSourceAdapter = frankfurter, now = new Date()): Promise<RateFeedResult> {
  const result: RateFeedResult = { source: source.name, written: [], unchanged: [], missing: [], error: null };
  const fiats = (await db.currency.findMany({ where: { kind: "FIAT" }, orderBy: { createdAt: "asc" } })).filter((f) => f.code);
  const [base, ...others] = fiats;
  if (!base || others.length === 0) return result;

  let latest: Record<string, string>;
  try {
    latest = await source.latest(base.code!, others.map((f) => f.code!));
  } catch (err) {
    result.error = `${source.name}: ${(err as Error).message}`;
    console.error(`Rate feed failed, keeping the last rates. ${result.error}`);
    return result;
  }

  for (const fiat of others) {
    const text = latest[fiat.code!];
    let fetched;
    try {
      fetched = text ? rateOf(parseDecimal(text).num, parseDecimal(text).den) : null;
    } catch {
      fetched = null; // not a positive decimal: treated as missing
    }
    if (!text || !fetched) {
      result.missing.push(fiat.code!);
      continue;
    }
    const current = await getRate(db, base.id, fiat.id, now).catch(() => null);
    if (current && sameRate(current, fetched)) {
      result.unchanged.push(fiat.code!);
      continue;
    }
    await setRate(db, { fromCurrencyId: base.id, toCurrencyId: fiat.id, rate: text, validFrom: now, source: "FEED", setBy: "system:feed" });
    result.written.push({ from: base.code!, to: fiat.code!, rate: text });
  }
  if (result.missing.length > 0) console.error(`Rate feed had no rate for ${result.missing.join(", ")}; keeping the last ones.`);
  return result;
}
