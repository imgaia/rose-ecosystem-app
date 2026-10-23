// src/app/_components/describe.ts
// Turning data into the short phrases screens show: dates, "200.00 RCC
// monthly", "Work proposal", "Active". Plain functions, no React.

import { formatAmount } from "~/lib/money";

type CurrencyLike = { code: string | null; decimals: number };
type TermsLike = { amount: number; frequency: string; currency: CurrencyLike; description?: string | null };

/** "9 Oct 2026" */
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function money(amount: number, currency: CurrencyLike | null | undefined) {
  return currency ? formatAmount(amount, currency.decimals, currency.code) : String(amount);
}

const FREQUENCY: Record<string, string> = { ONCE: "once", WEEKLY: "weekly", MONTHLY: "monthly" };

export function frequencyLabel(frequency: string) {
  return FREQUENCY[frequency] ?? frequency.toLowerCase();
}

/** "200.00 RCC monthly" */
export function termsSummary(terms: TermsLike) {
  return `${money(terms.amount, terms.currency)} ${frequencyLabel(terms.frequency)}`;
}

/** "ACTIVE" -> "Active", "PROJECT_OWNER" -> "Project owner" */
export function titleCase(key: string) {
  const words = key.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const KIND: Record<string, string> = { WORK: "Work", PAYMENT: "Payment", GIFT: "Gift" };

export function interactionKindLabel(kind: string) {
  return KIND[kind] ?? titleCase(kind);
}

/** "Theo" for a node, "you" when it is the node being acted for. */
export function nameOrYou(node: { id: string; name: string } | null | undefined, actingNodeId: string) {
  if (!node) return "Someone";
  return node.id === actingNodeId ? "you" : node.name;
}
