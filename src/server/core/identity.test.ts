import bcrypt from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { changePassword, changeUsername, updateIdentity } from "./identity";
import type { Actor } from "./interactions";
import { createTestDb, type TestDb } from "./test-helpers";

let t: TestDb;
beforeAll(async () => {
  t = await createTestDb();
});
afterAll(async () => {
  await t.cleanup();
});

const self = (node: { id: string }): Actor => ({ personId: node.id, actingNodeId: node.id });

describe("edit identity (UC-ID-02)", () => {
  it("updates a person's details; the display name follows first and last name", async () => {
    const ana = await t.person("Ana");
    const updated = await updateIdentity(t.db, self(ana), {
      firstName: "Ana",
      lastName: "Lopez",
      email: "Ana@Example.org",
      phone: "+41 79 000 00 00",
      photoUrl: "https://example.org/ana.jpg",
    });
    expect(updated).toMatchObject({ name: "Ana Lopez", email: "ana@example.org", photoUrl: "https://example.org/ana.jpg" });

    // Left out stays; blank clears.
    const again = await updateIdentity(t.db, self(ana), { lastName: "" });
    expect(again).toMatchObject({ name: "Ana", email: "ana@example.org", lastName: null });
  });

  it("keeps emails and phone numbers unique (R-MEM-01)", async () => {
    const ana = await t.person("Ana");
    const ben = await t.person("Ben");
    await updateIdentity(t.db, self(ana), { email: "shared@example.org" });
    await expect(updateIdentity(t.db, self(ben), { email: "SHARED@example.org" })).rejects.toMatchObject({ ruleIds: ["R-MEM-01"] });
    // Saving your own email again is fine.
    await expect(updateIdentity(t.db, self(ana), { email: "shared@example.org" })).resolves.toBeTruthy();
  });

  it("refuses a photo that isn't a web address, and a blank first name", async () => {
    const ana = await t.person("Ana");
    await expect(updateIdentity(t.db, self(ana), { photoUrl: "javascript:alert(1)" })).rejects.toThrow(/web address/);
    await expect(updateIdentity(t.db, self(ana), { firstName: " " })).rejects.toThrow(/first name/);
  });

  it("lets a collection's Owner edit it, and refuses a plain Member (EDIT_IDENTITY)", async () => {
    const owner = await t.person("Olga");
    const member = await t.person("Mia");
    const col = await t.collection("Org", [
      { node: owner, roles: ["MEMBER", "OWNER"] },
      { node: member, roles: ["MEMBER"] },
    ]);
    const updated = await updateIdentity(t.db, { personId: owner.id, actingNodeId: col.id }, { name: "ROSE Org", description: "The community" });
    expect(updated).toMatchObject({ name: "ROSE Org", description: "The community" });
    await expect(
      updateIdentity(t.db, { personId: member.id, actingNodeId: col.id }, { name: "Mine now" }),
    ).rejects.toMatchObject({ ruleIds: ["R-GOV-05"], needsRoles: ["OWNER"] });
  });
});

describe("change username (UC-ID-03)", () => {
  it("changes it if no one else has it, ignoring case", async () => {
    const ana = await t.person("Ana");
    const ben = await t.person("Ben");
    expect((await changeUsername(t.db, self(ana), "  ana.l ")).username).toBe("ana.l");
    await expect(changeUsername(t.db, self(ben), "ANA.L")).rejects.toMatchObject({ ruleIds: ["R-MEM-01"] });
    await expect(changeUsername(t.db, self(ben), "two words")).rejects.toThrow(/spaces/);
  });

  it("is only for yourself, not while acting for a collection", async () => {
    const owner = await t.person("Olga");
    const col = await t.collection("Org", [{ node: owner, roles: ["MEMBER", "OWNER"] }]);
    await expect(changeUsername(t.db, { personId: owner.id, actingNodeId: col.id }, "org")).rejects.toThrow(/yourself/);
  });
});

describe("change password (UC-ID-04)", () => {
  it("needs the current password", async () => {
    const ana = await t.person("Ana");
    await t.db.node.update({ where: { id: ana.id }, data: { passwordHash: bcrypt.hashSync("old-password", 10) } });

    await expect(changePassword(t.db, self(ana), { currentPassword: "wrong", newPassword: "new-password" })).rejects.toThrow(/current password/);
    await expect(changePassword(t.db, self(ana), { currentPassword: "old-password", newPassword: "short" })).rejects.toThrow(/8 characters/);

    await changePassword(t.db, self(ana), { currentPassword: "old-password", newPassword: "new-password" });
    const { passwordHash } = await t.db.node.findUniqueOrThrow({ where: { id: ana.id } });
    expect(bcrypt.compareSync("new-password", passwordHash!)).toBe(true);
  });
});
