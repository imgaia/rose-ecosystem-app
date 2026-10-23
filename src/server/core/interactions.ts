// src/server/core/interactions.ts
// Interactions between two nodes (PRD 2.4, use cases UC-INT-01 to UC-INT-08).
//
// Every function takes an Actor: the person pressing the button and the node
// they act for (themselves, or a collection). The side of the interaction
// decides the capability needed (R-REL-07): the paying side needs PAY, the
// paid side needs INTERACT. For a collection that means any member may accept
// money coming in, and only a Treasurer may send money out.
//
// Lifecycle:
//   propose ─► PROPOSED ─accept─► ACTIVE ⇄ PAUSED ─► COMPLETED / CANCELLED
//                  └─ decline / withdraw ─► DECLINED / WITHDRAWN
// A one-off payment or gift goes straight from PROPOSED to COMPLETED when the
// recipient accepts, because the money moves at that moment.
//
// The relationship is created PENDING with the pair's first proposal and
// becomes ACTIVE when the first interaction is approved (R-REL-03). If that
// never happens (every proposal declined or withdrawn) it is CLOSED, and
// reopened as PENDING if the pair proposes again.
//
// Every event is written to the activity history of both sides (activity.ts).

import { formatAmount } from "~/lib/money";
import { rulesVersion } from "~/server/rules";
import type {
  Frequency,
  Interaction,
  InteractionKind,
  InteractionStatus,
  InteractionTerms,
  PaymentMode,
  Proposal,
  ProposalKind,
} from "../../../generated/prisma";
import { actorName, recordActivity } from "./activity";
import { inTransaction, type Db, type Tx } from "./db";
import { RuleError } from "./errors";
import { postTransaction, spendable } from "./ledger";
import { createProposal, decide, readPayload, supersede, withdraw, type ProposalHandler } from "./proposals";
import { assertCan } from "./rules";
import { updateTrustScore, type TrustEventKind } from "./trust";

export interface Actor {
  personId: string; // the individual pressing the button
  actingNodeId: string; // the node they act for: themselves or a collection
}

export interface Terms {
  description: string; // the work, or the comment for a payment or gift (required)
  amount: number; // minor units
  currencyId: string;
  frequency?: Frequency; // default ONCE
  paymentMode?: PaymentMode; // default AUTOMATIC; ON_REQUEST is for work only
  startDate?: Date | null;
  endDate?: Date | null;
  maxPayments?: number | null;
}

// ───────────────────────── Starting an interaction ─────────────────────────

/** UC-INT-01: the acting node sends a payment or gift. The recipient accepts it. */
export async function sendPayment(
  db: Db,
  actor: Actor,
  input: { toNodeId: string; kind?: "PAYMENT" | "GIFT"; terms: Terms },
) {
  const kind = input.kind ?? "PAYMENT";
  validateTerms(kind, input.terms);
  return inTransaction(db, async (tx) => {
    await assertCan(tx, actor.personId, actor.actingNodeId, "PAY");
    // Nothing is held when sent (PRD tab 9 leaves this open), but a one-off
    // payment the payer can't afford right now is refused straight away.
    if ((input.terms.frequency ?? "ONCE") === "ONCE") {
      const from = await accountOf(tx, actor.actingNodeId, input.terms.currencyId);
      if (!from) throw new RuleError("The paying node has no account in this currency");
      if ((await spendable(tx, from.id)) < input.terms.amount) {
        throw new RuleError("Not enough funds for this payment (negative-balance limit)", ["R-PAY-02"]);
      }
    }
    return createInteraction(tx, actor, {
      kind,
      payerNodeId: actor.actingNodeId,
      payeeNodeId: input.toNodeId,
      terms: input.terms,
    });
  });
}

/** UC-INT-02: the acting node asks another node for a one-off payment. */
export async function requestPayment(
  db: Db,
  actor: Actor,
  input: { fromNodeId: string; amount: number; currencyId: string; comment: string },
) {
  const terms: Terms = { description: input.comment, amount: input.amount, currencyId: input.currencyId };
  validateTerms("PAYMENT", terms);
  return createInteraction(db, actor, {
    kind: "PAYMENT",
    payerNodeId: input.fromNodeId,
    payeeNodeId: actor.actingNodeId,
    terms,
  });
}

/** UC-INT-02, within a work interaction: the paid side asks for a payment. Defaults to the agreed price. */
export async function requestWorkPayment(
  db: Db,
  actor: Actor,
  input: { interactionId: string; comment: string; amount?: number; currencyId?: string },
) {
  return inTransaction(db, async (tx) => {
    const interaction = await loadInteraction(tx, input.interactionId);
    if (interaction.kind !== "WORK") throw new RuleError("Payment requests are for work interactions");
    if (actor.actingNodeId !== interaction.payeeNodeId) {
      throw new RuleError("Only the side being paid can request a payment");
    }
    if (!["ACTIVE", "PAUSED", "COMPLETED"].includes(interaction.status)) {
      throw new RuleError(`Can't request a payment on a ${interaction.status.toLowerCase()} interaction`);
    }
    const terms = await currentTerms(tx, interaction.id);
    const payload: PaymentRequestPayload = {
      amount: input.amount ?? terms.amount,
      currencyId: input.currencyId ?? terms.currencyId,
      comment: input.comment.trim(),
    };
    validateTerms("PAYMENT", { description: payload.comment, amount: payload.amount, currencyId: payload.currencyId });

    const proposal = await createProposal(
      tx,
      {
        kind: "PAYMENT_REQUEST",
        proposerNodeId: actor.actingNodeId,
        proposedByPersonId: actor.personId,
        interactionId: interaction.id,
        payload,
        approverNodeIds: [interaction.payeeNodeId, interaction.payerNodeId],
      },
      paymentRequestHandler,
    );
    await logProposal(tx, proposal, "proposed", actor);
    return proposal;
  });
}

/** UC-INT-03: either side proposes work. */
export async function proposeWork(
  db: Db,
  actor: Actor,
  input: { otherNodeId: string; actingNodePays: boolean; terms: Terms; curatorNodeIds?: string[] },
) {
  validateTerms("WORK", input.terms);
  return createInteraction(db, actor, {
    kind: "WORK",
    payerNodeId: input.actingNodePays ? actor.actingNodeId : input.otherNodeId,
    payeeNodeId: input.actingNodePays ? input.otherNodeId : actor.actingNodeId,
    terms: input.terms,
    curatorNodeIds: input.curatorNodeIds,
  });
}

// ───────────────────────── Answering a proposal ─────────────────────────

/** UC-INT-04: accept or decline any interaction proposal waiting on the acting node. */
export async function respond(
  db: Db,
  actor: Actor,
  input: { proposalId: string; approve: boolean; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: input.proposalId } });
    const decided = await decide(
      tx,
      {
        proposalId: proposal.id,
        approverNodeId: actor.actingNodeId,
        personId: actor.personId,
        approve: input.approve,
        comment: input.comment,
      },
      handlerFor(proposal.kind),
    );
    // With two sides, one decision always settles it (approved or declined).
    if (decided.status === "APPROVED") await logProposal(tx, decided, "accepted", actor);
    if (decided.status === "DECLINED") await logProposal(tx, decided, "declined", actor);
    return decided;
  });
}

export const accept = (db: Db, actor: Actor, proposalId: string, comment?: string) =>
  respond(db, actor, { proposalId, approve: true, comment });

export const decline = (db: Db, actor: Actor, proposalId: string, reason?: string) =>
  respond(db, actor, { proposalId, approve: false, comment: reason });

/** UC-INT-04 step 4 (work only): answer a proposal with changed terms. The new version waits on the other side. */
export async function counterPropose(
  db: Db,
  actor: Actor,
  input: { proposalId: string; changes: Partial<Terms>; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    const old = await tx.proposal.findUniqueOrThrow({ where: { id: input.proposalId } });
    if (old.kind !== "INTERACTION" && old.kind !== "TERMS_CHANGE") {
      throw new RuleError("Only proposed terms can be counter-proposed");
    }
    const interaction = await loadInteraction(tx, old.interactionId!);
    if (interaction.kind !== "WORK") throw new RuleError("Only work can be counter-proposed; decline instead");

    const { termsVersion } = readPayload<TermsPayload>(old);
    const base = await tx.interactionTerms.findUniqueOrThrow({
      where: { interactionId_version: { interactionId: interaction.id, version: termsVersion } },
    });
    await supersede(tx, old.id, actor.actingNodeId, actor.personId);
    return proposeTerms(
      tx,
      actor,
      interaction,
      { ...termsFromRow(base), ...input.changes },
      input.comment,
      "counter-proposed",
    );
  });
}

/** UC-INT-06: the proposer takes back a proposal the other side hasn't accepted yet. */
export async function withdrawProposal(db: Db, actor: Actor, proposalId: string) {
  return inTransaction(db, async (tx) => {
    const proposal = await tx.proposal.findUniqueOrThrow({ where: { id: proposalId } });
    if (proposal.proposerNodeId !== actor.actingNodeId) {
      throw new RuleError("Only the node that proposed it can withdraw a proposal");
    }
    const withdrawn = await withdraw(tx, { proposalId, personId: actor.personId }, handlerFor(proposal.kind));
    await logProposal(tx, withdrawn, "withdrawn", actor);
    return withdrawn;
  });
}

// ───────────────────────── Changing an agreed interaction ─────────────────────────

/**
 * UC-INT-05 (and UC-INT-10 for a recurring payment or gift): propose new terms.
 * The current terms stay in force until the other side accepts (R-REL-02).
 */
export async function amend(
  db: Db,
  actor: Actor,
  input: { interactionId: string; changes: Partial<Terms>; comment?: string },
) {
  return inTransaction(db, async (tx) => {
    const interaction = await loadInteraction(tx, input.interactionId);
    assertMayManage(interaction, actor.actingNodeId);
    if (interaction.status !== "ACTIVE" && interaction.status !== "PAUSED") {
      throw new RuleError(`Can't amend a ${interaction.status.toLowerCase()} interaction`);
    }
    const waiting = await tx.proposal.count({
      where: { interactionId: interaction.id, status: "OPEN", kind: { in: ["INTERACTION", "TERMS_CHANGE"] } },
    });
    if (waiting > 0) throw new RuleError("A change to these terms is already waiting for approval");

    const current = await currentTerms(tx, interaction.id);
    return proposeTerms(tx, actor, interaction, { ...termsFromRow(current), ...input.changes }, input.comment, "proposed");
  });
}

// UC-INT-07 and UC-INT-08. Either side may do these alone (PRD tab 9 leaves
// this open; the simplest choice). For a recurring payment or gift only the
// paying side may.
const TRANSITIONS = {
  pause: { from: ["ACTIVE"], to: "PAUSED", done: "paused" },
  resume: { from: ["PAUSED"], to: "ACTIVE", done: "resumed" },
  complete: { from: ["ACTIVE", "PAUSED"], to: "COMPLETED", done: "completed" },
  cancel: { from: ["ACTIVE", "PAUSED"], to: "CANCELLED", done: "cancelled" },
} as const satisfies Record<string, { from: InteractionStatus[]; to: InteractionStatus; done: string }>;

async function changeStatus(db: Db, actor: Actor, interactionId: string, action: keyof typeof TRANSITIONS) {
  const { from, to, done } = TRANSITIONS[action];
  return inTransaction(db, async (tx) => {
    const interaction = await loadInteraction(tx, interactionId);
    assertMayManage(interaction, actor.actingNodeId);
    await assertCan(tx, actor.personId, actor.actingNodeId, sideCapability(interaction, actor.actingNodeId));
    if (!(from as readonly InteractionStatus[]).includes(interaction.status)) {
      throw new RuleError(`Can't ${action} a ${interaction.status.toLowerCase()} interaction`);
    }

    let nextDueAt = interaction.nextDueAt;
    if (to === "COMPLETED" || to === "CANCELLED") {
      nextDueAt = null; // schedules stop
      // A pending change of terms no longer makes sense. Open payment
      // requests stay: work already done can still be paid for.
      await tx.proposal.updateMany({
        where: { interactionId, status: "OPEN", kind: "TERMS_CHANGE" },
        data: { status: "WITHDRAWN", decidedAt: new Date() },
      });
    }
    if (action === "resume") {
      // Payments missed while paused are skipped; carry on from the next due date.
      nextDueAt = nextDueFromNow(nextDueAt, (await currentTerms(tx, interactionId)).frequency);
    }

    await tx.interaction.update({ where: { id: interactionId }, data: { status: to, nextDueAt } });
    if (to === "CANCELLED") await trustEvent(tx, interaction.relationshipId, "INTERACTION_CANCELLED");

    const who = await actorName(tx, actor.personId, actor.actingNodeId);
    const label = await describe(tx, interaction, await currentTerms(tx, interactionId));
    await logInteraction(tx, interaction, `interaction.${done}`, `${who} ${done} ${label}`);
    return loadInteraction(tx, interactionId);
  });
}

export const pause = (db: Db, actor: Actor, interactionId: string) => changeStatus(db, actor, interactionId, "pause");
export const resume = (db: Db, actor: Actor, interactionId: string) =>
  changeStatus(db, actor, interactionId, "resume");
export const complete = (db: Db, actor: Actor, interactionId: string) =>
  changeStatus(db, actor, interactionId, "complete");
export const cancel = (db: Db, actor: Actor, interactionId: string) =>
  changeStatus(db, actor, interactionId, "cancel");

// ───────────────────────── Proposal handlers ─────────────────────────
// What happens when an interaction's proposal is approved, declined or withdrawn.

interface TermsPayload {
  termsVersion: number;
}
interface PaymentRequestPayload {
  amount: number;
  currencyId: string;
  comment: string;
}

async function capabilityForSide(tx: Tx, proposal: { interactionId: string | null }, nodeId: string) {
  return sideCapability(await loadInteraction(tx, proposal.interactionId!), nodeId);
}

/** A new interaction (INTERACTION) or changed terms (TERMS_CHANGE). */
const termsHandler: ProposalHandler = {
  capabilityFor: capabilityForSide,
  async apply(tx, proposal, personId) {
    await agreeTerms(tx, proposal.interactionId!, readPayload<TermsPayload>(proposal).termsVersion, personId);
  },
  async onClosed(tx, proposal, status) {
    // If no terms were ever agreed, the interaction ends here.
    // If it was already agreed, the current terms simply stay in force.
    const { count } = await tx.interaction.updateMany({
      where: { id: proposal.interactionId!, status: "PROPOSED" },
      data: { status },
    });
    if (count > 0) await closeUnformedRelationship(tx, await loadInteraction(tx, proposal.interactionId!));
  },
};

/**
 * A relationship that never formed is closed once nothing is left that could
 * form it (no other interaction between the pair still waiting).
 */
async function closeUnformedRelationship(tx: Tx, interaction: Interaction) {
  const stillWaiting = await tx.interaction.count({
    where: { relationshipId: interaction.relationshipId, status: "PROPOSED" },
  });
  if (stillWaiting > 0) return;
  const { count } = await tx.relationship.updateMany({
    where: { id: interaction.relationshipId, status: "PENDING" },
    data: { status: "CLOSED" },
  });
  if (count > 0) {
    const [payer, payee] = await sideNames(tx, interaction);
    await logInteraction(
      tx,
      interaction,
      "relationship.closed",
      `The relationship between ${payer} and ${payee} closed before it formed`,
      interaction.relationshipId,
    );
  }
}

/** A payment request within a work interaction: approving it makes the payment. */
const paymentRequestHandler: ProposalHandler = {
  capabilityFor: capabilityForSide,
  async apply(tx, proposal, personId) {
    const interaction = await loadInteraction(tx, proposal.interactionId!);
    await pay(tx, interaction, readPayload<PaymentRequestPayload>(proposal), personId);
  },
};

/** The handlers for the proposal kinds this file owns. index.ts uses this for the inbox. */
export const interactionHandlers: Partial<Record<ProposalKind, ProposalHandler>> = {
  INTERACTION: termsHandler,
  TERMS_CHANGE: termsHandler,
  PAYMENT_REQUEST: paymentRequestHandler,
};

function handlerFor(kind: ProposalKind): ProposalHandler {
  const handler = interactionHandlers[kind];
  if (!handler) throw new RuleError(`A ${kind} proposal is not an interaction proposal`);
  return handler;
}

// ───────────────────────── Activity ─────────────────────────

type ProposalEvent = "proposed" | "counter-proposed" | "accepted" | "declined" | "withdrawn";

const PROPOSAL_TYPE: Partial<Record<ProposalKind, string>> = {
  INTERACTION: "interaction",
  TERMS_CHANGE: "terms",
  PAYMENT_REQUEST: "payment_request",
};

/** e.g. type "terms.accepted", summary "Ana accepted new terms for work "Bench" for 40.00 RCC, paid by Ana to Ben". */
async function logProposal(tx: Tx, proposal: Proposal, event: ProposalEvent, actor: Actor) {
  const interaction = await loadInteraction(tx, proposal.interactionId!);
  let what: string;
  if (proposal.kind === "PAYMENT_REQUEST") {
    const request = readPayload<PaymentRequestPayload>(proposal);
    const currency = await tx.currency.findUniqueOrThrow({ where: { id: request.currencyId } });
    const work = await currentTerms(tx, interaction.id);
    what = `a payment request of ${formatAmount(request.amount, currency.decimals, currency.code)} for "${work.description}"`;
  } else {
    const { termsVersion } = readPayload<TermsPayload>(proposal);
    const terms = await tx.interactionTerms.findUniqueOrThrow({
      where: { interactionId_version: { interactionId: interaction.id, version: termsVersion } },
    });
    const label = await describe(tx, interaction, terms);
    what = proposal.kind === "TERMS_CHANGE" ? `new terms for ${label}` : label;
  }

  const verb = event === "withdrawn" ? "withdrew" : event;
  await logInteraction(
    tx,
    interaction,
    `${PROPOSAL_TYPE[proposal.kind]}.${event === "counter-proposed" ? "proposed" : event}`,
    `${await actorName(tx, actor.personId, actor.actingNodeId)} ${verb} ${what}`,
  );
}

function logInteraction(tx: Tx, interaction: Interaction, type: string, summary: string, refId = interaction.id) {
  return recordActivity(tx, { type, refId, nodeIds: [interaction.payerNodeId, interaction.payeeNodeId], summary });
}

/** `a payment of 25.00 RCC from Ana to Ben`, `work "Bench" for 50.00 RCC (monthly), paid by Ana to Ben` */
async function describe(tx: Tx, interaction: Interaction, terms: InteractionTerms) {
  const [payer, payee] = await sideNames(tx, interaction);
  const currency = await tx.currency.findUniqueOrThrow({ where: { id: terms.currencyId } });
  const amount = formatAmount(terms.amount, currency.decimals, currency.code);
  const often = terms.frequency === "ONCE" ? "" : ` (${terms.frequency.toLowerCase()})`;
  if (interaction.kind === "WORK") return `work "${terms.description}" for ${amount}${often}, paid by ${payer} to ${payee}`;
  return `a ${interaction.kind === "GIFT" ? "gift" : "payment"} of ${amount}${often} from ${payer} to ${payee}`;
}

async function sideNames(tx: Tx, interaction: Interaction) {
  const nodes = await tx.node.findMany({
    where: { id: { in: [interaction.payerNodeId, interaction.payeeNodeId] } },
    select: { id: true, name: true },
  });
  const name = (id: string) => nodes.find((n) => n.id === id)?.name ?? "";
  return [name(interaction.payerNodeId), name(interaction.payeeNodeId)] as const;
}

// ───────────────────────── Helpers ─────────────────────────

async function createInteraction(
  db: Db,
  actor: Actor,
  input: { kind: InteractionKind; payerNodeId: string; payeeNodeId: string; terms: Terms; curatorNodeIds?: string[] },
) {
  if (input.payerNodeId === input.payeeNodeId) throw new RuleError("A node can't interact with itself");

  return inTransaction(db, async (tx) => {
    const active = await tx.node.count({
      where: { id: { in: [input.payerNodeId, input.payeeNodeId] }, status: "ACTIVE" },
    });
    if (active !== 2) throw new RuleError("Both nodes must exist and be active");
    await tx.currency.findUniqueOrThrow({ where: { id: input.terms.currencyId } });

    const relationship = await relationshipBetween(tx, input.payerNodeId, input.payeeNodeId);
    const interaction = await tx.interaction.create({
      data: {
        relationshipId: relationship.id,
        kind: input.kind,
        payerNodeId: input.payerNodeId,
        payeeNodeId: input.payeeNodeId,
        proposerNodeId: actor.actingNodeId,
        status: "PROPOSED",
        terms: { create: termsRow(1, input.terms) },
        curators: { create: (input.curatorNodeIds ?? []).map((curatorNodeId) => ({ curatorNodeId })) },
      },
    });

    // Checks the actor's capability for their side, and records their approval.
    const proposal = await createProposal(
      tx,
      {
        kind: "INTERACTION",
        proposerNodeId: actor.actingNodeId,
        proposedByPersonId: actor.personId,
        interactionId: interaction.id,
        payload: { termsVersion: 1 } satisfies TermsPayload,
        approverNodeIds: [input.payerNodeId, input.payeeNodeId],
      },
      termsHandler,
    );
    await logProposal(tx, proposal, "proposed", actor);
    return { interaction: await loadInteraction(tx, interaction.id), proposal };
  });
}

/** Save the next version of the terms and ask both sides to approve it (R-REL-02). */
async function proposeTerms(
  tx: Tx,
  actor: Actor,
  interaction: Interaction,
  terms: Terms,
  comment: string | undefined,
  event: "proposed" | "counter-proposed",
) {
  validateTerms(interaction.kind, terms);
  await tx.currency.findUniqueOrThrow({ where: { id: terms.currencyId } });
  const last = await tx.interactionTerms.findFirstOrThrow({
    where: { interactionId: interaction.id },
    orderBy: { version: "desc" },
  });
  const version = last.version + 1;
  await tx.interactionTerms.create({ data: { interactionId: interaction.id, ...termsRow(version, terms) } });

  const proposal = await createProposal(
    tx,
    {
      kind: "TERMS_CHANGE",
      proposerNodeId: actor.actingNodeId,
      proposedByPersonId: actor.personId,
      interactionId: interaction.id,
      payload: { termsVersion: version } satisfies TermsPayload,
      comment,
      approverNodeIds: [interaction.payerNodeId, interaction.payeeNodeId],
    },
    termsHandler,
  );
  await logProposal(tx, proposal, event, actor);
  return proposal;
}

/** Both sides have approved this version of the terms. */
async function agreeTerms(tx: Tx, interactionId: string, version: number, personId: string) {
  const interaction = await loadInteraction(tx, interactionId);
  const terms = await tx.interactionTerms.update({
    where: { interactionId_version: { interactionId, version } },
    data: { approved: true },
  });
  const automatic = terms.paymentMode === "AUTOMATIC";

  if (interaction.status !== "PROPOSED") {
    // An amendment: the new terms are now in force.
    const nextDueAt = automatic ? (interaction.nextDueAt ?? terms.startDate ?? new Date()) : null;
    await tx.interaction.update({ where: { id: interactionId }, data: { nextDueAt } });
    return;
  }

  // First approval of this interaction. It forms the relationship if this is the pair's first.
  const formed = await tx.relationship.updateMany({
    where: { id: interaction.relationshipId, status: "PENDING" },
    data: { status: "ACTIVE", formedAt: new Date() },
  });
  if (formed.count > 0) {
    const [payer, payee] = await sideNames(tx, interaction);
    await logInteraction(
      tx,
      interaction,
      "relationship.formed",
      `${payer} and ${payee} formed a relationship`,
      interaction.relationshipId,
    );
  }

  if (interaction.kind !== "WORK" && terms.frequency === "ONCE") {
    // A one-off payment or gift moves now.
    await pay(tx, interaction, { amount: terms.amount, currencyId: terms.currencyId, comment: terms.description ?? "" }, personId);
    await tx.interaction.update({ where: { id: interactionId }, data: { status: "COMPLETED" } });
  } else {
    // Recurring payments and automatic work payments run on schedule (step 7).
    const nextDueAt = automatic ? (terms.startDate ?? new Date()) : null;
    await tx.interaction.update({ where: { id: interactionId }, data: { status: "ACTIVE", nextDueAt } });
  }
}

/** Move money from the payer to the payee for this interaction, through the ledger. */
async function pay(
  tx: Tx,
  interaction: Interaction,
  payment: { amount: number; currencyId: string; comment: string },
  personId: string,
) {
  const from = await accountOf(tx, interaction.payerNodeId, payment.currencyId);
  if (!from) throw new RuleError("The paying node has no account in this currency");
  // The payee gets an account in this currency the first time it is paid in it.
  const to = await tx.account.upsert({
    where: {
      nodeId_currencyId_isReserve: { nodeId: interaction.payeeNodeId, currencyId: payment.currencyId, isReserve: false },
    },
    create: { nodeId: interaction.payeeNodeId, currencyId: payment.currencyId },
    update: {},
  });

  const kind = interaction.kind === "GIFT" ? "GIFT" : "PAYMENT";
  await postTransaction(tx, {
    kind,
    fromAccountId: from.id,
    toAccountId: to.id,
    amount: payment.amount,
    comment: payment.comment,
    interactionId: interaction.id,
    actedByPersonId: personId,
  });
  if (kind === "PAYMENT") await trustEvent(tx, interaction.relationshipId, "PAYMENT_COMPLETED");
}

/**
 * The only place that calls the trust score stub. Remove this function, its
 * calls and trust.ts to remove the trust score (PRD 2.6).
 */
async function trustEvent(tx: Tx, relationshipId: string, event: TrustEventKind) {
  await updateTrustScore(tx, relationshipId, event);
}

/**
 * The capability the node needs for its side of this interaction, so the API
 * can run the rules check before calling an action (and a screen can show
 * "Needs TREASURER" up front). Throws if the node is not a side.
 */
export async function capabilityOnInteraction(db: Db, interactionId: string, nodeId: string) {
  return sideCapability(await db.interaction.findUniqueOrThrow({ where: { id: interactionId } }), nodeId);
}

/** PAY for the paying side, INTERACT for the paid side (R-REL-07). */
function sideCapability(interaction: Interaction, nodeId: string): "PAY" | "INTERACT" {
  if (nodeId === interaction.payerNodeId) return "PAY";
  if (nodeId === interaction.payeeNodeId) return "INTERACT";
  throw new RuleError("This node is not a side of this interaction");
}

/** Work: either side. A recurring payment or gift: only the paying side. */
function assertMayManage(interaction: Interaction, nodeId: string) {
  sideCapability(interaction, nodeId); // throws if not a side at all
  if (interaction.kind !== "WORK" && nodeId !== interaction.payerNodeId) {
    throw new RuleError("Only the paying side can change a recurring payment or gift");
  }
}

function validateTerms(kind: InteractionKind, terms: Terms) {
  if (!Number.isSafeInteger(terms.amount) || terms.amount <= 0) {
    throw new RuleError(`Amount must be a whole number of minor units above 0 (got ${terms.amount})`);
  }
  if (!terms.description.trim()) {
    throw kind === "WORK"
      ? new RuleError("Describe the work")
      : new RuleError("A payment or gift needs a comment", ["R-PAY-03"]);
  }
  if (kind !== "WORK" && terms.paymentMode === "ON_REQUEST") {
    throw new RuleError("Only work can be paid on request");
  }
  if (terms.maxPayments != null && (!Number.isSafeInteger(terms.maxPayments) || terms.maxPayments <= 0)) {
    throw new RuleError("Number of payments must be a whole number above 0");
  }
  if (terms.startDate && terms.endDate && terms.endDate < terms.startDate) {
    throw new RuleError("The end date is before the start date");
  }
}

function termsRow(version: number, terms: Terms) {
  return {
    version,
    description: terms.description.trim(),
    amount: terms.amount,
    currencyId: terms.currencyId,
    frequency: terms.frequency ?? "ONCE",
    paymentMode: terms.paymentMode ?? "AUTOMATIC",
    startDate: terms.startDate ?? null,
    endDate: terms.endDate ?? null,
    maxPayments: terms.maxPayments ?? null,
    rulesVersion, // the rules these terms are approved under
  } as const;
}

function termsFromRow(row: InteractionTerms): Terms {
  return {
    description: row.description ?? "",
    amount: row.amount,
    currencyId: row.currencyId,
    frequency: row.frequency,
    paymentMode: row.paymentMode,
    startDate: row.startDate,
    endDate: row.endDate,
    maxPayments: row.maxPayments,
  };
}

/**
 * One relationship per pair; nodeAId is always the smaller id (same as the migration).
 * A relationship that closed without ever forming is reopened as PENDING.
 */
async function relationshipBetween(tx: Tx, x: string, y: string) {
  const [nodeAId, nodeBId] = x < y ? [x, y] : [y, x];
  const relationship = await tx.relationship.upsert({
    where: { nodeAId_nodeBId: { nodeAId, nodeBId } },
    create: { nodeAId, nodeBId }, // starts PENDING
    update: {},
  });
  if (relationship.status === "CLOSED" && !relationship.formedAt) {
    return tx.relationship.update({ where: { id: relationship.id }, data: { status: "PENDING" } });
  }
  return relationship;
}

function loadInteraction(tx: Tx, id: string) {
  return tx.interaction.findUniqueOrThrow({ where: { id } });
}

/** The latest version both sides have approved. */
function currentTerms(tx: Tx, interactionId: string) {
  return tx.interactionTerms.findFirstOrThrow({
    where: { interactionId, approved: true },
    orderBy: { version: "desc" },
  });
}

function accountOf(tx: Tx, nodeId: string, currencyId: string) {
  return tx.account.findUnique({
    where: { nodeId_currencyId_isReserve: { nodeId, currencyId, isReserve: false } },
  });
}

/** For a weekly or monthly schedule, the first due date that isn't in the past. */
function nextDueFromNow(due: Date | null, frequency: Frequency): Date | null {
  if (!due || frequency === "ONCE") return due;
  const next = new Date(due);
  const now = new Date();
  while (next < now) {
    if (frequency === "WEEKLY") next.setUTCDate(next.getUTCDate() + 7);
    else next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}
