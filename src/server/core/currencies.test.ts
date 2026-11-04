import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  canBeHomeCurrency,
  convert,
  convertTable,
  currencyBacking,
  homeCurrencyOf,
  priceOf,
  proposeCurrencyChange,
  quoteConvert,
  reserveRatio,
  setHomeCurrency,
  setPrimaryFiat,
} from "./currencies";
import type { RuleError } from "./errors";
import { leaveCollection } from "./governance";
import { decideProposal } from "./index";
import type { Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { rateHistory, setRate } from "./rates";
import { createTestDb, type TestDb } from "./test-helpers";
import { mint, quoteMint } from "./wallet";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.cleanup();
});

/** A person acting for a collection, or for themselves. */
const as = (person: { id: string }, node: { id: string } = person): Actor => ({ personId: person.id, actingNodeId: node.id });
const approve = (person: { id: string }, proposalId: string, yes = true) =>
  decideProposal(t.db, { proposalId, approverNodeId: person.id, personId: person.id, approve: yes });
const refusal = (call: Promise<unknown>) => call.then(() => null, (e: unknown) => e as RuleError);
const accountOf = (nodeId: string, currencyId: string) =>
  t.db.account.findUnique({ where: { nodeId_currencyId_isReserve_backsCurrencyId: { nodeId, currencyId, isReserve: false, backsCurrencyId: "" } } });
/** The reserve behind a currency: what its balance is, or null if nothing has gone in yet. */
const reserveOf = async (currencyId: string) => (await t.db.account.findFirst({ where: { isReserve: true, backsCurrencyId: currencyId } }))?.balance ?? null;

/**
 * An individual creates a currency: it applies at once (R-FIN-11, both roles are the person).
 * Fiat-backed at a ratio of 1 unless told otherwise, since most tests here convert through reserves.
 */
async function ownCurrency(issuer: { id: string }, code: string, extra: { reserveRatio?: string; backing?: "FREE" | "FIAT" } = {}) {
  const backing = extra.backing ?? "FIAT";
  const fields = { name: `${code} coin`, code, backing, reserveRatio: backing === "FIAT" ? (extra.reserveRatio ?? "1") : null };
  const p = await proposeCurrencyChange(t.db, as(issuer), { action: "CREATE", fields });
  expect(p.status).toBe("APPROVED");
  return t.db.currency.findFirstOrThrow({ where: { issuerNodeId: issuer.id, code } });
}

/** CHF paid into the node's own CHF account (opened the first time). */
async function fundChf(nodeId: string, amount: bigint) {
  const existing = await accountOf(nodeId, t.chf.id);
  if (!existing) return t.account(nodeId, t.chf.id, amount);
  await postTransaction(t.db, { kind: "DEPOSIT", toAccountId: existing.id, amount, comment: "Test deposit", actedByPersonId: nodeId });
  return existing;
}

/** An issuer mints `amount` of its currency from CHF it deposits, so its reserve holds that much. */
async function backed(issuer: { id: string }, currencyId: string, amount: bigint) {
  const chf = await fundChf(issuer.id, amount);
  await mint(t.db, as(issuer), { sourceAccountId: chf.id, amount, currencyId });
}

describe("creating and changing a currency (R-FIN-11, R-FIN-12)", () => {
  it("applies at once for an individual and writes its price row from the reserve ratio", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "ANA", { reserveRatio: "2" });
    expect(coin).toMatchObject({ kind: "COMMUNITY", status: "ACTIVE", reserveCurrencyId: t.chf.id, decimals: 2 });
    expect(await reserveRatio(t.db, coin.id)).toBe("2");
    const rows = await rateHistory(t.db, coin.id, t.chf.id);
    expect(rows.map((r) => [r.rate, r.source])).toEqual([["2", "RESERVE_RATIO"]]);
  });

  it("changing the reserve ratio writes a new price row and closes the old one", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "AN2");
    await proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: coin.id, fields: { reserveRatio: "0.5", name: "Renamed" } });
    const rows = await rateHistory(t.db, coin.id, t.chf.id);
    expect(rows.map((r) => [r.rate, r.validTo === null])).toEqual([
      ["0.5", true],
      ["1", false],
    ]);
    expect((await t.db.currency.findUniqueOrThrow({ where: { id: coin.id } })).name).toBe("Renamed");
    // Mint reads the per-currency ratio: 10.00 CHF at 0.5 gives 20.00 units.
    const chf = await t.account(ana.id, t.chf.id, 1_000);
    expect((await quoteMint(t.db, as(ana), { sourceAccountId: chf.id, amount: 1_000n, currencyId: coin.id })).units).toBe(2_000n);
  });

  it("in a collection needs a Treasurer and an Owner", async () => {
    const [olga, tim, mia] = await Promise.all(["Olga", "Tim", "Mia"].map((n) => t.person(n)));
    const col = await t.collection("Org", [
      { node: olga!, roles: ["MEMBER", "OWNER"] },
      { node: tim!, roles: ["MEMBER", "TREASURER"] },
      { node: mia!, roles: ["MEMBER"] },
    ]);
    const create = { action: "CREATE" as const, fields: { name: "Org coin", code: "ORG" } };

    // Proposing needs SET_UP_CURRENCY, which only a Treasurer has.
    expect((await refusal(proposeCurrencyChange(t.db, as(olga!, col), create)))?.needsRoles).toEqual(["TREASURER"]);

    const p = await proposeCurrencyChange(t.db, as(tim!, col), create);
    expect(p.status).toBe("OPEN");
    expect(p.approvers.map((a) => [a.approverNodeId, a.decision]).sort()).toEqual(
      [
        [tim!.id, true],
        [olga!.id, null],
      ].sort(),
    );
    expect(await t.db.currency.findFirst({ where: { issuerNodeId: col.id } })).toBeNull();
    await approve(olga!, p.id);
    expect(await t.db.currency.findFirst({ where: { issuerNodeId: col.id } })).toMatchObject({ code: "ORG" });
  });

  it("in a collection needs two different people: one person holding both roles can't do it alone (distinct_people)", async () => {
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const create = { action: "CREATE" as const, fields: { name: "Solo coin", code: "SOLO" } };

    // Olga is the only Treasurer and the only Owner: no second person could ever approve.
    const alone = await t.collection("Alone", [{ node: olga, roles: ["MEMBER", "OWNER", "TREASURER"] }]);
    const refused = await refusal(proposeCurrencyChange(t.db, as(olga, alone), create));
    expect(refused?.ruleIds).toEqual(["R-FIN-11"]);
    expect(refused?.message).toMatch(/different person/);

    // With Tim as a second Treasurer, Olga's proposal is her approval as Owner, and waits for Tim.
    const col = await t.collection("Pair", [
      { node: olga, roles: ["MEMBER", "OWNER", "TREASURER"] },
      { node: tim, roles: ["MEMBER", "TREASURER"] },
    ]);
    const p = await proposeCurrencyChange(t.db, as(olga, col), create);
    expect(p.status).toBe("OPEN");
    expect(await t.db.currency.findFirst({ where: { issuerNodeId: col.id } })).toBeNull();
    expect((await approve(tim, p.id)).status).toBe("APPROVED");
    expect(await t.db.currency.findFirst({ where: { issuerNodeId: col.id } })).toMatchObject({ code: "SOLO" });
  });

  it("for an individual still applies at once, though one person is both Treasurer and Owner", async () => {
    const ana = await t.person("Ana");
    const p = await proposeCurrencyChange(t.db, as(ana), { action: "CREATE", fields: { name: "Mine", code: "MINE" } });
    expect(p.status).toBe("APPROVED");
    expect(p.approvers.map((a) => [a.approverNodeId, a.decision])).toEqual([[ana.id, true]]);
  });

  it("an Owner's decline closes it", async () => {
    const [olga, tim] = await Promise.all(["Olga", "Tim"].map((n) => t.person(n)));
    const col = await t.collection("Org", [
      { node: olga!, roles: ["MEMBER", "OWNER"] },
      { node: tim!, roles: ["MEMBER", "TREASURER"] },
    ]);
    const p = await proposeCurrencyChange(t.db, as(tim!, col), { action: "CREATE", fields: { name: "No", code: "NO" } });
    expect((await approve(olga!, p.id, false)).status).toBe("DECLINED");
    expect(await t.db.currency.findFirst({ where: { issuerNodeId: col.id } })).toBeNull();
  });

  it("deletes a currency nobody held; once held it can only be retired, and its decimals are fixed", async () => {
    const ana = await t.person("Ana");
    const unused = await ownCurrency(ana, "UNU");
    await proposeCurrencyChange(t.db, as(ana), { action: "DELETE", currencyId: unused.id });
    expect(await t.db.currency.findUnique({ where: { id: unused.id } })).toBeNull();

    const held = await ownCurrency(ana, "HLD");
    await backed(ana, held.id, 500n);
    const del = await refusal(proposeCurrencyChange(t.db, as(ana), { action: "DELETE", currencyId: held.id }));
    expect(del?.ruleIds).toEqual(["R-FIN-12"]);
    const decimals = await refusal(proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: held.id, fields: { decimals: 0 } }));
    expect(decimals?.ruleIds).toEqual(["R-FIN-12"]);

    await proposeCurrencyChange(t.db, as(ana), { action: "RETIRE", currencyId: held.id });
    expect((await t.db.currency.findUniqueOrThrow({ where: { id: held.id } })).status).toBe("RETIRED");
  });

  it("a retired currency can't be minted or bought, but its balances still convert", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const coin = await ownCurrency(ana, "RET");
    await backed(ana, coin.id, 1_000n);
    await proposeCurrencyChange(t.db, as(ana), { action: "RETIRE", currencyId: coin.id });

    const anaChf = await fundChf(ana.id, 1_000n);
    const minting = await refusal(mint(t.db, as(ana), { sourceAccountId: anaChf.id, amount: 100n, currencyId: coin.id }));
    expect(minting?.ruleIds).toEqual(["R-FIN-12"]);
    const benChf = await t.account(ben.id, t.chf.id, 1_000);
    const buying = await refusal(convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: coin.id, amount: 100n }));
    expect(buying?.ruleIds).toEqual(["R-FIN-12"]);

    const units = (await accountOf(ana.id, coin.id))!;
    await convert(t.db, as(ana), { fromAccountId: units.id, toCurrencyId: t.chf.id, amount: 400n });
    expect(await t.balanceOf(ana.id, coin.id)).toBe(600n);
  });
});

describe("free and fiat-backed currencies (R-FIN-01, R-FIN-17, R-FIN-18)", () => {
  it("a new currency is free by default: no ratio, no price row, no price yet", async () => {
    const ana = await t.person("Ana");
    const p = await proposeCurrencyChange(t.db, as(ana), { action: "CREATE", fields: { name: "Free coin", code: "FRE" } });
    const coin = await t.db.currency.findFirstOrThrow({ where: { issuerNodeId: ana.id, code: "FRE" } });
    expect(p.status).toBe("APPROVED");
    expect(coin.backing).toBe("FREE");
    expect(await reserveRatio(t.db, coin.id)).toBeNull();
    expect(await rateHistory(t.db, coin.id, t.chf.id)).toEqual([]);
    expect(await priceOf(t.db, coin.id)).toBeNull();
  });

  it("a fiat-backed currency needs a ratio; a free one can't have one", async () => {
    const ana = await t.person("Ana");
    const noRatio = await refusal(proposeCurrencyChange(t.db, as(ana), { action: "CREATE", fields: { name: "X", code: "XB", backing: "FIAT" } }));
    expect(noRatio?.ruleIds).toEqual(["R-FIN-01"]);
    const freeWithRatio = await refusal(
      proposeCurrencyChange(t.db, as(ana), { action: "CREATE", fields: { name: "X", code: "XF", backing: "FREE", reserveRatio: "2" } }),
    );
    expect(freeWithRatio?.ruleIds).toEqual(["R-FIN-17"]);
  });

  it("allows up to 8 decimal places (R-FIN-18)", async () => {
    const ana = await t.person("Ana");
    await ownCurrency(ana, "SAT", { backing: "FREE" });
    const sat = await t.db.currency.findFirstOrThrow({ where: { issuerNodeId: ana.id, code: "SAT" } });
    await proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: sat.id, fields: { decimals: 8 } });
    expect((await t.db.currency.findUniqueOrThrow({ where: { id: sat.id } })).decimals).toBe(8);
    const nine = await refusal(proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: sat.id, fields: { decimals: 9 } }));
    expect(nine?.ruleIds).toEqual(["R-FIN-18"]);
  });

  it("mints a free currency in any amount, with nothing locked and no rate written", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "FMI", { backing: "FREE" });
    const quote = await quoteMint(t.db, as(ana), { amount: 123_456n, currencyId: coin.id });
    expect(quote).toMatchObject({ source: null, units: 123_456n, rate: null });
    const { locked, minted } = await mint(t.db, as(ana), { amount: 123_456n, currencyId: coin.id });
    expect(locked).toBeNull();
    expect(minted).toMatchObject({ kind: "MINT", fromAccountId: null, amount: 123_456n, rate: null });
    expect(await t.balanceOf(ana.id, coin.id)).toBe(123_456n);
    expect(await reserveOf(coin.id)).toBeNull();
    expect(await rateHistory(t.db, coin.id, t.chf.id)).toEqual([]);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("mints a fiat-backed currency only from fiat, which is locked in its reserve", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "BMI", { reserveRatio: "0.25" });
    expect((await refusal(mint(t.db, as(ana), { amount: 100n, currencyId: coin.id })))?.ruleIds).toEqual(["R-FIN-02"]);
    const chf = await fundChf(ana.id, 1_000n);
    const { locked, minted } = await mint(t.db, as(ana), { sourceAccountId: chf.id, amount: 1_000n, currencyId: coin.id });
    expect(locked).toMatchObject({ kind: "MINT", amount: 1_000n });
    expect(minted.amount).toBe(4_000n); // 10.00 CHF at 0.25 CHF a unit
    expect(await reserveOf(coin.id)).toBe(1_000n);
    expect(await t.balanceOf(ana.id, t.chf.id)).toBe(0n);
  });

  it("a free currency can become fiat-backed; a backed one becomes free only with an empty reserve", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "SWI", { backing: "FREE" });
    await proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: coin.id, fields: { backing: "FIAT", reserveRatio: "2" } });
    expect(await reserveRatio(t.db, coin.id)).toBe("2");
    expect((await priceOf(t.db, coin.id))?.rate).toBe("2");

    await backed(ana, coin.id, 400n);
    const toFree = { action: "EDIT" as const, currencyId: coin.id, fields: { backing: "FREE" as const, reserveRatio: null } };
    expect((await refusal(proposeCurrencyChange(t.db, as(ana), toFree)))?.ruleIds).toEqual(["R-FIN-02"]);

    // Cashed out, the reserve is empty: now it can go free, and its reserve-ratio price closes.
    await convert(t.db, as(ana), { fromAccountId: (await accountOf(ana.id, coin.id))!.id, toCurrencyId: t.chf.id, amount: 200n });
    expect(await reserveOf(coin.id)).toBe(0n);
    await proposeCurrencyChange(t.db, as(ana), toFree);
    expect((await t.db.currency.findUniqueOrThrow({ where: { id: coin.id } })).backing).toBe("FREE");
    expect(await reserveRatio(t.db, coin.id)).toBeNull();
    expect((await rateHistory(t.db, coin.id, t.chf.id)).every((r) => r.validTo !== null)).toBe(true);
    expect(await priceOf(t.db, coin.id)).toBeNull();
  });

  it("convert refuses a free currency on either side, pointing to a trade (R-FIN-10)", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const free = await ownCurrency(ana, "FCV", { backing: "FREE" });
    await mint(t.db, as(ana), { amount: 1_000n, currencyId: free.id });
    const out = await refusal(convert(t.db, as(ana), { fromAccountId: (await accountOf(ana.id, free.id))!.id, toCurrencyId: t.chf.id, amount: 100n }));
    expect(out?.ruleIds).toEqual(["R-FIN-10"]);
    expect(out?.message).toMatch(/Propose a trade/);
    const benChf = await fundChf(ben.id, 1_000n);
    expect((await refusal(convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: free.id, amount: 100n })))?.ruleIds).toEqual(["R-FIN-10"]);
    const row = (await convertTable(t.db, ben.id, free.id)).find((r) => r.currency.id === t.chf.id)?.into;
    expect(row && "reason" in row ? row.reason : null).toBe("trade instead");
  });
});

describe("converting (UC-FIN-03, R-FIN-10, R-FIN-14)", () => {
  it("converts one node currency into another through both reserves; ledger sums hold", async () => {
    const [ana, ben, cat] = await Promise.all([t.person("Ana"), t.person("Ben"), t.person("Cat")]);
    const aaa = await ownCurrency(ana, "AAA"); // price 1 CHF
    const bbb = await ownCurrency(ben, "BBB", { reserveRatio: "0.5" }); // price 0.50 CHF
    await backed(ana, aaa.id, 2_000n);
    const anaUnits = (await accountOf(ana.id, aaa.id))!;
    // Ana pays Cat 10.00 AAA the plain way, then Cat converts it.
    await t.db.account.create({ data: { nodeId: cat.id, currencyId: aaa.id } });
    await postTransaction(t.db, {
      kind: "PAYMENT",
      fromAccountId: anaUnits.id,
      toAccountId: (await accountOf(cat.id, aaa.id))!.id,
      amount: 1_000n,
      comment: "For the bread",
      actedByPersonId: ana.id,
    });

    const input = { fromAccountId: (await accountOf(cat.id, aaa.id))!.id, toCurrencyId: bbb.id, amount: 1_000n };
    expect(await quoteConvert(t.db, as(cat), input)).toMatchObject({ mode: "RESERVES", receive: 2_000n, rate: "2", value: 1_000n });
    const { rows } = await convert(t.db, as(cat), input);
    expect(rows.map((r) => r.kind)).toEqual(["EXCHANGE", "EXCHANGE", "EXCHANGE"]);
    expect(new Set(rows.map((r) => r.groupId)).size).toBe(1);

    expect(await t.balanceOf(cat.id, aaa.id)).toBe(0n);
    expect(await t.balanceOf(cat.id, bbb.id)).toBe(2_000n);
    expect(await reserveOf(aaa.id)).toBe(1_000n); // 10.00 CHF left AAA's reserve
    expect(await reserveOf(bbb.id)).toBe(1_000n); // and went into BBB's
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("buys with fiat (skipping the first leg) and cashes out to fiat (skipping the last)", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const coin = await ownCurrency(ana, "BUY", { reserveRatio: "2" });
    const benChf = await t.account(ben.id, t.chf.id, 1_000);
    const bought = await convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: coin.id, amount: 1_000n });
    expect(bought.rows).toHaveLength(2);
    expect(await t.balanceOf(ben.id, coin.id)).toBe(500n); // 10.00 CHF at 2 CHF a unit

    const units = (await accountOf(ben.id, coin.id))!;
    const sold = await convert(t.db, as(ben), { fromAccountId: units.id, toCurrencyId: t.chf.id, amount: 200n });
    expect(sold.rows).toHaveLength(2);
    expect(await t.balanceOf(ben.id, t.chf.id)).toBe(400n);
    expect(await reserveOf(coin.id)).toBe(600n);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("refuses when the reserve can't cover it, with no straight swap beyond it (R-FIN-10)", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const aaa = await ownCurrency(ana, "SHA");
    const bbb = await ownCurrency(ben, "SHB");
    await backed(ana, aaa.id, 500n);
    // Ana grants herself 5.00 more AAA with nothing behind it: an opening balance, as RCC's migrated ones are.
    const anaUnits = (await accountOf(ana.id, aaa.id))!;
    await postTransaction(t.db, { kind: "OPENING_BALANCE", toAccountId: anaUnits.id, amount: 500n, comment: "Unbacked", actedByPersonId: ana.id });
    const input = { fromAccountId: anaUnits.id, toCurrencyId: bbb.id, amount: 800n };

    const short = await refusal(convert(t.db, as(ana), input));
    expect(short?.ruleIds).toEqual(["R-FIN-10"]);
    expect(short?.message).toMatch(/reserve holds 5.00 CHF/);
    expect(await t.balanceOf(ana.id, aaa.id)).toBe(1_000n);

    // Up to what the reserve covers, it goes through.
    await convert(t.db, as(ana), { ...input, amount: 500n });
    expect([await reserveOf(aaa.id), await reserveOf(bbb.id)]).toEqual([0n, 500n]);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("gives each currency its own reserve: converting out of one leaves the other's backing untouched", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const one = await ownCurrency(ana, "ONE");
    const two = await ownCurrency(ana, "TWO"); // same issuer, same reserve fiat (CHF)
    await backed(ana, one.id, 1_000n);
    await backed(ana, two.id, 3_000n);
    expect([await reserveOf(one.id), await reserveOf(two.id)]).toEqual([1_000n, 3_000n]);
    expect(await currencyBacking(t.db, one.id)).toMatchObject({ reserve: 1_000n, units: 1_000n, value: 1_000n, shareBacked: 1 });

    // Ben buys 4.00 ONE; then Ana and Ben cash all 14.00 ONE out, which empties ONE's reserve only.
    const benChf = await fundChf(ben.id, 400n);
    await convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: one.id, amount: 400n });
    expect(await reserveOf(one.id)).toBe(1_400n);
    const anaOne = (await accountOf(ana.id, one.id))!;
    await convert(t.db, as(ana), { fromAccountId: anaOne.id, toCurrencyId: t.chf.id, amount: 1_000n });
    const benOne = (await accountOf(ben.id, one.id))!;
    await convert(t.db, as(ben), { fromAccountId: benOne.id, toCurrencyId: t.chf.id, amount: 400n });

    expect(await reserveOf(one.id)).toBe(0n);
    expect(await reserveOf(two.id)).toBe(3_000n); // TWO's backing is untouched
    expect(await currencyBacking(t.db, two.id)).toMatchObject({ reserve: 3_000n, units: 3_000n, shareBacked: 1 });
    // ONE's reserve is empty: unbacked ONE can't be cashed out against TWO's reserve, though it holds CHF.
    await postTransaction(t.db, { kind: "OPENING_BALANCE", toAccountId: anaOne.id, amount: 500n, comment: "Unbacked", actedByPersonId: ana.id });
    const drain = await refusal(convert(t.db, as(ana), { fromAccountId: anaOne.id, toCurrencyId: t.chf.id, amount: 500n }));
    expect(drain?.ruleIds).toEqual(["R-FIN-10"]);
    expect(await reserveOf(two.id)).toBe(3_000n);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("never converts fiat into fiat, and not through reserves backed by different fiats", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EUR", kind: "FIAT", country: "DE,FR" } });
    const chf = await t.account(ana.id, t.chf.id, 1_000);
    expect((await refusal(quoteConvert(t.db, as(ana), { fromAccountId: chf.id, toCurrencyId: eur.id, amount: 100n })))?.ruleIds).toEqual([
      "R-FIN-14",
    ]);

    await setPrimaryFiat(t.db, as(ben), { currencyId: eur.id });
    const euroCoin = await ownCurrency(ben, "EUC");
    expect(euroCoin.reserveCurrencyId).toBe(eur.id); // its issuer's primary fiat when created
    await setRate(t.db, { fromCurrencyId: t.chf.id, toCurrencyId: eur.id, rate: "1.05", validFrom: new Date("2026-01-01"), source: "MANUAL", setBy: "t" });
    const blocked = await refusal(quoteConvert(t.db, as(ana), { fromAccountId: chf.id, toCurrencyId: euroCoin.id, amount: 100n }));
    expect(blocked?.ruleIds).toEqual(["R-FIN-14"]);
  });

  it("converting fiat into the node's own currency is a mint: same rows, same reserve, its ratio", async () => {
    const ana = await t.person("Ana");
    const coin = await ownCurrency(ana, "MNT", { reserveRatio: "0.5" }); // 1 MNT = 0.50 CHF
    const chf = await fundChf(ana.id, 2_000n);

    // The table shows the rate (1 CHF = 2 MNT) where it used to refuse.
    const rows = await convertTable(t.db, ana.id, coin.id);
    expect(rows.find((r) => r.currency.id === t.chf.id)?.into).toEqual({ rate: "2" });

    const input = { fromAccountId: chf.id, toCurrencyId: coin.id, amount: 1_000n };
    expect(await quoteConvert(t.db, as(ana), input)).toMatchObject({ mode: "MINT", receive: 2_000n, rate: "2" });
    const converted = await convert(t.db, as(ana), input);
    const minted = await mint(t.db, as(ana), { sourceAccountId: chf.id, amount: 1_000n, currencyId: coin.id });

    // Both write the same two rows: fiat into the currency's own reserve, new units to the node.
    const shape = (r: { kind: string; fromAccountId: string | null; toAccountId: string | null; amount: bigint; rate: string | null }) =>
      [r.kind, r.fromAccountId, r.toAccountId, r.amount, r.rate];
    expect(converted.rows.map(shape)).toEqual([minted.locked!, minted.minted].map(shape));
    expect(converted.rows[0]!.groupId).toBe(converted.rows[1]!.groupId);
    expect(await reserveOf(coin.id)).toBe(2_000n);
    expect(await t.balanceOf(ana.id, coin.id)).toBe(4_000n);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);

    // R-FIN-14 still applies: a fiat other than the reserve fiat is refused, with a short reason.
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EU4", kind: "FIAT", country: "AT" } });
    const eurAccount = await t.account(ana.id, eur.id, 500);
    expect((await refusal(quoteConvert(t.db, as(ana), { ...input, fromAccountId: eurAccount.id, amount: 100n })))?.ruleIds).toEqual(["R-FIN-14"]);
    const eurRow = (await convertTable(t.db, ana.id, coin.id)).find((r) => r.currency.id === eur.id)?.into;
    expect(eurRow && "reason" in eurRow ? eurRow.reason : null).toBe("different fiat");
  });

  it("the Convert table lists what is held plus the target, with prices and what one unit converts into", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EU3", kind: "FIAT", country: "AT" } });
    await setRate(t.db, { fromCurrencyId: eur.id, toCurrencyId: t.chf.id, rate: "0.92", validFrom: new Date("2026-01-01"), source: "MANUAL", setBy: "t" });
    const backedCoin = await ownCurrency(ben, "BKD", { reserveRatio: "2" });
    await backed(ben, backedCoin.id, 10_000n);
    const empty = await ownCurrency(ben, "EMP"); // nothing in its reserve
    await fundChf(ana.id, 1_000n);
    await t.account(ana.id, eur.id, 500);
    await t.account(ana.id, empty.id, 0);
    await postTransaction(t.db, { kind: "OPENING_BALANCE", toAccountId: (await accountOf(ana.id, empty.id))!.id, amount: 300n, comment: "Unbacked", actedByPersonId: ana.id });

    const rows = await convertTable(t.db, ana.id, backedCoin.id);
    const row = (code: string) => rows.find((r) => r.currency.code === code)!;
    expect(rows.map((r) => [r.currency.code, r.balance])).toEqual([
      ["CHF", 1_000n],
      ["EU3", 500n],
      ["EMP", 300n],
      ["BKD", null], // the target, not held
    ]);
    // Prices: a node currency in its reserve fiat; fiat at face value, another fiat with its rate into the primary fiat.
    expect(row("BKD").price?.rate).toBe("2");
    expect(row("CHF")).toMatchObject({ price: null, fiatRate: null });
    expect(row("EU3").fiatRate?.rate).toBe("0.92");
    // Into BKD: 1 CHF buys 0.5 BKD; fiat into a node currency of another fiat is refused (R-FIN-14);
    // EMP's reserve is empty (R-FIN-10); the target's own row has nothing.
    expect(row("CHF").into).toEqual({ rate: "0.5" });
    const refusedBy = (code: string) => {
      const into = row(code).into;
      return into && "refused" in into ? into.refused.ruleIds : null;
    };
    expect(refusedBy("EU3")).toContain("R-FIN-14");
    expect(refusedBy("EMP")).toEqual(["R-FIN-10"]);
    expect(row("BKD").into).toBeNull();
  });
});

describe("home currency and primary fiat (R-FIN-04, R-FIN-13)", () => {
  it("is the primary fiat until set; a collection's currency falls back when leaving it", async () => {
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const col = await t.collection("Org", [
      { node: olga, roles: ["MEMBER", "OWNER", "TREASURER"] },
      { node: tim, roles: ["MEMBER", "TREASURER"] },
    ]);
    expect((await homeCurrencyOf(t.db, tim.id)).id).toBe(t.chf.id); // country CH, nothing set

    const p = await proposeCurrencyChange(t.db, as(olga, col), { action: "CREATE", fields: { name: "Org coin", code: "OC" } });
    await approve(tim, p.id);
    const oc = await t.db.currency.findFirstOrThrow({ where: { issuerNodeId: col.id } });

    // Someone outside the collection can't make its currency their home currency.
    const zed = await t.person("Zed");
    expect((await refusal(setHomeCurrency(t.db, as(zed), { currencyId: oc.id })))?.ruleIds).toEqual(["R-FIN-04"]);

    await setHomeCurrency(t.db, as(tim), { currencyId: oc.id });
    expect((await homeCurrencyOf(t.db, tim.id)).id).toBe(oc.id);
    await leaveCollection(t.db, as(tim, col));
    expect((await homeCurrencyOf(t.db, tim.id)).id).toBe(t.chf.id);
  });

  it("moves the home currency along with the primary fiat", async () => {
    const ana = await t.person("Ana");
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EU2", kind: "FIAT", country: "AT" } });
    await setHomeCurrency(t.db, as(ana), { currencyId: t.chf.id });
    await setPrimaryFiat(t.db, as(ana), { currencyId: eur.id });
    expect((await homeCurrencyOf(t.db, ana.id)).id).toBe(eur.id);
    const primaries = await t.db.account.findMany({ where: { nodeId: ana.id, isPrimaryFiat: true } });
    expect(primaries.map((a) => a.currencyId)).toEqual([eur.id]);
    expect((await refusal(setPrimaryFiat(t.db, as(ana), { currencyId: t.rcc.id })))?.ruleIds).toEqual(["R-FIN-13"]);
  });

  it("a new currency marked as home becomes it when created: at once for an individual, on approval for a collection", async () => {
    const ana = await t.person("Ana");
    await proposeCurrencyChange(t.db, as(ana), { action: "CREATE", fields: { name: "Home coin", code: "HOM" }, makeHome: true });
    expect((await homeCurrencyOf(t.db, ana.id)).code).toBe("HOM");

    // Olga is an Owner but not a Treasurer: her approval applies the choice Tim made when proposing.
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const col = await t.collection("Org", [
      { node: olga, roles: ["MEMBER", "OWNER"] },
      { node: tim, roles: ["MEMBER", "TREASURER"] },
    ]);
    const p = await proposeCurrencyChange(t.db, as(tim, col), { action: "CREATE", fields: { name: "Org coin", code: "OHC" }, makeHome: true });
    expect(p.status).toBe("OPEN");
    expect((await homeCurrencyOf(t.db, col.id)).id).toBe(t.chf.id); // unchanged while it waits
    await approve(olga, p.id);
    const ohc = await t.db.currency.findFirstOrThrow({ where: { issuerNodeId: col.id } });
    expect((await homeCurrencyOf(t.db, col.id)).id).toBe(ohc.id);

    // Members could pick it too; a node outside the collection, a non-primary fiat or a retired currency can't.
    expect(await canBeHomeCurrency(t.db, tim.id, ohc)).toBe(true);
    expect(await canBeHomeCurrency(t.db, ana.id, ohc)).toBe(false);
    expect(await canBeHomeCurrency(t.db, ana.id, t.chf)).toBe(true);
    expect(await canBeHomeCurrency(t.db, col.id, { ...ohc, status: "RETIRED" })).toBe(false);
  });

  it("a collection's proposal without the choice leaves its home currency alone", async () => {
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const col = await t.collection("Org", [
      { node: olga, roles: ["MEMBER", "OWNER"] },
      { node: tim, roles: ["MEMBER", "TREASURER"] },
    ]);
    const p = await proposeCurrencyChange(t.db, as(tim, col), { action: "CREATE", fields: { name: "Plain coin", code: "PLN" } });
    await approve(olga, p.id);
    expect((await homeCurrencyOf(t.db, col.id)).id).toBe(t.chf.id);
  });
});
