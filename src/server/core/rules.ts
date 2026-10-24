// src/server/core/rules.ts
// The one rules check every action asks first (PRD 2.5, rule R-GOV-05):
// may this person do this action while acting for this node?
//
// An "action" is a capability key from the capability map in rules.yaml
// (PAY, INTERACT, MINT ...). The person may do it if they hold, in the acting
// node, a role that carries that capability. For an individual acting for
// themselves that is always true, because they hold all native roles on
// themselves. For a collection it depends on the roles they hold there.

import { capabilityMap, getRule } from "~/server/rules";
import type { Db } from "./db";
import { RuleError } from "./errors";

export type Capability = string;

export interface Block {
  ruleId: string; // e.g. R-GOV-05
  rule: string; // the rule's name from rules.yaml
  reason: string; // short text for the screen, e.g. "Needs TREASURER"
  needsRoles: string[];
}

export type CanResult = { allowed: true } | { allowed: false; blockedBy: Block[] };

export async function can(
  db: Db,
  personId: string,
  actingNodeId: string,
  action: Capability,
): Promise<CanResult> {
  const rolesWithIt = capabilityMap[action];
  // A typo in code, not something a user can cause, so fail loudly.
  if (!rolesWithIt) throw new Error(`Unknown capability "${action}" (not in rules.yaml capabilityMap)`);

  const person = await db.node.findUnique({ where: { id: personId }, select: { kind: true } });
  const held =
    person?.kind === "INDIVIDUAL"
      ? await db.roleAssignment.findFirst({
          where: {
            holderNodeId: personId,
            scopeNodeId: actingNodeId,
            roleKey: { in: rolesWithIt },
            endedAt: null, // ended roles are kept for history but count for nothing
          },
          select: { id: true },
        })
      : null;

  if (held) return { allowed: true };

  return {
    allowed: false,
    blockedBy: [
      {
        ruleId: "R-GOV-05",
        rule: getRule("R-GOV-05")?.name ?? "R-GOV-05",
        reason: `Needs ${rolesWithIt.join(" or ")}`,
        needsRoles: rolesWithIt,
      },
    ],
  };
}

/** Same check, but throws a RuleError instead of returning the result. */
export async function assertCan(db: Db, personId: string, actingNodeId: string, action: Capability) {
  const result = await can(db, personId, actingNodeId, action);
  if (!result.allowed) {
    const block = result.blockedBy[0]!;
    throw new RuleError(`${action}: ${block.reason}`, [block.ruleId], block.needsRoles);
  }
}

/**
 * What deciding something needs: a capability (as above), or holding one of
 * these roles in the node, e.g. "any one Owner" for a role change (R-GOV-08,
 * read from rules.yaml by proposals.ts).
 */
export type Requirement = Capability | { anyRole: string[] };

export async function meets(db: Db, personId: string, nodeId: string, requirement: Requirement): Promise<CanResult> {
  if (typeof requirement === "string") return can(db, personId, nodeId, requirement);
  const held = await db.roleAssignment.findFirst({
    where: { holderNodeId: personId, scopeNodeId: nodeId, roleKey: { in: requirement.anyRole }, endedAt: null },
    select: { id: true },
  });
  if (held) return { allowed: true };
  return {
    allowed: false,
    blockedBy: [
      {
        ruleId: "R-GOV-05",
        rule: getRule("R-GOV-05")?.name ?? "R-GOV-05",
        reason: `Needs ${requirement.anyRole.join(" or ")}`,
        needsRoles: requirement.anyRole,
      },
    ],
  };
}

/** Same check, but throws a RuleError instead of returning the result. */
export async function assertMeets(db: Db, personId: string, nodeId: string, requirement: Requirement) {
  const result = await meets(db, personId, nodeId, requirement);
  if (!result.allowed) {
    const block = result.blockedBy[0]!;
    throw new RuleError(block.reason, [block.ruleId], block.needsRoles);
  }
}
