-- Migration : Expansion des SOPs Managing (6 procédures complètes)
-- Date : 2026-09-04
-- Auteur : Minerva System

INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Routine Quotidienne de l’Account Manager & Opérations',
  'Structure de la journée de l’AM : cockpit /overview, rituels matinaux, suivi des jalons de production et synchronisation client.',
  'Gestion de compte',
  'managing',
  '# SOP-MNG-01 — Routine Quotidienne de l’Account Manager & Opérations

## 1. Ouverture de Journée (08h30 - 09h15)
1. Consulter le cockpit /overview : vérifier le score de santé global du portefeuille.
2. Contrôler les alertes Stripe : vérifier que les prélèvements d’abonnements MRR sont passés sans échec.
3. Scanner la boîte de support du portail client (/portal) et traiter les demandes prioritaires sous 60 minutes.

## 2. Point de Synchronisation Technique (11h00)
- Contrôler l’avancement des livrables de production (vidéos, refontes web, QR Flow).
- Mettre à jour les jalons de projet pour que les clients voient l’état d’avancement dans leur portail.

## 3. Clôture de Journée (17h00)
- Valider que chaque question client en suspens a reçu un accusé de réception ou une réponse résolue.
- Vérifier la charge d’équipe sur /team/workload pour anticiper le sprint du lendemain.',
  8,
  'Kael Belceus & Operations Lead',
  true,
  true,
  true,
  1,
  'agency',
  '["Vérifier le tableau de bord /overview et les alertes clients", "Contrôler les encaissements Stripe et les abonnements MRR", "Traiter les tickets et retours livrables du portail client", "Faire le point technique avec l’équipe de dev et production média", "Envoyer un récapitulatif aux clients ayant un jalon livré aujourd’hui"]'::jsonb,
  'Bonjour [Prénom du Client],

Voici le point d’étape quotidien sur votre projet chez Minerva :
- Jalon complété : [Nom du jalon]
- Prochaine étape : Déploiement prévu le [Date]

Votre portail est à jour : vous pouvez consulter les aperçus en direct.

Bien cordialement,
[Votre Prénom] — Minerva Operations'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Routine Quotidienne de l’Account Manager & Opérations');

INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Playbook d’Onboarding Client 48h & Kickoff Immersion',
  'Protocole standardisé de prise en charge dès la signature de la proposition : création du portail, canal dédié et atelier de cadrage.',
  'Onboarding',
  'managing',
  '# SOP-MNG-02 — Playbook d’Onboarding Client 48h

## 1. Phase H+2 (Immédiate après acompte)
- Dès la signature électronique et l’acompte 50% Stripe, le client est automatiquement créé dans Trequartista.
- Générer et tester son jeton de portail client sécurisé (/portal/[token]).
- Créer le canal Slack/WhatsApp dédié ou inviter le contact principal aux rituels Minerva.

## 2. Phase J+1 (Atelier Kickoff 45 min)
- Présentation de l’Account Manager dédié et des engagements contractuels.
- Collecte des accès : Stripe, Google Business Profile, Instagram, domaine Web.
- Définition du rétroplanning 30 jours avec les 4 jalons clés.

## 3. Phase J+2 (Livraison du Pack de Bienvenue)
- Envoi de la vidéo de bienvenue personnalisée Loom (2 min).
- Validation du premier livrable d’étape dans le portail client.',
  10,
  'Kael Belceus & Operations Lead',
  true,
  true,
  true,
  2,
  'agency',
  '["Vérifier la réception de l’acompte Stripe 50%", "Générer le jeton de portail client et configurer son espace", "Planifier la session d’immersion Kickoff (45 min)", "Récupérer les accès nécessaires (réseaux, Stripe, domaine)", "Envoyer le lien du portail client avec la checklist de bienvenue"]'::jsonb,
  'Bonjour [Prénom],

Toute l’équipe Minerva est ravie de vous compter parmi nos partenaires privilégiés !

Votre portail dédié est d’ores et déjà accessible via ce lien direct :
👉 [Lien du portail client]

Nous nous retrouvons pour notre atelier de cadrage ce [Jour] à [Heure].

À très vite,
[Votre Prénom] — Account Manager Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Playbook d’Onboarding Client 48h & Kickoff Immersion');

INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Rétention & Rituels Hebdomadaires Anti-Churn',
  'Stratégie de communication proactive, suivi du score de santé client, détection des signaux faibles et rituels de satisfaction.',
  'Gestion de compte',
  'managing',
  '# SOP-MNG-03 — Rétention & Rituels Anti-Churn

## 1. La Philosophie Anti-Churn de Minerva
Un client ne churn jamais par surprise : le désengagement commence toujours par des silences ou des micro-frustrations non exprimées. Notre rôle est de devancer chaque attente.

## 2. Suivi du Score de Santé Client (0 à 100)
- **Vert (> 80) :** Client ravi, promoteur actif. Idéal pour demander un témoignage vidéo ou initier un upsell.
- **Ambre (60 - 79) :** Attention requise, retard de validation de livrable ou questions techniques en attente. Appel proactif obligatoire sous 48h.
- **Rouge (< 60) :** Alerte churn critique. Déclenchement immédiat d’une réunion de déblocage avec le Lead Operations.

## 3. Les Rituels Hebdomadaires
- Vendredi 15h : Synthèse d’impact hebdomadaire transmise via le portail client (métriques de visites, commandes générées, livrables validés).
- Aucun client ne doit passer 7 jours ouvrés sans nouvelle tangible de l’équipe.',
  9,
  'Kael Belceus & Operations Lead',
  true,
  false,
  true,
  3,
  'agency',
  '["Passer en revue les scores de santé de chaque compte client", "Repérer les livrables en attente de révision depuis plus de 4 jours", "Envoyer la synthèse hebdomadaire vendredi avant 16h", "Appeler les clients ayant un score inférieur à 70"]'::jsonb,
  'Bonjour [Prénom],

C’est [Votre Prénom] de Minerva. Je voulais m’assurer que tout se déroule parfaitement suite à la livraison de notre dernier module.

Auriez-vous 5 minutes demain pour un échange rapide de calage ?

À votre écoute,
[Votre Prénom]'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Rétention & Rituels Hebdomadaires Anti-Churn');

INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Facturation Stripe, Taxes QC & Recouvrement Automatisé',
  'Gestion des abonnements récurrents MRR, application automatique TPS (5%) et TVQ (9.975%), et protocole de dunning en cas d’échec de paiement.',
  'Outils & Systèmes',
  'managing',
  '# SOP-MNG-04 — Facturation Stripe, Taxes QC & Recouvrement

## 1. Structure Fiscale Québécoise
Chaque facture émise par Minerva Trequartista inclut :
- Sous-total des services (ex: abonnement mensuel 500 $ CAD).
- TPS (5.000%).
- TVQ (9.975%).
- Montant Total TTC débité via la passerelle Stripe.

## 2. Déclenchement des Abonnements
- Le client active son abonnement en 1 clic directement depuis son portail (/portal/[token]).
- La facture correspondante est automatiquement archivée et téléchargeable en PDF.

## 3. Procédure de Recouvrement (Dunning 3 Étapes)
1. **J+0 (Échec Stripe) :** Notification automatique par email avec lien vers le Stripe Billing Customer Portal pour mettre à jour la carte.
2. **J+3 :** Message personnalisé de l’AM par SMS ou email d’assistance bienveillante.
3. **J+7 :** Suspension temporaire des livrables non essentiels jusqu’à régularisation.',
  7,
  'Kael Belceus & Finance Lead',
  true,
  false,
  true,
  4,
  'agency',
  '["Vérifier que les clés Stripe sont actives et synchronisées", "Contrôler le journal des échecs de paiement hebdomadaires", "Vérifier l’exactitude des taux TPS et TVQ sur les factures émises", "Accompagner le client dans la mise à jour de son moyen de paiement"]'::jsonb,
  'Bonjour [Prénom],

Nous avons constaté un léger souci lors du renouvellement automatique de votre abonnement Minerva via votre carte bancaire.

Vous pouvez mettre à jour vos coordonnées bancaires en toute sécurité en 1 clic ici :
👉 [Lien Portail Facturation Stripe]

N’hésitez pas si vous avez la moindre question !

Bien à vous,
L’équipe Facturation Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Facturation Stripe, Taxes QC & Recouvrement Automatisé');

INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'Revue Trimestrielle (QBR), Upsell & Offboarding Respectueux',
  'Conduite de la revue d’impact à 90 jours, présentation du ROI réel, proposition d’extensions studio et protocole de sortie propre.',
  'Stratégie & Offre',
  'managing',
  '# SOP-MNG-06 — Revue Trimestrielle (QBR), Upsell & Offboarding

## 1. La Revue Trimestrielle d’Impact (QBR)
Tous les 90 jours, l’Account Manager organise une revue stratégique de 30 minutes avec le dirigeant client :
- Bilan chiffré des gains : commandes directes captées, économies de commissions tierces, nouveaux avis clients.
- Restitution des métriques d’acquisition et de conversion.

## 2. Opportunités d’Upsell Naturel
Lorsque les résultats dépassent les attentes, proposer l’intégration de modules complémentaires du catalogue Studio :
- Production vidéo cinéma 9:16 mensuelle récurrente.
- Automatisation des réservations et agent vocal IA.
- Refonte Framer de page événementielle.

## 3. Offboarding Respectueux & Clé en Main
Si un client souhaite suspendre son partenariat :
- Zéro friction, aucune rétention d’otage de code ou de données.
- Export complet de la base de données clients et des visuels livrés.
- Clôture propre dans Stripe et conservation d’une relation cordiale pour de futurs projets.',
  11,
  'Kael Belceus & Operations Lead',
  true,
  true,
  true,
  6,
  'agency',
  '["Générer le rapport de performance trimestriel sur /portal", "Fixer le rendez-vous QBR 15 jours avant l’échéance des 90 jours", "Identifier les leviers d’optimisation et offres studio pertinentes", "En cas d’offboarding, exporter les assets et révoquer les accès proprement"]'::jsonb,
  'Bonjour [Prénom],

Voilà déjà 3 mois que nous collaborons ensemble sur l’accélération de votre établissement !

Je serais ravi de vous présenter notre bilan d’impact trimestriel et les perspectives pour le trimestre à venir lors d’un échange de 30 minutes.

Quelles seraient vos disponibilités la semaine prochaine ?

Bien à vous,
[Votre Prénom] — Account Manager Minerva'
WHERE NOT EXISTS (SELECT 1 FROM public.academy_sops WHERE title = 'Revue Trimestrielle (QBR), Upsell & Offboarding Respectueux');
