// src/server/api/routers/shared.ts
// Small pieces the routers share: what of a node may be sent to a screen,
// the zod shape of interaction terms, and the visibility check (R-VIS-01).

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { can, RuleError, type Actor } from "~/server/core";
import type { Prisma } from "../../../../generated/prisma";
import type { db } from "~/server/db";

export type Ctx = { db: typeof db; actor: Actor };

/** The node fields a screen may see. Never includes the password hash. */
export const publicNode = {
  id: true,
  kind: true,
  status: true,
  name: true,
  firstName: true,
  lastName: true,
  description: true,
  photoUrl: true,
} satisfies Prisma.NodeSelect;

/** Amounts arrive as whole minor units (cents), never decimals. */
export const minorUnits = z.number().int().positive();

export const termsInput = z.object({
  description: z.string(),
  amount: minorUnits,
  currencyId: z.string().min(1),
  frequency: z.enum(["ONCE", "WEEKLY", "MONTHLY"]).optional(),
  paymentMode: z.enum(["AUTOMATIC", "ON_REQUEST"]).optional(),
  startDate: z.date().nullish(),
  endDate: z.date().nullish(),
  maxPayments: z.number().int().positive().nullish(),
});

/** R-VIS-01: refuse when the acting node is not part of what is being opened. */
export function assertSees(visible: boolean, what: string) {
  if (!visible) throw new RuleError(`This node can't see that ${what}`, ["R-VIS-01"]);
}

/** For a screen that shows an action but disables it: the rules check result, without throwing. */
export async function permission(ctx: Ctx, capability: string) {
  const result = await can(ctx.db, ctx.actor.personId, ctx.actor.actingNodeId, capability);
  return result.allowed
    ? { capability, allowed: true as const, needsRoles: [] as string[], blockedBy: [] as string[] }
    : {
        capability,
        allowed: false as const,
        needsRoles: result.blockedBy.flatMap((b) => b.needsRoles),
        blockedBy: result.blockedBy.map((b) => b.ruleId),
      };
}

export function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found` });
}
