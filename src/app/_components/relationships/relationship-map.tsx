"use client";

// src/app/_components/relationships/relationship-map.tsx
// The Map view of the Relationships tab (PRD S16): the whole network
// (R-VIS-02). The acting node sits in the middle, the nodes it has a
// relationship with on a ring around it, and every other node on an outer
// ring. Its own relationships are dark lines, thicker the higher the trust
// score and dashed while pending; other people's connections are thin light
// lines, with no amounts or trust. Tap a node to open its page.
//
// The lines are drawing only; the same connections are listed for screen
// readers under the map.

import { api, type RouterOutputs } from "~/trpc/react";
import { useActingNode } from "../shell/acting-node";
import { useNav } from "../shell/navigation";
import { ErrorText, Loading } from "../ui";

type Network = RouterOutputs["relationships"]["network"];
type MapNode = Network["nodes"][number];
type Point = { x: number; y: number };

/** Evenly round a circle of `radius` (% of the square), alternating two radii when crowded so names don't overlap. */
function ring(count: number, radius: number, crowded: number, offset = 0): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2 + offset;
    const r = count > crowded && i % 2 === 1 ? radius - 7 : radius;
    return { x: 50 + r * Math.cos(angle), y: 50 + r * Math.sin(angle) };
  });
}

/**
 * Where each node goes. The outer ring is ordered by where its connections
 * on the inner ring are, so other people's lines stay short and cross less.
 */
function layout(network: Network, me: string) {
  const inner = network.own.map((r) => r.otherNodeId);
  const innerAt = new Map(inner.map((id, i) => [id, i / Math.max(inner.length, 1)]));
  const outer = network.nodes.filter((n) => n.id !== me && !innerAt.has(n.id)).map((n) => n.id);
  const near = (id: string) => {
    const linked = network.others
      .filter((r) => r.nodeAId === id || r.nodeBId === id)
      .map((r) => innerAt.get(r.nodeAId === id ? r.nodeBId : r.nodeAId))
      .filter((v): v is number => v !== undefined);
    return linked.length ? linked.reduce((a, b) => a + b, 0) / linked.length : 2; // unconnected last
  };
  outer.sort((a, b) => near(a) - near(b));

  const at = new Map<string, Point>([[me, { x: 50, y: 50 }]]);
  ring(inner.length, outer.length > 0 ? 24 : 36, 8).forEach((p, i) => at.set(inner[i]!, p));
  ring(outer.length, 43, 10, Math.PI / Math.max(outer.length, 1)).forEach((p, i) => at.set(outer[i]!, p));
  return at;
}

export function RelationshipMap({ interactionKind }: { interactionKind?: "WORK" | "PAYMENT" | "GIFT" }) {
  const { acting } = useActingNode();
  const { open } = useNav();
  const me = acting.node.id;
  const network = api.relationships.network.useQuery({ actingNodeId: me, interactionKind });

  if (network.error) return <ErrorText error={network.error} />;
  if (!network.data) return <Loading />;
  const data = network.data;
  const at = layout(data, me);
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const name = (id: string) => (id === me ? acting.node.name : (byId.get(id)?.name ?? "Someone"));
  const linked = new Set(data.own.map((r) => r.otherNodeId));

  return (
    <>
      <section aria-label="Map of the network" className="relative aspect-square w-full overflow-hidden rounded-2xl border border-rose-border bg-rose-surface">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
          {data.others.map((r) => {
            const [a, b] = [at.get(r.nodeAId), at.get(r.nodeBId)];
            if (!a || !b) return null;
            return <line key={r.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" className="text-rose-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />;
          })}
          {data.own.map((r) => {
            const p = at.get(r.otherNodeId);
            if (!p) return null;
            return (
              <line
                key={r.id}
                x1="50"
                y1="50"
                x2={p.x}
                y2={p.y}
                stroke="currentColor"
                className="text-rose-text"
                strokeOpacity={r.status === "ACTIVE" ? 0.85 : 0.6}
                strokeWidth={1 + r.trustScore * 4}
                vectorEffect="non-scaling-stroke"
                strokeDasharray={r.status === "PENDING" ? "4 4" : undefined}
              />
            );
          })}
        </svg>

        {data.nodes
          .filter((n) => at.has(n.id))
          .map((n) => (
            <NodeDot key={n.id} node={n} point={at.get(n.id)!} kind={n.id === me ? "me" : linked.has(n.id) ? "linked" : "other"} onOpen={() => open({ name: "node", nodeId: n.id })} />
          ))}
      </section>

      <ul aria-label="Connections" className="sr-only">
        {data.own.map((r) => (
          <li key={r.id}>
            {acting.node.name} and {name(r.otherNodeId)}
            {r.status === "PENDING" ? ", pending" : ""}, trust {r.trustScore.toFixed(2)}
          </li>
        ))}
        {data.others.map((r) => (
          <li key={r.id}>
            {name(r.nodeAId)} and {name(r.nodeBId)}
          </li>
        ))}
      </ul>

      <p className="text-xs text-rose-muted">
        The whole network. Dark lines are {acting.node.kind === "INDIVIDUAL" ? "your" : `${acting.node.name}'s`} relationships: thicker means more trust, dashed means not yet
        approved. Light lines are other people&apos;s connections; their amounts and trust stay private (R-VIS-02). Tap a node to open its page.
      </p>
    </>
  );
}

/** One node on the map: the acting node large, its relationships in the accent colour, everyone else muted. */
function NodeDot({ node, point, kind, onOpen }: { node: MapNode; point: Point; kind: "me" | "linked" | "other"; onOpen: () => void }) {
  const shape = node.kind === "COLLECTION" ? "rounded-md" : "rounded-full";
  const look =
    kind === "other" ? "size-6 border border-rose-border bg-rose-bg text-[10px] text-rose-muted" : `${kind === "me" ? "size-10 text-base" : "size-7 text-xs"} bg-rose-accent text-white`;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${node.name}`}
      className="absolute flex w-[4.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <span aria-hidden="true" className={`flex flex-none items-center justify-center font-semibold ${shape} ${look}`}>
        {node.name.charAt(0).toUpperCase()}
      </span>
      <span className={`max-w-full truncate rounded bg-rose-bg/80 px-1 text-[10px] leading-tight ${kind === "other" ? "text-rose-muted" : "font-semibold"}`}>
        {node.name}
      </span>
    </button>
  );
}
