// scripts/fetch-rates.ts
// Runs the fiat rate feed by hand: the same job the daily cron runs
// (src/server/core/rateFeed.ts). Writes a FEED row only for a rate that has
// changed; if the feed can't be reached, nothing is written.
//
// Refuses DB_TARGET=production for now.
//
// Usage:
//   npx tsx scripts/fetch-rates.ts                  (local)
//   DB_TARGET=dev npx tsx scripts/fetch-rates.ts    (dev)

import { getDbTarget, createPrismaFor } from "./db-target";
import { runRateFeed } from "../src/server/core/rateFeed";

const target = getDbTarget();
if (target === "production") {
  console.error("Refusing to run against PRODUCTION for now.");
  process.exit(1);
}
console.log(`Fetching fiat rates into the ${target.toUpperCase()} database.`);
const prisma = createPrismaFor(target);

async function main() {
  const result = await runRateFeed(prisma);
  for (const w of result.written) console.log(`  new rate   1 ${w.from} = ${w.rate} ${w.to}`);
  for (const code of result.unchanged) console.log(`  unchanged  ${code}`);
  for (const code of result.missing) console.log(`  MISSING    ${code} (last rate kept)`);
  if (result.error) console.log(`  FAILED     ${result.error} (last rates kept)`);
  console.log(`Done: ${result.written.length} written, ${result.unchanged.length} unchanged.`);
  if (result.error) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
