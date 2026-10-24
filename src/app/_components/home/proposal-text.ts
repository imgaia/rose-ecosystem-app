// src/app/_components/home/proposal-text.ts
// The words for one proposal, shared by the inbox card and the review screen:
// what kind it is ("Work proposal"), a title, and one line of detail.

import type { RouterOutputs } from "~/trpc/react";
import { money, nameOrYou, termsSummary } from "../describe";

export type ProposalView = RouterOutputs["proposals"]["review"];

export function proposalText(p: ProposalView, actingNodeId: string) {
  const interaction = p.interaction;
  const terms = p.proposedTerms ?? p.currentTerms;
  const payer = nameOrYou(interaction?.payer, actingNodeId);
  const who = p.proposer.name;

  // A collection's role change, new member or removal.
  if (p.roleChange && p.collection) {
    const { change, role, holder } = p.roleChange;
    const you = holder?.id === actingNodeId;
    const subject = you ? "You" : (holder?.name ?? "Someone");
    const approvals = `${p.approvers.filter((x) => x.decision === true).length} of ${p.approval.needed} approvals in`;
    if (role.key === "MEMBER") {
      return {
        label: `${p.collection.name} · new member`,
        title: you ? `Join ${p.collection.name}` : `${subject} would join ${p.collection.name}`,
        detail: `Proposed by ${p.proposedBy.name} · ${approvals}`,
      };
    }
    return {
      label: `${p.collection.name} · role change`,
      title: change === "ADD" ? `${subject} would become ${role.label}` : `${subject} would no longer be ${role.label}`,
      detail: `Proposed by ${p.proposedBy.name} · ${approvals}`,
    };
  }
  if (p.removal && p.collection) {
    return {
      label: `${p.collection.name} · removal`,
      title: `Remove ${p.removal.member?.name ?? "a member"} from ${p.collection.name}`,
      detail: `“${p.removal.reason}” · proposed by ${p.proposedBy.name}`,
    };
  }

  if (p.kind === "PAYMENT_REQUEST" && p.paymentRequest) {
    const amount = money(p.paymentRequest.amount, p.paymentRequest.currency);
    return { label: "Payment request", title: `${who} requests ${amount}`, detail: `${p.paymentRequest.comment} · ${payer} would pay` };
  }

  const summary = terms ? termsSummary(terms) : "";
  const description = terms?.description ?? "";

  if (p.kind === "TERMS_CHANGE") {
    return { label: "Change of terms", title: `${who}: ${description}`, detail: `New terms: ${summary}` };
  }

  // A new interaction: work, a payment or gift sent, or a payment asked for.
  switch (interaction?.kind) {
    case "WORK":
      return { label: "Work proposal", title: `${who}: ${description}`, detail: `${summary} · ${payer} would pay` };
    case "GIFT":
      return { label: "Gift", title: `${who} sends a gift`, detail: `${summary} · “${description}”` };
    default: {
      // The proposer is the payer when sending, the payee when asking.
      const sending = interaction?.payer?.id === p.proposer.id;
      return sending
        ? { label: "Payment", title: `${who} sends a payment`, detail: `${summary} · “${description}”` }
        : { label: "Payment request", title: `${who} requests ${terms ? money(terms.amount, terms.currency) : ""}`, detail: `${description} · ${payer} would pay` };
    }
  }
}
