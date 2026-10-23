import { describe, expect, it, vi } from "vitest";

// A throwaway secret for the test; the real one comes from SESSION_SECRET.
vi.stubEnv("SESSION_SECRET", "test-secret-that-is-at-least-32-characters-long");
const { signSession, verifySession } = await import("./session");

describe("signed session cookie", () => {
  it("accepts a cookie it signed", () => {
    expect(verifySession(signSession("cnode123"))).toBe("cnode123");
  });

  it("refuses a missing, unsigned or tampered cookie", () => {
    const good = signSession("cnode123");
    expect(verifySession(undefined)).toBeNull();
    expect(verifySession("cnode123")).toBeNull(); // the old, unsigned format
    expect(verifySession(good.replace("cnode123", "cnode999"))).toBeNull(); // someone else's id
    expect(verifySession(`${good.slice(0, -1)}x`)).toBeNull(); // changed signature
    expect(verifySession(".abc")).toBeNull();
  });
});
