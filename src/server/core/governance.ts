// src/server/core/governance.ts
// Who holds which role in a collection, and who belongs to it.
//
// - Role changes (UC-COL-06, UC-GOV-02): an Owner proposes adding or
//   removing a role holder; it applies once the affected member and the
//   collection's Owners approve (R-GOV-08).
// - Adding a member (UC-COL-04): an Owner proposes the Member role for a node
//   from their own relationships (R-COL-02); the same kind of proposal.
// - Leaving (UC-COL-05): a member gives up every role they hold there, at once.
// - Removing a member (UC-COL-10): any member proposes it with a reason; the
//   remaining members approve, by the share the collection sets (R-COL-04).
//
// Every change keeps at least one holder of each native role (R-GOV-03).
// Proposals go through proposals.ts like interactions do, so they show up in
// the same inbox; index.ts picks these handlers by proposal kind.

import type { Proposal, ProposalKind } from "../../../generated/prisma";
import { getRule, roles } from "~/server/rules";
import { actorName, recordActivity } from "./activity";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError, textOrNull } from "./errors";
import type { Actor } from "./interactions";
import { createProposal, decide, readPayload, withdraw, type ProposalHandler } from "./proposals";
import { assertCan, type Capability } from "./rules";

export interface RoleChangePayload {
  change: "ADD" | "REMOVE";
  roleKey: string;
  holderNodeId: string;
}

export interface RemovalPayload {
  memberNodeId: string;
  reason: string;
  /** R-COL-04 when proposed: "1.0" (everyone), "0.5" (half), or "owner_only". */
  share: string;
}

// ───────────────────────── Role changes and adding members ─────────────────────────

/** UC-COL-06: an Owner, acting for the collection, proposes adding or removing a role holder. */
export async function proposeRoleChange(
  db: Db,
  actor: Actor,
  input: { holderNodeId: string; roleKey: string; change: "ADD" | "REMOVE"; comment?: string },
) {
  if (input.roleKey === "MEMBER") {
    throw new RuleError(
      input.change === "ADD" ? "To add a member, use Add a member" : "To remove a member, propose their removal",
      ["R-COL-05"],
    );
  }
  return createRoleChange(db, actor, { change: input.change, roleKey: input.roleKey, holderNodeId: input.holderNodeId }, input.comment);
}

/**
 * UC-COL-04: an Owner proposes the Member role for a node they already have
 * a relationship with (R-COL-02). The node and the Owners approve.
 */
export async function proposeAddMember(db: Db, actor: Actor, input: { nodeId: string; comment?: string }) {
  return inTransaction(db, async (tx) => {
    const node = await tx.node.findUniqueOrThrow({ where: { id: input.nodeId }, select: { status: true, name: true } });
    if (node.status !== "ACTIVE") throw new RuleError(`${node.name} is not active`);
    if (!(await relationshipBetween(tx, actor.personId, input.nodeId))) {
      throw new RuleError(`You can only add a node you have a relationship with`, ["R-COL-02"]);
    }
    return createRoleChange(tx, actor, { change: "ADD", roleKey: "MEMBER", holderNodeId: input.nodeId }, input.comment);
  });
}

/** For Add a member: the nodes in the person's own relationships who aren't members yet. */
export async function memberCandidates(db: Db, actor: Actor) {
  await assertCan(db, actor.personId, actor.actingNodeId, "ADD_MEMBERS");
  const members = new Set(await holdersOf(db, actor.actingNodeId, "MEMBER"));
  const relationships = await db.relationship.findMany({
    where: { status: "ACTIVE", OR: [{ nodeAId: actor.personId }, { nodeBId: actor.personId }] },
    select: { nodeAId: true, nodeBId: true },
  });
  const ids = relationships
    .map((r) => (r.nodeAId === actor.personId ? r.nodeBId : r.nodeAId))
    .filter((id) => id !== actor.actingNodeId && !members.has(id));
  return db.node.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, kind: true, name: true, photoUrl: true },
    orderBy: { name: "asc" },
  });
}

async function createRoleChange(db: Db, actor: Actor, payload: RoleChangePayload, comment?: string) {
  return inTransaction(db, async (tx) => {
    const collectionId = actor.actingNodeId;
    await checkRoleChange(tx, collectionId, payload);
    const duplicate = (await openProposals(tx, collectionId, "ROLE_CHANGE")).some((p) => {
      const other = readPayload<RoleChangePayload>(p);
      return other.holderNodeId === payload.holderNodeId && other.roleKey === payload.roleKey;
    });
    if (duplicate) throw new RuleError("A change to this role for this node is already waiting for approval");

    // R-GOV-08: the affected node and every Owner. The proposing Owner's approval is given by proposing.
    const approverNodeIds = [payload.holderNodeId, ...(await holdersOf(tx, collectionId, "OWNER"))];
    const proposal = await createProposal(
      tx,
      {
        kind: "ROLE_CHANGE",
        proposerNodeId: collectionId,
        proposedByPersonId: actor.personId,
        subjectNodeId: collectionId,
        payload,
        comment: textOrNull(comment) ?? undefined,
        approverNodeIds,
        preApprovedNodeIds: approverNodeIds.includes(actor.personId) ? [actor.personId] : [],
      },
      roleChangeHandler,
    );
    await log(tx, proposal, "proposed", actor.personId);
    return proposal;
  });
}

/** Whether this change can happen now. Checked when proposed and again when it applies. */
async function checkRoleChange(tx: Tx, collectionId: string, p: RoleChangePayload) {
  await activeCollection(tx, collectionId);
  if (![...roles.native, ...roles.optional].includes(p.roleKey)) throw new RuleError(`There is no role ${p.roleKey}`);
  const held = await rolesHeld(tx, collectionId, p.holderNodeId);
  const holder = await tx.node.findUniqueOrThrow({ where: { id: p.holderNodeId }, select: { name: true } });
  const label = await roleLabel(tx, p.roleKey);

  if (p.change === "ADD") {
    if (held.includes(p.roleKey)) throw new RuleError(`${holder.name} is already ${article(label)}${label} here`);
    if (p.roleKey !== "MEMBER" && !held.includes("MEMBER")) {
      throw new RuleError(`Only members hold roles in a collection: add ${holder.name} as a member first`, ["R-COL-05"]);
    }
  } else {
    if (!held.includes(p.roleKey)) throw new RuleError(`${holder.name} is not ${article(label)}${label} here`);
    await assertNativeRolesKeepHolders(tx, collectionId, p.holderNodeId, [p.roleKey]);
  }
}

const roleChangeHandler: ProposalHandler = {
  async capabilityFor(tx, proposal, nodeId) {
    if (nodeId === proposal.proposerNodeId) {
      const p = readPayload<RoleChangePayload>(proposal);
      return p.roleKey === "MEMBER" && p.change === "ADD" ? "ADD_MEMBERS" : "EDIT_GOVERNANCE";
    }
    return approverCapability(tx, nodeId);
  },
  async apply(tx, proposal, personId) {
    const p = readPayload<RoleChangePayload>(proposal);
    const collectionId = proposal.subjectNodeId!;
    await checkRoleChange(tx, collectionId, p); // things may have changed since it was proposed
    if (p.change === "ADD") {
      await tx.roleAssignment.create({ data: { scopeNodeId: collectionId, holderNodeId: p.holderNodeId, roleKey: p.roleKey } });
    } else {
      await endRoles(tx, collectionId, p.holderNodeId, [p.roleKey]);
    }
    await log(tx, proposal, "applied", personId);
  },
  async onClosed(tx, proposal, status, personId) {
    // A decline comes from someone asked to approve (acting as themselves); a withdrawal from the collection.
    if (status === "DECLINED") await log(tx, proposal, "declined", personId, personId);
    else await log(tx, proposal, "withdrawn", personId);
  },
};

// ───────────────────────── Leaving ─────────────────────────

/**
 * UC-COL-05: the person, acting for the collection, leaves it: they give up
 * the Member role and every other role they hold there. Refused if that
 * would leave a native role with no holder (R-GOV-03). Interactions with the
 * collection carry on.
 */
export async function leaveCollection(db: Db, actor: Actor) {
  return inTransaction(db, async (tx) => {
    const collection = await activeCollection(tx, actor.actingNodeId);
    const held = await rolesHeld(tx, collection.id, actor.personId);
    if (!held.includes("MEMBER")) throw new RuleError(`You are not a member of ${collection.name}`, ["R-COL-05"]);
    await assertNativeRolesKeepHolders(tx, collection.id, actor.personId, held, "leave");
    await endRoles(tx, collection.id, actor.personId, held);

    const person = await tx.node.findUniqueOrThrow({ where: { id: actor.personId }, select: { name: true } });
    await recordActivity(tx, {
      type: "member.left",
      refId: collection.id,
      nodeIds: [collection.id, actor.personId],
      summary: `${person.name} left ${collection.name}`,
    });
  });
}

// ───────────────────────── Removing a member ─────────────────────────

/**
 * UC-COL-10: any member, acting for the collection, proposes removing another
 * member, with a reason. The remaining members approve: all of them by
 * default, half, or only the Owners, as the collection's R-COL-04 says.
 */
export async function proposeRemoval(db: Db, actor: Actor, input: { memberNodeId: string; reason: string }) {
  const reason = input.reason.trim();
  if (!reason) throw new RuleError("Give a reason for the removal");
  if (input.memberNodeId === actor.personId) throw new RuleError("To remove yourself, leave the collection instead");

  return inTransaction(db, async (tx) => {
    const collection = await activeCollection(tx, actor.actingNodeId);
    await checkRemoval(tx, collection.id, input.memberNodeId);
    const duplicate = (await openProposals(tx, collection.id, "MEMBER_REMOVAL")).some(
      (p) => readPayload<RemovalPayload>(p).memberNodeId === input.memberNodeId,
    );
    if (duplicate) throw new RuleError("A removal of this member is already waiting for approval");

    const share = await removalShare(tx, collection.id);
    const pool = await holdersOf(tx, collection.id, share === "owner_only" ? "OWNER" : "MEMBER");
    const approverNodeIds = pool.filter((id) => id !== input.memberNodeId);
    if (approverNodeIds.length === 0) throw new RuleError("No one is left to approve this removal", ["R-COL-04"]);

    const proposal = await createProposal(
      tx,
      {
        kind: "MEMBER_REMOVAL",
        proposerNodeId: collection.id,
        proposedByPersonId: actor.personId,
        subjectNodeId: collection.id,
        payload: { memberNodeId: input.memberNodeId, reason, share } satisfies RemovalPayload,
        comment: reason,
        approverNodeIds,
        preApprovedNodeIds: approverNodeIds.includes(actor.personId) ? [actor.personId] : [],
      },
      removalHandler,
    );
    await log(tx, proposal, "proposed", actor.personId);
    return proposal;
  });
}

async function checkRemoval(tx: Tx, collectionId: string, memberNodeId: string) {
  const held = await rolesHeld(tx, collectionId, memberNodeId);
  if (!held.includes("MEMBER")) {
    const node = await tx.node.findUniqueOrThrow({ where: { id: memberNodeId }, select: { name: true } });
    throw new RuleError(`${node.name} is not a member`, ["R-COL-05"]);
  }
  await assertNativeRolesKeepHolders(tx, collectionId, memberNodeId, held, "remove");
}

const removalHandler: ProposalHandler = {
  async capabilityFor(tx, proposal, nodeId) {
    return nodeId === proposal.proposerNodeId ? "PROPOSE_REMOVAL" : approverCapability(tx, nodeId);
  },
  approvedWhen(proposal, approved, total) {
    const share = Number(readPayload<RemovalPayload>(proposal).share);
    // "owner_only" and "1.0" both mean every approver asked; a number below 1 is a share of them.
    return Number.isFinite(share) && share < 1 ? approved >= Math.ceil(share * total) : approved === total;
  },
  async apply(tx, proposal, personId) {
    const p = readPayload<RemovalPayload>(proposal);
    const collectionId = proposal.subjectNodeId!;
    await checkRemoval(tx, collectionId, p.memberNodeId);
    await endRoles(tx, collectionId, p.memberNodeId, await rolesHeld(tx, collectionId, p.memberNodeId));
    await log(tx, proposal, "applied", personId);
  },
  async onClosed(tx, proposal, status, personId) {
    // A decline comes from someone asked to approve (acting as themselves); a withdrawal from the collection.
    if (status === "DECLINED") await log(tx, proposal, "declined", personId, personId);
    else await log(tx, proposal, "withdrawn", personId);
  },
};

/** R-COL-04 for this collection: its own value, or the default. */
async function removalShare(tx: Tx, collectionId: string) {
  const own = await tx.nodeRuleValue.findUnique({ where: { nodeId_ruleId: { nodeId: collectionId, ruleId: "R-COL-04" } } });
  return String(own?.value ?? getRule("R-COL-04")?.default ?? "1.0");
}

// ───────────────────────── Deciding (from the inbox) ─────────────────────────

/** The handlers for the proposal kinds this file owns. index.ts uses this for the inbox. */
export const governanceHandlers: Partial<Record<ProposalKind, ProposalHandler>> = {
  ROLE_CHANGE: roleChangeHandler,
  MEMBER_REMOVAL: removalHandler,
};

function handlerFor(kind: ProposalKind) {
  const handler = governanceHandlers[kind];
  if (!handler) throw new RuleError(`A ${kind} proposal is not a governance proposal`);
  return handler;
}

/** Approve or decline a role change or removal for the acting node. */
export async function decideGovernance(db: Db, actor: Actor, input: { proposalId: string; approve: boolean; comment?: string }) {
  return inTransaction(db, async (tx) => {
    const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: input.proposalId } });
    const decided = await decide(
      tx,
      { proposalId: proposal.id, approverNodeId: actor.actingNodeId, personId: actor.personId, approve: input.approve, comment: input.comment },
      handlerFor(proposal.kind),
    );
    if (decided.status === "OPEN") await log(tx, proposal, input.approve ? "approved" : "declined", actor.personId, actor.actingNodeId);
    return decided;
  });
}

/** The collection that proposed it takes it back. */
export async function withdrawGovernance(db: Db, actor: Actor, proposalId: string) {
  return inTransaction(db, async (tx) => {
    const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: proposalId } });
    if (proposal.proposerNodeId !== actor.actingNodeId) {
      throw new RuleError("Only the node that proposed it can withdraw a proposal");
    }
    return withdraw(tx, { proposalId, personId: actor.personId }, handlerFor(proposal.kind));
  });
}

// ───────────────────────── Helpers ─────────────────────────

/** Deciding for yourself needs nothing more than being you; for a collection, an Owner decides. */
async function approverCapability(tx: Tx, nodeId: string): Promise<Capability> {
  const node = await tx.node.findUniqueOrThrow({ where: { id: nodeId }, select: { kind: true } });
  return node.kind === "COLLECTION" ? "EDIT_GOVERNANCE" : "VIEW";
}

async function activeCollection(tx: Tx, nodeId: string) {
  const node = await tx.node.findUniqueOrThrow({ where: { id: nodeId }, select: { id: true, kind: true, status: true, name: true } });
  if (node.kind !== "COLLECTION") throw new RuleError("Roles and members can only be changed in a collection");
  if (node.status !== "ACTIVE") throw new RuleError(`${node.name} is not active`);
  return node;
}

/** The nodes holding this role in the collection now. */
async function holdersOf(db: Db, collectionId: string, roleKey: string) {
  const rows = await db.roleAssignment.findMany({
    where: { scopeNodeId: collectionId, roleKey, endedAt: null },
    select: { holderNodeId: true },
    orderBy: { createdAt: "asc" },
  });
  return [...new Set(rows.map((r) => r.holderNodeId))];
}

async function rolesHeld(tx: Tx, collectionId: string, holderNodeId: string) {
  const rows = await tx.roleAssignment.findMany({
    where: { scopeNodeId: collectionId, holderNodeId, endedAt: null },
    select: { roleKey: true },
  });
  return [...new Set(rows.map((r) => r.roleKey))];
}

/** R-GOV-03: refuse if taking these roles from this holder leaves a native role with nobody. */
async function assertNativeRolesKeepHolders(
  tx: Tx,
  collectionId: string,
  holderNodeId: string,
  roleKeys: string[],
  verb: "leave" | "remove" | null = null,
) {
  for (const roleKey of roleKeys.filter((k) => roles.native.includes(k))) {
    const others = (await holdersOf(tx, collectionId, roleKey)).filter((id) => id !== holderNodeId);
    if (others.length === 0) {
      const label = await roleLabel(tx, roleKey);
      const fix = verb === "leave" ? `, so you can't leave until someone else is ${article(label)}${label}` : "";
      throw new RuleError(`The collection would have no ${label} left${fix}`, ["R-GOV-03"]);
    }
  }
}

/** Roles end rather than being deleted, so the history stays. */
async function endRoles(tx: Tx, collectionId: string, holderNodeId: string, roleKeys: string[]) {
  await tx.roleAssignment.updateMany({
    where: { scopeNodeId: collectionId, holderNodeId, roleKey: { in: roleKeys }, endedAt: null },
    data: { endedAt: new Date() },
  });
}

async function openProposals(tx: Tx, collectionId: string, kind: ProposalKind) {
  return tx.proposal.findMany({ where: { subjectNodeId: collectionId, kind, status: "OPEN" } });
}

async function relationshipBetween(tx: Tx, a: string, b: string) {
  const [nodeAId, nodeBId] = [a, b].sort();
  const r = await tx.relationship.findUnique({ where: { nodeAId_nodeBId: { nodeAId: nodeAId!, nodeBId: nodeBId! } } });
  return r?.status === "ACTIVE" ? r : null;
}

async function roleLabel(tx: Tx, roleKey: string) {
  return (await tx.role.findUnique({ where: { key: roleKey } }))?.label ?? roleKey;
}

/** "a " or "an " before a role label. */
const article = (label: string) => (/^[aeiou]/i.test(label) ? "an " : "a ");

// ───────────────────────── Activity ─────────────────────────

type GovernanceEvent = "proposed" | "approved" | "applied" | "declined" | "withdrawn";

/** One activity row for the collection, the affected member and everyone asked to approve. */
async function log(tx: Tx, proposal: Proposal, event: GovernanceEvent, personId: string, actingNodeId = proposal.proposerNodeId) {
  const collection = await tx.node.findUniqueOrThrow({ where: { id: proposal.subjectNodeId! }, select: { name: true } });
  const who = await actorName(tx, personId, actingNodeId);
  const approvers = await tx.proposalApprover.findMany({ where: { proposalId: proposal.id }, select: { approverNodeId: true } });

  let affectedId: string;
  let what: string; // "making Theo a Treasurer of ROSE Org"
  let done: string; // "Theo is now a Treasurer of ROSE Org"
  if (proposal.kind === "MEMBER_REMOVAL") {
    const p = readPayload<RemovalPayload>(proposal);
    affectedId = p.memberNodeId;
    const name = (await tx.node.findUniqueOrThrow({ where: { id: affectedId }, select: { name: true } })).name;
    what = `removing ${name} from ${collection.name} (${p.reason})`;
    done = `${name} was removed from ${collection.name}`;
  } else {
    const p = readPayload<RoleChangePayload>(proposal);
    affectedId = p.holderNodeId;
    const name = (await tx.node.findUniqueOrThrow({ where: { id: affectedId }, select: { name: true } })).name;
    const label = await roleLabel(tx, p.roleKey);
    if (p.roleKey === "MEMBER") {
      what = `adding ${name} as a member of ${collection.name}`;
      done = `${name} joined ${collection.name}`;
    } else if (p.change === "ADD") {
      what = `making ${name} ${article(label)}${label} of ${collection.name}`;
      done = `${name} is now ${article(label)}${label} of ${collection.name}`;
    } else {
      what = `ending ${name}'s role as ${label} of ${collection.name}`;
      done = `${name} is no longer ${article(label)}${label} of ${collection.name}`;
    }
  }

  const summary = event === "applied" ? done : `${who} ${event} ${what}`;
  await recordActivity(tx, {
    type: `${proposal.kind === "MEMBER_REMOVAL" ? "member_removal" : "role_change"}.${event}`,
    refId: proposal.id,
    nodeIds: [proposal.subjectNodeId!, affectedId, ...approvers.map((a) => a.approverNodeId)],
    summary,
  });
}
