-- Step 11a-2: money amounts and balances as 64-bit whole numbers, for a
-- database already on v11-free-currencies.sql.
-- SQLite stores INTEGER and BIGINT alike, but Prisma (and the libSQL adapter
-- used on Turso) reads a column declared INTEGER as 32-bit, so anything above
-- 2,147,483,647 minor units fails to load. SQLite can't change a column's
-- declared type, and these SQL steps avoid rebuilding the tables: each column
-- is replaced in place by a BIGINT copy, under the same name. Every value is
-- copied unchanged; indexes, foreign keys and other columns are untouched.
-- The new NOT NULL columns get DEFAULT 0, which SQLite needs to add them; the
-- app always writes the amount itself.

-- Account.balance
ALTER TABLE "Account" ADD COLUMN "balance_64" BIGINT NOT NULL DEFAULT 0;
UPDATE "Account" SET "balance_64" = "balance";
ALTER TABLE "Account" DROP COLUMN "balance";
ALTER TABLE "Account" RENAME COLUMN "balance_64" TO "balance";

-- Transaction.amount and toAmount
ALTER TABLE "Transaction" ADD COLUMN "amount_64" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Transaction" ADD COLUMN "toAmount_64" BIGINT;
UPDATE "Transaction" SET "amount_64" = "amount", "toAmount_64" = "toAmount";
ALTER TABLE "Transaction" DROP COLUMN "amount";
ALTER TABLE "Transaction" DROP COLUMN "toAmount";
ALTER TABLE "Transaction" RENAME COLUMN "amount_64" TO "amount";
ALTER TABLE "Transaction" RENAME COLUMN "toAmount_64" TO "toAmount";

-- InteractionTerms.amount and counterAmount
ALTER TABLE "InteractionTerms" ADD COLUMN "amount_64" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "InteractionTerms" ADD COLUMN "counterAmount_64" BIGINT;
UPDATE "InteractionTerms" SET "amount_64" = "amount", "counterAmount_64" = "counterAmount";
ALTER TABLE "InteractionTerms" DROP COLUMN "amount";
ALTER TABLE "InteractionTerms" DROP COLUMN "counterAmount";
ALTER TABLE "InteractionTerms" RENAME COLUMN "amount_64" TO "amount";
ALTER TABLE "InteractionTerms" RENAME COLUMN "counterAmount_64" TO "counterAmount";
