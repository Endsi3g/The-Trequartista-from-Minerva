-- Migration: Plane Integration for Minerva Trequartista
-- Date: 2026-08-27
-- Adds Plane synchronization columns to public.tasks and creates public.plane_sync_logs

-- 1. Add Plane columns to public.tasks
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS plane_issue_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_sequence_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_state_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_last_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS plane_sync_status TEXT DEFAULT 'synced';

-- Index for fast lookup by Plane Issue ID
CREATE INDEX IF NOT EXISTS idx_tasks_plane_issue_id ON public.tasks(plane_issue_id) WHERE plane_issue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_plane_sync_status ON public.tasks(plane_sync_status);

-- 2. Create public.plane_sync_logs table for audit & telemetry
CREATE TABLE IF NOT EXISTS public.plane_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('push_task', 'pull_webhook', 'manual_sync', 'mcp_tool_call')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    plane_issue_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for logs
CREATE INDEX IF NOT EXISTS idx_plane_sync_logs_created_at ON public.plane_sync_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plane_sync_logs_task_id ON public.plane_sync_logs(task_id);

-- Enable RLS
ALTER TABLE public.plane_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policies for plane_sync_logs
-- Authenticated users (admin/member) can view sync logs
DROP POLICY IF EXISTS "Authenticated users can read plane_sync_logs" ON public.plane_sync_logs;
CREATE POLICY "Authenticated users can read plane_sync_logs"
    ON public.plane_sync_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Service role or authenticated users can insert sync logs
DROP POLICY IF EXISTS "Authenticated users can insert plane_sync_logs" ON public.plane_sync_logs;
CREATE POLICY "Authenticated users can insert plane_sync_logs"
    ON public.plane_sync_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
