// src/server/api/routers/relationships.ts
// The acting node's relationships (UC-REL-01): one entry per other node,
// with the trust score and totals each way, and a relationship's detail.
// Only transactions the two nodes share are shown (R-VIS-01).

import { z } from "zod";
import { getRule } from "~/server/rules";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import { assertSees, publicNode, type Ctx } from "./shared";

/** What a screen shows before the first trust event; the score itself lives in trust.ts. */
const startingTrust = Number(getRule("R-TS-01")?.default ?? 0.75);

const interactionKind = z.enum(["PAYMENT", "GIFT", "WORK"]);

/**
 * Totals each way for these relationships, per currency, in minor units:
 * `out` = paid or given by the acting node, `in` = received by it.
 */
async function totalsEachWay(ctx: Ctx, relationshipIds: string[]) {
  const rows = await ctx.db.transaction.findMany({
    where: { kind: { in: ["PAYMENT", "GIFT"] }, interaction: { relationshipId: { in: relationshipIds } } },
    select: {
      amount: true,
      interaction: { select: { relationshipId: true } },
      from: { select: { nodeId: true, currency: { select: { id: true, code: true, decimals: true } } } },
    },
  });
  type Total = { currencyId: string; code: string | null; decimals: number; in: number; out: number };
  const byRelationship = new Map<string, Map<string, Total>>();
  for (const row of rows) {
    if (!row.interaction || !row.from) continue;
    const totals = byRelationship.get(row.interaction.relationshipId) ?? new Map<string, Total>();
    const currency = row.from.currency;
    const total = totals.get(currency.id) ?? { currencyId: currency.id, code: currency.code, decimals: currency.decimals, in: 0, out: 0 };
    if (row.from.nodeId === ctx.actor.actingNodeId) total.out += row.amount;
    else total.in += row.amount;
    totals.set(currency.id, total);
    byRelationship.set(row.interaction.relationshipId, totals);
  }
  return (relationshipId: string) => [...(byRelationship.get(relationshipId)?.values() ?? [])];
}

export const relationshipsRouter = createTRPCRouter({
  /** One card per node the acting node has a relationship with. Filter by status and kind of interaction. */
  list: actingProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACTIVE", "CLOSED"]).optional(),
        interactionKind: interactionKind.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "VIEW");
      const me = ctx.actor.actingNodeId;
      const relationships = await ctx.db.relationship.findMany({
        where: {
          OR: [{ nodeAId: me }, { nodeBId: me }],
          ...(input.status ? { status: input.status } : {}),
          ...(input.interactionKind ? { interactions: { some: { kind: input.interactionKind } } } : {}),
        },
        include: {
          nodeA: { select: publicNode },
          nodeB: { select: publicNode },
          trustScore: true,
          interactions: { select: { kind: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      const totals = await totalsEachWay(ctx, relationships.map((r) => r.id));

      return relationships.map((r) => ({
        id: r.id,
        status: r.status,
        formedAt: r.formedAt,
        otherNode: r.nodeAId === me ? r.nodeB : r.nodeA,
        trustScore: r.trustScore?.value ?? startingTrust,
        totals: totals(r.id),
        interactionCount: r.interactions.length,
        openCount: r.interactions.filter((i) => ["PROPOSED", "ACTIVE", "PAUSED"].includes(i.status)).length,
      }));
    }),

  /** A relationship's interactions (with their current terms and open proposals) and its transactions. */
  detail: actingProcedure.input(z.object({ relationshipId: z.string().min(1) })).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const me = ctx.actor.actingNodeId;
    const r = await ctx.db.relationship.findUniqueOrThrow({
      where: { id: input.relationshipId },
      include: {
        nodeA: { select: publicNode },
        nodeB: { select: publicNode },
        trustScore: true,
        interactions: {
          orderBy: { createdAt: "desc" },
          include: {
            terms: { orderBy: { version: "desc" }, include: { currency: true } },
            proposals: { where: { status: "OPEN" }, include: { approvers: true } },
          },
        },
      },
    });
    assertSees(r.nodeAId === me || r.nodeBId === me, "relationship");

    const transactions = await ctx.db.transaction.findMany({
      where: { interaction: { relationshipId: r.id } },
      include: {
        // Payments and gifts never change currency, so the from-account's currency is the one.
        from: { select: { nodeId: true, currency: { select: { id: true, code: true, decimals: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const totals = await totalsEachWay(ctx, [r.id]);

    return {
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      formedAt: r.formedAt,
      otherNode: r.nodeAId === me ? r.nodeB : r.nodeA,
      trustScore: r.trustScore?.value ?? startingTrust,
      totals: totals(r.id),
      interactions: r.interactions.map(({ terms, proposals, ...interaction }) => ({
        ...interaction,
        actingNodePays: interaction.payerNodeId === me,
        // The terms in force; for an interaction not yet agreed, the proposed ones.
        currentTerms: terms.find((t) => t.approved) ?? terms[0] ?? null,
        openProposals: proposals,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        kind: t.kind,
        amount: t.amount,
        currency: t.from?.currency ?? null,
        comment: t.comment,
        createdAt: t.createdAt,
        interactionId: t.interactionId,
        direction: t.from?.nodeId === me ? ("out" as const) : ("in" as const),
      })),
    };
  }),
});
