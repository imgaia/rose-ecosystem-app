// src/server/core/index.ts
// The server-side core: what the tRPC routers (step 5) call.
// trust.ts is deliberately not exported; only interactions.ts uses it.

import type { Db } from "./db";
import { RuleError } from "./errors";
import { inTransaction } from "./db";
import { decideGovernance, governanceHandlers, withdrawGovernance } from "./governance";
import { interactionHandlers, respond, withdrawProposal, type Actor } from "./interactions";
import type { DecideInput } from "./proposals";

export { RuleError } from "./errors";
export { can, assertCan, type CanResult, type Block, type Capability } from "./rules";
export { postTransaction, recomputeBalance, ledgerBalance, spendable, negativeBalanceLimit } from "./ledger";
export { recordActivity } from "./activity";
export * from "./interactions";
export * from "./wallet";
export * from "./invitations";
export * from "./identity";
export * from "./governance";
export { convert, findRate } from "./rates";

/** Every kind of proposal the inbox can decide, and the handler that knows how. */
const handlers = { ...interactionHandlers, ...governanceHandlers };

/** The capability `nodeId` needs to decide (or withdraw) this proposal. */
export async function capabilityForProposal(db: Db, proposalId: string, nodeId: string) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  const handler = handlers[proposal.kind];
  if (!handler) throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
  return inTransaction(db, (tx) => handler.capabilityFor(tx, proposal, nodeId));
}

/**
 * Decide any proposal from the inbox, whatever its kind. Rule-value and
 * collection-creation proposals get their handlers when those features are built.
 */
export async function decideProposal(db: Db, input: DecideInput) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: input.proposalId } });
  const actor = { personId: input.personId, actingNodeId: input.approverNodeId };
  const decision = { proposalId: proposal.id, approve: input.approve, comment: input.comment };
  if (interactionHandlers[proposal.kind]) return respond(db, actor, decision);
  if (governanceHandlers[proposal.kind]) return decideGovernance(db, actor, decision);
  throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
}

/** The proposing node takes back any open proposal, whatever its kind. */
export async function withdrawAnyProposal(db: Db, actor: Actor, proposalId: string) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (governanceHandlers[proposal.kind]) return withdrawGovernance(db, actor, proposalId);
  return withdrawProposal(db, actor, proposalId);
}
