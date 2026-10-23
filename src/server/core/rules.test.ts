import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RuleError } from "./errors";
import { assertCan, can } from "./rules";
import { createTestDb, type TestDb } from "./test-helpers";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.cleanup();
});

describe("can(person, actingNode, action)", () => {
  it("lets an individual do everything for themselves", async () => {
    const ana = await t.person("Ana");
    for (const action of ["INTERACT", "PAY", "MINT", "ADD_FUNDS", "EDIT_IDENTITY", "EDIT_GOVERNANCE"]) {
      expect(await can(t.db, ana.id, ana.id, action)).toEqual({ allowed: true });
    }
  });

  it("does not let one individual act for another", async () => {
    const ana = await t.person("Ana");
    const ben = await t.person("Ben");
    const result = await can(t.db, ana.id, ben.id, "PAY");
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.blockedBy[0]?.ruleId).toBe("R-GOV-05");
  });

  it("gives an individual no optional-role capability they don't hold", async () => {
    const ana = await t.person("Ana");
    expect((await can(t.db, ana.id, ana.id, "VERIFY_WORK")).allowed).toBe(false);
    await t.db.roleAssignment.create({ data: { scopeNodeId: ana.id, holderNodeId: ana.id, roleKey: "CURATOR" } });
    expect((await can(t.db, ana.id, ana.id, "VERIFY_WORK")).allowed).toBe(true);
  });

  describe("in a collection", () => {
    it("follows the capability map: Member interacts, Treasurer pays, Owner edits identity", async () => {
      const member = await t.person("Mia");
      const treasurer = await t.person("Tom");
      const owner = await t.person("Ola");
      const org = await t.collection("Org", [
        { node: member, roles: ["MEMBER"] },
        { node: treasurer, roles: ["MEMBER", "TREASURER"] },
        { node: owner, roles: ["MEMBER", "OWNER"] },
      ]);

      expect((await can(t.db, member.id, org.id, "INTERACT")).allowed).toBe(true);
      expect((await can(t.db, member.id, org.id, "PAY")).allowed).toBe(false);
      expect((await can(t.db, treasurer.id, org.id, "PAY")).allowed).toBe(true);
      expect((await can(t.db, treasurer.id, org.id, "EDIT_IDENTITY")).allowed).toBe(false);
      expect((await can(t.db, owner.id, org.id, "EDIT_IDENTITY")).allowed).toBe(true);
      expect((await can(t.db, owner.id, org.id, "MINT")).allowed).toBe(false);
    });

    it("names the blocking rule and the role needed, for the screen", async () => {
      const member = await t.person("Mia");
      const org = await t.collection("Org", [{ node: member, roles: ["MEMBER"] }]);
      expect(await can(t.db, member.id, org.id, "PAY")).toEqual({
        allowed: false,
        blockedBy: [
          {
            ruleId: "R-GOV-05",
            rule: "An action needs a role in the acting node that carries its capability",
            reason: "Needs TREASURER",
            needsRoles: ["TREASURER"],
          },
        ],
      });
    });

    it("blocks someone who is not a member at all", async () => {
      const outsider = await t.person("Out");
      const org = await t.collection("Org", []);
      expect((await can(t.db, outsider.id, org.id, "INTERACT")).allowed).toBe(false);
    });

    it("ignores roles that have ended", async () => {
      const tom = await t.person("Tom");
      const org = await t.collection("Org", [{ node: tom, roles: ["MEMBER", "TREASURER"] }]);
      await t.db.roleAssignment.updateMany({
        where: { scopeNodeId: org.id, holderNodeId: tom.id, roleKey: "TREASURER" },
        data: { endedAt: new Date() },
      });
      expect((await can(t.db, tom.id, org.id, "PAY")).allowed).toBe(false);
      expect((await can(t.db, tom.id, org.id, "INTERACT")).allowed).toBe(true);
    });

    it("only lets a person act, not a collection", async () => {
      const tom = await t.person("Tom");
      const org = await t.collection("Org", [{ node: tom, roles: ["MEMBER", "TREASURER"] }]);
      const parent = await t.collection("Parent", [{ node: org, roles: ["MEMBER", "TREASURER"] }]);
      expect((await can(t.db, org.id, parent.id, "PAY")).allowed).toBe(false);
    });
  });

  it("assertCan throws a RuleError carrying the rule and role", async () => {
    const member = await t.person("Mia");
    const org = await t.collection("Org", [{ node: member, roles: ["MEMBER"] }]);
    const error = await assertCan(t.db, member.id, org.id, "PAY").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RuleError);
    expect((error as RuleError).ruleIds).toEqual(["R-GOV-05"]);
    expect((error as RuleError).needsRoles).toEqual(["TREASURER"]);
  });

  it("fails loudly on a capability that isn't in rules.yaml", async () => {
    const ana = await t.person("Ana");
    await expect(can(t.db, ana.id, ana.id, "FLY")).rejects.toThrow(/Unknown capability/);
  });
});
