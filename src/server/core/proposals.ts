// src/server/core/proposals.ts
// Proposals (PRD 2.5, rule R-GOV-06): any change that needs more than one
// approval. A proposal has one ProposalApprover row per node whose approval
// is needed. It applies once every row says "approve"; any decline closes it.
//
// This file knows nothing about payments or roles. Whoever creates a proposal
// passes a ProposalHandler that says:
//   - which capability a person needs to propose (and decide) for each node, and
//   - what to do when the proposal is approved, declined or withdrawn.
// interactions.ts has the handlers for interactions; index.ts picks the right
// handler by proposal kind for the inbox.
//
// Who approves and how many approvals it takes can come from rules.yaml
// instead of the caller: pass `approvalRule` (see readApproval below). That is
// how a collection's role changes (R-GOV-08) and removals (R-COL-04) work,
// with declines counted as R-GOV-06 says, so a node can set its own values.
// A `one_of` entry (R-FIN-11's "a Treasurer and an Owner") asks every holder
// of a role as themselves, and any one of them approving is enough for it.

import type { Proposal, ProposalKind } from "../../../generated/prisma";
import { getRule, type ApproverSpec } from "~/server/rules";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError } from "./errors";
import { assertMeets, meets, type Capability, type Requirement } from "./rules";

export interface ProposalHandler {
  /** The capability a person needs in `nodeId` to propose, decide or withdraw for it. */
  capabilityFor(tx: Tx, proposal: Proposal, nodeId: string): Promise<Capability>;
  /** Runs once every required approval is in, inside the same database transaction. */
  apply(tx: Tx, proposal: Proposal, personId: string): Promise<void>;
  /** Runs when the proposal is declined or withdrawn. */
  onClosed?(tx: Tx, proposal: Proposal, status: "DECLINED" | "WITHDRAWN", personId: string): Promise<void>;
}

/**
 * Where to read who approves from (rules.yaml, or the node's own values).
 * `approversRuleId`'s `approvers` list says who: the affected node, any one
 * holder of a role deciding for the collection, or every holder of a role.
 * `shareRuleId`'s value is the share of those approvals needed (all if none).
 */
export interface ApprovalRule {
  approversRuleId: string; // R-GOV-08, R-COL-04
  shareRuleId?: string; // R-COL-04
  scopeNodeId: string; // the collection whose own rule values apply
  affectedNodeId: string; // the node the change is about
}

/** Who approves and how, as read when it was proposed. Kept in the proposal's payload. */
export interface Approval {
  ruleIds: string[];
  needed: number; // approvals needed out of the `main` approver rows
  declines: "any_closes" | "unreachable"; // R-GOV-06
  deciders: Record<string, Requirement>; // what deciding needs, per approver node
  /** The approver nodes `needed` counts among; every approver row when absent (proposals made before one_of). */
  main?: string[];
  /** One list per one_of entry: any one of its nodes approving is enough for that entry. */
  oneOf?: string[][];
}

export interface CreateProposalInput {
  kind: ProposalKind;
  proposerNodeId: string;
  proposedByPersonId: string;
  interactionId?: string;
  subjectNodeId?: string;
  payload: unknown; // stored as JSON (an object, if it is to carry an approval read from rules.yaml)
  comment?: string;
  /** Every node whose approval is needed, the proposer included. Or read them from rules.yaml: */
  approverNodeIds?: string[];
  approvalRule?: ApprovalRule;
  /**
   * Approver nodes whose approval proposing already gives, if the proposing
   * person may decide for them. Default: the proposer node.
   */
  preApprovedNodeIds?: string[];
}

export function readPayload<T>(proposal: Proposal): T {
  return JSON.parse(proposal.payload) as T;
}

/** The approval read from rules.yaml when it was proposed, or null for "every approver needed". */
export function approvalOf(proposal: Proposal): Approval | null {
  return readPayload<{ approval?: Approval }>(proposal).approval ?? null;
}

/** What `nodeId` needs to decide this proposal: from its approval if it has one, else from the handler. */
export async function requirementFor(tx: Tx, proposal: Proposal, nodeId: string, handler: ProposalHandler): Promise<Requirement> {
  return approvalOf(proposal)?.deciders[nodeId] ?? handler.capabilityFor(tx, proposal, nodeId);
}

/**
 * Where a proposal stands, given its approver rows so far. Without an
 * approval read from rules.yaml, every approver is needed, so the first
 * decline closes it. Otherwise it applies once `needed` of the main rows and
 * one node of each one_of entry have approved, and a decline closes it as
 * R-GOV-06 says: at once, or once that can no longer happen.
 */
function outcome(proposal: Proposal, rows: { approverNodeId: string; decision: boolean | null }[]) {
  const approval = approvalOf(proposal);
  const decision = (id: string) => rows.find((r) => r.approverNodeId === id)?.decision ?? null;
  const main = approval?.main ?? rows.map((r) => r.approverNodeId);
  const needed = approval?.needed ?? main.length;
  const oneOf = approval?.oneOf ?? [];

  const approved = main.filter((id) => decision(id) === true).length;
  if (approved >= needed && oneOf.every((ids) => ids.some((id) => decision(id) === true))) return "APPROVED";

  if (!rows.some((r) => r.decision === false)) return "OPEN";
  const declined = main.filter((id) => decision(id) === false).length;
  const unreachable = main.length - declined < needed || oneOf.some((ids) => ids.every((id) => decision(id) === false));
  return (approval?.declines ?? "unreachable") === "any_closes" || unreachable ? "DECLINED" : "OPEN";
}

/**
 * Read who approves from rules.yaml, with the scope node's own values first
 * (NodeRuleValue). For an approval rule (R-GOV-08) the node's value is its
 * approvers list as JSON; for a parameter (R-COL-04) it is the share.
 */
async function readApproval(tx: Tx, input: ApprovalRule): Promise<Approval> {
  const ownValue = async (ruleId: string) =>
    (await tx.nodeRuleValue.findUnique({ where: { nodeId_ruleId: { nodeId: input.scopeNodeId, ruleId } } }))?.value;

  const approversRule = getRule(input.approversRuleId);
  const ownApprovers = approversRule?.type === "approval" ? await ownValue(input.approversRuleId) : undefined;
  let specs = (ownApprovers ? JSON.parse(ownApprovers) : approversRule?.approvers) as ApproverSpec[] | "both_sides" | undefined;
  if (!Array.isArray(specs)) throw new Error(`${input.approversRuleId} has no approvers list in rules.yaml`);

  let share = 1;
  if (input.shareRuleId) {
    const value = String((await ownValue(input.shareRuleId)) ?? getRule(input.shareRuleId)?.default ?? "1");
    if (value === "owner_only") specs = [{ any_one: "OWNER" }]; // R-COL-04's "the Owner alone"
    else share = Number(value);
    if (!(share > 0 && share <= 1)) throw new Error(`${input.shareRuleId} must be a share between 0 and 1, or owner_only`);
  }
  const declines = ((await ownValue("R-GOV-06")) ?? getRule("R-GOV-06")?.declines ?? "unreachable") as Approval["declines"];

  const deciders: Record<string, Requirement> = {};
  const main = new Set<string>();
  const oneOf: string[][] = [];
  const holders = async (roleKey: string) =>
    (await tx.roleAssignment.findMany({ where: { scopeNodeId: input.scopeNodeId, roleKey, endedAt: null }, select: { holderNodeId: true } })).map(
      (r) => r.holderNodeId,
    );
  for (const spec of specs) {
    if (spec === "affected") {
      deciders[input.affectedNodeId] = await decidesForItself(tx, input.affectedNodeId);
      main.add(input.affectedNodeId);
    } else if (typeof spec === "string" || "any_one" in spec) {
      deciders[input.scopeNodeId] = { anyRole: [typeof spec === "string" ? spec : spec.any_one] };
      main.add(input.scopeNodeId);
    } else if ("one_of" in spec) {
      const ids = await holders(spec.one_of);
      if (ids.length === 0) throw new RuleError(`No one holds the ${spec.one_of} role to approve this`, [input.approversRuleId]);
      for (const id of ids) deciders[id] ??= await decidesForItself(tx, id);
      oneOf.push(ids);
    } else {
      const ids = await holders("every" in spec ? spec.every : spec.every_other);
      for (const id of ids) {
        if ("every_other" in spec && id === input.affectedNodeId) continue;
        deciders[id] ??= await decidesForItself(tx, id);
        main.add(id);
      }
    }
  }
  if (Object.keys(deciders).length === 0) throw new RuleError("No one is left to approve this", [input.approversRuleId]);

  return {
    ruleIds: [...new Set([input.approversRuleId, input.shareRuleId, "R-GOV-06"].filter((id): id is string => !!id))],
    needed: main.size === 0 ? 0 : Math.max(1, Math.ceil(share * main.size)),
    declines,
    deciders,
    main: [...main],
    ...(oneOf.length > 0 ? { oneOf } : {}),
  };
}

/** A person decides for themselves; a collection asked to approve is decided by one of its Owners. */
async function decidesForItself(tx: Tx, nodeId: string): Promise<Requirement> {
  const node = await tx.node.findUniqueOrThrow({ where: { id: nodeId }, select: { kind: true } });
  return node.kind === "COLLECTION" ? { anyRole: ["OWNER"] } : "VIEW";
}

/**
 * Create a proposal with its approver rows. Proposing counts as the
 * proposer's own approval (R-REL-01), so the proposer's row starts approved.
 * If no other approval is needed, it applies at once.
 */
export async function createProposal(db: Db, input: CreateProposalInput, handler: ProposalHandler) {
  return inTransaction(db, async (tx) => {
    const approval = input.approvalRule ? await readApproval(tx, input.approvalRule) : null;
    const approverIds = approval ? Object.keys(approval.deciders) : [...new Set(input.approverNodeIds ?? [])];
    if (approverIds.length === 0) throw new Error("A proposal needs at least one approver");

    // Proposing counts as approval for each of these rows the proposing person may decide.
    const preApproved = new Set<string>();
    for (const id of input.preApprovedNodeIds ?? [input.proposerNodeId]) {
      if (!approverIds.includes(id)) continue;
      if (!approval || (await meets(tx, input.proposedByPersonId, id, approval.deciders[id]!)).allowed) preApproved.add(id);
    }

    const now = new Date();
    const proposal = await tx.proposal.create({
      data: {
        kind: input.kind,
        proposerNodeId: input.proposerNodeId,
        proposedByPersonId: input.proposedByPersonId,
        interactionId: input.interactionId,
        subjectNodeId: input.subjectNodeId,
        payload: JSON.stringify(approval ? { ...(input.payload as object), approval } : input.payload),
        comment: input.comment,
        approvers: {
          create: approverIds.map((approverNodeId) =>
            preApproved.has(approverNodeId)
              ? { approverNodeId, decision: true, decidedByPersonId: input.proposedByPersonId, decidedAt: now }
              : { approverNodeId },
          ),
        },
      },
    });

    // Checked after the insert because the handler may need the proposal to
    // answer; if it fails, the whole transaction (and the insert) is undone.
    const capability = await handler.capabilityFor(tx, proposal, input.proposerNodeId);
    await assertMeets(tx, input.proposedByPersonId, input.proposerNodeId, capability);

    const rows = approverIds.map((approverNodeId) => ({ approverNodeId, decision: preApproved.has(approverNodeId) ? true : null }));
    if (outcome(proposal, rows) === "APPROVED") {
      await setStatus(tx, proposal, "APPROVED");
      await handler.apply(tx, proposal, input.proposedByPersonId);
    }
    return tx.proposal.findUniqueOrThrow({ where: { id: proposal.id }, include: { approvers: true } });
  });
}

export interface DecideInput {
  proposalId: string;
  approverNodeId: string; // the node deciding (a person, or a collection they act for)
  personId: string; // the individual pressing the button
  approve: boolean;
  comment?: string;
}

/** Approve or decline for one node. Applies the proposal if it was the last approval. */
export async function decide(db: Db, input: DecideInput, handler: ProposalHandler) {
  return inTransaction(db, async (tx) => {
    const proposal = await openProposal(tx, input.proposalId);
    const row = await tx.proposalApprover.findUnique({
      where: { proposalId_approverNodeId: { proposalId: proposal.id, approverNodeId: input.approverNodeId } },
    });
    if (!row) throw new RuleError("This node is not asked to approve this proposal");
    if (row.decision !== null) throw new RuleError("This node has already decided on this proposal");

    await assertMeets(tx, input.personId, input.approverNodeId, await requirementFor(tx, proposal, input.approverNodeId, handler));

    // `decision: null` in the filter means two people deciding for the same
    // collection at the same moment can't both count.
    const { count } = await tx.proposalApprover.updateMany({
      where: { proposalId: proposal.id, approverNodeId: input.approverNodeId, decision: null },
      data: {
        decision: input.approve,
        decidedByPersonId: input.personId,
        decidedAt: new Date(),
        comment: input.comment,
      },
    });
    if (count === 0) throw new RuleError("This node has already decided on this proposal");

    const rows = await tx.proposalApprover.findMany({ where: { proposalId: proposal.id }, select: { approverNodeId: true, decision: true } });
    const now = outcome(proposal, rows);
    if (now === "DECLINED") {
      await setStatus(tx, proposal, "DECLINED");
      await handler.onClosed?.(tx, proposal, "DECLINED", input.personId);
    } else if (now === "APPROVED") {
      await setStatus(tx, proposal, "APPROVED");
      await handler.apply(tx, proposal, input.personId);
    }
    return tx.proposal.findUniqueOrThrow({ where: { id: proposal.id }, include: { approvers: true } });
  });
}

/** The proposer takes back a proposal that hasn't applied yet. */
export async function withdraw(
  db: Db,
  input: { proposalId: string; personId: string },
  handler: ProposalHandler,
) {
  return inTransaction(db, async (tx) => {
    const proposal = await openProposal(tx, input.proposalId);
    // Withdrawing needs what proposing needed (not what deciding for the proposer's row would).
    const capability = await handler.capabilityFor(tx, proposal, proposal.proposerNodeId);
    await assertMeets(tx, input.personId, proposal.proposerNodeId, capability);
    await setStatus(tx, proposal, "WITHDRAWN");
    await handler.onClosed?.(tx, proposal, "WITHDRAWN", input.personId);
    return tx.proposal.findUniqueOrThrow({ where: { id: proposal.id }, include: { approvers: true } });
  });
}

/**
 * Close a proposal because the other side answered it with a counter-proposal.
 * Recorded as that node's decline, with a comment saying why, but without
 * running onClosed: the interaction lives on through the new proposal.
 * The caller checks permission (it creates the counter-proposal right after).
 */
export async function supersede(tx: Tx, proposalId: string, approverNodeId: string, personId: string) {
  const proposal = await openProposal(tx, proposalId);
  const { count } = await tx.proposalApprover.updateMany({
    where: { proposalId, approverNodeId, decision: null },
    data: { decision: false, decidedByPersonId: personId, decidedAt: new Date(), comment: "Counter-proposed" },
  });
  if (count === 0) throw new RuleError("Only the side that has not yet approved can counter-propose");
  await setStatus(tx, proposal, "DECLINED");
}

async function openProposal(tx: Tx, proposalId: string) {
  const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (proposal.status !== "OPEN") {
    throw new RuleError(`This proposal is already ${proposal.status.toLowerCase()}`, ["R-GOV-06"]);
  }
  return proposal;
}

async function setStatus(tx: Tx, proposal: Proposal, status: "APPROVED" | "DECLINED" | "WITHDRAWN") {
  // Only an OPEN proposal can change status, so it can't be approved twice.
  const { count } = await tx.proposal.updateMany({
    where: { id: proposal.id, status: "OPEN" },
    data: { status, decidedAt: new Date() },
  });
  if (count === 0) throw new RuleError("This proposal is no longer open", ["R-GOV-06"]);
}
