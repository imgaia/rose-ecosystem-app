/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { can, RuleError, type Actor, type Capability } from "~/server/core";
import { db } from "~/server/db";
import { getRule } from "~/server/rules";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    db,
    // The signed-in person's node id, from the cookie /api/login sets.
    // Checked against the database in protectedProcedure below.
    sessionNodeId: readCookie(opts.headers, "session"),
    ...opts,
  };
};

function readCookie(headers: Headers, name: string): string | null {
  for (const part of (headers.get("cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("=")) || null;
  }
  return null;
}

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
        // When the rules stopped the action: which rules, and which roles
        // would allow it, so a screen can say "Needs Treasurer".
        blockedBy:
          error.cause instanceof RuleError
            ? error.cause.ruleIds.map((ruleId) => ({ ruleId, rule: getRule(ruleId)?.name ?? ruleId }))
            : null,
        needsRoles: error.cause instanceof RuleError ? error.cause.needsRoles : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware).use(ruleErrorMiddleware());

/**
 * Turns the errors core code throws into proper API errors:
 * a RuleError becomes FORBIDDEN (a missing role) or BAD_REQUEST (anything
 * else the rules refuse), and "record not found" becomes NOT_FOUND.
 * The RuleError stays attached as `cause`, so errorFormatter can add its rules.
 */
function ruleErrorMiddleware() {
  return t.middleware(async ({ next }) => {
    const result = await next();
    if (result.ok) return result;
    const cause = result.error.cause;
    if (cause instanceof RuleError) {
      throw new TRPCError({
        code: cause.needsRoles.length > 0 ? "FORBIDDEN" : "BAD_REQUEST",
        message: cause.message,
        cause,
      });
    }
    if (cause && typeof cause === "object" && "code" in cause && cause.code === "P2025") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Not found", cause });
    }
    return result;
  });
}

/**
 * Signed-in procedure: refuses unless the session cookie belongs to an
 * active individual node. Adds `ctx.personId`.
 */
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const person = ctx.sessionNodeId
    ? await ctx.db.node.findUnique({ where: { id: ctx.sessionNodeId }, select: { id: true, kind: true, status: true } })
    : null;
  if (person?.kind !== "INDIVIDUAL" || person.status !== "ACTIVE") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in" });
  }
  return next({ ctx: { personId: person.id } });
});

/**
 * Every screen action goes through this one: the input must say which node
 * the person is acting for (themselves, or a collection from the switcher).
 * Adds `ctx.actor` = { personId, actingNodeId }, the shape core functions take.
 * Each procedure then calls requireCan(...) as its first step.
 */
export const actingProcedure = protectedProcedure
  .input(z.object({ actingNodeId: z.string().min(1) }))
  .use(async ({ ctx, input, next }) => {
    const actor: Actor = { personId: ctx.personId, actingNodeId: input.actingNodeId };
    return next({ ctx: { actor } });
  });

/**
 * The rules check (R-GOV-05), run first in every acting procedure. Refuses
 * with FORBIDDEN, carrying the blocking rules and the roles that would allow it.
 */
export async function requireCan(ctx: { db: typeof db; actor: Actor }, capability: Capability) {
  const result = await can(ctx.db, ctx.actor.personId, ctx.actor.actingNodeId, capability);
  if (!result.allowed) {
    const block = result.blockedBy[0]!;
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${capability}: ${block.reason}`,
      cause: new RuleError(block.reason, result.blockedBy.map((b) => b.ruleId), block.needsRoles),
    });
  }
}
