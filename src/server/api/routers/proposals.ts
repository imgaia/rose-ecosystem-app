// src/server/api/routers/proposals.ts
// The inbox (UC-NET-01, the home screen) and reviewing and deciding a
// proposal (UC-NET-07): interaction proposals (new interactions, changed
// terms, payment requests) and a collection's role changes, new members and
// removals. Rule-value proposals come with that feature.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import type { Proposal } from "../../../../generated/prisma";
import { assertSees, permission, publicNode, type Ctx } from "./shared";

/** Everything a screen needs to show one proposal: what would change, who proposed it, who must approve. */
async function proposalView(ctx: Ctx, proposal: Proposal) {
  const payload = JSON.parse(proposal.payload) as {
    termsVersion?: number;
    amount?: number;
    currencyId?: string;
    comment?: string;
    // ROLE_CHANGE
    change?: "ADD" | "REMOVE";
    roleKey?: string;
    holderNodeId?: string;
    // MEMBER_REMOVAL
    memberNodeId?: string;
    reason?: string;
    share?: string;
  };
  const [proposer, proposedBy, approvers, interaction] = await Promise.all([
    ctx.db.node.findUniqueOrThrow({ where: { id: proposal.proposerNodeId }, select: publicNode }),
    ctx.db.node.findUniqueOrThrow({ where: { id: proposal.proposedByPersonId }, select: publicNode }),
    ctx.db.proposalApprover.findMany({ where: { proposalId: proposal.id } }),
    proposal.interactionId
      ? ctx.db.interaction.findUniqueOrThrow({
          where: { id: proposal.interactionId },
          include: { terms: { orderBy: { version: "desc" }, include: { currency: true } } },
        })
      : null,
  ]);
  const people = await ctx.db.node.findMany({
    where: {
      id: {
        in: [
          ...approvers.map((a) => a.approverNodeId),
          ...approvers.flatMap((a) => (a.decidedByPersonId ? [a.decidedByPersonId] : [])),
          ...(interaction ? [interaction.payerNodeId, interaction.payeeNodeId] : []),
          ...[proposal.subjectNodeId, payload.holderNodeId, payload.memberNodeId].filter((id): id is string => !!id),
        ],
      },
    },
    select: publicNode,
  });
  const node = (id: string | null) => people.find((p) => p.id === id) ?? null;

  const waitingOnMe = approvers.some((a) => a.approverNodeId === ctx.actor.actingNodeId && a.decision === null);
  const capability =
    proposal.status === "OPEN"
      ? await core.capabilityForProposal(ctx.db, proposal.id, ctx.actor.actingNodeId).catch(() => null)
      : null;
  const role = payload.roleKey ? await ctx.db.role.findUnique({ where: { key: payload.roleKey } }) : null;

  return {
    id: proposal.id,
    kind: proposal.kind,
    status: proposal.status,
    comment: proposal.comment,
    createdAt: proposal.createdAt,
    decidedAt: proposal.decidedAt,
    proposer,
    proposedBy,
    interaction: interaction && {
      id: interaction.id,
      kind: interaction.kind,
      status: interaction.status,
      relationshipId: interaction.relationshipId,
      payer: node(interaction.payerNodeId),
      payee: node(interaction.payeeNodeId),
    },
    // What would change: the proposed terms next to the ones in force (null for a new interaction).
    proposedTerms: interaction?.terms.find((t) => t.version === payload.termsVersion) ?? null,
    currentTerms: interaction?.terms.find((t) => t.approved) ?? null,
    paymentRequest:
      proposal.kind === "PAYMENT_REQUEST"
        ? {
            amount: payload.amount!,
            comment: payload.comment!,
            currency: await ctx.db.currency.findUnique({ where: { id: payload.currencyId! } }),
          }
        : null,
    // A collection's role change, new member (roleKey MEMBER) or removal.
    collection: node(proposal.subjectNodeId),
    roleChange:
      proposal.kind === "ROLE_CHANGE"
        ? { change: payload.change!, role: { key: payload.roleKey!, label: role?.label ?? payload.roleKey! }, holder: node(payload.holderNodeId!) }
        : null,
    removal:
      proposal.kind === "MEMBER_REMOVAL"
        ? { member: node(payload.memberNodeId!), reason: payload.reason!, share: payload.share! }
        : null,
    approvers: approvers.map((a) => ({
      node: node(a.approverNodeId),
      decision: a.decision,
      decidedBy: node(a.decidedByPersonId),
      decidedAt: a.decidedAt,
      comment: a.comment,
    })),
    waitingOnMe,
    // Whether this person may decide it for the acting node; "Needs TREASURER" if not.
    permission: capability ? await permission(ctx, capability) : null,
  };
}

export const proposalsRouter = createTRPCRouter({
  /** UC-NET-01: what is waiting on the acting node, and what it has proposed that is still open. */
  inbox: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    const me = ctx.actor.actingNodeId;
    const [waiting, sent] = await Promise.all([
      ctx.db.proposal.findMany({
        where: { status: "OPEN", approvers: { some: { approverNodeId: me, decision: null } } },
        orderBy: { createdAt: "desc" },
      }),
      ctx.db.proposal.findMany({ where: { status: "OPEN", proposerNodeId: me }, orderBy: { createdAt: "desc" } }),
    ]);
    return {
      waiting: await Promise.all(waiting.map((p) => proposalView(ctx, p))),
      sent: await Promise.all(sent.map((p) => proposalView(ctx, p))),
    };
  }),

  /** UC-NET-07: one proposal in full. Visible to the nodes asked to approve it. */
  review: actingProcedure.input(z.object({ proposalId: z.string().min(1) })).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const proposal = await ctx.db.proposal.findUniqueOrThrow({
      where: { id: input.proposalId },
      include: { approvers: { select: { approverNodeId: true } } },
    });
    assertSees(
      proposal.proposerNodeId === ctx.actor.actingNodeId ||
        proposal.approvers.some((a) => a.approverNodeId === ctx.actor.actingNodeId),
      "proposal",
    );
    return proposalView(ctx, proposal);
  }),

  /** The proposing node takes back an open proposal of any kind. */
  withdraw: actingProcedure.input(z.object({ proposalId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
    return core.withdrawAnyProposal(ctx.db, ctx.actor, input.proposalId);
  }),

  /** UC-NET-07: approve or decline for the acting node, with an optional comment. */
  decide: actingProcedure
    .input(z.object({ proposalId: z.string().min(1), approve: z.boolean(), comment: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
      return core.decideProposal(ctx.db, {
        proposalId: input.proposalId,
        approverNodeId: ctx.actor.actingNodeId,
        personId: ctx.actor.personId,
        approve: input.approve,
        comment: input.comment,
      });
    }),
});
