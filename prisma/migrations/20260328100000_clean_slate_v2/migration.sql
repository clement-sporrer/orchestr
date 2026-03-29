-- Clean Slate v2 Migration
-- 2026-03-28
-- Dev environment — no user data to preserve

-- ============================================================
-- Step 1: Backfill companyName from name (before making it required)
-- ============================================================
UPDATE "clients"
  SET "companyName" = UPPER(TRIM("name"))
  WHERE "companyName" IS NULL AND "name" IS NOT NULL;

-- ============================================================
-- Step 2: Convert semicolon-separated strings to arrays
-- ============================================================

-- pastCompanies: String? → String[]
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "pastCompanies_new" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "candidates"
  SET "pastCompanies_new" = ARRAY(
    SELECT TRIM(item)
    FROM UNNEST(STRING_TO_ARRAY("pastCompanies", ';')) AS item
    WHERE TRIM(item) != ''
  )
  WHERE "pastCompanies" IS NOT NULL AND "pastCompanies" != '';

-- hardSkills: String? → String[]
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "hardSkills_new" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "candidates"
  SET "hardSkills_new" = ARRAY(
    SELECT TRIM(item)
    FROM UNNEST(STRING_TO_ARRAY("hardSkills", ';')) AS item
    WHERE TRIM(item) != ''
  )
  WHERE "hardSkills" IS NOT NULL AND "hardSkills" != '';

-- softSkills: String? → String[]
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "softSkills_new" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "candidates"
  SET "softSkills_new" = ARRAY(
    SELECT TRIM(item)
    FROM UNNEST(STRING_TO_ARRAY("softSkills", ';')) AS item
    WHERE TRIM(item) != ''
  )
  WHERE "softSkills" IS NOT NULL AND "softSkills" != '';

-- Drop old string columns, rename new array columns
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "pastCompanies";
ALTER TABLE "candidates" RENAME COLUMN "pastCompanies_new" TO "pastCompanies";

ALTER TABLE "candidates" DROP COLUMN IF EXISTS "hardSkills";
ALTER TABLE "candidates" RENAME COLUMN "hardSkills_new" TO "hardSkills";

ALTER TABLE "candidates" DROP COLUMN IF EXISTS "softSkills";
ALTER TABLE "candidates" RENAME COLUMN "softSkills_new" TO "softSkills";

-- ============================================================
-- Step 3: Add organizationId to tasks (backfill via user)
-- ============================================================
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "tasks" t
  SET "organizationId" = u."organizationId"
  FROM "users" u
  WHERE t."userId" = u."id";

-- Make it required (after backfill)
ALTER TABLE "tasks" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

-- ============================================================
-- Step 4: Create unified documents table
-- ============================================================
DO $$ BEGIN
  CREATE TYPE "DocumentEntity" AS ENUM ('CANDIDATE', 'MISSION', 'CLIENT', 'MISSION_CANDIDATE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentType" AS ENUM ('CV', 'JOB_DESC', 'CONTRACT', 'PROPOSAL', 'REPORT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "documents" (
  "id"             TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "entityType"     "DocumentEntity" NOT NULL,
  "entityId"       TEXT NOT NULL,
  "documentType"   "DocumentType" NOT NULL DEFAULT 'OTHER',
  "fileName"       TEXT NOT NULL,
  "fileUrl"        TEXT NOT NULL,
  "fileType"       TEXT NOT NULL,
  "fileSize"       INTEGER NOT NULL,
  "createdAt"      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "documents_entityType_entityId_idx" ON "documents"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "documents_organizationId_idx" ON "documents"("organizationId");

-- ============================================================
-- Step 5: Migrate existing documents into unified table
-- ============================================================
INSERT INTO "documents" ("id", "organizationId", "entityType", "entityId", "documentType", "fileName", "fileUrl", "fileType", "fileSize", "createdAt")
SELECT
  cd."id",
  c."organizationId",
  'CANDIDATE'::"DocumentEntity",
  cd."candidateId",
  'CV'::"DocumentType",
  cd."fileName",
  cd."fileUrl",
  cd."fileType",
  cd."fileSize",
  cd."createdAt"
FROM "candidate_documents" cd
JOIN "candidates" c ON c."id" = cd."candidateId"
ON CONFLICT DO NOTHING;

INSERT INTO "documents" ("id", "organizationId", "entityType", "entityId", "documentType", "fileName", "fileUrl", "fileType", "fileSize", "createdAt")
SELECT
  md."id",
  m."organizationId",
  'MISSION'::"DocumentEntity",
  md."missionId",
  CASE md."documentType"
    WHEN 'JOB_DESC' THEN 'JOB_DESC'::"DocumentType"
    WHEN 'CONTRACT' THEN 'CONTRACT'::"DocumentType"
    WHEN 'PROPOSAL' THEN 'PROPOSAL'::"DocumentType"
    ELSE 'OTHER'::"DocumentType"
  END,
  md."fileName",
  md."fileUrl",
  md."fileType",
  md."fileSize",
  md."createdAt"
FROM "mission_documents" md
JOIN "missions" m ON m."id" = md."missionId"
ON CONFLICT DO NOTHING;

INSERT INTO "documents" ("id", "organizationId", "entityType", "entityId", "documentType", "fileName", "fileUrl", "fileType", "fileSize", "createdAt")
SELECT
  cld."id",
  c."organizationId",
  'CLIENT'::"DocumentEntity",
  cld."clientId",
  'OTHER'::"DocumentType",
  cld."fileName",
  cld."fileUrl",
  cld."fileType",
  cld."fileSize",
  cld."createdAt"
FROM "client_documents" cld
JOIN "clients" c ON c."id" = cld."clientId"
ON CONFLICT DO NOTHING;

INSERT INTO "documents" ("id", "organizationId", "entityType", "entityId", "documentType", "fileName", "fileUrl", "fileType", "fileSize", "createdAt")
SELECT
  cmd."id",
  m."organizationId",
  'MISSION_CANDIDATE'::"DocumentEntity",
  cmd."missionCandidateId",
  CASE cmd."documentType"
    WHEN 'INTERNAL_REPORT' THEN 'REPORT'::"DocumentType"
    WHEN 'CLIENT_REPORT' THEN 'REPORT'::"DocumentType"
    ELSE 'OTHER'::"DocumentType"
  END,
  cmd."fileName",
  cmd."fileUrl",
  cmd."fileType",
  cmd."fileSize",
  cmd."createdAt"
FROM "candidate_mission_documents" cmd
JOIN "mission_candidates" mc ON mc."id" = cmd."missionCandidateId"
JOIN "missions" m ON m."id" = mc."missionId"
ON CONFLICT DO NOTHING;

-- ============================================================
-- Step 6: Drop old document tables
-- ============================================================
DROP TABLE IF EXISTS "candidate_documents";
DROP TABLE IF EXISTS "mission_documents";
DROP TABLE IF EXISTS "client_documents";
DROP TABLE IF EXISTS "candidate_mission_documents";

-- ============================================================
-- Step 7: Drop removed models (tables no longer in schema)
-- ============================================================
DROP TABLE IF EXISTS "questionnaire_answers";
DROP TABLE IF EXISTS "questionnaire_responses";
DROP TABLE IF EXISTS "questionnaire_questions";
DROP TABLE IF EXISTS "questionnaires";
DROP TABLE IF EXISTS "candidate_positions";
DROP TABLE IF EXISTS "taxonomy_positions";
DROP TABLE IF EXISTS "taxonomy_poles";
DROP TABLE IF EXISTS "candidate_enrichments";
DROP TABLE IF EXISTS "linkedin_cache";
DROP TABLE IF EXISTS "interviews";
DROP TABLE IF EXISTS "report_templates";
DROP TABLE IF EXISTS "message_templates";
DROP TABLE IF EXISTS "events";
DROP TABLE IF EXISTS "csv_imports";

-- Drop enum types for removed tables (use IF EXISTS to be safe)
DROP TYPE IF EXISTS "ReportType";
DROP TYPE IF EXISTS "InterviewType";
DROP TYPE IF EXISTS "InterviewStatus";
DROP TYPE IF EXISTS "TranscriptSource";
DROP TYPE IF EXISTS "QuestionType";
DROP TYPE IF EXISTS "ImportDestination";
DROP TYPE IF EXISTS "ImportStatus";
DROP TYPE IF EXISTS "MessageTemplateType";

-- ============================================================
-- Step 8: Drop legacy columns from remaining tables
-- ============================================================

-- clients: make companyName required, drop legacy name
ALTER TABLE "clients" ALTER COLUMN "companyName" SET NOT NULL;
ALTER TABLE "clients" DROP COLUMN IF EXISTS "name";

-- candidates: drop legacy fields
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "cvUrl";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "location";
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "solicitationHistory";

-- missions: drop alias and compat fields
ALTER TABLE "missions" DROP COLUMN IF EXISTS "jobTitle";
ALTER TABLE "missions" DROP COLUMN IF EXISTS "seniorityLabel";
ALTER TABLE "missions" DROP COLUMN IF EXISTS "recruitmentProcess";
ALTER TABLE "missions" DROP COLUMN IF EXISTS "calendlyLink";
ALTER TABLE "missions" DROP COLUMN IF EXISTS "calendlyEmbed";
ALTER TABLE "missions" DROP COLUMN IF EXISTS "scoreThreshold";

-- mission_candidates: drop scoring compat fields
ALTER TABLE "mission_candidates" DROP COLUMN IF EXISTS "score";
ALTER TABLE "mission_candidates" DROP COLUMN IF EXISTS "scoreReasons";

-- interactions: drop calendly fields
ALTER TABLE "interactions" DROP COLUMN IF EXISTS "calendlyEventId";
ALTER TABLE "interactions" DROP COLUMN IF EXISTS "calendlyEventUrl";

-- users: drop all linkedin OAuth fields
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinConnected";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinAccessToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinRefreshToken";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinExpiresAt";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinCookies";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinLastUsed";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinRequestCount";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinLastReset";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinRiskLevel";
ALTER TABLE "users" DROP COLUMN IF EXISTS "linkedinBlockedUntil";

-- ============================================================
-- Step 9: Drop old single-column indexes now replaced by composites
-- ============================================================
DROP INDEX IF EXISTS "candidates_organizationId_idx";
DROP INDEX IF EXISTS "candidates_email_idx";
DROP INDEX IF EXISTS "candidates_phone_idx";
DROP INDEX IF EXISTS "candidates_status_idx";
DROP INDEX IF EXISTS "candidates_relationshipLevel_idx";
DROP INDEX IF EXISTS "candidates_domain_idx";
DROP INDEX IF EXISTS "candidates_sector_idx";
DROP INDEX IF EXISTS "candidates_recruitable_idx";
DROP INDEX IF EXISTS "candidates_linkedin_idx";
DROP INDEX IF EXISTS "candidates_lastName_firstName_idx";
DROP INDEX IF EXISTS "candidates_currentCompany_idx";
DROP INDEX IF EXISTS "candidates_currentPosition_idx";
DROP INDEX IF EXISTS "candidates_seniority_idx";
DROP INDEX IF EXISTS "missions_organizationId_idx";
DROP INDEX IF EXISTS "missions_clientId_idx";
DROP INDEX IF EXISTS "missions_recruiterId_idx";
DROP INDEX IF EXISTS "missions_status_idx";
DROP INDEX IF EXISTS "missions_mainContactId_idx";
DROP INDEX IF EXISTS "missions_jobTitle_idx";
DROP INDEX IF EXISTS "mission_candidates_missionId_idx";
DROP INDEX IF EXISTS "mission_candidates_candidateId_idx";
DROP INDEX IF EXISTS "mission_candidates_stage_idx";
DROP INDEX IF EXISTS "mission_candidates_missionId_stage_idx";
DROP INDEX IF EXISTS "mission_candidates_portalToken_idx";
DROP INDEX IF EXISTS "users_organizationId_idx";
DROP INDEX IF EXISTS "users_linkedinConnected_idx";
DROP INDEX IF EXISTS "users_linkedinRiskLevel_idx";
DROP INDEX IF EXISTS "clients_organizationId_idx";
DROP INDEX IF EXISTS "clients_companyName_idx";
DROP INDEX IF EXISTS "contacts_clientId_idx";
DROP INDEX IF EXISTS "contacts_email_idx";
DROP INDEX IF EXISTS "interactions_organizationId_idx";
DROP INDEX IF EXISTS "interactions_candidateId_idx";
DROP INDEX IF EXISTS "interactions_missionCandidateId_idx";
DROP INDEX IF EXISTS "interactions_userId_idx";
DROP INDEX IF EXISTS "interactions_type_idx";
DROP INDEX IF EXISTS "tasks_userId_idx";
DROP INDEX IF EXISTS "tasks_dueDate_idx";
DROP INDEX IF EXISTS "tasks_completedAt_idx";
DROP INDEX IF EXISTS "tasks_missionCandidateId_idx";
DROP INDEX IF EXISTS "pools_organizationId_idx";
DROP INDEX IF EXISTS "candidate_pools_candidateId_idx";
DROP INDEX IF EXISTS "candidate_pools_poolId_idx";
DROP INDEX IF EXISTS "shortlists_accessToken_idx";
DROP INDEX IF EXISTS "shortlist_candidates_shortlistId_idx";
DROP INDEX IF EXISTS "shortlist_candidates_missionCandidateId_idx";
DROP INDEX IF EXISTS "subscriptions_stripeCustomerId_idx";
DROP INDEX IF EXISTS "subscriptions_status_idx";
