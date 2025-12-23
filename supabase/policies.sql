-- ORCHESTR Row Level Security (RLS) Policies
-- This file contains all RLS policies for multi-tenant data isolation
-- Run this after applying Prisma migrations

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get the current user's organization ID
-- Uses the auth_user_id field in users table to link to Supabase auth.uid()
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

-- Organizations
DROP TRIGGER IF EXISTS set_updated_at_organizations ON public.organizations;
CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Users
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Subscriptions
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Clients
DROP TRIGGER IF EXISTS set_updated_at_clients ON public.clients;
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contacts
DROP TRIGGER IF EXISTS set_updated_at_contacts ON public.contacts;
CREATE TRIGGER set_updated_at_contacts
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Missions
DROP TRIGGER IF EXISTS set_updated_at_missions ON public.missions;
CREATE TRIGGER set_updated_at_missions
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Candidates
DROP TRIGGER IF EXISTS set_updated_at_candidates ON public.candidates;
CREATE TRIGGER set_updated_at_candidates
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Candidate Enrichments
DROP TRIGGER IF EXISTS set_updated_at_candidate_enrichments ON public.candidate_enrichments;
CREATE TRIGGER set_updated_at_candidate_enrichments
  BEFORE UPDATE ON public.candidate_enrichments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Mission Candidates
DROP TRIGGER IF EXISTS set_updated_at_mission_candidates ON public.mission_candidates;
CREATE TRIGGER set_updated_at_mission_candidates
  BEFORE UPDATE ON public.mission_candidates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Pools
DROP TRIGGER IF EXISTS set_updated_at_pools ON public.pools;
CREATE TRIGGER set_updated_at_pools
  BEFORE UPDATE ON public.pools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Interactions
DROP TRIGGER IF EXISTS set_updated_at_interactions ON public.interactions;
CREATE TRIGGER set_updated_at_interactions
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tasks
DROP TRIGGER IF EXISTS set_updated_at_tasks ON public.tasks;
CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Message Templates
DROP TRIGGER IF EXISTS set_updated_at_message_templates ON public.message_templates;
CREATE TRIGGER set_updated_at_message_templates
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Questionnaires
DROP TRIGGER IF EXISTS set_updated_at_questionnaires ON public.questionnaires;
CREATE TRIGGER set_updated_at_questionnaires
  BEFORE UPDATE ON public.questionnaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Questionnaire Questions
DROP TRIGGER IF EXISTS set_updated_at_questionnaire_questions ON public.questionnaire_questions;
CREATE TRIGGER set_updated_at_questionnaire_questions
  BEFORE UPDATE ON public.questionnaire_questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Interviews
DROP TRIGGER IF EXISTS set_updated_at_interviews ON public.interviews;
CREATE TRIGGER set_updated_at_interviews
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Report Templates
DROP TRIGGER IF EXISTS set_updated_at_report_templates ON public.report_templates;
CREATE TRIGGER set_updated_at_report_templates
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Shortlists
DROP TRIGGER IF EXISTS set_updated_at_shortlists ON public.shortlists;
CREATE TRIGGER set_updated_at_shortlists
  BEFORE UPDATE ON public.shortlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Taxonomy Poles
DROP TRIGGER IF EXISTS set_updated_at_taxonomy_poles ON public.taxonomy_poles;
CREATE TRIGGER set_updated_at_taxonomy_poles
  BEFORE UPDATE ON public.taxonomy_poles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Taxonomy Positions
DROP TRIGGER IF EXISTS set_updated_at_taxonomy_positions ON public.taxonomy_positions;
CREATE TRIGGER set_updated_at_taxonomy_positions
  BEFORE UPDATE ON public.taxonomy_positions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- External Access Tokens
DROP TRIGGER IF EXISTS set_updated_at_external_access_tokens ON public.external_access_tokens;
CREATE TRIGGER set_updated_at_external_access_tokens
  BEFORE UPDATE ON public.external_access_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Core organization-scoped tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_enrichments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_cache ENABLE ROW LEVEL SECURITY;

-- New tables from this migration
ALTER TABLE public.taxonomy_poles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_access_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: ORGANIZATIONS
-- Users can only access their own organization
-- ============================================

DROP POLICY IF EXISTS "org_select" ON public.organizations;
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (id = current_org_id());

DROP POLICY IF EXISTS "org_update" ON public.organizations;
CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (id = current_org_id());

-- Note: INSERT and DELETE on organizations handled by admin/service role only

-- ============================================
-- RLS POLICIES: USERS
-- Users can see other users in their organization
-- ============================================

DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: SUBSCRIPTIONS
-- ============================================

DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
CREATE POLICY "subscriptions_update" ON public.subscriptions
  FOR UPDATE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CLIENTS
-- ============================================

DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "clients_insert" ON public.clients;
CREATE POLICY "clients_insert" ON public.clients
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "clients_update" ON public.clients;
CREATE POLICY "clients_update" ON public.clients
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "clients_delete" ON public.clients;
CREATE POLICY "clients_delete" ON public.clients
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CONTACTS
-- Access through client relationship
-- ============================================

DROP POLICY IF EXISTS "contacts_select" ON public.contacts;
CREATE POLICY "contacts_select" ON public.contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = contacts.client_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "contacts_insert" ON public.contacts;
CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = contacts.client_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "contacts_update" ON public.contacts;
CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = contacts.client_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "contacts_delete" ON public.contacts;
CREATE POLICY "contacts_delete" ON public.contacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = contacts.client_id
      AND c.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: MISSIONS
-- ============================================

DROP POLICY IF EXISTS "missions_select" ON public.missions;
CREATE POLICY "missions_select" ON public.missions
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "missions_insert" ON public.missions;
CREATE POLICY "missions_insert" ON public.missions
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "missions_update" ON public.missions;
CREATE POLICY "missions_update" ON public.missions
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "missions_delete" ON public.missions;
CREATE POLICY "missions_delete" ON public.missions
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CANDIDATES
-- ============================================

DROP POLICY IF EXISTS "candidates_select" ON public.candidates;
CREATE POLICY "candidates_select" ON public.candidates
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "candidates_insert" ON public.candidates;
CREATE POLICY "candidates_insert" ON public.candidates
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "candidates_update" ON public.candidates;
CREATE POLICY "candidates_update" ON public.candidates
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "candidates_delete" ON public.candidates;
CREATE POLICY "candidates_delete" ON public.candidates
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CANDIDATE ENRICHMENTS
-- Access through candidate relationship
-- ============================================

DROP POLICY IF EXISTS "candidate_enrichments_select" ON public.candidate_enrichments;
CREATE POLICY "candidate_enrichments_select" ON public.candidate_enrichments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_enrichments.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_enrichments_insert" ON public.candidate_enrichments;
CREATE POLICY "candidate_enrichments_insert" ON public.candidate_enrichments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_enrichments.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_enrichments_update" ON public.candidate_enrichments;
CREATE POLICY "candidate_enrichments_update" ON public.candidate_enrichments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_enrichments.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_enrichments_delete" ON public.candidate_enrichments;
CREATE POLICY "candidate_enrichments_delete" ON public.candidate_enrichments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_enrichments.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: MISSION CANDIDATES
-- Access through mission relationship
-- ============================================

DROP POLICY IF EXISTS "mission_candidates_select" ON public.mission_candidates;
CREATE POLICY "mission_candidates_select" ON public.mission_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_candidates.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "mission_candidates_insert" ON public.mission_candidates;
CREATE POLICY "mission_candidates_insert" ON public.mission_candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_candidates.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "mission_candidates_update" ON public.mission_candidates;
CREATE POLICY "mission_candidates_update" ON public.mission_candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_candidates.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "mission_candidates_delete" ON public.mission_candidates;
CREATE POLICY "mission_candidates_delete" ON public.mission_candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = mission_candidates.mission_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: POOLS
-- ============================================

DROP POLICY IF EXISTS "pools_select" ON public.pools;
CREATE POLICY "pools_select" ON public.pools
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "pools_insert" ON public.pools;
CREATE POLICY "pools_insert" ON public.pools
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "pools_update" ON public.pools;
CREATE POLICY "pools_update" ON public.pools
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "pools_delete" ON public.pools;
CREATE POLICY "pools_delete" ON public.pools
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CANDIDATE POOLS (join table)
-- Access through pool relationship
-- ============================================

DROP POLICY IF EXISTS "candidate_pools_select" ON public.candidate_pools;
CREATE POLICY "candidate_pools_select" ON public.candidate_pools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = candidate_pools.pool_id
      AND p.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_pools_insert" ON public.candidate_pools;
CREATE POLICY "candidate_pools_insert" ON public.candidate_pools
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = candidate_pools.pool_id
      AND p.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_pools_delete" ON public.candidate_pools;
CREATE POLICY "candidate_pools_delete" ON public.candidate_pools
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.pools p
      WHERE p.id = candidate_pools.pool_id
      AND p.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: INTERACTIONS
-- ============================================

DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
CREATE POLICY "interactions_select" ON public.interactions
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "interactions_insert" ON public.interactions;
CREATE POLICY "interactions_insert" ON public.interactions
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "interactions_update" ON public.interactions;
CREATE POLICY "interactions_update" ON public.interactions
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
CREATE POLICY "interactions_delete" ON public.interactions
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: TASKS
-- Access through user relationship
-- ============================================

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tasks.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tasks.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tasks.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = tasks.user_id
      AND u.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: MESSAGE TEMPLATES
-- Access through user relationship
-- ============================================

DROP POLICY IF EXISTS "message_templates_select" ON public.message_templates;
CREATE POLICY "message_templates_select" ON public.message_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = message_templates.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "message_templates_insert" ON public.message_templates;
CREATE POLICY "message_templates_insert" ON public.message_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = message_templates.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "message_templates_update" ON public.message_templates;
CREATE POLICY "message_templates_update" ON public.message_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = message_templates.user_id
      AND u.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "message_templates_delete" ON public.message_templates;
CREATE POLICY "message_templates_delete" ON public.message_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = message_templates.user_id
      AND u.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: QUESTIONNAIRES
-- Access through mission relationship
-- ============================================

DROP POLICY IF EXISTS "questionnaires_select" ON public.questionnaires;
CREATE POLICY "questionnaires_select" ON public.questionnaires
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = questionnaires.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaires_insert" ON public.questionnaires;
CREATE POLICY "questionnaires_insert" ON public.questionnaires
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = questionnaires.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaires_update" ON public.questionnaires;
CREATE POLICY "questionnaires_update" ON public.questionnaires
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = questionnaires.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaires_delete" ON public.questionnaires;
CREATE POLICY "questionnaires_delete" ON public.questionnaires
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = questionnaires.mission_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: QUESTIONNAIRE QUESTIONS
-- Access through questionnaire -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "questionnaire_questions_select" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_select" ON public.questionnaire_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_questions.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_questions_insert" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_insert" ON public.questionnaire_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_questions.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_questions_update" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_update" ON public.questionnaire_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_questions.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_questions_delete" ON public.questionnaire_questions;
CREATE POLICY "questionnaire_questions_delete" ON public.questionnaire_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_questions.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: QUESTIONNAIRE RESPONSES
-- Access through questionnaire -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "questionnaire_responses_select" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_select" ON public.questionnaire_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_responses.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_responses_insert" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_insert" ON public.questionnaire_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_responses.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_responses_update" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_update" ON public.questionnaire_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_responses.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_responses_delete" ON public.questionnaire_responses;
CREATE POLICY "questionnaire_responses_delete" ON public.questionnaire_responses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaires q
      JOIN public.missions m ON m.id = q.mission_id
      WHERE q.id = questionnaire_responses.questionnaire_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: QUESTIONNAIRE ANSWERS
-- Access through response -> questionnaire -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "questionnaire_answers_select" ON public.questionnaire_answers;
CREATE POLICY "questionnaire_answers_select" ON public.questionnaire_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_responses qr
      JOIN public.questionnaires q ON q.id = qr.questionnaire_id
      JOIN public.missions m ON m.id = q.mission_id
      WHERE qr.id = questionnaire_answers.response_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_answers_insert" ON public.questionnaire_answers;
CREATE POLICY "questionnaire_answers_insert" ON public.questionnaire_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questionnaire_responses qr
      JOIN public.questionnaires q ON q.id = qr.questionnaire_id
      JOIN public.missions m ON m.id = q.mission_id
      WHERE qr.id = questionnaire_answers.response_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_answers_update" ON public.questionnaire_answers;
CREATE POLICY "questionnaire_answers_update" ON public.questionnaire_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_responses qr
      JOIN public.questionnaires q ON q.id = qr.questionnaire_id
      JOIN public.missions m ON m.id = q.mission_id
      WHERE qr.id = questionnaire_answers.response_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "questionnaire_answers_delete" ON public.questionnaire_answers;
CREATE POLICY "questionnaire_answers_delete" ON public.questionnaire_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.questionnaire_responses qr
      JOIN public.questionnaires q ON q.id = qr.questionnaire_id
      JOIN public.missions m ON m.id = q.mission_id
      WHERE qr.id = questionnaire_answers.response_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: INTERVIEWS
-- Access through mission_candidate -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "interviews_select" ON public.interviews;
CREATE POLICY "interviews_select" ON public.interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mission_candidates mc
      JOIN public.missions m ON m.id = mc.mission_id
      WHERE mc.id = interviews.mission_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "interviews_insert" ON public.interviews;
CREATE POLICY "interviews_insert" ON public.interviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mission_candidates mc
      JOIN public.missions m ON m.id = mc.mission_id
      WHERE mc.id = interviews.mission_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "interviews_update" ON public.interviews;
CREATE POLICY "interviews_update" ON public.interviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.mission_candidates mc
      JOIN public.missions m ON m.id = mc.mission_id
      WHERE mc.id = interviews.mission_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "interviews_delete" ON public.interviews;
CREATE POLICY "interviews_delete" ON public.interviews
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.mission_candidates mc
      JOIN public.missions m ON m.id = mc.mission_id
      WHERE mc.id = interviews.mission_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: REPORT TEMPLATES
-- ============================================

DROP POLICY IF EXISTS "report_templates_select" ON public.report_templates;
CREATE POLICY "report_templates_select" ON public.report_templates
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "report_templates_insert" ON public.report_templates;
CREATE POLICY "report_templates_insert" ON public.report_templates
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "report_templates_update" ON public.report_templates;
CREATE POLICY "report_templates_update" ON public.report_templates
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "report_templates_delete" ON public.report_templates;
CREATE POLICY "report_templates_delete" ON public.report_templates
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: SHORTLISTS
-- Access through mission relationship
-- ============================================

DROP POLICY IF EXISTS "shortlists_select" ON public.shortlists;
CREATE POLICY "shortlists_select" ON public.shortlists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = shortlists.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlists_insert" ON public.shortlists;
CREATE POLICY "shortlists_insert" ON public.shortlists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = shortlists.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlists_update" ON public.shortlists;
CREATE POLICY "shortlists_update" ON public.shortlists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = shortlists.mission_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlists_delete" ON public.shortlists;
CREATE POLICY "shortlists_delete" ON public.shortlists
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = shortlists.mission_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: SHORTLIST CANDIDATES
-- Access through shortlist -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "shortlist_candidates_select" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_select" ON public.shortlist_candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      JOIN public.missions m ON m.id = s.mission_id
      WHERE s.id = shortlist_candidates.shortlist_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlist_candidates_insert" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_insert" ON public.shortlist_candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      JOIN public.missions m ON m.id = s.mission_id
      WHERE s.id = shortlist_candidates.shortlist_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlist_candidates_update" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_update" ON public.shortlist_candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      JOIN public.missions m ON m.id = s.mission_id
      WHERE s.id = shortlist_candidates.shortlist_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "shortlist_candidates_delete" ON public.shortlist_candidates;
CREATE POLICY "shortlist_candidates_delete" ON public.shortlist_candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shortlists s
      JOIN public.missions m ON m.id = s.mission_id
      WHERE s.id = shortlist_candidates.shortlist_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: CLIENT FEEDBACKS
-- Access through shortlist_candidate -> shortlist -> mission relationship
-- ============================================

DROP POLICY IF EXISTS "client_feedbacks_select" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_select" ON public.client_feedbacks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc.shortlist_id
      JOIN public.missions m ON m.id = s.mission_id
      WHERE sc.id = client_feedbacks.shortlist_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "client_feedbacks_insert" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_insert" ON public.client_feedbacks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc.shortlist_id
      JOIN public.missions m ON m.id = s.mission_id
      WHERE sc.id = client_feedbacks.shortlist_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "client_feedbacks_update" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_update" ON public.client_feedbacks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc.shortlist_id
      JOIN public.missions m ON m.id = s.mission_id
      WHERE sc.id = client_feedbacks.shortlist_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "client_feedbacks_delete" ON public.client_feedbacks;
CREATE POLICY "client_feedbacks_delete" ON public.client_feedbacks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.shortlist_candidates sc
      JOIN public.shortlists s ON s.id = sc.shortlist_id
      JOIN public.missions m ON m.id = s.mission_id
      WHERE sc.id = client_feedbacks.shortlist_candidate_id
      AND m.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: CSV IMPORTS
-- ============================================

DROP POLICY IF EXISTS "csv_imports_select" ON public.csv_imports;
CREATE POLICY "csv_imports_select" ON public.csv_imports
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "csv_imports_insert" ON public.csv_imports;
CREATE POLICY "csv_imports_insert" ON public.csv_imports
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "csv_imports_update" ON public.csv_imports;
CREATE POLICY "csv_imports_update" ON public.csv_imports
  FOR UPDATE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: EVENTS
-- ============================================

DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: LINKEDIN CACHE
-- Shared across all organizations (no org isolation needed for cache)
-- ============================================

DROP POLICY IF EXISTS "linkedin_cache_select" ON public.linkedin_cache;
CREATE POLICY "linkedin_cache_select" ON public.linkedin_cache
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "linkedin_cache_insert" ON public.linkedin_cache;
CREATE POLICY "linkedin_cache_insert" ON public.linkedin_cache
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "linkedin_cache_update" ON public.linkedin_cache;
CREATE POLICY "linkedin_cache_update" ON public.linkedin_cache
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "linkedin_cache_delete" ON public.linkedin_cache;
CREATE POLICY "linkedin_cache_delete" ON public.linkedin_cache
  FOR DELETE USING (true);

-- ============================================
-- RLS POLICIES: TAXONOMY POLES
-- ============================================

DROP POLICY IF EXISTS "taxonomy_poles_select" ON public.taxonomy_poles;
CREATE POLICY "taxonomy_poles_select" ON public.taxonomy_poles
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_poles_insert" ON public.taxonomy_poles;
CREATE POLICY "taxonomy_poles_insert" ON public.taxonomy_poles
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_poles_update" ON public.taxonomy_poles;
CREATE POLICY "taxonomy_poles_update" ON public.taxonomy_poles
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_poles_delete" ON public.taxonomy_poles;
CREATE POLICY "taxonomy_poles_delete" ON public.taxonomy_poles
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: TAXONOMY POSITIONS
-- ============================================

DROP POLICY IF EXISTS "taxonomy_positions_select" ON public.taxonomy_positions;
CREATE POLICY "taxonomy_positions_select" ON public.taxonomy_positions
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_positions_insert" ON public.taxonomy_positions;
CREATE POLICY "taxonomy_positions_insert" ON public.taxonomy_positions
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_positions_update" ON public.taxonomy_positions;
CREATE POLICY "taxonomy_positions_update" ON public.taxonomy_positions
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "taxonomy_positions_delete" ON public.taxonomy_positions;
CREATE POLICY "taxonomy_positions_delete" ON public.taxonomy_positions
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- RLS POLICIES: CANDIDATE POSITIONS (join table)
-- Access through candidate relationship
-- ============================================

DROP POLICY IF EXISTS "candidate_positions_select" ON public.candidate_positions;
CREATE POLICY "candidate_positions_select" ON public.candidate_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_positions.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_positions_insert" ON public.candidate_positions;
CREATE POLICY "candidate_positions_insert" ON public.candidate_positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_positions.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

DROP POLICY IF EXISTS "candidate_positions_delete" ON public.candidate_positions;
CREATE POLICY "candidate_positions_delete" ON public.candidate_positions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = candidate_positions.candidate_id
      AND c.organization_id = current_org_id()
    )
  );

-- ============================================
-- RLS POLICIES: EXTERNAL ACCESS TOKENS
-- Internal users only (same org policy)
-- No public read policy - tokens are validated server-side only
-- ============================================

DROP POLICY IF EXISTS "external_access_tokens_select" ON public.external_access_tokens;
CREATE POLICY "external_access_tokens_select" ON public.external_access_tokens
  FOR SELECT USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "external_access_tokens_insert" ON public.external_access_tokens;
CREATE POLICY "external_access_tokens_insert" ON public.external_access_tokens
  FOR INSERT WITH CHECK (organization_id = current_org_id());

DROP POLICY IF EXISTS "external_access_tokens_update" ON public.external_access_tokens;
CREATE POLICY "external_access_tokens_update" ON public.external_access_tokens
  FOR UPDATE USING (organization_id = current_org_id());

DROP POLICY IF EXISTS "external_access_tokens_delete" ON public.external_access_tokens;
CREATE POLICY "external_access_tokens_delete" ON public.external_access_tokens
  FOR DELETE USING (organization_id = current_org_id());

-- ============================================
-- END OF RLS POLICIES
-- ============================================

