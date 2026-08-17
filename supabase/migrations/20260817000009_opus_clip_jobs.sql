-- Opus Clip pipeline: a "Vidéo Minerva" can optionally be sent to
-- OpusClip for automatic short-clip editing. One row tracks the whole
-- round trip -- source video -> Opus project -> (webhook) -> resulting
-- clips re-uploaded to the team's Google Drive via Composio.

CREATE TABLE IF NOT EXISTS public.opus_clip_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_content_item_id UUID REFERENCES public.minerva_content_items(id) ON DELETE SET NULL,
  source_video_url TEXT NOT NULL,
  title TEXT NOT NULL,
  opus_project_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  error_message TEXT,
  -- Each element: {id, title, video_url, drive_file_id, drive_view_url}.
  -- Filled in incrementally as the webhook handler uploads each clip to
  -- Drive, so a partial failure (Opus succeeds, one Drive upload fails)
  -- is visible per-clip rather than losing the whole job.
  clips JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS opus_clip_jobs_status_idx ON public.opus_clip_jobs(status);
CREATE INDEX IF NOT EXISTS opus_clip_jobs_opus_project_idx ON public.opus_clip_jobs(opus_project_id);

ALTER TABLE public.opus_clip_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opus_clip_jobs_team" ON public.opus_clip_jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));
