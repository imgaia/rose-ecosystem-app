// src/server/api/routers/interactions.ts
// Every interaction action from src/server/core/interactions.ts (UC-INT-01
// to UC-INT-08, UC-INT-10), plus an interaction's detail.
//
// The capability needed depends on the acting node's side (R-REL-07): PAY
// for the paying side, INTERACT for the paid side. Each procedure works that
// out and runs the rules check before calling core, which checks again
// inside its database transaction.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import { assertSees, permission, publicNode, termsInput } from "./shared";

const byInteraction = z.object({ interactionId: z.string().min(1) });
const byProposal = z.object({ proposalId: z.string().min(1), comment: z.string().optional() });

export const interactionsRouter = createTRPCRouter({
  /** An interaction: every version of its terms, its proposals and approvals, and its transactions. */
  detail: actingProcedure.input(byInteraction).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const me = ctx.actor.actingNodeId;
    const interaction = await ctx.db.interaction.findUniqueOrThrow({
      where: { id: input.interactionId },
      include: {
        terms: { orderBy: { version: "desc" }, include: { currency: true } },
        proposals: { orderBy: { createdAt: "desc" }, include: { approvers: true } },
        transactions: { orderBy: { createdAt: "desc" } },
        curators: true,
        verifications: { orderBy: { createdAt: "desc" } },
      },
    });
    assertSees(interaction.payerNodeId === me || interaction.payeeNodeId === me, "interaction");

    const [payer, payee] = await Promise.all([
      ctx.db.node.findUniqueOrThrow({ where: { id: interaction.payerNodeId }, select: publicNode }),
      ctx.db.node.findUniqueOrThrow({ where: { id: interaction.payeeNodeId }, select: publicNode }),
    ]);
    const capability = await core.capabilityOnInteraction(ctx.db, interaction.id, me);
    return {
      ...interaction,
      payer,
      payee,
      actingNodePays: interaction.payerNodeId === me,
      currentTerms: interaction.terms.find((t) => t.approved) ?? null,
      // Whether this person may act on it for the acting node, e.g. "Needs TREASURER".
      permission: await permission(ctx, capability),
    };
  }),

  /** UC-INT-01: send a payment or gift. The recipient accepts it from their inbox. */
  sendPayment: actingProcedure
    .input(z.object({ toNodeId: z.string().min(1), kind: z.enum(["PAYMENT", "GIFT"]).default("PAYMENT"), terms: termsInput }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "PAY");
      return core.sendPayment(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-02: ask another node for a one-off payment. */
  requestPayment: actingProcedure
    .input(
      z.object({ fromNodeId: z.string().min(1), amount: z.number().int().positive(), currencyId: z.string().min(1), comment: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "INTERACT");
      return core.requestPayment(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-02 within work: the paid side asks for a payment; defaults to the agreed price. */
  requestWorkPayment: actingProcedure
    .input(
      byInteraction.extend({
        comment: z.string(),
        amount: z.number().int().positive().optional(),
        currencyId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
      return core.requestWorkPayment(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-03: propose work, saying which side pays. */
  proposeWork: actingProcedure
    .input(
      z.object({
        otherNodeId: z.string().min(1),
        actingNodePays: z.boolean(),
        terms: termsInput,
        curatorNodeIds: z.array(z.string().min(1)).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, input.actingNodePays ? "PAY" : "INTERACT");
      return core.proposeWork(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-04: accept a proposal waiting on the acting node (same as proposals.decide with approve). */
  accept: actingProcedure.input(byProposal).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
    return core.accept(ctx.db, ctx.actor, input.proposalId, input.comment);
  }),

  /** UC-INT-04: decline, with an optional reason. */
  decline: actingProcedure.input(byProposal).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
    return core.decline(ctx.db, ctx.actor, input.proposalId, input.comment);
  }),

  /** UC-INT-04 step 4 (work only): answer with changed terms. */
  counterPropose: actingProcedure
    .input(byProposal.extend({ changes: termsInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
      return core.counterPropose(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-06: the proposer takes back a proposal not yet accepted. */
  withdraw: actingProcedure.input(z.object({ proposalId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityForProposal(ctx.db, input.proposalId, ctx.actor.actingNodeId));
    return core.withdrawProposal(ctx.db, ctx.actor, input.proposalId);
  }),

  /** UC-INT-05 / UC-INT-10: propose new terms; the current ones stay in force until accepted. */
  amend: actingProcedure
    .input(byInteraction.extend({ changes: termsInput.partial(), comment: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
      return core.amend(ctx.db, ctx.actor, input);
    }),

  /** UC-INT-07 */
  pause: actingProcedure.input(byInteraction).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
    return core.pause(ctx.db, ctx.actor, input.interactionId);
  }),

  /** UC-INT-07 */
  resume: actingProcedure.input(byInteraction).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
    return core.resume(ctx.db, ctx.actor, input.interactionId);
  }),

  /** UC-INT-08 */
  complete: actingProcedure.input(byInteraction).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
    return core.complete(ctx.db, ctx.actor, input.interactionId);
  }),

  /** UC-INT-08 / UC-INT-10: cancel; schedules stop. */
  cancel: actingProcedure.input(byInteraction).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, await core.capabilityOnInteraction(ctx.db, input.interactionId, ctx.actor.actingNodeId));
    return core.cancel(ctx.db, ctx.actor, input.interactionId);
  }),
});
