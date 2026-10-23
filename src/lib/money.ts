// src/lib/money.ts
// The one place amounts are turned into text. Amounts are stored as whole
// minor units (cents); a currency's `decimals` says where the point goes.
// Works on the server and in screens (no server-only imports).

/** formatAmount(2550, 2, "RCC") -> "25.50 RCC" */
export function formatAmount(minorUnits: number, decimals: number, code?: string | null): string {
  const sign = minorUnits < 0 ? "-" : "";
  const digits = String(Math.abs(minorUnits)).padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const text = decimals > 0 ? `${whole}.${digits.slice(-decimals)}` : whole;
  return code ? `${sign}${text} ${code}` : `${sign}${text}`;
}

/**
 * What someone typed into an amount field, as whole minor units:
 * parseAmount("25.5", 2) -> 2550. Spaces, commas and apostrophes between
 * thousands are ignored. Returns null if it isn't a positive-or-zero number
 * with at most `decimals` digits after the point.
 */
export function parseAmount(text: string, decimals: number): number | null {
  const clean = text.trim().replace(/[\s',]/g, "");
  const match = /^(\d+)(?:\.(\d*))?$/.exec(clean);
  if (!match) return null;
  const fraction = match[2] ?? "";
  if (fraction.length > decimals) return null;
  return Number(match[1]) * 10 ** decimals + Number(fraction.padEnd(decimals, "0") || "0");
}
