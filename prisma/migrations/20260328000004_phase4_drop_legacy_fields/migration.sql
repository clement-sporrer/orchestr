-- Phase 4: Drop legacy Candidate + Contact columns
-- Run AFTER deploying the code changes from the refactor/phase4-legacy-field-cleanup branch.
-- Deploy first, then run this in Supabase SQL Editor.

-- ============================================================
-- Step 1: Backfill residual data before dropping
-- ============================================================

-- notes → comments (copy where comments is still empty)
UPDATE "candidates"
  SET "comments" = "notes"
  WHERE "notes" IS NOT NULL AND ("comments" IS NULL OR "comments" = '');

-- profileUrl → linkedin (copy where linkedin is still empty)
UPDATE "candidates"
  SET "linkedin" = "profileUrl"
  WHERE "profileUrl" IS NOT NULL AND ("linkedin" IS NULL OR "linkedin" = '');

-- estimatedSector → sector (copy where sector is still empty)
UPDATE "candidates"
  SET "sector" = "estimatedSector"
  WHERE "estimatedSector" IS NOT NULL AND ("sector" IS NULL OR "sector" = '');

-- contacts: backfill firstName/lastName from name where missing
-- CASE handles single-word names (POSITION returns 0 when no space found)
UPDATE "contacts"
  SET
    "firstName" = SPLIT_PART("name", ' ', 1),
    "lastName" = CASE
      WHEN POSITION(' ' IN "name") > 0
      THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
      ELSE "name"
    END
  WHERE "name" IS NOT NULL
    AND ("firstName" IS NULL OR "lastName" IS NULL);

-- ============================================================
-- Step 2: Drop legacy Candidate columns
-- ============================================================

ALTER TABLE "candidates" DROP COLUMN IF EXISTS "notes";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "profileUrl";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "estimatedSector";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "estimatedSeniority";

-- ============================================================
-- Step 3: Drop legacy Contact columns
-- ============================================================

ALTER TABLE "contacts" DROP COLUMN IF EXISTS "name";
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "role";

-- ============================================================
-- Verification (uncomment and run to confirm)
-- ============================================================

-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'candidates'
--   AND column_name IN ('notes', 'profileUrl', 'estimatedSector', 'estimatedSeniority');
-- → should return 0 rows

-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'contacts'
--   AND column_name IN ('name', 'role');
-- → should return 0 rows
