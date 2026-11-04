import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RuleError } from "./errors";
import { applyRate, findRate, getRate, parseDecimal, parseRate, publishRate, rateHistory, rateOf, setRate } from "./rates";
import { createTestDb, type TestDb } from "./test-helpers";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.cleanup();
});

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const fiat = (code: string, country: string) => t.db.currency.create({ data: { name: code, code, kind: "FIAT", country } });
const coin = (code: string) => t.db.currency.create({ data: { name: code, code, kind: "COMMUNITY" } });

describe("rates", () => {
  it("parses decimals exactly and writes fractions as decimals when it can", () => {
    expect(parseDecimal("1.25")).toEqual({ num: 125n, den: 100n });
    expect(() => parseDecimal("-1")).toThrow();
    expect(() => parseDecimal("0")).toThrow();
    expect(rateOf(125n, 100n).text).toBe("1.25");
    expect(rateOf(1n, 4n).text).toBe("0.25");
    expect(rateOf(100n, 107n).text).toBe("100/107");
    // A trade's rate with no exact decimal is stored as a fraction and read back exactly.
    expect(parseRate("100/107")).toMatchObject({ num: 100n, den: 107n });
    expect(parseRate("0.25")).toMatchObject({ num: 1n, den: 4n });
    expect(() => parseRate("0/3")).toThrow();
  });

  it("converts in whole minor units, rounding down", () => {
    expect(applyRate(1_000n, 2, 2, rateOf(1n, 1n))).toBe(1_000n);
    expect(applyRate(1_000n, 2, 2, rateOf(1n, 3n))).toBe(333n);
    expect(applyRate(1_000n, 2, 0, rateOf(1n, 1n))).toBe(10n);
  });

  it("a new rate closes the previous one; a past date finds the rate valid then (R-FIN-15)", async () => {
    const usd = await fiat("USD", "US");
    const gbp = await fiat("GBP", "GB");
    const base = { fromCurrencyId: usd.id, toCurrencyId: gbp.id, source: "FEED" as const, setBy: "test" };
    await setRate(t.db, { ...base, rate: "0.8", validFrom: day("2026-10-01") });
    await setRate(t.db, { ...base, rate: "0.75", validFrom: day("2026-10-10") });

    const history = await rateHistory(t.db, usd.id, gbp.id);
    expect(history.map((r) => [r.rate, r.validTo?.toISOString() ?? null])).toEqual([
      ["0.75", null],
      ["0.8", day("2026-10-10").toISOString()],
    ]);
    expect((await getRate(t.db, usd.id, gbp.id, day("2026-10-05"))).text).toBe("0.8");
    expect((await getRate(t.db, usd.id, gbp.id)).text).toBe("0.75");
    expect((await getRate(t.db, gbp.id, usd.id)).text).toBe("4/3"); // the other direction, inverted
    await expect(getRate(t.db, usd.id, gbp.id, day("2026-09-01"))).rejects.toThrow(RuleError);

    // A rate can't start before the current one, and never changes the rows before it.
    await expect(setRate(t.db, { ...base, rate: "0.7", validFrom: day("2026-10-05") })).rejects.toThrow(/after the current/);
  });

  it("works out a rate between two node currencies through their prices and the fiat rate", async () => {
    const usd = await fiat("USX", "UX");
    const gbp = await fiat("GBX", "GX");
    await setRate(t.db, { fromCurrencyId: usd.id, toCurrencyId: gbp.id, rate: "0.5", validFrom: day("2026-01-01"), source: "FEED", setBy: "t" });
    const coin = await t.db.currency.create({ data: { name: "Coin", code: "CO", kind: "COMMUNITY", reserveCurrencyId: usd.id } });
    const leaf = await t.db.currency.create({ data: { name: "Leaf", code: "LF", kind: "COMMUNITY", reserveCurrencyId: gbp.id } });
    const price = { validFrom: day("2026-01-01"), source: "RESERVE_RATIO" as const, setBy: "t" };
    await setRate(t.db, { ...price, fromCurrencyId: coin.id, toCurrencyId: usd.id, rate: "2" });
    await setRate(t.db, { ...price, fromCurrencyId: leaf.id, toCurrencyId: gbp.id, rate: "0.25" });

    // 1 CO = 2 USX = 1 GBX = 4 LF
    expect((await getRate(t.db, coin.id, leaf.id)).text).toBe("4");
    expect((await getRate(t.db, leaf.id, coin.id)).text).toBe("0.25");
    expect((await getRate(t.db, coin.id, gbp.id)).text).toBe("1");
    expect((await getRate(t.db, t.rcc.id, t.chf.id)).text).toBe("1"); // RCC's price row from the test setup
  });

  it("has no price yet for a pair it can't work out: null from findRate, R-FIN-05 from getRate", async () => {
    const lone = await fiat("LON", "LO");
    expect(await findRate(t.db, t.chf.id, lone.id)).toBeNull();
    const error = await getRate(t.db, t.chf.id, lone.id).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RuleError);
    expect((error as RuleError).ruleIds).toEqual(["R-FIN-05"]);
  });

  it("the most recent rate for a pair counts, whatever its source and direction (R-FIN-16)", async () => {
    const [p, q] = [await coin("P1"), await coin("Q1")];
    await setRate(t.db, { fromCurrencyId: p.id, toCurrencyId: q.id, rate: "3", validFrom: day("2026-01-01"), source: "MANUAL", setBy: "t" });
    await publishRate(t.db, { fromCurrencyId: q.id, toCurrencyId: p.id, rate: "1/2", source: "TRADE", setBy: "t" });
    expect((await findRate(t.db, p.id, q.id))?.text).toBe("2");
    await publishRate(t.db, { fromCurrencyId: p.id, toCurrencyId: q.id, rate: "2.5", source: "TRADE", setBy: "t" });
    await publishRate(t.db, { fromCurrencyId: p.id, toCurrencyId: q.id, rate: "4", source: "TRADE", setBy: "t" }); // same millisecond is fine
    expect((await findRate(t.db, p.id, q.id))?.text).toBe("4");
    expect((await rateHistory(t.db, p.id, q.id)).filter((r) => r.validTo === null)).toHaveLength(1);
    expect((await findRate(t.db, p.id, q.id, day("2026-06-01")))?.text).toBe("3"); // the rate valid then
  });

  it("chains current rates, shortest first, at most 3 steps; beyond that no price yet", async () => {
    const [a, b, c, d, e] = await Promise.all(["CA", "CB", "CC", "CD", "CE"].map(coin));
    const link = (x: { id: string }, y: { id: string }, rate: string) =>
      setRate(t.db, { fromCurrencyId: x.id, toCurrencyId: y.id, rate, validFrom: day("2026-01-01"), source: "TRADE", setBy: "t" });
    await link(a!, b!, "2");
    await link(b!, c!, "3");
    await link(c!, d!, "5");
    await link(d!, e!, "7");
    expect((await findRate(t.db, a!.id, c!.id))?.text).toBe("6");
    expect((await findRate(t.db, d!.id, a!.id))?.text).toBe("1/30");
    expect((await findRate(t.db, a!.id, d!.id))?.text).toBe("30"); // 3 steps
    expect(await findRate(t.db, a!.id, e!.id)).toBeNull(); // 4 steps: too far
    expect(await findRate(t.db, a!.id, c!.id, new Date(), { maxSteps: 1 })).toBeNull();
    // A shorter chain wins over a longer one.
    await link(a!, d!, "29");
    expect((await findRate(t.db, a!.id, d!.id))?.text).toBe("29");
  });
});
