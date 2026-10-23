"use client";

// src/app/_components/relationships/interaction-detail.tsx
// One interaction (PRD S06, UC-INT-05 to UC-INT-10, UC-PAY-01): its terms and
// their earlier versions, the schedule, open proposals, payments made and any
// verification, with the actions its status allows: request a payment (the
// side doing the work), amend, pause or resume, complete, cancel.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate, frequencyLabel, interactionKindLabel, money, termsSummary, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { useNav } from "../shell/navigation";
import { Card, Chip, Empty, ErrorText, GatedButton, Loading, Row, SectionLabel, SubScreen } from "../ui";

type Detail = RouterOutputs["interactions"]["detail"];

export function InteractionDetail({ interactionId }: { interactionId: string }) {
  const { acting } = useActingNode();
  const detail = api.interactions.detail.useQuery({ actingNodeId: acting.node.id, interactionId });
  const d = detail.data;
  const other = d && (d.actingNodePays ? d.payee : d.payer);

  return (
    <SubScreen title={d && other ? `${interactionKindLabel(d.kind)} with ${other.name}` : "Interaction"}>
      <ErrorText error={detail.error} />
      {detail.isLoading && <Loading />}
      {d && <Body detail={d} />}
    </SubScreen>
  );
}

function Body({ detail: d }: { detail: Detail }) {
  const { acting } = useActingNode();
  const { open } = useNav();
  const [showHistory, setShowHistory] = useState(false);
  const me = acting.node.id;
  const other = d.actingNodePays ? d.payee : d.payer;

  const utils = api.useUtils();
  const onSuccess = () => utils.invalidate();
  const pause = api.interactions.pause.useMutation({ onSuccess });
  const resume = api.interactions.resume.useMutation({ onSuccess });
  const complete = api.interactions.complete.useMutation({ onSuccess });
  const cancel = api.interactions.cancel.useMutation({ onSuccess });
  const busy = pause.isPending || resume.isPending || complete.isPending || cancel.isPending;
  const error = pause.error ?? resume.error ?? complete.error ?? cancel.error;

  // The terms in force, or for an interaction not yet agreed, the proposed ones.
  const terms = d.currentTerms ?? d.terms[0];
  const earlier = d.terms.filter((t) => t.id !== terms?.id);
  const openProposals = d.proposals.filter((p) => p.status === "OPEN");
  const running = d.status === "ACTIVE" || d.status === "PAUSED";
  const args = { actingNodeId: me, interactionId: d.id };

  return (
    <>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar node={other} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{other.name}</h1>
            <p className="text-rose-muted">{terms?.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Chip>{interactionKindLabel(d.kind)}</Chip>
          <Chip solid={d.status === "ACTIVE"}>{titleCase(d.status)}</Chip>
        </div>
      </Card>

      {terms && (
        <Card className="gap-0">
          <div className="mb-1 flex items-center justify-between gap-3">
            <SectionLabel>
              {d.currentTerms ? "Terms" : "Proposed terms"} · version {terms.version}
            </SectionLabel>
            {earlier.length > 0 && (
              <button type="button" onClick={() => setShowHistory(!showHistory)} className="text-xs font-semibold text-rose-accent">
                {showHistory ? "Hide history" : "History"}
              </button>
            )}
          </div>
          <Row label="Who pays">{d.actingNodePays ? `${acting.node.name} (you)` : d.payer.name}</Row>
          <Row label="Price" strong>
            {money(terms.amount, terms.currency)}
          </Row>
          <Row label="Frequency">{capital(frequencyLabel(terms.frequency))}</Row>
          {terms.startDate && <Row label="Start">{formatDate(terms.startDate)}</Row>}
          {terms.endDate && <Row label="End">{formatDate(terms.endDate)}</Row>}
          {terms.maxPayments && <Row label="Ends after">{terms.maxPayments} payments</Row>}
          {d.kind === "WORK" && <Row label="Payment">{terms.paymentMode === "ON_REQUEST" ? "When requested" : "Automatic"}</Row>}
          {showHistory &&
            earlier.map((t) => (
              <Row key={t.id} label={`Version ${t.version}${t.approved ? "" : " (not approved)"}`}>
                {termsSummary(t)}
                {t.description !== terms.description && ` · ${t.description}`}
              </Row>
            ))}
        </Card>
      )}

      {terms && terms.frequency !== "ONCE" && running && (
        <Card>
          <SectionLabel>Schedule</SectionLabel>
          <p>
            {termsSummary(terms)}
            {d.status === "PAUSED" ? " · paused" : d.nextDueAt ? ` · next on ${formatDate(d.nextDueAt)}` : ""}
          </p>
        </Card>
      )}

      {openProposals.length > 0 && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Waiting for approval</SectionLabel>
          {openProposals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => open({ name: "proposal", proposalId: p.id })}
              className="flex min-h-11 items-center justify-between gap-3 border-t border-rose-border py-2 text-left hover:bg-white/5"
            >
              <span>{titleCase(p.kind)}</span>
              <span className="text-xs text-rose-muted">
                {p.approvers.filter((a) => a.decision === true).length} of {p.approvers.length} approved
              </span>
            </button>
          ))}
        </Card>
      )}

      <SectionLabel className="mt-1">Payments</SectionLabel>
      {d.transactions.length === 0 ? (
        <Empty>No payments yet.</Empty>
      ) : (
        <Card className="gap-0 py-1">
          {d.transactions.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between gap-3 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
              <span>
                {formatDate(t.createdAt)} · {t.comment}
              </span>
              {/* Payments in an interaction are in its terms' currency. */}
              <span className="font-semibold whitespace-nowrap">{money(t.amount, terms?.currency)}</span>
            </div>
          ))}
        </Card>
      )}

      {d.curators.length > 0 && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Verification</SectionLabel>
          {d.verifications.length === 0 && <Row label="Curators">{d.curators.length}, nothing verified yet</Row>}
          {d.verifications.map((v) => (
            <Row key={v.id} label={formatDate(v.createdAt)}>
              {v.confirmed ? "Confirmed" : "Not confirmed"}
              {v.note && ` · ${v.note}`}
            </Row>
          ))}
        </Card>
      )}

      <ErrorText error={error} />

      {running && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {d.kind === "WORK" && !d.actingNodePays && (
            <GatedButton variant="primary" className="col-span-2" permission={d.permission} disabled={busy} onClick={() => open({ name: "request", interactionId: d.id })}>
              Request a payment
            </GatedButton>
          )}
          <GatedButton permission={d.permission} disabled={busy || openProposals.some((p) => p.kind !== "PAYMENT_REQUEST")} onClick={() => open({ name: "amend", interactionId: d.id })}>
            Amend terms
          </GatedButton>
          {d.status === "ACTIVE" ? (
            <GatedButton permission={d.permission} disabled={busy} onClick={() => pause.mutate(args)}>
              Pause
            </GatedButton>
          ) : (
            <GatedButton permission={d.permission} disabled={busy} onClick={() => resume.mutate(args)}>
              Resume
            </GatedButton>
          )}
          <GatedButton permission={d.permission} disabled={busy} onClick={() => complete.mutate(args)}>
            Mark complete
          </GatedButton>
          <GatedButton
            permission={d.permission}
            disabled={busy}
            onClick={() => window.confirm(`Cancel this ${interactionKindLabel(d.kind).toLowerCase()}? Any schedule stops.`) && cancel.mutate(args)}
          >
            Cancel
          </GatedButton>
        </div>
      )}
    </>
  );
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
