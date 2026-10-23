// Tests for the tRPC routers (step 5): every procedure runs the rules check
// first and refuses what the person's roles in the acting node don't allow,
// saying which rule blocked it and which role would allow it.
// They call the real routers against a throwaway database (test-helpers.ts).

import { TRPCError } from "@trpc/server";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { RuleError } from "~/server/core";
import { createTestDb, type TestDb } from "~/server/core/test-helpers";

// The app's database client reads env settings on import; tests pass their own.
vi.mock("~/server/db", () => ({ db: {} }));
const { createCaller } = await import("~/server/api/root");

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterEach(async () => {
  expect(await t.balancesNotMatchingLedger()).toEqual([]);
});
afterAll(async () => {
  await t.cleanup();
});

/** The API as this person sees it (null = not signed in). */
function as(person: { id: string } | null) {
  const ctx = { db: t.db, headers: new Headers(), sessionNodeId: person?.id ?? null };
  return createCaller(ctx);
}

/** Run `call`, expect it to fail, and return the error with its rule details. */
async function refused(call: Promise<unknown>) {
  const error = await call.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(TRPCError);
  const e = error as TRPCError;
  const rule = e.cause instanceof RuleError ? e.cause : null;
  return { code: e.code, message: e.message, ruleIds: rule?.ruleIds ?? [], needsRoles: rule?.needsRoles ?? [] };
}

/** ROSE Org: Tess is Treasurer and Member, Mo only a Member. Ana and Zed are outside it. */
async function org() {
  const [ana, tess, mo, zed] = await Promise.all(["Ana", "Tess", "Mo", "Zed"].map((n) => t.person(n)));
  const rose = await t.collection("ROSE Org", [
    { node: tess!, roles: ["MEMBER", "TREASURER", "OWNER"] },
    { node: mo!, roles: ["MEMBER"] },
  ]);
  await t.account(ana!.id, t.rcc.id, 10_000);
  await t.account(rose.id, t.rcc.id, 5_000);
  return { ana: ana!, tess: tess!, mo: mo!, zed: zed!, rose };
}

const terms = (currencyId: string, amount: number, description = "Thanks") => ({ description, amount, currencyId });

describe("signing in and acting for a node", () => {
  it("refuses everything to someone not signed in", async () => {
    const { rose } = await org();
    expect((await refused(as(null).nodes.me())).code).toBe("UNAUTHORIZED");
    expect((await refused(as(null).proposals.inbox({ actingNodeId: rose.id }))).code).toBe("UNAUTHORIZED");
  });

  it("lists the nodes a person can act for, with their roles there", async () => {
    const { mo, rose } = await org();
    const me = await as(mo).nodes.me();
    expect(me.actingAs.map((a) => a.node.id)).toEqual([mo.id, rose.id]);
    expect(me.actingAs[1]!.roles.map((r) => r.key)).toEqual(["MEMBER"]);
    expect(me.person).not.toHaveProperty("passwordHash");
  });

  it("refuses to act for a collection the person doesn't belong to", async () => {
    const { zed, rose } = await org();
    const e = await refused(as(zed).nodes.switchActingNode({ actingNodeId: rose.id }));
    expect(e).toMatchObject({ code: "FORBIDDEN", ruleIds: ["R-GOV-05"], needsRoles: ["MEMBER"] });
    expect((await refused(as(zed).proposals.inbox({ actingNodeId: rose.id }))).code).toBe("FORBIDDEN");
  });

  it("switching returns what the person may do there, for disabled buttons", async () => {
    const { mo, rose } = await org();
    const { permissions } = await as(mo).nodes.switchActingNode({ actingNodeId: rose.id });
    expect(permissions.find((p) => p.capability === "INTERACT")).toMatchObject({ allowed: true });
    expect(permissions.find((p) => p.capability === "PAY")).toMatchObject({ allowed: false, needsRoles: ["TREASURER"] });
  });
});

describe("a collection: any member accepts money in, only a Treasurer pays out", () => {
  it("refuses a Member sending a payment for the collection, naming the Treasurer role", async () => {
    const { mo, ana, rose } = await org();
    const e = await refused(
      as(mo).interactions.sendPayment({ actingNodeId: rose.id, toNodeId: ana.id, terms: terms(t.rcc.id, 100) }),
    );
    expect(e).toMatchObject({ code: "FORBIDDEN", ruleIds: ["R-GOV-05"], needsRoles: ["TREASURER"] });
    expect(await t.db.interaction.count({ where: { payerNodeId: rose.id } })).toBe(0);
  });

  it("lets a Member accept a payment coming in", async () => {
    const { mo, ana, rose } = await org();
    await as(ana).interactions.sendPayment({ actingNodeId: ana.id, toNodeId: rose.id, terms: terms(t.rcc.id, 1_500) });

    const inbox = await as(mo).proposals.inbox({ actingNodeId: rose.id });
    expect(inbox.waiting).toHaveLength(1);
    expect(inbox.waiting[0]!.permission).toMatchObject({ allowed: true });

    await as(mo).proposals.decide({ actingNodeId: rose.id, proposalId: inbox.waiting[0]!.id, approve: true });
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(6_500);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(8_500);
  });

  it("shows a payment request to the collection as needing a Treasurer, and refuses a Member", async () => {
    const { mo, tess, ana, rose } = await org();
    await as(ana).interactions.requestPayment({
      actingNodeId: ana.id,
      fromNodeId: rose.id,
      amount: 700,
      currencyId: t.rcc.id,
      comment: "Flyers",
    });
    const [waiting] = (await as(mo).proposals.inbox({ actingNodeId: rose.id })).waiting;
    expect(waiting!.permission).toMatchObject({ allowed: false, needsRoles: ["TREASURER"] });

    const e = await refused(as(mo).interactions.accept({ actingNodeId: rose.id, proposalId: waiting!.id }));
    expect(e).toMatchObject({ code: "FORBIDDEN", needsRoles: ["TREASURER"] });

    await as(tess).interactions.accept({ actingNodeId: rose.id, proposalId: waiting!.id });
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(4_300);
  });

  it("refuses a Member proposing work the collection would pay for, but not work it is paid for", async () => {
    const { mo, ana, rose } = await org();
    const work = { otherNodeId: ana.id, terms: terms(t.rcc.id, 4_000, "Garden bench") };
    const e = await refused(as(mo).interactions.proposeWork({ actingNodeId: rose.id, actingNodePays: true, ...work }));
    expect(e.needsRoles).toEqual(["TREASURER"]);
    const ok = await as(mo).interactions.proposeWork({ actingNodeId: rose.id, actingNodePays: false, ...work });
    expect(ok.interaction.payeeNodeId).toBe(rose.id);
  });

  it("refuses a Member pausing work the collection pays for", async () => {
    const { tess, mo, ana, rose } = await org();
    const { proposal, interaction } = await as(tess).interactions.proposeWork({
      actingNodeId: rose.id,
      actingNodePays: true,
      otherNodeId: ana.id,
      terms: { ...terms(t.rcc.id, 1_000, "Weekly cleaning"), frequency: "WEEKLY", paymentMode: "ON_REQUEST" },
    });
    await as(ana).interactions.accept({ actingNodeId: ana.id, proposalId: proposal.id });

    const e = await refused(as(mo).interactions.pause({ actingNodeId: rose.id, interactionId: interaction.id }));
    expect(e.needsRoles).toEqual(["TREASURER"]);
    const paused = await as(tess).interactions.pause({ actingNodeId: rose.id, interactionId: interaction.id });
    expect(paused.status).toBe("PAUSED");
  });
});

describe("seeing only what the acting node is part of (R-VIS-01)", () => {
  it("refuses another node's relationship, interaction and proposal", async () => {
    const { ana, zed, rose } = await org();
    const { interaction, proposal } = await as(ana).interactions.sendPayment({
      actingNodeId: ana.id,
      toNodeId: rose.id,
      terms: terms(t.rcc.id, 100),
    });
    const z = as(zed);
    for (const call of [
      () => z.relationships.detail({ actingNodeId: zed.id, relationshipId: interaction.relationshipId }),
      () => z.interactions.detail({ actingNodeId: zed.id, interactionId: interaction.id }),
      () => z.proposals.review({ actingNodeId: zed.id, proposalId: proposal.id }),
    ]) {
      expect(await refused(call())).toMatchObject({ code: "BAD_REQUEST", ruleIds: ["R-VIS-01"] });
    }
  });

  it("lists relationships with totals each way", async () => {
    const { ana, tess, rose } = await org();
    const { proposal } = await as(ana).interactions.sendPayment({
      actingNodeId: ana.id,
      toNodeId: rose.id,
      terms: terms(t.rcc.id, 250),
    });
    await as(tess).proposals.decide({ actingNodeId: rose.id, proposalId: proposal.id, approve: true });

    const [card] = await as(ana).relationships.list({ actingNodeId: ana.id });
    expect(card).toMatchObject({ status: "ACTIVE", otherNode: { id: rose.id } });
    expect(typeof card!.trustScore).toBe("number");
    expect(card!.totals).toEqual([expect.objectContaining({ currencyId: t.rcc.id, out: 250, in: 0 })]);
  });
});

describe("wallet", () => {
  it("refuses balances and transactions to a Member who isn't Treasurer", async () => {
    const { mo, tess, rose } = await org();
    expect((await refused(as(mo).wallet.accounts({ actingNodeId: rose.id }))).needsRoles).toEqual(["TREASURER"]);
    expect((await refused(as(mo).wallet.transactions({ actingNodeId: rose.id }))).needsRoles).toEqual(["TREASURER"]);
    const { accounts } = await as(tess).wallet.accounts({ actingNodeId: rose.id });
    expect(accounts.map((a) => a.balance)).toEqual([5_000]);
  });

  it("adds funds to the primary fiat account, creating it if missing (R-FIN-07)", async () => {
    const { tess, mo, rose } = await org();
    const input = { actingNodeId: rose.id, amount: 20_000, reference: "UBS 123", depositedOn: new Date("2026-10-20") };
    expect((await refused(as(mo).wallet.addFunds(input))).needsRoles).toEqual(["TREASURER"]);

    const row = await as(tess).wallet.addFunds(input);
    expect(row).toMatchObject({ kind: "DEPOSIT", amount: 20_000, comment: "Deposit UBS 123 on 2026-10-20" });
    const chf = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isPrimaryFiat: true } });
    expect(chf).toMatchObject({ currencyId: t.chf.id, balance: 20_000 });
  });

  it("mints the node's own currency against a locked reserve", async () => {
    const { tess, mo, rose } = await org();
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: rose.id } });
    await as(tess).wallet.addFunds({ actingNodeId: rose.id, amount: 10_000, reference: "r", depositedOn: new Date() });
    const chf = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isPrimaryFiat: true } });

    const input = { actingNodeId: rose.id, sourceAccountId: chf.id, amount: 4_000 };
    expect((await refused(as(mo).wallet.mint(input))).needsRoles).toEqual(["TREASURER"]);
    expect((await as(tess).wallet.quoteMint(input)).units).toBe(4_000); // rate 1, reserve ratio 1

    const { locked, minted } = await as(tess).wallet.mint(input);
    expect(locked.groupId).toBe(minted.groupId);
    expect(await t.balanceOf(rose.id, t.chf.id)).toBe(6_000);
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(9_000);
    const reserve = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isReserve: true } });
    expect(reserve.balance).toBe(4_000);
    // Reserves are locked: they can't be the source of anything.
    const e = await refused(as(tess).wallet.exchange({ ...input, fromAccountId: reserve.id, toAccountId: chf.id }));
    expect(e.ruleIds).toEqual(["R-FIN-02"]);
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: null } });
  });

  it("exchanges between a person's own accounts at the rates-file rate", async () => {
    const ana = await t.person("Ana");
    const chf = await t.account(ana.id, t.chf.id, 3_000);
    const rcc = await t.account(ana.id, t.rcc.id, 0);
    const input = { actingNodeId: ana.id, fromAccountId: chf.id, toAccountId: rcc.id, amount: 1_250 };

    expect(await as(ana).wallet.quoteExchange(input)).toMatchObject({ toAmount: 1_250, rate: "1" });
    const row = await as(ana).wallet.exchange(input);
    expect(row).toMatchObject({ kind: "EXCHANGE", amount: 1_250, toAmount: 1_250, rate: "1" });
    expect(await t.balanceOf(ana.id, t.chf.id)).toBe(1_750);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(1_250);

    const zed = await t.person("Zed");
    const e = await refused(as(zed).wallet.exchange({ ...input, actingNodeId: zed.id }));
    expect(e.message).toMatch(/does not belong/);
  });
});

describe("invitations", () => {
  it("invites, joins with all native roles, and can't reuse the link", async () => {
    const { ana, mo, rose } = await org();
    const { joinPath } = await as(ana).invitations.create({ actingNodeId: ana.id, name: "Kim", email: "kim@example.org" });
    const token = new URL(joinPath, "http://x").searchParams.get("token")!;

    expect(await as(null).invitations.preview({ token })).toMatchObject({ name: "Kim", inviterName: "Ana", status: "PENDING" });

    const joined = await as(null).invitations.join({ token, firstName: "Kim", username: "kim", password: "long enough" });
    const roles = await t.db.roleAssignment.findMany({ where: { holderNodeId: joined.nodeId, scopeNodeId: joined.nodeId } });
    expect(roles.map((r) => r.roleKey).sort()).toEqual(["MEMBER", "OWNER", "TREASURER"]);
    // R-MEM-03: no relationship with the inviter.
    expect(await t.db.relationship.count({ where: { OR: [{ nodeAId: joined.nodeId }, { nodeBId: joined.nodeId }] } })).toBe(0);

    const again = await refused(as(null).invitations.join({ token, firstName: "Kim", username: "kim2", password: "long enough" }));
    expect(again.code).toBe("BAD_REQUEST");

    // A collection Member may invite for it (INVITE is a Member capability).
    await as(mo).invitations.create({ actingNodeId: rose.id, name: "Lou", phone: "+41 79 000 00 00" });
    expect((await as(mo).invitations.list({ actingNodeId: rose.id }))[0]).not.toHaveProperty("tokenHash");
  });

  it("refuses a taken username (R-MEM-01) and a revoked link", async () => {
    const ana = await t.person("Ana");
    const first = await as(ana).invitations.create({ actingNodeId: ana.id, name: "Kai", email: "kai@example.org" });
    const token = new URL(first.joinPath, "http://x").searchParams.get("token")!;
    const taken = await refused(
      as(null).invitations.join({ token, firstName: "Kai", username: ana.username!.toUpperCase(), password: "long enough" }),
    );
    expect(taken.ruleIds).toEqual(["R-MEM-01"]);

    await as(ana).invitations.revoke({ actingNodeId: ana.id, invitationId: first.invitationId });
    const revoked = await refused(as(null).invitations.join({ token, firstName: "Kai", username: "kai", password: "long enough" }));
    expect(revoked.message).toMatch(/revoked/);
  });
});
