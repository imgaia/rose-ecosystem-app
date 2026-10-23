-- Two optional columns added to the v0.8 model after the step 5 review.
-- Only for a database already built from an older v08-schema.sql
-- (the current v08-schema.sql includes them).
ALTER TABLE "Invitation" ADD COLUMN "message" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "effectiveDate" DATETIME;
