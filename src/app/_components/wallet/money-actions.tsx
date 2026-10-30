"use client";

// src/app/_components/wallet/money-actions.tsx
// The Treasurer's money screens, opened from the Wallet tab:
// - AddFunds: record fiat paid into the bank outside the app (S12, UC-FIN-04);
// - Convert: any currency into any other, through the issuers' reserves
//   (S11, UC-FIN-03; the rules are in src/server/core/currencies.ts);
// - Mint: lock fiat in a currency's reserve and create its units (S13, UC-FIN-05).
// Convert and Mint show a quote from the server before anything moves; when
// the rules refuse, the message names the rule.

import { useState } from "react";

import { api } from "~/trpc/react";
import { DateField } from "../date-field";
import { money } from "../describe";
import { dateInput, readAmount } from "../interact/fields";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, ErrorText, Field, GatedButton, Input, Refusal, Row, SectionLabel, Select, SubScreen } from "../ui";
import { formatRate, priceLine } from "./currencies";

/** Refresh everything, show a note, and go back to the Wallet. */
function useDone(text: string) {
  const { back, notify } = useNav();
  const utils = api.useUtils();
  return async () => {
    await utils.invalidate();
    notify(text);
    back();
  };
}

/** The acting node's own spending accounts in fiat: what add funds and mint use. */
function useFiatAccounts() {
  const { acting } = useActingNode();
  const accounts = api.wallet.accounts.useQuery({ actingNodeId: acting.node.id });
  return {
    error: accounts.error,
    list: (accounts.data?.accounts ?? []).filter((a) => a.currency.kind === "FIAT" && !a.isReserve),
  };
}

export function AddFunds() {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const fiat = useFiatAccounts();
  const account = fiat.list.find((a) => a.isPrimaryFiat) ?? fiat.list[0];

  const [amount, setAmount] = useState("");
  const [depositedOn, setDepositedOn] = useState(dateInput(new Date()));
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const addFunds = api.wallet.addFunds.useMutation({ onSuccess: useDone("Deposit recorded.") });

  const typed = account ? readAmount(amount, account.currency) : null;
  const currency = account?.currency;

  function submit() {
    setFormError(null);
    if (!currency) return setFormError("This node has no fiat account yet");
    const read = readAmount(amount, currency);
    if ("error" in read) return setFormError(read.error);
    if (!reference.trim()) return setFormError("Enter the bank reference of the deposit");
    if (!depositedOn) return setFormError("Enter the date of the deposit");
    addFunds.mutate({ actingNodeId, amount: read.amount, reference: reference.trim(), depositedOn: new Date(`${depositedOn}T00:00:00`) });
  }

  return (
    <SubScreen title="Add funds">
      <Card>
        <SectionLabel>Deposit first, then record it</SectionLabel>
        <p className="text-rose-muted">Pay the money into the bank account outside the app, then record the deposit here.</p>
      </Card>
      <Field label={`Amount${currency?.code ? ` in ${currency.code}` : ""}`}>
        <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Into">
        <Input readOnly value={account ? `${account.currency.code ?? account.currency.name} · primary fiat` : "Primary fiat account"} />
      </Field>
      <div className="grid gap-2 min-[400px]:grid-cols-2">
        <Field label="Date of deposit">
          <DateField value={depositedOn} onChange={setDepositedOn} />
        </Field>
        <Field label="Bank reference">
          <Input placeholder="From the bank statement" value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
      </div>
      {account && typed && "amount" in typed && (
        <Card className="gap-0 py-1">
          <Row label={`${account.currency.code} balance after`} strong>
            {money(account.balance + typed.amount, account.currency)}
          </Row>
        </Card>
      )}
      <p className="text-xs text-rose-muted">Later, a payment provider will credit the account directly.</p>
      <ErrorText error={formError ? { message: formError } : (addFunds.error ?? fiat.error)} />
      <GatedButton variant="primary" className="mt-2" permission={permissionFor("ADD_FUNDS")} disabled={addFunds.isPending} onClick={submit}>
        Record deposit
      </GatedButton>
    </SubScreen>
  );
}

export function Convert({ fromAccountId: initialFrom, toCurrencyId: initialTo }: { fromAccountId?: string; toCurrencyId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const accounts = api.wallet.accounts.useQuery({ actingNodeId });
  const currencies = api.wallet.currencies.useQuery({ actingNodeId });
  const own = (accounts.data?.accounts ?? []).filter((a) => !a.isReserve);

  const [fromAccountId, setFromAccountId] = useState(initialFrom ?? "");
  const [toCurrencyId, setToCurrencyId] = useState(initialTo ?? "");
  const [amount, setAmount] = useState("");
  const from = own.find((a) => a.id === fromAccountId) ?? own.find((a) => a.balance > 0) ?? own[0];
  // Into: any active currency but the one converted from. Fiat into fiat is refused by the rules (R-FIN-14), and shown so.
  const targets = (currencies.data ?? []).filter((c) => c.id !== from?.currencyId && c.status === "ACTIVE");
  const to = targets.find((c) => c.id === toCurrencyId) ?? targets[0];
  const typed = from ? readAmount(amount, from.currency) : null;
  const units = typed && "amount" in typed ? typed.amount : 0;

  const prices = api.currencies.prices.useQuery(
    { actingNodeId, currencyIds: [from?.currencyId, to?.id].filter((id): id is string => !!id) },
    { enabled: !!from && !!to },
  );
  const priceOf = (id: string | undefined) => prices.data?.find((c) => c.id === id);
  const quote = api.wallet.quoteConvert.useQuery(
    { actingNodeId, fromAccountId: from?.id ?? "", toCurrencyId: to?.id ?? "", amount: units },
    { enabled: !!from && !!to && units > 0, retry: false },
  );
  const convert = api.wallet.convert.useMutation({ onSuccess: useDone("Converted.") });
  const q = quote.data?.quote;

  return (
    <SubScreen title="Convert">
      <Field label="From">
        <Select value={from?.id ?? ""} onChange={(e) => setFromAccountId(e.target.value)}>
          {own.map((a) => (
            <option key={a.id} value={a.id}>
              {a.currency.code ?? a.currency.name} · {money(a.balance, a.currency)} available
            </option>
          ))}
        </Select>
      </Field>
      <Field label={`Amount${from?.currency.code ? ` in ${from.currency.code}` : ""}`}>
        <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Into">
        <Select value={to?.id ?? ""} onChange={(e) => setToCurrencyId(e.target.value)}>
          {targets.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ?? c.name} · {c.name}
            </option>
          ))}
        </Select>
      </Field>

      {from && to && (
        <Card className="gap-0 py-1">
          <Row label={`Price of ${from.currency.code ?? from.currency.name}`}>{priceText(priceOf(from.currencyId))}</Row>
          <Row label={`Price of ${to.code ?? to.name}`}>{priceText(priceOf(to.id))}</Row>
          {q && (
            <>
              <Row label="Rate">
                1 {from.currency.code} = {formatRate(q.rate, to.decimals)} {to.code}
              </Row>
              <Row label="You receive" strong>
                {money(q.receive, q.currency)}
              </Row>
            </>
          )}
        </Card>
      )}
      {q && (
        <p className="text-xs text-rose-muted">
          {q.mode === "RESERVES"
            ? `Through the reserves: ${money(q.value, q.fiat)} moves ${from?.currency.kind === "FIAT" ? "from your account" : `out of ${from?.currency.code}'s reserve`} ${to?.kind === "FIAT" ? "to your account" : `into ${to?.code}'s reserve`}. What you receive is rounded down.`
            : "A straight swap at the price, beyond the reserve: both currencies are open, so no fiat moves (R-FIN-10)."}
        </p>
      )}
      {own.length === 0 && <p className="text-rose-muted">This node has no account to convert from.</p>}
      <Refusal error={convert.error ?? quote.data?.refused ?? quote.error} />
      <ErrorText error={accounts.error ?? currencies.error} />
      <GatedButton
        variant="primary"
        className="mt-2"
        permission={permissionFor("EXCHANGE")}
        disabled={!q || convert.isPending}
        onClick={() => from && to && convert.mutate({ actingNodeId, fromAccountId: from.id, toCurrencyId: to.id, amount: units })}
      >
        {q ? `Convert for ${money(q.receive, q.currency)}` : "Convert"}
      </GatedButton>
    </SubScreen>
  );
}

/** "1 RCC = 1.00 CHF", or "Fiat face value" for real money (it has no price). */
function priceText(c: Parameters<typeof priceLine>[0] & { kind: string } | undefined) {
  if (!c) return "…";
  if (c.kind === "FIAT") return "Fiat face value";
  return priceLine(c) ?? "No price yet";
}

export function Mint() {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const fiat = useFiatAccounts();
  const overview = api.currencies.overview.useQuery({ actingNodeId });
  const mintable = (overview.data?.issued ?? []).filter((c) => c.status === "ACTIVE");
  const [currencyId, setCurrencyId] = useState("");
  const currency = mintable.find((c) => c.id === currencyId) ?? mintable[0];
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  // Minting draws on the currency's reserve fiat only (R-FIN-14).
  const sources = fiat.list.filter((a) => !currency || a.currencyId === currency.reserveCurrencyId);
  const source = sources.find((a) => a.id === sourceAccountId) ?? sources[0];
  const typed = source ? readAmount(amount, source.currency) : null;
  const units = typed && "amount" in typed ? typed.amount : 0;

  const quote = api.wallet.quoteMint.useQuery(
    { actingNodeId, sourceAccountId: source?.id ?? "", amount: units, currencyId: currency?.id },
    { enabled: !!source && !!currency && units > 0, retry: false },
  );
  const mint = api.wallet.mint.useMutation({ onSuccess: useDone("Minted.") });
  const code = quote.data?.currency.code;

  return (
    <SubScreen title={code ? `Mint ${code}` : "Mint"}>
      {mintable.length > 1 && (
        <Field label="Currency">
          <Select value={currency?.id ?? ""} onChange={(e) => setCurrencyId(e.target.value)}>
            {mintable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      {overview.data && mintable.length === 0 && <p className="text-rose-muted">{acting.node.name} issues no active currency. Create one under Currencies.</p>}
      <Field label="Convert from">
        <Select value={source?.id ?? ""} onChange={(e) => setSourceAccountId(e.target.value)}>
          {sources.map((a) => (
            <option key={a.id} value={a.id}>
              {a.currency.code}
              {a.isPrimaryFiat ? " · primary fiat" : ""} · {money(a.balance, a.currency)} available
            </option>
          ))}
        </Select>
      </Field>
      <Field label={`Amount${source?.currency.code ? ` in ${source.currency.code}` : ""}`}>
        <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {quote.data && (
        <>
          <Card className="gap-0 py-1">
            <Row label="Exchange rate">{quote.data.rate}</Row>
            <Row label="Reserve ratio">{quote.data.reserveRatio}</Row>
            <Row label="You will mint" strong>
              {money(quote.data.units, quote.data.currency)}
            </Row>
          </Card>
          <p className="text-xs text-rose-muted">
            {money(units, source?.currency)} moves into the {code} reserve and stays locked there, backing the new units.
          </p>
        </>
      )}
      <Refusal error={mint.error ?? quote.error} />
      <ErrorText error={fiat.error ?? overview.error} />
      <GatedButton
        variant="primary"
        className="mt-2"
        permission={permissionFor("MINT")}
        disabled={!quote.data || mint.isPending}
        onClick={() => source && currency && mint.mutate({ actingNodeId, sourceAccountId: source.id, amount: units, currencyId: currency.id })}
      >
        {quote.data ? `Mint ${money(quote.data.units, quote.data.currency)}` : "Mint"}
      </GatedButton>
    </SubScreen>
  );
}
