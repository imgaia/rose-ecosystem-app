"use client";

// src/app/_components/rose-app.tsx
// Placeholder while the v0.8 screens are built (BUILD_PLAN step 6). It shows
// who is signed in, read through the new API (nodes.me), so the dev site
// proves sign-in, the signed cookie and the new routers work end to end.

import Image from "next/image";

import { api } from "~/trpc/react";

export function RoseApp() {
  const me = api.nodes.me.useQuery();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-rose-bg px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/rose-logo_orange.svg" alt="ROSE" width={120} height={48} className="h-12 w-auto" priority />
        </div>

        <section className="rounded-2xl bg-gradient-to-br from-rose-accent to-rose-accent-dark p-6 shadow-lg">
          <p className="text-sm font-medium text-white/80">v0.8 in progress</p>
          <p className="mt-1 text-lg font-semibold text-rose-blush">
            {me.isLoading ? "Loading…" : me.data ? `Signed in as ${me.data.person.name}` : "Could not load your node"}
          </p>
        </section>

        {me.data && me.data.actingAs.length > 1 && (
          <section className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-muted">You can also act for</p>
            <ul className="mt-2 flex flex-col gap-2">
              {me.data.actingAs.slice(1).map(({ node, roles }) => (
                <li key={node.id} className="rounded-xl border border-rose-border bg-rose-surface px-4 py-3 text-sm">
                  <span className="font-semibold">{node.name}</span>
                  <span className="text-rose-muted"> · {roles.map((r) => r.label).join(", ")}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {me.error && <p className="mt-4 text-sm text-red-400">{me.error.message}</p>}

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="mt-8 w-full rounded-xl border border-rose-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-rose-surface"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
