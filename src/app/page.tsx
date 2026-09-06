import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RoseApp } from "~/app/_components/rose-app";
import { db } from "~/server/db";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    redirect("/login");
  }

  const member = await db.member.findUnique({ where: { id: sessionId } });

  if (!member) {
    redirect("/login");
  }

  return <RoseApp memberId={member.id} memberName={member.name} />;
}
