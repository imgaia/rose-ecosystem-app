-- Step 10a: node currencies (PRD 2.8), for a database already on the v0.8 model.
-- Only adds: two new tables and new columns. Nothing is dropped, copied or rewritten.
-- Prisma's own diff rebuilds Node and Currency to add the foreign keys; SQLite
-- allows a REFERENCES clause on ADD COLUMN when the column defaults to NULL,
-- so these ALTERs give the same result without rebuilding.
-- Afterwards run scripts/backfill-v10.ts to fill the new columns.

-- Node: its country and home currency (R-FIN-04, R-FIN-13).
ALTER TABLE "Node" ADD COLUMN "country" TEXT;
ALTER TABLE "Node" ADD COLUMN "homeCurrencyId" TEXT REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Currency: description, status (R-FIN-12), reserve fiat, and country for fiat.
ALTER TABLE "Currency" ADD COLUMN "description" TEXT;
ALTER TABLE "Currency" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Currency" ADD COLUMN "reserveCurrencyId" TEXT REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Currency" ADD COLUMN "country" TEXT;

-- A currency's own rule values (R-FIN-01 reserve ratio, R-FIN-10 conversion policy).
CREATE TABLE "CurrencyRuleValue" (
    "currencyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("currencyId", "ruleId"),
    CONSTRAINT "CurrencyRuleValue_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Every exchange rate with its history (R-FIN-05, R-FIN-15).
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromCurrencyId" TEXT NOT NULL,
    "toCurrencyId" TEXT NOT NULL,
    "rate" TEXT NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME,
    "source" TEXT NOT NULL,
    "setBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExchangeRate_fromCurrencyId_fkey" FOREIGN KEY ("fromCurrencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExchangeRate_toCurrencyId_fkey" FOREIGN KEY ("toCurrencyId") REFERENCES "Currency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "ExchangeRate_fromCurrencyId_toCurrencyId_validFrom_idx" ON "ExchangeRate"("fromCurrencyId", "toCurrencyId", "validFrom");

-- ProposalKind gains CURRENCY_CHANGE: enums are plain text in SQLite, so no SQL is needed.
