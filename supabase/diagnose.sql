-- ORCHESTR — Supabase RLS Diagnostic
-- Run this in Supabase SQL Editor to verify RLS state
-- Expected: all tables have RLS enabled + at least one policy each

-- 1. Tables with RLS disabled (should return 0 rows)
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT IN ('schema_migrations', '_prisma_migrations')
ORDER BY tablename;

-- 2. Tables with RLS enabled but NO policies (will return 0 rows for any user = silent bug)
SELECT t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = t.tablename
  )
ORDER BY t.tablename;

-- 3. Full RLS status overview
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE '_prisma%'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- 4. Columns still present from Phase 4 legacy cleanup (should return 0 rows after running the migration)
SELECT column_name, table_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'candidates' AND column_name IN ('notes', 'profileUrl', 'estimatedSector', 'estimatedSeniority'))
    OR
    (table_name = 'contacts' AND column_name IN ('name', 'role'))
  )
ORDER BY table_name, column_name;

-- 5. Client display / mission integrity (Clean Slate — companyName required in app)
--    Rows here explain "mission exists but client name missing" in UI
SELECT id, "organizationId", TRIM(COALESCE("companyName", '')) AS trimmed_name
FROM public.clients
WHERE TRIM(COALESCE("companyName", '')) = '';

-- Missions whose client row is missing (should be 0 if FKs enforced)
SELECT m.id AS mission_id, m."clientId"
FROM public.missions m
LEFT JOIN public.clients c ON c.id = m."clientId"
WHERE c.id IS NULL;
