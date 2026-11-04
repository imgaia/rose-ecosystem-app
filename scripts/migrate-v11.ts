// scripts/migrate-v11.ts
// Step 11: sorts the existing node currencies into free and fiat-backed
// (PRD 2.8), on a database that already has scripts/migrations/v11-free-currencies.sql
// (until then every currency reads as FREE, the column's default):
//   - a currency whose own reserve holds more than 0 becomes FIAT, keeping its
//     reserve ratio (R-FIN-01);
//   - every other node currency becomes FREE (R-FIN-17): its reserve-ratio
//     price rows are closed (validTo = now, never deleted), since those were
//     prices the issuer chose alone, and its ratio value is removed;
//   - RCC becomes FREE whatever its reserve holds, with an INITIAL rate of
//     1 CHF from the v0.8 migration (when its first price row started). What
//     its reserve holds stays there, untouched, and is reported;
//   - the conversion-policy values (R-FIN-10, dropped in step 11) are removed.
// It stops before changing anything if a currency has more than 8 decimal
// places (R-FIN-18). It moves no money and writes nothing to the ledger; the
// report shows every balance unchanged and equal to its ledger.
// Safe to run again: the split depends only on the reserves, and RCC's
// INITIAL row is written once.
//
// Refuses DB_TARGET=production for now.
//
// Usage:
//   npx tsx scripts/migrate-v11.ts                  (local)
//   DB_TARGET=dev npx tsx scripts/migrate-v11.ts    (dev, in step 11c)

import { pathToFileURL } from "url";
import { formatAmount } from "../src/lib/money";
import { ledgerBalance } from "../src/server/core/ledger";
import { closeCurrentRates, findRate, rateHistory, setRate } from "../src/server/core/rates";
import type { CurrencyBacking, PrismaClient } from "../generated/prisma";
import { createPrismaFor, getDbTarget } from "./db-target";

const MAX_DECIMALS = 8;

export interface CurrencyLine {
  code: string;
  issuer: string;
  decimals: number;
  reserve: string; // what its own reserve holds, as text
  reserveMinor: number; // the same in minor units (0 if it has none)
  ratio: string | null;
  price: string | null; // current rate in its reserve fiat
  backing: CurrencyBacking;
}

export interface V11Report {
  before: CurrencyLine[];
  after: CurrencyLine[];
  closedRateRows: number;
  removedRatios: string[]; // codes of currencies that became free and lost a ratio value
  removedPolicyValues: number;
  rccInitial: { rate: string; validFrom: Date } | "already there" | "no RCC";
  frozenReserves: string[]; // free currencies whose reserve still holds something
  transactions: { before: number; after: number };
  balances: { accounts: number; changed: number; notMatchingLedger: number };
}

/** RCC as the seed finds it: by code and kind (Currency.code is not unique by design). */
const isRcc = (c: { code: string | null; kind: string }) => c.code === "RCC" && c.kind === "COMMUNITY";

export async function migrateV11(prisma: PrismaClient, now = new Date()): Promise<V11Report> {
  const tooPrecise = await prisma.currency.findMany({ where: { decimals: { gt: MAX_DECIMALS } }, select: { code: true, name: true, decimals: true } });
  if (tooPrecise.length > 0) {
    throw new Error(
      `Stopped, nothing changed: more than ${MAX_DECIMALS} decimal places (R-FIN-18): ${tooPrecise.map((c) => `${c.code ?? c.name} (${c.decimals})`).join(", ")}`,
    );
  }

  const balancesBefore = new Map((await prisma.account.findMany({ select: { id: true, balance: true } })).map((a) => [a.id, a.balance]));
  const txBefore = await prisma.transaction.count();
  const before = await currencyLines(prisma, now);

  const result = await prisma.$transaction(
    async (tx) => {
      let closedRateRows = 0;
      const removedRatios: string[] = [];
      let rccInitial: V11Report["rccInitial"] = "no RCC";

      const currencies = await tx.currency.findMany({ where: { kind: "COMMUNITY" }, orderBy: { createdAt: "asc" } });
      for (const c of currencies) {
        const reserve = await tx.account.findFirst({ where: { isReserve: true, backsCurrencyId: c.id } });
        const backing: CurrencyBacking = !isRcc(c) && (reserve?.balance ?? 0) > 0 ? "FIAT" : "FREE";

        if (backing === "FIAT") {
          // Keep its ratio; if only the price row has it, store it as the ratio too.
          const ratioKey = { currencyId_ruleId: { currencyId: c.id, ruleId: "R-FIN-01" } };
          if (!(await tx.currencyRuleValue.findUnique({ where: ratioKey }))) {
            const price = c.reserveCurrencyId ? await findRate(tx, c.id, c.reserveCurrencyId, now, { maxSteps: 1 }) : null;
            if (!price) throw new Error(`Stopped, nothing changed: ${c.code} has a reserve but no reserve ratio or price`);
            await tx.currencyRuleValue.create({ data: { currencyId: c.id, ruleId: "R-FIN-01", value: price.text } });
          }
        } else {
          closedRateRows += await closeCurrentRates(tx, { currencyId: c.id, source: "RESERVE_RATIO", at: now });
          const { count } = await tx.currencyRuleValue.deleteMany({ where: { currencyId: c.id, ruleId: "R-FIN-01" } });
          if (count > 0) removedRatios.push(c.code ?? c.name);
        }
        await tx.currency.update({ where: { id: c.id }, data: { backing } });

        if (isRcc(c) && c.reserveCurrencyId) {
          const history = await rateHistory(tx, c.id, c.reserveCurrencyId);
          if (history.some((r) => r.source === "INITIAL")) {
            rccInitial = "already there";
          } else {
            // From the v0.8 migration: when its first price row started (else when ROSE Org was created).
            const issuer = c.issuerNodeId ? await tx.node.findUnique({ where: { id: c.issuerNodeId } }) : null;
            const validFrom = history.at(-1)?.validFrom ?? issuer?.createdAt ?? now;
            await setRate(tx, { fromCurrencyId: c.id, toCurrencyId: c.reserveCurrencyId, rate: "1", validFrom, source: "INITIAL", setBy: "script:migrate-v11" });
            rccInitial = { rate: "1", validFrom };
          }
        }
      }

      const policies = await tx.currencyRuleValue.deleteMany({ where: { ruleId: "R-FIN-10" } });
      return { closedRateRows, removedRatios, rccInitial, removedPolicyValues: policies.count };
    },
    { timeout: 120_000 },
  );

  const after = await currencyLines(prisma, now);
  const accounts = await prisma.account.findMany({ select: { id: true, balance: true } });
  let changed = 0;
  let notMatchingLedger = 0;
  for (const a of accounts) {
    if (balancesBefore.get(a.id) !== a.balance) changed += 1;
    if ((await ledgerBalance(prisma, a.id)) !== a.balance) notMatchingLedger += 1;
  }

  return {
    before,
    after,
    ...result,
    frozenReserves: after.filter((c) => c.backing === "FREE" && c.reserveMinor > 0).map((c) => `${c.code} (${c.reserve})`),
    transactions: { before: txBefore, after: await prisma.transaction.count() },
    balances: { accounts: accounts.length, changed, notMatchingLedger },
  };
}

/** One line per node currency, for the report. */
async function currencyLines(prisma: PrismaClient, at: Date): Promise<CurrencyLine[]> {
  const currencies = await prisma.currency.findMany({
    where: { kind: "COMMUNITY" },
    include: { issuer: { select: { name: true } }, reserveCurrency: true },
    orderBy: { createdAt: "asc" },
  });
  return Promise.all(
    currencies.map(async (c) => {
      const reserve = await prisma.account.findFirst({ where: { isReserve: true, backsCurrencyId: c.id } });
      const ratio = await prisma.currencyRuleValue.findUnique({ where: { currencyId_ruleId: { currencyId: c.id, ruleId: "R-FIN-01" } } });
      const fiat = c.reserveCurrency;
      const price = fiat ? await findRate(prisma, c.id, fiat.id, at, { maxSteps: 1 }) : null;
      return {
        code: c.code ?? c.name,
        issuer: c.issuer?.name ?? "-",
        decimals: c.decimals,
        reserve: reserve && fiat ? formatAmount(reserve.balance, fiat.decimals, fiat.code) : "none",
        reserveMinor: reserve?.balance ?? 0,
        ratio: ratio?.value ?? null,
        price: price && fiat ? `${price.text} ${fiat.code}` : null,
        backing: c.backing,
      };
    }),
  );
}

function printReport(r: V11Report) {
  const table = (lines: CurrencyLine[]) =>
    lines.forEach((c) =>
      console.log(
        `  ${c.code.padEnd(6)} ${c.issuer.padEnd(22)} ${c.backing.padEnd(5)} dec ${String(c.decimals).padEnd(2)} reserve ${c.reserve.padEnd(14)} ratio ${(c.ratio ?? "-").padEnd(6)} price ${c.price ?? "no price yet"}`,
      ),
    );
  console.log("Before (every currency reads FREE until this script sets it):");
  table(r.before);
  console.log("After:");
  table(r.after);
  console.log(`Reserve-ratio price rows closed: ${r.closedRateRows}`);
  console.log(`Reserve ratios removed from free currencies: ${r.removedRatios.join(", ") || "none"}`);
  console.log(`Conversion-policy values removed (R-FIN-10): ${r.removedPolicyValues}`);
  console.log(
    `RCC starting rate: ${typeof r.rccInitial === "string" ? r.rccInitial : `${r.rccInitial.rate} CHF (INITIAL), valid from ${r.rccInitial.validFrom.toISOString()}`}`,
  );
  console.log(`Reserves left untouched behind free currencies: ${r.frozenReserves.join(", ") || "none"}`);
  console.log(`Transactions: ${r.transactions.before} before, ${r.transactions.after} after.`);
  console.log(`Check: ${r.balances.accounts} accounts, ${r.balances.changed} balances changed, ${r.balances.notMatchingLedger} differ from their ledger.`);
}

// Run only when called as a script (the test imports migrateV11).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = getDbTarget();
  if (target === "production") {
    console.error("Refusing to run against PRODUCTION for now.");
    process.exit(1);
  }
  console.log(`Sorting currencies into free and fiat-backed on the ${target.toUpperCase()} database.`);
  const prisma = createPrismaFor(target);
  migrateV11(prisma)
    .then((report) => {
      printReport(report);
      const ok = report.balances.changed === 0 && report.balances.notMatchingLedger === 0 && report.transactions.before === report.transactions.after;
      if (!ok) process.exitCode = 1;
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
