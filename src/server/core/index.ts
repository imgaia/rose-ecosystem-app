// src/server/core/index.ts
// The server-side core: what the tRPC routers (step 5) call.
// trust.ts is deliberately not exported; only interactions.ts uses it.

import type { Db } from "./db";
import { RuleError } from "./errors";
import { capabilityOnInteraction, interactionHandlers, respond } from "./interactions";
import type { DecideInput } from "./proposals";

export { RuleError } from "./errors";
export { can, assertCan, type CanResult, type Block, type Capability } from "./rules";
export { postTransaction, recomputeBalance, ledgerBalance, spendable, negativeBalanceLimit } from "./ledger";
export { recordActivity } from "./activity";
export * from "./interactions";
export * from "./wallet";
export * from "./invitations";
export { convert, findRate } from "./rates";

/** The capability `nodeId` needs to decide (or withdraw) this proposal. */
export async function capabilityForProposal(db: Db, proposalId: string, nodeId: string) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (!interactionHandlers[proposal.kind] || !proposal.interactionId) {
    throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
  }
  return capabilityOnInteraction(db, proposal.interactionId, nodeId);
}

/**
 * Decide any proposal from the inbox, whatever its kind. Role, rule-value and
 * membership proposals get their handlers when those features are built.
 */
export async function decideProposal(db: Db, input: DecideInput) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: input.proposalId } });
  if (!interactionHandlers[proposal.kind]) throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
  return respond(
    db,
    { personId: input.personId, actingNodeId: input.approverNodeId },
    { proposalId: proposal.id, approve: input.approve, comment: input.comment },
  );
}
