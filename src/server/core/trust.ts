// src/server/core/trust.ts
// Trust score stub (PRD 2.6, UC-REL-02, rules R-TS-01 and R-TS-02).
// A placeholder that must stay removable: only interactions.ts imports this
// file, from its one function `trustEvent`. To remove the trust score, delete
// this file, that function and its calls, and the TrustScore table.
//
// A relationship starts at R-TS-01 (0.75). Each completed payment closes
// R-TS-02 (10%) of the remaining gap to 1. A cancelled interaction or a failed
// scheduled payment lowers it by the same step (the amount a payment would
// have added). The row is created on the first event; until then screens show
// the starting value.

import { getRule } from "~/server/rules";
import type { Db } from "./db";

export type TrustEventKind = "PAYMENT_COMPLETED" | "INTERACTION_CANCELLED" | "SCHEDULED_PAYMENT_FAILED";

export function startingTrustScore(): number {
  return Number(getRule("R-TS-01")?.default ?? 0.75);
}

export async function updateTrustScore(db: Db, relationshipId: string, event: TrustEventKind): Promise<number> {
  const share = Number(getRule("R-TS-02")?.default ?? 0.1);
  const current = await db.trustScore.findUnique({ where: { relationshipId } });
  const value = current?.value ?? startingTrustScore();
  const step = share * (1 - value);
  const next = event === "PAYMENT_COMPLETED" ? value + step : Math.max(0, value - step);

  await db.trustScore.upsert({
    where: { relationshipId },
    create: { relationshipId, value: next },
    update: { value: next },
  });
  return next;
}
