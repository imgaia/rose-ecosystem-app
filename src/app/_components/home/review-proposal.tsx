"use client";

// src/app/_components/home/review-proposal.tsx
// Review a proposal (PRD S25, UC-NET-07): what would change, the two sides,
// who has approved, and approve / decline (with an optional comment), or
// counter-propose for work. The node that proposed it can withdraw it.

import { useState } from "react";

import { api } from "~/trpc/react";
import { formatDate, frequencyLabel, money, nameOrYou, termsSummary, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Button, Card, Chip, ErrorText, GatedButton, Loading, Row, SectionLabel, SubScreen, TextArea } from "../ui";
import { proposalText, type ProposalView } from "./proposal-text";

export function ReviewProposal({ proposalId }: { proposalId: string }) {
  const { acting } = useActingNode();
  const review = api.proposals.review.useQuery({ actingNodeId: acting.node.id, proposalId });

  return (
    <SubScreen title="Proposal">
      <ErrorText error={review.error} />
      {review.isLoading && <Loading />}
      {review.data && <ProposalBody proposal={review.data} />}
    </SubScreen>
  );
}

function ProposalBody({ proposal: p }: { proposal: ProposalView }) {
  const { acting } = useActingNode();
  const { back, notYet } = useNav();
  const me = acting.node.id;
  const text = proposalText(p, me);
  const [comment, setComment] = useState("");

  const utils = api.useUtils();
  const done = { onSuccess: () => utils.invalidate().then(back) };
  const decide = api.proposals.decide.useMutation(done);
  const withdraw = api.interactions.withdraw.useMutation(done);
  const busy = decide.isPending || withdraw.isPending;

  const interaction = p.interaction;
  const terms = p.proposedTerms;
  const approvedCount = p.approvers.filter((a) => a.decision === true).length;
  const canCounter =
    interaction?.kind === "WORK" && (p.kind === "INTERACTION" || p.kind === "TERMS_CHANGE");
  const isOpen = p.status === "OPEN";

  return (
    <>
      <Card className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>{text.label}</SectionLabel>
          {!isOpen && <Chip>{titleCase(p.status)}</Chip>}
        </div>
        <h1 className="text-lg font-semibold">{terms?.description ?? p.paymentRequest?.comment ?? text.title}</h1>
        <p className="text-rose-muted">
          From {p.proposer.name}
          {p.proposedBy.id !== p.proposer.id && ` (by ${p.proposedBy.name})`} · proposed {formatDate(p.createdAt)}
        </p>
        {p.comment && <p className="text-rose-muted">“{p.comment}”</p>}
      </Card>

      {interaction && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Sides</SectionLabel>
          <Row label={interaction.kind === "WORK" ? "Does the work" : "Receives"}>{label(interaction.payee, me)}</Row>
          <Row label="Pays" strong>
            {label(interaction.payer, me)}
          </Row>
        </Card>
      )}

      {p.paymentRequest && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Payment requested</SectionLabel>
          <Row label="Amount" strong>
            {money(p.paymentRequest.amount, p.paymentRequest.currency)}
          </Row>
          <Row label="For">{p.paymentRequest.comment}</Row>
          {p.currentTerms && <Row label="Agreed terms">{termsSummary(p.currentTerms)}</Row>}
        </Card>
      )}

      {terms && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Terms · version {terms.version}</SectionLabel>
          <TermRow label="Price" now={money(terms.amount, terms.currency)} was={p.currentTerms && money(p.currentTerms.amount, p.currentTerms.currency)} strong />
          <TermRow label="Frequency" now={capital(frequencyLabel(terms.frequency))} was={p.currentTerms && capital(frequencyLabel(p.currentTerms.frequency))} />
          {terms.startDate && <TermRow label="Start" now={formatDate(terms.startDate)} was={p.currentTerms && formatDate(p.currentTerms.startDate)} />}
          {(terms.endDate ?? terms.maxPayments) && (
            <Row label="End">{terms.endDate ? formatDate(terms.endDate) : `After ${terms.maxPayments} payments`}</Row>
          )}
          {p.currentTerms && p.currentTerms.description !== terms.description && (
            <Row label="Was">{p.currentTerms.description}</Row>
          )}
        </Card>
      )}

      <Card className="gap-0">
        <SectionLabel className="mb-1">
          Approvals · {approvedCount} of {p.approvers.length}
        </SectionLabel>
        {p.approvers.map((a) => (
          <div key={a.node?.id} className="flex items-center justify-between gap-3 border-t border-rose-border py-2">
            <span>
              {a.node?.name}
              {a.node?.id === p.proposer.id && " · proposer"}
              {a.node?.id === me && " · you"}
            </span>
            <span className={a.decision === null ? "text-rose-muted" : "font-semibold"}>
              {a.decision === null ? "Waiting" : a.decision ? "Approved" : "Declined"}
              {a.decidedBy && a.decidedBy.id !== a.node?.id && ` by ${a.decidedBy.name}`}
            </span>
          </div>
        ))}
      </Card>

      {isOpen && (
        <p className="text-xs text-rose-muted">
          Both sides must approve. {p.kind === "TERMS_CHANGE" ? "Until then the current terms stay in force." : ""}
        </p>
      )}

      <ErrorText error={decide.error ?? withdraw.error} />

      {isOpen && p.waitingOnMe && (
        <div className="mt-auto flex flex-col gap-2">
          <TextArea rows={2} placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <GatedButton
            variant="primary"
            permission={p.permission}
            disabled={busy}
            onClick={() => decide.mutate({ actingNodeId: me, proposalId: p.id, approve: true, comment: comment || undefined })}
          >
            Approve
          </GatedButton>
          <div className="flex gap-2">
            {canCounter && (
              <GatedButton className="flex-1" permission={p.permission} disabled={busy} onClick={() => notYet("Counter-proposing")}>
                Counter-propose
              </GatedButton>
            )}
            <GatedButton
              className="flex-1"
              permission={p.permission}
              disabled={busy}
              onClick={() => decide.mutate({ actingNodeId: me, proposalId: p.id, approve: false, comment: comment || undefined })}
            >
              Decline
            </GatedButton>
          </div>
        </div>
      )}

      {isOpen && p.proposer.id === me && (
        <Button className="mt-auto" disabled={busy} onClick={() => withdraw.mutate({ actingNodeId: me, proposalId: p.id })}>
          Withdraw proposal
        </Button>
      )}

      {interaction && (
        <Button onClick={() => notYet("The interaction screen")}>Open the interaction</Button>
      )}
    </>
  );
}

/** A term, with the value it would replace when terms are being changed. */
function TermRow({ label: name, now, was, strong }: { label: string; now: string; was?: string | null; strong?: boolean }) {
  return (
    <Row label={name} strong={strong}>
      {was && was !== now ? (
        <>
          <span className="mr-2 text-rose-muted line-through">{was}</span>
          {now}
        </>
      ) : (
        now
      )}
    </Row>
  );
}

function label(node: { id: string; name: string } | null, me: string) {
  return node?.id === me ? `${node.name} (you)` : nameOrYou(node, me);
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
