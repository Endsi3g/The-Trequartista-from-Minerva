-- Harden Row Level Security across the schema.
--
-- Every policy created in the initial migrations used `USING (true)` with
-- no `TO authenticated` clause. In Postgres/Supabase, a policy with no role
-- clause applies to PUBLIC — meaning the anon key alone (already present in
-- the client-side JS bundle, by design) was enough to read and write these
-- tables directly through supabase-js, with no session at all.
--
-- This migration keeps the existing "any signed-in team member can see
-- everything" model for genuinely shared operational data (that is the
-- product's intent — a shared CRM/ops dashboard), but requires an
-- authenticated session. It adds real per-owner scoping for the two tables
-- that hold secrets (notion_config, user_api_keys), which should never
-- have been team-wide readable in the first place.

-- Stop duplicating secrets into the broadly-read audit trail. These two
-- tables no longer need row-level change tracking now that they are
-- properly access-controlled.
DROP TRIGGER IF EXISTS trigger_audit_user_api_keys ON public.user_api_keys;
DROP TRIGGER IF EXISTS trigger_audit_notion_config ON public.notion_config;

-- notion_config had no uniqueness constraint on user_id, so the app's
-- `.upsert(..., { onConflict: 'user_id' })` call was relying on a
-- constraint that didn't exist (it would error at runtime). One config
-- row per user is also what the per-owner RLS policy below assumes.
ALTER TABLE public.notion_config ADD CONSTRAINT notion_config_user_id_key UNIQUE (user_id);

-- ---- Shared team tables: require authentication, keep team-wide visibility ----

DROP POLICY IF EXISTS "Allow team read clients" ON public.clients;
DROP POLICY IF EXISTS "Allow team write clients" ON public.clients;
CREATE POLICY "clients_select_team" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_write_team" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read client_roi_metrics" ON public.client_roi_metrics;
CREATE POLICY "client_roi_metrics_select_team" ON public.client_roi_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_roi_metrics_write_team" ON public.client_roi_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow team write projects" ON public.projects;
CREATE POLICY "projects_select_team" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_write_team" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read project_launch_checks" ON public.project_launch_checks;
DROP POLICY IF EXISTS "Allow team write project_launch_checks" ON public.project_launch_checks;
CREATE POLICY "launch_checks_select_team" ON public.project_launch_checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "launch_checks_write_team" ON public.project_launch_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read content_posts" ON public.content_posts;
DROP POLICY IF EXISTS "Allow team write content_posts" ON public.content_posts;
CREATE POLICY "content_posts_select_team" ON public.content_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "content_posts_write_team" ON public.content_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read team_performance_reviews" ON public.team_performance_reviews;
DROP POLICY IF EXISTS "Allow team write team_performance_reviews" ON public.team_performance_reviews;
CREATE POLICY "team_perf_select_team" ON public.team_performance_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_perf_write_team" ON public.team_performance_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read academy_sops" ON public.academy_sops;
CREATE POLICY "academy_sops_select_team" ON public.academy_sops FOR SELECT TO authenticated USING (true);
CREATE POLICY "academy_sops_write_team" ON public.academy_sops FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read leads" ON public.leads;
DROP POLICY IF EXISTS "Allow team write leads" ON public.leads;
CREATE POLICY "leads_select_team" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_write_team" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow team read audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow team write audit_logs" ON public.audit_logs;
CREATE POLICY "audit_logs_select_team" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "audit_logs_insert_team" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on user_feedbacks" ON public.user_feedbacks;
DROP POLICY IF EXISTS "Allow public insert on user_feedbacks" ON public.user_feedbacks;
CREATE POLICY "user_feedbacks_select_team" ON public.user_feedbacks FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_feedbacks_insert_team" ON public.user_feedbacks FOR INSERT TO authenticated WITH CHECK (true);

-- ---- Per-owner tables: real ownership scoping, not just "authenticated" ----

DROP POLICY IF EXISTS "Allow team read notion_config" ON public.notion_config;
DROP POLICY IF EXISTS "Allow team write notion_config" ON public.notion_config;
CREATE POLICY "notion_config_own" ON public.notion_config
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow public select on user_api_keys" ON public.user_api_keys;
DROP POLICY IF EXISTS "Allow public insert on user_api_keys" ON public.user_api_keys;
CREATE POLICY "user_api_keys_own" ON public.user_api_keys
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- allowed_emails already scopes admin management to role = 'admin'
-- (20260811000010_allowed_emails.sql); that comparison is only correct now
-- that 20260812000002_fix_profiles_schema.sql normalized role casing.
