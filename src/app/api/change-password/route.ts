import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const memberId = cookieStore.get("session")?.value;

  if (!memberId) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  const currentPassword = body.currentPassword;
  const newPassword = body.newPassword;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 },
    );
  }

  const member = await db.member.findUnique({ where: { id: memberId } });

  if (
    !member?.passwordHash ||
    !bcrypt.compareSync(currentPassword, member.passwordHash)
  ) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  const newPasswordHash = bcrypt.hashSync(newPassword, 10);
  await db.member.update({
    where: { id: memberId },
    data: { passwordHash: newPasswordHash },
  });

  return NextResponse.json({ success: true });
}