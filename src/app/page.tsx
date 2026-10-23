import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RoseApp } from "~/app/_components/rose-app";
import { db } from "~/server/db";
import { SESSION_COOKIE, verifySession } from "~/server/session";

export default async function Home() {
  const cookieStore = await cookies();
  // null if the cookie is missing, unsigned or tampered with.
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!sessionId) {
    redirect("/login");
  }

  const member = await db.node.findUnique({ where: { id: sessionId } });

  if (member?.kind !== "INDIVIDUAL") {
    redirect("/login");
  }

  return <RoseApp />;
}
