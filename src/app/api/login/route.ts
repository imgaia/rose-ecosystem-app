import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { db } from "~/server/db";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; password?: string };
  const name = body.name?.trim();
  const password = body.password;

  if (!name || !password) {
    return NextResponse.json(
      { error: "Name and password are required." },
      { status: 400 },
    );
  }

  const members = await db.member.findMany();
  const member = members.find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );

  if (!member?.passwordHash || !bcrypt.compareSync(password, member.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid name or password." },
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
