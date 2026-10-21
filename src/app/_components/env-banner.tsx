// src/app/_components/env-banner.tsx
// A strip across the top of every page whenever the app is NOT the live
// production deployment, so the dev or local copy is never mistaken for
// the real one in a demo. Renders nothing in production.

export function EnvBanner() {
  const env = process.env.VERCEL_ENV; // "production" | "preview" | "development" | undefined (local)
  if (env === "production") return null;

  const label =
    env === "preview"
      ? "DEV · test environment · changes here don't affect the live app"
      : "LOCAL · running on your machine";

  return (
    <div
      role="status"
      className="w-full bg-yellow-300 px-3 py-1 text-center text-xs font-semibold tracking-wide text-neutral-900"
    >
      {label}
    </div>
  );
}
