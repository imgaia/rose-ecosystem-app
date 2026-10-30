// src/server/core/index.ts
// The server-side core: what the tRPC routers (step 5) call.
// trust.ts is deliberately not exported; only interactions.ts uses it.

import type { Db } from "./db";
import { RuleError } from "./errors";
import { inTransaction } from "./db";
import { currencyHandlers, decideCurrencyChange, withdrawCurrencyChange } from "./currencies";
import { decideGovernance, governanceHandlers, withdrawGovernance } from "./governance";
import { interactionHandlers, respond, withdrawProposal, type Actor } from "./interactions";
import { approvalOf, type DecideInput } from "./proposals";
import type { Requirement } from "./rules";

export { RuleError } from "./errors";
export { can, assertCan, meets, assertMeets, type CanResult, type Block, type Capability, type Requirement } from "./rules";
export { postTransaction, recomputeBalance, ledgerBalance, spendable, negativeBalanceLimit } from "./ledger";
export { recordActivity } from "./activity";
export { approvalOf, type Approval } from "./proposals";
export * from "./interactions";
export * from "./wallet";
export * from "./currencies";
export * from "./invitations";
export * from "./identity";
export * from "./governance";
export { runDuePayments, type DuePaymentsResult } from "./schedules";
export { getRate, setRate, rateHistory, applyRate, type Rate } from "./rates";
export { runRateFeed, frankfurter, type RateFeedResult, type RateSourceAdapter } from "./rateFeed";

/** Every kind of proposal the inbox can decide, and the handler that knows how. */
const handlers = { ...interactionHandlers, ...governanceHandlers, ...currencyHandlers };

/**
 * What `nodeId` needs to decide this proposal: a capability, or one of some
 * roles ("any one Owner") when its approvers came from rules.yaml.
 */
export async function capabilityForProposal(db: Db, proposalId: string, nodeId: string): Promise<Requirement> {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  const decider = approvalOf(proposal)?.deciders[nodeId];
  if (decider) return decider;
  const handler = handlers[proposal.kind];
  if (!handler) throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
  return inTransaction(db, (tx) => handler.capabilityFor(tx, proposal, nodeId));
}

/** What withdrawing needs: what proposing needed, in the proposing node. */
export async function capabilityToWithdraw(db: Db, proposalId: string) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  const handler = handlers[proposal.kind];
  if (!handler) throw new RuleError(`Withdrawing ${proposal.kind} proposals is not built yet`);
  return inTransaction(db, (tx) => handler.capabilityFor(tx, proposal, proposal.proposerNodeId));
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
  if (currencyHandlers[proposal.kind]) return decideCurrencyChange(db, actor, decision);
  throw new RuleError(`Deciding ${proposal.kind} proposals is not built yet`);
}

/** The proposing node takes back any open proposal, whatever its kind. */
export async function withdrawAnyProposal(db: Db, actor: Actor, proposalId: string) {
  const proposal = await db.proposal.findUniqueOrThrow({ where: { id: proposalId } });
  if (governanceHandlers[proposal.kind]) return withdrawGovernance(db, actor, proposalId);
  if (currencyHandlers[proposal.kind]) return withdrawCurrencyChange(db, actor, proposalId);
  return withdrawProposal(db, actor, proposalId);
}
