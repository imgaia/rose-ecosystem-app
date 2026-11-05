"use client";

// src/app/_components/interact/propose-trade.tsx
// Trades (PRD S28, UC-FIN-10):
// - ProposeTrade: offer some of a currency the acting node holds for some of
//   another currency, to another node. Opened from the Wallet, the + menu, a
//   currency's detail (that currency filled in) and a node's page (that node).
// - TradeTermsEditor: the same two amounts, to counter-propose or change an
//   offer still waiting (used by CounterPropose and AmendTerms).
// Nothing moves until the other side accepts. Then both sides move together,
// and the trade's rate is published as the pair's rate (R-FIN-16).

import { useState } from "react";

import { formatAmount } from "~/lib/money";
import { api } from "~/trpc/react";
import { formatDate, money } from "../describe";
import { useActingNode, type Permission } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, ErrorText, Field, GatedButton, Input, MainAction, Row, Select, SubScreen } from "../ui";
import { rateLine } from "../wallet/currencies";
import { NodePicker, readAmount, type Currency } from "./fields";

const sym = (c: { code: string | null; name: string }) => c.code ?? c.name;

/** Where a published rate came from (R-FIN-05), in a few words. */
export const RATE_SOURCE: Record<string, string> = {
  TRADE: "from a trade",
  RESERVE_RATIO: "from the reserve ratio",
  INITIAL: "starting rate",
  FEED: "daily feed",
  MANUAL: "set by hand",
  CHAIN: "worked out through other rates",
};

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

/**
 * A trade's rate as text: how many units of `get` one unit of `give` costs.
 * An exact decimal ("0.4") when there is one, else a fraction ("1/3") that
 * rateLine shows as "≈ 0.33". Worked out in whole numbers, never floats.
 */
export function tradeRate(giveAmount: bigint, give: { decimals: number }, getAmount: bigint, get: { decimals: number }) {
  let num = getAmount * 10n ** BigInt(give.decimals);
  let den = giveAmount * 10n ** BigInt(get.decimals);
  const g = gcd(num, den);
  [num, den] = [num / g, den / g];
  let rest = den;
  let places = 0;
  while (rest % 2n === 0n || rest % 5n === 0n) {
    rest = rest % 2n === 0n ? rest / 2n : rest / 5n;
    places += 1;
  }
  if (rest !== 1n) return `${num}/${den}`;
  const digits = ((num * 10n ** BigInt(places)) / den).toString().padStart(places + 1, "0");
  const fraction = digits.slice(digits.length - places).replace(/0+$/, "");
  return `${digits.slice(0, digits.length - places)}${fraction ? `.${fraction}` : ""}`;
}

/** "1 TEO = 0.40 RCC" for typed amounts, or null until both read as amounts. */
function rateOfTyped(give: { text: string; currency?: Currency }, get: { text: string; currency?: Currency }) {
  if (!give.currency || !get.currency) return null;
  const a = readAmount(give.text, give.currency);
  const b = readAmount(get.text, get.currency);
  if ("error" in a || "error" in b) return null;
  return rateLine(sym(give.currency), tradeRate(a.amount, give.currency, b.amount, get.currency), get.currency);
}

/** "Last published rate: 1 TEO = 0.40 RCC · from a trade, 5 Nov 2026", or that there is none yet. */
function PublishedRate({ give, get }: { give: Currency | undefined; get: Currency | undefined }) {
  const { acting } = useActingNode();
  const published = api.currencies.pairRate.useQuery(
    { actingNodeId: acting.node.id, fromCurrencyId: give?.id ?? "", toCurrencyId: get?.id ?? "" },
    { enabled: !!give && !!get && give.id !== get.id },
  );
  if (!give || !get || !published.isSuccess) return null;
  const p = published.data;
  return (
    <Row label="Last published rate">
      {p ? (
        <span className="flex flex-col items-end">
          <span>{rateLine(sym(give), p.rate, get)}</span>
          <span className="text-xs text-rose-muted">
            {RATE_SOURCE[p.source] ?? p.source}
            {p.validFrom ? `, ${formatDate(p.validFrom)}` : ""}
          </span>
        </span>
      ) : (
        <span className="text-rose-muted">None yet for this pair</span>
      )}
    </Row>
  );
}

/** An amount box with a currency menu (or a fixed currency) beside it. */
function TradeAmount({
  label,
  text,
  onText,
  currencyId,
  onCurrency,
  options,
}: {
  label: string;
  text: string;
  onText: (text: string) => void;
  currencyId: string;
  onCurrency?: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-[1fr_8.5rem] gap-2">
      <Field label={label}>
        <Input inputMode="decimal" placeholder="0.00" value={text} onChange={(e) => onText(e.target.value)} />
      </Field>
      <Field label="Currency">
        {onCurrency ? (
          <Select aria-label={`Currency ${label.toLowerCase()}`} value={currencyId} onChange={(e) => onCurrency(e.target.value)}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input aria-label={`Currency ${label.toLowerCase()}`} readOnly value={options.find((o) => o.id === currencyId)?.label ?? ""} />
        )}
      </Field>
    </div>
  );
}

// ───────────────────────── S28 Propose a trade ─────────────────────────

export function ProposeTrade({ otherNodeId, currencyId }: { otherNodeId?: string; currencyId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const { back, notify } = useNav();
  const actingNodeId = acting.node.id;
  const seesBalances = !!permissionFor("VIEW_BALANCES")?.allowed;
  const accounts = api.wallet.accounts.useQuery({ actingNodeId }, { enabled: seesBalances });
  const currencies = api.wallet.currencies.useQuery({ actingNodeId });
  const all = (currencies.data ?? []).filter((c) => c.status === "ACTIVE" || c.id === currencyId);

  // You give: what the acting node holds (its spending accounts with something in them).
  const held = (accounts.data?.accounts ?? []).filter((a) => !a.isReserve && a.balance > 0n);
  const giveOptions = held.map((a) => ({ id: a.currencyId, label: sym(a.currency), balance: a.balance, currency: a.currency }));
  // A currency opened from its detail: given if held, else asked for, from its issuer when that is someone else.
  const preset = all.find((c) => c.id === currencyId);
  const presetHeld = !!preset && giveOptions.some((o) => o.id === preset.id);

  // Until the person picks, these follow the preset (the lists load after the first render).
  const [picked, setOther] = useState<string | null | undefined>(otherNodeId);
  const other = picked !== undefined ? picked : preset && !presetHeld && preset.issuerNodeId !== actingNodeId ? preset.issuerNodeId : null;
  const [giveId, setGiveId] = useState("");
  const [getId, setGetId] = useState("");
  const [giveText, setGiveText] = useState("");
  const [getText, setGetText] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const give = giveOptions.find((o) => o.id === (giveId || (presetHeld ? preset.id : ""))) ?? giveOptions[0];
  // You get: any other active currency; never fiat for fiat (R-FIN-14).
  const getOptions = all.filter((c) => c.id !== give?.id && !(c.kind === "FIAT" && give?.currency.kind === "FIAT"));
  const get =
    getOptions.find((c) => c.id === (getId || (presetHeld ? "" : (preset?.id ?? "")))) ?? getOptions.find((c) => c.kind === "COMMUNITY") ?? getOptions[0];
  const rate = rateOfTyped({ text: giveText, currency: give?.currency }, { text: getText, currency: get });

  const utils = api.useUtils();
  const propose = api.interactions.proposeTrade.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      notify("Trade proposed. Nothing moves until they accept.");
      back();
    },
  });

  function submit() {
    setFormError(null);
    if (!other) return setFormError("Choose who to trade with");
    if (!give) return setFormError(`${acting.node.name} holds nothing to give yet`);
    const a = readAmount(giveText, give.currency);
    if ("error" in a) return setFormError(`You give: ${a.error}`);
    if (a.amount > give.balance) return setFormError(`You hold ${money(give.balance, give.currency)}, less than that`);
    const b = readAmount(getText, get);
    if ("error" in b) return setFormError(`You get: ${b.error}`);
    propose.mutate({
      actingNodeId,
      toNodeId: other,
      give: { amount: a.amount, currencyId: give.id },
      get: { amount: b.amount, currencyId: get!.id },
      comment: comment.trim() || undefined,
    });
  }

  return (
    <SubScreen form title="Propose a trade">
      <NodePicker label="With" nodeId={other} onChange={setOther} />
      {seesBalances && accounts.data && giveOptions.length === 0 && (
        <p className="text-sm text-rose-muted">{acting.node.name} holds nothing to give yet. Mint or add funds first.</p>
      )}
      <TradeAmount
        label="You give"
        text={giveText}
        onText={setGiveText}
        currencyId={give?.id ?? ""}
        onCurrency={setGiveId}
        options={giveOptions.map((o) => ({ id: o.id, label: o.label }))}
      />
      {give && <p className="-mt-1 text-xs text-rose-muted">{money(give.balance, give.currency)} held</p>}
      <TradeAmount
        label="You get"
        text={getText}
        onText={setGetText}
        currencyId={get?.id ?? ""}
        onCurrency={setGetId}
        options={getOptions.map((c) => ({ id: c.id, label: sym(c) }))}
      />
      <Card className="gap-0 py-1">
        <Row label="This trade's rate" strong>
          {rate ?? <span className="font-normal text-rose-muted">Enter both amounts</span>}
        </Row>
        <PublishedRate give={give?.currency} get={get} />
      </Card>
      <Field label="Comment (optional)">
        <Input placeholder="What it is for" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <p className="text-xs text-rose-muted">
        Nothing moves until the other side accepts. Then both amounts move at once, and this rate becomes the pair&apos;s published rate (R-FIN-16).
      </p>
      <ErrorText error={formError ? { message: formError } : (propose.error ?? accounts.error ?? currencies.error)} />
      <MainAction>
        <GatedButton variant="primary" permission={permissionFor("PAY")} disabled={propose.isPending} onClick={submit}>
          Propose trade
        </GatedButton>
      </MainAction>
    </SubScreen>
  );
}

// ───────────────────────── Counter-propose or change an offer ─────────────────────────

type TradeTerms = {
  amount: bigint;
  currency: Currency;
  counterAmount: bigint | null;
  counterCurrency: Currency | null;
};

/**
 * A trade's terms seen from the acting node: what it gives and what it gets.
 * The terms are written from the proposer's side (the payer gives `amount`).
 */
export function tradeSides(terms: TradeTerms, actingNodePays: boolean) {
  const payerGives = { amount: terms.amount, currency: terms.currency };
  const payeeGives = { amount: terms.counterAmount ?? 0n, currency: terms.counterCurrency! };
  return actingNodePays ? { give: payerGives, get: payeeGives } : { give: payeeGives, get: payerGives };
}

/** The two amounts of a waiting trade, to change; the currencies stay. Sends the changes as the API's terms. */
export function TradeTermsEditor({
  terms,
  actingNodePays,
  intro,
  submitLabel,
  permission,
  pending,
  error,
  onSubmit,
}: {
  terms: TradeTerms;
  actingNodePays: boolean;
  intro: string;
  submitLabel: string;
  permission: Permission | null | undefined;
  pending: boolean;
  error: { message: string } | null;
  onSubmit: (changes: { amount: bigint; counterAmount: bigint }, comment?: string) => void;
}) {
  const sides = tradeSides(terms, actingNodePays);
  const [giveText, setGiveText] = useState(formatAmount(sides.give.amount, sides.give.currency.decimals));
  const [getText, setGetText] = useState(formatAmount(sides.get.amount, sides.get.currency.decimals));
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const was = rateLine(sym(sides.give.currency), tradeRate(sides.give.amount, sides.give.currency, sides.get.amount, sides.get.currency), sides.get.currency);
  const now = rateOfTyped({ text: giveText, currency: sides.give.currency }, { text: getText, currency: sides.get.currency });

  function submit() {
    setFormError(null);
    const a = readAmount(giveText, sides.give.currency);
    if ("error" in a) return setFormError(`You give: ${a.error}`);
    const b = readAmount(getText, sides.get.currency);
    if ("error" in b) return setFormError(`You get: ${b.error}`);
    if (a.amount === sides.give.amount && b.amount === sides.get.amount) return setFormError("Nothing has changed");
    // Back to the proposer's side: the payer gives `amount`, the payee `counterAmount`.
    const changes = actingNodePays ? { amount: a.amount, counterAmount: b.amount } : { amount: b.amount, counterAmount: a.amount };
    onSubmit(changes, comment.trim() || undefined);
  }

  const option = (c: Currency) => [{ id: c.id, label: sym(c) }];
  return (
    <>
      <p className="text-rose-muted">{intro}</p>
      <TradeAmount label="You give" text={giveText} onText={setGiveText} currencyId={sides.give.currency.id} options={option(sides.give.currency)} />
      <TradeAmount label="You get" text={getText} onText={setGetText} currencyId={sides.get.currency.id} options={option(sides.get.currency)} />
      <Card className="gap-0 py-1">
        <Row label="Rate now" strong>
          {now ?? <span className="font-normal text-rose-muted">Enter both amounts</span>}
        </Row>
        <Row label="Was">{was}</Row>
        <PublishedRate give={sides.give.currency} get={sides.get.currency} />
      </Card>
      <Field label="Comment (optional)">
        <Input placeholder="Why the change" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <ErrorText error={formError ? { message: formError } : error} />
      <MainAction>
        <GatedButton variant="primary" permission={permission} disabled={pending} onClick={submit}>
          {submitLabel}
        </GatedButton>
      </MainAction>
    </>
  );
}
