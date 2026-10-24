import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { accept, pause, proposeWork, sendPayment, type Actor, type Terms } from "./interactions";
import { nextDate, runDuePayments } from "./schedules";
import { createTestDb, type TestDb } from "./test-helpers";

// A fresh database for each test: the job pays every due schedule it finds,
// so one test's schedules mustn't show up in the next.
let t: TestDb;
beforeEach(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  // The invariant: every stored balance equals the sum of its ledger rows.
  expect(await t.balancesNotMatchingLedger()).toEqual([]);
  await t.cleanup();
});

const self = (node: { id: string }): Actor => ({ personId: node.id, actingNodeId: node.id });
const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const interactionOf = (id: string) => t.db.interaction.findUniqueOrThrow({ where: { id } });
const paymentsOf = (interactionId: string) =>
  t.db.transaction.findMany({ where: { interactionId }, orderBy: { createdAt: "asc" } });

/** Ana pays Ben on a schedule, accepted by Ben. */
async function schedule(extra: Partial<Terms>, anaBalance = 10_000) {
  const ana = await t.person("Ana");
  const ben = await t.person("Ben");
  await t.account(ana.id, t.rcc.id, anaBalance);
  const { interaction, proposal } = await sendPayment(t.db, self(ana), {
    toNodeId: ben.id,
    terms: { description: "Rent", amount: 1_000, currencyId: t.rcc.id, frequency: "MONTHLY", ...extra },
  });
  await accept(t.db, self(ben), proposal.id);
  return { ana, ben, interactionId: interaction.id };
}

describe("running due scheduled payments (UC-PAY-01)", () => {
  it("pays a due payment once; a second run straight after pays nothing", async () => {
    const { ana, ben, interactionId } = await schedule({ startDate: day("2026-01-15"), maxPayments: 12 });
    const now = day("2026-01-20");

    const first = await runDuePayments(t.db, now);
    expect(first.paid).toEqual([{ interactionId, dueAt: day("2026-01-15"), comment: "Scheduled payment 1 of 12: Rent" }]);
    const second = await runDuePayments(t.db, now);
    expect(second).toEqual({ paid: [], completed: [], failed: [], errors: [] });

    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(9_000);
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(1_000);
    const rows = await paymentsOf(interactionId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "PAYMENT", amount: 1_000, comment: "Scheduled payment 1 of 12: Rent" });
    expect((await interactionOf(interactionId)).nextDueAt).toEqual(day("2026-02-15"));
  });

  it("never pays the same due date twice when two runs overlap", async () => {
    const { interactionId } = await schedule({ startDate: day("2026-01-15") });
    const now = day("2026-01-20");
    const runs = await Promise.all([runDuePayments(t.db, now), runDuePayments(t.db, now)]);
    expect(runs.flatMap((r) => r.paid)).toHaveLength(1);
    expect(await paymentsOf(interactionId)).toHaveLength(1);
  });

  it("does nothing before the due date, or while paused", async () => {
    const { ana, interactionId } = await schedule({ startDate: day("2026-03-01") });
    expect((await runDuePayments(t.db, day("2026-02-28"))).paid).toEqual([]);
    await pause(t.db, self(ana), interactionId);
    expect((await runDuePayments(t.db, day("2026-03-02"))).paid).toEqual([]);
    expect(await paymentsOf(interactionId)).toHaveLength(0);
  });

  it("moves a recurring payment on to its next date, and completes it after its last payment", async () => {
    const { ana, ben, interactionId } = await schedule({ startDate: day("2026-01-31"), maxPayments: 3 });

    await runDuePayments(t.db, day("2026-02-01"));
    // The 31st falls back to February's last day, then returns to the 31st.
    expect(await interactionOf(interactionId)).toMatchObject({ status: "ACTIVE", nextDueAt: day("2026-02-28") });
    await runDuePayments(t.db, day("2026-03-01"));
    expect((await interactionOf(interactionId)).nextDueAt).toEqual(day("2026-03-31"));

    const last = await runDuePayments(t.db, day("2026-04-01"));
    expect(last.paid.map((p) => p.comment)).toEqual(["Scheduled payment 3 of 3: Rent"]);
    expect(last.completed).toEqual([interactionId]);
    expect(await interactionOf(interactionId)).toMatchObject({ status: "COMPLETED", nextDueAt: null });

    expect((await runDuePayments(t.db, day("2026-12-31"))).paid).toEqual([]);
    expect(await paymentsOf(interactionId)).toHaveLength(3);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(7_000);
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(3_000);
    const activity = await t.db.activity.findMany({ where: { type: "interaction.completed", refId: interactionId } });
    expect(activity.map((a) => a.nodeId).sort()).toEqual([ana.id, ben.id].sort());
  });

  it("completes on the end date, and catches up on due dates the job missed", async () => {
    const { interactionId } = await schedule({
      frequency: "WEEKLY",
      startDate: day("2026-01-05"),
      endDate: day("2026-01-19"),
    });
    // The job didn't run for a month: rules.yaml says pay_each, so all three are paid, oldest first.
    const result = await runDuePayments(t.db, day("2026-02-05"));
    expect(result.paid.map((p) => [p.dueAt, p.comment])).toEqual([
      [day("2026-01-05"), "Scheduled payment 1: Rent"],
      [day("2026-01-12"), "Scheduled payment 2: Rent"],
      [day("2026-01-19"), "Scheduled payment 3: Rent"],
    ]);
    expect(result.completed).toEqual([interactionId]);
    expect((await interactionOf(interactionId)).status).toBe("COMPLETED");
  });

  it("pays automatic work on schedule", async () => {
    const ana = await t.person("Ana");
    const ben = await t.person("Ben");
    await t.account(ana.id, t.rcc.id, 5_000);
    const { interaction, proposal } = await proposeWork(t.db, self(ana), {
      otherNodeId: ben.id,
      actingNodePays: true,
      terms: { description: "Gardening", amount: 2_000, currencyId: t.rcc.id, frequency: "WEEKLY", maxPayments: 2, startDate: day("2026-05-04") },
    });
    await accept(t.db, self(ben), proposal.id);
    const result = await runDuePayments(t.db, day("2026-05-20"));
    expect(result.paid.map((p) => p.comment)).toEqual([
      "Scheduled payment 1 of 2: Gardening",
      "Scheduled payment 2 of 2: Gardening",
    ]);
    expect((await interactionOf(interaction.id)).status).toBe("COMPLETED");
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(4_000);
  });

  it("cancels the schedule when a payment fails, notifies both sides and lowers the trust score (R-PAY-05)", async () => {
    // Enough for the first payment, not the second (the negative-balance limit is 0).
    const { ana, ben, interactionId } = await schedule({ startDate: day("2026-01-10") }, 1_500);
    const { relationshipId } = await interactionOf(interactionId);

    await runDuePayments(t.db, day("2026-01-11"));
    const trustBefore = (await t.db.trustScore.findUniqueOrThrow({ where: { relationshipId } })).value;

    const result = await runDuePayments(t.db, day("2026-02-11"));
    expect(result.paid).toEqual([]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({ interactionId, dueAt: day("2026-02-10") });
    expect(result.failed[0]!.reason).toMatch(/negative-balance limit/);
    expect(await interactionOf(interactionId)).toMatchObject({ status: "CANCELLED", nextDueAt: null });

    // Nothing moved for the failed payment.
    expect(await paymentsOf(interactionId)).toHaveLength(1);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(500);

    const notices = await t.db.activity.findMany({ where: { type: "schedule.failed", refId: interactionId } });
    expect(notices.map((n) => n.nodeId).sort()).toEqual([ana.id, ben.id].sort());
    expect(notices[0]!.summary).toMatch(/^Scheduled payment 2: Rent failed \(not enough funds.*\), so a payment of .* was cancelled$/);

    const trustAfter = (await t.db.trustScore.findUniqueOrThrow({ where: { relationshipId } })).value;
    expect(trustAfter).toBeLessThan(trustBefore);

    // Cancelled for good: later runs leave it alone.
    expect(await runDuePayments(t.db, day("2026-06-01"))).toEqual({ paid: [], completed: [], failed: [], errors: [] });
  });
});

describe("next date on the schedule", () => {
  it("steps weekly and monthly, keeping the start date's day", () => {
    const weekly = { frequency: "WEEKLY" as const, startDate: day("2026-01-05") };
    expect(nextDate(day("2026-01-05"), weekly)).toEqual(day("2026-01-12"));
    const monthly = { frequency: "MONTHLY" as const, startDate: day("2026-01-31") };
    expect(nextDate(day("2026-01-31"), monthly)).toEqual(day("2026-02-28"));
    expect(nextDate(day("2026-02-28"), monthly)).toEqual(day("2026-03-31"));
    expect(nextDate(day("2026-04-30"), monthly)).toEqual(day("2026-05-31"));
    expect(nextDate(day("2026-01-01"), { frequency: "ONCE", startDate: null })).toBeNull();
  });
});
