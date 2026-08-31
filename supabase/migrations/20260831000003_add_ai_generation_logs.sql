-- ============================================================================
-- Migration: 20260831000003_add_ai_generation_logs.sql
-- Description: Table d'audit et de suivi de télémétrie pour les opérations Notion AI
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace TEXT DEFAULT 'general',
  action TEXT NOT NULL, -- 'generate', 'rewrite', 'summarize', 'translate', 'extract_todos'
  model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
  prompt_preview TEXT,
  input_length INT DEFAULT 0,
  output_length INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success', -- 'success', 'error', 'cancelled'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requêtes d'audit et tableaux de bord
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user ON public.ai_generation_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_action ON public.ai_generation_logs (action);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_created_at ON public.ai_generation_logs (created_at DESC);

-- RLS
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can insert AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can insert AI logs"
  ON public.ai_generation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view own AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can view own AI logs"
  ON public.ai_generation_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );
