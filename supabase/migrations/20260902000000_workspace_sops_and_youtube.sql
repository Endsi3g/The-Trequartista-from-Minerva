-- ============================================================================
-- Migration : 20260902000000_workspace_sops_and_youtube.sql
-- Description : Extension de la table academy_sops pour le multi-workspaces,
--               les checklists dynamiques, les templates de scripts et
--               l'ensemencement des 18 SOPs complètes (6 par workspace).
-- Version : v2.19.0
-- ============================================================================

-- 1. Ajout des colonnes multi-workspaces, checklists et scripts
ALTER TABLE public.academy_sops
    ADD COLUMN IF NOT EXISTS target_workspace TEXT CHECK (target_workspace IN ('prospection', 'managing', 'tech', 'all')) DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS script_template TEXT;

CREATE INDEX IF NOT EXISTS academy_sops_target_workspace_idx
    ON public.academy_sops (target_workspace);

-- 2. Mise à jour des SOPs existantes avec leur workspace de référence
UPDATE public.academy_sops
SET target_workspace = 'prospection'
WHERE category IN ('Ventes & Prospection') OR pillar IN ('flow', 'reach') OR title ILIKE '%reach%' OR title ILIKE '%flow%';

UPDATE public.academy_sops
SET target_workspace = 'tech'
WHERE category IN ('IA & Ingénierie', 'Workflows IA', 'Tech & Ingénierie', 'Design Framer') OR title ILIKE '%github%' OR title ILIKE '%framer%';

UPDATE public.academy_sops
SET target_workspace = 'managing'
WHERE category IN ('Gestion de compte', 'Support & QA', 'Rôles & Rémunération') AND target_workspace = 'all';

-- ============================================================================
-- 3. Ensemencement des 18 SOPs Spécialisées par Workspace
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- WORKSPACE 1 : PROSPECTION & VENTES (6 SOPs)
-- ────────────────────────────────────────────────────────────────────────────

-- SOP-PROSP-01 : Routine Quotidienne du Prospecteur (/today)
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Routine Quotidienne du Prospecteur & SDR (/today)',
  'Organisation méthodique de la journée de vente : session focus 09h30-12h00 sur Minerva Reach, batching de 30 à 50 contacts et qualification.',
  'Ventes & Prospection',
  'prospection',
  '# SOP-PROSP-01 — Routine Quotidienne du Prospecteur & SDR (/today)

## 1. Philosophie & Cadre de Travail
Chez Minerva, la prospection n''est pas une corvée dispersée au fil de la journée : c''est un **bloc de concentration absolue (Deep Work)** chronométré et structuré. L''application centrale pour votre routine terrain est **Minerva Reach** (`https://minerva-os-lite-desktop.vercel.app/today`).

## 2. Emploi du Temps Idéal du Prospecteur
- **09h00 - 09h30 : Préparation & Check-in**
  - Ouvrir Minerva Reach (/today) et synchroniser la liste des tâches.
  - Identifier les 5 relances prioritaires (leads ayant ouvert un audit la veille).
- **09h30 - 12h00 : Bloc de Prospection Active (Zéro Distraction)**
  - Qualification rapide de 30 à 50 fiches commerces (Google Maps + Instagram).
  - Envoi des audits publics proactifs sans friction.
  - Objectif : générer 2 à 3 conversations qualifiées.
- **14h00 - 16h30 : Démos & Rendez-vous Visio**
  - Conduire les présentations démo de Minerva Flow et packs agence.
  - Verrouiller l''accord verbal et préparer la proposition commerciale.
- **16h30 - 17h00 : Clôture & Relances CRM**
  - Déclencher les propositions dans Minerva Trequartista (/proposals) avec acompte Stripe 50%.
  - Programmer la relance J+2 dans le CRM.

## 3. Règles d''Or
1. **Ne jamais prospecter sans contexte :** Un audit public basé sur des données réelles (prix UberEats vs menu en ligne) convertit 4x mieux qu''un pitch générique.
2. **Rythme soutenu :** Viser 30 à 50 leads contactés par jour pour maintenir un pipe régulier de 10 000 $ CAD/mois.',
  10,
  'Kael Belceus & RevOps Lead',
  true,
  true,
  true,
  1,
  'reach',
  '["Ouvrir Minerva Reach (/today) dès 09h00", "Traiter les 5 relances chaudes du jour", "Exécuter le bloc de 30-50 qualifications sans interruption", "Enregistrer les notes de qualification dans le CRM", "Planifier les relances à J+2"]'::jsonb,
  'Bonjour [Prénom],\n\nJ''ai préparé votre liste de 50 prospects qualifiés sur Montréal avec leurs données de contact directes :\n👉 [Lien Liste Partagée]\n\nC''est notre façon de vous montrer comment travaille Minerva Reach sans vous demander d''accès à vos outils.\n\nSeriez-vous ouvert à échanger 10 minutes cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Routine Quotidienne du Prospecteur & SDR (/today)');

-- SOP-PROSP-02 : Rôle, Missions & Responsabilités du Pôle Acquisition
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rôle, Missions & Responsabilités du Pôle Acquisition (Closer / SDR)',
  'Définition des responsabilités, critères de qualification des fiches restaurateurs et indicateurs de performance clés (KPIs).',
  'Ventes & Prospection',
  'prospection',
  '# SOP-PROSP-02 — Rôle, Missions & Responsabilités du Pôle Acquisition

## 1. Mission Principale
Votre mission est de convertir des commerçants et restaurateurs indépendants du Grand Montréal en partenaires enthousiastes de l''écosystème Minerva (Minerva Flow, Minerva Reach et prestations Agence).

## 2. Responsabilités Fondamentales
1. **Génération & Qualification de Pipeline :** Identifier les entreprises dont les marges sont érodées par les plateformes tierces (30% de commission) ou dont le site web freine les conversions.
2. **Démonstration Produit :** Présenter Minerva Flow et le site web Framer en conditions réelles avec un prototype personnalisé.
3. **Closing & Signature Électronique :** Conclure la vente avec encaissement de l''acompte Stripe 50% sur Minerva Trequartista.
4. **Transition Client :** Transmettre le dossier qualifié à l''Account Manager sous 24h avec le brief complet.

## 3. Indicateurs de Performance (KPIs)
- **Volume d''activité :** 30 à 50 leads qualifiés par jour.
- **Rendez-vous démo :** 5 à 8 démos tenues par semaine.
- **Taux de closing :** > 25% des démos converties en clients payants.
- **Délai moyen de signature :** Moins de 7 jours ouvrés entre le premier contact et le paiement de l''acompte.',
  8,
  'Kael Belceus',
  true,
  false,
  true,
  2,
  'reach',
  '["Vérifier les critères ICP du prospect (Montréal, indépendant, menu actif)", "Calculer la perte estimée sur Uber Eats avec notre simulateur", "Réserver le créneau de démo de 20 minutes", "Notifier l''Account Manager dès signature de la proposition"]'::jsonb,
  'Bonjour [Prénom],\n\nSur la base de nos calculs, votre établissement perd environ [X] $ par mois en frais de livraison tiers.\nOn a conçu une démo interactive pour votre restaurant disponible ici :\n👉 [Lien Démo Personnalisée]\n\nDisponible jeudi à 15h pour 10 minutes de revue rapide ?\n\nBien à vous,\n[Votre Prénom] — Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rôle, Missions & Responsabilités du Pôle Acquisition (Closer / SDR)');

-- SOP-PROSP-03 : Rémunération RevOps, Commissions & Simulateur de Gains
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rémunération RevOps, Commissions & Simulateur de Gains Commerciaux',
  'Grille de commissions hybride Minerva : 10% sur les frais de setup + 5% récurrent sur le MRR + multiplicateur 1.25x au dépassement de quota.',
  'Rôles & Rémunération',
  'prospection',
  '# SOP-PROSP-03 — Rémunération RevOps & Modèle de Commissions

## 1. Principes du Modèle RevOps Minerva
Minerva applique un modèle de rémunération hautement incitatif et méritocratique qui récompense à la fois le closing immédiat et la rétention long terme.

## 2. Structure de Rémunération
1. **Fixe Garanti :** Base mensuelle garantie selon séniorité (2 500 $ à 3 500 $ CAD).
2. **Commission Setup Direct (10%) :**
   - Sur chaque forfait de configuration initiale encaissé (ex: sur un pack à 3 000 $ CAD, commission immédiate de 300 $ CAD).
3. **Commission Récurrente MRR (5%) :**
   - 5% perçus chaque mois sur l''abonnement logiciel et la maintenance du client tant qu''il reste actif.
4. **Multiplicateur Quota Dépassé (+25%) :**
   - Dès que votre volume de deal mensuel atteint ou dépasse **10 000 $ CAD**, toutes vos commissions setup du mois sont bonifiées de **+25% (taux effectif de 12.5%)**.

## 3. Exemple Concret de Calcul Mensuel
- 4 clients signés à 2 500 $ CAD = 10 000 $ CAD de valeur deal (Quota atteint).
- Commission setup de base : 1 000 $ CAD.
- Bonus quota 1.25x : +250 $ CAD.
- MRR cumulé apporté (1 200 $ CAD) : +60 $ CAD/mois récurrent.
- **Rémunération variable mensuelle : 1 310 $ CAD + Fixe garanti.**',
  10,
  'Kael Belceus & Finance Lead',
  true,
  false,
  false,
  3,
  'reach',
  '["Valider l''encaissement de l''acompte Stripe 50%", "Vérifier l''enregistrement du deal dans /team/roles", "Calculer le montant total de valeur générée dans le mois", "Vérifier le statut du multiplicateur quota (seuil 10 000 $ CAD)"]'::jsonb,
  'Récapitulatif de commission commerciale :\n- Client : [Nom du Commerce]\n- Valeur totale du contrat : [Montant] $ CAD\n- Acompte 50% encaissé : [Montant/2] $ CAD\n- Taux appliqué : 10% Setup (+25% bonus quota si applicable) + 5% MRR récurrent'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rémunération RevOps, Commissions & Simulateur de Gains Commerciaux');

-- SOP-PROSP-04 : Programme de Formation Continue & Écoute d'Appels Vente
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Programme de Formation Continue & Écoute d’Appels de Vente',
  'Méthode d’auto-formation hebdomadaire, simulation d’objections restaurateurs et debriefings d’appels réels le vendredi.',
  'Onboarding',
  'prospection',
  '# SOP-PROSP-04 — Formation Continue & Perfectionnement Vente

## 1. La Boucle d''Amélioration Continue
Chez Minerva, les meilleurs vendeurs consacrent 10% de leur semaine à affûter leur argumentaire. La vente n''est pas une improvisation : c''est une compétence calibrée par l''analyse de données réelles.

## 2. Rituel Hebdomadaire : Le Dojo du Vendredi (16h30)
Chaque vendredi, l''équipe commerciale se réunit pour :
1. **Écoute d''un appel gagné :** Analyser le déclencheur psychologique qui a provoqué le « Oui ».
2. **Autopsie d''un appel perdu :** Identifier précisément où l''objection n''a pas été anticipée.
3. **Simulation en direct (Roleplay) :** 5 minutes de mise en situation face à un restaurateur pressé pendant le service.

## 3. Les 3 Objections Majeures & Réponses
- **« Je n''ai pas le temps, rappelez-moi plus tard »**
  - *Réponse :* « Je comprends parfaitement, vous êtes en plein rush. C''est pour ça que je ne vous demande aucun rendez-vous : je vous envoie une vidéo de 45 secondes sur votre menu avec le chiffre exact de ce que vous perdez. Si c''est pertinent, on en reparle 5 minutes mardi à 15h. »
- **« Uber Eats m''apporte tous mes clients, je ne peux pas m''en passer »**
  - *Réponse :* « Nous ne vous demandons pas de quitter Uber Eats. Nous vous installons une passerelle pour que vos clients habituels commandent en direct à 0% de commission. Vos nouveaux clients viennent par Uber, vos clients fidèles commandent sur votre Flow. »',
  12,
  'Kael Belceus',
  false,
  false,
  false,
  4,
  'reach',
  '["Écouter au moins 2 appels enregistrés chaque semaine", "Documenter une nouvelle objection rencontrée sur le terrain", "Participer au roleplay hebdomadaire du vendredi", "Tester un nouvel angle d''accroche par tranche de 20 contacts"]'::jsonb,
  'Structure d''argumentaire anti-objection :\n1. Valider la préoccupation (« C''est tout à fait normal de penser cela »)\n2. Isoler le frein (« Si ce point était résolu sans risque, seriez-vous prêt à avancer ? »)\n3. Présenter le protocole test (« 5 minutes sur imprimante sans engagement »)'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Programme de Formation Continue & Écoute d’Appels de Vente');

-- SOP-PROSP-05 : Formation Vente & Closing : Démo Directe 0% Commission
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Formation Vente & Closing : Démo Directe 0% Commission (Minerva Flow)',
  'Script pas-à-pas de démonstration de Minerva Flow, protocole test 5 minutes en cuisine et closing avec acompte 50%.',
  'Ventes & Prospection',
  'prospection',
  '# SOP-PROSP-05 — Démo Directe 0% Commission & Closing

## 1. La Démonstration Vivante (Contre-pied Radical)
Le restaurateur reçoit 10 appels de démarcheurs par jour. Si vous venez avec des slides ou un document PDF, vous avez perdu. 
Notre approche : **arriver avec leur restaurant déjà modélisé dans Minerva Flow**.

## 2. Déroulé de la Démo en 15 Minutes
1. **Minute 1-3 : Le Choc Chiffré**
   - Ouvrir la fiche de simulation : « Sur votre burger signature vendu 22 $, Uber prend 6.60 $. Sur 500 commandes/mois, vous leur versez 3 300 $ CAD nets. »
2. **Minute 4-8 : La Démo Vivante sur Smartphone**
   - Leur montrer leur menu en ligne interactif avec QR code brandé à leur nom.
   - Passer une commande test en direct sous leurs yeux.
3. **Minute 9-12 : Le Protocole Test Cuisine Sans Risque**
   - « On branche la commande sur votre imprimante de caisse actuelle. Si en 5 minutes ça ne fonctionne pas immédiatement ou que votre équipe hésite — on annule tout sans frais. »
4. **Minute 13-15 : Formalisation sur Minerva Trequartista**
   - Génération de la proposition avec acompte 50% sur `/proposals`. Signature tactile immédiate.',
  15,
  'Kael Belceus & Closer Lead',
  true,
  true,
  false,
  5,
  'flow',
  '["Pré-configurer 5 plats vedettes sur l''interface de démo Flow", "Imprimer ou afficher le QR code personnalisé", "Simuler une commande test en direct pendant la démo", "Faire signer la proposition commerciale avec lien Stripe"]'::jsonb,
  'Bonjour [Prénom],\n\nOn a configuré 5 de vos plats vedettes dans une interface de commande directe à 0% de commission :\n👉 [Lien Démo Personnalisée]\n\nTestez l''expérience client en 1 clic. Si ça vous plaît, on branche une commande test sur votre imprimante mardi à 14h30.\n\nBien à vous,\n[Votre Prénom] — Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Formation Vente & Closing : Démo Directe 0% Commission (Minerva Flow)');

-- SOP-PROSP-06 : Guide Complet Minerva Reach & Recherche de Vidéos YouTube
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Guide Complet : Utiliser Minerva Reach & Dénicher les Meilleures Vidéos YouTube',
  'Manuel complet de prospection terrain sur Minerva Reach, exploitation de la vue /today et méthode experte pour trouver des vidéos YouTube inspirantes.',
  'Outils & Systèmes',
  'prospection',
  '# SOP-PROSP-06 — Manuel Minerva Reach & Recherche Vidéos YouTube

## 1. Accès & Architecture de Minerva Reach
- **URL de l''application :** [https://minerva-os-lite-desktop.vercel.app/today](https://minerva-os-lite-desktop.vercel.app/today)
- **Rôle dans l''écosystème :** Application rapide optimisée pour la routine quotidienne et la prospection terrain des commerciaux.

## 2. Guide d''Utilisation Pas-à-Pas de Minerva Reach
1. **Étape 1 — Connexion & Vue /today :**
   - Consultez votre jauge de quota quotidien (ex: 30 fiches à traiter).
   - Triez les prospects par secteur géographique (Montréal, Rosemont, Mile End, Plateau).
2. **Étape 2 — Qualification Express :**
   - Vérifiez en 1 clic la présence d''un menu en ligne, le volume d''avis récents et la note Google.
   - Si note < 4.2 ou plaintes sur la livraison : marquez le lead comme « Signal Fort ».
3. **Étape 3 — Déclenchement de Proposition :**
   - Dès qu''un prospect répond positivement, basculez dans Minerva Trequartista (`/proposals`) pour générer le devis avec acompte 50%.

## 3. Comment Trouver & Exploiter les Meilleures Vidéos YouTube de Formation
Pour rester au sommet des techniques de vente et de prospection :
- **Opérateurs de recherche YouTube recommandés :**
  - `"cold calling" restaurant "montreal" OR "b2b"`
  - `"live sales call" SaaS closing objection handling`
  - `"google maps lead generation" outreach template`
- **Utilisation du module de Curation YouTube Minerva :**
  - Cliquez sur le bouton rouge **« Curation YouTube »** en haut de l''Académie pour générer des requêtes expertes en 1 clic et prévisualiser les vidéos directement dans l''Académie sans quitter l''ERP.',
  14,
  'Kael Belceus',
  true,
  true,
  true,
  6,
  'reach',
  '["Ouvrir Minerva Reach (/today) sur mobile ou desktop", "Traiter la file de prospects assignée au secteur du jour", "Utiliser le bouton Curation YouTube de l''Académie pour s''inspirer de closing réels", "Synchroniser les nouveaux leads chauds avec Minerva Trequartista"]'::jsonb,
  'Bonjour [Prénom],\n\nJ''ai remarqué votre présence sur le secteur [Quartier]. On a développé Minerva Reach spécifiquement pour automatiser la prospection des commerces locaux sans intermédiaire.\n\nVoici une capsule de présentation de 60 secondes :\n👉 [Lien Démo YouTube / Minerva Reach]\n\nBien à vous,\n[Votre Prénom] — Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Guide Complet : Utiliser Minerva Reach & Dénicher les Meilleures Vidéos YouTube');

-- ────────────────────────────────────────────────────────────────────────────
-- WORKSPACE 2 : OPERATIONS & MANAGING (6 SOPs)
-- ────────────────────────────────────────────────────────────────────────────

-- SOP-MNG-01 : Routine Quotidienne de l'Account Manager & Suivi Opérations
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Routine Quotidienne de l’Account Manager & Opérations',
  'Gestion rigoureuse du portefeuille client : check-in matinal 09h00, suivi des flux Stripe, alertes et synchronisation des livrables.',
  'Gestion de compte',
  'managing',
  '# SOP-MNG-01 — Routine Quotidienne de l’Account Manager & Opérations

## 1. Objectif du Pôle Managing
L''Account Manager est le garant de la promesse client et de la pérennité du modèle économique de Minerva : **zéro friction, communication limpide et rétention supérieure à 90%**.

## 2. Déroulé Quotidien
- **09h00 - 09h45 : Revue de Santé & Alertes**
  - Ouvrir le Cockpit Managing (`/overview`) et vérifier le taux de santé global (cible > 95%).
  - Contrôler les paiements Stripe récents et les factures en attente (`/invoices`).
- **10h00 - 12h00 : Suivi des Chantiers & Équipe**
  - Consulter la charge de travail de l''équipe sur `/team/workload`.
  - Vérifier que chaque tâche prioritaire a un assigné et une échéance claire.
- **14h00 - 16h30 : Communications Clients & Onboardings**
  - Tenir les points d''étape avec les clients en cours de livraison (J+7).
  - Répondre aux questions sur les canaux d''assistance dédiés.
- **16h30 - 17h00 : Bilan & Clôture**
  - Valider l''avancement des jalons et mettre à jour les notes de satisfaction.',
  10,
  'Kael Belceus & Ops Lead',
  true,
  true,
  true,
  1,
  'agency',
  '["Vérifier le tableau de bord /overview et les alertes clients", "Contrôler les encaissements Stripe et factures du jour", "Vérifier l''équilibrage de l''équipe sur /team/workload", "Envoyer les notes de synthèse aux clients actifs"]'::jsonb,
  'Bonjour [Prénom du Client],\n\nVoici le point d''étape hebdomadaire sur votre projet :\n- Jalon actuel : [Nom du jalon] (100% complété)\n- Prochaine étape : Déploiement en conditions réelles prévu le [Date]\n- Tout est parfaitement conforme à notre planning.\n\nExcellente journée,\n[Votre Prénom] — Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Routine Quotidienne de l’Account Manager & Opérations');

-- SOP-MNG-02 : Rôle, Équilibrage de Charge & Capacité d'Équipe (/team/workload)
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rôle, Équilibrage de Charge & Capacité d’Équipe (/team/workload)',
  'Méthodologie de répartition des tâches, maintien du taux d’occupation optimal (75%-85%) et prévention de l’engorgement.',
  'Gestion de compte',
  'managing',
  '# SOP-MNG-02 — Gouvernance de Charge d’Équipe & Capacité

## 1. La Règle d''Or des 80%
Une agence saturée à 100% ne livre pas plus vite : elle accumule des retards et dégrade la qualité. Chez Minerva, **la zone optimale d''occupation d''un collaborateur se situe entre 75% et 85% de sa capacité nominale**.

## 2. Utilisation de l''Écran /team/workload
1. **Vert (< 75%) :** Capacité disponible pour absorber de nouveaux projets ou chantiers R&D.
2. **Émeraude (75% - 85%) :** Régime de croisière idéal, productivité maximale.
3. **Ambre (85% - 95%) :** Attention requise, aucun nouveau jalon sans arbitrage.
4. **Rouge (> 95%) :** Surcharge critique, réaffectation obligatoire de tâches sous 24h.

## 3. Protocole d''Arbitrage Hebdomadaire
Chaque lundi matin, l''Account Manager réajuste les affectations selon la complexité estimée des livrables et la vélocité observée.',
  9,
  'Kael Belceus',
  true,
  false,
  true,
  2,
  'agency',
  '["Ouvrir /team/workload chaque lundi matin", "Identifier les membres en zone ambre ou rouge (> 85%)", "Réaffecter les tâches secondaires vers les membres disponibles", "Confirmer la disponibilité avant de planifier un nouveau lancement client"]'::jsonb,
  'Note d''arbitrage de capacité :\n- Membre concerné : [Nom]\n- Taux d''occupation actuel : [X]%\n- Ajustement : Réaffectation de la tâche [Nom de la tâche] vers [Nouveau responsable] pour rétablir le taux sous 85%.'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rôle, Équilibrage de Charge & Capacité d’Équipe (/team/workload)');

-- SOP-MNG-03 : Rémunération Managing, Primes de Rétention & Score NPS
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rémunération Managing, Primes de Rétention & Score NPS Client',
  'Structure salariale du pôle Managing : fixe mensuel garanti, bonus de fidélisation semestriel (> 90% rétention) et prime de qualité NPS > 65.',
  'Rôles & Rémunération',
  'managing',
  '# SOP-MNG-03 — Rémunération Managing & Primes de Rétention

## 1. Philosophie : La Valeur est dans la Durée
Signer un client crée du chiffre d''affaires ; le retenir crée la pérennité de l''agence. Le pôle Managing est directement incentivé sur la satisfaction réelle et la longévité des comptes.

## 2. Grille de Rémunération du Pôle Operations
- **Fixe Mensuel :** Rémunération fixe garantie selon la taille du portefeuille de comptes géré.
- **Prime de Rétention Semestrielle :**
  - Bonus accordé lorsque le taux de rétention du portefeuille dépasse **90% sur 6 mois consécutifs**.
- **Prime de Satisfaction Client (NPS) :**
  - Bonus trimestriel attribué dès que le Net Promoter Score moyen des clients suivis dépasse **+65**.
- **Bonus d''Upsell Naturel :**
  - 10% sur toute prestation complémentaire souscrite spontanément par un client existant (ex: passage à l''offre Agence Sur Mesure).',
  8,
  'Kael Belceus & Finance Lead',
  false,
  false,
  false,
  3,
  'agency',
  '["Calculer le taux de rétention mensuel sur /overview", "Récolter les avis et évaluations NPS après chaque livraison jalon", "Consigner les opportunités d''upsell naturel dans le CRM", "Préparer la synthèse semestrielle de prime de rétention"]'::jsonb,
  'Formulaire d''évaluation NPS envoyé au client :\n« Sur une échelle de 0 à 10, à quel point recommanderiez-vous l''accompagnement et les systèmes de Minerva à un confrère restaurateur ? »'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rémunération Managing, Primes de Rétention & Score NPS Client');

-- SOP-MNG-04 : Formation Continue en Gestion de Compte & Rétention Client
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Formation Continue en Gestion de Compte & Rétention Client',
  'Techniques avancées de désamorçage de conflits, communication proactive et conduite de revues mensuelles de performance.',
  'Gestion de compte',
  'managing',
  '# SOP-MNG-04 — Formation Continue en Account Management

## 1. La Règle de la Communication Proactive
Un client qui doit vous appeler pour savoir où en est son projet est déjà un client inquiet. La clé d''un compte fidèle réside dans **l''anticipation systématique des questions**.

## 2. Le Format de Revue Mensuelle Haute Valeur (30 minutes)
Chaque mois, l''Account Manager organise une session de bilan articulée en 3 temps :
1. **Les Chiffres Bruts (10 min) :** Volume de commandes directes Flow, économie réalisée sur les commissions tierces, nouveaux avis 5 étoiles.
2. **Les Optimisations Opérationnelles (10 min) :** Ajustements du menu, rapidité de traitement en cuisine, retours des serveurs.
3. **Le Prochain Levier (10 min) :** Proposition d''une amélioration concrète (QR code comptoir, campagne SMS fidélité).',
  11,
  'Kael Belceus',
  false,
  false,
  false,
  4,
  'agency',
  '["Planifier la revue mensuelle au moins 7 jours à l''avance", "Préparer le rapport chiffré des économies réalisées avec Flow", "Documenter les points d''action validés dans un compte-rendu sous 24h", "Transmettre les demandes techniques spécifiques au pôle Tech"]'::jsonb,
  'Ordre du jour de la revue mensuelle client :\n1. Bilan chiffré du mois écoulé (économies commissions & commandes directes)\n2. Retours de l''équipe en salle et en cuisine\n3. Nouveau levier d''optimisation pour le mois prochain'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Formation Continue en Gestion de Compte & Rétention Client');

-- SOP-MNG-05 : Playbook d'Onboarding Client J+2 & Prévention du Churn
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Playbook d’Onboarding Client J+2 & Prévention du Churn',
  'Protocole rigoureux d’accueil des nouveaux clients sous 48 heures : kit de bienvenue, recueil d’assets et cadrage du premier livrable.',
  'Onboarding',
  'managing',
  '# SOP-MNG-05 — Protocole d’Onboarding Client en 48 Heures

## 1. La Fenêtre Critique des 48 Heures
Dès qu''un contrat est signé et l''acompte Stripe 50% encaissé, le client éprouve une légère anxiété post-achat. Le rôle du Managing est de transformer cette anxiété en certitude enthousiaste sous 48h.

## 2. Checklist des Actions J+0 à J+2
- **J+0 (Immédiat) :**
  - Notification automatique de bienvenue générée par Minerva.
  - Création du projet dans `/projects` avec attribution des responsables.
- **J+1 (24h) :**
  - Appel de cadrage rapide de 15 minutes avec le gérant.
  - Collecte des assets de marque (logo HD, menu à jour, accès Google Business).
- **J+2 (48h) :**
  - Envoi de la roadmap visuelle et confirmation de la date du premier prototype fonctionnel J+7.',
  12,
  'Kael Belceus & Ops Lead',
  true,
  true,
  false,
  5,
  'agency',
  '["Créer la fiche projet dans /projects sous 2 heures", "Envoyer le questionnaire express de recueil d''assets", "Planifier le point de cadrage de 15 minutes", "Confirmer par écrit la date de livraison du prototype J+7"]'::jsonb,
  'Bonjour [Prénom],\n\nBienvenue officielle chez Minerva ! Votre dossier est désormais pris en charge par notre équipe.\nVoici les 3 prochaines étapes :\n1. Vos identifiants de portail client sécurisé sont activés ici : [Lien Portail]\n2. Notre designer démarre la modélisation de votre interface dès ce matin\n3. Rendez-vous mardi à 11h pour vous présenter votre premier prototype en réel\n\nBien à vous,\nL''Équipe Managing Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Playbook d’Onboarding Client J+2 & Prévention du Churn');

-- SOP-MNG-06 : Outils, Systèmes & Cockpit Exécutif (/overview & Facturation)
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Outils, Systèmes & Cockpit Exécutif (/overview & Facturation)',
  'Guide d’utilisation du cockpit exécutif Managing, gestion de la facturation Stripe et calcul légal des taxes québécoises (TPS 5% / TVQ 9.975%).',
  'Outils & Systèmes',
  'managing',
  '# SOP-MNG-06 — Systèmes & Cockpit Exécutif Managing

## 1. Le Cockpit Exécutif Managing (/overview)
La vue Managing regroupe les indicateurs vitaux de l''agence :
- **MRR Récurrent Actif :** Revenus récurrents mensuels sous contrat.
- **Taux de Rétention (Cible : 94.2%+) :** Pourcentage de clients fidélisés à 6 mois.
- **Santé Globale de l''Agence (96%) :** Ratio combiné de respect des jalons et de satisfaction.

## 2. Gestion de la Facturation Légale Québécoise
Toutes les factures émises sur `/invoices` respectent scrupuleusement la réglementation fiscale du Québec :
- **TPS (Fédérale) :** 5.000%
- **TVQ (Provinciale) :** 9.975%
- Mention obligatoire des numéros de taxes d''entreprise (NEQ, TPS, TVQ).
- Suivi automatique des relances en cas de retard de paiement.',
  10,
  'Kael Belceus',
  false,
  false,
  false,
  6,
  'agency',
  '["Vérifier les métriques sur le cockpit exécutif /overview", "Générer les factures récurrentes du mois sur /invoices", "Valider la conformité du calcul TPS (5%) et TVQ (9.975%)", "Pointer les réconciliations bancaires avec les virements Stripe"]'::jsonb,
  'Bordereau de facturation conforme Québec :\n- Sous-total hors taxes : [Montant] $ CAD\n- TPS (5%) : [Montant * 0.05] $ CAD\n- TVQ (9.975%) : [Montant * 0.09975] $ CAD\n- Total TTC exigible : [Total] $ CAD\n- Numéro NEQ : 1179832104'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Outils, Systèmes & Cockpit Exécutif (/overview & Facturation)');

-- ────────────────────────────────────────────────────────────────────────────
-- WORKSPACE 3 : TECH & SYSTEMES (6 SOPs)
-- ────────────────────────────────────────────────────────────────────────────

-- SOP-TECH-01 : Routine Quotidienne & Workflow Git Minerva
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Routine Quotidienne & Workflow Git de l’Ingénieur Full-Stack',
  'Cycle de développement strict : synchronisation main, branches dédiées, validation TypeScript sans erreur et commits conventionnels.',
  'Tech & Ingénierie',
  'tech',
  '# SOP-TECH-01 — Routine Quotidienne & Workflow Git de l’Ingénieur

## 1. Principes Fondamentaux du Code Minerva
1. **La branche main est sacrée :** Elle doit être immédiatement déployable sur Vercel à tout instant.
2. **Typage Strict Absolu :** Aucun mot-clé `any` toléré. La commande `npx tsc --noEmit` doit impérativement passer avec 0 erreur avant tout commit.
3. **Architecture Next.js 16 App Router :** Server Components par défaut, Client Components (`use client`) uniquement lorsque l''interactivité locale le requiert.

## 2. Cycle de Travail Quotidien
```bash
# 1. Synchroniser la branche principale
git checkout main && git pull origin main

# 2. Créer la branche de fonctionnalité
git checkout -b feat/nom-du-module

# 3. Démarrer l''environnement local
npm run dev

# 4. Vérifier la validité TypeScript stricte
npx tsc --noEmit

# 5. Commit conventionnel
git commit -m "feat(academy): ajout du support youtube et multi-workspaces"
git push -u origin feat/nom-du-module
```',
  10,
  'Kael Belceus & Lead Tech',
  true,
  true,
  true,
  1,
  'transversal',
  '["Synchroniser git main avant d''entamer un chantier", "Créer une branche avec convention feat/... ou fix/...", "Vérifier que npx tsc --noEmit retourne 0 erreur", "Mettre à jour le CHANGELOG.md avant toute release"]'::jsonb,
  '// Commandes terminal de validation obligatoire avant PR :\ngit status\nnpx tsc --noEmit\ngit commit -m "feat(module): description claire"\ngit push origin [nom-de-branche]'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Routine Quotidienne & Workflow Git de l’Ingénieur Full-Stack');

-- SOP-TECH-02 : Rôle, Responsabilités & Architecture du Système Minerva
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rôle, Responsabilités & Architecture Technique du Système Minerva',
  'Panorama de la stack : Next.js 16 App Router, Supabase PostgreSQL, Row Level Security (RLS), Realtime et intégrations API.',
  'Tech & Ingénierie',
  'tech',
  '# SOP-TECH-02 — Architecture Technique & Rôle Ingénierie

## 1. Périmètre de Responsabilité
L''ingénieur Minerva est garant de la robustesse, de la sécurité et de la vitesse de la plateforme Trequartista et des applications clientes (Flow, Reach).

## 2. Stack Technique de Référence
- **Frontend :** Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide Icons, Shadcn primitives.
- **Backend & DB :** Supabase (PostgreSQL 15+), Row Level Security (RLS) sur 100% des tables, Webhooks Stripe.
- **Serveur MCP :** Route API interne `/api/mcp` exposant les outils agence aux modèles d''IA.
- **Télémétrie :** Table `ai_generation_logs` traquant les tokens, modèles et temps de latence.

## 3. Sécurité des Données & RLS
Chaque table contenant des données d''agence ou de clients doit disposer de politiques RLS explicites limitant les accès aux profils autorisés (`auth.uid() = user_id` ou rôles `admin`/`manager`).',
  12,
  'Kael Belceus & Lead Architect',
  true,
  false,
  true,
  2,
  'transversal',
  '["Auditer les politiques RLS sur toute nouvelle table créée", "Vérifier l''absence de fuite de variables d''environnement privées", "Documenter les nouvelles routes API dans /api/mcp", "Contrôler la conformité Loi 25 québécoise des données stockées"]'::jsonb,
  '-- Exemple de politique RLS standard Minerva :\nALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Acces membres authentifies" ON public.ma_table\n    FOR ALL TO authenticated USING (true) WITH CHECK (true);'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rôle, Responsabilités & Architecture Technique du Système Minerva');

-- SOP-TECH-03 : Rémunération Ingénierie & Primes de Déploiement Flow
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rémunération Ingénierie & Primes de Déploiement Flow',
  'Rémunération mensuelle fixe ingénierie + prime de 100 $ CAD par établissement Flow déployé avec succès + bonus de stabilité infrastructure.',
  'Rôles & Rémunération',
  'tech',
  '# SOP-TECH-03 — Rémunération & Primes Techniques

## 1. Modèle de Rémunération Ingénierie
L''ingénierie chez Minerva valorise à la fois l''excellence du code livré et l''impact opérationnel direct chez nos clients restaurateurs.

## 2. Composantes de Rémunération
1. **Fixe Ingénierie :** Base mensuelle contractuelle selon le niveau de séniorité technique.
2. **Prime de Déploiement Établissement (100 $ CAD / site) :**
   - Chaque déploiement réussi de Minerva Flow chez un restaurateur (imprimante de cuisine configurée, menu en ligne testé, équipe formée) déclenche une prime directe de **100 $ CAD**.
3. **Bonus de Disponibilité & Stabilité Infrastructure :**
   - Prime trimestrielle accordée sur maintien d''un taux de disponibilité plateforme supérieur à **99.9%** sans incident critique de niveau 1.',
  8,
  'Kael Belceus & Finance Lead',
  false,
  false,
  false,
  3,
  'transversal',
  '["Valider la mise en production du restaurant avec l''Account Manager", "Vérifier la bonne réception des commandes tests sur l''imprimante", "Enregistrer le déploiement sur la fiche client pour déclenchement de la prime", "Contrôler la métrique de disponibilité système"]'::jsonb,
  'Rapport de validation de déploiement Flow :\n- Établissement : [Nom du Restaurant]\n- Date de mise en service : [Date]\n- Matériel validé : Imprimante thermique ESC/POS + Dashboard cuisine\n- Prime de déploiement applicable : 100 $ CAD'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rémunération Ingénierie & Primes de Déploiement Flow');

-- SOP-TECH-04 : Formation Continue : Écosystème IA, Serveur MCP & Next.js 16
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Formation Continue : Écosystème IA, Serveur MCP & Next.js 16',
  'Veille technologique active, maîtrise du protocole Model Context Protocol (MCP v2), intégrations Composio et optimisation des performances React 19.',
  'Workflows IA',
  'tech',
  '# SOP-TECH-04 — Formation Continue & Veille Technique de Pointe

## 1. L''Ingénieur Augmenté par l''IA
Chez Minerva, nous concevons des logiciels AI-First. Cela signifie que chaque développeur maîtrise l''utilisation des assistants de code avancés (Antigravity, Claude Code, Cursor) et sait étendre les capacités des LLMs via le protocole MCP.

## 2. Le Serveur MCP Interne (`/api/mcp`)
Le serveur MCP de Minerva expose des outils standardisés :
- Extraction des fiches de leads CRM.
- Consultation et création de SOPs dans l''Académie.
- Synchronisation des documents de cadrage client.
- Déclenchement d''audits d''assurance qualité.

## 3. Ressources & Vidéos Techniques Recommandées
Utilisez l''**Explorateur YouTube** de l''Académie pour visionner les conférences Supabase, les nouveautés Vercel Next.js et les présentations d''architectures agentiques.',
  15,
  'Kael Belceus & AI Lead',
  false,
  false,
  false,
  4,
  'transversal',
  '["Tester les nouveaux outils MCP sur /api/mcp", "Consulter la documentation officielle Next.js 16 dans node_modules/next/dist/docs", "Visionner au moins 1 vidéo d''architecture logicielle par semaine", "Partager une veille technique mensuelle dans le canal #tech"]'::jsonb,
  'curl -X POST https://minerva-trequartista.vercel.app/api/mcp \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer VOTRE_TOKEN_MCP" \\\n  -d ''{"method": "tools/list"}'''
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Formation Continue : Écosystème IA, Serveur MCP & Next.js 16');

-- SOP-TECH-05 : Protocole d'Assurance Qualité & Homologation 20-Points
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Protocole d’Assurance Qualité & Homologation 20-Points Pré-Déploiement',
  'Checklist obligatoire de recette technique avant toute mise en ligne : sécurité RLS, performance LCP/INP, réactivité mobile et conformité TPS/TVQ.',
  'Support & QA',
  'tech',
  '# SOP-TECH-05 — Protocole QA 20-Points Pré-Déploiement

## 1. Règle Absolue d''Homologation
Aucun commit ne rejoint la branche `main` sans avoir validé l''ensemble des points de contrôle qualité. Un bug en production chez un restaurateur en plein rush du samedi soir est inacceptable.

## 2. Les 4 Piliers du Protocole 20-Points
1. **Compilation & Typage (Points 1 à 4) :**
   - `npx tsc --noEmit` avec 0 erreur.
   - Zéro `any` dans les composants nouvellement créés.
   - Déclaration des hooks React strictement au sommet des composants.
2. **Sécurité & Base de Données (Points 5 à 9) :**
   - Politiques RLS actives et testées avec un utilisateur authentifié et anonyme.
   - Script SQL consolidé dans `supabase/deploy_production_complete.sql`.
3. **Expérience Utilisateur & Mobile (Points 10 à 15) :**
   - Test d''affichage tactile responsive (iPhone SE, iPhone 15, iPad).
   - États de chargement propres avec SkeletonCards (zéro écran blanc).
4. **Intégrité Métier (Points 16 à 20) :**
   - Calcul exact des taxes TPS/TVQ sur les devis et factures.
   - Envoi correct des webhooks Stripe et notification temps réel.',
  14,
  'Kael Belceus & QA Officer',
  true,
  true,
  false,
  5,
  'transversal',
  '["Vérifier la compilation stricte TypeScript (npx tsc --noEmit)", "Tester la réactivité sur écran mobile 360px", "Valider les politiques RLS sur les tables modifiées", "Vérifier la présence de Skeleton sur les états de chargement", "Mettre à jour CHANGELOG.md"]'::jsonb,
  '// Exécution de l''homologation 20-points Minerva :\nnpx tsc --noEmit\ngit diff --check\n# Vérifier qu''aucune variable secrète n''est visible dans le commit'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Protocole d’Assurance Qualité & Homologation 20-Points Pré-Déploiement');

-- SOP-TECH-06 : Intégrations Matérielles POS Flow & Déploiement Vercel
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Intégrations Matérielles POS Flow & Déploiement Vercel',
  'Architecture d’impression thermique ESC/POS (Bluetooth/Wi-Fi), gestion des websockets de commande directe et déploiement Vercel Edge.',
  'Tech & Ingénierie',
  'tech',
  '# SOP-TECH-06 — Intégrations Matérielles POS & Déploiement

## 1. Le Défi Matériel en Restauration
Minerva Flow se distingue par sa capacité à imprimer instantanément les bons de commande en cuisine sans nécessiter de tablette coûteuse dédiée.

## 2. Protocole d''Impression Thermique ESC/POS
- **Connexion :** Web Bluetooth API ou passerelle réseau locale IP (port standard 9100).
- **Format de ticket :** 80mm de largeur standard, typographie bold pour les allergies et modifications de plats.
- **Signal sonore (Buzzer) :** Déclenché automatiquement à chaque nouvelle commande en cuisine tant qu''elle n''est pas acquittée.

## 3. Pipeline de Déploiement Vercel
- Branche `main` connectée en déploiement continu automatique sur Vercel.
- Variables d''environnement gérées au niveau de l''organisation Vercel.
- Cache de révalidation optimisé pour les pages publiques de commande en ligne.',
  12,
  'Kael Belceus & Hardware Lead',
  false,
  false,
  false,
  6,
  'flow',
  '["Tester la connexion avec l''imprimante thermique de test", "Vérifier l''émission du signal sonore sur nouvelle commande", "Contrôler la mise en page du ticket de caisse 80mm", "Vérifier les logs de déploiement Vercel après le push"]'::jsonb,
  '// Test de payload d''impression ticket ESC/POS :\n{\n  "restaurant_id": "resto-sample",\n  "order_number": "#1042",\n  "items": [{"name": "Burger Signature", "qty": 2, "notes": "Sans oignons"}],\n  "total_cad": 44.00\n}'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Intégrations Matérielles POS Flow & Déploiement Vercel');
