// src/server/api/routers/identity.ts
// Editing the acting node's identity (UC-ID-02 to UC-ID-04). Every procedure
// needs EDIT_IDENTITY in the acting node: for a person that is themselves,
// for a collection its Owners. Username and password are a person's own.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import { publicNode } from "./shared";

const optionalText = z.string().max(500).nullish();

export const identityRouter = createTRPCRouter({
  /** What the edit screen fills in: the node's identity, with email, phone and (for a person) username. */
  get: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "EDIT_IDENTITY");
    return ctx.db.node.findUniqueOrThrow({
      where: { id: ctx.actor.actingNodeId },
      select: { ...publicNode, email: true, phone: true, username: true, country: true },
    });
  }),

  /** UC-ID-02: names, description, email, phone, photo, country. Fields left out stay; blank ones are cleared. */
  update: actingProcedure
    .input(
      z.object({
        firstName: optionalText,
        lastName: optionalText,
        name: optionalText,
        description: z.string().max(2000).nullish(),
        email: z.union([z.string().email("That email doesn't look right"), z.literal("")]).nullish(),
        phone: optionalText,
        photoUrl: optionalText,
        country: optionalText,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "EDIT_IDENTITY");
      const node = await core.updateIdentity(ctx.db, ctx.actor, input);
      return { id: node.id, name: node.name };
    }),

  /** UC-ID-03 */
  changeUsername: actingProcedure.input(z.object({ username: z.string().min(1).max(100) })).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, "EDIT_IDENTITY");
    const node = await core.changeUsername(ctx.db, ctx.actor, input.username);
    return { username: node.username };
  }),

  /** UC-ID-04: needs the current password. */
  changePassword: actingProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(core.MIN_PASSWORD_LENGTH, "Use at least 8 characters") }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "EDIT_IDENTITY");
      await core.changePassword(ctx.db, ctx.actor, input);
      return { changed: true };
    }),
});
