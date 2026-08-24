-- ============================================================================
-- Migration: 20260817000010_feature_requests_and_minerva_flow.sql
-- Description: Creates feature_requests table with realtime publication and minerva_flow_metrics
-- ============================================================================

-- 1. Feature Requests table
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'feature', -- 'feature', 'ui_ux', 'integration', 'automation', 'optimization', 'bug'
  repo TEXT NOT NULL DEFAULT 'Minerva-Flow', -- 'Minerva-Flow', 'The-Trequartista', 'Minerva-Voice-AI', 'Minerva-OS'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status TEXT NOT NULL DEFAULT 'under_review', -- 'under_review', 'planned', 'in_progress', 'testing', 'delivered', 'declined'
  estimated_delivery DATE,
  admin_notes TEXT,
  author_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_feature_requests_client ON public.feature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_repo ON public.feature_requests(repo);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON public.feature_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Feature requests policies
DROP POLICY IF EXISTS "feature_requests_select" ON public.feature_requests;
CREATE POLICY "feature_requests_select" ON public.feature_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Admin or team can see all, client can see their own client's requests or their own user requests
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'member')
        OR p.client_id = feature_requests.client_id
      )
    )
    OR user_id = auth.uid()
    OR client_id IS NULL
  );

DROP POLICY IF EXISTS "feature_requests_insert" ON public.feature_requests;
CREATE POLICY "feature_requests_insert" ON public.feature_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "feature_requests_update" ON public.feature_requests;
CREATE POLICY "feature_requests_update" ON public.feature_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role IN ('admin', 'member')
        OR p.client_id = feature_requests.client_id
      )
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "feature_requests_delete" ON public.feature_requests;
CREATE POLICY "feature_requests_delete" ON public.feature_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- 2. Enable Realtime on feature_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'feature_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Publication might not exist in local test env
END $$;

-- 3. Minerva-Flow Metrics table
CREATE TABLE IF NOT EXISTS public.minerva_flow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  period TEXT NOT NULL DEFAULT '30d',
  orders_count INT NOT NULL DEFAULT 0,
  gross_volume NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  direct_savings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  avg_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  avg_prep_time_minutes INT NOT NULL DEFAULT 18,
  growth_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  popular_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_tickets JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_minerva_flow_metrics_client ON public.minerva_flow_metrics(client_id);
ALTER TABLE public.minerva_flow_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "minerva_flow_metrics_select" ON public.minerva_flow_metrics;
CREATE POLICY "minerva_flow_metrics_select" ON public.minerva_flow_metrics
  FOR SELECT
  TO authenticated
  USING (true);
