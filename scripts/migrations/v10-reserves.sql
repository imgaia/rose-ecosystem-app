-- Step 10a follow-up: one reserve per currency. Apply after v10-currencies.sql.
-- Adds a column and swaps the Account unique index for one that includes it.
-- No table is rebuilt and no row is changed: scripts/backfill-v10.ts then marks
-- which currency each existing reserve backs.

-- For a reserve, the currency it backs; "" for every other account.
ALTER TABLE "Account" ADD COLUMN "backsCurrencyId" TEXT NOT NULL DEFAULT '';

-- One account per node, currency and kind, and now per backed currency too.
DROP INDEX "Account_nodeId_currencyId_isReserve_key";
CREATE UNIQUE INDEX "Account_nodeId_currencyId_isReserve_backsCurrencyId_key" ON "Account"("nodeId", "currencyId", "isReserve", "backsCurrencyId");
