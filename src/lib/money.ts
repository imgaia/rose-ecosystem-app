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
