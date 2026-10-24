// src/server/core/proposals.ts
// Proposals (PRD 2.5, rule R-GOV-06): any change that needs more than one
// approval. A proposal has one ProposalApprover row per node whose approval
// is needed. It applies once every row says "approve"; any decline closes it.
//
// This file knows nothing about payments or roles. Whoever creates a proposal
// passes a ProposalHandler that says:
//   - which capability a person needs to decide for each node, and
//   - what to do when the proposal is approved, declined or withdrawn.
// interactions.ts has the handlers for interactions; index.ts picks the right
// handler by proposal kind for the inbox.

import type { Proposal, ProposalKind } from "../../../generated/prisma";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError } from "./errors";
import { assertCan, type Capability } from "./rules";

export interface ProposalHandler {
  /** The capability a person needs in `nodeId` to propose, decide or withdraw for it. */
  capabilityFor(tx: Tx, proposal: Proposal, nodeId: string): Promise<Capability>;
  /** Runs once every required approval is in, inside the same database transaction. */
  apply(tx: Tx, proposal: Proposal, personId: string): Promise<void>;
  /** Runs when the proposal is declined or withdrawn. */
  onClosed?(tx: Tx, proposal: Proposal, status: "DECLINED" | "WITHDRAWN", personId: string): Promise<void>;
  /**
   * Whether enough approvals are in. Default: all of them. A handler can ask
   * for fewer, e.g. half the members to remove one (R-COL-04). Any decline
   * still closes the proposal (R-GOV-06).
   */
  approvedWhen?(proposal: Proposal, approved: number, total: number): boolean;
}

export interface CreateProposalInput {
  kind: ProposalKind;
  proposerNodeId: string;
  proposedByPersonId: string;
  interactionId?: string;
  subjectNodeId?: string;
  payload: unknown; // stored as JSON
  comment?: string;
  /** Every node whose approval is needed, the proposer included. */
  approverNodeIds: string[];
  /**
   * Approver nodes whose approval proposing already gives. Default: the
   * proposer node. A collection's role change also counts the proposing
   * Owner's own approval, for instance.
   */
  preApprovedNodeIds?: string[];
}

export function readPayload<T>(proposal: Proposal): T {
  return JSON.parse(proposal.payload) as T;
}

/**
 * Create a proposal with its approver rows. Proposing counts as the
 * proposer's own approval (R-REL-01), so the proposer's row starts approved.
 * If no other approval is needed, it applies at once.
 */
export async function createProposal(db: Db, input: CreateProposalInput, handler: ProposalHandler) {
  const approverIds = [...new Set(input.approverNodeIds)];
  if (approverIds.length === 0) throw new Error("A proposal needs at least one approver");
  const preApproved = new Set(input.preApprovedNodeIds ?? [input.proposerNodeId]);

  return inTransaction(db, async (tx) => {
    const now = new Date();
    const proposal = await tx.proposal.create({
      data: {
        kind: input.kind,
        proposerNodeId: input.proposerNodeId,
        proposedByPersonId: input.proposedByPersonId,
        interactionId: input.interactionId,
        subjectNodeId: input.subjectNodeId,
        payload: JSON.stringify(input.payload),
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
    await assertCan(tx, input.proposedByPersonId, input.proposerNodeId, capability);

    if (enoughApprovals(handler, proposal, approverIds.filter((id) => preApproved.has(id)).length, approverIds.length)) {
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

    const capability = await handler.capabilityFor(tx, proposal, input.approverNodeId);
    await assertCan(tx, input.personId, input.approverNodeId, capability);

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

    if (!input.approve) {
      await setStatus(tx, proposal, "DECLINED");
      await handler.onClosed?.(tx, proposal, "DECLINED", input.personId);
    } else {
      const [approved, total] = await Promise.all([
        tx.proposalApprover.count({ where: { proposalId: proposal.id, decision: true } }),
        tx.proposalApprover.count({ where: { proposalId: proposal.id } }),
      ]);
      if (enoughApprovals(handler, proposal, approved, total)) {
        await setStatus(tx, proposal, "APPROVED");
        await handler.apply(tx, proposal, input.personId);
      }
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
    const capability = await handler.capabilityFor(tx, proposal, proposal.proposerNodeId);
    await assertCan(tx, input.personId, proposal.proposerNodeId, capability);
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

function enoughApprovals(handler: ProposalHandler, proposal: Proposal, approved: number, total: number) {
  return handler.approvedWhen ? handler.approvedWhen(proposal, approved, total) : approved === total;
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
