"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClassName =
  "w-full rounded-xl border border-rose-border bg-rose-bg px-4 py-3 text-sm text-rose-text shadow-sm outline-none focus:border-rose-accent focus:ring-2 focus:ring-rose-accent/20";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-rose-bg px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/rose-logo_orange.svg"
            alt="ROSE"
            width={120}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        <section className="rounded-2xl bg-gradient-to-br from-rose-accent to-rose-accent-dark p-6 shadow-lg">
          <p className="text-sm font-medium text-white/80">Welcome back</p>
          <p className="mt-1 text-lg font-semibold text-rose-blush">Sign in to ROSE</p>
        </section>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-rose-muted">
              Username
            </span>
            <input
              type="text"
              autoComplete="username"
              placeholder="Your username"
              className={fieldClassName}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-rose-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              className={fieldClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !username.trim() || !password}
            className="mt-2 rounded-xl bg-rose-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
