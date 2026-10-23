// src/server/session.ts
// The sign-in cookie. Its value is "<node id>.<signature>", where the
// signature is an HMAC-SHA256 of the id made with SESSION_SECRET. Only the
// server knows the secret, so nobody can make or change a cookie to sign in
// as someone else. A cookie without a valid signature counts as signed out.

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "~/env";

export const SESSION_COOKIE = "session";

function signature(nodeId: string) {
  return createHmac("sha256", env.SESSION_SECRET).update(nodeId).digest("base64url");
}

/** The cookie value for this signed-in node. */
export function signSession(nodeId: string) {
  return `${nodeId}.${signature(nodeId)}`;
}

/** The node id in a cookie value, or null if it is missing, unsigned or tampered with. */
export function verifySession(value: string | null | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const nodeId = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(signature(nodeId));
  // timingSafeEqual: comparing takes the same time however many characters match.
  return given.length === expected.length && timingSafeEqual(given, expected) ? nodeId : null;
}
