// e2e/fixture.ts
// The browser tests' data: a small ROSE network in a throwaway SQLite
// database, built the way the real one grows. The schema comes from the
// migration SQL (as in src/server/core/test-helpers.ts), the reference data
// from prisma/seed-reference.ts, and the people, money and work from the
// app's own core functions.
//
// - Nora: founder, Owner and Treasurer of ROSE Org, which issues RCC (free).
// - Annie: joined from ROSE Org's invitation (Member), also an Owner. She
//   issues ABK, fiat-backed at 1 CHF.
// - Theo: joined from Nora's invitation.
// - ROSE Org minted 1,000 RCC; Nora deposited 500 CHF and bought 200 RCC
//   from ROSE Org in a trade, for 200 CHF. Her home currency is RCC.
// - Nora and Annie agreed work (a relationship with an interaction).
// - Theo issues TEO, free with 6 decimals like JCN, and minted 500 of it;
//   Annie issues ANN, free and never traded (no price yet). Annie pays Theo
//   for work on request: a relationship between two people other than Nora,
//   for the whole-network map.
// - One activity line in Annie's history is written as before the shared
//   formatter ("1.000000 TEO"), as dev's older lines are.

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import path from "path";

import { PrismaClient } from "../generated/prisma";
import { seedReference } from "../prisma/seed-reference";
import {
  acceptInvitation,
  addFunds,
  createInvitation,
  mint,
  proposeCurrencyChange,
  proposeTrade,
  proposeWork,
  recordActivity,
  respond,
  setHomeCurrency,
  setRate,
} from "../src/server/core";
import { roles } from "../src/server/rules/index";
import { COLLECTION, PASSWORD, USERS } from "./fixture-data";

const MIGRATIONS = ["v08-schema.sql", "v10-currencies.sql", "v10-reserves.sql", "v11-free-currencies.sql", "v11-amounts-64bit.sql"];

export async function buildFixture(url: string) {
  const client = createClient({ url });
  for (const file of MIGRATIONS) {
    await client.executeMultiple(readFileSync(path.join(process.cwd(), "scripts/migrations", file), "utf-8"));
  }
  client.close();

  const db = new PrismaClient({ datasourceUrl: url });
  try {
    // The fiat list with a fixed CHF/EUR rate first, so the seed doesn't fetch today's from the internet.
    const chf = await db.currency.create({ data: { code: "CHF", name: "Swiss franc", kind: "FIAT", decimals: 2, country: "CH" } });
    const eur = await db.currency.create({
      data: { code: "EUR", name: "Euro", kind: "FIAT", decimals: 2, country: "AT,BE,BG,CY,DE,EE,ES,FI,FR,GR,HR,IE,IT,LT,LU,LV,MT,NL,PT,SI,SK" },
    });
    await setRate(db, { fromCurrencyId: chf.id, toCurrencyId: eur.id, rate: "1.08", validFrom: new Date("2026-01-01"), source: "MANUAL", setBy: "e2e fixture" });
    await seedReference(db); // roles, capabilities, the capability map, RCC and its price

    // Nora, the founder: made directly, as acceptInvitation would make her.
    const nora = await db.node.create({
      data: {
        kind: "INDIVIDUAL",
        name: `${USERS.nora.firstName} ${USERS.nora.lastName}`,
        firstName: USERS.nora.firstName,
        lastName: USERS.nora.lastName,
        username: USERS.nora.username,
        passwordHash: bcrypt.hashSync(PASSWORD, 10),
        country: "CH",
        homeCurrencyId: chf.id,
      },
    });
    await db.roleAssignment.createMany({ data: roles.native.map((roleKey) => ({ scopeNodeId: nora.id, holderNodeId: nora.id, roleKey })) });
    await db.account.create({ data: { nodeId: nora.id, currencyId: chf.id, isPrimaryFiat: true } });

    // ROSE Org issues RCC; Nora is its Member, Owner and Treasurer.
    const rose = await db.node.create({ data: { kind: "COLLECTION", name: COLLECTION, country: "CH", homeCurrencyId: chf.id } });
    await db.roleAssignment.createMany({
      data: ["MEMBER", "OWNER", "TREASURER"].map((roleKey) => ({ scopeNodeId: rose.id, holderNodeId: nora.id, roleKey })),
    });
    await db.account.create({ data: { nodeId: rose.id, currencyId: chf.id, isPrimaryFiat: true } });
    const rcc = await db.currency.findFirstOrThrow({ where: { code: "RCC", kind: "COMMUNITY" } });
    await db.currency.update({ where: { id: rcc.id }, data: { issuerNodeId: rose.id } });

    const asNora = { personId: nora.id, actingNodeId: nora.id };
    const asNoraForRose = { personId: nora.id, actingNodeId: rose.id };

    // Annie and Theo join from invitations, as people do.
    const join = async (actor: typeof asNora, user: (typeof USERS)["annie" | "theo"]) => {
      const { token } = await createInvitation(db, actor, { name: `${user.firstName} ${user.lastName}`, email: `${user.username}@example.org` });
      return acceptInvitation(db, token, { ...user, password: PASSWORD, email: `${user.username}@example.org` });
    };
    const annie = await join(asNoraForRose, USERS.annie);
    await db.roleAssignment.create({ data: { scopeNodeId: rose.id, holderNodeId: annie.id, roleKey: "OWNER" } });
    const theo = await join(asNora, USERS.theo);
    // Annie's own fiat-backed currency: something Convert can buy through a reserve.
    await proposeCurrencyChange(db, { personId: annie.id, actingNodeId: annie.id }, {
      action: "CREATE",
      fields: { name: "Annie's Bakery", code: "ABK", backing: "FIAT", reserveRatio: "1" },
    });

    // Money: ROSE Org mints RCC (free); Nora deposits 500 CHF and buys 200 RCC from ROSE Org in a trade.
    await mint(db, asNoraForRose, { amount: 100_000n, currencyId: rcc.id });
    await addFunds(db, asNora, { amount: 50_000n, reference: "E2E deposit", depositedOn: new Date() });
    const trade = await proposeTrade(db, asNora, {
      toNodeId: rose.id,
      give: { amount: 20_000n, currencyId: chf.id },
      get: { amount: 20_000n, currencyId: rcc.id },
    });
    await respond(db, asNoraForRose, { proposalId: trade.proposal.id, approve: true });
    await setHomeCurrency(db, asNora, { currencyId: rcc.id });
    await setHomeCurrency(db, asNoraForRose, { currencyId: rcc.id });

    // A relationship: Nora pays Annie for agreed work.
    const { proposal } = await proposeWork(db, asNora, {
      otherNodeId: annie.id,
      actingNodePays: true,
      terms: { description: "Garden design", amount: 5_000n, currencyId: rcc.id },
    });
    await respond(db, { personId: annie.id, actingNodeId: annie.id }, { proposalId: proposal.id, approve: true });

    // Free currencies: Theo's TEO (6 decimals) to trade, Annie's ANN never traded.
    const asTheo = { personId: theo.id, actingNodeId: theo.id };
    const asAnnie = { personId: annie.id, actingNodeId: annie.id };
    await proposeCurrencyChange(db, asTheo, { action: "CREATE", fields: { name: "Theo's hours", code: "TEO", decimals: 6 } });
    const teo = await db.currency.findFirstOrThrow({ where: { code: "TEO" } });
    await mint(db, asTheo, { amount: 500_000_000n, currencyId: teo.id });
    await proposeCurrencyChange(db, asAnnie, { action: "CREATE", fields: { name: "Annie's notes", code: "ANN" } });
    await mint(db, asAnnie, { amount: 5_000n, currencyId: (await db.currency.findFirstOrThrow({ where: { code: "ANN" } })).id });

    // Annie and Theo: work paid on request, so nothing is due without a request.
    const work = await proposeWork(db, asTheo, {
      otherNodeId: annie.id,
      actingNodePays: false,
      terms: { description: "Shelves", amount: 3_000n, currencyId: rcc.id, paymentMode: "ON_REQUEST" },
    });
    await respond(db, asAnnie, { proposalId: work.proposal.id, approve: true });

    // As dev's older lines read, before amounts went through the shared formatter.
    // On Annie: little is added to her history later, so it stays on her Home in both test widths.
    await recordActivity(db, { type: "note", refId: teo.id, nodeIds: [annie.id], summary: "Annie Test noted a tip of 1.000000 TEO" });
  } finally {
    await db.$disconnect();
  }
}
