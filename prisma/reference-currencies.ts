// prisma/reference-currencies.ts
// The currency reference data (PRD 2.8), shared by prisma/seed-reference.ts
// (new databases) and scripts/backfill-v10.ts (databases already on v0.8).
// Safe to run again: it only adds what is missing.
//
// - The fiat list (R-FIN-13): CHF (Switzerland) and EUR (the euro-area
//   countries), each with the ISO 3166 codes it is the currency of.
// - RCC: backed by CHF, priced at its reserve ratio (1.0 CHF) from the day
//   of the v0.8 migration, i.e. when ROSE Org (RCC's issuer) was created.
// - Today's CHF/EUR rate from the feed, once. If the feed can't be reached,
//   a clearly labelled MANUAL placeholder instead; the daily feed replaces it.

import type { PrismaClient } from "../generated/prisma";
import { runRateFeed } from "../src/server/core/rateFeed";
import { getRate, rateHistory, setRate } from "../src/server/core/rates";
import { getRule } from "../src/server/rules/index";

// The euro area in 2026: the countries whose currency is the euro.
const EURO_AREA = "AT,BE,BG,CY,DE,EE,ES,FI,FR,GR,HR,IE,IT,LT,LU,LV,MT,NL,PT,SI,SK";

const FIAT_LIST = [
  { code: "CHF", name: "Swiss franc", country: "CH" },
  { code: "EUR", name: "Euro", country: EURO_AREA },
] as const;

export const PLACEHOLDER_SET_BY = "seed:placeholder (feed offline; replace with scripts/set-rate.ts)";

export async function seedCurrencies(prisma: PrismaClient) {
  // Fiat list. Currency.code is not unique by design, so find by code + kind.
  for (const f of FIAT_LIST) {
    const found = await prisma.currency.findFirst({ where: { code: f.code, kind: "FIAT" } });
    if (!found) {
      await prisma.currency.create({ data: { ...f, kind: "FIAT", decimals: 2 } });
      console.log(`Created fiat ${f.code}.`);
    } else if (!found.country) {
      await prisma.currency.update({ where: { id: found.id }, data: { country: f.country } });
      console.log(`Set the countries of ${f.code}.`);
    }
  }
  const chf = await prisma.currency.findFirstOrThrow({ where: { code: "CHF", kind: "FIAT" } });
  const eur = await prisma.currency.findFirstOrThrow({ where: { code: "EUR", kind: "FIAT" } });

  // RCC, backed by CHF. Its issuer (ROSE Org) is set by scripts/migrate-v08.ts.
  let rcc = await prisma.currency.findFirst({ where: { code: "RCC", kind: "COMMUNITY" } });
  if (!rcc) {
    rcc = await prisma.currency.create({
      data: { code: "RCC", name: "Rose Currency Contribution", kind: "COMMUNITY", decimals: 2, reserveCurrencyId: chf.id },
    });
    console.log("Created currency RCC.");
  } else if (!rcc.reserveCurrencyId) {
    rcc = await prisma.currency.update({ where: { id: rcc.id }, data: { reserveCurrencyId: chf.id } });
    console.log("RCC's reserve fiat is now CHF.");
  }

  // RCC's price row (R-FIN-01): the reserve ratio, valid from the v0.8 migration.
  if ((await rateHistory(prisma, rcc.id, chf.id)).length === 0) {
    const issuer = rcc.issuerNodeId ? await prisma.node.findUnique({ where: { id: rcc.issuerNodeId } }) : null;
    const ratio = (await prisma.currencyRuleValue.findUnique({ where: { currencyId_ruleId: { currencyId: rcc.id, ruleId: "R-FIN-01" } } }))
      ?.value;
    const rate = ratio ?? String(getRule("R-FIN-01")?.default ?? "1");
    const validFrom = issuer?.createdAt ?? new Date();
    await setRate(prisma, { fromCurrencyId: rcc.id, toCurrencyId: chf.id, rate, validFrom, source: "RESERVE_RATIO", setBy: "seed" });
    console.log(`RCC price: ${rate} CHF, valid from ${validFrom.toISOString()}.`);
  }

  // Today's CHF/EUR rate, once.
  if ((await rateHistory(prisma, chf.id, eur.id)).length === 0) {
    const feed = await runRateFeed(prisma);
    if (feed.written.length > 0) {
      console.log(`Fetched from ${feed.source}: ${feed.written.map((w) => `1 ${w.from} = ${w.rate} ${w.to}`).join(", ")}.`);
    } else {
      await setRate(prisma, { fromCurrencyId: chf.id, toCurrencyId: eur.id, rate: "1", validFrom: new Date(), source: "MANUAL", setBy: PLACEHOLDER_SET_BY });
      console.warn(`WARNING: the rate feed failed (${feed.error ?? "no rate"}), so CHF/EUR is a MANUAL PLACEHOLDER of 1.`);
      console.warn("         Set the real rate with scripts/set-rate.ts, or run scripts/fetch-rates.ts once online.");
    }
  } else {
    console.log(`CHF/EUR rate already set: ${(await getRate(prisma, chf.id, eur.id)).text}.`);
  }
  return { chf, eur, rcc };
}
