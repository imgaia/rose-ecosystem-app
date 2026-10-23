"use client";

// src/app/_components/home/home-tab.tsx
// Home (PRD S03, UC-NET-01): proposals waiting on the acting node, what it
// has proposed that others still have to answer, then its recent activity.
// A payment or gift coming in can be accepted or declined right here;
// everything else opens the review screen.

import { api } from "~/trpc/react";
import { formatDate } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Button, Card, Chip, Empty, ErrorText, GatedButton, Loading, SectionLabel } from "../ui";
import { proposalText, type ProposalView } from "./proposal-text";

export function HomeTab() {
  const { acting } = useActingNode();
  const actingNodeId = acting.node.id;
  const inbox = api.proposals.inbox.useQuery({ actingNodeId });
  const activity = api.nodes.activity.useQuery({ actingNodeId, limit: 15 });

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Waiting on you</h1>
        {inbox.data && <Chip solid>{inbox.data.waiting.length}</Chip>}
      </div>
      <ErrorText error={inbox.error} />
      {inbox.isLoading && <Loading />}
      {inbox.data?.waiting.length === 0 && <Empty>Nothing is waiting on {acting.node.name}.</Empty>}
      {inbox.data?.waiting.map((p) => <WaitingCard key={p.id} proposal={p} />)}

      {inbox.data && inbox.data.sent.length > 0 && (
        <>
          <SectionLabel className="mt-1">Waiting on others</SectionLabel>
          <SentList proposals={inbox.data.sent} />
        </>
      )}

      <SectionLabel className="mt-1">Recent activity</SectionLabel>
      <ErrorText error={activity.error} />
      {activity.data?.items.length === 0 && <Empty>No activity yet.</Empty>}
      {activity.data && activity.data.items.length > 0 && (
        <Card className="gap-0 py-1">
          {activity.data.items.map((item, i) => (
            <div key={item.id} className={`flex items-start justify-between gap-3 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
              <span>{item.summary}</span>
              <span className="text-xs whitespace-nowrap text-rose-muted">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function WaitingCard({ proposal }: { proposal: ProposalView }) {
  const { acting } = useActingNode();
  const { open } = useNav();
  const utils = api.useUtils();
  const decide = api.proposals.decide.useMutation({ onSuccess: () => utils.invalidate() });
  const text = proposalText(proposal, acting.node.id);

  // A payment or gift sent to the acting node: answer it in place.
  const incoming =
    proposal.kind === "INTERACTION" &&
    proposal.interaction?.kind !== "WORK" &&
    proposal.interaction?.payer?.id === proposal.proposer.id;

  const answer = (approve: boolean) =>
    decide.mutate({ actingNodeId: acting.node.id, proposalId: proposal.id, approve });

  return (
    <Card>
      <SectionLabel>{text.label}</SectionLabel>
      <h2 className="text-base font-semibold">{text.title}</h2>
      <p className="text-rose-muted">{text.detail}</p>
      <ErrorText error={decide.error} />
      <div className="flex gap-2">
        {incoming ? (
          <>
            <GatedButton variant="primary" className="flex-1" permission={proposal.permission} disabled={decide.isPending} onClick={() => answer(true)}>
              Accept
            </GatedButton>
            <GatedButton className="flex-1" permission={proposal.permission} disabled={decide.isPending} onClick={() => answer(false)}>
              Decline
            </GatedButton>
          </>
        ) : (
          <Button variant="primary" className="flex-1" onClick={() => open({ name: "proposal", proposalId: proposal.id })}>
            Review
          </Button>
        )}
      </div>
    </Card>
  );
}

function SentList({ proposals }: { proposals: ProposalView[] }) {
  const { acting } = useActingNode();
  const { open } = useNav();
  return (
    <Card className="gap-0 py-1">
      {proposals.map((p, i) => {
        const text = proposalText(p, acting.node.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => open({ name: "proposal", proposalId: p.id })}
            className={`flex min-h-11 flex-col py-2 text-left hover:bg-white/5 ${i > 0 ? "border-t border-rose-border" : ""}`}
          >
            <span className="font-semibold">{text.title}</span>
            <span className="text-xs text-rose-muted">
              {text.label} · sent {formatDate(p.createdAt)}
            </span>
          </button>
        );
      })}
    </Card>
  );
}
