"use client";

// src/app/_components/wallet/money-actions.tsx
// The Treasurer's money screens, opened from the Wallet tab:
// - AddFunds: record fiat paid into the bank outside the app (S12, UC-FIN-04);
// - Exchange: buy a community currency another node issues (S11, UC-FIN-03);
// - Mint: lock fiat in the node's reserve and create its own currency (S13, UC-FIN-05).
// Exchange and Mint show a quote from the server before anything moves.

import { useState } from "react";

import { api } from "~/trpc/react";
import { DateField } from "../date-field";
import { money } from "../describe";
import { dateInput, readAmount } from "../interact/fields";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, ErrorText, Field, GatedButton, Input, Row, SectionLabel, Select, SubScreen } from "../ui";

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

/** The acting node's own spending accounts in fiat: what exchange and mint draw from. */
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

export function Exchange() {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const fiat = useFiatAccounts();
  const currencies = api.wallet.currencies.useQuery({ actingNodeId });
  // Community currencies issued by another node: the acting node mints its own instead.
  const buyable = (currencies.data ?? []).filter((c) => c.kind === "COMMUNITY" && c.issuerNodeId !== actingNodeId);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toCurrencyId, setToCurrencyId] = useState("");
  const [amount, setAmount] = useState("");
  const from = fiat.list.find((a) => a.id === fromAccountId) ?? fiat.list[0];
  const to = buyable.find((c) => c.id === toCurrencyId) ?? buyable[0];
  const typed = from ? readAmount(amount, from.currency) : null;
  const units = typed && "amount" in typed ? typed.amount : 0;

  const quote = api.wallet.quoteExchange.useQuery(
    { actingNodeId, fromAccountId: from?.id ?? "", toCurrencyId: to?.id ?? "", amount: units },
    { enabled: !!from && !!to && units > 0, retry: false },
  );
  const exchange = api.wallet.exchange.useMutation({ onSuccess: useDone("Exchanged.") });

  return (
    <SubScreen title="Exchange">
      <Field label="Pay from">
        <Select value={from?.id ?? ""} onChange={(e) => setFromAccountId(e.target.value)}>
          {fiat.list.map((a) => (
            <option key={a.id} value={a.id}>
              {a.currency.code} · {money(a.balance, a.currency)} available
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Buy">
        <Select value={to?.id ?? ""} onChange={(e) => setToCurrencyId(e.target.value)}>
          {buyable.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code ?? c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={`Amount${from?.currency.code ? ` in ${from.currency.code}` : ""}`}>
        <Input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      {quote.data && (
        <Card className="gap-0 py-1">
          <Row label="Rate">{quote.data.rate}</Row>
          <Row label="Reserve ratio">{quote.data.reserveRatio}</Row>
          <Row label="You will get" strong>
            {money(quote.data.units, quote.data.currency)}
          </Row>
        </Card>
      )}
      {quote.data && (
        <p className="text-xs text-rose-muted">
          {money(units, from?.currency)} goes into {quote.data.issuer.name}&apos;s reserve, which backs the {quote.data.currency.code}.
        </p>
      )}
      {fiat.list.length === 0 && <p className="text-rose-muted">This node has no fiat account to pay from.</p>}
      <ErrorText error={exchange.error ?? quote.error ?? fiat.error} />
      <GatedButton
        variant="primary"
        className="mt-2"
        permission={permissionFor("EXCHANGE")}
        disabled={!quote.data || exchange.isPending}
        onClick={() => from && to && exchange.mutate({ actingNodeId, fromAccountId: from.id, toCurrencyId: to.id, amount: units })}
      >
        {quote.data ? `Exchange for ${money(quote.data.units, quote.data.currency)}` : "Exchange"}
      </GatedButton>
    </SubScreen>
  );
}

export function Mint() {
  const { acting, permissionFor } = useActingNode();
  const actingNodeId = acting.node.id;
  const fiat = useFiatAccounts();
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const source = fiat.list.find((a) => a.id === sourceAccountId) ?? fiat.list.find((a) => a.isPrimaryFiat) ?? fiat.list[0];
  const typed = source ? readAmount(amount, source.currency) : null;
  const units = typed && "amount" in typed ? typed.amount : 0;

  const quote = api.wallet.quoteMint.useQuery(
    { actingNodeId, sourceAccountId: source?.id ?? "", amount: units },
    { enabled: !!source && units > 0, retry: false },
  );
  const mint = api.wallet.mint.useMutation({ onSuccess: useDone("Minted.") });
  const code = quote.data?.currency.code;

  return (
    <SubScreen title={code ? `Mint ${code}` : "Mint"}>
      <Field label="Convert from">
        <Select value={source?.id ?? ""} onChange={(e) => setSourceAccountId(e.target.value)}>
          {fiat.list.map((a) => (
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
            {money(units, source?.currency)} moves into the {code} reserve and stays locked there.
          </p>
        </>
      )}
      <ErrorText error={mint.error ?? quote.error ?? fiat.error} />
      <GatedButton
        variant="primary"
        className="mt-2"
        permission={permissionFor("MINT")}
        disabled={!quote.data || mint.isPending}
        onClick={() => source && mint.mutate({ actingNodeId, sourceAccountId: source.id, amount: units })}
      >
        {quote.data ? `Mint ${money(quote.data.units, quote.data.currency)}` : "Mint"}
      </GatedButton>
    </SubScreen>
  );
}
