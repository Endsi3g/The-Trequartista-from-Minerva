-- Completes 2 of the 4 notification toggles that shipped as UI-only
-- placeholders in the 2026-08-17 audit ("Bientôt" badge, no backing
-- column). "Alertes de sécurité" and "Mises à jour de facturation" stay
-- non-optional by design (always-on, no column needed). These two get
-- real columns because a real send path already exists for new leads
-- (app/(dashboard)/leads/new/page.tsx -> /api/push/send) and can now
-- respect the preference; tips/tutorials has no content pipeline yet
-- (same honest gap "Nouveautés produit" already has -- the preference
-- persists, nothing auto-sends against it yet).
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS new_leads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS tips_tutorials_enabled BOOLEAN NOT NULL DEFAULT FALSE;
