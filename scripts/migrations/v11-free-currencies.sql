-- Step 11a: free and fiat-backed currencies, and trading (PRD 2.8), for a
-- database already on step 10 (after v10-currencies.sql and v10-reserves.sql).
-- Only adds columns. Nothing is dropped, copied or rewritten.
-- Prisma's own diff rebuilds Currency and InteractionTerms; SQLite allows a
-- REFERENCES clause on ADD COLUMN when the column defaults to NULL, so these
-- ALTERs give the same result without rebuilding.
-- Afterwards run scripts/migrate-v11.ts to sort existing currencies into free
-- and fiat-backed.

-- Currency: free (the default, R-FIN-17) or fiat-backed (R-FIN-01).
ALTER TABLE "Currency" ADD COLUMN "backing" TEXT NOT NULL DEFAULT 'FREE';

-- InteractionTerms: for a trade, what the other side gives back.
ALTER TABLE "InteractionTerms" ADD COLUMN "counterAmount" INTEGER;
ALTER TABLE "InteractionTerms" ADD COLUMN "counterCurrencyId" TEXT REFERENCES "Currency" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- InteractionKind gains TRADE, RateSource gains TRADE and INITIAL: enums are
-- plain text in SQLite, so no SQL is needed.
