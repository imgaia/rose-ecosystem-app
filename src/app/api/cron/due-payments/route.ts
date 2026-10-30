// src/app/api/cron/due-payments/route.ts
// The daily jobs: the scheduled payments (src/server/core/schedules.ts), then
// the fiat rate feed (src/server/core/rateFeed.ts). Vercel cron calls it once
// a day (vercel.json) with "Authorization: Bearer <CRON_SECRET>"; any request
// without exactly that header is refused, and so is every request while
// CRON_SECRET is not set.

import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { env } from "~/env";
import { runDuePayments, runRateFeed } from "~/server/core";
import { db } from "~/server/db";

export async function GET(request: Request) {
  if (!authorised(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const result = await runDuePayments(db);
  const summary = {
    paid: result.paid.length,
    completed: result.completed.length,
    failed: result.failed.length,
    errors: result.errors,
  };
  console.log("Scheduled payments:", JSON.stringify(summary));

  // A failed feed keeps yesterday's rates (rateFeed.ts logs it); it doesn't fail the payments.
  const feed = await runRateFeed(db).catch((err: Error) => ({ error: err.message, written: [], unchanged: [], missing: [] }));
  const rates = { written: feed.written.length, unchanged: feed.unchanged.length, missing: feed.missing, error: feed.error };
  console.log("Rate feed:", JSON.stringify(rates));

  // An unexpected payment error shows as a failed cron run in Vercel; those interactions are tried again tomorrow.
  return NextResponse.json({ ...summary, rates }, { status: result.errors.length > 0 ? 500 : 200 });
}

function authorised(header: string | null, secret: string | undefined) {
  if (!secret || !header) return false;
  // Compare fixed-length hashes, so the comparison takes the same time whatever was sent.
  const given = createHash("sha256").update(header).digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(given, expected);
}
