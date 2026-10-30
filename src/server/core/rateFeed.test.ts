import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runRateFeed, type RateSourceAdapter } from "./rateFeed";
import { getRate, rateHistory } from "./rates";
import { createTestDb, type TestDb } from "./test-helpers";

// The feed adapter is a stand-in: no network in tests.
let t: TestDb;
let eurId: string;
beforeAll(async () => {
  t = await createTestDb();
  eurId = (await t.db.currency.create({ data: { name: "Euro", code: "EUR", kind: "FIAT", country: "DE" } })).id;
});
afterAll(async () => {
  await t.cleanup();
});

const source = (rates: Record<string, string> | Error): RateSourceAdapter => ({
  name: "Test feed",
  latest: vi.fn(async () => {
    if (rates instanceof Error) throw rates;
    return rates;
  }),
});
const at = (iso: string) => new Date(iso);

describe("the daily rate feed", () => {
  it("writes a FEED row for a new or changed rate, and nothing when it is unchanged", async () => {
    const first = await runRateFeed(t.db, source({ EUR: "1.07" }), at("2026-10-28T05:00:00Z"));
    expect(first).toMatchObject({ written: [{ from: "CHF", to: "EUR", rate: "1.07" }], unchanged: [], error: null });

    const same = await runRateFeed(t.db, source({ EUR: "1.070" }), at("2026-10-29T05:00:00Z"));
    expect(same).toMatchObject({ written: [], unchanged: ["EUR"] });

    const changed = await runRateFeed(t.db, source({ EUR: "1.0712" }), at("2026-10-30T05:00:00Z"));
    expect(changed.written).toEqual([{ from: "CHF", to: "EUR", rate: "1.0712" }]);

    const rows = await rateHistory(t.db, t.chf.id, eurId);
    expect(rows.map((r) => [r.rate, r.source, r.setBy])).toEqual([
      ["1.0712", "FEED", "system:feed"],
      ["1.07", "FEED", "system:feed"],
    ]);
    expect((await getRate(t.db, t.chf.id, eurId, at("2026-10-29T12:00:00Z"))).text).toBe("1.07");
  });

  it("keeps the last rate when the fetch fails, and never invents one", async () => {
    const before = await rateHistory(t.db, t.chf.id, eurId);
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const failed = await runRateFeed(t.db, source(new Error("timeout")), at("2026-10-31T05:00:00Z"));
    expect(failed).toMatchObject({ written: [], error: "Test feed: timeout" });
    const nothing = await runRateFeed(t.db, source({}), at("2026-10-31T06:00:00Z"));
    expect(nothing).toMatchObject({ written: [], missing: ["EUR"] });

    expect(await rateHistory(t.db, t.chf.id, eurId)).toEqual(before);
    expect((await getRate(t.db, t.chf.id, eurId)).text).toBe("1.0712");
    expect(errors).toHaveBeenCalled();
    errors.mockRestore();
  });
});
