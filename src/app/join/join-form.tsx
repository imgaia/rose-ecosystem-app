"use client";

// src/app/join/join-form.tsx
// Join ROSE from an invitation (UC-INV-02): shows who invited you, then you
// choose your name, username and password. Joining creates your node and
// signs you in with the password you chose (through /api/login, like the
// sign-in page). Looks like the sign-in page on purpose.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import { formatDate } from "../_components/describe";

const fieldClassName =
  "w-full rounded-xl border border-rose-border bg-rose-bg px-4 py-3 text-sm text-rose-text shadow-sm outline-none focus:border-rose-accent focus:ring-2 focus:ring-rose-accent/20";

export function JoinForm({ token }: { token: string }) {
  const router = useRouter();
  const preview = api.invitations.preview.useQuery({ token }, { enabled: !!token, retry: false });
  const invitation = preview.data;

  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const join = api.invitations.join.useMutation();

  // Start the first name from the name the inviter typed, until the person edits it.
  const first = firstName ?? invitation?.name.split(" ")[0] ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await join.mutateAsync({
        token,
        firstName: first,
        lastName: lastName || undefined,
        username,
        password,
        email: invitation?.email ?? undefined,
        phone: invitation?.phone ?? undefined,
      });
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        // The node exists; only signing in failed. Send them to the sign-in page.
        router.push("/login");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const usable = invitation?.status === "PENDING";

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-rose-bg px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/rose-logo_orange.svg" alt="ROSE" width={120} height={48} className="h-12 w-auto" priority />
        </div>

        <section className="rounded-2xl bg-gradient-to-br from-rose-accent to-rose-accent-dark p-6 shadow-lg">
          <p className="text-sm font-medium text-white/80">{invitation ? `${invitation.inviterName} invites you` : "Invitation"}</p>
          <p className="mt-1 text-lg font-semibold text-rose-blush">
            {invitation?.joinsCollection ? `Join ${invitation.joinsCollection} on ROSE` : "Join ROSE"}
          </p>
          {invitation?.message && <p className="mt-3 text-sm text-white/90">“{invitation.message}”</p>}
        </section>

        {!token && <p className="mt-6 text-sm text-red-400">This link has no invitation in it. Ask for a new link.</p>}
        {preview.isLoading && token && <p className="mt-6 text-sm text-rose-muted">Checking your invitation…</p>}
        {preview.data === null && <p className="mt-6 text-sm text-red-400">This invitation link is not valid. Ask for a new link.</p>}
        {invitation && !usable && (
          <p className="mt-6 text-sm text-red-400">
            This invitation is {invitation.status.toLowerCase()}. Ask {invitation.inviterName} for a new link.
          </p>
        )}

        {usable && (
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
            <p className="text-xs text-rose-muted">This link works until {formatDate(invitation.expiresAt)}.</p>
            <div className="grid grid-cols-2 gap-2">
              <Labelled label="First name">
                <input className={fieldClassName} autoComplete="given-name" value={first} onChange={(e) => setFirstName(e.target.value)} required />
              </Labelled>
              <Labelled label="Last name">
                <input className={fieldClassName} autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Labelled>
            </div>
            <Labelled label="Username">
              <input className={fieldClassName} autoComplete="username" placeholder="To sign in with" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Labelled>
            <Labelled label="Password">
              <input
                type="password"
                className={fieldClassName}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Labelled>

            {(error ?? join.error) && <p className="text-sm text-red-400">{error ?? join.error?.message}</p>}

            <button
              type="submit"
              disabled={join.isPending || !first.trim() || !username.trim() || password.length < 8}
              className="mt-2 rounded-xl bg-rose-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {join.isPending ? "Joining…" : "Join ROSE"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold tracking-wide text-rose-muted uppercase">{label}</span>
      {children}
    </label>
  );
}
