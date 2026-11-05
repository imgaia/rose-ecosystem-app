// src/lib/money.ts
// The one place amounts are turned into text. Amounts are stored as whole
// minor units (cents), as bigint; a currency's `decimals` says where the point goes.
// Works on the server and in screens (no server-only imports).

/**
 * The largest amount or balance the database can hold: amounts are 64-bit
 * whole numbers (SQLite INTEGER, Prisma BigInt), so 9,223,372,036,854,775,807
 * minor units: about 92 billion units at 8 decimals (R-FIN-18).
 */
export const MAX_MINOR_UNITS = 2n ** 63n - 1n;

/** The limit as text in a currency, for messages: "92233720368.54775807 BTC". */
export const maxAmountText = (decimals: number, code?: string | null) => formatAmount(MAX_MINOR_UNITS, decimals, code);

/**
 * R-FIN-18: 2 decimals (fewer only if the currency has fewer), plus any
 * further ones that are not zero.
 *   formatAmount(2550, 2, "RCC")          -> "25.50 RCC"
 *   formatAmount(5000000, 6, "JCN")       -> "5.00 JCN"
 *   formatAmount(12345678, 8, "BTC")      -> "0.12345678 BTC"
 */
export function formatAmount(minorUnits: bigint | number, decimals: number, code?: string | null): string {
  const units = BigInt(minorUnits);
  const sign = units < 0n ? "-" : "";
  const digits = (units < 0n ? -units : units).toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const shown = Math.min(decimals, 2);
  const fraction = decimals > 0 ? digits.slice(-decimals) : "";
  const kept = fraction.slice(0, shown) + fraction.slice(shown).replace(/0+$/, "");
  const text = kept ? `${whole}.${kept}` : whole;
  return code ? `${sign}${text} ${code}` : `${sign}${text}`;
}

/**
 * Amounts inside text written before the formatter had R-FIN-18's rule
 * (activity summaries and ledger comments are stored as written), shown as
 * formatAmount would show them now. Only a number with 3 or more decimals
 * followed by a currency symbol is touched:
 *   "a gift of 1.000000 JCN"  -> "a gift of 1.00 JCN"
 *   "0.12345000 BTC"          -> "0.12345 BTC"
 */
export function tidyAmounts(text: string): string {
  return text.replace(/\b(\d+)\.(\d{3,})(?= [A-Z][A-Z0-9]{1,7}\b)/g, (_, whole: string, fraction: string) => {
    return `${whole}.${fraction.slice(0, 2)}${fraction.slice(2).replace(/0+$/, "")}`;
  });
}

/**
 * What someone typed into an amount field, as whole minor units:
 * parseAmount("25.5", 2) -> 2550n. Spaces, commas and apostrophes between
 * thousands are ignored. Returns null if it isn't a positive-or-zero number
 * with at most `decimals` digits after the point. Exact for any length: the
 * digits go straight into a bigint, never through a floating-point number.
 */
export function parseAmount(text: string, decimals: number): bigint | null {
  const clean = text.trim().replace(/[\s',]/g, "");
  const match = /^(\d+)(?:\.(\d*))?$/.exec(clean);
  if (!match) return null;
  const fraction = match[2] ?? "";
  if (fraction.length > decimals) return null;
  return BigInt(match[1]! + fraction.padEnd(decimals, "0"));
}
