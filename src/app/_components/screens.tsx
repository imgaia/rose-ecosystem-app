"use client";

// src/app/_components/screens.tsx
// Which component draws each screen that can be opened on top of the tabs.
// Add a line here when a new kind of screen is built.

import { ReviewProposal } from "./home/review-proposal";
import { AmendTerms, CounterPropose, ProposeWork } from "./interact/propose-work";
import { Invite } from "./invite/invite";
import { RequestPayment } from "./interact/request-payment";
import { EditIdentity } from "./node/edit-identity";
import { AddMember, ProposeRemoval, ProposeRoleChange } from "./node/membership";
import { NetworkSearch, NodePage } from "./node/node-page";
import { SendPayment } from "./interact/send-payment";
import { InteractionDetail } from "./relationships/interaction-detail";
import { RelationshipDetail } from "./relationships/relationship-detail";
import type { Screen } from "./shell/navigation";
import { AddFunds, Exchange, Mint } from "./wallet/money-actions";

export function ScreenView({ screen }: { screen: Screen }) {
  switch (screen.name) {
    case "proposal":
      return <ReviewProposal proposalId={screen.proposalId} />;
    case "relationship":
      return <RelationshipDetail relationshipId={screen.relationshipId} />;
    case "interaction":
      return <InteractionDetail interactionId={screen.interactionId} />;
    case "send":
      return <SendPayment toNodeId={screen.toNodeId} />;
    case "request":
      return <RequestPayment fromNodeId={screen.fromNodeId} interactionId={screen.interactionId} />;
    case "propose-work":
      return <ProposeWork otherNodeId={screen.otherNodeId} />;
    case "counter":
      return <CounterPropose proposalId={screen.proposalId} />;
    case "amend":
      return <AmendTerms interactionId={screen.interactionId} />;
    case "add-funds":
      return <AddFunds />;
    case "exchange":
      return <Exchange />;
    case "mint":
      return <Mint />;
    case "node":
      return <NodePage nodeId={screen.nodeId} />;
    case "search":
      return <NetworkSearch />;
    case "invite":
      return <Invite />;
    case "edit-identity":
      return <EditIdentity />;
    case "role-change":
      return <ProposeRoleChange holderNodeId={screen.holderNodeId} />;
    case "add-member":
      return <AddMember />;
    case "remove-member":
      return <ProposeRemoval memberNodeId={screen.memberNodeId} />;
  }
}
