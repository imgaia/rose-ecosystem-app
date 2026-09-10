import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const roseRouter = createTRPCRouter({
  listMembers: publicProcedure.query(({ ctx }) => {
    return ctx.db.member.findMany({
      include: { roles: true, wallet: true },
      orderBy: { createdAt: "asc" },
    });
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
        ...sent.map((t) => ({ type: "transaction" as const, direction: "out", withName: t.recipient.name, amount: t.amount, note: t.note, createdAt: t.createdAt })),
        ...received.map((t) => ({ type: "transaction" as const, direction: "in", withName: t.sender.name, amount: t.amount, note: t.note, createdAt: t.createdAt })),
        ...rewardsSent.map((r) => ({ type: "reward" as const, direction: "out", withName: r.recipient.name, amount: r.amount, note: r.note, createdAt: r.createdAt })),
        ...rewardsReceived.map((r) => ({ type: "reward" as const, direction: "in", withName: r.sender.name, amount: r.amount, note: r.note, createdAt: r.createdAt })),
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
        ...asA.map((r) => ({ otherId: r.memberB.id, otherName: r.memberB.name, strength: r.strength })),
        ...asB.map((r) => ({ otherId: r.memberA.id, otherName: r.memberA.name, strength: r.strength })),
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
      name: z.string().min(1),
      roles: z.array(z.enum(["SPONSOR", "CURATOR", "MAKER"])),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.member.create({
        data: {
          name: input.name,
          roles: { create: input.roles.map((role) => ({ role })) },
          wallet: { create: { currency: "ROSE", balance: 0 } },
        },
      })
    ),

  updateProfile: publicProcedure
    .input(z.object({
      memberId: z.string(),
      email: z.string().email().optional().or(z.literal("")),
      phoneNumber: z.string().optional().or(z.literal("")),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.member.update({
        where: { id: input.memberId },
        data: {
          // Store blank fields as null, not empty string — two members
          // both leaving email blank would otherwise violate the unique
          // constraint the moment a second person also submits "".
          email: input.email === "" ? null : input.email,
          phoneNumber: input.phoneNumber === "" ? null : input.phoneNumber,
        },
      })
    ),

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