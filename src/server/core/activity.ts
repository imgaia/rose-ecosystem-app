// src/server/core/activity.ts
// The activity history (UC-NET-06): one Activity row per event, for each
// node involved, with a short summary in plain words. Written by core code
// inside the same database transaction as the change it describes, so the
// history can't disagree with what happened.
//
// Event types are "<thing>.<what happened>", e.g. interaction.proposed,
// terms.accepted, transaction.payment, relationship.formed. `refId` points at
// the thing: the interaction, the relationship or the ledger row.

import type { Db } from "./db";

export async function recordActivity(
  db: Db,
  event: { type: string; refId?: string | null; nodeIds: string[]; summary: string },
) {
  await db.activity.createMany({
    data: [...new Set(event.nodeIds)].map((nodeId) => ({
      nodeId,
      type: event.type,
      refId: event.refId ?? null,
      summary: event.summary,
    })),
  });
}

/** "Ana", or "Mo for ROSE Org" when a person acts for a collection. */
export async function actorName(db: Db, personId: string, actingNodeId: string): Promise<string> {
  const [person, node] = await Promise.all([
    db.node.findUniqueOrThrow({ where: { id: personId }, select: { name: true } }),
    db.node.findUniqueOrThrow({ where: { id: actingNodeId }, select: { name: true } }),
  ]);
  return personId === actingNodeId ? person.name : `${person.name} for ${node.name}`;
}
