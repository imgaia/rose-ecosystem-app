"use client";

// src/app/_components/relationships/relationship-detail.tsx
// One relationship (PRD S05, UC-REL-01, UC-PAY-02): the other node, the trust
// score, totals each way, its interactions and the payments between the two
// nodes. From here you can pay, request a payment or propose work.

import { api, type RouterOutputs } from "~/trpc/react";
import { formatDate, interactionKindLabel, money, termsSummary, titleCase } from "../describe";
import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { useNav } from "../shell/navigation";
import { Card, Chip, Empty, ErrorText, GatedButton, Loading, Row, SectionLabel, SubScreen } from "../ui";

type Detail = RouterOutputs["relationships"]["detail"];

export function RelationshipDetail({ relationshipId }: { relationshipId: string }) {
  const { acting } = useActingNode();
  const detail = api.relationships.detail.useQuery({ actingNodeId: acting.node.id, relationshipId });

  return (
    <SubScreen title={detail.data?.otherNode.name ?? "Relationship"}>
      <ErrorText error={detail.error} />
      {detail.isLoading && <Loading />}
      {detail.data && <Body detail={detail.data} />}
    </SubScreen>
  );
}

function Body({ detail: r }: { detail: Detail }) {
  const { acting, permissionFor } = useActingNode();
  const { open } = useNav();
  const other = r.otherNode;
  // "you" for a person acting for themselves; a collection is named.
  const you = acting.node.kind === "INDIVIDUAL" ? "you" : acting.node.name;
  const You = you.charAt(0).toUpperCase() + you.slice(1);

  return (
    <>
      <Card>
        <div className="flex items-center gap-3">
          <Avatar node={other} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{other.name}</h1>
            <p className="text-rose-muted">
              {r.formedAt ? `Relationship since ${formatDate(r.formedAt)}` : titleCase(r.status)} · {r.interactions.length}{" "}
              {r.interactions.length === 1 ? "interaction" : "interactions"}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => open({ name: "node", nodeId: other.id })} className="min-h-11 self-start text-sm font-semibold text-rose-accent">
          Open {other.name}&apos;s node page
        </button>
        <Row label="Trust score (placeholder)" strong>
          {r.trustScore.toFixed(2)}
        </Row>
      </Card>

      <Card className="gap-0">
        <SectionLabel className="mb-1">Totals</SectionLabel>
        {r.totals.length === 0 && <Row label="No payments yet">–</Row>}
        {r.totals.map((t) => (
          <div key={t.currencyId}>
            <Row label={`${You} paid ${other.name}`} strong>
              {money(t.out, t)}
            </Row>
            <Row label={`${other.name} paid ${you}`} strong>
              {money(t.in, t)}
            </Row>
          </div>
        ))}
      </Card>

      <Card className="gap-0">
        <SectionLabel className="mb-1">Interactions</SectionLabel>
        {r.interactions.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => open({ name: "interaction", interactionId: i.id })}
            className="flex min-h-11 items-center justify-between gap-3 border-t border-rose-border py-2 text-left hover:bg-white/5"
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">
                {interactionKindLabel(i.kind)}
                {i.currentTerms?.description ? ` · ${i.currentTerms.description}` : ""}
              </span>
              <span className="text-xs text-rose-muted">
                {i.currentTerms && termsSummary(i.currentTerms)} · {i.actingNodePays ? `${you} ${you === "you" ? "pay" : "pays"}` : `${other.name} pays`}
                {i.openProposals.length > 0 && " · waiting for approval"}
              </span>
            </span>
            <Chip solid={i.status === "ACTIVE"}>{titleCase(i.status)}</Chip>
          </button>
        ))}
      </Card>

      <SectionLabel className="mt-1">Payments</SectionLabel>
      {r.transactions.length === 0 ? (
        <Empty>No payments between you yet.</Empty>
      ) : (
        <Card className="gap-0 py-1">
          {r.transactions.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between gap-3 py-2 ${i > 0 ? "border-t border-rose-border" : ""}`}>
              <span className="flex min-w-0 flex-col">
                <span>{t.comment}</span>
                <span className="text-xs text-rose-muted">
                  {titleCase(t.kind)} · {formatDate(t.createdAt)}
                </span>
              </span>
              <span className="font-semibold whitespace-nowrap">
                {t.direction === "out" ? "−" : "+"}
                {money(t.amount, t.currency)}
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <GatedButton variant="primary" permission={permissionFor("PAY")} onClick={() => open({ name: "send", toNodeId: other.id })}>
          Send a payment or gift
        </GatedButton>
        <div className="grid grid-cols-2 gap-2">
          <GatedButton permission={permissionFor("INTERACT")} onClick={() => open({ name: "request", fromNodeId: other.id })}>
            Request a payment
          </GatedButton>
          <GatedButton permission={permissionFor("INTERACT")} onClick={() => open({ name: "propose-work", otherNodeId: other.id })}>
            Propose work
          </GatedButton>
        </div>
      </div>
    </>
  );
}
