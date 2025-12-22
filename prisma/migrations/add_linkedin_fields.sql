-- Migration pour ajouter les champs LinkedIn sans toucher au reste
-- Cette migration est sûre et n'affecte pas les données existantes

-- Ajouter les champs LinkedIn à la table users
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "linkedinConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "linkedinAccessToken" TEXT,
ADD COLUMN IF NOT EXISTS "linkedinRefreshToken" TEXT,
ADD COLUMN IF NOT EXISTS "linkedinExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "linkedinCookies" JSONB,
ADD COLUMN IF NOT EXISTS "linkedinLastUsed" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "linkedinRequestCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "linkedinLastReset" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "linkedinRiskLevel" TEXT,
ADD COLUMN IF NOT EXISTS "linkedinBlockedUntil" TIMESTAMP(3);

-- Créer les index pour les nouveaux champs
CREATE INDEX IF NOT EXISTS "users_linkedinConnected_idx" ON "users"("linkedinConnected");
CREATE INDEX IF NOT EXISTS "users_linkedinRiskLevel_idx" ON "users"("linkedinRiskLevel");

-- Créer la table de cache LinkedIn
CREATE TABLE IF NOT EXISTS "linkedin_cache" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_cache_pkey" PRIMARY KEY ("id")
);

-- Créer les index pour la table de cache
CREATE UNIQUE INDEX IF NOT EXISTS "linkedin_cache_linkedinUrl_key" ON "linkedin_cache"("linkedinUrl");
CREATE INDEX IF NOT EXISTS "linkedin_cache_linkedinUrl_idx" ON "linkedin_cache"("linkedinUrl");
CREATE INDEX IF NOT EXISTS "linkedin_cache_expiresAt_idx" ON "linkedin_cache"("expiresAt");

