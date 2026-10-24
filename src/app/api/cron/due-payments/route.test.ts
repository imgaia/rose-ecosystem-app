import { beforeEach, describe, expect, it, vi } from "vitest";

// The route's job and database are stand-ins here: these tests are about who may call it.
const runDuePayments = vi.hoisted(() => vi.fn());
vi.mock("~/server/core", () => ({ runDuePayments }));
vi.mock("~/server/db", () => ({ db: {} }));

const SECRET = "test-cron-secret-that-is-at-least-32-characters";

/** Load the route afresh with this CRON_SECRET (the env module reads it once, on import). */
async function routeWith(secret: string | undefined) {
  vi.resetModules();
  vi.stubEnv("SESSION_SECRET", "test-secret-that-is-at-least-32-characters-long");
  vi.stubEnv("CRON_SECRET", secret ?? "");
  return import("./route");
}

const call = (route: Awaited<ReturnType<typeof routeWith>>, authorization?: string) =>
  route.GET(new Request("http://localhost/api/cron/due-payments", { headers: authorization ? { authorization } : {} }));

describe("cron route for scheduled payments", () => {
  beforeEach(() => {
    runDuePayments.mockReset();
    runDuePayments.mockResolvedValue({ paid: [], completed: [], failed: [], errors: [] });
  });

  it("refuses a request without the right bearer token", async () => {
    const route = await routeWith(SECRET);
    for (const header of [undefined, SECRET, `Bearer wrong`, `Bearer ${SECRET}x`, `bearer ${SECRET}`]) {
      expect((await call(route, header)).status).toBe(401);
    }
    expect(runDuePayments).not.toHaveBeenCalled();
  });

  it("refuses everything while CRON_SECRET is not set", async () => {
    const route = await routeWith(undefined);
    expect((await call(route, "Bearer ")).status).toBe(401);
    expect((await call(route, "Bearer undefined")).status).toBe(401);
    expect(runDuePayments).not.toHaveBeenCalled();
  });

  it("runs the job with the right token", async () => {
    const route = await routeWith(SECRET);
    const response = await call(route, `Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ paid: 0, completed: 0, failed: 0, errors: [] });
    expect(runDuePayments).toHaveBeenCalledTimes(1);
  });
});
