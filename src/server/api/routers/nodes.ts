// src/server/api/routers/nodes.ts
// Who I am, which nodes I can act for, and a node's page (PRD UC-NET-03,
// UC-ID-07, UC-GOV-01, UC-GOV-03, UC-NET-04, UC-NET-06).

import { z } from "zod";
import { can } from "~/server/core";
import { capabilityMap, rules } from "~/server/rules";
import { actingProcedure, createTRPCRouter, protectedProcedure, requireCan } from "~/server/api/trpc";
import { permission, publicNode, type Ctx } from "./shared";

/** Every capability, and whether the person has it in the acting node. Drives disabled buttons. */
function permissionsFor(ctx: Ctx) {
  return Promise.all(Object.keys(capabilityMap).map((capability) => permission(ctx, capability)));
}

export const nodesRouter = createTRPCRouter({
  /**
   * The signed-in person, and every node they can act for: themselves first,
   * then each collection where they hold a role, with those roles.
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const person = await ctx.db.node.findUniqueOrThrow({
      where: { id: ctx.personId },
      select: { ...publicNode, username: true, email: true, phone: true },
    });
    const held = await ctx.db.roleAssignment.findMany({
      where: { holderNodeId: ctx.personId, endedAt: null, scope: { status: "ACTIVE" } },
      include: { scope: { select: publicNode }, role: { select: { key: true, label: true } } },
      orderBy: { createdAt: "asc" },
    });

    const actingAs = new Map<string, { node: typeof person | (typeof held)[number]["scope"]; roles: { key: string; label: string }[] }>();
    actingAs.set(person.id, { node: person, roles: [] });
    for (const a of held) {
      const entry = actingAs.get(a.scopeNodeId) ?? { node: a.scope, roles: [] };
      entry.roles.push(a.role);
      actingAs.set(a.scopeNodeId, entry);
    }
    return { person, actingAs: [...actingAs.values()] };
  }),

  /**
   * Switch the node the screens act for (the header switcher). Nothing is
   * stored on the server: the screen keeps the chosen id and sends it with
   * every call. This checks the person belongs there and returns what they may do.
   */
  switchActingNode: actingProcedure.mutation(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    const node = await ctx.db.node.findUniqueOrThrow({ where: { id: ctx.actor.actingNodeId }, select: publicNode });
    const roles = await ctx.db.roleAssignment.findMany({
      where: { holderNodeId: ctx.actor.personId, scopeNodeId: node.id, endedAt: null },
      include: { role: { select: { key: true, label: true } } },
    });
    return { node, roles: roles.map((r) => r.role), permissions: await permissionsFor(ctx) };
  }),

  /** What the person may do in the acting node, capability by capability. */
  permissions: actingProcedure.query(async ({ ctx }) => {
    await requireCan(ctx, "VIEW");
    return permissionsFor(ctx);
  }),

  /**
   * A node's page. Its identity is visible to every member; its roles, members
   * and rule values only to people who hold VIEW in it (its own members).
   */
  page: actingProcedure.input(z.object({ nodeId: z.string().min(1) })).query(async ({ ctx, input }) => {
    await requireCan(ctx, "VIEW");
    const node = await ctx.db.node.findUniqueOrThrow({
      where: { id: input.nodeId },
      select: { ...publicNode, createdAt: true },
    });

    const [nodeAId, nodeBId] = [ctx.actor.actingNodeId, node.id].sort();
    const relationship =
      node.id === ctx.actor.actingNodeId
        ? null
        : await ctx.db.relationship.findUnique({
            where: { nodeAId_nodeBId: { nodeAId: nodeAId!, nodeBId: nodeBId! } },
            select: { id: true, status: true, formedAt: true },
          });

    const seesInside = (await can(ctx.db, ctx.actor.personId, node.id, "VIEW")).allowed;
    if (!seesInside) return { node, relationship, inside: null };

    const [assignments, ruleValues, roleCatalogue] = await Promise.all([
      ctx.db.roleAssignment.findMany({
        where: { scopeNodeId: node.id, endedAt: null },
        include: { holder: { select: publicNode } },
        orderBy: { createdAt: "asc" },
      }),
      ctx.db.nodeRuleValue.findMany({ where: { nodeId: node.id } }),
      ctx.db.role.findMany({ include: { capabilities: true } }),
    ]);

    // UC-GOV-01: each role, what it can do, and who holds it here.
    const roles = roleCatalogue.map((role) => ({
      key: role.key,
      label: role.label,
      native: role.native,
      capabilities: Object.entries(capabilityMap)
        .filter(([, roleKeys]) => roleKeys.includes(role.key))
        .map(([capability]) => capability),
      holders: assignments.filter((a) => a.roleKey === role.key).map((a) => a.holder),
    }));

    // UC-GOV-03: every rule, its value here, and whether that is the default or the node's own.
    const ruleList = rules.map((rule) => {
      const own = rule.node_level ? ruleValues.find((v) => v.ruleId === rule.id) : undefined;
      return {
        id: rule.id,
        name: rule.name,
        type: rule.type,
        value: own?.value ?? (rule.default === undefined ? null : String(rule.default)),
        isOwnValue: !!own,
      };
    });

    const members = node.kind === "COLLECTION" ? roles.find((r) => r.key === "MEMBER")?.holders ?? [] : [];
    return { node, relationship, inside: { roles, rules: ruleList, members } };
  }),

  /** UC-NET-04: find active nodes by name, to pay, invite or propose work to. */
  directory: actingProcedure
    .input(z.object({ query: z.string().optional(), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "VIEW");
      const query = input.query?.trim();
      return ctx.db.node.findMany({
        where: {
          status: "ACTIVE",
          id: { not: ctx.actor.actingNodeId },
          ...(query ? { name: { contains: query } } : {}),
        },
        select: publicNode,
        orderBy: { name: "asc" },
        take: input.limit,
      });
    }),

  /** UC-NET-06: the acting node's activity history, newest first. Pass the last id as `cursor` for more. */
  activity: actingProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(30), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      await requireCan(ctx, "VIEW");
      const items = await ctx.db.activity.findMany({
        where: { nodeId: ctx.actor.actingNodeId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      });
      // One extra row was fetched only to know whether there is a next page.
      const hasMore = items.length > input.limit;
      if (hasMore) items.pop();
      return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
    }),
});
