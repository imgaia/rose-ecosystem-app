import { currenciesRouter } from "~/server/api/routers/currencies";
import { identityRouter } from "~/server/api/routers/identity";
import { interactionsRouter } from "~/server/api/routers/interactions";
import { invitationsRouter } from "~/server/api/routers/invitations";
import { membersRouter } from "~/server/api/routers/members";
import { nodesRouter } from "~/server/api/routers/nodes";
import { proposalsRouter } from "~/server/api/routers/proposals";
import { relationshipsRouter } from "~/server/api/routers/relationships";
import { walletRouter } from "~/server/api/routers/wallet";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  nodes: nodesRouter,
  relationships: relationshipsRouter,
  interactions: interactionsRouter,
  proposals: proposalsRouter,
  wallet: walletRouter,
  currencies: currenciesRouter,
  invitations: invitationsRouter,
  identity: identityRouter,
  members: membersRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.nodes.me();
 */
export const createCaller = createCallerFactory(appRouter);
