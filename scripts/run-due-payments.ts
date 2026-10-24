// scripts/run-due-payments.ts
// Runs the scheduled payments by hand: the same job the daily cron runs
// (src/server/core/schedules.ts). Vercel cron only runs on production, so use
// this to run the job on the local or dev database. Safe to run again: a due
// date is never paid twice.
//
// Refuses DB_TARGET=production; production is paid by the cron.
//
// Usage:
//   npx tsx scripts/run-due-payments.ts                  (local)
//   DB_TARGET=dev npx tsx scripts/run-due-payments.ts    (dev)

import { getDbTarget, createPrismaFor } from "./db-target";
import { runDuePayments } from "../src/server/core/schedules";

const target = getDbTarget();
if (target === "production") {
  console.error("Refusing to run against PRODUCTION. Production's scheduled payments run from the Vercel cron.");
  process.exit(1);
}
console.log(`Running due scheduled payments on the ${target.toUpperCase()} database.`);
const prisma = createPrismaFor(target);

async function main() {
  const result = await runDuePayments(prisma);
  for (const p of result.paid) console.log(`  paid       ${p.interactionId}  due ${p.dueAt.toISOString()}  "${p.comment}"`);
  for (const id of result.completed) console.log(`  completed  ${id}`);
  for (const f of result.failed) console.log(`  FAILED     ${f.interactionId}  due ${f.dueAt.toISOString()}  ${f.reason} (schedule cancelled)`);
  for (const e of result.errors) console.log(`  ERROR      ${e.interactionId}  ${e.message} (left as it was)`);
  console.log(
    `Done: ${result.paid.length} paid, ${result.completed.length} completed, ` +
      `${result.failed.length} failed and cancelled, ${result.errors.length} errors.`,
  );
  if (result.errors.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
