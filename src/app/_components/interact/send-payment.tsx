"use client";

// src/app/_components/interact/send-payment.tsx
// Send a payment or gift (PRD S08, UC-INT-01, UC-INT-10): once, or on a
// weekly or monthly schedule. The recipient accepts it from their inbox;
// a one-off payment the acting node can't afford is refused straight away.

import { useState } from "react";

import { api } from "~/trpc/react";
import { money } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, ErrorText, Field, GatedButton, Input, Row, SubScreen, Toggle } from "../ui";
import { AmountField, NodePicker, readAmount, useCurrencies } from "./fields";

export function SendPayment({ toNodeId }: { toNodeId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const { back, notify } = useNav();
  const actingNodeId = acting.node.id;

  const [kind, setKind] = useState<"PAYMENT" | "GIFT">("PAYMENT");
  const [recurring, setRecurring] = useState(false);
  const [to, setTo] = useState<string | null>(toNodeId ?? null);
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [maxPayments, setMaxPayments] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { list, current } = useCurrencies(currencyId, setCurrencyId);
  const permission = permissionFor("PAY");
  // Balances are only shown to those allowed to see them (Treasurer).
  const accounts = api.wallet.accounts.useQuery({ actingNodeId }, { enabled: !!permissionFor("VIEW_BALANCES")?.allowed });
  const account = accounts.data?.accounts.find((a) => a.currencyId === currencyId && !a.isReserve);

  const utils = api.useUtils();
  const send = api.interactions.sendPayment.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      notify(`${kind === "GIFT" ? "Gift" : "Payment"} sent. It goes through once the other side accepts it.`);
      back();
    },
  });

  function submit() {
    setFormError(null);
    if (!to) return setFormError("Choose who to send it to");
    const read = readAmount(amount, current);
    if ("error" in read) return setFormError(read.error);
    if (!comment.trim()) return setFormError("Add a comment: it is required");
    const max = maxPayments ? Number(maxPayments) : null;
    if (max !== null && (!Number.isInteger(max) || max < 1)) return setFormError("Ends after: a whole number of payments");
    send.mutate({
      actingNodeId,
      toNodeId: to,
      kind,
      terms: {
        description: comment.trim(),
        amount: read.amount,
        currencyId,
        frequency: recurring ? frequency : "ONCE",
        startDate: recurring && startDate ? new Date(`${startDate}T00:00:00`) : null,
        maxPayments: recurring ? max : null,
      },
    });
  }

  const typed = current ? readAmount(amount, current) : null;
  const after = account && typed && "amount" in typed ? account.balance - typed.amount : null;

  return (
    <SubScreen title="Send a payment or gift">
      <Toggle
        label="Kind"
        value={kind}
        onChange={setKind}
        options={[
          { value: "PAYMENT", label: "Payment" },
          { value: "GIFT", label: "Gift" },
        ]}
      />
      <Toggle
        label="How often"
        value={recurring ? "R" : "O"}
        onChange={(v) => setRecurring(v === "R")}
        options={[
          { value: "O", label: "Once" },
          { value: "R", label: "Recurring" },
        ]}
      />
      <NodePicker label="To" nodeId={to} onChange={setTo} />
      <AmountField label="Amount" amount={amount} onAmount={setAmount} currencyId={currencyId} onCurrency={setCurrencyId} currencies={list} />

      {recurring && (
        <>
          <Field label="Every">
            <Toggle
              label="Every"
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: "WEEKLY", label: "Week" },
                { value: "MONTHLY", label: "Month" },
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="First payment">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Ends after" hint="Payments; empty: no end">
              <Input inputMode="numeric" placeholder="6" value={maxPayments} onChange={(e) => setMaxPayments(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      <Field label="Comment (required)">
        <Input placeholder={kind === "GIFT" ? "Thank you for…" : "What it is for"} value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>

      {account && (
        <Card className="gap-0 py-1">
          <Row label="Balance now">{money(account.balance, account.currency)}</Row>
          {after !== null && (
            <Row label={recurring ? "Balance after first payment" : "Balance after"} strong>
              {money(after, account.currency)}
            </Row>
          )}
        </Card>
      )}

      <ErrorText error={formError ? { message: formError } : send.error} />
      <GatedButton variant="primary" className="mt-2" permission={permission} disabled={send.isPending} onClick={submit}>
        {recurring ? "Set up schedule" : kind === "GIFT" ? "Send gift" : "Send payment"}
      </GatedButton>
    </SubScreen>
  );
}
