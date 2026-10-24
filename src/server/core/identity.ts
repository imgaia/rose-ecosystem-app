// src/server/core/identity.ts
// A node's identity (UC-ID-02 to UC-ID-04): names, description, email,
// phone and photo; and for a person, their username and password.
// Editing needs EDIT_IDENTITY in the node (Owner). Every individual is the
// Owner of themselves (R-GOV-02), so they edit their own; a collection's
// Owners edit the collection's.

import bcrypt from "bcryptjs";
import { actorName, recordActivity } from "./activity";
import { inTransaction, type Db } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { assertCan } from "./rules";

export const MIN_PASSWORD_LENGTH = 8;

export interface IdentityInput {
  firstName?: string | null; // individuals: name is first + last
  lastName?: string | null;
  name?: string | null; // collections
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
}

/** UC-ID-02: change the acting node's identity. Fields left out stay as they are; blank ones are cleared. */
export async function updateIdentity(db: Db, actor: Actor, input: IdentityInput) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "EDIT_IDENTITY");
    const node = await tx.node.findUniqueOrThrow({ where: { id: actor.actingNodeId } });

    const data: Partial<Record<keyof IdentityInput, string | null>> = {};
    for (const key of ["firstName", "lastName", "name", "description", "email", "phone", "photoUrl"] as const) {
      if (input[key] !== undefined) data[key] = textOrNull(input[key]);
    }
    if (data.email) data.email = data.email.toLowerCase();
    if (data.photoUrl && !/^https?:\/\/\S+$/i.test(data.photoUrl)) {
      throw new RuleError("The photo must be a web address starting with http:// or https://");
    }

    if (node.kind === "INDIVIDUAL") {
      delete data.name; // computed from the two names below
      const firstName = data.firstName !== undefined ? data.firstName : node.firstName;
      const lastName = data.lastName !== undefined ? data.lastName : node.lastName;
      if (!firstName) throw new RuleError("Enter a first name");
      data.name = [firstName, lastName].filter(Boolean).join(" ");
    } else {
      delete data.firstName;
      delete data.lastName;
      if (data.name === null) throw new RuleError("Enter a name");
    }

    await assertUnique(tx, { email: data.email, phone: data.phone }, node.id);
    // name is never null here: set for a person above, refused if blank for a collection.
    const updated = await tx.node.update({ where: { id: node.id }, data: { ...data, name: data.name ?? undefined } });

    const who = await actorName(tx, actor.personId, actor.actingNodeId);
    await recordActivity(tx, {
      type: "identity.updated",
      refId: node.id,
      nodeIds: [node.id],
      summary: `${who} updated the identity of ${updated.name}`,
    });
    return updated;
  });
}

/** UC-ID-03: a person changes their username. Usernames are unique, ignoring case (R-MEM-01). */
export async function changeUsername(db: Db, actor: Actor, username: string) {
  const wanted = username.trim();
  if (!wanted) throw new RuleError("Choose a username");
  if (/\s/.test(wanted)) throw new RuleError("A username can't contain spaces");
  return inTransaction(db, async (tx) => {
    const node = await ownPersonNode(tx, actor);
    await assertUnique(tx, { username: wanted }, node.id);
    const updated = await tx.node.update({ where: { id: node.id }, data: { username: wanted } });
    await recordActivity(tx, {
      type: "identity.username_changed",
      refId: node.id,
      nodeIds: [node.id],
      summary: `${node.name} changed their username`,
    });
    return updated;
  });
}

/** UC-ID-04: a person changes their password, giving the current one first. */
export async function changePassword(db: Db, actor: Actor, input: { currentPassword: string; newPassword: string }) {
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) {
    throw new RuleError(`Use at least ${MIN_PASSWORD_LENGTH} characters for the new password`);
  }
  return inTransaction(db, async (tx) => {
    const node = await ownPersonNode(tx, actor);
    if (!node.passwordHash || !bcrypt.compareSync(input.currentPassword, node.passwordHash)) {
      throw new RuleError("The current password is not right");
    }
    await tx.node.update({ where: { id: node.id }, data: { passwordHash: bcrypt.hashSync(input.newPassword, 10) } });
    await recordActivity(tx, {
      type: "identity.password_changed",
      refId: node.id,
      nodeIds: [node.id],
      summary: `${node.name} changed their password`,
    });
  });
}

/**
 * Usernames, emails and phone numbers belong to one node each (R-MEM-01).
 * Usernames and emails compare ignoring case. `exceptNodeId` is the node
 * being edited, which may keep its own values.
 */
export async function assertUnique(
  db: Db,
  input: { username?: string | null; email?: string | null; phone?: string | null },
  exceptNodeId?: string,
) {
  const others = await db.node.findMany({
    where: exceptNodeId ? { id: { not: exceptNodeId } } : {},
    select: { username: true, email: true, phone: true },
  });
  const lower = (s: string | null | undefined) => s?.toLowerCase() ?? null;
  if (input.username && others.some((p) => lower(p.username) === lower(input.username))) {
    throw new RuleError("That username is already taken", ["R-MEM-01"]);
  }
  if (input.email && others.some((p) => lower(p.email) === lower(input.email))) {
    throw new RuleError("That email is already in use", ["R-MEM-01"]);
  }
  if (input.phone && others.some((p) => p.phone === input.phone)) {
    throw new RuleError("That phone number is already in use", ["R-MEM-01"]);
  }
}

/** Username and password are the signed-in person's own: they must be acting as themselves. */
async function ownPersonNode(db: Db, actor: Actor) {
  if (actor.actingNodeId !== actor.personId) {
    throw new RuleError("Switch to yourself to change your username or password");
  }
  await assertCan(db, actor.personId, actor.actingNodeId, "EDIT_IDENTITY");
  return db.node.findUniqueOrThrow({ where: { id: actor.personId } });
}
