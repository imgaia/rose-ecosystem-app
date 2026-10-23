import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { decideProposal } from "./index";
import {
  accept,
  amend,
  cancel,
  complete,
  counterPropose,
  decline,
  pause,
  proposeWork,
  requestPayment,
  requestWorkPayment,
  resume,
  sendPayment,
  withdrawProposal,
  type Actor,
  type Terms,
} from "./interactions";
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

/** An individual acting for themselves. */
const self = (node: { id: string }): Actor => ({ personId: node.id, actingNodeId: node.id });
const terms = (amount: number, extra: Partial<Terms> = {}): Terms => ({
  description: "Thanks",
  amount,
  currencyId: t.rcc.id,
  ...extra,
});
const statusOf = async (interactionId: string) =>
  (await t.db.interaction.findUniqueOrThrow({ where: { id: interactionId } })).status;
const relationshipOf = (interactionId: string) =>
  t.db.interaction.findUniqueOrThrow({ where: { id: interactionId } }).relationship();
const trustOf = async (relationshipId: string) =>
  (await t.db.trustScore.findUnique({ where: { relationshipId } }))?.value;

async function pair(aBalance = 10_000) {
  const ana = await t.person("Ana");
  const ben = await t.person("Ben");
  await t.account(ana.id, t.rcc.id, aBalance);
  await t.account(ben.id, t.rcc.id);
  return { ana, ben };
}

describe("send a payment or gift (UC-INT-01)", () => {
  it("moves nothing until the recipient accepts; accepting pays and forms the relationship", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(2_500) });

    expect(interaction.status).toBe("PROPOSED");
    expect((await relationshipOf(interaction.id))?.status).toBe("PENDING");
    expect(proposal.approvers.find((a) => a.approverNodeId === ana.id)?.decision).toBe(true); // sending = approving
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(10_000);

    await accept(t.db, self(ben), proposal.id);

    expect(await statusOf(interaction.id)).toBe("COMPLETED");
    const relationship = await relationshipOf(interaction.id);
    expect(relationship?.status).toBe("ACTIVE");
    expect(relationship?.formedAt).toBeInstanceOf(Date);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(7_500);
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(2_500);

    const rows = await t.db.transaction.findMany({ where: { interactionId: interaction.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "PAYMENT", amount: 2_500, comment: "Thanks", actedByPersonId: ben.id });
  });

  it("moves nothing when the recipient declines", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(2_500) });
    await decline(t.db, self(ben), proposal.id, "No thanks");

    expect(await statusOf(interaction.id)).toBe("DECLINED");
    expect((await relationshipOf(interaction.id))?.status).toBe("CLOSED"); // it never formed
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(10_000);
  });

  it("refuses to send more than the payer can afford (R-PAY-02)", async () => {
    const { ana, ben } = await pair(1_000);
    await expect(sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(1_001) })).rejects.toMatchObject({
      ruleIds: ["R-PAY-02"],
    });
    expect(await t.db.interaction.count({ where: { payerNodeId: ana.id } })).toBe(0);
  });

  it("fails the acceptance, leaving the proposal open, if the payer can no longer afford it", async () => {
    const { ana, ben } = await pair(1_000);
    const carl = await t.person("Carl");
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(800) });
    const second = await sendPayment(t.db, self(ana), { toNodeId: carl.id, terms: terms(800) });
    await accept(t.db, self(ben), first.proposal.id);

    await expect(accept(t.db, self(carl), second.proposal.id)).rejects.toMatchObject({ ruleIds: ["R-PAY-02"] });
    expect((await t.db.proposal.findUniqueOrThrow({ where: { id: second.proposal.id } })).status).toBe("OPEN");
    expect(await statusOf(second.interaction.id)).toBe("PROPOSED");
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(200);
  });

  it("requires a comment (R-PAY-03)", async () => {
    const { ana, ben } = await pair();
    await expect(
      sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100, { description: " " }) }),
    ).rejects.toMatchObject({ ruleIds: ["R-PAY-03"] });
  });

  it("records a gift as a GIFT and gives the recipient an account in that currency", async () => {
    const { ana } = await pair();
    const dora = await t.person("Dora"); // no RCC account yet
    const { interaction, proposal } = await sendPayment(t.db, self(ana), {
      toNodeId: dora.id,
      kind: "GIFT",
      terms: terms(300),
    });
    await accept(t.db, self(dora), proposal.id);
    expect(await t.balanceOf(dora.id, t.rcc.id)).toBe(300);
    expect((await t.db.transaction.findFirstOrThrow({ where: { interactionId: interaction.id } })).kind).toBe("GIFT");
  });

  it("keeps one relationship per pair, whoever proposes", async () => {
    const { ana, ben } = await pair();
    await t.account(ben.id, t.chf.id);
    const one = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    const two = await requestPayment(t.db, self(ana), { fromNodeId: ben.id, amount: 50, currencyId: t.rcc.id, comment: "Lunch" });
    expect(one.interaction.relationshipId).toBe(two.interaction.relationshipId);
    expect(await t.db.relationship.count({ where: { id: one.interaction.relationshipId } })).toBe(1);
  });

  it("starts a recurring payment without moving money; it then runs on schedule", async () => {
    const { ana, ben } = await pair();
    const start = new Date("2027-01-01T00:00:00Z");
    const { interaction, proposal } = await sendPayment(t.db, self(ana), {
      toNodeId: ben.id,
      terms: terms(1_000, { frequency: "MONTHLY", startDate: start }),
    });
    await accept(t.db, self(ben), proposal.id);
    const after = await t.db.interaction.findUniqueOrThrow({ where: { id: interaction.id } });
    expect(after.status).toBe("ACTIVE");
    expect(after.nextDueAt).toEqual(start);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(10_000);
  });
});

describe("who may answer, and withdrawing (UC-INT-04, UC-INT-06)", () => {
  it("does not let the proposer approve twice, or a third node approve at all", async () => {
    const { ana, ben } = await pair();
    const eve = await t.person("Eve");
    const { proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await expect(accept(t.db, self(ana), proposal.id)).rejects.toThrow(/already decided/);
    await expect(accept(t.db, self(eve), proposal.id)).rejects.toThrow(/not asked/);
  });

  it("lets the proposer withdraw before acceptance, and then it can't be accepted", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await expect(withdrawProposal(t.db, self(ben), proposal.id)).rejects.toThrow(/Only the node that proposed/);
    await withdrawProposal(t.db, self(ana), proposal.id);

    expect(await statusOf(interaction.id)).toBe("WITHDRAWN");
    await expect(accept(t.db, self(ben), proposal.id)).rejects.toThrow(/already withdrawn/);
  });
});

describe("a relationship that never forms is closed", () => {
  it("closes it when the only proposal is withdrawn", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await withdrawProposal(t.db, self(ana), proposal.id);
    const relationship = await relationshipOf(interaction.id);
    expect(relationship).toMatchObject({ status: "CLOSED", formedAt: null });
  });

  it("keeps it pending while another proposal between the pair is still waiting", async () => {
    const { ana, ben } = await pair();
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    const second = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(200) });
    await decline(t.db, self(ben), first.proposal.id);
    expect((await relationshipOf(first.interaction.id))?.status).toBe("PENDING");

    await accept(t.db, self(ben), second.proposal.id);
    expect((await relationshipOf(first.interaction.id))?.status).toBe("ACTIVE");
  });

  it("reopens the same relationship if the pair proposes again, and it can then form", async () => {
    const { ana, ben } = await pair();
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await decline(t.db, self(ben), first.proposal.id);

    const again = await requestPayment(t.db, self(ben), { fromNodeId: ana.id, amount: 300, currencyId: t.rcc.id, comment: "Tools" });
    expect(again.interaction.relationshipId).toBe(first.interaction.relationshipId);
    expect((await relationshipOf(again.interaction.id))?.status).toBe("PENDING");

    await accept(t.db, self(ana), again.proposal.id);
    expect((await relationshipOf(again.interaction.id))?.status).toBe("ACTIVE");
  });

  it("leaves a formed relationship active when a later proposal is declined", async () => {
    const { ana, ben } = await pair();
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await accept(t.db, self(ben), first.proposal.id);
    const second = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await decline(t.db, self(ben), second.proposal.id);
    expect((await relationshipOf(second.interaction.id))?.status).toBe("ACTIVE");
  });
});

describe("activity history (UC-NET-06)", () => {
  /** This node's activity, oldest first, leaving out the test's opening deposits. */
  const activityOf = (nodeId: string) =>
    t.db.activity.findMany({
      where: { nodeId, type: { not: "transaction.deposit" } },
      orderBy: { createdAt: "asc" },
      select: { type: true, summary: true, refId: true },
    });
  const typesOf = async (nodeId: string) => (await activityOf(nodeId)).map((a) => a.type).sort();

  it("writes each event of a payment to both sides, with a plain summary", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(2_550) });
    await accept(t.db, self(ben), proposal.id);

    const expected = ["interaction.accepted", "interaction.proposed", "relationship.formed", "transaction.payment"];
    expect(await typesOf(ana.id)).toEqual(expected);
    expect(await typesOf(ben.id)).toEqual(expected);

    const summaries = (await activityOf(ben.id)).map((a) => a.summary);
    expect(summaries).toEqual(
      expect.arrayContaining([
        "Ana proposed a payment of 25.50 RCC from Ana to Ben",
        "Ana and Ben formed a relationship",
        "Ana paid Ben 25.50 RCC",
        "Ben accepted a payment of 25.50 RCC from Ana to Ben",
      ]),
    );
    const payment = await t.db.transaction.findFirstOrThrow({ where: { interactionId: interaction.id } });
    expect((await activityOf(ana.id)).find((a) => a.type === "transaction.payment")?.refId).toBe(payment.id);
    expect((await activityOf(ana.id)).find((a) => a.type === "interaction.proposed")?.refId).toBe(interaction.id);
  });

  it("records a decline, and the relationship closing, but no payment", async () => {
    const { ana, ben } = await pair();
    const { proposal } = await sendPayment(t.db, self(ana), { toNodeId: ben.id, kind: "GIFT", terms: terms(100) });
    await decline(t.db, self(ben), proposal.id);
    expect(await typesOf(ana.id)).toEqual(["interaction.declined", "interaction.proposed", "relationship.closed"]);
    expect((await activityOf(ana.id)).map((a) => a.summary)).toContain("Ben declined a gift of 1.00 RCC from Ana to Ben");
  });

  it("records the life of a work interaction", async () => {
    const { ana, ben } = await pair();
    const job = await proposeWork(t.db, self(ben), {
      otherNodeId: ana.id,
      actingNodePays: false,
      terms: { description: "Build a bench", amount: 5_000, currencyId: t.rcc.id, paymentMode: "ON_REQUEST" },
    });
    const counter = await counterPropose(t.db, self(ana), { proposalId: job.proposal.id, changes: { amount: 4_000 } });
    await accept(t.db, self(ben), counter.id);
    const request = await requestWorkPayment(t.db, self(ben), { interactionId: job.interaction.id, comment: "Done" });
    await accept(t.db, self(ana), request.id);
    await pause(t.db, self(ana), job.interaction.id);
    await resume(t.db, self(ben), job.interaction.id);
    await complete(t.db, self(ben), job.interaction.id);

    const ben_ = await activityOf(ben.id);
    expect(ben_.map((a) => a.type).sort()).toEqual([
      "interaction.completed",
      "interaction.paused",
      "interaction.proposed",
      "interaction.resumed",
      "payment_request.accepted",
      "payment_request.proposed",
      "relationship.formed",
      "terms.accepted",
      "terms.proposed",
      "transaction.payment",
    ]);
    expect(ben_.map((a) => a.summary)).toEqual(
      expect.arrayContaining([
        'Ana counter-proposed new terms for work "Build a bench" for 40.00 RCC, paid by Ana to Ben',
        'Ben accepted new terms for work "Build a bench" for 40.00 RCC, paid by Ana to Ben',
        'Ben proposed a payment request of 40.00 RCC for "Build a bench"',
        'Ana paused work "Build a bench" for 40.00 RCC, paid by Ana to Ben',
      ]),
    );
  });

  it("names the person acting for a collection, and writes to the collection's history", async () => {
    const mo = await t.person("Mo");
    const carol = await t.person("Carol");
    const rose = await t.collection("ROSE Org", [{ node: mo, roles: ["MEMBER"] }]);
    await t.account(carol.id, t.rcc.id, 5_000);
    const { proposal } = await sendPayment(t.db, self(carol), { toNodeId: rose.id, terms: terms(1_500) });
    await accept(t.db, { personId: mo.id, actingNodeId: rose.id }, proposal.id);

    expect((await activityOf(rose.id)).map((a) => a.summary)).toContain(
      "Mo for ROSE Org accepted a payment of 15.00 RCC from Carol to ROSE Org",
    );
    expect(await activityOf(mo.id)).toEqual([]); // Mo acted, but Mo's own node wasn't involved
  });

  it("is written in the same database transaction: a failed action leaves no activity", async () => {
    const { ana, ben } = await pair(1_000);
    const carl = await t.person("Carl");
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(800) });
    const second = await sendPayment(t.db, self(ana), { toNodeId: carl.id, terms: terms(800) });
    await accept(t.db, self(ben), first.proposal.id);
    await expect(accept(t.db, self(carl), second.proposal.id)).rejects.toMatchObject({ ruleIds: ["R-PAY-02"] });
    expect(await typesOf(carl.id)).toEqual(["interaction.proposed"]);
  });
});

describe("request a payment (UC-INT-02)", () => {
  it("pays when the paying side approves", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await requestPayment(t.db, self(ben), {
      fromNodeId: ana.id,
      amount: 700,
      currencyId: t.rcc.id,
      comment: "Garden help",
    });
    await accept(t.db, self(ana), proposal.id);
    expect(await statusOf(interaction.id)).toBe("COMPLETED");
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(700);
  });

  it("pays nothing when the paying side declines", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await requestPayment(t.db, self(ben), {
      fromNodeId: ana.id,
      amount: 700,
      currencyId: t.rcc.id,
      comment: "Garden help",
    });
    await decline(t.db, self(ana), proposal.id);
    expect(await statusOf(interaction.id)).toBe("DECLINED");
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(0);
  });
});

describe("work (UC-INT-03 to UC-INT-08)", () => {
  const work = (amount: number, extra: Partial<Terms> = {}) =>
    terms(amount, { description: "Build a bench", frequency: "ONCE", paymentMode: "ON_REQUEST", ...extra });

  async function activeWork() {
    const { ana, ben } = await pair();
    // Ben does the work; Ana pays.
    const { interaction, proposal } = await proposeWork(t.db, self(ben), {
      otherNodeId: ana.id,
      actingNodePays: false,
      terms: work(5_000),
    });
    await accept(t.db, self(ana), proposal.id);
    return { ana, ben, interactionId: interaction.id };
  }

  it("becomes active on acceptance, forms the relationship, and moves no money yet", async () => {
    const { ana, interactionId } = await activeWork();
    expect(await statusOf(interactionId)).toBe("ACTIVE");
    expect((await relationshipOf(interactionId))?.status).toBe("ACTIVE");
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(10_000);
  });

  it("counter-propose: new terms wait on the other side; accepting them makes them current", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await proposeWork(t.db, self(ben), {
      otherNodeId: ana.id,
      actingNodePays: false,
      terms: work(5_000),
    });
    const counter = await counterPropose(t.db, self(ana), { proposalId: proposal.id, changes: { amount: 4_000 } });

    expect((await t.db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })).status).toBe("DECLINED");
    expect(await statusOf(interaction.id)).toBe("PROPOSED"); // still alive, through the counter
    // Ana proposed the counter, so it's Ben's turn; Ana can't accept her own.
    await expect(accept(t.db, self(ana), counter.id)).rejects.toThrow(/already decided/);
    await accept(t.db, self(ben), counter.id);

    expect(await statusOf(interaction.id)).toBe("ACTIVE");
    const versions = await t.db.interactionTerms.findMany({ where: { interactionId: interaction.id }, orderBy: { version: "asc" } });
    expect(versions.map((v) => [v.version, v.amount, v.approved])).toEqual([
      [1, 5_000, false],
      [2, 4_000, true],
    ]);
  });

  it("declining a counter-proposal before anything was agreed ends the interaction", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await proposeWork(t.db, self(ben), {
      otherNodeId: ana.id,
      actingNodePays: false,
      terms: work(5_000),
    });
    const counter = await counterPropose(t.db, self(ana), { proposalId: proposal.id, changes: { amount: 4_000 } });
    await decline(t.db, self(ben), counter.id);
    expect(await statusOf(interaction.id)).toBe("DECLINED");
    expect((await relationshipOf(interaction.id))?.status).toBe("CLOSED");
  });

  it("only allows counter-proposals on work, and only by the side being asked", async () => {
    const { ana, ben } = await pair();
    const payment = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await expect(counterPropose(t.db, self(ben), { proposalId: payment.proposal.id, changes: { amount: 50 } })).rejects.toThrow(
      /Only work/,
    );
    const job = await proposeWork(t.db, self(ben), { otherNodeId: ana.id, actingNodePays: false, terms: work(5_000) });
    await expect(counterPropose(t.db, self(ben), { proposalId: job.proposal.id, changes: { amount: 6_000 } })).rejects.toThrow(
      /not yet approved/,
    );
  });

  it("amend: current terms stay in force until the other side accepts", async () => {
    const { ana, ben, interactionId } = await activeWork();
    const amendment = await amend(t.db, self(ben), { interactionId, changes: { amount: 6_000 } });

    // Still the old price for a payment request while the amendment waits.
    const request = await requestWorkPayment(t.db, self(ben), { interactionId, comment: "Bench done" });
    expect(JSON.parse(request.payload)).toMatchObject({ amount: 5_000 });
    await expect(amend(t.db, self(ana), { interactionId, changes: { amount: 5_500 } })).rejects.toThrow(/already waiting/);

    await accept(t.db, self(ana), amendment.id);
    const next = await requestWorkPayment(t.db, self(ben), { interactionId, comment: "Second bench" });
    expect(JSON.parse(next.payload)).toMatchObject({ amount: 6_000 });
  });

  it("declining an amendment keeps the interaction active on the old terms", async () => {
    const { ana, ben, interactionId } = await activeWork();
    const amendment = await amend(t.db, self(ben), { interactionId, changes: { amount: 6_000 } });
    await decline(t.db, self(ana), amendment.id);
    expect(await statusOf(interactionId)).toBe("ACTIVE");
    const current = await t.db.interactionTerms.findFirstOrThrow({
      where: { interactionId, approved: true },
      orderBy: { version: "desc" },
    });
    expect(current.amount).toBe(5_000);
  });

  it("a payment request defaults to the agreed price and pays when the payer approves", async () => {
    const { ana, ben, interactionId } = await activeWork();
    const request = await requestWorkPayment(t.db, self(ben), { interactionId, comment: "Bench delivered" });
    await expect(requestWorkPayment(t.db, self(ana), { interactionId, comment: "x" })).rejects.toThrow(/side being paid/);

    await accept(t.db, self(ana), request.id);
    expect(await t.balanceOf(ben.id, t.rcc.id)).toBe(5_000);
    const row = await t.db.transaction.findFirstOrThrow({ where: { interactionId } });
    expect(row).toMatchObject({ kind: "PAYMENT", amount: 5_000, comment: "Bench delivered" });
  });

  it("pause and resume, by either side alone; resuming skips due dates missed while paused", async () => {
    const { ana } = await pair();
    const ben = await t.person("Ben");
    const { interaction, proposal } = await proposeWork(t.db, self(ana), {
      otherNodeId: ben.id,
      actingNodePays: true,
      terms: work(1_000, { frequency: "WEEKLY", paymentMode: "AUTOMATIC", startDate: new Date("2026-01-05T09:00:00Z") }),
    });
    await accept(t.db, self(ben), proposal.id);

    await pause(t.db, self(ben), interaction.id);
    expect(await statusOf(interaction.id)).toBe("PAUSED");
    await expect(pause(t.db, self(ana), interaction.id)).rejects.toThrow(/Can't pause a paused/);

    await resume(t.db, self(ana), interaction.id);
    const resumed = await t.db.interaction.findUniqueOrThrow({ where: { id: interaction.id } });
    expect(resumed.status).toBe("ACTIVE");
    expect(resumed.nextDueAt!.getTime()).toBeGreaterThanOrEqual(Date.now());
    expect(resumed.nextDueAt!.getUTCDay()).toBe(1); // still on the Monday schedule
  });

  it("complete stops the schedule and keeps the record; nothing more can change it", async () => {
    const { ana, interactionId } = await activeWork();
    await complete(t.db, self(ana), interactionId);
    const done = await t.db.interaction.findUniqueOrThrow({ where: { id: interactionId } });
    expect(done).toMatchObject({ status: "COMPLETED", nextDueAt: null });
    await expect(pause(t.db, self(ana), interactionId)).rejects.toThrow(/completed/);
    await expect(amend(t.db, self(ana), { interactionId, changes: { amount: 1 } })).rejects.toThrow(/completed/);
  });

  it("cancel withdraws a pending amendment and steps the trust score down", async () => {
    const { ana, ben, interactionId } = await activeWork();
    const relationship = await relationshipOf(interactionId);
    // Build some trust first with a completed payment.
    const request = await requestWorkPayment(t.db, self(ben), { interactionId, comment: "First part" });
    await accept(t.db, self(ana), request.id);
    expect(await trustOf(relationship.id)).toBeCloseTo(0.775);

    const amendment = await amend(t.db, self(ben), { interactionId, changes: { amount: 9_000 } });
    await cancel(t.db, self(ana), interactionId);

    expect(await statusOf(interactionId)).toBe("CANCELLED");
    expect((await t.db.proposal.findUniqueOrThrow({ where: { id: amendment.id } })).status).toBe("WITHDRAWN");
    expect(await trustOf(relationship.id)).toBeCloseTo(0.775 - 0.1 * (1 - 0.775));
  });

  it("does not let an outsider pause or cancel", async () => {
    const { interactionId } = await activeWork();
    const eve = await t.person("Eve");
    await expect(cancel(t.db, self(eve), interactionId)).rejects.toThrow(/not a side/);
  });
});

describe("recurring payments: only the payer can change or stop them (UC-INT-10)", () => {
  it("lets the payer cancel and amend, not the payee", async () => {
    const { ana, ben } = await pair();
    const { interaction, proposal } = await sendPayment(t.db, self(ana), {
      toNodeId: ben.id,
      terms: terms(1_000, { frequency: "MONTHLY" }),
    });
    await accept(t.db, self(ben), proposal.id);

    await expect(cancel(t.db, self(ben), interaction.id)).rejects.toThrow(/Only the paying side/);
    const change = await amend(t.db, self(ana), { interactionId: interaction.id, changes: { amount: 1_200 } });
    await accept(t.db, self(ben), change.id); // a change goes back to the recipient (R-REL-02)
    await cancel(t.db, self(ana), interaction.id);
    expect(await statusOf(interaction.id)).toBe("CANCELLED");
  });
});

describe("trust score stub", () => {
  it("closes 10% of the gap per completed payment, but not for gifts", async () => {
    const { ana, ben } = await pair();
    const first = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await accept(t.db, self(ben), first.proposal.id);
    const relationshipId = first.interaction.relationshipId;
    expect(await trustOf(relationshipId)).toBeCloseTo(0.775);

    const second = await sendPayment(t.db, self(ana), { toNodeId: ben.id, terms: terms(100) });
    await accept(t.db, self(ben), second.proposal.id);
    expect(await trustOf(relationshipId)).toBeCloseTo(0.7975);

    const gift = await sendPayment(t.db, self(ana), { toNodeId: ben.id, kind: "GIFT", terms: terms(100) });
    await accept(t.db, self(ben), gift.proposal.id);
    expect(await trustOf(relationshipId)).toBeCloseTo(0.7975);
  });
});

describe("a collection: any member accepts money in, only a Treasurer pays out (R-REL-07)", () => {
  async function org() {
    const tess = await t.person("Tess"); // Treasurer of the org
    const mo = await t.person("Mo"); // plain member
    const carol = await t.person("Carol"); // outsider
    const rose = await t.collection("ROSE Org", [
      { node: tess, roles: ["MEMBER", "TREASURER", "OWNER"] },
      { node: mo, roles: ["MEMBER"] },
    ]);
    await t.account(rose.id, t.rcc.id, 10_000);
    await t.account(carol.id, t.rcc.id, 10_000);
    return {
      rose,
      carol,
      asTess: { personId: tess.id, actingNodeId: rose.id },
      asMo: { personId: mo.id, actingNodeId: rose.id },
      asCarol: self(carol),
    };
  }

  it("lets a plain member accept a payment coming in", async () => {
    const { rose, carol, asMo, asCarol } = await org();
    const { proposal } = await sendPayment(t.db, asCarol, { toNodeId: rose.id, terms: terms(1_500) });
    const decided = await accept(t.db, asMo, proposal.id);

    expect(decided.approvers.find((a) => a.approverNodeId === rose.id)?.decidedByPersonId).toBe(asMo.personId);
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(11_500);
    expect(await t.balanceOf(carol.id, t.rcc.id)).toBe(8_500);
  });

  it("does not let a plain member send money out, and says a Treasurer is needed", async () => {
    const { rose, carol, asMo } = await org();
    await expect(sendPayment(t.db, asMo, { toNodeId: carol.id, terms: terms(1_000) })).rejects.toMatchObject({
      ruleIds: ["R-GOV-05"],
      needsRoles: ["TREASURER"],
    });
    expect(await t.db.interaction.count({ where: { payerNodeId: rose.id } })).toBe(0);
  });

  it("lets the Treasurer send money out", async () => {
    const { rose, carol, asTess, asCarol } = await org();
    const { proposal } = await sendPayment(t.db, asTess, { toNodeId: carol.id, terms: terms(1_000) });
    await accept(t.db, asCarol, proposal.id);
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(9_000);
  });

  it("only lets the Treasurer approve a payment requested from the collection", async () => {
    const { rose, asMo, asTess, asCarol } = await org();
    const { proposal } = await requestPayment(t.db, asCarol, {
      fromNodeId: rose.id,
      amount: 2_000,
      currencyId: t.rcc.id,
      comment: "Workshop",
    });
    await expect(accept(t.db, asMo, proposal.id)).rejects.toMatchObject({ needsRoles: ["TREASURER"] });
    // The inbox's single entry point works the same way.
    await decideProposal(t.db, { proposalId: proposal.id, approverNodeId: rose.id, personId: asTess.personId, approve: true });
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(8_000);
  });

  it("lets a plain member request a payment, or propose work, where the collection is paid", async () => {
    const { rose, carol, asMo, asCarol } = await org();
    const request = await requestPayment(t.db, asMo, { fromNodeId: carol.id, amount: 500, currencyId: t.rcc.id, comment: "Dues" });
    await accept(t.db, asCarol, request.proposal.id);
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(10_500);

    await proposeWork(t.db, asMo, {
      otherNodeId: carol.id,
      actingNodePays: false,
      terms: terms(3_000, { description: "Event space" }),
    });
  });

  it("does not let a plain member propose work where the collection pays", async () => {
    const { carol, asMo } = await org();
    await expect(
      proposeWork(t.db, asMo, { otherNodeId: carol.id, actingNodePays: true, terms: terms(3_000, { description: "Cleaning" }) }),
    ).rejects.toMatchObject({ needsRoles: ["TREASURER"] });
  });

  it("lets a plain member pause work where the collection is paid, but not where it pays", async () => {
    const { carol, asMo, asTess, asCarol } = await org();
    const paidToOrg = await proposeWork(t.db, asCarol, { otherNodeId: asMo.actingNodeId, actingNodePays: true, terms: terms(3_000, { description: "Talk" }) });
    await accept(t.db, asMo, paidToOrg.proposal.id);
    await pause(t.db, asMo, paidToOrg.interaction.id);

    const orgPays = await proposeWork(t.db, asTess, { otherNodeId: carol.id, actingNodePays: true, terms: terms(3_000, { description: "Repairs" }) });
    await accept(t.db, asCarol, orgPays.proposal.id);
    await expect(pause(t.db, asMo, orgPays.interaction.id)).rejects.toMatchObject({ needsRoles: ["TREASURER"] });
  });
});
