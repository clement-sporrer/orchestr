-- ORCHESTR Row Level Security (RLS) Policies
-- Clean Slate v2 — 2026-03-28
-- 17 tables, all protected

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "organizationId"
  FROM public.users
  WHERE "auth_user_id" = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_clients ON public.clients;
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_contacts ON public.contacts;
CREATE TRIGGER set_updated_at_contacts
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_missions ON public.missions;
CREATE TRIGGER set_updated_at_missions
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_candidates ON public.candidates;
CREATE TRIGGER set_updated_at_candidates
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_mission_candidates ON public.mission_candidates;
CREATE TRIGGER set_updated_at_mission_candidates
  BEFORE UPDATE ON public.mission_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pools ON public.pools;
CREATE TRIGGER set_updated_at_pools
  BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_interactions ON public.interactions;
CREATE TRIGGER set_updated_at_interactions
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_shortlists ON public.shortlists;
CREATE TRIGGER set_updated_at_shortlists
  BEFORE UPDATE ON public.shortlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_organization_settings ON public.organization_settings;
CREATE TRIGGER set_updated_at_organization_settings
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS — DIRECT ORG TABLES
-- (have organizationId column → use current_org_id() directly)
-- ============================================================

-- organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_org_isolation" ON public.organizations;
CREATE POLICY "organizations_org_isolation" ON public.organizations
  USING (id = current_org_id());

-- organization_settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organization_settings_org_isolation" ON public.organization_settings;
CREATE POLICY "organization_settings_org_isolation" ON public.organization_settings
  USING ("organizationId" = current_org_id());

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_org_isolation" ON public.subscriptions;
CREATE POLICY "subscriptions_org_isolation" ON public.subscriptions
  USING ("organizationId" = current_org_id());

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_org_isolation" ON public.users;
CREATE POLICY "users_org_isolation" ON public.users
  USING ("organizationId" = current_org_id());

-- clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clients_org_isolation" ON public.clients;
CREATE POLICY "clients_org_isolation" ON public.clients
  USING ("organizationId" = current_org_id());

-- missions
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "missions_org_isolation" ON public.missions;
CREATE POLICY "missions_org_isolation" ON public.missions
  USING ("organizationId" = current_org_id());

-- candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidates_org_isolation" ON public.candidates;
CREATE POLICY "candidates_org_isolation" ON public.candidates
  USING ("organizationId" = current_org_id());

-- pools
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pools_org_isolation" ON public.pools;
CREATE POLICY "pools_org_isolation" ON public.pools
  USING ("organizationId" = current_org_id());

-- interactions
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "interactions_org_isolation" ON public.interactions;
CREATE POLICY "interactions_org_isolation" ON public.interactions
  USING ("organizationId" = current_org_id());

-- tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_org_isolation" ON public.tasks;
CREATE POLICY "tasks_org_isolation" ON public.tasks
  USING ("organizationId" = current_org_id());

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_org_isolation" ON public.documents;
CREATE POLICY "documents_org_isolation" ON public.documents
  USING ("organizationId" = current_org_id());

-- ============================================================
-- RLS — INDIRECT TABLES
-- (no organizationId — reached via FK join)
-- ============================================================

-- contacts (via clients)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contacts_org_isolation" ON public.contacts;
CREATE POLICY "contacts_org_isolation" ON public.contacts
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = "clientId"
        AND c."organizationId" = current_org_id()
    )
  );

-- mission_candidates (via missions)
ALTER TABLE public.mission_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mission_candidates_org_isolation" ON public.mission_candidates;
CREATE POLICY "mission_candidates_org_isolation" ON public.mission_candidates
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = "missionId"
        AND m."organizationId" = current_org_id()
    )
  );

-- Candidate portal: allow SELECT via portalToken
DROP POLICY IF EXISTS "mission_candidates_portal_access" ON public.mission_candidates;
CREATE POLICY "mission_candidates_portal_access" ON public.mission_candidates
  FOR SELECT
  USING ("portalToken" IS NOT NULL);

-- candidate_pools (via candidates)
ALTER TABLE public.candidate_pools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidate_pools_org_isolation" ON public.candidate_pools;
CREATE POLICY "candidate_pools_org_isolation" ON public.candidate_pools
  USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = "candidateId"
        AND c."organizationId" = current_org_id()
    )
  );

-- shortlists (via missions)
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shortlists_org_isolation" ON public.shortlists;
CREATE POLICY "shortlists_org_isolation" ON public.shortlists
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = "missionId"
        AND m."organizationId" = current_org_id()
    )
  );

-- Client portal: allow SELECT via accessToken
DROP POLICY IF EXISTS "shortlists_portal_access" ON public.shortlists;
CREATE POLICY "shortlists_portal_access" ON public.shortlists
  FOR SELECT
  USING ("accessToken" IS NOT NULL);

-- shortlist_candidates (via shortlists → missions)
ALTER TABLE public.shortlist_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shortlist_candidates_org_isolation" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_org_isolation" ON public.shortlist_candidates
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      JOIN public.missions m ON m.id = s."missionId"
      WHERE s.id = "shortlistId"
        AND m."organizationId" = current_org_id()
    )
  );

-- Portal access for shortlist_candidates
DROP POLICY IF EXISTS "shortlist_candidates_portal_access" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_portal_access" ON public.shortlist_candidates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      WHERE s.id = "shortlistId"
        AND s."accessToken" IS NOT NULL
    )
  );

-- client_feedbacks (via shortlist_candidates → shortlists → missions)
ALTER TABLE public.client_feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "client_feedbacks_org_isolation" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_org_isolation" ON public.client_feedbacks
  USING (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc."shortlistId"
      JOIN public.missions m ON m.id = s."missionId"
      WHERE sc.id = "shortlistCandidateId"
        AND m."organizationId" = current_org_id()
    )
  );

-- Portal write access for client_feedbacks
DROP POLICY IF EXISTS "client_feedbacks_portal_insert" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_portal_insert" ON public.client_feedbacks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc."shortlistId"
      WHERE sc.id = "shortlistCandidateId"
        AND s."accessToken" IS NOT NULL
    )
  );
