// src/server/api/routers/members.ts
// A collection's roles and members (UC-COL-04, UC-COL-05, UC-COL-06,
// UC-COL-10, UC-GOV-02). The acting node is the collection. Changes that need
// approval become proposals, decided from the inbox like any other.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";

export const membersRouter = createTRPCRouter({
  /** UC-COL-06: an Owner proposes adding or removing a role holder. */
  proposeRoleChange: actingProcedure
    .input(
      z.object({
        holderNodeId: z.string().min(1),
        roleKey: z.string().min(1),
        change: z.enum(["ADD", "REMOVE"]),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "EDIT_GOVERNANCE");
      return core.proposeRoleChange(ctx.db, ctx.actor, input);
    }),

  /** UC-COL-04: the nodes an Owner can add: their own relationships who aren't members yet. */
  candidates: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "ADD_MEMBERS");
    return core.memberCandidates(ctx.db, ctx.actor);
  }),

  /** UC-COL-04: propose the Member role for one of them; they and the Owners approve. */
  proposeAddMember: actingProcedure
    .input(z.object({ nodeId: z.string().min(1), comment: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "ADD_MEMBERS");
      return core.proposeAddMember(ctx.db, ctx.actor, input);
    }),

  /** UC-COL-05: leave the acting collection, giving up every role there. */
  leave: actingProcedure.mutation(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    await core.leaveCollection(ctx.db, ctx.actor);
    return { left: true };
  }),

  /** UC-COL-10: any member proposes removing another, with a reason. */
  proposeRemoval: actingProcedure
    .input(z.object({ memberNodeId: z.string().min(1), reason: z.string().min(1, "Give a reason").max(1000) }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "PROPOSE_REMOVAL");
      return core.proposeRemoval(ctx.db, ctx.actor, input);
    }),
});
