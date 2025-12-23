-- ORCHESTR Database Migration
-- Adds taxonomy tables, relationship level, external access tokens, and auth user linking
-- Migration: add_taxonomy_relationship_tokens

-- CreateEnum: RelationshipLevel for tracking global candidate relationship maturity
CREATE TYPE "RelationshipLevel" AS ENUM ('SOURCED', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'SHORTLISTED', 'PLACED');

-- CreateEnum: ExternalTokenType for portal access tokens
CREATE TYPE "ExternalTokenType" AS ENUM ('CANDIDATE_PORTAL', 'CLIENT_PORTAL');

-- AlterTable: Add auth_user_id to users for Supabase Auth linking (used by RLS)
ALTER TABLE "users" ADD COLUMN "auth_user_id" UUID;

-- CreateIndex: Unique constraint on auth_user_id
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- AlterTable: Add relationshipLevel to candidates
ALTER TABLE "candidates" ADD COLUMN "relationshipLevel" "RelationshipLevel" NOT NULL DEFAULT 'SOURCED';

-- CreateIndex: Index on relationshipLevel for filtering
CREATE INDEX "candidates_relationshipLevel_idx" ON "candidates"("relationshipLevel");

-- AlterTable: Add organizationId to interactions for RLS
-- Step 1: Add column as nullable
ALTER TABLE "interactions" ADD COLUMN "organizationId" TEXT;

-- Step 2: Populate from related candidate's organizationId
UPDATE "interactions" i
SET "organizationId" = c."organizationId"
FROM "candidates" c
WHERE i."candidateId" = c."id";

-- Step 3: Make NOT NULL (will fail if orphan interactions exist)
ALTER TABLE "interactions" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateIndex: Index on organizationId for RLS performance
CREATE INDEX "interactions_organizationId_idx" ON "interactions"("organizationId");

-- CreateTable: TaxonomyPole (organization-specific job function categories)
CREATE TABLE "taxonomy_poles" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_poles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for taxonomy_poles
CREATE INDEX "taxonomy_poles_organizationId_idx" ON "taxonomy_poles"("organizationId");
CREATE UNIQUE INDEX "taxonomy_poles_organizationId_name_key" ON "taxonomy_poles"("organizationId", "name");

-- AddForeignKey: taxonomy_poles to organizations
ALTER TABLE "taxonomy_poles" ADD CONSTRAINT "taxonomy_poles_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: TaxonomyPosition (positions within poles)
CREATE TABLE "taxonomy_positions" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "poleId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxonomy_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for taxonomy_positions
CREATE INDEX "taxonomy_positions_organizationId_idx" ON "taxonomy_positions"("organizationId");
CREATE INDEX "taxonomy_positions_poleId_idx" ON "taxonomy_positions"("poleId");
CREATE UNIQUE INDEX "taxonomy_positions_organizationId_name_key" ON "taxonomy_positions"("organizationId", "name");

-- AddForeignKey: taxonomy_positions to organizations and poles
ALTER TABLE "taxonomy_positions" ADD CONSTRAINT "taxonomy_positions_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "taxonomy_positions" ADD CONSTRAINT "taxonomy_positions_poleId_fkey" 
    FOREIGN KEY ("poleId") REFERENCES "taxonomy_poles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CandidatePosition (join table for multi-position support)
CREATE TABLE "candidate_positions" (
    "id" UUID NOT NULL,
    "candidateId" TEXT NOT NULL,
    "positionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for candidate_positions
CREATE INDEX "candidate_positions_candidateId_idx" ON "candidate_positions"("candidateId");
CREATE INDEX "candidate_positions_positionId_idx" ON "candidate_positions"("positionId");
CREATE UNIQUE INDEX "candidate_positions_candidateId_positionId_key" ON "candidate_positions"("candidateId", "positionId");

-- AddForeignKey: candidate_positions to candidates and positions
ALTER TABLE "candidate_positions" ADD CONSTRAINT "candidate_positions_candidateId_fkey" 
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_positions" ADD CONSTRAINT "candidate_positions_positionId_fkey" 
    FOREIGN KEY ("positionId") REFERENCES "taxonomy_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ExternalAccessToken (hashed tokens for portal access)
CREATE TABLE "external_access_tokens" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tokenType" "ExternalTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "missionId" TEXT,
    "missionCandidateId" TEXT,
    "candidateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Indexes for external_access_tokens
CREATE UNIQUE INDEX "external_access_tokens_tokenHash_key" ON "external_access_tokens"("tokenHash");
CREATE INDEX "external_access_tokens_organizationId_idx" ON "external_access_tokens"("organizationId");
CREATE INDEX "external_access_tokens_expiresAt_idx" ON "external_access_tokens"("expiresAt");
CREATE INDEX "external_access_tokens_missionId_idx" ON "external_access_tokens"("missionId");
CREATE INDEX "external_access_tokens_missionCandidateId_idx" ON "external_access_tokens"("missionCandidateId");
CREATE INDEX "external_access_tokens_candidateId_idx" ON "external_access_tokens"("candidateId");

-- AddForeignKey: external_access_tokens to organizations, missions, mission_candidates, candidates
ALTER TABLE "external_access_tokens" ADD CONSTRAINT "external_access_tokens_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_access_tokens" ADD CONSTRAINT "external_access_tokens_missionId_fkey" 
    FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_access_tokens" ADD CONSTRAINT "external_access_tokens_missionCandidateId_fkey" 
    FOREIGN KEY ("missionCandidateId") REFERENCES "mission_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "external_access_tokens" ADD CONSTRAINT "external_access_tokens_candidateId_fkey" 
    FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: Unique constraint on pool name within organization
CREATE UNIQUE INDEX "pools_organizationId_name_key" ON "pools"("organizationId", "name");

