-- ============================================================================
-- CHANGELOG_ENTRIES SCHEMA DRIFT FIX + v2.5.0 SEED
-- addChangelogEntry() (lib/services/supabase-data.ts) and /changelog/new
-- write `version` and `included_items` -- neither column exists on
-- changelog_entries, so every attempt to publish a new in-app entry has
-- been failing. Idempotent -- safe to run on both fresh and existing
-- databases.
-- ============================================================================

ALTER TABLE public.changelog_entries
    ADD COLUMN IF NOT EXISTS version TEXT,
    ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Seed the v2.5.0 entry (Voice AI de-fake + schema-drift fixes) directly --
-- no live Supabase CLI/MCP access from this environment to publish it
-- through the admin UI, and this UI was itself broken until the ALTER
-- above landed.
INSERT INTO public.changelog_entries (title, body, version, included_items)
SELECT
    'Agent Vocal IA de-faké & branché, corrections de dérive de schéma',
    'L''Agent Vocal IA (ElevenLabs) affiche maintenant un état réel au lieu de statistiques fabriquées, et sa console de test utilise le vrai widget de conversation. Sa configuration (voix, prompt, déclenchement automatique) est désormais persistée, avec un nouvel appel de qualification automatique optionnel à la conversion d''un lead et un onglet de génération vocale pour le contenu. Plusieurs bugs de dérive de schéma préexistants (écritures silencieusement en échec sur voice_calls, intake_leads et app_permissions) ont aussi été corrigés au passage.',
    '2.5.0',
    ARRAY[
        'Suppression de toutes les données factices sur /voice-agent (badge en ligne, capacité, latence, console de test animée)',
        'Configuration de l''agent (voix, prompt, déclenchement automatique) persistée en base',
        'Appel de qualification automatique optionnel à la conversion d''un lead, désactivé par défaut',
        'Nouvel onglet Génération vocale (texte vers audio)',
        'Correction de bugs de dérive de schéma sur voice_calls, intake_leads et app_permissions',
        'Correction du chevauchement visuel entre le point "Nouveau" et l''étoile favori dans la sidebar',
        'Nouvelle bibliothèque de skeletons de chargement (formes réelles, shimmer réservé au texte)'
    ]
WHERE NOT EXISTS (
    SELECT 1 FROM public.changelog_entries WHERE version = '2.5.0'
);
