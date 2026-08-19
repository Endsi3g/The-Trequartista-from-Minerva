-- Reel creation parity between client deliverables (content_posts) and
-- Minerva's own content bank (minerva_content_items): both creation forms
-- now offer the same Platform + Format selects, so the data model needs
-- to support the same values on both sides.

-- content_posts.format was still CHECK-constrained to the original 4
-- values from the very first migration ('Reel 60s', 'Carrousel IG',
-- 'Post LinkedIn', 'Story'), while the "new reel" form has offered
-- 'Reel 30s' / 'Reel 90s' / 'Carrousel' for a while -- those choices were
-- silently failing to save (Postgres CHECK violation on INSERT) since
-- they were never in the allowed list. platform has no such constraint,
-- so format is dropped to match -- free TEXT, validated by the UI's
-- fixed option list rather than the database.
ALTER TABLE public.content_posts DROP CONSTRAINT IF EXISTS content_posts_format_check;

-- minerva_content_items had no platform/format columns at all -- the team
-- content form only ever captured a raw external link or file, with no
-- structured distribution metadata like the client-facing form has.
ALTER TABLE public.minerva_content_items
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT;
