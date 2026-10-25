// src/app/_components/describe.ts
// Turning data into the short phrases screens show: dates, "200.00 RCC
// monthly", "Work proposal", "Active". Plain functions, no React.

import { formatAmount } from "~/lib/money";

type CurrencyLike = { code: string | null; decimals: number };
type TermsLike = { amount: number; frequency: string; currency: CurrencyLike; description?: string | null };

// Fixed month names, not the browser's language, so a date never reads as
// 10/09 (October or September?) and looks the same for everyone.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "9 Oct 2026" */
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-10-25" (what a date box holds) -> "25 Oct 2026"; "" for none. Read as text, so no time zone can shift the day. */
export function formatDay(day: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return "";
  const [, year, month, date] = match;
  return `${Number(date)} ${MONTHS[Number(month) - 1]} ${year}`;
}

/** The message when an end date comes before its start; null when they are fine or one is empty. */
export function dateOrderError(start: string, end: string) {
  return start && end && end < start ? `End can't be before Start (${formatDay(start).replace(/ /g, "\u00a0")}).` : null;
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
