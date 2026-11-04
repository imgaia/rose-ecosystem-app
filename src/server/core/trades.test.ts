import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { priceOf, proposeCurrencyChange } from "./currencies";
import type { RuleError } from "./errors";
import { accept, amend, counterPropose, decline, proposeTrade, withdrawProposal, type Actor } from "./interactions";
import { postTransaction } from "./ledger";
import { findRate, rateHistory } from "./rates";
import { createTestDb, type TestDb } from "./test-helpers";
import { mint, walletTotal } from "./wallet";

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

const self = (node: { id: string }): Actor => ({ personId: node.id, actingNodeId: node.id });
const refusal = (call: Promise<unknown>) => call.then(() => null, (e: unknown) => e as RuleError);
const statusOf = async (interactionId: string) => (await t.db.interaction.findUniqueOrThrow({ where: { id: interactionId } })).status;

/** A person with a free currency of their own, `minted` units of it in their account. */
async function issuerOf(name: string, code: string, minted: number) {
  const node = await t.person(name);
  await proposeCurrencyChange(t.db, self(node), { action: "CREATE", fields: { name: `${code} coin`, code } });
  const currency = await t.db.currency.findFirstOrThrow({ where: { issuerNodeId: node.id, code } });
  if (minted > 0) await mint(t.db, self(node), { amount: minted, currencyId: currency.id });
  return { node, currency };
}

/** `give` of the proposer's currency for `get` of the other's. */
const offer = (to: { id: string }, give: { id: string }, giveAmount: number, get: { id: string }, getAmount: number) => ({
  toNodeId: to.id,
  give: { amount: giveAmount, currencyId: give.id },
  get: { amount: getAmount, currencyId: get.id },
});

describe("trading (UC-FIN-10, R-FIN-16)", () => {
  it("moves both legs together on acceptance, publishes the rate and forms the relationship", async () => {
    const ana = await issuerOf("Ana", "GAIA", 10_000);
    const ben = await issuerOf("Ben", "THC", 10_000);
    const { interaction, proposal } = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 300));
    expect(interaction).toMatchObject({ kind: "TRADE", payerNodeId: ana.node.id, payeeNodeId: ben.node.id, status: "PROPOSED" });
    expect((await t.db.relationship.findUniqueOrThrow({ where: { id: interaction.relationshipId } })).status).toBe("PENDING");
    expect(await findRate(t.db, ana.currency.id, ben.currency.id)).toBeNull(); // nothing published until accepted

    await accept(t.db, self(ben.node), proposal.id);
    expect(await statusOf(interaction.id)).toBe("COMPLETED");
    expect((await t.db.relationship.findUniqueOrThrow({ where: { id: interaction.relationshipId } })).status).toBe("ACTIVE");
    expect([await t.balanceOf(ana.node.id, ana.currency.id), await t.balanceOf(ana.node.id, ben.currency.id)]).toEqual([9_900, 300]);
    expect([await t.balanceOf(ben.node.id, ben.currency.id), await t.balanceOf(ben.node.id, ana.currency.id)]).toEqual([9_700, 100]);

    const legs = await t.db.transaction.findMany({ where: { interactionId: interaction.id }, orderBy: { createdAt: "asc" } });
    expect(legs.map((l) => [l.kind, l.amount, l.rate])).toEqual([
      ["EXCHANGE", 100, "3"],
      ["EXCHANGE", 300, "1/3"],
    ]);
    expect(legs[0]!.groupId).toBe(legs[1]!.groupId);
    expect(legs[0]!.comment).toBe("Trade: 1.00 GAIA for 3.00 THC");

    // The rate row: 3 THC per GAIA, from now, naming the interaction but not who traded.
    const [row] = await rateHistory(t.db, ana.currency.id, ben.currency.id);
    expect(row).toMatchObject({ fromCurrencyId: ana.currency.id, rate: "3", source: "TRADE", validTo: null, setBy: `trade:${interaction.id}` });
    expect((await findRate(t.db, ben.currency.id, ana.currency.id))?.text).toBe("1/3");
  });

  it("is refused when either side lacks the funds, and then nothing moves", async () => {
    const ana = await issuerOf("Ana", "LAA", 500);
    const ben = await issuerOf("Ben", "LAB", 200);
    // The proposer can't offer more than it has.
    const short = await refusal(proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 600, ben.currency, 100)));
    expect(short?.ruleIds).toEqual(["R-PAY-02"]);

    // The other side can't give back more than it has: accepting fails as a whole.
    const { interaction, proposal } = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 300));
    expect((await refusal(accept(t.db, self(ben.node), proposal.id)))?.ruleIds).toEqual(["R-PAY-02"]);
    expect([await t.balanceOf(ana.node.id, ana.currency.id), await t.balanceOf(ben.node.id, ben.currency.id)]).toEqual([500, 200]);
    expect(await t.db.transaction.count({ where: { interactionId: interaction.id } })).toBe(0);
    expect(await rateHistory(t.db, ana.currency.id, ben.currency.id)).toEqual([]);
    expect(await statusOf(interaction.id)).toBe("PROPOSED"); // still waiting

    // Ana spends her LAA elsewhere in the meantime: the accepted trade can't take her below zero either.
    await mint(t.db, self(ben.node), { amount: 1_000, currencyId: ben.currency.id });
    const third = await t.person("Cat");
    await t.db.account.create({ data: { nodeId: third.id, currencyId: ana.currency.id } });
    const anaAccount = await t.db.account.findFirstOrThrow({ where: { nodeId: ana.node.id, currencyId: ana.currency.id } });
    const catAccount = await t.db.account.findFirstOrThrow({ where: { nodeId: third.id, currencyId: ana.currency.id } });
    await postTransaction(t.db, { kind: "PAYMENT", fromAccountId: anaAccount.id, toAccountId: catAccount.id, amount: 450, comment: "Bread", actedByPersonId: ana.node.id });
    expect((await refusal(accept(t.db, self(ben.node), proposal.id)))?.ruleIds).toEqual(["R-PAY-02"]);
    expect(await t.balanceOf(ben.node.id, ben.currency.id)).toBe(1_200);
  });

  it("a counter-proposal replaces the terms; accepting it uses the new terms and rate", async () => {
    const ana = await issuerOf("Ana", "CPA", 1_000);
    const ben = await issuerOf("Ben", "CPB", 1_000);
    const { interaction, proposal } = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 300));
    const counter = await counterPropose(t.db, self(ben.node), { proposalId: proposal.id, changes: { counterAmount: 200 }, comment: "Two, not three" });
    expect((await t.db.proposal.findUniqueOrThrow({ where: { id: proposal.id } })).status).toBe("DECLINED");

    // Ben's counter is his approval; it waits on Ana.
    expect((await refusal(accept(t.db, self(ben.node), counter.id)))?.message).toBeTruthy();
    await accept(t.db, self(ana.node), counter.id);
    expect(await statusOf(interaction.id)).toBe("COMPLETED");
    expect(await t.balanceOf(ana.node.id, ben.currency.id)).toBe(200);
    expect((await findRate(t.db, ana.currency.id, ben.currency.id))?.text).toBe("2");
  });

  it("the proposer can amend a trade while it waits, and withdraw it; the other side can decline", async () => {
    const ana = await issuerOf("Ana", "AMA", 1_000);
    const ben = await issuerOf("Ben", "AMB", 1_000);
    const { interaction } = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 300));
    const amended = await amend(t.db, self(ana.node), { interactionId: interaction.id, changes: { amount: 150 } });
    expect(await t.db.proposal.count({ where: { interactionId: interaction.id, status: "OPEN" } })).toBe(1);
    expect(await statusOf(interaction.id)).toBe("PROPOSED");

    await decline(t.db, self(ben.node), amended.id);
    expect(await statusOf(interaction.id)).toBe("DECLINED");

    const again = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 300));
    await withdrawProposal(t.db, self(ana.node), again.proposal.id);
    expect(await statusOf(again.interaction.id)).toBe("WITHDRAWN");
    expect(await t.db.transaction.count({ where: { interactionId: { in: [interaction.id, again.interaction.id] } } })).toBe(0);
  });

  it("the latest trade sets the pair's rate; earlier ones stay in the history, closed", async () => {
    const ana = await issuerOf("Ana", "LTA", 1_000);
    const ben = await issuerOf("Ben", "LTB", 1_000);
    for (const getAmount of [300, 250]) {
      const { proposal } = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, getAmount));
      await accept(t.db, self(ben.node), proposal.id);
    }
    // Ben trades the other way round: still the same pair.
    const { proposal } = await proposeTrade(t.db, self(ben.node), offer(ana.node, ben.currency, 400, ana.currency, 100));
    await accept(t.db, self(ana.node), proposal.id);

    expect((await findRate(t.db, ana.currency.id, ben.currency.id))?.text).toBe("4");
    const history = await rateHistory(t.db, ana.currency.id, ben.currency.id);
    expect(history.map((r) => [r.rate, r.validTo === null])).toEqual([
      ["0.25", true],
      ["2.5", false],
      ["3", false],
    ]);
  });

  it("chains a price through two trades, e.g. a free currency into CHF", async () => {
    const ana = await issuerOf("Ana", "CHA", 1_000);
    const ben = await issuerOf("Ben", "CHB", 1_000);
    const cat = await t.person("Cat");
    await t.account(cat.id, t.chf.id, 5_000);
    // 1 CHA = 2 CHB, and 1 CHB = 0.50 CHF, so 1 CHA = 1.00 CHF.
    const first = await proposeTrade(t.db, self(ana.node), offer(ben.node, ana.currency, 100, ben.currency, 200));
    await accept(t.db, self(ben.node), first.proposal.id);
    const second = await proposeTrade(t.db, self(cat), offer(ben.node, t.chf, 50, ben.currency, 100));
    await accept(t.db, self(ben.node), second.proposal.id);

    expect((await findRate(t.db, ana.currency.id, t.chf.id))?.text).toBe("1");
    expect((await priceOf(t.db, ana.currency.id))?.rate).toBe("1");
  });

  it("the wallet total leaves out currencies with no price yet, and names them", async () => {
    const ana = await issuerOf("Ana", "WTA", 1_000);
    const lone = await issuerOf("Lone", "WTL", 1_000);
    await t.account(ana.node.id, t.chf.id, 2_000);
    // WTA gets a price: 1 WTA = 0.50 CHF.
    const buyer = await t.person("Buyer");
    await t.account(buyer.id, t.chf.id, 1_000);
    const { proposal } = await proposeTrade(t.db, self(buyer), offer(ana.node, t.chf, 100, ana.currency, 200));
    await accept(t.db, self(ana.node), proposal.id);
    // Ana also holds some WTL, which has never been traded against anything priced.
    await t.db.account.create({ data: { nodeId: ana.node.id, currencyId: lone.currency.id } });
    const from = await t.db.account.findFirstOrThrow({ where: { nodeId: lone.node.id, currencyId: lone.currency.id } });
    const to = await t.db.account.findFirstOrThrow({ where: { nodeId: ana.node.id, currencyId: lone.currency.id } });
    await postTransaction(t.db, { kind: "GIFT", fromAccountId: from.id, toAccountId: to.id, amount: 300, comment: "Hi", actedByPersonId: lone.node.id });

    // CHF 21.00 + 8.00 WTA at 0.50 = 25.00 CHF; WTL is left out.
    const total = await walletTotal(t.db, ana.node.id, t.chf);
    expect(total).toMatchObject({ amount: 2_500, unpriced: ["WTL"] });
  });

  it("acting for a collection needs PAY on either side; no trading with yourself, in one currency, or fiat for fiat", async () => {
    const ana = await issuerOf("Ana", "COA", 1_000);
    const [tess, mo] = [await t.person("Tess"), await t.person("Mo")];
    const org = await t.collection("Org", [
      { node: tess, roles: ["MEMBER", "TREASURER", "OWNER"] },
      { node: mo, roles: ["MEMBER"] },
    ]);
    await t.account(org.id, t.chf.id, 1_000);
    const asMo: Actor = { personId: mo.id, actingNodeId: org.id };
    const asTess: Actor = { personId: tess.id, actingNodeId: org.id };

    expect((await refusal(proposeTrade(t.db, asMo, offer(ana.node, t.chf, 100, ana.currency, 100))))?.needsRoles).toEqual(["TREASURER"]);
    const { proposal } = await proposeTrade(t.db, self(ana.node), offer(org, ana.currency, 100, t.chf, 100));
    expect((await refusal(accept(t.db, asMo, proposal.id)))?.needsRoles).toEqual(["TREASURER"]);
    await accept(t.db, asTess, proposal.id);
    expect(await t.balanceOf(org.id, ana.currency.id)).toBe(100);

    expect((await refusal(proposeTrade(t.db, self(ana.node), offer(ana.node, ana.currency, 10, t.chf, 10))))?.message).toMatch(/itself/);
    expect((await refusal(proposeTrade(t.db, self(ana.node), offer(org, ana.currency, 10, ana.currency, 10))))?.message).toMatch(/two different/);
    const eur = await t.db.currency.create({ data: { name: "Euro", code: "EUT", kind: "FIAT", country: "AT" } });
    expect((await refusal(proposeTrade(t.db, asTess, offer(ana.node, t.chf, 10, eur, 10))))?.ruleIds).toEqual(["R-FIN-14"]);
  });
});
