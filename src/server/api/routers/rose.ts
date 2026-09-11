import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Single source of truth for how a member's name is displayed. Change
// this one function later (e.g. to firstName + last initial, or a
// separate "screen name" field) and every part of the app that shows a
// name picks up the change automatically.
function displayName(member: { firstName: string; lastName: string }) {
  return member.lastName ? `${member.firstName} ${member.lastName}` : member.firstName;
}

// Detects a duplicate-value error and, where possible, which field caused
// it — checked two different ways, because the two database connections
// we use surface this differently: Prisma's plain SQLite connector (local
// dev) gives a typed error with code "P2002" and a `meta.target` listing
// the field, while the Turso/libSQL driver adapter (production) passes
// through a raw, untyped error whose message contains
// "UNIQUE constraint failed: Member.email" instead. Returns the field
// name if detected (or "value" if a constraint failed but the specific
// field couldn't be parsed out), otherwise null.
function getUniqueConstraintField(err: unknown): string | null {
  if (!err || typeof err !== "object") return null;
  if ("code" in err && err.code === "P2002") {
    const meta = "meta" in err ? (err.meta as { target?: string[] } | undefined) : undefined;
    return meta?.target?.[0] ?? "value";
  }
  if ("message" in err && typeof err.message === "string" && err.message.includes("UNIQUE constraint failed")) {
    const match = /UNIQUE constraint failed: \w+\.(\w+)/.exec(err.message);
    return match?.[1] ?? "value";
  }
  return null;
}

export const roseRouter = createTRPCRouter({
  listMembers: publicProcedure.query(async ({ ctx }) => {
    const members = await ctx.db.member.findMany({
      include: { roles: true, wallet: true },
      orderBy: { createdAt: "asc" },
    });
    return members.map((m) => ({ ...m, name: displayName(m) }));
  }),

  getWallet: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      const wallet = await ctx.db.wallet.findUnique({ where: { memberId: input.memberId } });

      const [sent, received, rewardsSent, rewardsReceived, evaluations] = await Promise.all([
        ctx.db.transaction.findMany({ where: { senderId: input.memberId }, include: { recipient: true } }),
        ctx.db.transaction.findMany({ where: { recipientId: input.memberId }, include: { sender: true } }),
        ctx.db.reward.findMany({ where: { senderId: input.memberId }, include: { recipient: true } }),
        ctx.db.reward.findMany({ where: { recipientId: input.memberId }, include: { sender: true } }),
        ctx.db.evaluation.findMany({ where: { curatorId: input.memberId } }),
      ]);

      const activity = [
        ...sent.map((t) => ({ type: "transaction" as const, direction: "out", withName: displayName(t.recipient), amount: t.amount, note: t.note, createdAt: t.createdAt })),
        ...received.map((t) => ({ type: "transaction" as const, direction: "in", withName: displayName(t.sender), amount: t.amount, note: t.note, createdAt: t.createdAt })),
        ...rewardsSent.map((r) => ({ type: "reward" as const, direction: "out", withName: displayName(r.recipient), amount: r.amount, note: r.note, createdAt: r.createdAt })),
        ...rewardsReceived.map((r) => ({ type: "reward" as const, direction: "in", withName: displayName(r.sender), amount: r.amount, note: r.note, createdAt: r.createdAt })),
        ...evaluations.map((e) => ({ type: "evaluation" as const, direction: "out", withName: e.subject, amount: null, note: e.note, createdAt: e.createdAt })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return { balance: wallet?.balance ?? 0, currency: wallet?.currency ?? "ROSE", activity };
    }),

  sendTransaction: publicProcedure
    .input(z.object({
      senderId: z.string(),
      recipientId: z.string(),
      amount: z.number().positive(),
      note: z.string().optional(),
      isPrivate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const senderWallet = await tx.wallet.findUnique({ where: { memberId: input.senderId } });
        if (!senderWallet || senderWallet.balance < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough funds to complete this transaction.",
          });
        }
        await tx.wallet.update({ where: { memberId: input.senderId }, data: { balance: { decrement: input.amount } } });
        await tx.wallet.update({ where: { memberId: input.recipientId }, data: { balance: { increment: input.amount } } });
        return tx.transaction.create({ data: input });
      });
    }),

  createEvaluation: publicProcedure
    .input(z.object({ curatorId: z.string(), subject: z.string(), note: z.string().optional() }))
    .mutation(({ ctx, input }) => ctx.db.evaluation.create({ data: input })),

  sendReward: publicProcedure
    .input(z.object({
      senderId: z.string(),
      recipientId: z.string(),
      amount: z.number().positive(),
      note: z.string().optional(),
      isRecurring: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const senderWallet = await tx.wallet.findUnique({ where: { memberId: input.senderId } });
        if (!senderWallet || senderWallet.balance < input.amount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough funds to send this reward.",
          });
        }
        await tx.wallet.update({ where: { memberId: input.senderId }, data: { balance: { decrement: input.amount } } });
        await tx.wallet.update({ where: { memberId: input.recipientId }, data: { balance: { increment: input.amount } } });
        return tx.reward.create({ data: input });
      });
    }),

  getRelationships: publicProcedure
    .input(z.object({ memberId: z.string() }))
    .query(async ({ ctx, input }) => {
      const asA = await ctx.db.relationshipStrength.findMany({ where: { memberAId: input.memberId }, include: { memberB: true } });
      const asB = await ctx.db.relationshipStrength.findMany({ where: { memberBId: input.memberId }, include: { memberA: true } });
      return [
        ...asA.map((r) => ({ otherId: r.memberB.id, otherName: displayName(r.memberB), strength: r.strength })),
        ...asB.map((r) => ({ otherId: r.memberA.id, otherName: displayName(r.memberA), strength: r.strength })),
      ];
    }),

  setRelationshipStrength: publicProcedure
    .input(z.object({ memberAId: z.string(), memberBId: z.string(), strength: z.number().min(0).max(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.relationshipStrength.upsert({
        where: { memberAId_memberBId: { memberAId: input.memberAId, memberBId: input.memberBId } },
        update: { strength: input.strength },
        create: input,
      })
    ),

  addMember: publicProcedure
    .input(z.object({
      firstName: z.string().min(1),
      roles: z.array(z.enum(["SPONSOR", "CURATOR", "MAKER"])),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const member = await ctx.db.member.create({
          data: {
            firstName: input.firstName,
            // Placeholder, same convention as the original migration —
            // the new member corrects both in their own profile later.
            lastName: input.firstName,
            username: input.firstName,
            roles: { create: input.roles.map((role) => ({ role })) },
            wallet: { create: { currency: "ROSE", balance: 0 } },
          },
        });
        return { ...member, name: displayName(member) };
      } catch (err: unknown) {
        if (getUniqueConstraintField(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `"${input.firstName}" is already taken as a username — ask the new member to pick a different first name for now, they can adjust it in their profile.`,
          });
        }
        throw err;
      }
    }),

  updateProfile: publicProcedure
    .input(z.object({
      memberId: z.string(),
      firstName: z.string().min(1),
      lastName: z.string().optional().or(z.literal("")),
      email: z.string().email().optional().or(z.literal("")),
      phoneNumber: z.string().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const member = await ctx.db.member.update({
          where: { id: input.memberId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName ?? "",
            // Store blank fields as null, not empty string — two members
            // both leaving email blank would otherwise violate the unique
            // constraint the moment a second person also submits "".
            email: input.email === "" ? null : input.email,
            phoneNumber: input.phoneNumber === "" ? null : input.phoneNumber,
          },
        });
        return { ...member, name: displayName(member) };
      } catch (err: unknown) {
        const field = getUniqueConstraintField(err);
        if (field === "email") {
          throw new TRPCError({ code: "CONFLICT", message: "That email is already in use by another member." });
        }
        if (field === "phoneNumber") {
          throw new TRPCError({ code: "CONFLICT", message: "That phone number is already in use by another member." });
        }
        if (field) {
          throw new TRPCError({ code: "CONFLICT", message: "That value is already in use by another member." });
        }
        throw err;
      }
    }),

  updateUsername: publicProcedure
    .input(z.object({ memberId: z.string(), username: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.member.update({
          where: { id: input.memberId },
          data: { username: input.username },
        });
      } catch (err: unknown) {
        if (getUniqueConstraintField(err)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That username is already taken.",
          });
        }
        throw err;
      }
    }),

  updateRoles: publicProcedure
    .input(z.object({
      memberId: z.string(),
      roles: z.array(z.enum(["SPONSOR", "CURATOR", "MAKER"])).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Clear existing roles and recreate from the submitted set — simpler
      // and less error-prone than diffing which roles were added/removed.
      await ctx.db.$transaction([
        ctx.db.memberRole.deleteMany({ where: { memberId: input.memberId } }),
        ctx.db.memberRole.createMany({
          data: input.roles.map((role) => ({ memberId: input.memberId, role })),
        }),
      ]);
      return ctx.db.member.findUnique({
        where: { id: input.memberId },
        include: { roles: true },
      });
    }),
});