"use client";

// src/app/_components/interact/request-payment.tsx
// Request a payment (PRD S09, UC-INT-02). Two cases:
// - from the + menu or a relationship: ask any node for a one-off payment;
// - from a work interaction: the side doing the work asks to be paid,
//   by default the agreed price.

import { useEffect, useState } from "react";

import { formatAmount } from "~/lib/money";
import { api } from "~/trpc/react";
import { termsSummary } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Card, ErrorText, Field, GatedButton, Input, MainAction, Row, SubScreen } from "../ui";
import { AmountField, NodePicker, readAmount, useCurrencies } from "./fields";

export function RequestPayment({ fromNodeId, interactionId }: { fromNodeId?: string; interactionId?: string }) {
  const { acting, permissionFor } = useActingNode();
  const { back, notify } = useNav();
  const actingNodeId = acting.node.id;

  const [from, setFrom] = useState<string | null>(fromNodeId ?? null);
  const [amount, setAmount] = useState("");
  const [currencyId, setCurrencyId] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const { list, current } = useCurrencies(currencyId, setCurrencyId);

  // Within work: start from the agreed price.
  const work = api.interactions.detail.useQuery({ actingNodeId, interactionId: interactionId ?? "" }, { enabled: !!interactionId });
  const agreed = work.data?.currentTerms;
  useEffect(() => {
    if (agreed) {
      setAmount(formatAmount(agreed.amount, agreed.currency.decimals));
      setCurrencyId(agreed.currencyId);
    }
  }, [agreed]);

  const utils = api.useUtils();
  const onSuccess = async () => {
    await utils.invalidate();
    notify("Request sent. It waits in their inbox.");
    back();
  };
  const requestPayment = api.interactions.requestPayment.useMutation({ onSuccess });
  const requestWorkPayment = api.interactions.requestWorkPayment.useMutation({ onSuccess });
  const pending = requestPayment.isPending || requestWorkPayment.isPending;

  function submit() {
    setFormError(null);
    const read = readAmount(amount, current);
    if ("error" in read) return setFormError(read.error);
    if (!comment.trim()) return setFormError("Say what the payment is for");
    if (interactionId) {
      requestWorkPayment.mutate({ actingNodeId, interactionId, comment: comment.trim(), amount: read.amount, currencyId });
    } else {
      if (!from) return setFormError("Choose who to ask");
      requestPayment.mutate({ actingNodeId, fromNodeId: from, amount: read.amount, currencyId, comment: comment.trim() });
    }
  }

  return (
    <SubScreen form title="Request a payment">
      {work.data ? (
        <Card className="gap-0">
          <Row label="From">{work.data.payer.name}</Row>
          <Row label="For the work">{agreed?.description}</Row>
          {agreed && <Row label="Agreed">{termsSummary(agreed)}</Row>}
        </Card>
      ) : (
        !interactionId && <NodePicker label="From" nodeId={from} onChange={setFrom} />
      )}
      <AmountField label="Amount" amount={amount} onAmount={setAmount} currencyId={currencyId} onCurrency={setCurrencyId} currencies={list} />
      <Field label="What it is for">
        <Input placeholder="Source material, October" value={comment} onChange={(e) => setComment(e.target.value)} />
      </Field>
      <ErrorText error={formError ? { message: formError } : (requestPayment.error ?? requestWorkPayment.error ?? work.error)} />
      <MainAction>
        <GatedButton
          variant="primary"
         
          // Within work the side being paid decides; otherwise asking needs INTERACT.
          permission={work.data ? work.data.permission : permissionFor("INTERACT")}
          disabled={pending}
          onClick={submit}
        >
          Send request
        </GatedButton>
      </MainAction>
    </SubScreen>
  );
}
