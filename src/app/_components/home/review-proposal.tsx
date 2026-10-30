"use client";

// src/app/_components/home/review-proposal.tsx
// Review a proposal (PRD S25, UC-NET-07): what would change, the two sides
// (or for a collection's role change or removal, who and what), who has
// approved, and approve / decline (with an optional comment), or
// counter-propose for work. The node that proposed it can withdraw it.

import { useState } from "react";

import { api } from "~/trpc/react";
import { formatDate, frequencyLabel, money, nameOrYou, termsSummary, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Button, Card, Chip, ErrorText, GatedButton, Loading, Row, SectionLabel, SubScreen, TextArea } from "../ui";
import { formatRate } from "../wallet/currencies";
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
  const { back, open } = useNav();
  const me = acting.node.id;
  const text = proposalText(p, me);
  const [comment, setComment] = useState("");

  const utils = api.useUtils();
  const done = { onSuccess: () => utils.invalidate().then(back) };
  const decide = api.proposals.decide.useMutation(done);
  const withdraw = api.proposals.withdraw.useMutation(done);
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

      {p.roleChange && p.collection && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">{p.roleChange.role.key === "MEMBER" ? "New member" : "Role change"}</SectionLabel>
          <Row label="Collection">{p.collection.name}</Row>
          <Row label="Member" strong>
            {label(p.roleChange.holder, me)}
          </Row>
          {p.roleChange.role.key !== "MEMBER" && (
            <Row label={p.roleChange.change === "ADD" ? "Would become" : "Would stop being"}>{p.roleChange.role.label}</Row>
          )}
        </Card>
      )}

      {p.removal && p.collection && (
        <Card className="gap-0">
          <SectionLabel className="mb-1">Removal</SectionLabel>
          <Row label="Collection">{p.collection.name}</Row>
          <Row label="Member" strong>
            {label(p.removal.member, me)}
          </Row>
          <Row label="Reason">{p.removal.reason}</Row>

        </Card>
      )}

      {p.currencyChange && p.collection && <CurrencyChangeCard change={p.currencyChange} issuer={p.collection.name} />}

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
          {p.currencyChange ? (
            `Approvals · a Treasurer and an Owner, from the ${p.approval.total} asked`
          ) : (
            <>
              Approvals · {approvedCount} of {p.approval.needed} needed
              {p.approval.needed < p.approval.total && ` (from ${p.approval.total})`}
            </>
          )}
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
          {p.currencyChange
            ? "Needs a Treasurer and an Owner of the collection, two different people (R-FIN-11)."
            : p.roleChange || p.removal
            ? `${p.approval.needed === p.approval.total ? "Everyone listed must approve" : `${p.approval.needed} of the ${p.approval.total} listed must approve`}; ${
                p.approval.declines === "any_closes" || p.approval.needed === p.approval.total
                  ? "any decline closes it"
                  : "it closes once too many decline"
              }.${p.roleChange ? " Each native role always keeps a holder." : ""}`
            : `Both sides must approve. ${p.kind === "TERMS_CHANGE" ? "Until then the current terms stay in force." : ""}`}
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
              <GatedButton className="flex-1" permission={p.permission} disabled={busy} onClick={() => open({ name: "counter", proposalId: p.id })}>
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
        <Button onClick={() => open({ name: "interaction", interactionId: interaction.id })}>Open the interaction</Button>
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

const POLICY: Record<string, string> = { reserve: "Reserve", open: "Open" };

/** What a currency proposal would do: the new currency's fields, or what changes. */
function CurrencyChangeCard({ change, issuer }: { change: NonNullable<ProposalView["currencyChange"]>; issuer: string }) {
  const { action, currency, fields, fiatCode, makeHome } = change;
  const heading = { CREATE: "New currency", EDIT: "Changes to a currency", RETIRE: "Retire a currency", DELETE: "Delete a currency" }[action];
  return (
    <Card className="gap-0">
      <SectionLabel className="mb-1">{heading}</SectionLabel>
      <Row label="Issuer">{issuer}</Row>
      {currency && (
        <Row label="Currency" strong>
          {currency.name} · {currency.code}
        </Row>
      )}
      {fields.name !== undefined && <Row label="Name">{fields.name}</Row>}
      {fields.code !== undefined && <Row label="Symbol">{fields.code}</Row>}
      {fields.description !== undefined && <Row label="Description">{fields.description ?? "None"}</Row>}
      {fields.decimals !== undefined && <Row label="Decimal places">{fields.decimals}</Row>}
      {fields.reserveRatio !== undefined && (
        <Row label="Price">
          1 {fields.code ?? currency?.code ?? "unit"} = {formatRate(fields.reserveRatio)} {fiatCode ?? ""}
        </Row>
      )}
      {fields.policy !== undefined && <Row label="Conversion policy">{POLICY[fields.policy] ?? fields.policy}</Row>}
      {makeHome && <Row label="Home currency">Becomes {issuer}&apos;s home currency</Row>}
      {action === "RETIRE" && <Row label="After">No new units; balances stay usable and convertible</Row>}
      {action === "DELETE" && <Row label="After">Removed for good (nobody has held it)</Row>}
    </Card>
  );
}
