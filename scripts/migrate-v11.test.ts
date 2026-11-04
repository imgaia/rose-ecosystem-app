// scripts/migrate-v11.test.ts
// Runs scripts/migrate-v11.ts on a throwaway copy of the 4 Nov 2026 seed
// candidate (dev data, scrubbed), after v11-free-currencies.sql and
// v11-amounts-64bit.sql (the order for dev in step 11c). Also checks that
// v11-amounts-64bit.sql keeps every amount as it was.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { priceOf } from "../src/server/core/currencies";
import { findRate, rateHistory } from "../src/server/core/rates";
import { createDbFromBackup } from "../src/server/core/test-helpers";
import { migrateV11, type V11Report } from "./migrate-v11";

let copy: Awaited<ReturnType<typeof createDbFromBackup>>;
let report: V11Report;
const now = new Date();

beforeAll(async () => {
  copy = await createDbFromBackup("prisma/seed-candidates/2026-11-04-dev.json", ["v11-free-currencies.sql", "v11-amounts-64bit.sql"]);
  report = await migrateV11(copy.db, now);
});
afterAll(async () => {
  await copy.cleanup();
});

const currency = (code: string) => copy.db.currency.findFirstOrThrow({ where: { code, kind: "COMMUNITY" } });

describe("migrate-v11 on the 4 Nov seed candidate", () => {
  it("makes the currencies with a reserve fiat-backed, keeping their ratio, and the rest free", async () => {
    expect(report.after.map((c) => [c.code, c.backing, c.ratio])).toEqual([
      ["RCC", "FREE", null],
      ["GAIA", "FIAT", "1"],
      ["JCN", "FIAT", "0.13"],
      ["THC", "FIAT", "3"],
      ["RCR", "FIAT", "3"],
      ["RBO", "FREE", null],
    ]);
    expect(report.removedRatios).toEqual(["RBO"]);
    expect(report.removedPolicyValues).toBe(5);
    expect(await copy.db.currencyRuleValue.count({ where: { ruleId: "R-FIN-10" } })).toBe(0);
  });

  it("closes the free currencies' reserve-ratio prices without deleting them", async () => {
    expect(report.closedRateRows).toBe(2); // RCC's and RBO's
    const rbo = await currency("RBO");
    const rows = await rateHistory(copy.db, rbo.id, rbo.reserveCurrencyId!);
    expect(rows.map((r) => [r.rate, r.source, r.validTo?.toISOString()])).toEqual([["100", "RESERVE_RATIO", now.toISOString()]]);
    expect(await priceOf(copy.db, rbo.id)).toBeNull();
    // The backed ones keep theirs.
    expect((await priceOf(copy.db, (await currency("JCN")).id))?.rate).toBe("0.13");
  });

  it("gives RCC a starting rate of 1 CHF from the v0.8 migration, and leaves its reserve as it was", async () => {
    const rcc = await currency("RCC");
    expect(report.rccInitial).toEqual({ rate: "1", validFrom: new Date("2026-10-25T12:51:42.841Z") });
    const rows = await rateHistory(copy.db, rcc.id, rcc.reserveCurrencyId!);
    expect(rows.map((r) => [r.source, r.rate, r.validTo === null])).toEqual(
      expect.arrayContaining([
        ["INITIAL", "1", true],
        ["RESERVE_RATIO", "1", false],
      ]),
    );
    expect((await findRate(copy.db, rcc.id, rcc.reserveCurrencyId!))?.text).toBe("1");
    expect((await findRate(copy.db, rcc.id, rcc.reserveCurrencyId!, new Date("2026-11-01")))?.text).toBe("1");
    expect(report.frozenReserves).toEqual(["RCC (304.00 CHF)"]);
  });

  it("changes nothing in the ledger: every balance unchanged and equal to its ledger", () => {
    expect(report.transactions).toEqual({ before: 57, after: 57 });
    expect(report.balances).toEqual({ accounts: 34, changed: 0, notMatchingLedger: 0 });
  });

  it("is safe to run again", async () => {
    const again = await migrateV11(copy.db, new Date(now.getTime() + 1_000));
    expect(again.after).toEqual(report.after);
    expect(again).toMatchObject({ closedRateRows: 0, removedRatios: [], removedPolicyValues: 0, rccInitial: "already there" });
    expect(again.balances).toEqual({ accounts: 34, changed: 0, notMatchingLedger: 0 });
  });

  it("stops before changing anything when a currency has more than 8 decimal places", async () => {
    const jcn = await currency("JCN");
    await copy.db.currency.update({ where: { id: jcn.id }, data: { decimals: 9 } });
    await expect(migrateV11(copy.db)).rejects.toThrow(/JCN \(9\)/);
    await copy.db.currency.update({ where: { id: jcn.id }, data: { decimals: 6 } });
  });
});

describe("v11-amounts-64bit.sql on the 4 Nov seed candidate", () => {
  const AMOUNTS = { Account: ["balance"], Transaction: ["amount", "toAmount"], InteractionTerms: ["amount", "counterAmount"] };
  // Every row's amounts as text (exact whatever the column's declared type), by id.
  const amounts = (db: typeof copy.db) =>
    Promise.all(
      Object.entries(AMOUNTS).map(([table, columns]) =>
        db.$queryRawUnsafe<Record<string, string | null>[]>(
          `SELECT id, ${columns.map((c) => `CAST("${c}" AS TEXT) AS "${c}"`).join(", ")} FROM "${table}" ORDER BY id`,
        ),
      ),
    );

  it("declares the amount columns BIGINT and keeps every value, row count and index", async () => {
    const before = await createDbFromBackup("prisma/seed-candidates/2026-11-04-dev.json", ["v11-free-currencies.sql"]);
    try {
      expect(await amounts(copy.db)).toEqual(await amounts(before.db));
      for (const [table, columns] of Object.entries(AMOUNTS)) {
        const info = await copy.db.$queryRawUnsafe<{ name: string; type: string }[]>(`PRAGMA table_info("${table}")`);
        const types = Object.fromEntries(info.map((c) => [c.name, c.type]));
        for (const c of columns) expect(types[c]).toBe("BIGINT");
        const indexes = `SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = '${table}' ORDER BY name`;
        expect(await copy.db.$queryRawUnsafe(indexes)).toEqual(await before.db.$queryRawUnsafe(indexes));
      }
      expect(await copy.db.$queryRawUnsafe("PRAGMA foreign_key_check")).toEqual([]);
    } finally {
      await before.cleanup();
    }
  });
});
