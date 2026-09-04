-- ============================================================================
-- Migration : 20260904160000_purge_non_official_team_profiles.sql
-- Description : Purge définitive des profils parasites, bots et doublons de public.profiles.
--               Garantit l'existence exclusive des 5 membres officiels de l'agence.
-- Version : v2.28.0
-- ============================================================================

-- 1. Supprimer définitivement les comptes de test et bots de la table profiles
DELETE FROM public.profiles
WHERE LOWER(email) IN (
    'test-agent@minerva.com',
    'theminervabrand@gmail.com',
    'qa-audit-test@minervaflow.com',
    'maertidn@compagny.com',
    'maertin@compagny.com',
    'theuprisingstudio@gmail.com',
    'contact@client.com'
)
OR LOWER(full_name) IN (
    'agent tester',
    'qa audit visuel',
    'vates',
    'client contact'
)
OR (LOWER(full_name) = 'kael' AND LOWER(email) != 'kbelceus776@gmail.com')
OR (LOWER(full_name) = 'kael belceus' AND LOWER(email) != 'kbelceus776@gmail.com');

-- 2. Réassigner les tâches ou commissions orphelines éventuelles vers le compte principal Kael Belceus
DO $$
DECLARE
    main_kael_id UUID;
BEGIN
    SELECT id INTO main_kael_id FROM public.profiles WHERE LOWER(email) = 'kbelceus776@gmail.com' LIMIT 1;
    
    IF main_kael_id IS NOT NULL THEN
        UPDATE public.tasks
        SET assignee_id = main_kael_id
        WHERE assignee_id NOT IN (SELECT id FROM public.profiles);

        UPDATE public.team_commissions
        SET member_id = main_kael_id
        WHERE member_id NOT IN (SELECT id FROM public.profiles);
    END IF;
END $$;

-- 3. Verrouiller et configurer strictement les 5 membres d'équipe officiels
-- Membre 1 : Kael Belceus (Fondateur & Lead Architect)
UPDATE public.profiles
SET full_name = 'Kael Belceus',
    role = 'admin',
    approved = TRUE,
    department = 'Direction & Architecture',
    job_title = 'Fondateur & Lead Architect'
WHERE LOWER(email) = 'kbelceus776@gmail.com';

-- Membre 2 : Manpreet Singh (Growth & Vidéo)
UPDATE public.profiles
SET full_name = 'Manpreet Singh',
    role = 'member',
    approved = TRUE,
    department = 'Growth & Vidéo',
    job_title = 'Associé Growth & Studio'
WHERE LOWER(email) = 'byeh50230@gmail.com' OR LOWER(full_name) LIKE '%manpreet%';

-- Membre 3 : Rayan (Ventes & Closing)
UPDATE public.profiles
SET full_name = 'Rayan',
    role = 'member',
    approved = TRUE,
    department = 'Ventes & Closing',
    job_title = 'Associé Ventes & Outbound'
WHERE LOWER(email) = 'rayanmohellebi2009@gmail.com' OR LOWER(full_name) = 'rayan';

-- Membre 4 : Samuel Olamide Adeleke (Tech & Systèmes)
UPDATE public.profiles
SET full_name = 'Samuel Olamide Adeleke',
    role = 'member',
    approved = TRUE,
    department = 'Tech & Systèmes',
    job_title = 'Ingénieur Full-Stack'
WHERE LOWER(email) = 'samade3434@gmail.com' OR LOWER(full_name) LIKE '%samuel olamide%';

-- Membre 5 : Amine Yahya Karroubi (Opérations & Client Success)
UPDATE public.profiles
SET full_name = 'Amine Yahya Karroubi',
    role = 'member',
    approved = TRUE,
    department = 'Opérations & Client Success',
    job_title = 'Account Manager Lead'
WHERE LOWER(email) = 'karroubiamine@hotmail.com' OR LOWER(full_name) LIKE '%amine yahya%';

-- 4. Bloquer tout compte qui n'est pas dans la liste officielle des 5 membres
UPDATE public.profiles
SET approved = FALSE, role = 'client'
WHERE LOWER(email) NOT IN (
    'kbelceus776@gmail.com',
    'byeh50230@gmail.com',
    'rayanmohellebi2009@gmail.com',
    'samade3434@gmail.com',
    'karroubiamine@hotmail.com'
);
