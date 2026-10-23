// src/server/core/rates.ts
// Exchange rates from the static rates file (R-FIN-05, src/server/rates.json),
// and the one function that converts an amount between currencies.
//
// Rates are kept as text ("1", "0.95") and converted with whole-number
// arithmetic (BigInt), so no float rounding ever touches money. A converted
// amount is rounded down to the receiving currency's minor unit.

import ratesFile from "~/server/rates.json";
import { RuleError } from "./errors";

/** "1.25" -> { num: 125n, den: 100n }. Refuses anything that isn't a plain positive decimal. */
export function parseDecimal(text: string): { num: bigint; den: bigint } {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text.trim());
  if (!match) throw new Error(`"${text}" is not a decimal number`);
  const fraction = match[2] ?? "";
  const num = BigInt(match[1]! + fraction);
  if (num === 0n) throw new Error(`"${text}" must be above 0`);
  return { num, den: 10n ** BigInt(fraction.length) };
}

/**
 * The rate from one currency code to another, as text, or null if the rates
 * file has neither direction. A reverse entry is used as 1 / rate.
 */
export function findRate(fromCode: string, toCode: string): { num: bigint; den: bigint; text: string } | null {
  if (fromCode === toCode) return { num: 1n, den: 1n, text: "1" };
  const direct = ratesFile.rates.find((r) => r.from === fromCode && r.to === toCode);
  if (direct) return { ...parseDecimal(direct.rate), text: direct.rate };
  const reverse = ratesFile.rates.find((r) => r.from === toCode && r.to === fromCode);
  if (reverse) {
    const { num, den } = parseDecimal(reverse.rate);
    return { num: den, den: num, text: `1/${reverse.rate}` };
  }
  return null;
}

interface CurrencyLike {
  code: string | null;
  decimals: number;
}

/**
 * Convert `amount` minor units of `from` into minor units of `to`, optionally
 * divided by a ratio (the reserve ratio when minting, R-FIN-01).
 * Throws a RuleError if the rates file has no rate for the pair.
 */
export function convert(amount: number, from: CurrencyLike, to: CurrencyLike, divideBy = "1") {
  if (!from.code || !to.code) throw new RuleError("Both currencies need a code to look up a rate", ["R-FIN-05"]);
  const rate = findRate(from.code, to.code);
  if (!rate) throw new RuleError(`No exchange rate from ${from.code} to ${to.code} in the rates file`, ["R-FIN-05"]);
  const ratio = parseDecimal(divideBy);

  // amount × 10^toDecimals × rate ÷ (10^fromDecimals × ratio), rounded down.
  const top = BigInt(amount) * 10n ** BigInt(to.decimals) * rate.num * ratio.den;
  const bottom = 10n ** BigInt(from.decimals) * rate.den * ratio.num;
  return { toAmount: Number(top / bottom), rate: rate.text };
}
