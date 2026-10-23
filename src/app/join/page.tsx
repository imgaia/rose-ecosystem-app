// src/app/join/page.tsx
// The page an invitation link opens: /join?token=... (PRD S01, UC-INV-02).
// No sign-in needed; the token in the link is what lets the person in.
// The form itself is in join-form.tsx.

import { JoinForm } from "./join-form";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <JoinForm token={token ?? ""} />;
}
