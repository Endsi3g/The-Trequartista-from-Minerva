-- ============================================================================
-- Migration : 20260902000003_clients_14_day_trial_lifecycle.sql
-- Description : Extension de la table clients pour le suivi du cycle de vie
--               de l'Essai Accompagné 14 Jours (Minerva Flow Montréal) :
--               compte à rebours, jalons opérationnels, commandes directes
--               et marge nette protégée.
-- Version : v2.22.0
-- ============================================================================

-- 1. Ajout des colonnes de gestion de l'essai accompagné 14 jours
ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS trial_status TEXT CHECK (trial_status IN ('none', 'active', 'converted', 'expired')) DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_milestones JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS trial_direct_orders_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS trial_direct_volume_cad NUMERIC(10,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS trial_net_margin_saved_cad NUMERIC(10,2) DEFAULT 0.0;

-- 2. Index pour requêtes filtrées rapides sur l'équipe Managing
CREATE INDEX IF NOT EXISTS clients_trial_status_idx
    ON public.clients (trial_status);

CREATE INDEX IF NOT EXISTS clients_trial_end_date_idx
    ON public.clients (trial_end_date);
