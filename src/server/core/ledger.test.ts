import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { RuleError } from "./errors";
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

async function twoFundedPeople(aBalance: number, bBalance = 0) {
  const a = await t.person("Ana");
  const b = await t.person("Ben");
  return { a, b, aAcc: await t.account(a.id, t.rcc.id, aBalance), bAcc: await t.account(b.id, t.rcc.id, bBalance) };
}

const pay = (fromAccountId: string, toAccountId: string, amount: number, extra: object = {}) =>
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
    const { aAcc, bAcc } = await twoFundedPeople(10_000);
    const row = await pay(aAcc.id, bAcc.id, 2_550);

    expect(row).toMatchObject({ kind: "PAYMENT", amount: 2_550, fromAccountId: aAcc.id, toAccountId: bAcc.id });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(7_450);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(2_550);
  });

  it("refuses to take a balance below zero by default (R-PAY-02), and changes nothing", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    const before = await t.db.transaction.count();

    const error = await pay(aAcc.id, bAcc.id, 1_001).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RuleError);
    expect((error as RuleError).ruleIds).toEqual(["R-PAY-02"]);

    expect(await t.db.transaction.count()).toBe(before);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(1_000);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: bAcc.id } })).balance).toBe(0);
  });

  it("allows spending exactly down to the limit", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    await pay(aAcc.id, bAcc.id, 1_000);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(0);
  });

  it("uses the node's own negative-balance limit when it has one", async () => {
    const { a, aAcc, bAcc } = await twoFundedPeople(100);
    await t.db.nodeRuleValue.create({ data: { nodeId: a.id, ruleId: "R-PAY-02", value: "500" } });

    expect(await spendable(t.db, aAcc.id)).toBe(600);
    await expect(pay(aAcc.id, bAcc.id, 601)).rejects.toThrow(/negative-balance limit/);
    await pay(aAcc.id, bAcc.id, 600);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(-500);
  });

  it("requires a comment (R-PAY-03)", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    await expect(pay(aAcc.id, bAcc.id, 100, { comment: "   " })).rejects.toMatchObject({ ruleIds: ["R-PAY-03"] });
  });

  it("only accepts whole, positive minor units", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    await expect(pay(aAcc.id, bAcc.id, 0)).rejects.toThrow(/whole number/);
    await expect(pay(aAcc.id, bAcc.id, -5)).rejects.toThrow(/whole number/);
    await expect(pay(aAcc.id, bAcc.id, 12.5)).rejects.toThrow(/whole number/);
  });

  it("records a deposit (no from-account) and a withdrawal (no to-account)", async () => {
    const { aAcc } = await twoFundedPeople(0);
    await postTransaction(t.db, { kind: "DEPOSIT", toAccountId: aAcc.id, amount: 500, comment: "Bank ref 42", actedByPersonId: "x" });
    await postTransaction(t.db, { kind: "WITHDRAWAL", fromAccountId: aAcc.id, amount: 200, comment: "To bank", actedByPersonId: "x" });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(300);
  });

  it("needs the received amount when the currency changes, and credits it", async () => {
    const a = await t.person("Ana");
    const chfAcc = await t.account(a.id, t.chf.id, 1_000);
    const rccAcc = await t.account(a.id, t.rcc.id);

    await expect(
      postTransaction(t.db, { kind: "EXCHANGE", fromAccountId: chfAcc.id, toAccountId: rccAcc.id, amount: 400, comment: "x", actedByPersonId: a.id }),
    ).rejects.toThrow(/toAmount/);

    await postTransaction(t.db, {
      kind: "EXCHANGE",
      fromAccountId: chfAcc.id,
      toAccountId: rccAcc.id,
      amount: 400,
      toAmount: 800,
      rate: "2",
      comment: "Exchange",
      actedByPersonId: a.id,
    });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: chfAcc.id } })).balance).toBe(600);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: rccAcc.id } })).balance).toBe(800);
  });

  it("rejects paying an account to itself", async () => {
    const { aAcc } = await twoFundedPeople(1_000);
    await expect(pay(aAcc.id, aAcc.id, 10)).rejects.toThrow(/must differ/);
  });

  it("lets only one of two payments through when together they would break the limit", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    const results = await Promise.allSettled([pay(aAcc.id, bAcc.id, 600), pay(aAcc.id, bAcc.id, 600)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(400);
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
      await pay(from.id, to.id, (next() % 3_000) + 1).catch(() => undefined); // some are refused; fine
    }
    for (const acc of accounts) {
      const stored = (await t.db.account.findUniqueOrThrow({ where: { id: acc.id } })).balance;
      expect(stored).toBe(await ledgerBalance(t.db, acc.id));
      expect(stored).toBeGreaterThanOrEqual(0);
    }
    const total = (await t.db.account.findMany({ where: { id: { in: accounts.map((a) => a.id) } } })).reduce(
      (sum, a) => sum + a.balance,
      0,
    );
    expect(total).toBe(20_000); // payments only move value, they never create or destroy it
  });
});

describe("recomputeBalance", () => {
  it("reports no change when the stored balance is right", async () => {
    const { aAcc, bAcc } = await twoFundedPeople(1_000);
    await pay(aAcc.id, bAcc.id, 300);
    expect(await recomputeBalance(t.db, aAcc.id)).toEqual({ accountId: aAcc.id, stored: 700, fromLedger: 700, changed: false });
  });

  it("puts a wrong stored balance back to the ledger's value", async () => {
    const { aAcc } = await twoFundedPeople(1_000);
    await t.db.account.update({ where: { id: aAcc.id }, data: { balance: 999_999 } }); // simulate corruption
    expect(await recomputeBalance(t.db, aAcc.id)).toMatchObject({ stored: 999_999, fromLedger: 1_000, changed: true });
    expect((await t.db.account.findUniqueOrThrow({ where: { id: aAcc.id } })).balance).toBe(1_000);
  });
});
