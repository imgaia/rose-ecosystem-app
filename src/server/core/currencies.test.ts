import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  convert,
  homeCurrencyOf,
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
const accountOf = (nodeId: string, currencyId: string, isReserve = false) =>
  t.db.account.findUnique({ where: { nodeId_currencyId_isReserve: { nodeId, currencyId, isReserve } } });

/** An individual creates a currency: it applies at once (R-FIN-11, both roles are the person). */
async function ownCurrency(issuer: { id: string }, code: string, extra: { reserveRatio?: string; policy?: "reserve" | "open" } = {}) {
  const p = await proposeCurrencyChange(t.db, as(issuer), { action: "CREATE", fields: { name: `${code} coin`, code, ...extra } });
  expect(p.status).toBe("APPROVED");
  return t.db.currency.findFirstOrThrow({ where: { issuerNodeId: issuer.id, code } });
}

/** CHF paid into the node's own CHF account (opened the first time). */
async function fundChf(nodeId: string, amount: number) {
  const existing = await accountOf(nodeId, t.chf.id);
  if (!existing) return t.account(nodeId, t.chf.id, amount);
  await postTransaction(t.db, { kind: "DEPOSIT", toAccountId: existing.id, amount, comment: "Test deposit", actedByPersonId: nodeId });
  return existing;
}

/** An issuer mints `amount` of its currency from CHF it deposits, so its reserve holds that much. */
async function backed(issuer: { id: string }, currencyId: string, amount: number) {
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
    expect((await quoteMint(t.db, as(ana), { sourceAccountId: chf.id, amount: 1_000, currencyId: coin.id })).units).toBe(2_000);
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
    await backed(ana, held.id, 500);
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
    await backed(ana, coin.id, 1_000);
    await proposeCurrencyChange(t.db, as(ana), { action: "RETIRE", currencyId: coin.id });

    const anaChf = await fundChf(ana.id, 1_000);
    const minting = await refusal(mint(t.db, as(ana), { sourceAccountId: anaChf.id, amount: 100, currencyId: coin.id }));
    expect(minting?.ruleIds).toEqual(["R-FIN-12"]);
    const benChf = await t.account(ben.id, t.chf.id, 1_000);
    const buying = await refusal(convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: coin.id, amount: 100 }));
    expect(buying?.ruleIds).toEqual(["R-FIN-12"]);

    const units = (await accountOf(ana.id, coin.id))!;
    await convert(t.db, as(ana), { fromAccountId: units.id, toCurrencyId: t.chf.id, amount: 400 });
    expect(await t.balanceOf(ana.id, coin.id)).toBe(600);
  });
});

describe("converting (UC-FIN-03, R-FIN-10, R-FIN-14)", () => {
  it("converts one node currency into another through both reserves; ledger sums hold", async () => {
    const [ana, ben, cat] = await Promise.all([t.person("Ana"), t.person("Ben"), t.person("Cat")]);
    const aaa = await ownCurrency(ana, "AAA"); // price 1 CHF
    const bbb = await ownCurrency(ben, "BBB", { reserveRatio: "0.5" }); // price 0.50 CHF
    await backed(ana, aaa.id, 2_000);
    const anaUnits = (await accountOf(ana.id, aaa.id))!;
    // Ana pays Cat 10.00 AAA the plain way, then Cat converts it.
    await t.db.account.create({ data: { nodeId: cat.id, currencyId: aaa.id } });
    await postTransaction(t.db, {
      kind: "PAYMENT",
      fromAccountId: anaUnits.id,
      toAccountId: (await accountOf(cat.id, aaa.id))!.id,
      amount: 1_000,
      comment: "For the bread",
      actedByPersonId: ana.id,
    });

    const input = { fromAccountId: (await accountOf(cat.id, aaa.id))!.id, toCurrencyId: bbb.id, amount: 1_000 };
    expect(await quoteConvert(t.db, as(cat), input)).toMatchObject({ mode: "RESERVES", receive: 2_000, rate: "2", value: 1_000 });
    const { rows } = await convert(t.db, as(cat), input);
    expect(rows.map((r) => r.kind)).toEqual(["EXCHANGE", "EXCHANGE", "EXCHANGE"]);
    expect(new Set(rows.map((r) => r.groupId)).size).toBe(1);

    expect(await t.balanceOf(cat.id, aaa.id)).toBe(0);
    expect(await t.balanceOf(cat.id, bbb.id)).toBe(2_000);
    expect((await accountOf(ana.id, t.chf.id, true))!.balance).toBe(1_000); // 10.00 CHF left Ana's reserve
    expect((await accountOf(ben.id, t.chf.id, true))!.balance).toBe(1_000); // and went into Ben's
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("buys with fiat (skipping the first leg) and cashes out to fiat (skipping the last)", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const coin = await ownCurrency(ana, "BUY", { reserveRatio: "2" });
    const benChf = await t.account(ben.id, t.chf.id, 1_000);
    const bought = await convert(t.db, as(ben), { fromAccountId: benChf.id, toCurrencyId: coin.id, amount: 1_000 });
    expect(bought.rows).toHaveLength(2);
    expect(await t.balanceOf(ben.id, coin.id)).toBe(500); // 10.00 CHF at 2 CHF a unit

    const units = (await accountOf(ben.id, coin.id))!;
    const sold = await convert(t.db, as(ben), { fromAccountId: units.id, toCurrencyId: t.chf.id, amount: 200 });
    expect(sold.rows).toHaveLength(2);
    expect(await t.balanceOf(ben.id, t.chf.id)).toBe(400);
    expect((await accountOf(ana.id, t.chf.id, true))!.balance).toBe(600);
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("refuses when the reserve can't cover it and a currency is 'reserve'; swaps straight when both are open", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const aaa = await ownCurrency(ana, "SHA");
    const bbb = await ownCurrency(ben, "SHB");
    await backed(ana, aaa.id, 500);
    // Ana grants herself 5.00 more AAA with nothing behind it: an opening balance, as RCC's migrated ones are.
    const anaUnits = (await accountOf(ana.id, aaa.id))!;
    await postTransaction(t.db, { kind: "OPENING_BALANCE", toAccountId: anaUnits.id, amount: 500, comment: "Unbacked", actedByPersonId: ana.id });
    const input = { fromAccountId: anaUnits.id, toCurrencyId: bbb.id, amount: 800 };

    const short = await refusal(quoteConvert(t.db, as(ana), input));
    expect(short?.ruleIds).toEqual(["R-FIN-10"]);
    expect(short?.message).toMatch(/reserve holds 5.00 CHF/);

    // Only one side open: still refused.
    await proposeCurrencyChange(t.db, as(ana), { action: "EDIT", currencyId: aaa.id, fields: { policy: "open" } });
    expect((await refusal(quoteConvert(t.db, as(ana), input)))?.ruleIds).toEqual(["R-FIN-10"]);

    // Both open: a straight swap at the price, no fiat moving.
    await proposeCurrencyChange(t.db, as(ben), { action: "EDIT", currencyId: bbb.id, fields: { policy: "open" } });
    const { mode, rows } = await convert(t.db, as(ana), input);
    expect(mode).toBe("SWAP");
    expect(rows).toHaveLength(2);
    expect(await t.balanceOf(ana.id, aaa.id)).toBe(200);
    expect(await t.balanceOf(ana.id, bbb.id)).toBe(800);
    expect((await accountOf(ana.id, t.chf.id, true))!.balance).toBe(500); // the reserve didn't move
    expect(await accountOf(ben.id, t.chf.id, true)).toBeNull();
    expect(await t.balancesNotMatchingLedger()).toEqual([]);
  });

  it("never converts fiat into fiat, and not through reserves backed by different fiats", async () => {
    const [ana, ben] = await Promise.all([t.person("Ana"), t.person("Ben")]);
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EUR", kind: "FIAT", country: "DE,FR" } });
    const chf = await t.account(ana.id, t.chf.id, 1_000);
    expect((await refusal(quoteConvert(t.db, as(ana), { fromAccountId: chf.id, toCurrencyId: eur.id, amount: 100 })))?.ruleIds).toEqual([
      "R-FIN-14",
    ]);

    await setPrimaryFiat(t.db, as(ben), { currencyId: eur.id });
    const euroCoin = await ownCurrency(ben, "EUC");
    expect(euroCoin.reserveCurrencyId).toBe(eur.id); // its issuer's primary fiat when created
    await setRate(t.db, { fromCurrencyId: t.chf.id, toCurrencyId: eur.id, rate: "1.05", validFrom: new Date("2026-01-01"), source: "MANUAL", setBy: "t" });
    const blocked = await refusal(quoteConvert(t.db, as(ana), { fromAccountId: chf.id, toCurrencyId: euroCoin.id, amount: 100 }));
    expect(blocked?.ruleIds).toEqual(["R-FIN-14", "R-FIN-10"]);
  });
});

describe("home currency and primary fiat (R-FIN-04, R-FIN-13)", () => {
  it("is the primary fiat until set; a collection's currency falls back when leaving it", async () => {
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const col = await t.collection("Org", [
      { node: olga, roles: ["MEMBER", "OWNER", "TREASURER"] },
      { node: tim, roles: ["MEMBER"] },
    ]);
    expect((await homeCurrencyOf(t.db, tim.id)).id).toBe(t.chf.id); // country CH, nothing set

    const p = await proposeCurrencyChange(t.db, as(olga, col), { action: "CREATE", fields: { name: "Org coin", code: "OC" } });
    expect(p.status).toBe("APPROVED"); // Olga is both Treasurer and Owner: proposing is both approvals
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
});
