// src/server/api/routers/currencies.ts
// Node currencies (PRD 2.8) for the screens: the Currencies screen (S15),
// a currency's detail (S27), creating and changing one (UC-FIN-07 to 09),
// and the home currency and primary fiat (R-FIN-04, R-FIN-13). The rules
// live in src/server/core/currencies.ts; this file only gathers what the
// screens show.

import { z } from "zod";
import * as core from "~/server/core";
import { actingProcedure, createTRPCRouter, requireCan } from "~/server/api/trpc";
import type { Currency } from "../../../../generated/prisma";
import { publicNode, type Ctx } from "./shared";

/** A currency as the screens list it: with its price in its reserve fiat, its policy and ratio. */
async function listed(ctx: Ctx, currency: Currency) {
  const price = await core.priceOf(ctx.db, currency.id);
  const community = currency.kind === "COMMUNITY";
  return {
    ...currency,
    price: price && { rate: price.rate, fiat: { id: price.fiat.id, code: price.fiat.code, decimals: price.fiat.decimals } },
    policy: community ? await core.conversionPolicy(ctx.db, currency.id) : null,
    reserveRatio: community ? await core.reserveRatio(ctx.db, currency.id) : null,
  };
}

function inverted(text: string) {
  const { num, den } = core.parseDecimal(text);
  return core.rateOf(den, num).text;
}

const fields = z.object({
  name: z.string().max(100),
  code: z.string().max(20),
  description: z.string().max(1000).nullish(),
  decimals: z.number().int().min(0).max(6),
  reserveRatio: z.string().max(30),
  policy: z.enum(["reserve", "open"]),
});

export const currenciesRouter = createTRPCRouter({
  /** S15: home currency, primary fiat, what the node issues and holds, and the choices for each Change. */
  overview: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    const me = ctx.actor.actingNodeId;
    const [node, primaryFiat, issued, fiatList, memberships] = await Promise.all([
      ctx.db.node.findUniqueOrThrow({ where: { id: me }, select: { id: true, kind: true, name: true, country: true } }),
      core.primaryFiatOf(ctx.db, me).catch(() => null),
      ctx.db.currency.findMany({ where: { issuerNodeId: me }, orderBy: { createdAt: "asc" } }),
      ctx.db.currency.findMany({ where: { kind: "FIAT" }, orderBy: { createdAt: "asc" } }),
      ctx.db.roleAssignment.findMany({ where: { holderNodeId: me, roleKey: "MEMBER", endedAt: null, scopeNodeId: { not: me } }, select: { scopeNodeId: true } }),
    ]);
    const home = await core.homeCurrencyOf(ctx.db, me).catch(() => null);
    const inherited = await ctx.db.currency.findMany({
      where: { issuerNodeId: { in: memberships.map((m) => m.scopeNodeId) }, status: "ACTIVE" },
      include: { issuer: { select: { name: true } } },
    });

    // Held: every spending account outside the node's own currencies. Balances need VIEW_BALANCES.
    const seesBalances = (await core.can(ctx.db, ctx.actor.personId, me, "VIEW_BALANCES")).allowed;
    const accounts = seesBalances
      ? await ctx.db.account.findMany({
          where: { nodeId: me, isReserve: false, currency: { OR: [{ issuerNodeId: null }, { issuerNodeId: { not: me } }] } },
          include: { currency: { include: { issuer: { select: { id: true, name: true } } } } },
          orderBy: { createdAt: "asc" },
        })
      : null;

    return {
      node,
      home,
      primaryFiat,
      fiatList,
      // R-FIN-04: the primary fiat, a collection's currency (as a Member), or one of its own.
      homeChoices: [
        ...(primaryFiat ? [{ id: primaryFiat.id, label: `${primaryFiat.code} · primary fiat` }] : []),
        ...issued.filter((c) => c.status === "ACTIVE").map((c) => ({ id: c.id, label: `${c.code ?? c.name} · issued by ${node.name}` })),
        ...inherited.map((c) => ({ id: c.id, label: `${c.code ?? c.name} · from ${c.issuer?.name ?? "a collection"}` })),
      ],
      issued: await Promise.all(issued.map((c) => listed(ctx, c))),
      held: accounts && (await Promise.all(accounts.map(async (a) => ({ account: { id: a.id, balance: a.balance }, ...(await listed(ctx, a.currency)), issuer: a.currency.issuer })))),
    };
  }),

  /** For pickers and the price lines on Convert: each currency with its price now. */
  prices: actingProcedure.input(z.object({ currencyIds: z.array(z.string()).max(50) })).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const currencies = await ctx.db.currency.findMany({ where: { id: { in: input.currencyIds } } });
    return Promise.all(currencies.map((c) => listed(ctx, c)));
  }),

  /** The fiat list (R-FIN-13), for the country picker on Edit identity. */
  fiatList: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    return ctx.db.currency.findMany({ where: { kind: "FIAT" }, select: { id: true, code: true, name: true, country: true }, orderBy: { createdAt: "asc" } });
  }),

  /**
   * S27: anyone sees what the currency is, its price and history, policy and
   * status. The issuer's Treasurers (VIEW_BALANCES there) also see what backs it.
   */
  detail: actingProcedure.input(z.object({ currencyId: z.string().min(1) })).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const currency = await ctx.db.currency.findUniqueOrThrow({ where: { id: input.currencyId }, include: { issuer: { select: publicNode } } });
    const item = await listed(ctx, currency);
    const history = currency.reserveCurrencyId ? await core.rateHistory(ctx.db, currency.id, currency.reserveCurrencyId) : [];
    const issuerId = currency.issuerNodeId;
    const seesBacking = !!issuerId && (await core.can(ctx.db, ctx.actor.personId, issuerId, "VIEW_BALANCES")).allowed;
    const open = issuerId
      ? (await ctx.db.proposal.findMany({ where: { kind: "CURRENCY_CHANGE", subjectNodeId: issuerId, status: "OPEN" } })).find(
          (p) => (JSON.parse(p.payload) as { currencyId?: string }).currencyId === currency.id,
        )
      : undefined;
    // Fiat: today's rates against the other fiats on the list.
    const otherFiats = currency.kind === "FIAT" ? await ctx.db.currency.findMany({ where: { kind: "FIAT", id: { not: currency.id } } }) : [];
    const fiatRates = await Promise.all(
      otherFiats.map(async (f) => ({ code: f.code, rate: (await core.getRate(ctx.db, currency.id, f.id).catch(() => null))?.text ?? null })),
    );

    return {
      ...item,
      issuer: currency.issuer,
      actingIsIssuer: issuerId === ctx.actor.actingNodeId,
      everHeld: await core.everHeld(ctx.db, currency.id),
      openProposalId: open?.id ?? null,
      history: history.map((r) => ({
        id: r.id,
        // Price rows are written currency -> reserve fiat; one stored the other way round is inverted.
        rate: r.fromCurrencyId === currency.id ? r.rate : inverted(r.rate),
        source: r.source,
        validFrom: r.validFrom,
        validTo: r.validTo,
      })),
      fiatRates,
      backing: seesBacking && currency.kind === "COMMUNITY" ? await core.currencyBacking(ctx.db, currency.id) : null,
    };
  }),

  /** UC-FIN-07 to 09: create, edit, retire or delete one of the acting node's currencies (R-FIN-11). */
  propose: actingProcedure
    .input(
      z.discriminatedUnion("action", [
        z.object({ action: z.literal("CREATE"), fields, comment: z.string().max(500).optional() }),
        z.object({ action: z.literal("EDIT"), currencyId: z.string().min(1), fields: fields.partial(), comment: z.string().max(500).optional() }),
        z.object({ action: z.literal("RETIRE"), currencyId: z.string().min(1), comment: z.string().max(500).optional() }),
        z.object({ action: z.literal("DELETE"), currencyId: z.string().min(1), comment: z.string().max(500).optional() }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      await requireCan(ctx, "SET_UP_CURRENCY");
      const proposal = await core.proposeCurrencyChange(ctx.db, ctx.actor, input);
      return { id: proposal.id, status: proposal.status };
    }),

  /** R-FIN-04 */
  setHome: actingProcedure.input(z.object({ currencyId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, "SET_UP_CURRENCY");
    const node = await core.setHomeCurrency(ctx.db, ctx.actor, input);
    return { homeCurrencyId: node.homeCurrencyId };
  }),

  /** R-FIN-07, R-FIN-13 */
  setPrimaryFiat: actingProcedure.input(z.object({ currencyId: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await requireCan(ctx, "SET_UP_CURRENCY");
    const account = await core.setPrimaryFiat(ctx.db, ctx.actor, input);
    return { accountId: account.id };
  }),
});
