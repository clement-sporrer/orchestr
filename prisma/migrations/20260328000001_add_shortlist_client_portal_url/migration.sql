-- Add clientPortalUrl to shortlists table.
-- Stores the full client portal URL at shortlist creation time.
-- Raw access token is discarded after hashing — this URL is the only way
-- to reconstruct the link for the recruiter UI.
ALTER TABLE "shortlists" ADD COLUMN IF NOT EXISTS "clientPortalUrl" TEXT;
