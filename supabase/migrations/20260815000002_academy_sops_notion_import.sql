-- Tracks which academy_sops rows were imported from a Notion page, so a
-- re-import (clicking "Importer" again after editing the Notion source)
-- updates the existing SOP instead of creating a duplicate every time.
ALTER TABLE public.academy_sops
  ADD COLUMN IF NOT EXISTS notion_page_id TEXT UNIQUE;
