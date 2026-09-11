import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required." },
      { status: 400 },
    );
  }

  const members = await db.member.findMany();
  const member = members.find(
    (m) => m.username.toLowerCase() === username.toLowerCase(),
  );

  if (!member?.passwordHash || !bcrypt.compareSync(password, member.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", member.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}