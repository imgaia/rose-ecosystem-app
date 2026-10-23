"use client";

// src/app/_components/screens.tsx
// Which component draws each screen that can be opened on top of the tabs.
// Add a line here when a new kind of screen is built.

import { ReviewProposal } from "./home/review-proposal";
import { InteractionDetail } from "./relationships/interaction-detail";
import { RelationshipDetail } from "./relationships/relationship-detail";
import type { Screen } from "./shell/navigation";
import { SubScreen } from "./ui";

export function ScreenView({ screen }: { screen: Screen }) {
  switch (screen.name) {
    case "proposal":
      return <ReviewProposal proposalId={screen.proposalId} />;
    case "relationship":
      return <RelationshipDetail relationshipId={screen.relationshipId} />;
    case "interaction":
      return <InteractionDetail interactionId={screen.interactionId} />;
    default:
      return (
        <SubScreen title="Coming soon">
          <p className="text-rose-muted">This screen is coming in a later step.</p>
        </SubScreen>
      );
  }
}
