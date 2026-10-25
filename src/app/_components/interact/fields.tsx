"use client";

// src/app/_components/interact/fields.tsx
// Form pieces shared by the send, request and propose-work screens:
// choosing a node, choosing a currency, and the terms of an interaction
// (what, price, how often, from when to when).
//
// Amounts are typed as text ("25.50") and turned into whole minor units
// (2550) only when the form is sent, with parseAmount from ~/lib/money.

import { useEffect, useState } from "react";

import { formatAmount, parseAmount } from "~/lib/money";
import { api, type RouterInputs, type RouterOutputs } from "~/trpc/react";
import { DateField } from "../date-field";
import { dateOrderError } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { Field, Input, Select, TextArea, Toggle } from "../ui";

export type Currency = RouterOutputs["wallet"]["currencies"][number];
export type TermsInput = RouterInputs["interactions"]["proposeWork"]["terms"];
type Frequency = "ONCE" | "WEEKLY" | "MONTHLY";

/**
 * Pick a node: type part of a name and choose from the network directory.
 * Once chosen it shows the node, with "Change" to pick another.
 */
export function NodePicker({
  label,
  nodeId,
  onChange,
}: {
  label: string;
  nodeId: string | null;
  onChange: (nodeId: string | null) => void;
}) {
  const { acting } = useActingNode();
  const actingNodeId = acting.node.id;
  const [query, setQuery] = useState("");
  const selected = api.nodes.page.useQuery({ actingNodeId, nodeId: nodeId ?? "" }, { enabled: !!nodeId });
  const results = api.nodes.directory.useQuery(
    { actingNodeId, query, limit: 8 },
    { enabled: !nodeId && query.trim().length > 0 },
  );

  if (nodeId) {
    const node = selected.data?.node;
    return (
      <Field label={label}>
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-rose-border bg-rose-bg px-3">
          <span className="flex items-center gap-3">
            {node && <Avatar node={node} size="sm" />}
            <span className="font-semibold">{node?.name ?? "…"}</span>
          </span>
          <button type="button" onClick={() => onChange(null)} className="min-h-11 px-2 text-xs font-semibold text-rose-accent">
            Change
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <Input type="search" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
      {results.data && (
        <div className="flex flex-col rounded-xl border border-rose-border bg-rose-surface">
          {results.data.length === 0 && <p className="px-3 py-2 text-sm text-rose-muted">No one found.</p>}
          {results.data.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onChange(node.id)}
              className="flex min-h-11 items-center gap-3 border-t border-rose-border px-3 text-left first:border-t-0 hover:bg-white/5"
            >
              <Avatar node={node} size="sm" />
              {node.name}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

/** The currencies to pick from; picks the first community currency (RCC) if none is chosen yet. */
export function useCurrencies(currencyId: string, setCurrencyId: (id: string) => void) {
  const { acting } = useActingNode();
  const currencies = api.wallet.currencies.useQuery({ actingNodeId: acting.node.id });
  const data = currencies.data;
  useEffect(() => {
    if (!currencyId && data && data.length > 0) setCurrencyId((data.find((c) => c.kind === "COMMUNITY") ?? data[0]!).id);
  }, [currencyId, data, setCurrencyId]);
  const list = data ?? [];
  return { list, current: list.find((c) => c.id === currencyId) };
}

/** An amount box and a currency menu side by side. */
export function AmountField({
  label,
  amount,
  onAmount,
  currencyId,
  onCurrency,
  currencies,
}: {
  label: string;
  amount: string;
  onAmount: (text: string) => void;
  currencyId: string;
  onCurrency: (id: string) => void;
  currencies: Currency[];
}) {
  return (
    <div className="grid grid-cols-[1fr_8rem] gap-2">
      <Field label={label}>
        <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => onAmount(e.target.value)} />
      </Field>
      <Field label="Currency">
        <Select value={currencyId} onChange={(e) => onCurrency(e.target.value)}>
          {currencies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ?? c.name}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

/** Minor units from the typed text, or an error message for the form. */
export function readAmount(text: string, currency: Currency | undefined): { amount: number } | { error: string } {
  if (!currency) return { error: "Choose a currency" };
  const amount = parseAmount(text, currency.decimals);
  if (amount === null || amount <= 0) return { error: `Enter an amount, like ${formatAmount(2550, currency.decimals)}` };
  return { amount };
}

/** "2026-11-01" for a date box; "" for none. */
export function dateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  // Local date parts: toISOString would be UTC, the day before for Swiss midnight.
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const toDate = (text: string) => (text ? new Date(`${text}T00:00:00`) : null);

// ───────────────────────── Terms of work ─────────────────────────

/** The terms as typed, before they are checked. */
export interface TermsDraft {
  description: string;
  amount: string;
  currencyId: string;
  frequency: Frequency;
  paymentMode: "AUTOMATIC" | "ON_REQUEST";
  startDate: string;
  endDate: string;
}

export const emptyTerms: TermsDraft = {
  description: "",
  amount: "",
  currencyId: "",
  frequency: "ONCE",
  paymentMode: "AUTOMATIC",
  startDate: "",
  endDate: "",
};

/** Fill the form from terms already proposed or agreed (to counter-propose or amend). */
export function draftFromTerms(t: {
  description: string | null;
  amount: number;
  currencyId: string;
  currency: { decimals: number };
  frequency: string;
  paymentMode: string;
  startDate: Date | null;
  endDate: Date | null;
}): TermsDraft {
  return {
    description: t.description ?? "",
    amount: formatAmount(t.amount, t.currency.decimals),
    currencyId: t.currencyId,
    frequency: t.frequency as Frequency,
    paymentMode: t.paymentMode as TermsDraft["paymentMode"],
    startDate: dateInput(t.startDate),
    endDate: dateInput(t.endDate),
  };
}

/** Check the typed terms and turn them into what the API takes. */
export function termsFromDraft(d: TermsDraft, currencies: Currency[]): { terms: TermsInput } | { error: string } {
  if (!d.description.trim()) return { error: "Describe the work" };
  const amount = readAmount(d.amount, currencies.find((c) => c.id === d.currencyId));
  if ("error" in amount) return amount;
  const order = dateOrderError(d.startDate, d.endDate);
  if (order) return { error: order };
  return {
    terms: {
      description: d.description.trim(),
      amount: amount.amount,
      currencyId: d.currencyId,
      frequency: d.frequency,
      paymentMode: d.paymentMode,
      startDate: toDate(d.startDate),
      endDate: toDate(d.endDate),
    },
  };
}

export function TermsFields({ draft, onChange }: { draft: TermsDraft; onChange: (d: TermsDraft) => void }) {
  const set = (changes: Partial<TermsDraft>) => onChange({ ...draft, ...changes });
  const setCurrencyId = (currencyId: string) => set({ currencyId });
  const { list } = useCurrencies(draft.currencyId, setCurrencyId);

  return (
    <>
      <Field label="Work">
        <TextArea placeholder="What will be done" value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <AmountField
        label="Price"
        amount={draft.amount}
        onAmount={(amount) => set({ amount })}
        currencyId={draft.currencyId}
        onCurrency={setCurrencyId}
        currencies={list}
      />
      <Field label="Frequency">
        <Toggle
          label="Frequency"
          value={draft.frequency}
          onChange={(frequency) => set({ frequency })}
          options={[
            { value: "ONCE", label: "One-time" },
            { value: "WEEKLY", label: "Weekly" },
            { value: "MONTHLY", label: "Monthly" },
          ]}
        />
      </Field>
      <Field label="Payment">
        <Toggle
          label="Payment"
          value={draft.paymentMode}
          onChange={(paymentMode) => set({ paymentMode })}
          options={[
            { value: "AUTOMATIC", label: "Automatic" },
            { value: "ON_REQUEST", label: "When requested" },
          ]}
        />
      </Field>
      <div className="grid gap-2 min-[400px]:grid-cols-2">
        <Field label="Start">
          <DateField clearable value={draft.startDate} onChange={(startDate) => set({ startDate })} />
        </Field>
        <Field label="End" hint="Empty: ongoing or when delivered">
          <DateField
            clearable
            value={draft.endDate}
            onChange={(endDate) => set({ endDate })}
            min={draft.startDate || undefined}
            placeholder="Ongoing"
            error={dateOrderError(draft.startDate, draft.endDate)}
          />
        </Field>
      </div>
    </>
  );
}
