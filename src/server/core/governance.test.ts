import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decideProposal } from "./index";
import {
  leaveCollection,
  memberCandidates,
  proposeAddMember,
  proposeRemoval,
  proposeRoleChange,
  withdrawGovernance,
} from "./governance";
import type { Actor } from "./interactions";
import { createTestDb, type TestDb } from "./test-helpers";

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
const rolesOf = async (collectionId: string, holderNodeId: string) =>
  (await t.db.roleAssignment.findMany({ where: { scopeNodeId: collectionId, holderNodeId, endedAt: null } }))
    .map((r) => r.roleKey)
    .sort();

/** Org: Olga is Owner, Tim Treasurer, Mia a plain Member. Zed is outside it. */
async function org() {
  const [olga, tim, mia, zed] = await Promise.all(["Olga", "Tim", "Mia", "Zed"].map((n) => t.person(n)));
  const col = await t.collection("Org", [
    { node: olga!, roles: ["MEMBER", "OWNER"] },
    { node: tim!, roles: ["MEMBER", "TREASURER"] },
    { node: mia!, roles: ["MEMBER"] },
  ]);
  return { olga: olga!, tim: tim!, mia: mia!, zed: zed!, col };
}

async function relate(a: { id: string }, b: { id: string }) {
  const [nodeAId, nodeBId] = [a.id, b.id].sort();
  await t.db.relationship.create({ data: { nodeAId: nodeAId!, nodeBId: nodeBId!, status: "ACTIVE", formedAt: new Date() } });
}

describe("role changes in a collection (UC-COL-06, R-GOV-08)", () => {
  it("applies once the affected member approves; proposing is the Owner's approval for the collection", async () => {
    const { olga, mia, col } = await org();
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "TREASURER", change: "ADD" });
    expect(p.status).toBe("OPEN");
    // rules.yaml R-GOV-08: the affected member, and the collection decided by any one Owner.
    expect(p.approvers.map((a) => [a.approverNodeId, a.decision]).sort()).toEqual(
      [
        [mia.id, null],
        [col.id, true],
      ].sort(),
    );
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER"]);

    const decided = await approve(mia, p.id);
    expect(decided.status).toBe("APPROVED");
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER", "TREASURER"]);
  });

  it("by default one Owner is enough, even when there are several", async () => {
    const { olga, tim, mia, col } = await org();
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: tim.id, roleKey: "OWNER" } });
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" });
    expect((await approve(mia, p.id)).status).toBe("APPROVED");
  });

  it("follows a collection's own R-GOV-08 value: here, every Owner must approve", async () => {
    const { olga, tim, mia, col } = await org();
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: tim.id, roleKey: "OWNER" } });
    await t.db.nodeRuleValue.create({ data: { nodeId: col.id, ruleId: "R-GOV-08", value: JSON.stringify(["affected", { every: "OWNER" }]) } });
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" });
    expect(p.approvers.map((a) => [a.approverNodeId, a.decision]).sort()).toEqual(
      [
        [mia.id, null],
        [olga.id, true],
        [tim.id, null],
      ].sort(),
    );
    expect((await approve(mia, p.id)).status).toBe("OPEN");
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER"]);
    expect((await approve(tim, p.id)).status).toBe("APPROVED");
    expect(await rolesOf(col.id, mia.id)).toEqual(["CURATOR", "MEMBER"]);
  });

  it("closes on a decline and changes nothing", async () => {
    const { olga, mia, col } = await org();
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "TREASURER", change: "ADD" });
    expect((await approve(mia, p.id, false)).status).toBe("DECLINED");
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER"]);
  });

  it("refuses a Member who isn't an Owner, naming the Owner role", async () => {
    const { tim, mia, col } = await org();
    await expect(
      proposeRoleChange(t.db, as(tim, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" }),
    ).rejects.toMatchObject({ ruleIds: ["R-GOV-05"], needsRoles: ["OWNER"] });
  });

  it("only gives roles to members (R-COL-05)", async () => {
    const { olga, zed, col } = await org();
    await expect(
      proposeRoleChange(t.db, as(olga, col), { holderNodeId: zed.id, roleKey: "CURATOR", change: "ADD" }),
    ).rejects.toMatchObject({ ruleIds: ["R-COL-05"] });
  });

  it("refuses to take away the last holder of a native role (R-GOV-03)", async () => {
    const { olga, tim, col } = await org();
    await expect(
      proposeRoleChange(t.db, as(olga, col), { holderNodeId: tim.id, roleKey: "TREASURER", change: "REMOVE" }),
    ).rejects.toMatchObject({ ruleIds: ["R-GOV-03"] });
  });

  it("checks R-GOV-03 again when it applies, in case another change came first", async () => {
    const { olga, tim, mia, col } = await org();
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: mia.id, roleKey: "TREASURER" } });
    const removeTim = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: tim.id, roleKey: "TREASURER", change: "REMOVE" });
    const removeMia = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "TREASURER", change: "REMOVE" });
    expect((await approve(tim, removeTim.id)).status).toBe("APPROVED");
    await expect(approve(mia, removeMia.id)).rejects.toMatchObject({ ruleIds: ["R-GOV-03"] });
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER", "TREASURER"]);
  });

  it("refuses a second open proposal for the same role and node", async () => {
    const { olga, mia, col } = await org();
    await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" });
    await expect(
      proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" }),
    ).rejects.toThrow(/already waiting/);
  });

  it("applies at once when the Owner changes their own optional role and is the only Owner", async () => {
    const { olga, col } = await org();
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: olga.id, roleKey: "CURATOR", change: "ADD" });
    expect(p.status).toBe("APPROVED");
    expect(await rolesOf(col.id, olga.id)).toEqual(["CURATOR", "MEMBER", "OWNER"]);
  });

  it("can be withdrawn by the collection", async () => {
    const { olga, mia, col } = await org();
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "CURATOR", change: "ADD" });
    expect((await withdrawGovernance(t.db, as(olga, col), p.id)).status).toBe("WITHDRAWN");
    await expect(approve(mia, p.id)).rejects.toThrow(/already withdrawn/);
  });

  it("writes the change to everyone's activity", async () => {
    const { olga, mia, col } = await org();
    const p = await proposeRoleChange(t.db, as(olga, col), { holderNodeId: mia.id, roleKey: "TREASURER", change: "ADD" });
    await approve(mia, p.id);
    const summaries = (await t.db.activity.findMany({ where: { nodeId: col.id }, orderBy: { createdAt: "asc" } })).map((a) => a.summary);
    expect(summaries).toEqual(["Olga for Org proposed making Mia a TREASURER of Org", "Mia is now a TREASURER of Org"]);
  });
});

describe("adding a member (UC-COL-04, R-COL-02)", () => {
  it("proposes the Member role to a node from the Owner's relationships; it applies when the node accepts", async () => {
    const { olga, zed, col } = await org();
    await relate(olga, zed);
    expect((await memberCandidates(t.db, as(olga, col))).map((n) => n.id)).toEqual([zed.id]);

    const p = await proposeAddMember(t.db, as(olga, col), { nodeId: zed.id });
    expect(p.status).toBe("OPEN");
    expect((await approve(zed, p.id)).status).toBe("APPROVED");
    expect(await rolesOf(col.id, zed.id)).toEqual(["MEMBER"]);
    expect(await memberCandidates(t.db, as(olga, col))).toEqual([]);
  });

  it("refuses a node the Owner has no relationship with", async () => {
    const { olga, zed, col } = await org();
    await expect(proposeAddMember(t.db, as(olga, col), { nodeId: zed.id })).rejects.toMatchObject({ ruleIds: ["R-COL-02"] });
  });

  it("refuses someone who is already a member", async () => {
    const { olga, mia, col } = await org();
    await relate(olga, mia);
    await expect(proposeAddMember(t.db, as(olga, col), { nodeId: mia.id })).rejects.toThrow(/already a MEMBER/);
  });

  it("needs ADD_MEMBERS (Owner)", async () => {
    const { mia, zed, col } = await org();
    await relate(mia, zed);
    await expect(proposeAddMember(t.db, as(mia, col), { nodeId: zed.id })).rejects.toMatchObject({ needsRoles: ["OWNER"] });
  });
});

describe("leaving a collection (UC-COL-05)", () => {
  it("ends every role the member holds there", async () => {
    const { mia, col } = await org();
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: mia.id, roleKey: "CURATOR" } });
    await leaveCollection(t.db, as(mia, col));
    expect(await rolesOf(col.id, mia.id)).toEqual([]);
    // Ended, not deleted: the history stays.
    expect(await t.db.roleAssignment.count({ where: { scopeNodeId: col.id, holderNodeId: mia.id } })).toBe(2);
  });

  it("refuses the last Treasurer (R-GOV-03)", async () => {
    const { tim, col } = await org();
    await expect(leaveCollection(t.db, as(tim, col))).rejects.toMatchObject({ ruleIds: ["R-GOV-03"] });
    expect(await rolesOf(col.id, tim.id)).toEqual(["MEMBER", "TREASURER"]);
  });
});

describe("removing a member (UC-COL-10, R-COL-04)", () => {
  it("by default needs every remaining member; the removed member isn't asked", async () => {
    const { olga, tim, mia, col } = await org();
    const p = await proposeRemoval(t.db, as(olga, col), { memberNodeId: mia.id, reason: "Moved away" });
    expect(p.approvers.map((a) => a.approverNodeId).sort()).toEqual([olga.id, tim.id].sort());
    expect((await approve(tim, p.id)).status).toBe("APPROVED");
    expect(await rolesOf(col.id, mia.id)).toEqual([]);
  });

  it("with a share of 0.5, applies once half the remaining members approve", async () => {
    const { olga, tim, mia, col } = await org();
    const extra = await t.person("Ed");
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: extra.id, roleKey: "MEMBER" } });
    await t.db.nodeRuleValue.create({ data: { nodeId: col.id, ruleId: "R-COL-04", value: "0.5" } });
    // Remaining: Olga, Tim, Ed. Half of 3 rounds up to 2: Mia's proposal is 1, Olga makes 2.
    const p = await proposeRemoval(t.db, as(mia, col), { memberNodeId: extra.id, reason: "Inactive" });
    expect(p.status).toBe("OPEN");
    expect((await approve(olga, p.id)).status).toBe("APPROVED");
    expect(await rolesOf(col.id, extra.id)).toEqual([]);
    expect(await rolesOf(col.id, tim.id)).toEqual(["MEMBER", "TREASURER"]);
  });

  it("with owner_only, the Owner alone decides", async () => {
    const { olga, mia, col } = await org();
    await t.db.nodeRuleValue.create({ data: { nodeId: col.id, ruleId: "R-COL-04", value: "owner_only" } });
    const p = await proposeRemoval(t.db, as(olga, col), { memberNodeId: mia.id, reason: "Asked to leave" });
    expect(p.status).toBe("APPROVED");
    expect(await rolesOf(col.id, mia.id)).toEqual([]);
  });

  it("with owner_only, a plain member's proposal waits for an Owner deciding for the collection", async () => {
    const { olga, tim, mia, col } = await org();
    await t.db.nodeRuleValue.create({ data: { nodeId: col.id, ruleId: "R-COL-04", value: "owner_only" } });
    const p = await proposeRemoval(t.db, as(mia, col), { memberNodeId: tim.id, reason: "x" }).catch((e: unknown) => e);
    expect(p).toMatchObject({ ruleIds: ["R-GOV-03"] }); // Tim is the only Treasurer
    const ed = await t.person("Ed");
    await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: ed.id, roleKey: "MEMBER" } });

    const q = await proposeRemoval(t.db, as(mia, col), { memberNodeId: ed.id, reason: "Inactive" });
    expect(q.status).toBe("OPEN");
    const forCollection = (person: { id: string }) =>
      decideProposal(t.db, { proposalId: q.id, approverNodeId: col.id, personId: person.id, approve: true });
    await expect(forCollection(tim)).rejects.toMatchObject({ needsRoles: ["OWNER"] });
    expect((await forCollection(olga)).status).toBe("APPROVED");
    expect(await rolesOf(col.id, ed.id)).toEqual([]);
  });

  it("by default (R-GOV-06 unreachable), at 0.5 a decline closes it only once half can't be reached", async () => {
    const { olga, tim, mia, col } = await org();
    const [ed, flo] = [await t.person("Ed"), await t.person("Flo")];
    for (const p of [ed, flo]) await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: p.id, roleKey: "MEMBER" } });
    await t.db.nodeRuleValue.create({ data: { nodeId: col.id, ruleId: "R-COL-04", value: "0.5" } });
    // Removing Flo: the four other members (Olga, Tim, Mia, Ed) are asked; half of 4 is 2. Olga's proposal is the first.
    const p = await proposeRemoval(t.db, as(olga, col), { memberNodeId: flo.id, reason: "Inactive" });
    expect(p.approvers).toHaveLength(4);
    expect((await approve(tim, p.id, false)).status).toBe("OPEN"); // 3 could still approve
    expect((await approve(mia, p.id, false)).status).toBe("OPEN"); // Olga and Ed could still make 2
    expect((await approve(ed, p.id, false)).status).toBe("DECLINED"); // the third decline: only Olga is left
    expect(await rolesOf(col.id, flo.id)).toEqual(["MEMBER"]);
  });

  it("follows a collection's own R-GOV-06 value: with any_closes, one decline closes it even at 0.5", async () => {
    const { olga, tim, col } = await org();
    const [ed, flo] = [await t.person("Ed"), await t.person("Flo")];
    for (const p of [ed, flo]) await t.db.roleAssignment.create({ data: { scopeNodeId: col.id, holderNodeId: p.id, roleKey: "MEMBER" } });
    await t.db.nodeRuleValue.createMany({
      data: [
        { nodeId: col.id, ruleId: "R-COL-04", value: "0.5" },
        { nodeId: col.id, ruleId: "R-GOV-06", value: "any_closes" },
      ],
    });
    const p = await proposeRemoval(t.db, as(olga, col), { memberNodeId: flo.id, reason: "Inactive" });
    expect((await approve(tim, p.id, false)).status).toBe("DECLINED");
    expect(await rolesOf(col.id, flo.id)).toEqual(["MEMBER"]);
  });

  it("any member may propose it; where every approval is needed, the first decline closes it", async () => {
    const { olga, tim, mia, col } = await org();
    const p = await proposeRemoval(t.db, as(mia, col), { memberNodeId: tim.id, reason: "x" }).catch((e: unknown) => e);
    // Tim is the only Treasurer, so this one is refused (R-GOV-03).
    expect(p).toMatchObject({ ruleIds: ["R-GOV-03"] });
    const q = await proposeRemoval(t.db, as(tim, col), { memberNodeId: mia.id, reason: "Not active" });
    expect((await approve(olga, q.id, false)).status).toBe("DECLINED");
    expect(await rolesOf(col.id, mia.id)).toEqual(["MEMBER"]);
  });

  it("needs a reason, and isn't for removing yourself", async () => {
    const { olga, mia, col } = await org();
    await expect(proposeRemoval(t.db, as(olga, col), { memberNodeId: mia.id, reason: " " })).rejects.toThrow(/reason/);
    await expect(proposeRemoval(t.db, as(mia, col), { memberNodeId: mia.id, reason: "Bye" })).rejects.toThrow(/leave/);
  });
});
