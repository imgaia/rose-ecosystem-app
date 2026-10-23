// src/server/api/routers/invitations.ts
// Invitations (UC-INV-01 to UC-INV-03). Sending and managing them works like
// every other action: acting node first, then the rules check (INVITE).
// `preview` and `join` are the two exceptions with no acting node, because
// the invitee has no account yet; the link's token is what lets them in.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, publicProcedure, requireCan } from "~/server/api/trpc";

/** The path of the join screen (built in step 6). The token is only ever shown here, once. */
const joinPath = (token: string) => `/join?token=${encodeURIComponent(token)}`;

const byInvitation = z.object({ invitationId: z.string().min(1) });

export const invitationsRouter = createTRPCRouter({
  /** UC-INV-03: the acting node's invitations: pending, accepted, expired and revoked. */
  list: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "INVITE");
    const invitations = await ctx.db.invitation.findMany({
      where: { inviterNodeId: ctx.actor.actingNodeId },
      // Never send the token hash to a screen.
      select: { id: true, name: true, email: true, phone: true, status: true, expiresAt: true, acceptedNodeId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return invitations.map((i) => ({ ...i, status: core.effectiveStatus(i) }));
  }),

  /** UC-INV-01: invite someone. Returns the personal link to pass on (email sending comes later). */
  create: actingProcedure
    .input(z.object({ name: z.string().min(1), email: z.string().email().optional(), phone: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "INVITE");
      const { invitation, token } = await core.createInvitation(ctx.db, ctx.actor, input);
      return { invitationId: invitation.id, expiresAt: invitation.expiresAt, joinPath: joinPath(token) };
    }),

  /** UC-INV-03: a fresh link and expiry; the old link stops working. */
  resend: actingProcedure.input(byInvitation).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, "INVITE");
    const { invitation, token } = await core.resendInvitation(ctx.db, ctx.actor, input.invitationId);
    return { invitationId: invitation.id, expiresAt: invitation.expiresAt, joinPath: joinPath(token) };
  }),

  /** UC-INV-03 */
  revoke: actingProcedure.input(byInvitation).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, "INVITE");
    const invitation = await core.revokeInvitation(ctx.db, ctx.actor, input.invitationId);
    return { invitationId: invitation.id, status: invitation.status };
  }),

  /** UC-INV-02, before signing up: who invited me, and is the link still good? No sign-in. */
  preview: publicProcedure.input(z.object({ token: z.string().min(1) })).query(async ({ ctx, input }) => {
    return core.previewInvitation(ctx.db, input.token);
  }),

  /** UC-INV-02: join. Creates the person's node; the screen then signs in via /api/login. No sign-in. */
  join: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        firstName: z.string().min(1),
        lastName: z.string().optional(),
        username: z.string().min(1),
        password: z.string().min(8, "Use at least 8 characters"),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { token, ...details } = input;
      const node = await core.acceptInvitation(ctx.db, token, details);
      return { nodeId: node.id, username: node.username };
    }),
});
