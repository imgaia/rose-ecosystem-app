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
vi.stubEnv("SESSION_SECRET", "test-secret-that-is-at-least-32-characters-long");
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
    expect(permissions.find((p) => p.capability === "PAY")).toMatchObject({
      allowed: false,
      needsRoles: ["TREASURER"],
      needsLabels: ["TREASURER"], // the test seed uses the key as the label
    });
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
    expect(row).toMatchObject({ kind: "DEPOSIT", amount: 20_000, comment: "Deposit UBS 123", effectiveDate: input.depositedOn });
    const chf = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isPrimaryFiat: true } });
    expect(chf).toMatchObject({ currencyId: t.chf.id, balance: 20_000 });
  });

  it("mints the node's own currency from fiat, against a locked reserve", async () => {
    const { tess, mo, rose } = await org();
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: rose.id } });
    await as(tess).wallet.addFunds({ actingNodeId: rose.id, amount: 10_000, reference: "r", depositedOn: new Date() });
    const chf = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isPrimaryFiat: true } });
    const rcc = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, currencyId: t.rcc.id } });

    const input = { actingNodeId: rose.id, sourceAccountId: chf.id, amount: 4_000 };
    expect((await refused(as(mo).wallet.mint(input))).needsRoles).toEqual(["TREASURER"]);
    expect((await as(tess).wallet.quoteMint(input)).units).toBe(4_000); // rate 1, reserve ratio 1

    const { locked, minted } = await as(tess).wallet.mint(input);
    expect(locked.groupId).toBe(minted.groupId);
    expect(await t.balanceOf(rose.id, t.chf.id)).toBe(6_000);
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(9_000);
    const reserve = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isReserve: true, backsCurrencyId: t.rcc.id } });
    expect(reserve.balance).toBe(4_000);

    // Only fiat can be minted from, and reserves are locked.
    expect((await refused(as(tess).wallet.mint({ ...input, sourceAccountId: rcc.id }))).ruleIds).toEqual(["R-FIN-02"]);
    expect((await refused(as(tess).wallet.mint({ ...input, sourceAccountId: reserve.id }))).ruleIds).toEqual(["R-FIN-02"]);
    // Converting fiat into your own currency is a mint: the same two MINT rows into the same reserve.
    const own = await as(tess).wallet.convert({ actingNodeId: rose.id, fromAccountId: chf.id, toCurrencyId: t.rcc.id, amount: 100 });
    expect(own.mode).toBe("MINT");
    expect(own.rows.map((r) => r.kind)).toEqual(["MINT", "MINT"]);
    expect((await t.db.account.findUniqueOrThrow({ where: { id: reserve.id } })).balance).toBe(4_100);
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: null } });
  });

  it("convert goes through the reserves: fiat into the issuer's reserve, units minted", async () => {
    const { ana, mo, zed, rose } = await org();
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: rose.id } });
    const chf = await t.account(ana.id, t.chf.id, 3_000);
    const input = { actingNodeId: ana.id, fromAccountId: chf.id, toCurrencyId: t.rcc.id, amount: 1_250 };

    expect((await as(ana).wallet.quoteConvert(input)).quote).toMatchObject({ receive: 1_250, rate: "1", mode: "RESERVES" });
    // A refused quote is an answer naming the rule, not an error.
    const eurQuote = await as(ana).wallet.quoteConvert({ ...input, toCurrencyId: (await t.db.currency.create({ data: { name: "Euro", code: "EUQ", kind: "FIAT" } })).id });
    expect(eurQuote).toMatchObject({ quote: null, refused: { data: { blockedBy: [{ ruleId: "R-FIN-14" }] } } });
    const { rows } = await as(ana).wallet.convert(input);
    const [paid, minted] = rows;
    expect(paid).toMatchObject({ kind: "EXCHANGE", amount: 1_250, fromAccountId: chf.id });
    expect(minted).toMatchObject({ kind: "EXCHANGE", amount: 1_250, fromAccountId: null, groupId: paid!.groupId });
    expect(await t.balanceOf(ana.id, t.chf.id)).toBe(1_750);
    expect(await t.balanceOf(ana.id, t.rcc.id)).toBe(11_250);
    const issuerReserve = await t.db.account.findFirstOrThrow({ where: { nodeId: rose.id, isReserve: true, backsCurrencyId: t.rcc.id } });
    expect(issuerReserve).toMatchObject({ currencyId: t.chf.id, balance: 1_250 });
    expect(await t.balanceOf(rose.id, t.rcc.id)).toBe(5_000); // the issuer's own balance is untouched

    // Out of RCC only as far as the reserve covers (R-FIN-10); never fiat into fiat (R-FIN-14).
    const anaRcc = await t.db.account.findFirstOrThrow({ where: { nodeId: ana.id, currencyId: t.rcc.id } });
    const out = await refused(as(ana).wallet.convert({ ...input, fromAccountId: anaRcc.id, toCurrencyId: t.chf.id, amount: 2_000 }));
    expect(out.ruleIds).toEqual(["R-FIN-10"]);
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EUR", kind: "FIAT", country: "DE" } });
    expect((await refused(as(ana).wallet.convert({ ...input, toCurrencyId: eur.id }))).ruleIds).toEqual(["R-FIN-14"]);
    const loose = await t.db.currency.create({ data: { name: "No issuer", code: "NOI", kind: "COMMUNITY" } });
    expect((await refused(as(ana).wallet.convert({ ...input, toCurrencyId: loose.id }))).message).toMatch(/no issuer/);

    // Someone else's account, and a Member buying for the collection.
    expect((await refused(as(zed).wallet.convert({ ...input, actingNodeId: zed.id }))).message).toMatch(/does not belong/);
    const forOrg = await refused(as(mo).wallet.convert({ ...input, actingNodeId: rose.id }));
    expect(forOrg.needsRoles).toEqual(["TREASURER"]);
    await t.db.currency.update({ where: { id: t.rcc.id }, data: { issuerNodeId: null } });
  });
});

describe("currencies (S15, S27)", () => {
  it("creates an individual's currency at once, and shows its price, policy and backing to its Treasurer only", async () => {
    const { ana, zed } = await org();
    const created = await as(ana).currencies.propose({
      actingNodeId: ana.id,
      action: "CREATE",
      fields: { name: "Harvest shares", code: "HVS", description: null, decimals: 2, reserveRatio: "0.5", policy: "open" },
    });
    expect(created.status).toBe("APPROVED");

    const overview = await as(ana).currencies.overview({ actingNodeId: ana.id });
    expect(overview.primaryFiat?.code).toBe("CHF");
    expect(overview.issued.map((c) => [c.code, c.price?.rate, c.price?.fiat.code, c.policy])).toEqual([["HVS", "0.5", "CHF", "open"]]);
    expect(overview.held?.map((c) => c.code)).toEqual(["RCC"]);
    const hvs = overview.issued[0]!;
    expect(overview.homeChoices.map((c) => c.id)).toContain(hvs.id);

    const mine = await as(ana).currencies.detail({ actingNodeId: ana.id, currencyId: hvs.id });
    expect(mine).toMatchObject({ actingIsIssuer: true, everHeld: false, backing: { reserve: 0, units: 0, shareBacked: null } });
    expect(mine.history.map((h) => [h.rate, h.source])).toEqual([["0.5", "RESERVE_RATIO"]]);
    // Anyone sees the currency; only the issuer's Treasurers see what backs it.
    const theirs = await as(zed).currencies.detail({ actingNodeId: zed.id, currencyId: hvs.id });
    expect(theirs).toMatchObject({ actingIsIssuer: false, backing: null, price: { rate: "0.5" } });

    await as(ana).currencies.setHome({ actingNodeId: ana.id, currencyId: hvs.id });
    expect((await as(ana).wallet.accounts({ actingNodeId: ana.id })).total?.currency?.id).toBe(hvs.id);
  });

  it("sends a collection's currency out as a proposal, and refuses a Member", async () => {
    const { tess, mo, rose } = await org();
    const fields = { name: "Org coin", code: "ORG", description: null, decimals: 2, reserveRatio: "1", policy: "reserve" as const };
    expect((await refused(as(mo).currencies.propose({ actingNodeId: rose.id, action: "CREATE", fields }))).needsRoles).toEqual(["TREASURER"]);
    // Tess is the only Treasurer and the only Owner: R-FIN-11 needs two people.
    const alone = await refused(as(tess).currencies.propose({ actingNodeId: rose.id, action: "CREATE", fields }));
    expect(alone.ruleIds).toEqual(["R-FIN-11"]);
  });

  it("shows a currency change in the review screen", async () => {
    const [olga, tim] = [await t.person("Olga"), await t.person("Tim")];
    const col = await t.collection("Pair", [
      { node: olga, roles: ["MEMBER", "OWNER"] },
      { node: tim, roles: ["MEMBER", "TREASURER"] },
    ]);
    const fields = { name: "Pair coin", code: "PAIR", description: null, decimals: 2, reserveRatio: "2", policy: "reserve" as const };
    const { id } = await as(tim).currencies.propose({ actingNodeId: col.id, action: "CREATE", fields });
    const inbox = await as(olga).proposals.inbox({ actingNodeId: olga.id });
    const review = await as(olga).proposals.review({ actingNodeId: olga.id, proposalId: id });
    expect(review.currencyChange).toMatchObject({ action: "CREATE", fields: { code: "PAIR", reserveRatio: "2" }, fiatCode: "CHF" });
    expect(JSON.stringify(inbox)).toContain(id);
    await as(olga).proposals.decide({ actingNodeId: olga.id, proposalId: id, approve: true });
    expect((await as(tim).currencies.overview({ actingNodeId: col.id })).issued.map((c) => c.code)).toEqual(["PAIR"]);
  });

  it("keeps the country on the identity", async () => {
    const { ana } = await org();
    await as(ana).identity.update({ actingNodeId: ana.id, country: "de" });
    expect((await as(ana).identity.get({ actingNodeId: ana.id })).country).toBe("DE");
    expect((await refused(as(ana).identity.update({ actingNodeId: ana.id, country: "Germany" }))).message).toMatch(/two-letter/);
  });
});

describe("invitations", () => {
  it("invites, joins with all native roles, and can't reuse the link", async () => {
    const { ana } = await org();
    const { joinPath } = await as(ana).invitations.create({ actingNodeId: ana.id, name: "Kim", email: "kim@example.org" });
    const token = new URL(joinPath, "http://x").searchParams.get("token")!;

    expect(await as(null).invitations.preview({ token })).toMatchObject({ name: "Kim", inviterName: "Ana", status: "PENDING" });

    const joined = await as(null).invitations.join({ token, firstName: "Kim", username: "kim", password: "long enough" });
    const roles = await t.db.roleAssignment.findMany({ where: { holderNodeId: joined.nodeId, scopeNodeId: joined.nodeId } });
    expect(roles.map((r) => r.roleKey).sort()).toEqual(["MEMBER", "OWNER", "TREASURER"]);
    // Invited as yourself: the network only, no collection roles.
    expect(await t.db.roleAssignment.count({ where: { holderNodeId: joined.nodeId, scopeNodeId: { not: joined.nodeId } } })).toBe(0);
    // R-MEM-03: no relationship with the inviter.
    expect(await t.db.relationship.count({ where: { OR: [{ nodeAId: joined.nodeId }, { nodeBId: joined.nodeId }] } })).toBe(0);

    const again = await refused(as(null).invitations.join({ token, firstName: "Kim", username: "kim2", password: "long enough" }));
    expect(again.code).toBe("BAD_REQUEST");
  });

  it("a collection's invitation needs ADD_MEMBERS there and makes the invitee its Member", async () => {
    const { tess, mo, rose } = await org();
    const invite = { actingNodeId: rose.id, name: "Lou", phone: "+41 79 000 00 00", message: "Welcome to ROSE!" };

    // Mo is only a Member: may invite as themselves, not for the collection.
    expect(await refused(as(mo).invitations.create(invite))).toMatchObject({ code: "FORBIDDEN", needsRoles: ["OWNER"] });
    expect((await refused(as(mo).invitations.list({ actingNodeId: rose.id }))).needsRoles).toEqual(["OWNER"]);

    const { joinPath } = await as(tess).invitations.create(invite);
    const token = new URL(joinPath, "http://x").searchParams.get("token")!;
    expect(await as(null).invitations.preview({ token })).toMatchObject({ message: "Welcome to ROSE!", joinsCollection: "ROSE Org" });
    expect((await as(tess).invitations.list({ actingNodeId: rose.id }))[0]).not.toHaveProperty("tokenHash");

    const lou = await as(null).invitations.join({ token, firstName: "Lou", username: "lou", password: "long enough" });
    const inOrg = await t.db.roleAssignment.findMany({ where: { holderNodeId: lou.nodeId, scopeNodeId: rose.id } });
    expect(inOrg.map((r) => r.roleKey)).toEqual(["MEMBER"]);
    const own = await t.db.roleAssignment.count({ where: { holderNodeId: lou.nodeId, scopeNodeId: lou.nodeId } });
    expect(own).toBe(3);
    // Lou can now act for ROSE Org as a Member.
    const me = await as({ id: lou.nodeId }).nodes.me();
    expect(me.actingAs.map((a) => a.node.id)).toEqual([lou.nodeId, rose.id]);
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

describe("identity, roles and members (step 6b)", () => {
  it("lets a person edit their own identity, and refuses a plain Member editing the collection's", async () => {
    const { mo, rose } = await org();
    expect(await as(mo).identity.update({ actingNodeId: mo.id, firstName: "Moritz", email: "mo@example.org" })).toMatchObject({
      name: "Moritz",
    });
    expect(await as(mo).identity.get({ actingNodeId: mo.id })).toMatchObject({ email: "mo@example.org" });
    const e = await refused(as(mo).identity.update({ actingNodeId: rose.id, name: "Mo's Org" }));
    expect(e).toMatchObject({ code: "FORBIDDEN", needsRoles: ["OWNER"] });
  });

  it("puts a role change in the affected member's inbox, and applies it when they approve there", async () => {
    const { tess, mo, rose } = await org();
    expect(
      (await refused(as(mo).members.proposeRoleChange({ actingNodeId: rose.id, holderNodeId: mo.id, roleKey: "CURATOR", change: "ADD" })))
        .needsRoles,
    ).toEqual(["OWNER"]);

    await as(tess).members.proposeRoleChange({ actingNodeId: rose.id, holderNodeId: mo.id, roleKey: "CURATOR", change: "ADD" });
    const inbox = await as(mo).proposals.inbox({ actingNodeId: mo.id });
    const p = inbox.waiting.find((w) => w.kind === "ROLE_CHANGE")!;
    expect(p).toMatchObject({
      waitingOnMe: true,
      collection: { id: rose.id },
      roleChange: { change: "ADD", role: { key: "CURATOR" }, holder: { id: mo.id } },
      permission: { allowed: true },
    });
    // The collection sees it under what it is waiting on.
    expect((await as(tess).proposals.inbox({ actingNodeId: rose.id })).sent.map((s) => s.id)).toContain(p.id);

    await as(mo).proposals.decide({ actingNodeId: mo.id, proposalId: p.id, approve: true });
    const me = await as(mo).nodes.me();
    expect(me.actingAs.find((a) => a.node.id === rose.id)!.roles.map((r) => r.key).sort()).toEqual(["CURATOR", "MEMBER"]);
  });

  it("lets the collection withdraw its proposal through proposals.withdraw", async () => {
    const { tess, mo, rose } = await org();
    const p = await as(tess).members.proposeRoleChange({ actingNodeId: rose.id, holderNodeId: mo.id, roleKey: "CURATOR", change: "ADD" });
    expect(await as(tess).proposals.withdraw({ actingNodeId: rose.id, proposalId: p.id })).toMatchObject({ status: "WITHDRAWN" });
  });

  it("lets a member leave, and lets any member propose a removal but not an outsider", async () => {
    const { tess, mo, zed, rose } = await org();
    expect((await refused(as(zed).members.proposeRemoval({ actingNodeId: rose.id, memberNodeId: mo.id, reason: "x" }))).code).toBe("FORBIDDEN");
    const removal = await as(mo).members.proposeRemoval({ actingNodeId: rose.id, memberNodeId: tess.id, reason: "x" }).catch((e: unknown) => e);
    expect(removal).toBeInstanceOf(TRPCError); // Tess is the only Owner and Treasurer (R-GOV-03)

    await as(mo).members.leave({ actingNodeId: rose.id });
    expect((await as(mo).nodes.me()).actingAs.map((a) => a.node.id)).toEqual([mo.id]);
  });
});
