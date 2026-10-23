"use client";

// src/app/_components/relationships/relationships-tab.tsx
// The Relationships tab (PRD S04, UC-REL-01): one card per node the acting
// node has a relationship with, its trust score and totals each way, filtered
// by kind of interaction. A Map view draws the same relationships around the
// acting node.

import { useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";
import { money, titleCase } from "../describe";
import { Avatar } from "../shell/header";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { Chip, Empty, ErrorText, Loading, Toggle } from "../ui";
import { RelationshipMap } from "./relationship-map";

export type RelationshipCard = RouterOutputs["relationships"]["list"][number];

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "WORK", label: "Work" },
  { value: "PAYMENT", label: "Payments" },
  { value: "GIFT", label: "Gifts" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export function RelationshipsTab() {
  const { acting } = useActingNode();
  const [view, setView] = useState<"list" | "map">("list");
  const [filter, setFilter] = useState<Filter>("ALL");
  const list = api.relationships.list.useQuery({
    actingNodeId: acting.node.id,
    interactionKind: filter === "ALL" ? undefined : filter,
  });

  return (
    <>
      <Toggle
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: "List" },
          { value: "map", label: "Map" },
        ]}
      />
      <div role="group" aria-label="Filter by kind" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`min-h-8 rounded-full border px-3 text-xs ${
              filter === f.value ? "border-rose-accent bg-rose-accent text-white" : "border-rose-border text-rose-muted hover:text-rose-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorText error={list.error} />
      {list.isLoading && <Loading />}
      {list.data?.length === 0 && (
        <Empty>{filter === "ALL" ? `${acting.node.name} has no relationships yet.` : "No relationships with this kind of interaction."}</Empty>
      )}
      {list.data && list.data.length > 0 &&
        (view === "list" ? (
          list.data.map((r) => <Card key={r.id} relationship={r} />)
        ) : (
          <RelationshipMap relationships={list.data} />
        ))}
    </>
  );
}

function Card({ relationship: r }: { relationship: RelationshipCard }) {
  const { open } = useNav();
  return (
    <button
      type="button"
      onClick={() => open({ name: "relationship", relationshipId: r.id })}
      className="flex flex-col gap-1 rounded-2xl border border-rose-border bg-rose-surface px-4 py-3 text-left hover:bg-white/5"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3">
          <Avatar node={r.otherNode} size="sm" />
          <span className="truncate text-[15px] font-semibold">{r.otherNode.name}</span>
        </span>
        <span className="text-xs whitespace-nowrap text-rose-muted">
          Trust <strong className="text-rose-text">{r.trustScore.toFixed(2)}</strong>
        </span>
      </span>
      <span className="ml-11 text-xs text-rose-muted">{totalsLine(r.totals)}</span>
      <span className="ml-11 flex items-center gap-2 text-xs text-rose-muted">
        {r.interactionCount} {r.interactionCount === 1 ? "interaction" : "interactions"}
        {r.openCount > 0 && ` · ${r.openCount} open`}
        {r.status !== "ACTIVE" && <Chip>{titleCase(r.status)}</Chip>}
      </span>
    </button>
  );
}

/** "You paid 200.00 RCC · received 20.00 RCC", one phrase per currency. */
export function totalsLine(totals: RelationshipCard["totals"]) {
  if (totals.length === 0) return "No payments yet";
  return totals
    .map((t) => {
      const parts = [];
      if (t.out > 0) parts.push(`paid ${money(t.out, t)}`);
      if (t.in > 0) parts.push(`received ${money(t.in, t)}`);
      return parts.join(" · ");
    })
    .filter(Boolean)
    .join("; ")
    .replace(/^./, (c) => c.toUpperCase());
}
