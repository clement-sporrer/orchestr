-- Remove ExternalAccessToken table and related enum (dead code — never used)
DROP TABLE IF EXISTS "external_access_tokens";
DROP TYPE IF EXISTS "ExternalTokenType";
