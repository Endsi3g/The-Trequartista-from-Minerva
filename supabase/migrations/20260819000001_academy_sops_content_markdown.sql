-- academy_sops never had a content_markdown column -- only the 5
-- hardcoded DEFAULT_ACADEMY_SOPS in lib/services/supabase-data.ts (pure
-- JS objects, never touching the DB) ever had real markdown content.
-- Every DB-backed SOP (the 22 imported from Notion, plus anything
-- created through /academy/new) has no way to store a content body at
-- all, so the SOP detail page's `sop.content_markdown || <fallback>`
-- always hit the generic hardcoded fallback template -- every real SOP
-- rendered the same fake placeholder text instead of its own content.
ALTER TABLE public.academy_sops
  ADD COLUMN IF NOT EXISTS content_markdown TEXT;
