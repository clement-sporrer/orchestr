-- ============================================================================
-- Migration: Mission.priority String → MissionPriority enum
--            Task.missionCandidateId → proper FK with ON DELETE SET NULL
-- ============================================================================

-- Step 1: Add Task FK constraint (missionCandidateId already exists as plain column)
ALTER TABLE "tasks"
  ADD CONSTRAINT "tasks_missionCandidateId_fkey"
  FOREIGN KEY ("missionCandidateId") REFERENCES "mission_candidates"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 2: Create MissionPriority enum
CREATE TYPE "MissionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- Step 3: Convert Mission.priority from nullable String to enum
ALTER TABLE "missions"
  ALTER COLUMN "priority" DROP DEFAULT;

UPDATE "missions"
  SET "priority" = UPPER("priority")
  WHERE "priority" IS NOT NULL
    AND UPPER("priority") IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

UPDATE "missions"
  SET "priority" = 'MEDIUM'
  WHERE "priority" IS NULL
    OR UPPER("priority") NOT IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

ALTER TABLE "missions"
  ALTER COLUMN "priority" TYPE "MissionPriority"
  USING "priority"::"MissionPriority";

ALTER TABLE "missions"
  ALTER COLUMN "priority" SET DEFAULT 'MEDIUM'::"MissionPriority";

ALTER TABLE "missions"
  ALTER COLUMN "priority" SET NOT NULL;

-- Step 4: Add index on tasks.missionCandidateId (declared in schema @@index)
CREATE INDEX IF NOT EXISTS "tasks_missionCandidateId_idx" ON "tasks" ("missionCandidateId");
