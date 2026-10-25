-- Step 8: drops the Phase 1 tables before v08-schema.sql creates the v0.8 ones.
-- Take a backup first; scripts/migrate-v08.ts reads the old data from it, and
-- scripts/restore.ts can put the old schema back from it.
-- Children before parents, so no foreign key is ever left pointing nowhere.
-- One transaction: all eight go, or none do. Their indexes go with them.
BEGIN;
DROP TABLE "Evaluation";
DROP TABLE "MemberRole";
DROP TABLE "PasswordResetToken";
DROP TABLE "RelationshipStrength";
DROP TABLE "Reward";
DROP TABLE "Transaction";
DROP TABLE "Wallet";
DROP TABLE "Member";
COMMIT;
