// scripts/set-rate.ts
// Sets a fiat-to-fiat rate by hand (source MANUAL), for when the feed is
// down. The current rate for the pair is closed and the new one starts now
// (or at the time given); nothing is changed or deleted (R-FIN-15).
// Node currency prices are not set here: they follow their reserve ratio.
//
// Refuses DB_TARGET=production for now.
//
// Usage:
//   npx tsx scripts/set-rate.ts CHF EUR 1.0712                         (local)
//   DB_TARGET=dev npx tsx scripts/set-rate.ts CHF EUR 1.0712           (dev)
//   npx tsx scripts/set-rate.ts CHF EUR 1.0712 2026-10-30T06:00:00Z    (valid from a given time)

import { getDbTarget, createPrismaFor } from "./db-target";
import { getRate, setRate } from "../src/server/core/rates";

const target = getDbTarget();
if (target === "production") {
  console.error("Refusing to run against PRODUCTION for now.");
  process.exit(1);
}
const [fromCode, toCode, rate, validFromText] = process.argv.slice(2);
if (!fromCode || !toCode || !rate) {
  console.error("Usage: npx tsx scripts/set-rate.ts FROM TO RATE [VALID_FROM]   e.g. CHF EUR 1.0712");
  process.exit(1);
}
const prisma = createPrismaFor(target);

async function main() {
  const fiat = async (code: string) => {
    const found = await prisma.currency.findFirst({ where: { code: code.toUpperCase(), kind: "FIAT" } });
    if (!found) throw new Error(`${code} is not on the fiat list`);
    return found;
  };
  const [from, to] = [await fiat(fromCode!), await fiat(toCode!)];
  const validFrom = validFromText ? new Date(validFromText) : new Date();
  if (Number.isNaN(validFrom.getTime())) throw new Error(`"${validFromText}" is not a date`);

  const before = await getRate(prisma, from.id, to.id).catch(() => null);
  await setRate(prisma, { fromCurrencyId: from.id, toCurrencyId: to.id, rate: rate!, validFrom, source: "MANUAL", setBy: "script:set-rate" });
  console.log(`${target.toUpperCase()}: 1 ${from.code} = ${rate} ${to.code} from ${validFrom.toISOString()} (was ${before?.text ?? "none"}).`);
}

main()
  .catch((err) => {
    console.error((err as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
