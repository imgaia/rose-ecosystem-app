"use client";

// src/app/_components/wallet/currencies.tsx
// Node currencies (PRD 2.8), opened from the Wallet tab:
// - CurrenciesScreen (S15): the home currency and primary fiat, each with
//   Change; the currencies the node issues and holds; Create a currency.
// - CurrencyDetail (S27): what a currency is, its price and history, policy
//   and status; the issuer's Treasurers also see what backs it. Edit, Retire
//   and (only if never held) Delete; Set as home currency.
// - CurrencyForm: create or edit one. For a collection it goes out as a
//   proposal that needs a Treasurer and an Owner, two people (R-FIN-11).
//   "Make this my home currency" (R-FIN-04) sets it at once on Edit; on
//   Create it applies with the currency, so for a collection on approval.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate, money } from "../describe";
import { needsText, useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Button, Card, Chip, Empty, ErrorText, Field, GatedButton, Input, Loading, Refusal, Row, SectionLabel, Select, SubScreen, TextArea, Toggle } from "../ui";

type Listed = RouterOutputs["currencies"]["overview"]["issued"][number];
type Policy = "reserve" | "open";

export const POLICY_TEXT: Record<Policy, { label: string; line: string }> = {
  reserve: { label: "Reserve", line: "Converts only as far as the reserve covers it." },
  open: { label: "Open", line: "Beyond the reserve, swaps straight at the price with other open currencies." },
};

const FRACTION = /^(\d+)\/(\d+)$/;

/**
 * For display only: "0.5" shown with at least the display currency's decimals: "0.50".
 * A fraction like "100/107" (an inverted rate) has no exact decimal, so it is
 * rounded to those decimals: "≈ 0.93". Conversions use the exact rate.
 */
export function formatRate(rate: string, decimals = 2) {
  const fraction = FRACTION.exec(rate);
  if (fraction) return `≈ ${(Number(fraction[1]) / Number(fraction[2])).toFixed(decimals)}`;
  const [whole, part = ""] = rate.split(".");
  return part.length >= decimals ? rate : `${whole}.${part.padEnd(decimals, "0")}`;
}

/** "1 RCC = 1.00 CHF", or "1 EUR ≈ 0.92 CHF" for an approximate (inverted) rate. */
export function rateLine(from: string, rate: string, to: { code: string | null; name?: string; decimals: number }) {
  const shown = formatRate(rate, to.decimals);
  const value = shown.startsWith("≈ ") ? shown : `= ${shown}`;
  return `1 ${from} ${value} ${to.code ?? to.name}`;
}

/** "1 RCC = 1.00 CHF", or null for fiat (no price) or a currency with no price yet. */
export function priceLine(c: { code: string | null; name: string; price: Listed["price"] }) {
  if (!c.price) return null;
  return rateLine(c.code ?? c.name, c.price.rate, c.price.fiat);
}

const label = (c: { code: string | null; name: string }) => c.code ?? c.name;

// ───────────────────────── S15 Currencies ─────────────────────────

export function CurrenciesScreen() {
  const { acting, permissionFor } = useActingNode();
  const { open } = useNav();
  const overview = api.currencies.overview.useQuery({ actingNodeId: acting.node.id });
  const setUp = permissionFor("SET_UP_CURRENCY");
  const o = overview.data;

  return (
    <SubScreen title="Currencies">
      <ErrorText error={overview.error} />
      {overview.isLoading && <Loading />}
      {o && (
        <>
          <Card className="gap-0">
            <SectionLabel className="mb-1">Home and primary fiat</SectionLabel>
            <ChangeRow
              label="Home currency"
              current={o.home ? `${label(o.home)} · ${o.home.name}` : "Not set"}
              currentId={o.home?.id}
              choices={o.homeChoices}
              hint="Forms pre-select it and the wallet total is shown in it."
              mutation="home"
            />
            <ChangeRow
              label="Primary fiat"
              current={o.primaryFiat ? `${label(o.primaryFiat)} · ${o.primaryFiat.name}` : "Not set: add a country on Edit identity"}
              currentId={o.primaryFiat?.id}
              choices={o.fiatList.map((f) => ({ id: f.id, label: `${label(f)} · ${f.name}` }))}
              hint="For deposits and withdrawals; new currencies keep their reserve in it."
              mutation="fiat"
            />
          </Card>

          <SectionLabel className="mt-1">Issued by {o.node.name}</SectionLabel>
          {o.issued.length === 0 && <Empty>{o.node.name} has no currency of its own yet.</Empty>}
          {o.issued.length > 0 && (
            <Card className="gap-0 py-1">
              {o.issued.map((c, i) => (
                <CurrencyRow key={c.id} currency={c} first={i === 0} onOpen={() => open({ name: "currency", currencyId: c.id })} />
              ))}
            </Card>
          )}
          <GatedButton permission={setUp} onClick={() => open({ name: "currency-form" })}>
            Create a currency
          </GatedButton>

          <SectionLabel className="mt-1">Held by {o.node.name}</SectionLabel>
          {o.held === null && <p className="text-sm text-rose-muted">Balances need {permissionFor("VIEW_BALANCES")?.needsLabels.join(" or ") ?? "a Treasurer"}.</p>}
          {o.held?.length === 0 && <Empty>Nothing held from other issuers yet.</Empty>}
          {o.held && o.held.length > 0 && (
            <Card className="gap-0 py-1">
              {o.held.map((c, i) => (
                <CurrencyRow
                  key={c.account.id}
                  currency={c}
                  first={i === 0}
                  extra={money(c.account.balance, c)}
                  sub={c.issuer ? `Issued by ${c.issuer.name}` : "Fiat"}
                  onOpen={() => open({ name: "currency", currencyId: c.id })}
                />
              ))}
            </Card>
          )}
        </>
      )}
    </SubScreen>
  );
}

function CurrencyRow({
  currency: c,
  first,
  extra,
  sub,
  onOpen,
}: {
  currency: Listed;
  first: boolean;
  extra?: string;
  sub?: string;
  onOpen: () => void;
}) {
  const details = [sub, priceLine(c), c.policy ? POLICY_TEXT[c.policy].label : null].filter(Boolean).join(" · ");
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex items-center justify-between gap-3 py-2 text-left hover:bg-white/5 ${first ? "" : "border-t border-rose-border"}`}
    >
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold">
          {c.name} <span className="font-normal text-rose-muted">· {label(c)}</span>
        </span>
        <span className="text-xs text-rose-muted">{details}</span>
      </span>
      <span className="flex items-center gap-2 whitespace-nowrap">
        {extra && <span className="font-semibold">{extra}</span>}
        {c.status === "RETIRED" && <Chip>Retired</Chip>}
      </span>
    </button>
  );
}

/** One "Home currency: RCC [Change]" row that opens into a picker and Save. */
function ChangeRow({
  label: rowLabel,
  current,
  currentId,
  choices,
  hint,
  mutation,
}: {
  label: string;
  current: string;
  currentId: string | undefined;
  choices: { id: string; label: string }[];
  hint: string;
  mutation: "home" | "fiat";
}) {
  const { acting, permissionFor } = useActingNode();
  const { notify } = useNav();
  const [editing, setEditing] = useState(false);
  const [choice, setChoice] = useState(currentId ?? choices[0]?.id ?? "");
  const utils = api.useUtils();
  const onSuccess = async () => {
    await utils.invalidate();
    setEditing(false);
    notify(`${rowLabel} changed.`);
  };
  const setHome = api.currencies.setHome.useMutation({ onSuccess });
  const setFiat = api.currencies.setPrimaryFiat.useMutation({ onSuccess });
  const save = mutation === "home" ? setHome : setFiat;

  return (
    <div className="flex flex-col gap-2 border-t border-rose-border py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-rose-muted">{rowLabel}</span>
          <span className="font-semibold">{current}</span>
        </span>
        {!editing && (
          <GatedButton className="min-h-10" permission={permissionFor("SET_UP_CURRENCY")} onClick={() => setEditing(true)}>
            Change
          </GatedButton>
        )}
      </div>
      {editing && (
        <>
          <Select aria-label={rowLabel} value={choice} onChange={(e) => setChoice(e.target.value)}>
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          <span className="text-xs text-rose-muted">{hint}</span>
          <Refusal error={save.error} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={save.isPending || !choice || choice === currentId}
              onClick={() => save.mutate({ actingNodeId: acting.node.id, currencyId: choice })}
            >
              Save
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ───────────────────────── S27 Currency detail ─────────────────────────

const SOURCE: Record<string, string> = { FEED: "Daily feed", RESERVE_RATIO: "From the reserve ratio", MANUAL: "Set by hand" };

export function CurrencyDetail({ currencyId }: { currencyId: string }) {
  const { acting } = useActingNode();
  const detail = api.currencies.detail.useQuery({ actingNodeId: acting.node.id, currencyId });
  const c = detail.data;
  return (
    <SubScreen title={c ? `${c.name} · ${label(c)}` : "Currency"}>
      <ErrorText error={detail.error} />
      {detail.isLoading && <Loading />}
      {c && <DetailBody c={c} />}
    </SubScreen>
  );
}

function DetailBody({ c }: { c: RouterOutputs["currencies"]["detail"] }) {
  const { acting, permissionFor } = useActingNode();
  const { open, back, notify } = useNav();
  const [confirm, setConfirm] = useState<"RETIRE" | "DELETE" | null>(null);
  const utils = api.useUtils();
  const propose = api.currencies.propose.useMutation({
    onSuccess: async (result, input) => {
      await utils.invalidate();
      setConfirm(null);
      if (result.status === "OPEN") return notify("Proposed. It applies once a Treasurer and an Owner approve.");
      notify(input.action === "DELETE" ? "Deleted." : "Retired.");
      if (input.action === "DELETE") back();
    },
  });
  const setHome = api.currencies.setHome.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      notify(`${label(c)} is now the home currency.`);
    },
  });
  const setUp = permissionFor("SET_UP_CURRENCY");
  const isCollection = acting.node.kind === "COLLECTION";
  const fiat = c.kind === "FIAT";
  const b = c.backing;

  return (
    <>
      <Card className="gap-0">
        <div className="mb-1 flex items-center justify-between gap-2">
          <SectionLabel>{fiat ? "Fiat currency" : "Node currency"}</SectionLabel>
          <Chip solid={c.status === "ACTIVE"}>{c.status === "ACTIVE" ? "Active" : "Retired"}</Chip>
        </div>
        {c.description && <p className="pb-2 text-rose-muted">{c.description}</p>}
        <Row label="Symbol">{label(c)}</Row>
        {c.issuer ? (
          <Row label="Issuer">
            <button type="button" className="underline-offset-2 hover:underline" onClick={() => open({ name: "node", nodeId: c.issuer!.id })}>
              {c.issuer.name}
            </button>
          </Row>
        ) : (
          <Row label="Issuer">No one: real money in a bank account</Row>
        )}
        {!fiat && (
          <Row label="Price" strong>
            {priceLine(c) ?? "No price yet"}
          </Row>
        )}
        {c.policy && (
          <Row label="Conversion policy">
            <span className="flex flex-col items-end">
              <span>{POLICY_TEXT[c.policy].label}</span>
              <span className="text-xs text-rose-muted">{POLICY_TEXT[c.policy].line}</span>
            </span>
          </Row>
        )}
        <Row label="Decimal places">{c.decimals}</Row>
        {fiat && c.fiatRates.map((r) => <Row key={r.code} label={`1 ${label(c)} in ${r.code}`}>{r.rate ? formatRate(r.rate, r.decimals) : "No rate yet"}</Row>)}
      </Card>

      {!fiat && (
        <>
          <SectionLabel className="mt-1">Price history</SectionLabel>
          {c.history.length === 0 && <Empty>No price yet.</Empty>}
          {c.history.length > 0 && (
            <Card className="gap-0 py-1">
              {c.history.map((h, i) => (
                <div key={h.id} className={`flex items-center justify-between gap-3 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
                  <span className="flex flex-col">
                    <span>
                      {formatRate(h.rate, c.price?.fiat.decimals ?? 2)} {c.price?.fiat.code}
                    </span>
                    <span className="text-xs text-rose-muted">{SOURCE[h.source] ?? h.source}</span>
                  </span>
                  <span className="text-right text-xs text-rose-muted">
                    {formatDate(h.validFrom)} – {h.validTo ? formatDate(h.validTo) : "now"}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {b && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">What backs it · for the issuer&apos;s Treasurers</SectionLabel>
          <Row label="Reserve">{money(b.reserve, b.fiat)}</Row>
          <Row label="Units in circulation">{money(b.units, b.currency)}</Row>
          <Row label="Their value at the price">{money(b.value, b.fiat)}</Row>
          <Row label="Share backed" strong>
            {b.shareBacked === null ? "No units yet" : `${Math.floor(b.shareBacked * 1000) / 10}%`}
          </Row>
        </Card>
      )}

      {c.isHome && (
        <p className="mt-1 text-center">
          <Chip solid>Home currency</Chip>
        </p>
      )}
      {!c.isHome && c.canBeHome && (
        <>
          <GatedButton permission={setUp} disabled={setHome.isPending} onClick={() => setHome.mutate({ actingNodeId: acting.node.id, currencyId: c.id })}>
            Set as home currency
          </GatedButton>
          <Refusal error={setHome.error} />
        </>
      )}

      {c.openProposalId && (
        <Card>
          <p className="text-rose-muted">A change to {label(c)} is waiting for approval.</p>
          <Button onClick={() => open({ name: "proposal", proposalId: c.openProposalId! })}>Review it</Button>
        </Card>
      )}

      {c.actingIsIssuer && (
        <div className="mt-2 flex flex-col gap-2">
          {isCollection && <p className="text-xs text-rose-muted">Needs a Treasurer and an Owner (two people): changes go out as a proposal.</p>}
          <GatedButton permission={setUp} disabled={!!c.openProposalId} onClick={() => open({ name: "currency-form", currencyId: c.id })}>
            Edit
          </GatedButton>
          {confirm ? (
            <Card>
              <p>
                {confirm === "RETIRE"
                  ? `Retire ${label(c)}? No new units can be minted or bought; balances stay usable and convertible.`
                  : `Delete ${label(c)}? Nobody has held it, so it is removed for good.`}
              </p>
              <Refusal error={propose.error} />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={propose.isPending}
                  onClick={() => propose.mutate({ actingNodeId: acting.node.id, action: confirm, currencyId: c.id })}
                >
                  {isCollection ? "Propose" : confirm === "RETIRE" ? "Retire" : "Delete"}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {c.status === "ACTIVE" && (
                <GatedButton permission={setUp} disabled={!!c.openProposalId} onClick={() => setConfirm("RETIRE")}>
                  Retire
                </GatedButton>
              )}
              {!c.everHeld && (
                <GatedButton permission={setUp} disabled={!!c.openProposalId} onClick={() => setConfirm("DELETE")}>
                  Delete
                </GatedButton>
              )}
            </div>
          )}
          {c.everHeld && <p className="text-xs text-rose-muted">Someone has held {label(c)}, so it can be retired but not deleted (R-FIN-12).</p>}
        </div>
      )}

      {!c.actingIsIssuer && c.status === "ACTIVE" && (
        <GatedButton className="mt-2" permission={permissionFor("EXCHANGE")} onClick={() => open({ name: "convert", toCurrencyId: c.id })}>
          Convert into {label(c)}
        </GatedButton>
      )}
    </>
  );
}

// ───────────────────────── Create / Edit a currency ─────────────────────────

export function CurrencyForm({ currencyId }: { currencyId?: string }) {
  const { acting } = useActingNode();
  const overview = api.currencies.overview.useQuery({ actingNodeId: acting.node.id });
  const detail = api.currencies.detail.useQuery({ actingNodeId: acting.node.id, currencyId: currencyId ?? "" }, { enabled: !!currencyId });
  const ready = overview.data && (!currencyId || detail.data);
  return (
    <SubScreen title={currencyId ? "Edit currency" : "Create a currency"}>
      <ErrorText error={overview.error ?? detail.error} />
      {!ready && <Loading />}
      {ready && <FormBody overview={overview.data} current={currencyId ? detail.data : undefined} />}
    </SubScreen>
  );
}

function FormBody({
  overview,
  current,
}: {
  overview: RouterOutputs["currencies"]["overview"];
  current?: RouterOutputs["currencies"]["detail"];
}) {
  const { acting, permissionFor } = useActingNode();
  const { back, notify } = useNav();
  const isCollection = acting.node.kind === "COLLECTION";
  const initial = {
    name: current?.name ?? "",
    code: current?.code ?? "",
    description: current?.description ?? "",
    decimals: String(current?.decimals ?? 2),
    reserveRatio: current?.reserveRatio ?? "1",
    policy: current?.policy ?? "reserve",
  };
  const [form, setForm] = useState(initial);
  // Read live, not copied into state, so it follows a home currency changed elsewhere.
  const isHome = !!current?.isHome;
  const [makeHome, setMakeHome] = useState(false);
  const set = (changes: Partial<typeof form>) => setForm({ ...form, ...changes });
  const [formError, setFormError] = useState<string | null>(null);

  const utils = api.useUtils();
  const propose = api.currencies.propose.useMutation();
  const setHome = api.currencies.setHome.useMutation();
  const pending = propose.isPending || setHome.isPending;

  // The reserve fiat: the currency's own, or the node's primary fiat for a new one.
  const fiat = current?.price?.fiat ?? (overview.primaryFiat && { code: overview.primaryFiat.code, decimals: overview.primaryFiat.decimals });
  const ratioOk = /^\d+(\.\d+)?$/.test(form.reserveRatio.trim()) && Number(form.reserveRatio) > 0;
  const symbol = form.code.trim() || "unit";

  async function submit() {
    setFormError(null);
    if (!form.name.trim()) return setFormError("Give the currency a name");
    if (!form.code.trim()) return setFormError("Give the currency a symbol, like HVS");
    if (!ratioOk) return setFormError("The reserve ratio is a number above 0, like 1 or 0.5");
    const decimals = Number(form.decimals);
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) return setFormError("Decimal places: a whole number from 0 to 6");
    const fields = { ...form, decimals, reserveRatio: form.reserveRatio.trim(), description: form.description || null };
    const proposed = "Proposed. It applies once a Treasurer and an Owner approve.";
    const done = async (message: string) => {
      await utils.invalidate();
      notify(message);
      back();
    };

    // Errors show from the mutations' own state (Refusal below), so a failed save just stops here.
    try {
      if (!current) {
        // The home currency choice travels with the proposal and applies when the currency is created.
        const result = await propose.mutateAsync({ actingNodeId: acting.node.id, action: "CREATE", fields, makeHome });
        if (result.status === "OPEN") return await done(makeHome ? `${proposed} It becomes the home currency then.` : proposed);
        return await done(makeHome ? "Currency created. It is now the home currency." : "Currency created.");
      }

      // Edit: send only what changed. The home currency is separate and set at once.
      const changed = Object.fromEntries(
        (Object.keys(fields) as (keyof typeof fields)[])
          .filter((k) => String(fields[k] ?? "") !== String(initial[k] ?? ""))
          .map((k) => [k, fields[k]]),
      );
      const homeNow = makeHome && !isHome;
      if (Object.keys(changed).length === 0 && !homeNow) return setFormError("Nothing has changed");
      const result =
        Object.keys(changed).length > 0 ? await propose.mutateAsync({ actingNodeId: acting.node.id, action: "EDIT", currencyId: current.id, fields: changed }) : null;
      if (homeNow) await setHome.mutateAsync({ actingNodeId: acting.node.id, currencyId: current.id });
      const saved = result?.status === "OPEN" ? proposed : result ? "Saved." : "";
      await done([saved, homeNow ? `${current.code ?? current.name} is now the home currency.` : ""].filter(Boolean).join(" "));
    } catch {
      return;
    }
  }

  return (
    <>
      <Field label="Name">
        <Input placeholder="Harvest shares" value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Symbol" hint="Short, shown with amounts">
          <Input placeholder="HVS" maxLength={8} value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Decimal places" hint={current?.everHeld ? "Fixed once units exist (R-FIN-12)" : "2 for cents"}>
          <Input inputMode="numeric" disabled={current?.everHeld} value={form.decimals} onChange={(e) => set({ decimals: e.target.value })} />
        </Field>
      </div>
      <Field label="Description">
        <TextArea rows={2} placeholder="What it is for" value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      <Field label="Reserve ratio" hint="One unit costs the ratio in the reserve fiat: its price (R-FIN-01)">
        <Input inputMode="decimal" value={form.reserveRatio} onChange={(e) => set({ reserveRatio: e.target.value })} />
      </Field>
      <Card className="gap-0 py-1">
        <Row label="Price" strong>
          {ratioOk && fiat ? rateLine(symbol, form.reserveRatio.trim(), fiat) : "Enter a ratio above 0"}
        </Row>
        <Row label="Reserve held in">{fiat?.code ?? "Primary fiat not set"}</Row>
      </Card>
      <Field label="Conversion policy">
        <Toggle
          label="Conversion policy"
          options={[
            { value: "reserve", label: POLICY_TEXT.reserve.label },
            { value: "open", label: POLICY_TEXT.open.label },
          ]}
          value={form.policy}
          onChange={(policy) => set({ policy })}
        />
      </Field>
      <ul className="-mt-1 flex flex-col gap-1 text-xs text-rose-muted">
        {(["reserve", "open"] as const).map((p) => (
          <li key={p} className={form.policy === p ? "text-rose-text" : ""}>
            <span className="font-semibold">{POLICY_TEXT[p].label}:</span> {POLICY_TEXT[p].line}
          </li>
        ))}
      </ul>

      {isCollection && (
        <Card>
          <SectionLabel>Needs a Treasurer and an Owner (two people)</SectionLabel>
          <p className="text-sm text-rose-muted">
            This goes out as a proposal from {acting.node.name}. It applies once a Treasurer and an Owner, two different people, have approved.
          </p>
        </Card>
      )}

      <HomeCheckbox
        checked={isHome || makeHome}
        onChange={setMakeHome}
        owner={isCollection ? `${acting.node.name}'s` : "my"}
        disabledReason={
          isHome ? "It is the home currency now; pick another on the Currencies screen." : current && !current.canBeHome ? "A retired currency can't be the home currency." : null
        }
        hint={isCollection && !current ? "Applies once the currency is approved." : null}
      />

      <ErrorText error={formError ? { message: formError } : null} />
      <Refusal error={propose.error ?? setHome.error} />
      <GatedButton variant="primary" className="mt-2" permission={permissionFor("SET_UP_CURRENCY")} disabled={pending} onClick={() => void submit()}>
        {isCollection ? (current ? "Propose changes" : "Propose currency") : current ? "Save changes" : "Create currency"}
      </GatedButton>
    </>
  );
}

/** "Make this my home currency" (R-FIN-04). Needs the Treasurer capability like the rest of the form. */
function HomeCheckbox({
  checked,
  onChange,
  owner,
  disabledReason,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  owner: string;
  disabledReason: string | null;
  hint: string | null;
}) {
  const { permissionFor } = useActingNode();
  const permission = permissionFor("SET_UP_CURRENCY");
  const refused = !permission?.allowed;
  const note = refused ? (permission ? needsText(permission) : null) : (disabledReason ?? hint);
  return (
    <label className={`mt-1 flex items-start gap-3 ${refused || disabledReason ? "cursor-not-allowed text-rose-muted" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-0.5 size-5 flex-none accent-rose-accent"
        checked={checked}
        disabled={refused || !!disabledReason}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">Make this {owner} home currency</span>
        {note && <span className="text-xs text-rose-muted">{note}</span>}
      </span>
    </label>
  );
}
