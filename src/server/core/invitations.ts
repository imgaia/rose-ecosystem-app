// src/server/core/invitations.ts
// Invitations (PRD 3.3, UC-INV-01 to UC-INV-03). A member node invites a new
// person; they open a personal link and join as a new individual node holding
// all native roles (R-GOV-02). Joining creates no relationship (R-MEM-03).
//
// The link carries a random token. Only its SHA-256 hash is stored, so the
// database alone can't be used to join. The token is returned once, when the
// invitation is created or resent; sending it (email, phone) comes later.

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { getRule, roles } from "~/server/rules";
import { recordActivity } from "./activity";
import { inTransaction, type Db } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { assertCan } from "./rules";

function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** R-MEM-02: when an invitation made now expires. */
function expiryFromNow() {
  const days = Number(getRule("R-MEM-02")?.default ?? 14);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/** PENDING, but past its expiry date, reads as EXPIRED. */
export function effectiveStatus(invitation: { status: string; expiresAt: Date }) {
  return invitation.status === "PENDING" && invitation.expiresAt < new Date() ? "EXPIRED" : invitation.status;
}

/** UC-INV-01: invite someone by name and email or phone. Returns the token for the link. */
export async function createInvitation(
  db: Db,
  actor: Actor,
  input: { name: string; email?: string | null; phone?: string | null },
) {
  const name = input.name.trim();
  const email = textOrNull(input.email);
  const phone = textOrNull(input.phone);
  if (!name) throw new RuleError("Enter the name of the person you are inviting");
  if (!email && !phone) throw new RuleError("Enter an email or a phone number");

  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "INVITE");
    const { token, tokenHash } = newToken();
    const invitation = await tx.invitation.create({
      data: { inviterNodeId: actor.actingNodeId, name, email, phone, tokenHash, expiresAt: expiryFromNow() },
    });
    await recordActivity(tx, {
      type: "invitation.sent",
      refId: invitation.id,
      nodeIds: [actor.actingNodeId],
      summary: `Invited ${name}`,
    });
    return { invitation, token };
  });
}

/** UC-INV-03: resend a pending (or expired) invitation with a fresh link and expiry. The old link stops working. */
export async function resendInvitation(db: Db, actor: Actor, invitationId: string) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "INVITE");
    const invitation = await sentInvitation(tx, actor, invitationId);
    if (invitation.status !== "PENDING" && invitation.status !== "EXPIRED") {
      throw new RuleError(`This invitation is already ${invitation.status.toLowerCase()}`);
    }
    const { token, tokenHash } = newToken();
    const updated = await tx.invitation.update({
      where: { id: invitation.id },
      data: { tokenHash, status: "PENDING", expiresAt: expiryFromNow() },
    });
    return { invitation: updated, token };
  });
}

/** UC-INV-03: revoke a pending invitation. */
export async function revokeInvitation(db: Db, actor: Actor, invitationId: string) {
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "INVITE");
    const invitation = await sentInvitation(tx, actor, invitationId);
    if (invitation.status !== "PENDING") {
      throw new RuleError(`This invitation is already ${invitation.status.toLowerCase()}`);
    }
    return tx.invitation.update({ where: { id: invitation.id }, data: { status: "REVOKED" } });
  });
}

async function sentInvitation(db: Db, actor: Actor, invitationId: string) {
  const invitation = await db.invitation.findUnique({ where: { id: invitationId } });
  if (invitation?.inviterNodeId !== actor.actingNodeId) {
    throw new RuleError("This node did not send that invitation");
  }
  return invitation;
}

/** What the join screen shows before the invitee fills anything in. No login needed. */
export async function previewInvitation(db: Db, token: string) {
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { inviter: { select: { name: true } } },
  });
  if (!invitation) return null;
  return {
    name: invitation.name,
    email: invitation.email,
    phone: invitation.phone,
    inviterName: invitation.inviter.name,
    status: effectiveStatus(invitation),
    expiresAt: invitation.expiresAt,
  };
}

export interface JoinInput {
  firstName: string;
  lastName?: string | null;
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
}

/**
 * UC-INV-02: join from an invitation. Creates the individual node with all
 * native roles on itself (R-GOV-02) and a CHF primary fiat account (R-FIN-07).
 * Returns the new node; the screen then signs in with the chosen password.
 */
export async function acceptInvitation(db: Db, token: string, input: JoinInput) {
  const firstName = input.firstName.trim();
  const lastName = textOrNull(input.lastName);
  const username = input.username.trim();
  const email = textOrNull(input.email);
  const phone = textOrNull(input.phone);
  if (!firstName) throw new RuleError("Enter your first name");
  if (!username) throw new RuleError("Choose a username");

  return inTransaction(db, async (tx) => {
    const invitation = await tx.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!invitation) throw new RuleError("This invitation link is not valid");
    const status = effectiveStatus(invitation);
    if (status !== "PENDING") throw new RuleError(`This invitation is ${status.toLowerCase()}`, ["R-MEM-02"]);

    await assertUnique(tx, { username, email, phone });

    const node = await tx.node.create({
      data: {
        kind: "INDIVIDUAL",
        name: [firstName, lastName].filter(Boolean).join(" "),
        firstName,
        lastName,
        username,
        passwordHash: bcrypt.hashSync(input.password, 10),
        email,
        phone,
      },
    });
    await tx.roleAssignment.createMany({
      data: roles.native.map((roleKey) => ({ scopeNodeId: node.id, holderNodeId: node.id, roleKey })),
    });
    const chf = await tx.currency.findFirst({ where: { kind: "FIAT", code: "CHF" } });
    if (chf) await tx.account.create({ data: { nodeId: node.id, currencyId: chf.id, isPrimaryFiat: true } });

    // `status: "PENDING"` in the filter: two people can't use the same link at once.
    const { count } = await tx.invitation.updateMany({
      where: { id: invitation.id, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedNodeId: node.id },
    });
    if (count === 0) throw new RuleError("This invitation has already been used");

    await recordActivity(tx, {
      type: "invitation.accepted",
      refId: invitation.id,
      nodeIds: [invitation.inviterNodeId, node.id],
      summary: `${node.name} joined from an invitation`,
    });
    return node;
  });
}

/** R-MEM-01. Usernames are compared ignoring case, the same way sign-in matches them. */
async function assertUnique(db: Db, input: { username: string; email: string | null; phone: string | null }) {
  const people = await db.node.findMany({
    where: { kind: "INDIVIDUAL" },
    select: { username: true, email: true, phone: true },
  });
  const lower = (s: string | null) => s?.toLowerCase() ?? null;
  if (people.some((p) => lower(p.username) === input.username.toLowerCase())) {
    throw new RuleError("That username is already taken", ["R-MEM-01"]);
  }
  if (input.email && people.some((p) => lower(p.email) === input.email!.toLowerCase())) {
    throw new RuleError("That email is already in use", ["R-MEM-01"]);
  }
  if (input.phone && people.some((p) => p.phone === input.phone)) {
    throw new RuleError("That phone number is already in use", ["R-MEM-01"]);
  }
}
