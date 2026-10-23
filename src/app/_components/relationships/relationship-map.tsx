"use client";

// src/app/_components/relationships/relationship-map.tsx
// The Map view of the Relationships tab (PRD S16): the acting node in the
// middle, each node it has a relationship with around it, joined by a line
// that is thicker the higher the trust score. Tap a node to open the relationship.
//
// Only direct relationships are drawn; nodes further out come later.

import { useActingNode } from "../shell/acting-node";
import { Avatar } from "../shell/header";
import { useNav } from "../shell/navigation";
import type { RelationshipCard } from "./relationships-tab";

export function RelationshipMap({ relationships }: { relationships: RelationshipCard[] }) {
  const { acting } = useActingNode();
  const { open } = useNav();

  // Positions in % of the square: evenly round a circle, alternating two
  // rings when there are many so the names don't overlap.
  const placed = relationships.map((r, i) => {
    const angle = (2 * Math.PI * i) / relationships.length - Math.PI / 2;
    const radius = relationships.length > 10 && i % 2 === 1 ? 26 : 38;
    return { r, x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
  });

  return (
    <>
      <section aria-label="Map of relationships" className="relative aspect-square w-full overflow-hidden rounded-2xl border border-rose-border bg-rose-surface">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
          {placed.map(({ r, x, y }) => (
            <line
              key={r.id}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="currentColor"
              className={r.status === "ACTIVE" ? "text-rose-muted" : "text-rose-border"}
              strokeWidth={1 + r.trustScore * 4}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={r.status === "PENDING" ? "4 4" : undefined}
            />
          ))}
        </svg>

        <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: "50%", top: "50%" }}>
          <Avatar node={acting.node} size="lg" />
          <span className="rounded bg-rose-bg px-1 text-xs font-semibold">{acting.node.name}</span>
        </div>

        {placed.map(({ r, x, y }) => (
          <button
            key={r.id}
            type="button"
            onClick={() => open({ name: "relationship", relationshipId: r.id })}
            aria-label={`${r.otherNode.name}, trust ${r.trustScore.toFixed(2)}`}
            className="absolute flex w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <Avatar node={r.otherNode} size="sm" />
            <span className="max-w-full truncate rounded bg-rose-bg px-1 text-xs font-semibold">{r.otherNode.name}</span>
          </button>
        ))}
      </section>
      <p className="text-xs text-rose-muted">Thicker lines mean more trust; dashed lines are relationships not yet approved. Tap a node to open it.</p>
    </>
  );
}
