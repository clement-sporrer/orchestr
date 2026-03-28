-- Drop the existing standard unique constraint (allows NULL != NULL duplicates issue)
ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_organizationId_email_key";

-- Drop any index Prisma might have created with a different name
DROP INDEX IF EXISTS "candidates_organizationId_email_key";
DROP INDEX IF EXISTS "candidates_organizationId_email_idx";

-- Create a partial unique index that excludes NULL emails.
-- Two candidates with email=NULL in the same org are allowed (common for incomplete imports).
-- Two candidates with the same non-null email in the same org are still rejected.
CREATE UNIQUE INDEX IF NOT EXISTS "candidates_org_email_unique"
  ON "candidates" ("organizationId", "email")
  WHERE "email" IS NOT NULL;
