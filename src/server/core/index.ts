// src/server/core/index.ts
// The server-side core: what the tRPC routers (step 5) call.
// trust.ts is deliberately not exported; only interactions.ts uses it.

import type { Db } from "./db";
import { RuleError } from "./errors";
import { interactionHandlers, respond } from "./interactions";
import type { DecideInput } from "./proposals";

export { RuleError } from "./errors";
export { can, assertCan, type CanResult, type Block } from "./rules";
export { postTransaction, recomputeBalance, ledgerBalance, spendable, negativeBalanceLimit } from "./ledger";
export { recordActivity } from "./activity";
export * from "./interactions";

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
