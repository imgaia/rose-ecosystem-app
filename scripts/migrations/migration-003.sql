-- Migration 003: firstName / lastName / username
-- Additive only. The old `name` column is deliberately left in place,
-- unused — removing it isn't necessary and avoids any destructive
-- operation against live data.

ALTER TABLE "Member" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Member" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "Member_username_key" ON "Member"("username");