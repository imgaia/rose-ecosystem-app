// src/server/api/routers/wallet.ts
// The acting node's money (PRD 3.5): balances (UC-FIN-02), transaction
// history (UC-PAY-02), convert (UC-FIN-03), add funds (UC-FIN-04) and
// mint (UC-FIN-05). Seeing a node's balances needs VIEW_BALANCES
// (Treasurer); for an individual that is the person themselves.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import { minorUnits } from "./shared";

export const walletRouter = createTRPCRouter({
  /** Currencies to pick from when paying or proposing work. */
  currencies: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    return ctx.db.currency.findMany({ orderBy: [{ kind: "asc" }, { code: "asc" }] });
  }),

  /**
   * Every account of the acting node, primary fiat marked, reserves flagged.
   * Pass `totalInCurrencyId` for a total in one currency at today's rates
   * (reserves left out, since they are locked).
   */
  accounts: actingProcedure
    .input(z.object({ totalInCurrencyId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "VIEW_BALANCES");
      const accounts = await ctx.db.account.findMany({
        where: { nodeId: ctx.actor.actingNodeId },
        include: { currency: true },
        orderBy: [{ isReserve: "asc" }, { isPrimaryFiat: "desc" }, { createdAt: "asc" }],
      });
      const totalCurrency = input.totalInCurrencyId
        ? await ctx.db.currency.findUniqueOrThrow({ where: { id: input.totalInCurrencyId } })
        : null;

      let total: { currency: typeof totalCurrency; amount: number; missingRates: string[] } | null = null;
      if (totalCurrency) {
        total = { currency: totalCurrency, amount: 0, missingRates: [] };
        for (const a of accounts.filter((a) => !a.isReserve)) {
          const sign = a.balance < 0 ? -1 : 1;
          try {
            const rate = await core.getRate(ctx.db, a.currencyId, totalCurrency.id);
            total.amount += sign * core.applyRate(Math.abs(a.balance), a.currency.decimals, totalCurrency.decimals, rate);
          } catch {
            total.missingRates.push(a.currency.code ?? a.currency.name);
          }
        }
      }
      return { accounts, total };
    }),

  /** UC-PAY-02: the acting node's transactions, newest first, with filters. */
  transactions: actingProcedure
    .input(
      z.object({
        accountId: z.string().optional(),
        currencyId: z.string().optional(),
        relationshipId: z.string().optional(),
        interactionId: z.string().optional(),
        otherNodeId: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "VIEW_BALANCES");
      const me = ctx.actor.actingNodeId;
      const mine = { nodeId: me, ...(input.accountId ? { id: input.accountId } : {}), ...(input.currencyId ? { currencyId: input.currencyId } : {}) };
      const other = input.otherNodeId ? { nodeId: input.otherNodeId } : undefined;
      const rows = await ctx.db.transaction.findMany({
        where: {
          // R-VIS-01: only rows touching one of the acting node's accounts.
          OR: [
            { from: mine, ...(other ? { to: other } : {}) },
            { to: mine, ...(other ? { from: other } : {}) },
          ],
          ...(input.interactionId ? { interactionId: input.interactionId } : {}),
          ...(input.relationshipId ? { interaction: { relationshipId: input.relationshipId } } : {}),
          ...(input.from || input.to ? { createdAt: { gte: input.from, lte: input.to } } : {}),
        },
        include: {
          from: { include: { currency: true, node: { select: { id: true, name: true } } } },
          to: { include: { currency: true, node: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
      return rows.map((t) => {
        const out = t.from?.nodeId === me;
        const into = t.to?.nodeId === me;
        return {
          ...t,
          // "out", "in", or "own" for a move between the node's own accounts (exchange, mint).
          direction: out && into ? ("own" as const) : out ? ("out" as const) : ("in" as const),
          otherNode: out ? (t.to && !into ? t.to.node : null) : (t.from?.node ?? null),
        };
      });
    }),

  /** UC-FIN-03: what converting would give and how (through the reserves, or a straight swap), before confirming. */
  quoteExchange: actingProcedure
    .input(z.object({ fromAccountId: z.string().min(1), toCurrencyId: z.string().min(1), amount: minorUnits }))
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "EXCHANGE");
      return core.quoteConvert(ctx.db, ctx.actor, input);
    }),

  /** UC-FIN-03: convert a balance into another currency, through the issuers' reserves (core.convert). */
  exchange: actingProcedure
    .input(
      z.object({
        fromAccountId: z.string().min(1),
        toCurrencyId: z.string().min(1),
        amount: minorUnits,
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "EXCHANGE");
      return core.convert(ctx.db, ctx.actor, input);
    }),

  /** UC-FIN-04: record fiat paid into the bank outside the app; credits the primary fiat account. */
  addFunds: actingProcedure
    .input(z.object({ amount: minorUnits, reference: z.string().min(1), depositedOn: z.date() }))
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "ADD_FUNDS");
      return core.addFunds(ctx.db, ctx.actor, input);
    }),

  /** UC-FIN-05: how many units minting would create, before confirming. */
  quoteMint: actingProcedure
    .input(z.object({ sourceAccountId: z.string().min(1), amount: minorUnits, currencyId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "MINT");
      return core.quoteMint(ctx.db, ctx.actor, input);
    }),

  /** UC-FIN-05: lock the source amount in the reserve and mint the node's own currency. */
  mint: actingProcedure
    .input(
      z.object({
        sourceAccountId: z.string().min(1),
        amount: minorUnits,
        currencyId: z.string().optional(),
        comment: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "MINT");
      return core.mint(ctx.db, ctx.actor, input);
    }),
});
