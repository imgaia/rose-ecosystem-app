import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { RuleError } from "./errors";
import { MAX_MINOR_UNITS } from "~/lib/money";
import { ledgerBalance, postTransaction, recomputeBalance, spendable } from "./ledger";
import { createTestDb, type TestDb } from "./test-helpers";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  // The invariant: every stored balance equals the sum of its ledger rows.
  expect(await t.balancesNotMatchingLedger()).toEqual([]);
});
afterAll(async () => {
  await t.cleanup();
});

async function twoFundedPeople(aBalance: bigint, bBalance = 0n) {
  const a = await t.person("Ana");
  const b = await t.person("Ben");
  return { a, b, aAcc: await t.account(a.id, t.rcc.id, aBalance), bAcc: await t.account(b.id, t.rcc.id, bBalance) };
}

const pay = (fromAccountId: string, toAccountId: string, amount: bigint, extra: object = {}) =>
  postTransaction(t.db, {
    kind: "PAYMENT",
    fromAccountId,
    toAccountId,
    amount,
    comment: "Test payment",
    actedByPersonId: "test",
    ...extra,
  });

describe("postTransaction", () => {
  it("writes one row and moves both balances", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(10_000n);
    const row = await pay(aAcc.id, bAcc.id, 2_550n);

    expect(row).toMatchObject({ kind: "PAYMENT", amount: 2_550n, fromAccountId: aAcc.id, toAccountId: bAcc.id });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(7_450n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(2_550n);
  });

  it("refuses to take a balance below zero by default (R-PAY-02), and changes nothing", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    const before = await t.db.transaction.count();

    const error = await pay(aAcc.id, bAcc.id, 1_001n).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RuleError);
    expect((error as RuleError).ruleIds).toEqual(["R-PAY-02"]);

    expect(await t.db.transaction.count()).toBe(before);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(1_000n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(0n);
  });

  it("allows spending exactly down to the limit", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    await pay(aAcc.id, bAcc.id, 1_000n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(0n);
  });

  it("uses the node's own negative-balance limit when it has one", async () => {
    const { a, aAcc, bAcc } = await twoFundedPeople(100n);
    await t.db.nodeRuleValue.create({ data: { nodeId: a.id, ruleId: "R-PAY-02", value: "500" } });

    expect(await spendable(t.db, aAcc.id)).toBe(600n);
    await expect(pay(aAcc.id, bAcc.id, 601n)).rejects.toThrow(/negative-balance limit/);
    await pay(aAcc.id, bAcc.id, 600n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(-500n);
  });

  it("requires a comment (R-PAY-03)", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    await expect(pay(aAcc.id, bAcc.id, 100n, { comment: "   " })).rejects.toMatchObject({ ruleIds: ["R-PAY-03"] });
  });

  it("only accepts whole, positive minor units", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    await expect(pay(aAcc.id, bAcc.id, 0n)).rejects.toThrow(/whole number/);
    await expect(pay(aAcc.id, bAcc.id, -5n)).rejects.toThrow(/whole number/);
    // Plain JavaScript numbers are refused too, whole or not: amounts are bigint.
    await expect(pay(aAcc.id, bAcc.id, 12.5 as unknown as bigint)).rejects.toThrow(/whole number/);
    await expect(pay(aAcc.id, bAcc.id, 12 as unknown as bigint)).rejects.toThrow(/whole number/);
  });

  it("moves balances far above the old 32-bit limit exactly", async () => {
    // 1,000,000 units of an 8-decimal currency: 100,000,000,000,000 minor units.
    const million = 100_000_000_000_000n;
    const { aAcc, bAcc } = await twoFundedPeople(million);
    await pay(aAcc.id, bAcc.id, 10_000_000_000_001n); // 100,000.00000001 units
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(89_999_999_999_999n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(10_000_000_000_001n);
    expect(await ledgerBalance(t.db, aAcc.id)).toBe(89_999_999_999_999n);
    // Past 2^53, where a JavaScript number would no longer be exact.
    await pay(aAcc.id, bAcc.id, 1n);
    const big = 2n ** 53n + 1n;
    const { aAcc: c, bAcc: d } = await twoFundedPeople(big);
    await pay(c.id, d.id, big - 2n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: c.id } })).balance).toBe(2n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: d.id } })).balance).toBe(big - 2n);
    expect(await spendable(t.db, d.id)).toBe(big - 2n);
  });

  it("refuses amounts and balances above 64 bits, and changes nothing", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(MAX_MINOR_UNITS, MAX_MINOR_UNITS - 10n);
    await expect(pay(aAcc.id, bAcc.id, MAX_MINOR_UNITS + 1n)).rejects.toThrow(/most the app can store/);
    await expect(pay(aAcc.id, bAcc.id, 11n)).rejects.toThrow(/receiving balance/);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(MAX_MINOR_UNITS);
    await pay(aAcc.id, bAcc.id, 10n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(MAX_MINOR_UNITS);
  });

  it("records a deposit (no from-account) and a withdrawal (no to-account)", async () => {
    const { aAcc } = await twoFundedPeople(0n);
    await postTransaction(t.db, { kind: "DEPOSIT", toAccountId: aAcc.id, amount: 500n, comment: "Bank ref 42", actedByPersonId: "x" });
    await postTransaction(t.db, { kind: "WITHDRAWAL", fromAccountId: aAcc.id, amount: 200n, comment: "To bank", actedByPersonId: "x" });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(300n);
  });

  it("needs the received amount when the currency changes, and credits it", async () => {
    const a = await t.person("Ana");
    const chfAcc = await t.account(a.id, t.chf.id, 1_000);
    const rccAcc = await t.account(a.id, t.rcc.id);

    await expect(
      postTransaction(t.db, { kind: "EXCHANGE", fromAccountId: chfAcc.id, toAccountId: rccAcc.id, amount: 400n, comment: "x", actedByPersonId: a.id }),
    ).rejects.toThrow(/toAmount/);

    await postTransaction(t.db, {
      kind: "EXCHANGE",
      fromAccountId: chfAcc.id,
      toAccountId: rccAcc.id,
      amount: 400n,
      toAmount: 800n,
      rate: "2",
      comment: "Exchange",
      actedByPersonId: a.id,
    });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: chfAcc.id } })).balance).toBe(600n);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: rccAcc.id } })).balance).toBe(800n);
  });

  it("rejects paying an account to itself", async () => {
    const { aAcc } = await twoFundedPeople(1_000n);
    await expect(pay(aAcc.id, aAcc.id, 10n)).rejects.toThrow(/must differ/);
  });

  it("lets only one of two payments through when together they would break the limit", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    const results = await Promise.allSettled([pay(aAcc.id, bAcc.id, 600n), pay(aAcc.id, bAcc.id, 600n)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(400n);
  });

  it("keeps every balance equal to its ledger after many random payments", async () => {
    const people = await Promise.all(["P1", "P2", "P3", "P4"].map((n) => t.person(n)));
    const accounts = await Promise.all(people.map((p) => t.account(p.id, t.rcc.id, 5_000)));
    let seed = 7; // a fixed pseudo-random sequence, so the test is repeatable
    const next = () => (seed = (seed * 48271) % 2147483647);

    for (let i = 0; i < 60; i++) {
      const from = accounts[next() % 4]!;
      const to = accounts[next() % 4]!;
      if (from.id === to.id) continue;
      await pay(from.id, to.id, BigInt((next() % 3_000) + 1)).catch(() => undefined); // some are refused; fine
    }
    for (const acc of accounts) {
      const stored = (await t.db.account.findUniqueOrThrow({ where: { id: acc.id } })).balance;
      expect(stored).toBe(await ledgerBalance(t.db, acc.id));
      expect(stored).toBeGreaterThanOrEqual(0n);
    }
    const total = (await t.db.account.findMany({ where: { id: { in: accounts.map((a) => a.id) } } })).reduce(
      (sum, a) => sum + a.balance,
      0n,
    );
    expect(total).toBe(20_000n); // payments only move value, they never create or destroy it
  });
});

describe("recomputeBalance", () => {
  it("reports no change when the stored balance is right", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000n);
    await pay(aAcc.id, bAcc.id, 300n);
    expect(await recomputeBalance(t.db, aAcc.id)).toEqual({ accountId: aAcc.id, stored: 700n, fromLedger: 700n, changed: false });
  });

  it("puts a wrong stored balance back to the ledger's value", async () => {
    const { aAcc } = await twoFundedPeople(1_000n);
    await t.db.account.update({ where: { id: aAcc.id }, data: { balance: 999_999n } }); // simulate corruption
    expect(await recomputeBalance(t.db, aAcc.id)).toMatchObject({ stored: 999_999n, fromLedger: 1_000n, changed: true });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(1_000n);
  });
});
