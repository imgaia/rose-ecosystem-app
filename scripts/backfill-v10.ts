// scripts/backfill-v10.ts
// Fills in step 10's new columns and tables on a database already on the v0.8
// model, after scripts/migrations/v10-currencies.sql has been applied:
//   - the fiat list (CHF, EUR), RCC backed by CHF, RCC's price row and
//     today's CHF/EUR rate (prisma/reference-currencies.ts, as the seed does);
//   - every node without a country gets CH;
//   - home currency: RCC for the members migrated from Phase 1 (those with an
//     opening balance) and for ROSE Org; the primary fiat for everyone else;
//   - a node-level reserve ratio (R-FIN-01, now per currency) is copied onto
//     each currency that node issues.
// Then it checks that every balance still equals the sum of its ledger rows.
// Moves no money. Safe to run again: it only fills what is still empty.
//
// Refuses DB_TARGET=production for now.
//
// Usage:
//   npx tsx scripts/backfill-v10.ts                  (local)
//   DB_TARGET=dev npx tsx scripts/backfill-v10.ts    (dev)

import { getDbTarget, createPrismaFor } from "./db-target";
import { seedCurrencies } from "../prisma/reference-currencies";
import { ledgerBalance } from "../src/server/core/ledger";
import { primaryFiatOf } from "../src/server/core/currencies";

const target = getDbTarget();
if (target === "production") {
  console.error("Refusing to run against PRODUCTION for now.");
  process.exit(1);
}
console.log(`Backfilling node currencies on the ${target.toUpperCase()} database.`);
const prisma = createPrismaFor(target);

async function main() {
  const { rcc } = await seedCurrencies(prisma);

  const countries = await prisma.node.updateMany({ where: { country: null }, data: { country: "CH" } });
  console.log(`Country CH set on ${countries.count} nodes.`);

  // Migrated members: an OPENING_BALANCE row on one of their accounts (scripts/migrate-v08.ts).
  const openings = await prisma.transaction.findMany({
    where: { kind: "OPENING_BALANCE" },
    select: { from: { select: { nodeId: true } }, to: { select: { nodeId: true } } },
  });
  const migrated = new Set(openings.flatMap((t) => [t.from?.nodeId, t.to?.nodeId]).filter((id): id is string => !!id));
  if (rcc.issuerNodeId) migrated.add(rcc.issuerNodeId);

  let toRcc = 0;
  let toFiat = 0;
  const unset: string[] = [];
  for (const node of await prisma.node.findMany({ where: { homeCurrencyId: null }, select: { id: true, name: true } })) {
    if (migrated.has(node.id)) {
      await prisma.node.update({ where: { id: node.id }, data: { homeCurrencyId: rcc.id } });
      toRcc += 1;
      continue;
    }
    const fiat = await primaryFiatOf(prisma, node.id).catch(() => null);
    if (!fiat) {
      unset.push(node.name);
      continue;
    }
    await prisma.node.update({ where: { id: node.id }, data: { homeCurrencyId: fiat.id } });
    toFiat += 1;
  }
  console.log(`Home currency: RCC for ${toRcc} nodes, primary fiat for ${toFiat}.`);
  if (unset.length > 0) console.log(`  No primary fiat found, left unset: ${unset.join(", ")}`);

  // R-FIN-01 was set per node before; it is now per currency.
  const ratios = await prisma.nodeRuleValue.findMany({ where: { ruleId: "R-FIN-01" } });
  for (const value of ratios) {
    for (const currency of await prisma.currency.findMany({ where: { issuerNodeId: value.nodeId } })) {
      const key = { currencyId_ruleId: { currencyId: currency.id, ruleId: "R-FIN-01" } };
      if (await prisma.currencyRuleValue.findUnique({ where: key })) continue;
      await prisma.currencyRuleValue.create({ data: { currencyId: currency.id, ruleId: "R-FIN-01", value: value.value } });
      console.log(`Reserve ratio ${value.value} copied onto ${currency.code ?? currency.name}.`);
    }
  }
  if (ratios.length === 0) console.log("No node-level reserve ratios to copy.");

  // The check: every stored balance equals the sum of its ledger rows.
  const accounts = await prisma.account.findMany({ include: { node: { select: { name: true } }, currency: { select: { code: true } } } });
  let mismatches = 0;
  for (const account of accounts) {
    const fromLedger = await ledgerBalance(prisma, account.id);
    if (fromLedger !== account.balance) {
      mismatches += 1;
      console.log(`  MISMATCH ${account.node.name} ${account.currency.code}: stored ${account.balance}, ledger ${fromLedger}`);
    }
  }
  console.log(`Check: ${accounts.length} accounts, ${mismatches} balances differ from their ledger.`);
  if (mismatches > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
