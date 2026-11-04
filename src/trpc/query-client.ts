import {
  defaultShouldDehydrateQuery,
  QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

/**
 * The cache key for a query's input, as React Query's own (object keys
 * sorted), except that bigint amounts are written as text: its default uses
 * JSON.stringify, which throws on a bigint (Convert and Mint quote amounts).
 */
const queryKeyHashFn = (queryKey: QueryKey) =>
  JSON.stringify(queryKey, (_key, value: unknown) => {
    if (typeof value === "bigint") return `${value}n`;
    if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    }
    return value;
  });

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
        queryKeyHashFn,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
