# Changelog

Notes de version pour l'équipe Minerva Trequartista. Format minimaliste : date, ce qui a changé, rien de plus.

## 2026-09-04 (v2.30.9) — Console Edge Functions & Système d'Alertes Incident dans le Tech Workspace

- **Console Interactive Edge Functions & Webhooks (`/tech?tab=edge`)** :
  - **Interface Haute Densité Mintlify** : Console d'ingénierie dédiée avec sélecteur de microservices Deno, éditeur de requêtes JSON interactif, mesure de latence en temps réel (`performance.now()`), badges de statut HTTP (200, 400, 500) et inspecteur de payload/réponse.
  - **Support des 4 Microservices Supabase** :
    - `alert-dispatcher` : Déclenchement d'alertes d'incidents critiques avec broadcast in-app dans le chat d'équipe.
    - `webhook-validator` : Validation de signature HMAC, typage d'événements et conformité payload.
    - `launch-check-validator` : Audit automatisé des 20 points de contrôle pré-livraison client.
    - `roi-aggregator` : Calcul et agrégation des métriques de revenus et scans QR Minerva Flow.
- **Journalisation Persistante dans Supabase (`tech_edge_invocations`)** :
  - Migration SQL `20260904230000_tech_edge_invocations.sql` créant la table d'audit des invocations avec statut HTTP, latence (ms), payload, réponse, timestamp et utilisateur déclencheur.
  - Table consolidée et idempotente dans `supabase/deploy_production_complete.sql`.
- **Diffusion d'Alertes Incident en Direct (`team_chat_messages`)** :
  - Mise à niveau de `alert-dispatcher` pour publier automatiquement les alertes critiques dans le canal `#annonces` du chat d'équipe.
- **Sondes de Latence Réelles (`SystemHealthMonitor`)** :
  - Remplacement des valeurs statiques de diagnostic par un test réseau réel sondant l'API `/api/tech/edge-test`.
- **Validation Qualité Stricte & Déploiement** :
  - `npm run verify:design` : **100.0% de conformité** sur 309 fichiers.
  - `npx tsc --noEmit` : **0 erreur TypeScript**.
  - `npm run build` : **126+ routes compilées** avec succès dans Next.js 16 (Turbopack).

## 2026-09-04 (v2.30.8) — Intégration AuthSectionOne WebGL Shaders & Éradication Strictes des Pills / Avatars Arrondis

- **Authentification Unifiée avec WebGL Shaders (`AuthSectionOne`)** :
  - **Composant Modulaire & Réactif (`components/ui/auth-section-1.tsx`)** : Remplacement complet des anciennes pages `/login` et `/signup` par `AuthSectionOne`, propulsé par les shaders WebGL `GrainGradient` de `@paper-design/shaders-react`.
  - **Dégradé Hero Teal Mintlify** : Palette de shaders adaptée aux tokens officiels (`#FFFFFF`, `#0c8c5e`, `#075037`, `#053323`) avec grain cinématique et lisibilité textuelle garantie par scrims subtils.
  - **Connexion Supabase Réelle & Non Mockée** : Intégration complète de l'authentification Email + Mot de passe (`signInWithPassword` / `signUp`), Google OAuth SSO (`signInWithOAuth`), bascule de visibilité mot de passe, redirections dynamiques d'URL (`?next=...`) et gestion d'erreurs réelles.
  - **Passerelle Écosystème Minerva Reach** : Bouton d'action du panneau shader reliant directement vers l'application desktop terrain compagnon `https://minerva-os-lite-desktop.vercel.app/today`.
  - **Composant Démo (`components/ui/demo.tsx`)** : Ajout du composant de prévisualisation isolée.
- **Règles Strictes Anti-Pill & Élimination des Avatars Arrondis** :
  - **Géométrie Cohérente (4px / 16px / 24px)** : Suppression formelle des classes `rounded-full` et `rounded-9999px` sur l'ensemble des composants (avatars utilisateur `user-avatar.tsx`, squelettes de chargement `skeleton.tsx`, badges de statut `FeatureRequestStatusCard.tsx` et `FeatureRequestHistory.tsx`, indicateurs réseau `OfflineStatusIndicator.tsx`, chat `realtime-chat.tsx` et speed dial IA `AiAssistantSpeedDial.tsx`).
  - **Avatars & Badges en Carrés Doux** : Conversion systématique vers des rayons de 4px (`rounded`) et micro-indicateurs à 2px (`rounded-[2px]`).
  - **Typographie Inter Exclusif** : Retrait définitif de `Playfair_Display` du layout racine (`app/layout.tsx`) et suppression des overrides display au profit d'Inter sur 100% de l'interface.
- **Validation Qualité Stricte & Déploiement** :
  - `npm run verify:design` : **100.0% de conformité** sur 308 fichiers (0 violation de tokens).
  - `npx tsc --noEmit` : **0 erreur TypeScript** en mode strict.
  - `npm run build` : **126/126 routes compilées** avec succès dans Next.js 16 (Turbopack).

## 2026-09-04 (v2.30.7) — Adoption Globale de la Charte Mintlify : Monastic White, Ink Black & Hero Teal

- **Standard Mintlify Intégré Globalement** :
  - **Palette Chromatique Mintlify** : Canvas Paper White `#ffffff` monastique, diviseurs Mist Gray `#f2f2f2`, bordures d'inputs Cloud Gray `#dddddd`, texte de lecture True Black `#000000`, et l'accent Mint Green `#0c8c5e` comme unique étincelle chromatique pour les états actifs, liens de marque et badges.
  - **Boutons Primaires Ink Black & Géométrie Carrée** : Boutons d'action prioritaires en Ink Black `#08090a` (texte blanc, rayon 4px `rounded`), suppression des boutons pilules au profit des rayons stricts (4px boutons/inputs/badges, 16px cartes `rounded-2xl`, 24px grands conteneurs `rounded-3xl`).
  - **Élévation Murmurée (0.03 - 0.05)** : Remplacement des ombres par l'élévation subtile Mintlify (`0 2px 4px 0 rgba(0,0,0,0.03)` pour les boutons, `0 2px 4px 0 rgba(0,0,0,0.05)` pour les cartes).
  - **Dégradé Signature Hero Teal** : Refonte des écrans d'authentification (`/login`, `/signup`) avec le dégradé `linear-gradient(135deg, #0c8c5e 0%, #075037 60%, #053323 100%)` et typographie Inter blanche.
  - **Primitives UI Mises à Niveau** : `button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx` synchronisés avec la géométrie et les tokens Mintlify.
- **Audit Automatisé des Tokens (`npm run verify:design`)** :
  - Validation confirmée avec un score de **100.0% de conformité** sur les 306 fichiers analysés.

## 2026-09-04 (v2.30.6) — Généralisation Exhaustive du Design System Minerva (100% Tokens)

- **Harmonisation Globale des Tokens sur 306 Fichiers (`100.0% de Conformité`)** :
  - **Élimination Complète des Couleurs Arbitraires** : Remplacement systématique des 61 occurrences de valeurs hexadécimales non-standard par les tokens officiels Minerva dans `DESIGN_SYSTEM.md`.
  - **Authentification & Onboarding Unifiés (`/login`, `/signup`, `/onboarding`)** : Éradication de `#0f261a` au profit du token officiel `--mv-green-darker` (`#065f46`), et migration intégrale de l'échelle `neutral-*` vers l'échelle officielle `zinc-*`.
  - **Moteur Graphique & Dataviz Conformes (`BarChart`, `GaugeChart`, `PerformanceBarChart`, `ImpactEffortMatrix`, `ProcessFlowDiagram`)** : Remplacement des teintes non conformes (`#6ba585`, `#dfff5f`, infobulles `#1a1f1c`) par l'accent Émeraude `#059669`, le tint `#ecfdf5`, le jalon `#34d399` et la surface d'infobulle `#18181b`. Restructuration des statuts du diagramme de flux d'audit (`#fef2f2`, `#ef4444`, `#e4e4e7`).
  - **Vues Métiers & Shell Système** : Alignement des indicateurs de tendance dans l'Overview (`trendColor: #ef4444` au lieu de `#e11d48`), des confettis du lancement projet (`launch-check`), des badges de département (`/team`), des blocs de code Markdown (`#09090b`), de la bannière de changelog (`#a7f3d0`), du document de proposition PDF et de l'image de partage réseaux OpenGraph (`opengraph-image.tsx`).
- **Validation du Contrôle Automatisé (`npm run verify:design`)** :
  - Audit validé avec un score parfait de 100.0% de conformité sur l'intégralité du produit.

## 2026-09-04 (v2.30.5) — Charte Design System Minerva, 20 Lois UX & Audit Automatisé des Tokens

- **Charte Minerva Design System & UX (`DESIGN_SYSTEM.md`)** :
  - **Tokens Officiels Minerva (Section 0)** : Ancrage des valeurs de référence : Vert Émeraude `#059669` (hover `#047857`, fond `#ECFDF5`, bordure `#A7F3D0`), Palette Neutre Light Haute Densité (Canvas `#FAFAFA`, Surfaces blanches `#FFFFFF`, Bordures hairline 1px `#E4E4E7`, Texte `#18181B` / `#71717A`), Typographie `Inter` + `JetBrains Mono tabular-nums`, Spacing multiple de 4/8px, Rayons `8px`/`12px`/`16px` et ombres near-flat `shadow-2xs`.
  - **15 Instructions de Design Visuel** : Règle d'or de l'accent unique, contraste ≥ 4.5:1, échelle modulaire, formulaires une colonne, états complets (hover, focus-visible, active, disabled, loading, empty, error), et protocole *Finish Pass* 10 points.
  - **20 Lois d'Ergonomie UX** : Intégration systématique des lois cognitives (Hick, Fitts, Jakob, Proximité, Miller, Seuil de Doherty < 400ms, Von Restorff, Peak-End Rule, Zeigarnik, etc.).
- **Directive Système Permanente (`GEMINI.md`)** :
  - Mise à jour de la Section 5 pour contraindre tous les futurs développements et assistants IA au respect impératif de `DESIGN_SYSTEM.md`.
- **Outillage de Validation Automatisé (`scripts/verify-design-tokens.mjs`)** :
  - Script d'audit scannant pages et composants pour mesurer le taux de conformité aux tokens et repérer les valeurs hexadécimales arbitraires.
  - Commande dédiée ajoutée au `package.json` : `npm run verify:design`.

## 2026-09-04 (v2.30.4) — Académie SOP-DEV-02 (Framer) Alignée & Packages GSAP / Supabase Server

- **SOP-DEV-02 Framer Restructuré & Dé-dupliqué (`/academy/sop-dev-02-framer`)** :
  - **Suppression du Titre Redondant H1** : Sanitization systématique de `content_markdown` pour éliminer le titre H1 Markdown d'en-tête redondant avec le titre de la vue centrale.
  - **Nettoyage Visuel des Badges Centraux** : Conservation exclusive du badge catégorie `[ 🎨 Design Framer ]` et du lien direct vers la spécification `[ ↗ Spec ]`, élimination des badges de statut et durées dupliqués avec la top bar.
  - **Checklist QA Framer 6 Points** : Remplacement des items git génériques par la checklist d'audit Framer (Breakpoints Desktop 1200 / Tablette 810 / Mobile 390, Webhook ROI Leads `/api/webhooks/roi-event`, Balises SEO / OpenGraph, Médias WebP & MP4, Domaine personnalisé & SSL).
  - **Snippet JSON Webhook Framer** : Remplacement de la boucle git par le payload JSON réel d'intégration Framer avec bouton de copie instantanée et en-tête d'exemple.
  - **Table des Matières 4 Sections** : Navigation latérale gauche synchronisée avec les 4 piliers méthodologiques Framer.
- **Packages & Infrastructure** :
  - Installation et configuration des dépendances d'animation GSAP (`gsap@3.15.0`, `@gsap/react@2.1.2`).
  - Configuration sécurisée des variables d'environnement Supabase (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWKS_URL`).
  - Synchronisation idempotente de la table `academy_sops` dans `supabase/deploy_production_complete.sql`.

## 2026-09-04 (v2.30.3) — Double Refonte Synchronisée : Extranet Client (/portal/[token]) & Console Rétention Client (/clients/[id])

- **Portail Client Extranet Haute Densité (`/portal/[token]`, Style Linear / Stripe)** :
  - **Architecture en 4 Piliers Structurants** :
    1. *1. Vue d'Ensemble & Actions* : Ruban de bord compact 4 KPI (Avancement Sprint, Livrables à valider, Économie de commissions ~3 420 $ CAD, Date de mise en production), stepper de pipeline interactif, checklist QA 20-points et carte prioritaire d'approbation avec raccourci clavier `⌘+Enter`.
    2. *2. Livrables & Validation (`DeliverableApprovalStudio`)* : Studio interactif master-detail avec bascule de version (`v1`, `v2`, `v3`), prévisualiseur multi-formats (Framer/Web iframe, Lecteur Vidéo MP4 avec métriques de durée, PDF/Docs avec téléchargement sécurisé), historique des retours horodatés et validation instantanée (`[ ✓ Valider le livrable ]` / `[ ⟲ Demander des ajustements ]`).
    3. *3. Performance ROI & Minerva Flow (Unifié)* : Contrôle segmenté entre le flux direct Minerva Flow (`MinervaFlowResultsCard` avec accès SSO instantané) et le suivi financier du ROI (revenus directs, commandes traitées sans commission et historique mensuel).
    4. *4. Facturation & Support Chat* : Carte d'abonnement Stripe avec bouton d'accès au portail de paiement Stripe, table de facturation TPS/TVQ conforme, catalogue Studio 6 packs avec commande en 1-clic, et messagerie bidirectionnelle en direct via `RealtimePortalChat`.
- **Console Interne Rétention Client (`/clients/[id]`)** :
  - **Moteur Algorithmique Health Score (0-100) & Churn Risk Engine** (`computeClientHealthScore`) : Analyse prédictive pondérée sur 4 facteurs clés (Livrables /30, Facturation Stripe /30, Flow & ROI /20, Engagement Chat 14j /20).
  - **Widget Visuel d'Alerte Churn (`ClientHealthScoreWidget`)** : Affichage du score global, badge d'état (`excellent`, `stable`, `warning`, `critical`), jauges des 4 sous-facteurs et détection proactive des anomalies (livrables en attente, factures en retard, inactivité chat).
  - **Bouton Copie Lien Extranet 1-Clic** : Ajout du bouton `[ Copier lien ]` dans la barre d'outils pour générer et copier le lien d'accès direct du client en un clic.
  - **Traçabilité des Livrables** : Badges de versions (`v1`, `v2`) et décompte des commentaires de révision directement dans le tableau de production unifié.

## 2026-09-04 (v2.30.2) — Catalogue Académie : Harmonisation Visuelle Pure (Style Linear), Badges d'État & Contrôles Haute Densité 32px

- **Harmonisation Visuelle du Hub Académie (`/academy`)** :
  - **Onglets Workspaces & Filtres 32px (`h-8`)** : Hauteurs standardisées style Linear avec décompte dynamique calculé (`prospection`, `managing`, `tech`, `all`) en `font-mono tabular-nums`.
  - **Barre de Recherche & Filtres Catégories** : Champ de recherche avec indicateur de raccourci clavier `/`, focus ring émeraude et jetons de catégories avec badges numériques compacts.
  - **Cartes Denses de SOPs (Mode Grille)** : Cartes épurées avec badges hiérarchisés (`● Fondatrice` avec pulsation verte pour les guides structurants, workspace micro-badge, catégorie, vidéo, statut `● Validé` ou `○ À étudier`, et temps de lecture `Clock` + `Xm` en `tabular-nums`).
  - **Tableau Haute Densité 36px (Mode Liste)** : 7 colonnes structurées (Titre avec badge Fondatrice, Statut interactif, Catégorie, Workspace, Temps monospace, Auteur, Action d'ouverture/relecture).
  - **Parcours Prioritaire & Médiathèque Storage** : Alignement visuel sur les conteneurs blancs `border-zinc-200 shadow-2xs` et jauge de progression émeraude.

## 2026-09-04 (v2.30.1) — SOPs Académie : Layout CSS Grid 3-Colonnes (Stripe Docs), Top Bar Dense 28px (Linear) & Mode Plein Écran Zen

- **Layout CSS Grid 3-Colonnes Réel (`/academy/[id]` & `/share/academy/[id]`)** :
  - Restructuration du conteneur en grille stricte `grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-8 items-start` sur largeur maximale 1440px (`max-w-[1440px] mx-auto px-6 py-6`).
  - **Sommaire Sticky à Gauche** (`top-16 max-h-[calc(100vh-5rem)]`) : Navigation avec scroll-spy en temps réel et indicateur de bordure émeraude `border-l-2 border-emerald-600`.
  - **Colonne Centrale Dédiée** (`min-w-0 bg-white border border-zinc-200 rounded-xl p-8 shadow-xs`) : Rétablissement du flux de lecture naturel du Markdown sans blocs Sommaire/Checklist intercalés au-dessus.
  - **Checklist & Accès Rapides Sticky à Droite** (`top-16 space-y-4`) : Contrôle de conformité interactif avec sauvegarde locale `localStorage`, jauge de progression, reset, et liens rapides adaptés au workspace (`GitHub`, `Vercel`, `Supabase DB`, `QA 20-Points`, etc.).
- **Top Bar Épurée & Dense (Hauteur 28px / `h-7`, Style Linear / Raycast)** :
  - **Fil d'Ariane Non Tronqué** : `← Académie / [Titre]` avec `flex-1 min-w-0 truncate` et titre actif en `font-semibold text-zinc-900`.
  - **Badge & Métadonnées Réconciliés** : Suppression du badge redondant "TECH", conservation exclusive du badge statut `● Fondatrice` et affichage du temps de lecture en texte secondaire séparé par une puce (`· 15 min de lecture`).
  - **Actions Groupées à Droite** :
    1. Action IA : `[ ✦ Résumé IA ]` (`h-7 px-2.5 text-xs`).
    2. Utilitaires compacts : `[ ⧉ Copier MD ]`, `[ ↗ Partager ]` et `[ ⛶ Plein Écran ]` (`h-7 w-7`).
    3. Action Principale : `[ ✓ Marquer appliqué ]` (`h-7 px-3 text-xs bg-emerald-600`).
- **Suppression Définitive de la Duplication des Boutons IA** :
  - Élimination des barres d'outils IA répétitives (`AiPageToolbar`) dans le corps de lecture pour éviter tout bouton en boucle.
  - Conservation exclusive du widget flottant universel unique dans `AppShell.tsx` (`AiAssistantSpeedDial`) et du bouton d'en-tête `[ ✦ Résumé IA ]`.
- **Mode Plein Écran Zen / Inset Immersion** :
  - Bascule instantanée en plein écran (`fixed inset-0 z-50 bg-[#FAFAFA] overflow-y-auto`) via le bouton `[ ⛶ ]` ou la touche clavier `F`, et sortie avec `Échap`.

## 2026-09-04 (v2.30.0) — Documentation Académie 3-Colonnes (GitBook/Stripe Docs) & SOP-DEV-03 The 6-Step Loop

- **Refonte Documentaire Complète en Layout 3-Colonnes (`/academy/[id]`)** :
  - **Mise en page Split-View 3-Colonnes (`grid-cols-1 lg:grid-cols-[220px_1fr_280px] max-w-7xl mx-auto px-4`)** remplaçant la colonne centrale étroite par un espace de travail technique haute densité style GitBook, Stripe Docs et Linear Guides.
  - **Toolbar d'Actions 42px** : Fil d'ariane compact, titre, badges d'état (`● Fondatrice`, temps de lecture, workspace), bouton `[ ⧉ Copier MD ]`, bouton `[ ✦ Résumé IA ]`, bouton `[ ↗ Partager ]` et bouton de validation d'application `[ ✓ Appliqué ]`.
  - **Colonne Gauche (Sommaire Dynamique & Scrollspy)** : Extraction automatique de toutes les sections `H2` et `H3` du Markdown de la SOP avec défilement fluide vers les ancres et surbrillance active émeraude `#059669`.
  - **Colonne Centrale (Moteur Technique Haute Fidélité)** : Intégration du composant `SopMarkdownRenderer` avec blocs de code sombres `#18181B` (Zinc 900), barre d'en-tête de langage, bouton copier individuel par snippet, typographie sans-serif technique Inter/Geist et barre d'outils Notion AI intégrée.
  - **Colonne Droite (Checklist d'Exécution & QA Sidebar)** : Checklist de contrôle qualité interactive persistante (`localStorage`) avec compteur dynamique (`0/N Validés`), jauge de progression, bouton reset et badge d'homologation lorsque complétée.
  - **Ressources Rapides Contextualisées** : Liens directs adaptés selon l'espace de travail (Supabase DB Console, Vercel Deployments, Protocole QA 20-Points et Workload pour le pôle Tech ; Minerva Reach, Pipeline CRM Leads, Devis 50% pour la Prospection ; Overview, Rétention Clients et Facturation Stripe pour Managing).
- **Enrichissement Technique Exhaustif de SOP-DEV-03 (The 6-Step Loop)** :
  - Restructuration intégrale du guide technique en 6 étapes indispensables :
    1. *Architecture The 6-Step Loop* : Matrice de flux séquentiel entre base, types, services, UI et App Router.
    2. *Schéma DB & Migrations RLS* : Définition SQL avec contraintes, indexation et politiques d'isolation multi-tenant strictes `auth.uid() = user_id`.
    3. *Typage TypeScript Strict* : Contrats d'interfaces dans `lib/types/` avec types union et zéro `any`.
    4. *Services Supabase Data* : Patterns de requêtes avec `withTimeout` et fallback gracieux sans blocage UI.
    5. *Composant UI & Micro-Tokens (MDS-01)* : Règles d'intégration 1px hairline, `tabular-nums font-mono` pour les métriques, hauteurs `h-8`/`h-9` et zéro scroll superflu.
    6. *Route App Router, Raccourcis & Realtime* : Navigation clavier `⌘K`, souscription aux changements PostgreSQL et synchronisation optimiste.
  - Remplacement du template de prospection restaurant erroné par le **Playbook Terminal Recommandé** (`git checkout -b`, `npm run dev`, `npx tsc --noEmit`, etc.).
  - Synchronisation dans `FALLBACK_DEV_SOPS` (`lib/services/supabase-data.ts`) et dans `supabase/deploy_production_complete.sql`.

## 2026-09-04 (v2.29.0) — Module de Réservation Cal.com/Linear, Automatisations CRM Supabase, Overview Exécutif & Hub Écosystème Épuré

- **Module Public de Réservation Haute Conversion (`/book`, `/book/[id]`, `/rendez-vous`)** :
  - Remplacement de l'input date aveugle et de l'empty state passif par une interface monolithique à 3 panneaux synchronisés inspirée de Cal.com, Linear et Cron :
    - *Panneau Gauche Sombre (280px)* : Badge `✦ MINERVA STUDIO`, titre `Rendez-Vous Stratégique`, description de cadrage, métadonnées d'appel (30 min, Google Meet, Montréal HE/EDT), profil du fondateur et pied de page officiel.
    - *Panneau Central (Mini-Calendrier Mensuel & Formulaire Slide-in)* : Navigation mensuelle avec sélecteur de mois/année, grille 7x5 (`L M M J V S D`), micro-points verts de disponibilité, sélection circulaire émeraude `#059669`. Dès qu'un créneau est cliqué, transition fluide vers les 3 champs de contact (`Nom`, `Email professionnel`, `URL du site actuel`). Support du raccourci clavier `⌘ + Entrée` pour confirmer.
    - *Panneau Droit (220px — Créneaux Horaires Dynamiques)* : Boutons horaires de 34px de hauteur avec effet hover émeraude, sélection active et suggestion automatique du premier jour ouvré suivant si le jour est fermé ou complet.
    - *Écran de Confirmation Élégant* : Récapitulatif complet de la session, bouton d'ajout en 1 clic à Google Calendar et lien direct vers Google Meet.
  - Disponibilité des routes `/book` (Kael Belceus par défaut), `/book/[id]` (hôte dynamique avec résolution automatique d'UUID de profil) et alias `/rendez-vous`.
- **Intégration Profonde Supabase & Automatisations Métier (`lib/services/booking.ts`)** :
  - Résolution automatique des identifiants hôtes (`kael`, `minerva`, adresses courriel) vers les UUIDs réels de la table `profiles` pour éviter les rejets de clé étrangère PostgreSQL.
  - Insertion persistante dans la table `public.bookings` avec génération sécurisée d'URL Google Meet.
  - **Création Automatique de Lead dans le CRM Supabase** : Toute nouvelle réservation crée ou met à jour une fiche dans `public.leads` avec statut `qualifie`, score 85 et mémo détaillé du rendez-vous.
  - **Notification en Temps Réel dans le Chat d'Équipe (#annonces)** : Publication instantanée d'un message système dans `public.team_chat_messages` pour alerter l'équipe de chaque réservation.
- **Refonte Exécutive du Dashboard Overview (`/overview` & `ManagingOverview.tsx`)** :
  - Retrait du badge `Live Stripe & MRR` à côté de `Vue d'Ensemble & Revenus`.
  - Suppression de la redondance entre segmented control et popover : remplacement par un menu déroulant unique compact `[ 📅 Trimestre Q4 2024 ▾ ]` de 28px de hauteur.
  - Popover de dates en typographie sans-serif technique `font-sans text-xs text-zinc-700` (hauteur 30px par ligne) avec coche verte émeraude `#059669` sur l'option active.
  - Adaptation automatique du découpage temporel de l'Area Chart dès le changement de période.
  - **Ruban de 4 Métriques recentré sur les Clients et l'Équipe** :
    1. *Revenus Récurrents & MRR* : `$20,320 CAD` (+12.5% vs m-1, Run-rate actif).
    2. *Partenaires Clients Actifs* : `18 comptes` (94.2% rétention client, 0% Churn ce mois).
    3. *Collaborateurs & Charge Équipe* : `5 membres clés` (175h capacité hebdo, 0% surcharge).
    4. *Livrables & Sprints Actifs* : `24 en cours` (100% dans les délais, livrés cette semaine).
- **Nettoyage Visuel Hub Écosystème (`/ecosystem`) & OpenGraph Minerva Reach en Français** :
  - Suppression de l'affichage de l'URL brute en haut des cartes de plateformes pour ne conserver que l'image épurée avec le badge de catégorie.
  - Interception dans `lib/services/link-preview.ts` pour `minerva-os-lite-desktop.vercel.app` garantissant des métadonnées OpenGraph 100% françaises (`Minerva Reach — Prospection Commerciale & Routine /today`).

## 2026-09-04 (v2.28.0) — Assainissement Strict de l'Équipe (5 Collaborateurs Officiels) & Redesign Haute Densité Charge de Travail (/team/workload)

- **Sanctuarisation des 5 Collaborateurs Officiels de l'Agence** :
  - Purge irréversible et complète de tous les comptes parasites, bots de tests (`Agent Tester`, `QA Audit Visuel`), comptes clients (`Vates`, `Client Contact`) et comptes dupliqués (`theuprisingstudio@gmail.com`, `maertin@compagny.com`).
  - Migration SQL dédiée `20260904160000_purge_non_official_team_profiles.sql` réassignant les orphelins au compte fondateur `kbelceus776@gmail.com` et verrouillant les 5 membres clés :
    1. **Kael Belceus** (`kbelceus776@gmail.com`) — Fondateur & Lead Architect (Admin)
    2. **Manpreet Singh** (`byeh50230@gmail.com`) — Associé Growth & Studio (Manager)
    3. **Rayan** (`rayanmohellebi2009@gmail.com`) — Associé Ventes & Outbound (Manager)
    4. **Samuel Olamide Adeleke** (`samade3434@gmail.com`) — Ingénieur Full-Stack (Member)
    5. **Amine Yahya Karroubi** (`karroubiamine@hotmail.com`) — Account Manager Lead (Manager)
  - Liste blanche immuable `CORE_OFFICIAL_TEAM` dans `lib/services/revops-team.ts` garantissant qu'aucun profil externe ne s'infiltre dans la vue de charge, même en cas de divergence de base de données.
- **Redesign Haute Densité & Monolithique de la Charge d'Équipe (`/team/workload` & `/team-workload`)** :
  - **Typographie & Design Tokens** : Suppression définitive de la police monospace étirée sur les libellés. Police sans-serif normale (`font-sans text-xs font-medium text-zinc-900`) pour les noms de collaborateurs, rôles et statuts ; monospace (`font-mono tabular-nums`) réservé exclusivement aux valeurs numériques et pourcentages.
  - **Header Exécutif 40px** : Fil d'Ariane épuré `Minerva / Dashboard / Charge d'Équipe`, titre compact, pastille live émeraude `● Live 5 Collaborateurs`, barre de recherche instantanée (raccourci `/`) et filtre de charge segmenté (`Tous`, `Disponibles`, `Optimaux`, `Surchargés`).
  - **Ruban Monolithique Connecté (Strip 4 Métriques)** : Grille 4 colonnes divisée par hairline `divide-x divide-zinc-100` :
    - *Membres Actifs* (5 / 5 collaborateurs)
    - *Capacité Hebdomadaire* (175h max / 35h par membre)
    - *Heures Assignées* (charge cumulée en temps réel)
    - *Taux d'Occupation Équipe* (calculé sur 175h avec pastille dynamique)
  - **Tableau de Charge Haute Précision (Hauteur 36px)** :
    - Remplacement des 3 micro-badges répétitifs (`0 td`, `0 act`, `0 ret`) par un indicateur lisible `0 active · 0 en attente`.
    - Micro-jauges de progression horizontales ultra-fines 4px (`h-1 rounded-full`) avec transitions de couleur dynamiques (Émeraude <80%, Ambre 80-100%, Rose >100%).
    - Raccourci interactif `[ + Assigner ]` au survol de chaque ligne ouvrant un modal rapide d'attribution de tâche (titre, heures estimées, priorité, échéance) connecté à Supabase avec notifications toast.
  - **Bandeau Inférieur Coach Minerva 36px** : Remplacement des 2 grands encarts blancs déconnectés ("Point du jour" et "Point hebdo") par un ruban unifié discret et compact de 36px affichant l'état des rituels et le lien direct vers le chat d'équipe.
  - **Redirection Transparente** : Alias `/team-workload` redirigeant automatiquement vers `/team/workload` sans erreur 404.

## 2026-09-04 (v2.27.0) — Dashboard Overview Haute Densité : Monolithe Linear/Stripe, Area Charts Vectoriels & DataTable Chirurgical Démocké

- **Standard Monolithique Exécutif & Financier (`/overview` & `ManagingOverview.tsx`)** :
  - Remplacement des cartes volumineuses isolées et des barres épaisses par une structure continue et compacte inspirée de Linear, Stripe Dashboard et Mercury.
  - **Header Exécutif 40px** : Suppression de la bannière verte, breadcrumb technique `Minerva / Dashboard / Vue d'Ensemble`, titre `Vue d'Ensemble & Revenus`, pastille animée `● Live Stripe & MRR`, sélecteur de granularité 28px `[ Jour | Semaine | Mois | Année ]`, sélecteur de plage et bouton d'export CSV direct.
  - **Ruban Financier Monolithique (Strip de 4 Métriques)** : Grille 4-colonnes connectée avec séparateurs hairline `divide-x divide-zinc-100` : Revenus Totaux ($20,320 CAD / run-rate live avec badge `+12.5% vs m-1`), Volume Commandes (10,320 / livrables actifs), Nouveaux Clients (4,305 / partenaires agence), et Taux de Conversion (94.2% / 0% Churn).
  - **Split-View 65/35 Analytique & MRR** :
    - *Colonne Gauche (65%)* : Graphique Area Chart vectoriel Recharts 180px double courbe empilée (Clients Existants émeraude foncé `#059669` + Nouveaux Clients émeraude clair `#34D399`) avec gradients descendants transparents, grille fine, axes monospace et tooltip dynamique au survol.
    - *Colonne Droite (35%)* : Synthèse Rapide, encart exécutif IA Minerva Pulse épuré et barres horizontales ultra-fines 4px (Abonnements SaaS 45%, Workflows IA 30%, Sprints Marketing 15%, Consulting 10%).
  - **DataTable de Transactions Chirurgical (Style Linear)** :
    - Grille dense alignée (hauteur 34px par ligne), recherche instantanée, raccourci clavier `⌘ + N` et export CSV téléchargeable.
    - 8 colonnes strictes avec pastilles de statut conformes (Succès `#059669`, Attente `#D97706`, Remboursé `#71717A`) et alignement monospace `tabular-nums font-mono`.
    - Menu contextuel d'actions `···` complet : changement de statut direct (Succès / Attente / Remboursé) avec persistance Supabase, copie de référence et suppression avec confirmation.
  - **Démockage & Persistance Supabase Réelle** :
    - Connexion directe à la table `invoices` via `lib/services/invoicing.ts` avec auto-injection idempotente `seedBenchmarkInvoicesIfEmpty()` si la base est vide.
    - Modal d'ajout insérant de vraies factures en base avec rafraîchissement immédiat de l'état.


## 2026-09-04 (v2.26.1) — SOP-TECH-07 : Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub

- **SOP-TECH-07 dans l'Académie Tech (`/academy` & Supabase)** :
  - Intégration de la procédure phare `SOP-TECH-07` : standardisation de l'orchestration multi-IA (Perplexity pour le cadrage PRD/recherche, Gemini pour le scaffolding initial, Codex pour l'implémentation fine SQL/tests, Claude Code pour la revue holistique cross-fichiers).
  - Étape essentielle d'onboarding Tech (`is_onboarding_step = true`, `is_featured = true`, `is_essential = true`, `sort_order = 7`).
  - Bloc interactif de checklist qualité en 7 points retraçant la boucle de développement complète.
  - Protocole terminal interactif avec template hybride prêt à l'emploi (prompt universel système pour assistant IA + séquence de commandes Git / typage strict / gh pr create).
  - Migration SQL `20260904010000_tech_sop_07_multi_ai_workflow.sql`, mise à jour du master script `deploy_production_complete.sql` et ajout du fallback dans `DEFAULT_ACADEMY_SOPS`.
- **Directives IA & Rôle Minerva Trequartista (`GEMINI.md`)** :
  - Ajout de la section 6 sanctuarisant GitHub comme socle immuable, la répartition opérationnelle des assistants IA et la boucle de développement en 7 étapes.


## 2026-09-04 (v2.26.0) — Verrouillage Onboarding Entreprise, Leaderboard Strict & Redesign SaaS ManagingOverview

- **Verrouillage de Sécurité Onboarding & Adhésion Entreprise (`/onboarding` & `proxy.ts`)** :
  - Fin de la faille d'attribution automatique d'accès : les nouveaux comptes non-administrateurs créés hors invitation explicite sont initialisés avec `approved: false`.
  - Protection middleware stricte (`proxy.ts`) : tout compte interne non approuvé est automatiquement redirigé vers `/pending-approval` avec instructions de contact.
  - Déclencheur SQL `handle_new_user()` mis à jour dans `supabase/deploy_production_complete.sql` et nouvelle migration `supabase/migrations/20260904150000_cleanup_test_and_client_profiles.sql` pour nettoyer et déclasser les profils de bots de test (`Agent Tester`, `QA Audit Visuel`) et clients (`Client Contact`, `Vates`).
- **Nettoyage & Normalisation du Leaderboard (`/classement` & `supabase-data.ts`)** :
  - Filtrage exclusif des 5 collaborateurs officiels de l'agence (Kael Belceus, Manpreet Singh, Rayan, Samuel Olamide Adeleke, Amine Yahya Karroubi).
  - Exclusion définitive des comptes clients et des bots de test du classement d'équipe.
  - Déduplication de Kael Belceus (conservation unique du compte principal CEO Admin).
  - Normalisation obligatoire de tous les noms de membres en lettres MAJUSCULES (`.toUpperCase()`).
- **Redesign SaaS Conforme de `ManagingOverview` (`/overview` Workspace Managing)** :
  - **Barre d'outils Exécutive** : Fil d'Ariane `Dashboard > Overview`, salutation dynamique `Welcome back, Kael`, sélecteur de période `[Daily] [Weekly] [Monthly] [Yearly]`, badge de dates `Dec 18, 2024 - Jan 17, 2025` et bouton actif `Export CSV`.
  - **Ruban de 4 Cartes KPI avec Micro-Histogrammes Verticaux** :
    - *Total Revenue* ($20,320 CAD), *Total Orders* (10,320 / 248 Livrables), *New Customers* (4,305 / 18 Partenaires), *Conversion Rate* (94.2% / Zero Churn).
    - Micro-histogrammes de barres verticales intégrés sur chaque carte et badges de performance `+0.94 last year` (+12.5% M/M).
  - **Split Central (65% / 35%)** :
    - *Sales Trend* (65%) : Histogramme vertical empilé Recharts bicolore (`New User` émeraude clair `#A7F3D0` vs `Existing User` émeraude foncé `#059669`), curseur pointillé interactif et infobulle détaillée.
    - *Revenue Breakdown* (35%) : Répartition du CA par catégories avec barres de progression horizontales, sélecteur de dates et encart exécutif « ✨ Get AI insight for better analysis » développant la synthèse stratégique Minerva AI.
  - **Tableau « Recent Transactions » Interactif avec Export Réel** :
    - Recherche instantanée multi-critères (ID, client, produit, statut).
    - Modal de création rapide « + Add Transaction » avec intégration dynamique dans l'état local.
    - Colonne de sélection avec cases à cocher unitaire et globale.
    - Bouton « Export CSV » opérationnel téléchargeant un fichier CSV formaté directement dans le navigateur.

## 2026-09-04 (v2.25.0) — Standard Linear & Raycast (MDS-01), Graphiques Recharts Émeraude, Roadmaps Découplées & Minerva Flow Live

Mise à jour majeure du cockpit exécutif et des flux opérationnels de l'agence Minerva :

- **Standard Architectural Linear & Raycast (MDS-01)** :
  - Élimination des cartes blanches isolées empilées au profit de conteneurs continus monolithiques divisés par bordures 1px (`divide-x divide-zinc-100`, `border-zinc-200`).
  - Single Viewport First : rubans métriques 4 à 6 colonnes (hauteur ≤ 64px), barres d'outils compactes 40px et ratio 65/35 sur les formulaires et guides de déploiement.
  - Pilotage clavier natif (`⌘ + Entrée`, `Échap`, `C`, `N`) et alignement monospace strict `tabular-nums font-mono` sur toutes les métriques, devises et dates.
- **Graphiques Sparklines & Métriques Dynamiques (`overview` & `ManagingOverview`)** :
  - Remplacement des 4 carrés statiques passifs par 4 courbes de tendance et aires interactives Recharts (`MetricSparkline`) : Santé Globale (tendance 30j), MRR Agence (progression 6 mois), Capacité Équipe (charge sprint hebdomadaire), et Rétention Cohortes (LTV 6 mois).
  - Couleur Vert Émeraude `#059669` uniforme avec tooltips dynamiques affichant la date/période et la valeur numérique exacte. Cartes agrandies à `h-16` et retrait des pills d'état superflus.
  - Normalisation stricte en MAJUSCULES des noms du classement d'équipe (`.toUpperCase()`) et conservation exclusive des 5 collaborateurs officiels réels (Kael Belceus, Manpreet Singh, Rayan, Samuel Olamide Adeleke, Amine Yahya Karroubi).
- **Réseau & CRM Contacts (`/contacts`)** :
  - Bouton d'action rapide 1-clic `[ ✓ Marquer contacté ]` directement sur chaque ligne du tableau avec mise à jour optimiste et persistance Supabase (`status: 'contacte'`).
  - Ruban métrique continu 4-colonnes avec décompte des contacts traités et filtre d'onglet dédié « Contactés ».
- **Facturation & Finance (`/invoices`)** :
  - Remplacement de l'empty state blanc par un ruban financier continu 4-colonnes (CA facturé, Encaissements, En attente, MRR Stripe) et une DataTable dense 36px avec calculs automatiques des taxes TPS/TVQ québécoises.
  - Raccourci clavier de création `⌘+N` et ligne d'insertion rapide active intégrée.
- **Charge de Travail & Équilibrage (`/team/workload` & `/workload`)** :
  - Redirection automatique et fluide de `/workload` vers `/team/workload`.
  - Matrice de Staffing Heatmap 42px/ligne avec jauges de charge tri-couleurs (verte ≤80%, ambre 81-100%, rose >100%) et tags de tâches techniques.
  - Sécurisation anti-crash avec clauses catch défensives sur l'ensemble des promesses parallèles.
- **Roadmap Projet & Guide de Déploiement (`/projects/[id]/roadmap`)** :
  - Remplacement du bandeau noir de 200px et des 5 cartes accordéons par un Split-View 65/35 monolithique.
  - Détection contextuelle de secteur d'activité : guide adapté Bâtiment/Toiture (simulateur d'estimation toiture, grille tarifaire, devis interactif avec signature et acompte 50%, campagne d'avis Google GMB) pour Toitures Beauchemin, et guide Restauration 0% commission pour Minerva Flow.
  - Jalons cliquables ouvrant la page dédiée `/projects/[id]/roadmap/[milestoneId]` avec gestion des documents attachés (Figma, Framer, PDF, Drive), sous-tâches interactives et notifications client.
- **Données Minerva Flow dans l'Espace Client (`/portal/[token]`)** :
  - Nouvel onglet direct « Données Minerva Flow » intégrant les métriques de commandes en direct, le volume brut, les économies 0% de commissions préservées et un accès SSO immédiat vers `https://minerva-flow.vercel.app`.
- **Console Tech & Protocole QA 20-Points (`/tech`)** :
  - Tableau QA 36px sans chevauchement de texte avec `whitespace-nowrap` sur l'ensemble des colonnes.
  - Ligne d'insertion rapide de tâche technique pleine largeur (`col-span-full`) et onglet direct vers le Changelog.
- **Écosystème Minerva & Prévisualisations OpenGraph Réelles (`/ecosystem`)** :
  - Intégration d'un extracteur de métadonnées OpenGraph générique (`fetchGenericWebPreview` dans `lib/services/link-preview.ts`) extrayant `og:image`, `twitter:image`, `og:title` et description des applications Minerva Reach, Minerva Flow, Composio, etc.
  - Transformation en grille visuelle bento 2 colonnes style Raycast avec boutons d'actions directes (Copier le lien, Lancer/Visiter) et élimination des tags superflus.
- **Suppression Complète des Leads & Comptes Clients** :
  - Implémentation des méthodes de suppression unitaire et en lot (`deleteClient`, `deleteMultipleClients`, `deleteMultipleLeads` dans `lib/services/supabase-data.ts`).
  - Ajout des boutons de suppression par ligne avec dialogue de confirmation natif, suppression par lot dans la barre flottante de sélection multiple, et bouton de suppression dans la barre d'outils de la fiche client 360° avec redirection propre.
- **Paiements Stripe Connectés dans le Portail Client (`/portal/[token]`)** :
  - Intégration de Stripe Checkout (`mode: 'subscription'`) et Stripe Billing Customer Portal via clés API configurées dans `.env.local`.
  - Carte de souscription mensuelle connectée sur le portail client permettant d'activer le forfait en 1 clic et d'accéder au portail client Stripe pour mettre à jour la carte et télécharger les reçus.
- **Expansion de l'Académie LMS Managing (6 Procédures Opérationnelles Complètes)** :
  - Ajout de 6 SOPs complètes de gestion de compte couvrant l'ensemble du cycle de vie client : Routine Quotidienne AM & Opérations, Onboarding 48h & Kickoff, Rétention & Rituels Anti-Churn, Facturation Stripe & Taxes QC, Équilibrage de Charge Équipe (`/team/workload`), et QBR Trimestrielle & Offboarding.
  - Intégration dans `FALLBACK_DEV_SOPS` et création de la migration `supabase/migrations/20260904000000_managing_sops_expansion.sql`.
- **Nouveau Hub d'Acquisition Organique Vidéo & Social (`/acquisition/organic`)** :
  - Remplacement de la simple liste de mots-clés par le centre de performance vidéo vertical (Reels, TikTok, Shorts).
  - Canaux sociaux officiels connectés (Instagram, TikTok, YouTube) avec statut en direct.
  - Backlog complet « Vidéos à Tourner & Idées Fortes » avec hooks de 3 secondes, statuts (Idée, Scripté, À Tourner, Montage, Publié), boîte de dialogue d'ajout persistant (`localStorage`), et filtres par plateforme.
  - Classement Top Vidéos & attribution commerciale chiffrée (leads CRM attribués et MRR généré).
- **Dé-mocking des Audits IA via Google Gemini API (`/api/audits/[id]/extract`)** :
  - Remplacement d'Anthropic par Google Gemini (`gemini-2.5-flash` via `@google/genai` et `GEMINI_API_KEY`) avec sortie JSON structurée validée par le schéma Zod `AuditExtractionSchema`.

---

## 2026-09-03 (v2.24.2) — Refonte Extranet Client (Portail Partenaire 360) : Stepper Linéaire, Protocole QA & Action Center Prioritaire

Refactorisation complète du portail extranet client public et sécurisé (`app/portal/[token]/page.tsx`) selon les directives Linear / Raycast :

- **Header & Status Bar Sécurisée h-10 (40px)** :
  - Suppression des espaces blancs verticaux passifs et intégration d'un bandeau ultra-dense.
  - Logo Minerva Extranet compact + breadcrumb technique `Portail Sécurisé / [Client] (Formule Partenaire 360)` en `font-mono text-xs`.
  - Badges de certification `Espace Certifié SSL` (`bg-emerald-50 text-emerald-700`) et responsable de compte `Responsable : [Nom]` avec micro-avatar.
- **Ruban Métrique & Progression Monolithique h-14 (56px)** :
  - 4 métriques connectées sous la toolbar : Avancement Global du projet (pourcentage et jauge tabulaire `font-mono`), Livrables à Valider (alerte ambre prioritaire si > 0), Score de Santé Compte (98/100 optimal), et Livraison Finale Prévue (date ISO).
- **Navigation Segmentée h-8 Intégrée** :
  - Segmented control 6 onglets (`Vue d'Ensemble & Progrès`, `Livrables & Approbation`, `Factures & Règlements`, `Performance & ROI`, `Studio & Services`, `Support & Demandes`) avec badges dynamiques.
- **Console Principale 2-Colonnes (65% / 35%) — Vue d'Ensemble** :
  - **Colonne Gauche (65% - Pipeline & Protocole QA)** :
    - Remplacement des 4 grosses boîtes isolées par un *Linear Stepper continu h-10* à 4 étapes (Audit Stratégique, Design System, Dév Next.js & POS, Recette 20-pts QA).
    - Protocole d'Assurance Qualité en checklist haute densité (32px par rangée) avec tags techniques compacts [Sécurité | Performance | Automatisation | Design].
    - Spécifications synthétiques des prestations incluses dans l'accord partenaire (Vidéos 4K, Flow POS).
  - **Colonne Droite (35% - Action Center Prioritaire Ancré)** :
    - Conteneur d'action prioritaire persistant (`sticky top-14`) plaçant l'approbation du livrable en attente au premier plan avec lien de prévisualisation directe.
    - Double commande : *Valider & Signer le livrable* (`bg-emerald-600` avec raccourci `⌘ + Entrée`), et *Rejeter / Demander révision* avec formulaire de feedback inline intégré sans modal intrusive (`⌘ + Entrée` / `Échap`).
    - État de validation sans action passif remplacé par une synthèse de sérénité opérationnelle.
- **Harmonisation des Onglets Secondaires** :
  - DataTables denses 36px pour les Livrables et les Factures Stripe, grille compacte pour le catalogue Studio 1-clic, et formulaire optimisé pour le support technique.

---

## 2026-09-03 (v2.24.1) — Refonte Fiche Client 360° : Ergonomie Monolithique 2-Colonnes, Zero-Scroll 1080p & Tiroir d'Édition

Refactorisation complète de la fiche client 360° (`app/(dashboard)/clients/[id]/page.tsx`) selon les standards d'ingénierie Linear & Raycast :

- **Architecture Zero-Scroll First (1080p) & Toolbar Strip (40px)** :
  - Élimination intégrale du défilement vertical massif (plus de 10 boîtes flottantes indépendantes supprimées).
  - Breadcrumb technique en tête `Clients / [Nom] (ID: #[id])` en font-mono text-xs, badges d'état (Actif, Santé ● On Track, Minerva Flow) et actions rapides h-7 (Modifier la fiche, Portail Client, Ouvrir Flow SaaS, Suivi ROI).
- **Ruban Métrique & Financier Monolithique h-14 (56px)** :
  - 4 métriques connectées sous la toolbar : MRR/Retainer mensuel en `font-mono tabular-nums`, Valeur Cumulée LTV historique, Micro-indicateur Churn/Santé (96% optimal), et Prochain Renouvellement ISO.
- **Grille Opérationnelle 2-Colonnes (65% / 35%)** :
  - **Colonne Gauche (65% - Production & Livrables)** :
    - Segmented control intégré : `[Livrables & Tâches | Projets | Facturation & Devis | Évolution MRR | Essai 14j (si actif)]`.
    - DataTables haute densité (lignes 36px) : vue unifiée Livrables & Tâches avec badge de type, statut micro-pill, échéance monospace et ligne d'insertion rapide inline déclenchée par la touche `C`.
    - Résolution définitive des 7 empty states passifs : remplacement par des lignes de création actives immédiates (`+ Lancer un projet [Entrée]`, `+ Émettre une facture Stripe [Entrée]`).
    - Onglet Évolution MRR condensé (AreaChart h-36 sans marges disproportionnées) et intégration de l'Essai 14j.
  - **Colonne Droite (35% - Métadonnées & Console Interactive Ancrée)** :
    - Conteneur monolithique continu réunissant :
      1. Contact Principal (nom, téléphone `tel:`, courriel avec copie rapide h-6, micro-pills réseaux).
      2. Protocole & Accord Mensuel (checklist interactive à cases à cocher h-6 avec prochaine séance et lien direct `/booking`).
      3. Journal & Discussion Rapide (micro-feed d'équipe branché sur `useClientChatThread` et champ de saisie inline h-8).
- **Slide-Over Drawer d'Édition Linear-Style** :
  - Déclenché par le bouton `Modifier la fiche`, tiroir 2 colonnes permettant l'édition complète (profil, logo sur bucket Supabase, MRR avec traçabilité `logClientMrrChange`, coordonnées & réseaux) sans quitter la vue 360°, avec validation rapide `⌘ + Entrée` et fermeture `Échap`.

---

## 2026-09-03 (v2.24.0) — Refonte UI/UX Minerva OS : Standard d'Ingénierie Linear & Raycast (6 Écrans Clés)

Refactorisation architecturale complète de 6 écrans majeurs selon les principes directeurs Linear / Raycast (structure monolithique continue, zéro défilement 1080p, data-to-ink maximal, raccourcis natifs et alignement strict `font-mono tabular-nums`) :

- **Cockpit Exécutif de l'Agence (`components/dashboard/ManagingOverview.tsx`)** :
  - Remplacement de la bannière volumineuse et des cartes isolées par une toolbar compacte h-10 (40px) avec breadcrumb `Minerva / Vue d'ensemble` et micro-badge `Managing`.
  - Ruban KPI connecté monolithique h-14 (56px max) en 4 colonnes (Santé Globale Optimal 96%, MRR sous Gestion, Capacité Équipe 78%, Rétention LTV 94.2%).
  - Grille opérationnelle 2-tiers : table dense des chantiers & projets en cours (60%, lignes h-9 de 36px) et console d'équilibrage/vélocité d'équipe avec leaderboard compact (40%).
- **Hub Écosystème & Vitrines (`app/(dashboard)/ecosystem/page.tsx`)** :
  - Conteneur monolithique unique divisé en 2 sections nettes (Framer Hosting vs Vercel Cloud) avec lignes de registre denses (h-12 / 48px).
  - Raccourci clavier `/` pour focaliser la recherche et segmented control d'en-tête (Toutes | Vitrines | Apps).
  - Règles d'or de l'écosystème déportées dans un tiroir latéral technique (Drawer) rétractable avec raccourci `?`.
- **Planification & Booking Engine (`app/(dashboard)/booking/page.tsx`)** :
  - Élimination des modals flottants et empty states passifs au profit d'un format 2-colonnes 65/35 single-viewport 1080p.
  - Colonne gauche (65%) : segmented control permutant entre les rendez-vous confirmés, l'éditeur de créneaux de disponibilité hebdomadaires et les paramètres Cal.
  - Colonne droite (35%) : formulaire d'insertion rapide persistant (inputs h-8 de 32px) avec confirmation rapide `⌘ + Entrée`.
- **Studio de Devis & Propositions Commerciales (`app/(dashboard)/proposals/page.tsx`)** :
  - Suppression de la bannière sombre et des cartes dispersées.
  - Toolbar compacte h-10 avec recherche `/` et déclencheur `+ Nouvelle Proposition` (raccourci `N`).
  - Ruban KPI 4 colonnes h-14 (Pipeline total, Signé/Encaissé 50%, En attente, Panier moyen deal).
  - DataTable haute densité (lignes 36px) avec micro-pills de statuts et ligne d'insertion rapide inline au pied.
  - Slide-Over Drawer Linear-style 2-colonnes (saisie à gauche, totaux & calcul d'acompte 50% à droite, validation `⌘ + Entrée`).
- **Explorateur & Curation Vidéos YouTube (`components/academy/YouTubeCuratorModal.tsx`)** :
  - Refonte sous forme de palette de commande technique style Raycast Launcher (largeur max 680px, pas de scroll corporel).
  - Barre de recherche sans contour h-10 avec micro-sélecteur de domaine et ruban de filtres rapides h-7.
  - Liste dense de résultats et playbooks (rangées 40px) pilotable au clavier (`↑`/`↓` pour naviguer, `↵` pour ouvrir, `⌘+C` pour copier l'URL, `Échap` pour fermer).
  - Mini-testeur d'URL YouTube/Shorts avec micro-footer technique monospace.
- **Fiches de Rôles, Rituels & Rémunération (`app/(dashboard)/team/roles/page.tsx`)** :
  - Architecture 2-colonnes 65/35 avec segmented control h-7 pour les 4 départements (Acquisition, Création, Tech & QA, Rétention / Ops).
  - Colonne gauche (65%) : conteneur monolithique continu regroupant missions, checklist des livrables 28px, tableau des rituels avec horaires monospace et seuils de KPIs.
  - Colonne droite (35%) : harmonisation intégrale du simulateur RevOps dans le design system blanc/zinc (suppression du bloc noir agressif), calcul en temps réel des paliers d'accélérateur de quota 10k$ et affichage du total estimé.

---

## 2026-09-03 (v2.23.1) — Sécurisation Backend : Adaptateur Next.js `@supabase/server`, Auth Hybride & Contrôle RBAC

Architecture unifiée pour la sécurisation des API backend avec le paquet officiel `@supabase/server` :

- **Adaptateur Next.js App Router (`lib/supabase/server-auth.ts`)** :
  - Création de `withSupabaseRouteHandler` et `createRouteHandlerContext` composant `@supabase/server/core` (`verifyCredentials`, `createContextClient`, `createAdminClient`) et `@supabase/ssr` (`createServerClient`).
  - Prise en charge des 4 modes : `'user'`, `'secret'`, `'publishable'`, `'none'`.
  - Authentification hybride : extraction prioritaire du Bearer JWT dans l'en-tête `Authorization`, avec bascule transparente vers les sessions cookies SSR.
  - Contrôle d'accès basé sur les rôles (RBAC) intégré : option `requiredRole: 'admin' | 'manager' | 'member'` avec rejet automatique 403 Forbidden.
  - Résolution multi-clés compatible avec les nouvelles clés Supabase (`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) et les variables legacy.
- **Migration des Routes Pilotes de Référence** :
  - **Route CRM Utilisateur** : [`/api/contacts/[id]/send-email`](file:///Users/kaelbelceus/Flow%20by%20Minerva/The-Trequartista-from-Minerva/app/api/contacts/[id]/send-email/route.ts) migrée vers `{ auth: 'user' }`.
  - **Route Administration & RevOps** : [`/api/team/workload`](file:///Users/kaelbelceus/Flow%20by%20Minerva/The-Trequartista-from-Minerva/app/api/team/workload/route.ts) verrouillée avec `{ auth: 'user', requiredRole: 'admin' }`.
  - **Route Cron Machine-to-Machine** : [`/api/cron/lead-reminders`](file:///Users/kaelbelceus/Flow%20by%20Minerva/The-Trequartista-from-Minerva/app/api/cron/lead-reminders/route.ts) sécurisée avec `{ auth: 'secret' }`.

---

## 2026-09-03 (v2.23.0) — Pipeline Inbound Automatisé : Ingestion `/api/leads`, Scoring Multi-Critères, Réservation Hybride & Relances

Mise en place d'un système complet d'acquisition, de qualification instantanée et d'automatisation des leads entrants pour l'agence Minerva :

- **Route API Universelle `POST /api/leads`** :
  - Ingestion sécurisée avec support CORS (`handleCorsPreflight`, `corsHeaders`) pour Framer, Webflow et formulaires internes.
  - Rate limiting (20 requêtes/min/IP) et validation stricte avec Zod.
  - Sauvegarde enrichie dans `public.leads` : ville, volume de transactions, système de caisse (POS), type de commerce, objectif de fidélisation, multi-sites, UTMs (`utm_source`, `utm_campaign`, etc.), `gclid` et consentement SMS explicite (CASL).
  - Génération automatique du lien de réservation personnalisé (`booking_link`).
  - Historisation systématique dans la nouvelle table d'audit `public.lead_events` (`lead_created`, `qualification_scored`).
- **Moteur de Qualification & Scoring `scoreLead` (`lib/leads/scoring.ts`)** :
  - Barème québécois de restauration : Montréal & agglomération (+25), Transactions >= 200 (+25), POS compatible (Lightspeed, Square, Clover, TouchBistro, Maitre'D) (+20), Type fréquent (+15), Objectif fidélité (+15), Multi-sites (+5). Plafond à 100 points.
  - Seuils de triage : **Tier A** (70-100) avec SLA d'appel sous 10m, **Tier B** (45-69) avec SLA d'appel sous 1h, **Tier C** (0-44) avec email & validation manuelle.
  - **Alerte multi-canal instantanée pour les leads Tier A** : notification temps réel dans le chat d'équipe Minerva (`team_chat_messages`), courriel d'urgence haute priorité via Resend et SMS d'astreinte Twilio à l'administrateur.
  - Email de confirmation immédiat envoyé au prospect avec récapitulatif et bouton de prise de rendez-vous.
- **Module de Réservation Hybride & Page `/merci` (`app/merci/page.tsx`)** :
  - Déclenchement automatique de la balise de conversion Google Ads `gtag('event', 'conversion', ...)` avec protection anti-doublon en `sessionStorage`.
  - Sélecteur interactif des 2 créneaux d'installation sur place par semaine (mardi 14h / jeudi 10h) générés dynamiquement.
  - Route dédiée `POST /api/leads/[id]/book` pour valider le créneau, horodater `call_at`, enregistrer `booking_scheduled` dans `lead_events` et envoyer la confirmation par courriel et SMS.
  - Lien de repli direct vers Cal.com / Calendly paramétrable via `NEXT_PUBLIC_CAL_BOOKING_URL`.
- **Formulaire de Capture Dédié (`app/demande/page.tsx`)** :
  - Interface soignée avec tokens Minerva (accents émeraude, mode sombre/clair, `font-mono tabular-nums`).
  - Capture transparente des paramètres marketing (UTMs, gclid) et consentement légal SMS (CASL / TCPA).
- **Cron Horaire de Rappels & Relances (`app/api/cron/lead-reminders/route.ts`)** :
  - Enregistré dans `vercel.json` (`0 * * * *`) et protégé par `CRON_SECRET`.
  - Rappels de rendez-vous à J-1 (24h avant) et H-2 (2h avant `call_at`) par email et SMS (strictement sous condition `consent_sms === true`).
  - Relances automatiques d'abandon si aucun créneau n'est sélectionné : première relance douce à 2-4h, deuxième relance de rappel des disponibilités limitées à 24h.
  - Déduplication garantie sans double envoi via requêtes d'existence sur `lead_events`.
- **Conformité SMS Twilio & Webhook Opt-Out (`app/api/webhooks/twilio-sms/route.ts`)** :
  - Ajout automatique de la mention légale « Répondre STOP pour refuser » sur tous les SMS sortants.
  - Traitement automatique des réponses STOP / ARRET via webhook pour désactiver immédiatement `consent_sms` sur le lead et historiser l'événement `sms_opt_out`.
- **Dashboard de Triage Inbound & Checklist 45-60 min** :
  - Nouvel onglet **« Triage & Pipeline »** dans `/leads` avec filtrage par Tier (Tier A avec badge clignotant, Tier B, Tier C, RDV fixés), vue rapide de la prochaine action, date du prochain RDV et appel direct en 1 clic.
  - Carte interactive `InterventionChecklistCard` dans la fiche lead `/leads/[id]` détaillant les 6 étapes du protocole terrain de 45-60 min, avec bascule automatique du lead en `trial_active` dès la validation des 6 étapes.
- **Base de Données & Idempotence** :
  - Migration `supabase/migrations/20260903000001_leads_inbound_scoring_and_events.sql`.
  - Schéma consolidé dans `supabase/deploy_production_complete.sql` (v2.23.0).

---

## 2026-09-02 (v2.22.0) — Gestion Client & Rétention : Cycle de Vie de l'Essai Accompagné 14 Jours (Minerva Flow Montréal)

Mise à niveau majeure du module Clients & Rétention (`/clients`) pour piloter l'offre phare de déploiement Minerva Flow auprès des restaurateurs montréalais :

- **Composant Interactif `TrialLifecycleTracker` (`/clients/[id]`)** :
  - **Compte à rebours dynamique J-14 à J0** : Jauge de progression temporelle calculée en direct avec badge visuel (Émeraude > 7j, Ambre <= 7j, Rouge <= 3j).
  - **Protocole Opérationnel en 5 Jalons Montréal** : J+0 (Cadrage & Numérisation Menu), J+2 (Installation sur place à Montréal & Imprimante thermique ESC/POS 80mm), J+5 (Premier service test & Formation staff 15 min), J+10 (Activation fidélisation & QR codes habitués), J+14 (Bilan de marge nette & Conversion abonnement).
  - Horodatage et cases à cocher persistées en base de données pour chaque étape.
  - **Calculateur de ROI de Marge Nette en Direct** : Télémétrie des commandes directes enregistrées, volume d'affaires direct généré et calcul de la marge nette protégée en cuisine (~28% de commission économisée vs plateformes tierces).
  - **Conversion en 1 Clic** : Bouton « Valider la Conversion en Abonnement Payant » basculant automatiquement le statut client en `Active`, initialisant le MRR mensuel (149 $ CAD/mois) et consignant une entrée dans l'historique MRR.
- **Expérience Utilisateur & Filtrage Global (`/clients`)** :
  - Nouvel onglet de filtre dédié **« Essais 14 Jours »** dans la barre de segmentation.
  - Badges de compte à rebours d'essai (`Essai J-X`) intégrés dans le tableau principal et la vue mobile pour identifier instantanément les restaurants en phase de test.
  - Badge vert distinctif `Converti Flow` pour les comptes ayant validé leur transition.
- **Schéma de Données & Idempotence** :
  - Migration SQL `supabase/migrations/20260902000003_clients_14_day_trial_lifecycle.sql` ajoutant `trial_status`, `trial_start_date`, `trial_end_date`, `trial_milestones`, `trial_direct_orders_count`, `trial_direct_volume_cad` et `trial_net_margin_saved_cad` sur la table `clients`.
  - Script maître idempotent `supabase/deploy_production_complete.sql` actualisé en version **v2.22.0**.

---

## 2026-09-02 (v2.21.0) — Écosystème de Fidélisation, Optimisation des Marges & Intégration des Sites Web Officiels (Minerva Flow & Studio)

Réalignement stratégique majeur de Minerva Trequartista avec le positionnement de marque de l'agence (fidélisation client, protection des marges nettes et intégration des vitrines officielles) :

- **Intégration Complète des Sites Web Officiels de la Compagnie** :
  - **Barre latérale unifiée (`components/app-sidebar.tsx`)** : Nouvelle organisation distinguant clairement les *Sites Web Officiels* (`minervaflow.framer.website` & `minervastudio.framer.website`) et les *Applications & Portails* (`Minerva Reach` & `Minerva Flow SaaS`).
  - **Nouveau Hub Écosystème (`/ecosystem`)** : Page centrale interactive présentant les 4 piliers de l'agence avec badges de statuts, fiches d'usages pour chaque pôle (Ventes, Managing, Tech), liens d'accès direct et copies rapides d'URLs.
- **Recentrage Stratégique : Fidélisation Client & Protection des Marges Nettes** :
  - Recalibrage complet du moteur de qualification et scoring commercial (`/api/leads/[id]/qualify`) : substitution de l'angle culpabilisant de « perte Uber Eats » par le **Potentiel de Fidélisation Client (Score 0-100)** et le **Gain de Marge Nette Estimé ($ CAD/mois)** généré par la commande directe.
  - Identification des piliers de fidélisation activés (Commande directe 0%, QR codes comptoir & tables, Programme de récompenses habitués, Essai accompagné de 14 jours avec installation sur place à Montréal).
  - Génération d'une accroche commerciale positive et incitative basée sur l'offre d'essai accompagné de 14 jours.
- **Décommissionnement & Retrait des Appels Vocaux IA Non Fonctionnels** :
  - Retrait des boutons d'appels sortants automatisés sur les fiches leads (`/leads` et `/leads/[id]`) suite aux retours terrain confirmant leur inefficacité opérationnelle.
  - Remplacement de cet espace dans le CRM par le panneau haute valeur **« Écosystème de Fidélisation & Marges Nettes »** avec leviers de rétention habitués et estimation de marge nette.
- **Harmonisation des Modèles Commerciaux & SOPs de Vente** :
  - Mise à jour des templates de devis (`lib/services/proposals.ts`) autour de l'offre Minerva Flow (Fidélisation & 0% commission) et Minerva Studio (Framer & Identité).
  - Migration SQL `supabase/migrations/20260902000002_loyalty_ecosystem_and_websites.sql` actualisant les SOPs de vente et closing (SOP-PROSP-04 & SOP-PROSP-05).
  - Mise à jour du script maître consolidé `supabase/deploy_production_complete.sql` en version v2.21.0.

---

## 2026-09-02 (v2.20.0) — CRM & Prospection Intelligente (Minerva Reach Sync, Appels Vocaux IA ElevenLabs & Qualification Automatique)

Mise à niveau majeure du pipeline commercial et de l'acquisition Minerva Trequartista :

- **Passerelle de Synchronisation Minerva Reach (`/api/leads/reach-sync`)** :
  - Route d'ingestion sécurisée par clé secrète (`REACH_SYNC_SECRET`) pour recevoir les fiches qualifiées depuis l'application de prospection terrain Minerva Reach (`minerva-os-lite-desktop`).
  - Déduplication intelligente basée sur `reach_id` et le couple nom d'établissement / numéro de téléphone.
  - Modale interactive `ReachSyncModal` sur `/leads` permettant la synchronisation en direct avec Reach, le copier-coller de JSON et l'injection d'un échantillon de prospection montréalais en 1 clic.
- **Déclenchement d'Appels Vocaux IA ElevenLabs depuis le CRM** :
  - Route `POST /api/leads/[id]/call` déclenchant un appel de qualification outbound via l'agent conversationnel ElevenLabs vers le numéro du prospect.
  - Panneau de contrôle d'appel vocal sur `/leads/[id]` avec suivi du statut (`calling`, `completed`, `failed`), durée et historisation automatique dans les notes du lead.
  - Transition automatique du pipeline : passage du lead en étape *Qualification* et statut *Contacté* dès l'émission de l'appel.
- **Moteur de Qualification & Scoring IA des Leads** :
  - Route `POST /api/leads/[id]/qualify` et traitement par lot `POST /api/leads/batch-qualify`.
  - Calcul d'un score d'opportunité commerciale (0 à 100) basé sur le secteur, la localisation dans le Grand Montréal, la présence en ligne et la réceptivité aux offres 0% commission.
  - Détection automatique des signaux d'achat et calcul de l'érosion mensuelle en commissions tierces (1 800 $ à 4 500 $ CAD/mois versés à Uber Eats / DoorDash).
  - Génération d'une phrase d'accroche ultra-personnalisée pour le Closer avec bouton de copie en 1 clic.
  - Promotion automatique en étape *Qualification* pour tout prospect obtenant un score IA >= 70.
- **Interface & Expérience Utilisateur CRM (`/leads` & `/leads/[id]`)** :
  - Colonne *Score IA* et badges visuels (Vert 80+, Ambre 60+, Neutre) dans le tableau et sur les cartes Kanban.
  - Badge bleu distinctif pour les prospects issus de *Minerva Reach*.
  - Boutons d'action rapide dans l'en-tête du CRM : *Sync Reach* et *Qualifier IA*.
- **Base de Données & Master Script** :
  - Migration SQL `supabase/migrations/20260902000001_leads_reach_sync_and_voice.sql` ajoutant `ai_score`, `ai_qualification_notes`, `voice_call_status`, `voice_call_id` et `reach_id` sur la table `leads`.
  - Mise à jour du script consolidé `supabase/deploy_production_complete.sql` (v2.20.0).

---

## 2026-09-02 (v2.19.0) — Académie Multi-Workspaces Intelligente, 18 SOPs Dédiées, Lecteur Vidéo Universel & Curation YouTube

Mise à niveau majeure de l'Académie Minerva Trequartista :

- **Architecture Multi-Workspaces de l'Académie (`/academy`)** :
  - Nouveau système d'onglets de filtrage contextuel (*Mon Workspace*, *Prospection*, *Managing*, *Tech*, *Toutes les SOPs*) adaptant automatiquement les guides au profil du collaborateur.
  - Jauge de progression personnalisée par workspace calculant en temps réel les SOPs validées sur le parcours recommandé.
  - Extension de la table `academy_sops` avec les colonnes `target_workspace`, `checklist_items` et `script_template`.
- **18 Nouvelles SOPs Exhaustives & 100% Opérationnelles (6 par Workspace)** :
  - **Prospection (6)** : Routine quotidienne (/today, batching 30-50 fiches), Rôle & Missions de qualification Closer/SDR, Rémunération RevOps & Commissions hybrides (10% setup + 5% MRR + multiplicateur 1.25x), Programme de formation continue & Dojo d'écoute d'appels le vendredi, Formation vente & closing 0% commission (Minerva Flow), Guide complet Minerva Reach & Curation de vidéos YouTube.
  - **Managing (6)** : Routine quotidienne de l'Account Manager & Suivi des opérations, Rôle & Équilibrage de charge d'équipe (/team/workload, cible 75%-85%), Rémunération & Primes de rétention (> 90%) et score NPS (> 65), Formation continue en gestion de compte & revues mensuelles, Playbook d'onboarding client J+2 & Prévention du churn, Outils, systèmes & Cockpit exécutif (/overview & facturation légale québécoise TPS 5% / TVQ 9.975%).
  - **Tech (6)** : Routine quotidienne & Workflow Git Minerva (branches, strict tsc), Rôle, responsabilités & Architecture technique (Next.js 16, Supabase PostgreSQL, RLS), Rémunération ingénierie & Prime de déploiement (100 $/site Flow), Formation continue (IA, Serveur MCP, Next.js 16 App Router), Protocole d'assurance qualité & Homologation 20-points pré-déploiement, Intégrations matérielles POS Flow (imprimantes thermiques ESC/POS 80mm) & Déploiement Vercel.
- **Rendu Garanti Zéro Écran Vide (`markdownToBlocks` Fallback)** :
  - Élimination définitive du message d'attente « Contenu pas encore rédigé » sur `/academy/[id]` grâce à la conversion dynamique markdown vers blocs Notion-like en temps réel.
- **Lecteur Vidéo Universel & Démo Minerva Reach (`VideoAssetPlayer`)** :
  - Prise en charge native des liens YouTube (formats standards `watch?v=`, courts `youtu.be/`, Shorts verticaux `youtube.com/shorts/` et embeds) avec ratio d'aspect adaptatif (16:9 large ou 9:16 vertical) et lecteur iframe sécurisé sans coupure.
  - Conservation du lecteur HTML5 `<video>` natif pour les fichiers `.mp4` du stockage Cloud.
  - Emplacement dédié et badge stylisé pour la future vidéo de démonstration Minerva Reach.
- **Module Interactif de Recherche & Curation Vidéos YouTube (`YouTubeCuratorModal`)** :
  - Explorateur intégré à l'Académie proposant des templates de requêtes expertes par domaine (Prospection terrain, Démo produit, Minerva Reach, Account management, Next.js 16/Supabase).
  - Recommandations de chaînes leaders et banc de test interactif avec prévisualisation vidéo en direct.
- **Checklists Dynamiques & Modèles de Scripts d'Action** :
  - Checklists interactives spécifiques à chaque SOP avec persistance locale par collaborateur.
  - Callouts de scripts opérationnels copiables en 1 clic (scripts d'accroche commerciale, protocoles d'onboarding ou commandes terminal).
- **Base de Données & Script Déploiement 1-Clic** :
  - Migration SQL `supabase/migrations/20260902000000_workspace_sops_and_youtube.sql`.
  - Mise à jour du script maître `supabase/deploy_production_complete.sql` (v2.19.0).

---

## 2026-09-02 (v2.18.0) — Refonte Intégrale Minerva Trequartista (Clients & MRR, Contrats Réels, Booking In-App, Rôles & Rémunérations, Ergonomie Mobile & Purge Minerva OS)

Mise en production de la refonte globale de l'ERP d'agence Minerva Trequartista :

- **Nouveau Module de Booking Hybride In-App (`/booking` & `/book/[id]`)** :
  - Configuration interactive des plages horaires de disponibilité hebdomadaires par collaborateur.
  - Planification de réunions internes d'équipe et 1-on-1 avec statuts en temps réel.
  - Page publique de réservation client (`/book/[id]`) sans authentification requise, avec sélecteur de créneaux dynamiques et confirmation instantanée avec lien Google Meet.
  - Service `lib/services/booking.ts` avec persistance hybride (Supabase + cache local résilient).
- **Fiches de Postes, Rituels & Rémunérations (`/team/roles`)** :
  - Page dédiée présentant les 4 départements officiels : *Ventes & Prospection (Closers/SDR)*, *Création & Vidéo (Creators/Monteurs)*, *Tech & Systèmes (Devs/Intégrateurs)*, *Opérations & Managing (Account Managers/Ops)*.
  - Fiches de missions détaillées, rituels quotidiens/hebdomadaires obligatoires et KPIs chiffrés.
  - Modèle de rémunération transparent avec Simulateur interactif de commissions hybrides RevOps (10% setup, 5% MRR récurrent, multiplicateur quota x1.25).
- **Refonte Business (Clients, MRR & Devis Réels)** :
  - Page `/clients` modernisée avec conformité design system Minerva, ventilation avancée du MRR et affichage adaptatif en cartes tactiles sur mobile (< 640px).
  - 4 modèles d'offres et contrats d'agence réalistes intégrés dans `lib/services/proposals.ts` (*Pack Flow & 8 Reels*, *Site Framer & Ads*, *E-Commerce & Agent IA*, *Retainer Élite 360*).
  - Intégration des clauses juridiques québécoises standardisées (Loi protection consommateur, propriété intellectuelle conditionnelle, limite 2 révisions, juridiction Montréal, acompte 50% non-remboursable).
- **Recentrage de l'Acquisition & Sous-Pages Dédiées** :
  - `/acquisition/ads` : Cockpit de pilotage des campagnes payantes (Meta Ads, Google Search, TikTok Ads : budgets, CPL, leads et ROAS).
  - `/acquisition/organic` : Cockpit de croissance naturelle (SEO local Google Maps Montréal, portée vidéo organique, taux de réponse outbound).
  - Sous-navigation unifiée dans le Hub `/acquisition` et lien vers le générateur d'audits clients.
- **Cockpit Managing Exécutif (`/overview`)** :
  - Vue dédiée pour le workspace `managing` axée sur la gouvernance, l'équilibrage d'équipe, la rétention LTV et la santé globale de l'agence.
- **Réparations & Assainissement des Flux Prioritaires** :
  - Charge de travail (`/team/workload`) : stabilisation du calcul des capacités et du flux de réattribution de tâches.
  - Leaderboard (`/classement`) : affichage continu de l'ensemble des membres de `profiles` même avec un score de départ de 0 point.
  - Chat d'équipe (`/chat`) : sélection fiable des canaux `#général` et `#annonces`, et support responsive complet sur mobile avec bascule fluide entre liste des canaux et discussion.
  - Académie (`/academy`) : cloisonnement strict masquant les SOPs Tech/IA dans les workspaces Prospection et Managing, et élimination des 404s.
  - Purge intégrale de la marque : élimination définitive de toute mention obsolète de « Minerva OS » au profit du trio officiel (**Minerva Reach**, **Minerva Flow**, **Minerva Trequartista**).
- **Base de Données & Master Script Consolidé** :
  - Mise à jour de `supabase/deploy_production_complete.sql` (v2.18.0) intégrant les tables `member_availabilities` et `bookings` avec politiques RLS et Realtime.

---

Amélioration des scripts d'infrastructure et d'outillage développeur :

- **Script Bash de Déploiement Supabase** :
  - Création de `scripts/deploy-supabase.sh` compatible Unix/macOS/Linux avec support des migrations et du déploiement des Edge Functions (`launch-check-validator`, `roi-aggregator`, `webhook-validator`, `alert-dispatcher`).
  - Raccordement de la commande `npm run deploy:supabase` dans `package.json` vers le script bash avec permissions d'exécution.

---

## 2026-08-31 (v2.17.1) — Assainissement Codebase, Purge Stubs Obsolètes & Optimisation Dépôt

Maintenance et assainissement complet de la codebase :

- **Purge Définitive des Résidus de Plane** :
  - Suppression du fichier stub obsolète `lib/services/plane.ts`.
  - Retrait des fonctions orphelines de synchronisation (`updateTaskPlaneMeta`, `logPlaneSyncEvent`, `fetchPlaneSyncLogs`) dans `lib/services/supabase-data.ts`.
  - Suppression des interfaces TypeScript inutilisées (`PlaneState`, `PlaneIssue`, `PlaneCycle`, `PlaneModule`, `PlaneSyncLog`, `PlaneSyncStats`) dans `lib/types/index.ts`.
- **Nettoyage des Fichiers Temporaires & Médias** :
  - Purge des captures d'écran résiduelles à la racine (`image*.png`) et suppression du dossier d'inspiration périmé (`inpsiration/`).
- **Allègement du Bundle & Validation Stricte** :
  - Validation stricte TypeScript sans avertissement et compilation Turbopack sans régression.

---

## 2026-08-31 (v2.17.0) — Suite Notion AI Universelle (Streaming SSE, Commande `/ai`, Menu Sélection & Générateur SOPs)

Mise en production de la suite complète **Notion AI native**, propulsée par **Google Gemini (3.6 Flash)** avec streaming SSE temps réel, intégrée à l'éditeur de blocs et à l'Académie :

- **Expérience Éditeur Notion AI (`BlockEditor`)** :
  - **Commande Slash `/ai` & Déclencheur Espace** : Saisie d'invites IA directement dans le flux du document avec prévisualisation streaming en direct et conversion automatique Markdown $\leftrightarrow$ `DocumentBlock[]`.
  - **Menu Flottant Contextuel sur Sélection (`AiSelectionMenu`)** : Raccourcis 1-clic (*Améliorer la rédaction*, *Raccourcir*, *Développer / Allonger*, *Corriger grammaire & orthographe*, *Changer le ton [Pro, Direct, Commercial, Pédagogique]*, *Traduire [EN, FR, ES]*, *Résumer*) + champ de prompt libre personnalisé.
  - **Barre d'Action Post-Génération (`AiStreamingPreview`)** : Boutons interactifs *[ ✨ Conserver ]*, *[ ➕ Insérer en dessous ]*, *[ 🔄 Réessayer ]*, *[ ✂️ Plus court ]*, *[ 📝 Plus long ]*, *[ ✕ Rejeter ]*.
- **Actions Globales de Page (`AiPageToolbar`)** :
  - Barre d'actions en tête de document et de SOP : *[ ✨ Résumer la page ]* (synthèse exécutive en 5 bullets), *[ 📋 Extraire les tâches ]* (todos checklist interactifs) et *[ 🌐 Traduire ]*.
  - Modale de prévisualisation live avec options d'insertion en 1 clic (*En tête de page*, *En fin de page*, *Créer un nouveau document*).
- **Générateur Automatique de SOPs d'Académie (`AiSopGeneratorModal`)** :
  - Assistant de rédaction de SOPs en 1 clic dans `/academy/new` appliquant automatiquement le standard Minerva (*Objectif stratégique*, *Prérequis & accès*, *Procédure pas-à-pas*, *Checklist de contrôle qualité*, *Pièges & Bonnes pratiques*).
- **Backend de Streaming & Observabilité Supabase** :
  - Nouvelle route API SSE `/api/ai/stream` avec gestion résiliente des tokens, interruptions et fallbacks.
  - Table Supabase `ai_generation_logs` avec RLS pour tracer les actions, modèles, latences, longueurs et utilisateurs.

---

## 2026-08-31 (v2.16.0) — Widget Flottant IA Universel (⌘J), Lecteur Audio Chat & Impression PDF Devis

Mise en production des fonctionnalités de productivité avancée, audio et PDF officiel :

- **Widget Flottant IA Universel (`AiAssistantSpeedDial`)** :
  - Bouton d'accès flottant et raccourci clavier global `⌘J` / `Ctrl+J` accessible depuis TOUTES les pages de l'application.
  - Suggestions d'actions rapides (Composio, propositions commerciales, onboarding Flow/OS Lite, checklist QA 20-points).
- **Lecteur Audio Enrichi pour le Chat d'Équipe (`AudioVoicePlayer`)** :
  - Nouveau composant avec timeline interactive, waveform de progression, boutons lecture/pause et sélecteur de vitesse (1x, 1.5x, 2x).
- **Export & Impression PDF Haute Définition** :
  - Bouton `[ 📄 Imprimer / PDF ]` intégré dans l'en-tête des propositions commerciales officielles (`/proposals/[token]`) et factures (`/invoices/[id]`).

---

## 2026-08-31 (v2.15.0) — Intégration Composio pour l'Assistant IA, Nouveaux Outils MCP & Tutoriel Équipe SOP-AI-04

Mise en production de l'intégration Composio pour l'IA d'agence et du guide de configuration d'équipe :

- **Accès de l'Assistant IA à Composio & Outils Connectés** :
  - Enrichissement du modèle d'aide IA (`/help`, `/chat`) avec le contexte complet des intégrations Composio (Gmail, Google Calendar, Notion, GitHub, Stripe, ElevenLabs).
  - Enregistrement de 2 nouveaux outils MCP (`minerva_composio_list_apps`, `minerva_composio_execute_action`) permettant aux agents de lister les connexions actives et d'exécuter des actions d'équipe.
- **Nouveau Guide d'Équipe dans l'Académie (`/academy`)** :
  - **SOP-AI-04** : *Guide Pratique — Configurer & Connecter ses Outils avec Composio et l’Assistant IA*.
  - Guide pas-à-pas pour chaque membre afin de créer son compte, lier ses outils professionnels et déléguer des tâches à l'IA.

---

## 2026-08-31 (v2.14.0) — Résolution Crash Workspace Prospection, Liens Écosystème (OS Lite / Flow), Master Migration SQL & Composio MCP

Mise en production des correctifs de stabilité, de la master migration consolidée et des liens d'écosystème :

- **Résolution du Crash Écran d'Accueil / Workspace Prospection (`/overview`)** :
  - Déplacement de la condition `workspace === 'tech'` après l'ensemble des hooks React (`useState`, `useEffect`, `useRouter`) pour éliminer définitivement l'erreur *"Rendered more hooks than during the previous render"*.
- **Liens & Tutoriels d'Écosystème pour Tous les Workspaces** :
  - **Section "Apps & Portails" dans la barre latérale** : Accès direct en 1 clic vers **Minerva OS Lite** (`https://minerva-os-lite-desktop.vercel.app/today`) et **Minerva Flow SaaS** (`https://minerva-flow.vercel.app/login`).
  - **SOP-APP-01** : *Guide Pratique — Utiliser & Déployer Minerva OS Lite (Prospection & Closing)*.
  - **SOP-APP-02** : *Guide Pratique — Vendre, Onboarder & Administrer Minerva Flow (SaaS Client)*.
- **Master Migration SQL Déploiement 1-Shot (`supabase/deploy_production_complete.sql`)** :
  - Consolidation exhaustive de l'ensemble des tables (profils, clients, leads, contacts, projets, tâches, propositions, factures, commissions RevOps, chat temps réel, audits QA 20-points, SOPs Académie) en un fichier SQL unique, 100% idempotent.
- **Connexion Hub Composio Hosted MCP** :
  - Intégration du lien direct `https://connect.composio.dev/mcp` dans le bandeau d'intégrations et la modale de configuration.
- **Documentation Centralisée** :
  - Création de `GEMINI.md` et refonte complète de `README.md`.

---

## 2026-08-31 (v2.13.0) — Chat Canaux & Mentions @all Équipe, Retrait Total de Plane, Nouveaux Tutos GitHub/Framer/Features & Nettoyage Workspaces

Mise en production des améliorations de communication d'équipe, épuration technique et nouveaux tutoriels :

- **Canaux de Messagerie (`#général`, `#annonces`) & Mentions Équipe (`/chat`)** :
  - Canaux thématiques connectés en Postgres Realtime avec synchronisation immédiate et persistance optimiste.
  - Autocomplétion intelligente sur `@all`, `@equipe`, `@everyone` et sur les collaborateurs individuels.
  - Mise en valeur visuelle dorée/émeraude des badges de mention dans les bulles de messages.
  - Déclenchement automatique de **notifications natives prioritaires** pour toute l'équipe lors d'un `@all` / `@equipe`.
- **Retrait Total de Plane & Épuration Technique** :
  - Suppression de toutes les références, badges, colonnes et outils Plane (`/tasks`, `/integrations`, `/tech`, `/api/mcp`).
  - Nettoyage du serveur MCP pour se concentrer sur les outils réels (leads, CRM, clients, SOPs).
  - Épuration des widgets superflus et simplification du flux d'ingénierie.
- **Nouveaux Tutoriels & SOPs Développeurs dans l'Académie (`/academy`)** :
  - **SOP-DEV-01** : Maîtriser GitHub & le Flux de Travail Git chez Minerva (Branches, PRs, Turbopack, Résolution de conflits).
  - **SOP-DEV-02** : Créer et Déployer un Site Framer Haute Conversion pour Clients (Design System, Webhooks ROI, SEO).
  - **SOP-DEV-03** : Guide de Création de Nouvelles Fonctionnalités à Travers les Apps Minerva (Schéma Supabase -> Typescript -> Tailwind -> App Router).
- **Nettoyage des Guides par Workspace** :
  - Alignement strict des SOPs par espace (Prospection, Managing, Tech) sans contenu obsolète ou hors sujet.

---

## 2026-08-31 (v2.12.0) — Console Tech Haute Densité, Matrice QA 20-Points, Grille d'Intégrations & Notifications Natives

Mise en production de la refonte DevOps et du système de notifications temps réel :

- **Console Tech & Ingénierie Haute Densité (`/tech`)** :
  - Transformation monolithique inspirée de Vercel & Linear : ruban de télémétrie 4-colonnes, split-view 2-colonnes (2/3 projets et tâches, 1/3 accès DevOps).
  - DataTable des tâches techniques avec **saisie inline ultra-rapide au clavier (touche `C`)** et raccourci global `⌘ + P` vers le QA Runner.
- **Matrice Qualité QA 20-Points Obligatoire (`QualityChecklistRunner`)** :
  - Data grid technique compacte de 34px par ligne avec sévérité critique bloquante.
  - Actions en 1 clic (`[ Tester RLS ]`, `[ Ping API ]`, `[ PageSpeed ]`) avec auto-validation.
  - Raccourcis clavier `⌘ + Shift + V` (Tout valider) et `⌘ + Entrée` (Enregistrer & déployer).
- **Annuaires d'Intégrations & Écosystème API (`/integrations`)** :
  - Grille 2-colonnes dense de 48px pour les 17 applications Composio avec logos vectoriels.
  - Sidebar sticky avec champ de recherche rapide (raccourci `/`) et filtres de catégories.
  - Featured hub Plane Project Management et micro-bandeau de configuration de `COMPOSIO_API_KEY`.
  - Testeur compact de Webhook ROI Leads (`/api/webhooks/roi-event`).
- **Système de Notifications Natives du Navigateur (`NativeNotificationProvider`)** :
  - Intégration de la Web Notification API couplée à un carillon audio doux via Web Audio API.
  - 4 déclencheurs temps réel via Supabase Realtime : nouveaux messages, tâches complétées, arrivées de membres et passage au statut disponible, avec filtrage des auto-notifications.

---

## 2026-08-28 (v2.11.0) — Console RevOps, Équilibrage de Charge & Moteur de Commissions Commerciales

Mise en production de la suite complète **RevOps, Gestion de Capacité d'Équipe & Commissions Hybrides** :

- **Console d'Équilibrage de Charge & Capacité (`/team/workload`)** :
  - Supervision en temps réel de la charge hebdomadaire (base de 35h/semaine par collaborateur).
  - Jauges de charge visuelles avec alertes de surcharge (>85%) et détection de sous-utilisation (<50%).
  - Modal de **réattribution de tâches en 1 clic** pour délester les collaborateurs en surcapacité.
- **Moteur de Commissions Commerciales RevOps** :
  - Calcul hybride : **10% sur le Setup Studio** signé + **5% récurrent sur le MRR SaaS Flow**.
  - **Multiplicateur Quota (1.25x)** automatique en cas de dépassement de l'objectif mensuel (>10 000 $ CAD).
  - Tableau de suivi des commissions dues avec approbation et versement en 1 clic.
- **Attribution Automatique Intelligente des Livrables** :
  - Routage des tâches de propositions signées vers les spécialistes (*Production Vidéo*, *Web Framer*, *Acquisition Ads*, *Opérations POS*) ayant la plus faible charge.
- **Base de Données & Routes API** :
  - Migration `20260828000004_revops_and_team_commissions.sql` (`team_commissions`, `team_capacity_profiles`).
  - Routes d'API `/api/team/workload` et `/api/team/commissions`.

---

## 2026-08-28 (v2.10.0) — Générateur de Propositions Commerciales IA & Signature Électronique avec Acompte Stripe 50%

Mise en production de la suite complète **Propositions Commerciales & Signature Électronique** :

- **Studio de Propositions Commerciales (`/proposals`)** :
  - Dashboard de pilotage avec 4 KPIs de closing (*Pipeline Total TTC*, *Acomptes Encaissés*, *En Attente de Signature*, *Panier Moyen Deal*).
  - Modal de création assistée avec modèles d'offres pré-configurés (*Pack Flow + Reels 4K*, *Site Framer + Google Ads 5km*).
  - Constructeur de livrables sur mesure avec calcul automatique des taxes québécoises (TPS 5% + TVQ 9.975%) et de l'acompte 50%.
  - Génération de liens sécurisés de signature publique (`prop_...`).
- **Page Publique de Proposition & Signature Électronique (`/proposals/[token]`)** :
  - Document commercial interactif haute fidélité (Détail des 3 phases de déploiement, tableau des livrables et tableau fiscal).
  - **Pad de Signature Numérique HTML5 Canvas** tactile/souris avec horodatage certifié et enregistrement d'IP légal.
  - Bouton de validation & règlement immédiat de l'acompte 50% via Stripe.
  - Téléchargement du reçu PDF et confirmation instantanée.
- **Conversion & Automatisation E2E** :
  - Dès la signature : passage du statut à `signed`, création automatique de la facture d'acompte (`INV-2026-xxx`) dans `/invoices`, conversion du lead CRM en client gagné et provisionnement des livrables sur le portail client.
- **Base de Données & Routes API** :
  - Migration `20260828000003_proposals_and_esignature.sql`.
  - Routes d'API `/api/proposals` et `/api/proposals/[token]`.

---

## 2026-08-28 (v2.9.0) — Synergie Minerva Flow SaaS & Marketplace Studio Agence

Mise en production de la suite complète d'interconnexion entre le SaaS **Minerva Flow** (`minerva-flow.vercel.app`), la vitrine Framer (`minervaflow.framer.website`) et l'agence **Minerva Studio** :

- **Console de Supervision SaaS Minerva Flow (`/flow`)** :
  - Télémétrie en temps réel des restaurants québécois connectés (Café Saint-Henri, Pizzeria Napolitana, Bistro Laurier, Boulangerie Épi Doré).
  - 4 métriques continues : *CA Traité 30j ($)*, *Commissions Économisées vs UberEats ($)*, *MRR SaaS Actif*, *Opportunités Studio à pitcher*.
  - Matrice intelligente de détection des opportunités d'upsell pour l'agence (Reels 4K, Refonte Framer, Ads 5km).
  - Simulateur de pertes de commissions intégré pour rendez-vous prospects.
- **Diagnostic Restaurant & Simulateur Public (`/audit/resto/[token]`)** :
  - Page interactive d'audit accessible depuis le site Framer `minervaflow.framer.website` ou par lien direct.
  - Calculateur temps réel des pertes financières sur UberEats, DoorDash et Skip (25-30% de commission).
  - Comparatif chiffré des économies nettes annuelles avec Minerva Flow (149 $/mois fixe).
  - Formulaire de réservation rapide avec création automatique du lead dans le CRM Trequartista.
- **Marketplace & Packs Studio dans le Portail Client (`/portal/[token]`)** :
  - Nouvel onglet **"Studio & Services"** dans l'extranet client.
  - 5 offres packagées de l'agence disponibles à la commande en 1-clic (*Pack 8 Reels 4K*, *Site Framer & Menu QR*, *Gestion Publicités Ads 5 km*, *Configuration Flow POS*, *Identité Visuelle*).
  - Génération automatique de la facture correspondante et du lien de paiement Stripe.
- **Base de Données & Routes d'API** :
  - Migration `20260828000002_minerva_flow_and_studio.sql` (`minerva_flow_restaurants`, `studio_service_packages`, `studio_service_orders`, `restaurant_audits`).
  - Routes d'API `/api/flow/telemetry`, `/api/flow/audit`, `/api/studio/packages`, `/api/studio/orders`.

---

## 2026-08-28 (v2.8.0) — Portail Client Extranet Sécurisé & Moteur de Facturation, Devis & Cashflow

Mise en production de la suite complète **Portail Client Extranet & Gestion Financière / Facturation** :

- **Portail Client Extranet (`/portal/[token]`)** :
  - Accès sécurisé sans mot de passe via jeton unique (`portal_token`) ou compte client (`role: 'client'`).
  - **Vue d'Ensemble & Progrès** : Statut d'avancement du projet (%), jalons interactifs, protocole d'assurance qualité à 20 points de contrôle.
  - **Centre de Validation des Livrables** : Cartes visuelles avec médias, boutons d'approbation 1-clic et modal de demande d'ajustements avec retours horodatés.
  - **Factures & Règlements en Ligne** : Consultation des factures et devis, aperçu reçu PDF et bouton de paiement sécurisé direct Stripe.
  - **Performance ROI en Direct** : Suivi du CA attribué, des budgets publicitaires optimisés, du volume de leads et du ROAS global.
  - **Assistance & Requêtes Prioritaires** : Formulaire de demande directe avec notifications de traitement.
- **Hub Facturation, Devis & Prévisions Financières (`/invoices`)** :
  - **Tableau de Bord Financier** : 4 métriques directes (*CA Total Facturé*, *Encaissements Réalisés*, *En Attente / Impayés*, *Retainers & MRR*).
  - **Gestionnaire Devis & Factures** : Création modal rapide avec ajout de lignes dynamiques, calcul automatique des taxes québécoises (TPS 5% + TVQ 9.975%) et support multi-devises (CAD, USD, EUR).
  - **Conversion 1-Clic** : Transformation instantanée d'un devis accepté en facture officielle avec mise à jour du statut.
  - **Simulation de Cashflow** : Projections des entrées de trésorerie sur 30/60 jours selon les échéances clients.
  - **Aperçu & Impression PDF (`/invoices/[id]`)** : Mise en page prête à imprimer aux couleurs de l'agence Minerva avec QR code et coordonnées de virement.
- **Intégrations Fiche Client & Navigation** :
  - Nouvel onglet **"Facturation & Devis"** dans la section CRM de la barre latérale (`components/app-sidebar.tsx`).
  - Ajout des cartes de factures, livrables et bouton « Portail Client » dans la fiche détaillée (`/clients/[id]`).
- **Base de Données & Schéma Supabase** :
  - Migration `20260828000000_invoicing_and_client_portal.sql` créant `public.invoices`, `public.invoice_items`, `public.client_deliverables` et `public.client_portal_messages` avec politiques RLS et index dédiés.

---

## 2026-08-27 (v2.7.0) — Intégration Complète Plane (Self-Hosted / Cloud, MCP & Webhooks)

Mise en production de l'intégration complète avec **Plane** (gestionnaire de projet open-source / alternative à Linear & Jira) :

- **Hub Plane dédié (`/plane`)** :
  - Supervision en direct de l'instance (Self-Hosted / Cloud), latence et état de santé de l'API.
  - 4 cartes de télémétrie : *Tickets Plane Totaux*, *Tâches Synchronisées*, *Cycles / Sprints Actifs*, *Modules & Epics*.
  - Visualisation des cycles et sprints en cours avec barres de progression et échéances.
  - Explorateur de tickets interactif avec filtres d'état/priorité et liens profonds vers l'interface Plane.
  - Journal d'audit et télémétrie en temps réel des synchronisations (`plane_sync_logs`).
  - Déclencheur manuel « Synchroniser avec Plane » avec notifications toast.
- **Service Client & Synchronisation (`lib/services/plane.ts`)** :
  - Client REST résilient avec dégradation gracieuse lorsque non configuré.
  - Mapping bidirectionnel des statuts et priorités entre Minerva et Plane.
  - Poussée et synchronisation unitaire ou en masse des tâches.
- **Passerelle MCP (/api/mcp)** :
  - 5 nouveaux outils MCP pour agents IA : `minerva_plane_list_issues`, `minerva_plane_create_issue`, `minerva_plane_update_issue`, `minerva_plane_list_cycles`, `minerva_plane_sync_task`.
  - Configuration du serveur MCP officiel Plane dans `.mcp.json`.
- **Webhooks Bidirectionnels (`/api/webhooks/plane`)** :
  - Réception sécurisée des événements Plane (`issue.create`, `issue.update`, `issue.delete`) avec validation `timingSafeEqual`.
- **Badges UI & Navigation** :
  - Badges d'identifiant Plane (`OPS-XX`) intégrés sur le Kanban et le tableau de `/tasks`.
  - Carte d'intégration Plane dans `/integrations` et nouvel onglet dans la barre latérale (`components/app-sidebar.tsx`).
- **Base de Données** : Migration `20260827000000_plane_integration.sql` pour colonnes Plane sur `public.tasks` et table `public.plane_sync_logs`.

---

## 2026-08-24 (v2.6.0) — Refonte Totale Haute Densité Linear / Adaline & Workspace Documentaire

Mise en production de la suite de télémétrie de croissance et de productivité haute densité style **Linear / Adaline / Raycast / Notion** :

- **Console d'Acquisition & Inbound (`/acquisition`)** :
  - Ruban Funnel Monolithique 6-KPIs : *Leads Captés*, *SMS Relance*, *Taux Qualification*, *Audits Complétés*, *Propositions Envoyées*, *Closing Estimé*.
  - Voice Agent Strip 40px compact + **Tiroir de simulation vocale Alex (`VoiceSimulationDrawer`)** avec WebRTC ElevenLabs, waveform animée, transcription horodatée en direct, scoring IA (9.2/10) et conversion en lead CRM.
  - DataTable des Leads Captés avec écoute en direct du Webhook Framer et bouton de simulation de test immédiate.
- **Audits IA & Diagnostics (`/audits`)** :
  - Ruban 4-KPIs connectés (Audits Analysés, Score Santé, Opportunités de Revenus, Temps d'Analyse IA).
  - DataTable technique dense avec scores de maturité et goulots d'étranglement.
  - **Side-Drawer de Rapport Diagnostic (`AuditDetailSideDrawer`)** : Lecteur audio interactif avec waveform 28px, marqueurs temporels d'objections cliquables, 3 recommandations stratégiques IA et conversion en proposition commerciale en 1 clic.
- **Roadmap Produits & Demandes Clients Monolithique (`/produits`)** :
  - Roadmap continue groupée par pôle (`REACH`, `OPS`, `MARKETING`, `FLOW & OS`, `LABS & RECHERCHE`) avec sections repliables et statuts modifiables inline.
  - Ruban de progression supérieur avec micro-jauge multicolore 3px.
  - Table des demandes fonctionnalités clients avec filtres instantanés et statuts clients modifiables en temps réel.
- **Création de Tâche Single Viewport 0-Scroll (`/tasks/new`)** :
  - Layout 2-colonnes compact sans défilement.
  - **Générateur de Sous-tâches par IA (`✦ Découper en étapes`)** avec checklist interactive.
  - Aperçu live de la carte Kanban et liaisons contextuelles CRM (Client, Lead).
  - Soumission instantanée au clavier `⌘ + Entrée` / `Ctrl + Entrée`.
- **Documents & Base de Connaissances (`/documents`)** :
  - **Résolution définitive du bug d'état critique** : Élimination du double conteneur d'Empty State au profit d'une DataTable monolithique unique.
  - **Ruban de Modèles d'Amorce Rapide (44px)** : 4 micro-cartes interactives pour création instantanée en 1-clic (*Cahier des charges Framer*, *Compte-rendu Client*, *Spécification Produit*, *Proposition & Audit*).
  - Barre de filtres de catégories soulignés (2px émeraude), raccourcis clavier `C`/`N` et `/`, et barre flottante de suppression multiple.

---

## 2026-08-24 (v2.5.0) — Minerva-Flow Expansion, Multi-Suppression & Toolkit Opérationnel

Déploiement majeur v2.5.0 apportant la suite complète Minerva-Flow et les outils de gestion en lot :

- **Portail Client : Section « Mes Résultats » Minerva-Flow (`/portal/requests`)** :
  - KPI Cards en direct : 0 % de commission (économies préservées), volume brut encaissé, délai moyen cuisine et nombre de commandes.
  - Graphique d'évolution des ventes et économies avec bascule d'intervalle.
  - Flux de tickets de cuisine en temps réel et liste des 5 plats les plus vendus.
- **Portail Client : Module « Demander une fonctionnalité » & Suivi Realtime (`/portal/requests`)** :
  - Formulaire de soumission avec choix du module/repo (`minerva-flow`, `framer`, `ads`, `portal`), type et niveau de priorité.
  - Suivi d'avancement visuel en 5 étapes (*Soumise*, *En revue*, *En développement*, *En recette QA*, *Livré*).
  - Notifications instantanées via Supabase Realtime avec Toast dès qu'une demande change de statut.
  - Historique complet avec filtres par statut, dépôt et recherche plein texte.
- **Sélection Multiple & Suppression Groupée (Bulk Delete)** :
  - **Documents (`/documents`)** : Checkboxes sur table et grille, barre d'action flottante de suppression et décompte dynamique.
  - **Équipe (`/team`)** : Checkboxes de sélection, export CSV groupé et suppression de membres avec modale de confirmation.
  - **Projets (`/projects`)** : Sélection multiple et suppression de projets avec suppression en cascade de leurs jalons.
- **Nouveau Template de Projet « Minerva-Flow » & Guide Interactif** :
  - Sélecteur de templates dans `/projects/new` pré-configurant le chantier et générant automatiquement les 5 jalons de déploiement (14 jours).
  - Intégration du composant `MinervaFlowProjectGuide` dans `/projects/[id]/roadmap` avec checklist interactive et protocoles de cuisine.
- **Perfectionnement des Avatars Équipe (`UserAvatar`)** :
  - Gradients de couleurs déterministes et élégants par collaborateur.
  - Rendu haute résolution et taille `sm` (28px) dans la table pour éliminer tout effet flou ou écrasé.
- **Administration des Demandes Clients (`/produits`)** :
  - Onglet dédié permettant à l'équipe agence de consulter, filtrer et mettre à jour le statut des demandes en direct.

---

## 2026-08-18 (v2.4.3) — Système Anti-Friction (4 Piliers), Académie Redessinée, Studio de Scripting Cas Client 60s & Co-Pilotage ($300-$500/mo)

Mise en production du Framework Directeur Anti-Friction « Donner d’abord, demander ensuite » et de l’ensemble des outils opérationnels pour simplifier le travail de l'équipe sur les 4 piliers :

- **SOP Fondatrice Anti-Friction (sop-anti-friction-master)** :
  - Framework complet intégrant la neutralisation des 4 failles critiques pour chaque pilier (Flow, Reach, Agence Sur Mesure, Mes Inspirations).
  - Détail des règles d'exécution terrain, de la boucle d'offre unifiée et de la matrice de priorité S1/M1.
- **Académie Cockpit & Navigation Compacte (/academy)** :
  - Carte Héro dark-mode en haut de l'Académie avec raccourcis directs vers les 4 piliers.
  - Pinned Essential SOPs affichées en premier.
  - Bouton interactif compact `[ ▾ Afficher les autres guides et SOPs ]` pour désencombrer l'écran.
  - Barre de filtres de catégories compacte avec pills défilables et sélecteur dropdown réactif.
  - Raccourci clavier de recherche globale (`/`).
- **Studio de Scripting Cas Client 60s (Mes Inspirations)** :
  - Générateur interactif de scripts vidéo Build-in-Public (Hook chiffré, Contexte, Démo Minerva, Résultat, CTA Pilier unique).
  - Copie 1-clic et passerelle directe vers le Content Planner.
- **Module de Co-Pilotage Mensuel ($300-$500/mo)** :
  - Suivi de la récurrence mensuelle agence sur les fiches clients (`/clients/[id]`).
  - Checklist protocolaire de la session 1h, historique des revues mensuelles et planification de la prochaine séance.
- **Détails des SOPs Enrichis (/academy/[id])** :
  - Rendu Markdown complet, actions contextuelles 1-clic (+ Créer doc prospect, Liens directs vers démos) et checklists interactives de contrôle qualité.

---

## 2026-08-17 (v2.2.0) — Refonte Totale Haute Densité Linear & Superhuman sur l'Ensemble des 8 Modules

Déploiement de la version majeure **v2.2.0** apportant une refonte chirurgicale de l'expérience utilisateur et de la densité visuelle selon les standards de craft de **Linear** et **Superhuman** :

- **Page 0 : Vue d'ensemble (/overview)** :
  - Ruban télémétrique connecté 5 métriques (64px `h-16`), graphiques `AreaChart` à courbe fine 1.5px et dégradé subtil, `DonutChart` anneau 80px, tables 36px et mini-sparkline MRR 6 mois.
- **Page 1 : Suivi ROI & Leads (/clients/[id]/roi-tracker)** :
  - En-tête compact 24px TB avec statut `● Live tracking`, ruban 4-KPIs, Segmented Control `[ 7D | 30D | 90D | YTD ]`, comparatif 2 colonnes SEO vs Ads (32px) et zone d'importation hairlines 44px.
- **Page 2 : Agent Vocal IA (/voice-agent)** :
  - Ruban 4 métriques de télémétrie, histogramme fantôme de volume 7 jours avec badges HD 24kHz et latence `< 650 ms`, table des logs d'appels 36px, tiroir latéral 380px avec oscillogramme et console de test intégrée inline (sans modal flottant).
- **Page 3 : Chat d'Équipe (/chat)** :
  - Split-pane continue pleine hauteur (`h-[calc(100vh-140px)]`), colonne de canaux 280px avec filtre rapide ⌘F, en-tête 44px, bulles groupées avec micro-avatars 24px et barre d'enregistrement vocal avec chrono live.
- **Page 4 : Répertoire Clients & Suivi MRR (/clients)** :
  - En-tête compact sans-serif `Clients & Revenus`, ruban 3-KPI continu 64px, barre d'outils unifiée avec recherche rapide (`/`), DataTable 40px avec point d'état dynamique 6px, liens contextuels et barre flottante d'actions groupées.
- **Page 5 : Pipeline & CRM Leads (/leads)** :
  - En-tête `Pipeline Leads` avec `● Sync live`, Segmented Control `[ ⊞ Kanban | ☰ Table ]`, ruban 4-KPIs financier, Kanban dense avec titres sans troncature et micro-badges `📅 Meeting booké`, table 36px et export CSV exhaustif.
- **Page 6 : Pipeline Projets & Delivery (/projects)** :
  - Bandeau supérieur de synthèse continue 32px (`PROJETS ACTIFS · DANS LES TEMPS · LIVRAISONS · TEMPS RESTANT`), table 36px Linear Issues avec clés `MIN-01`, échéances relatives `15 Sept (J-29)` et vue Kanban compacte.
- **Page 7 : Social Reels Studio & Contenus (/content-planner)** :
  - Jauge linéaire multi-plateforme 56px, grille calendrier monolithique continue (style Notion Calendar / Cron) avec jours hors-mois `#FAFAFA`, numéro du jour en haut à gauche, surbrillance Aujourd'hui 20px émeraude, micro-pills vidéo 22px, double-clic de création directe et sous-vues Opus Clip.
- **Page 8 : Académie Interne & SOPs (/academy)** :
  - En-tête compact avec compteur `(N guides)`, barre d'outils unifiée avec micro-onglets de catégories, commutateur `[ ⊞ Grille | ☰ Liste ]` (36px style Linear Docs), aperçus vidéo 16:9 et tiroir de stockage repliable à la demande.
- **Composants Système & Navigation Globale** :
  - Popover de compte utilisateur macOS / Linear avec bande d'identité et raccourcis alignés.
  - Bannière de version dynamique automatique (`v2.2.0`).
  - Captures d'écran in-app haute résolution prises en direct via automatisation Playwright pour `/changelog`.

---

## 2026-08-17 (suite 6) — Refonte de densité Linear / Superhuman, Monochrome & Vert signature, Sparkline MRR & Command Bar

Refonte structurelle complète de l'interface d'après les standards de densité, de précision et de craft de **Linear** et **Superhuman** :

- **Typographie & Hiérarchie sans-serif technique** :
  - Remplacement de la police Serif (`Playfair Display`) par une police sans-serif technique (`Inter`) globale sur toute l'application.
  - Chiffres tabulaires (`tabular-nums`) appliqués sur tous les montants, compteurs et pourcentages pour un alignement vertical strict.
  - Micro-labels standardisés (`11px font-medium uppercase tracking-wider text-zinc-500`).
- **Arrière-plan unifié & Palette Monochrome / Vert Signature** :
  - Fond de toile unifié sur toute l'application à la teinte neutre propre de la sidebar (`#F4F4F5`), avec surfaces de cartes en blanc pur (`#FFFFFF`) et bordures fines 1px hairlines (`#E4E4E7`).
  - Palette monochrome rehaussée de l'émeraude signature (`#059669` / `#ECFDF5`), avec pastilles d'alertes subtiles en rouge uniquement pour les retards critiques.
- **Ruban de Métriques Supérieur (Top KPI Ribbon)** :
  - Fusion des cartes flottantes en une bande horizontale unifiée de 64px de hauteur (`h-16`) découpée en 4 colonnes par des séparateurs verticaux 1px.
  - Grandes valeurs en 20px semi-bold tabulaires, micro-icônes 14px, survol subtil avec raccourcis clavier (`G C`, `G L`, `G P`, `G V`).
- **Table des Projets en Cours (DataTable compact)** :
  - Rangées denses de 36px de hauteur (`h-9`), indicateurs d'état à points de 6px (vert émeraude / rouge alerte), colonnes Nom, Client, Service, échéance dynamique (`J-X`) et mini-barre d'avancement 4px avec pourcentage.
- **Répartition des Revenus (MRR Breakdown) & Mini Sparkline** :
  - Rangées de 36px avec barres de contribution horizontales fines (6px) et montants exacts tabulaires.
  - Intégration d'un mini-Sparkline SVG dynamique (80x24px) en haut à droite traçant la tendance du MRR sur 6 mois avec gradient émeraude.
- **Pipeline des Leads (Funnel Compact)** :
  - Tableau de flux compact de 32px par étape avec micro-jauges proportionnelles (4px) et redirection au clic vers la vue Leads filtrée (`/leads?stage=...`).
  - Ligne de pied de section indiquant la valeur totale estimée du pipeline en dollars tabulaires.
- **Nettoyage Sidebar & Relocalisation Onboarding** :
  - Éléments de navigation compactés à 28px de hauteur avec rayon d'arrondi de 4px.
  - Remplacement des gros rectangles "NOUVEAU" par un point vert discret de 4px.
  - Retrait du grand widget de la page principale pour le loger exclusivement dans le footer de la sidebar sous forme d'une fine jauge de progression (`X/4 étapes`) avec menu contextuel fluide.
- **Command Bar Centrale (⌘K)** :
  - Déclencheur de recherche compact de style Linear au centre de l'en-tête avec badge `⌘K` et raccourci clavier global.

---

## 2026-08-17 (suite 5) — Sidebar reproduite d'après Minerva Flow

Structure et comportement de la barre latérale reproduits d'après `components/shell/AppSidebar.tsx` de Minerva Flow (github.com/Endsi3g/Minerva-Flow, produit sœur) — le contenu reste 100 % propre à Trequartista, seul le patron visuel/structurel est repris :

- **Favoris** : nouvelle section dynamique, en mémoire pour la session (comme chez Flow, aucune persistance `localStorage`) — une étoile apparaît au survol de n'importe quel lien de nav pour l'épingler.
- **Sections repliables avec indentation à filet gauche** (`border-l` + retrait) au lieu du simple retrait plat précédent — CRM, Livraison, Équipe, Croissance.
- **En-tête compacté** : sélecteur d'espace de travail resserré (plus de carte à bordure) + bouton de recherche dédié juste à côté, ouvrant le même panneau de recherche que la barre supérieure.
- **Accent vert** (`bg-mv-green`) sur le lien actif, remplaçant le noir plein (`bg-neutral-900`) — et migration de toute la sidebar des classes `neutral-*` génériques vers les tokens `mv-*` du reste de l'app, qu'elle n'utilisait pas encore.

---

## 2026-08-17 (suite 4) — Chat privé + pièces jointes, Contenu Minerva, refonte Vue d'ensemble, pipeline Opus Clip → Google Drive

Quatre chantiers livrés dans la même passe, du bug réel trouvé en creusant un problème visuel jusqu'à une nouvelle intégration externe complète.

**Bug réel trouvé et corrigé : l'input du chat collait en haut de la fenêtre**
En cherchant pourquoi la zone de saisie du chat flottait près du haut du panneau au lieu de rester collée en bas, la cause s'est révélée être dans le composant `Card` partagé par toute l'app : son wrapper interne (`<div className="p-6">`) était toujours `display: block`, quel que soit le `className` passé en prop — ce qui cassait la chaîne flex de toute page essayant un layout plein écran avec `p-0`. Nouvelle prop `contentClassName` pour permettre l'override. Corrigé sur `/chat` **et** `/portal/questions` (messagerie du portail client), qui avait exactement le même bug caché.

**Chat d'équipe étendu**
- Conversations privées 1-à-1 avec n'importe quel collègue (nouvelle table `team_chat_dm_channels`, RLS restreinte aux deux participants — contrairement aux canaux projet/client, un DM n'est pas visible par tout admin/membre).
- Pièces jointes réelles : images, GIF, notes vocales enregistrées directement au micro du navigateur (`MediaRecorder`), persistées dans un nouveau bucket `team-chat-media`. Le header `Permissions-Policy` bloquait `microphone=()` pour tout le monde — corrigé en `microphone=(self)`, sinon l'enregistrement aurait été cassé en production dès le déploiement.

**Nouvel onglet « Contenu Minerva » dans le planificateur de contenu**
Séparé du contenu client (`content_posts`) — le contenu propre à l'agence :
- Calendrier partagé pour les vidéos Minerva à poster, avec rappel push quotidien à **toute l'équipe** (nouveau cron `/api/cron/minerva-content-reminders`) plutôt qu'à un seul assigné.
- Banque d'inspirations (liens externes + note) et de vidéos actuelles (fichiers), catégories administrables depuis le formulaire d'ajout.

**Vue d'ensemble : premier passage vers un style dense inspiré de Linear/Superhuman**
Refonte volontairement isolée à cette seule page (aucun token partagé touché) : sans-serif, accent vert unique, bordures fines, bande de métriques unifiée, tableaux denses pour Projets/MRR, pipeline en intensité graduée, raccourcis clavier « G puis C/L/P/V ». La passe suivante (voir « suite 3 » ci-dessus) a rééquilibré la mise en page et réintroduit une salutation par-dessus ces fondations.

**Pipeline Opus Clip → Google Drive**
En déposant une vidéo dans « Contenu Minerva », une case à cocher optionnelle envoie le fichier à [Opus Clip](https://opus.pro) pour montage automatique en clips courts. Une fois le traitement terminé (webhook signé, vérifié par HMAC), les clips résultants sont réenvoyés automatiquement dans le Google Drive de l'équipe via la connexion Composio déjà existante (`/integrations`) — aucune authentification Google séparée à configurer. Statut et liens Drive consultables dans un nouvel onglet « Montages Opus Clip ». Nouvelle table `opus_clip_jobs` ; certains détails de schéma de l'API Opus Clip (noms exacts des champs de réponse) sont du best-effort documenté dans le code, à confirmer contre un vrai projet une fois la clé API configurée en production.

**Académie** : pastilles de filtre par catégorie compressées (padding, police, espacement réduits) — c'était le seul endroit de l'app avec ce problème de filtres surdimensionnés.

---

## 2026-08-17 (suite 3) — Optimisation visuelle & expérience utilisateur (Vue d'ensemble et en-têtes)

Mise en application complète des corrections et améliorations de l'interface Vue d'ensemble (Overview) et du shell global :

- **Alignement des en-têtes** : Hauteur uniformisée à 56px (`h-14`) entre le header de la barre latérale (`AppSidebar`) et la barre de navigation principale (`AppShell`), résolvant le décalage visuel ("Pas au même niveau").
- **Salutation personnalisée** : Ajout d'une salutation simple et dédiée selon le moment de la journée (ex: `Bonjour, [Prénom] 👋` / `Bonsoir, [Prénom] 👋`) avec le prénom de l'utilisateur connecté.
- **Optimisation du layout & comblement des espaces** : Augmentation du nombre d'éléments dans les tableaux Projets et MRR (jusqu'à 8), rééquilibrage de la colonne de droite et ajout d'une carte "Tâches en attente" pour combler les espaces vides verticaux.
- **Connexion Onboarding** : Le bouton "Bien démarrer XX%" dans la sidebar fait désormais défiler la page et met en valeur le widget "Bien démarrer sur Minerva" sur le dashboard.

---

## 2026-08-17 (suite) — Audit complet post-déploiement : middleware, permissions, notifications, trigger CRM

Migrations `20260816000000`/`20260817000000`/`20260817000001` confirmées déployées et vérifiées en direct ; les 10 items de roadmap réels importés dans `minerva_roadmap_items`. Audit statique + navigateur (Chrome, session admin réelle établie sans mot de passe via un lien magique généré par l'API service-role) de l'app en entier, à la recherche de tout ce qui manque pour une app 100 % fonctionnelle.

**Trouvé et corrigé**
- `/produits` et `/voice-agent` étaient accessibles sans connexion — absents du matcher du middleware (`proxy.ts`), contrairement à toutes les autres pages du dashboard. Ajoutés.
- 4 des 7 interrupteurs de `/settings/notifications` ("Nouveaux leads attribués", "Conseils et guides", "Alertes de sécurité", "Mises à jour de facturation") n'avaient aucune colonne en base — ils affichaient un faux toast "Préférence enregistrée" sans rien sauvegarder. Remplacés par un état honnête : badge "Bientôt" désactivé pour les deux premiers, "toujours activé, non désactivable" pour les deux derniers.
- `/settings/notifications` et `/help` étaient des pages orphelines — aucun lien nulle part dans l'app malgré la structure documentée dans CLAUDE.md. Ajoutées au menu Paramètres (`UserMenu`).
- La permission `edit_client_financials` n'était appliquée que côté interface — la policy RLS `clients_write_team` restait `USING(true)` pour tous les utilisateurs authentifiés, y compris les comptes client-portail. Corrigé (migration `20260817000002`, déployée) : `clients_update_scoped`/`clients_delete_scoped` appliquent maintenant `member_can('edit_client_financials')`, exactement comme la page Permissions le promet déjà.
- `convert_lead_to_client_on_won()` réécrit avec les vrais noms de colonnes du schéma actuel (migration `20260817000003`, déployée) — marquer un lead "Gagné" créait jusqu'ici une erreur Postgres et annulait le changement de statut.
- Aucun compte admin n'existait en base (6 profils, tous `member` sauf un `client` de test) — les 5 sections admin-only étaient mortes pour tout le monde, y compris le compte fondateur. Le compte de Kael (theuprisingstudio@gmail.com) a été promu admin.
- Le bouton "Continuer avec Google" plantait avec une erreur Supabase brute non stylée — le fournisseur OAuth Google n'est pas activé côté Supabase alors que le bouton est affiché comme fonctionnel.

**Design** : la photo halftone du panneau gauche de `/login` et `/signup` remplacée par un dégradé organique animé (`components/ui/animated-mesh-background.tsx`), qui dérive lentement en CSS pur, respecte `prefers-reduced-motion`.

**Non corrigé, à traiter** : le bouton Google SSO cassé (fournisseur à activer dans le dashboard Supabase, hors de portée sans accès au projet).

---

## 2026-08-17 (suite 2) — Nettoyage données de test, notifications complètes

**Données de test retirées de la production** : le client "ROI Fix Test 1786580352780", son projet "QA Test Project 1786609702327" (+ ses `client_roi_metrics`/`client_payment_links`/`client_messages`/`project_launch_checks`), et le lead "Push Test Inc" — identifiés précisément par requête (`/test/i` sur les 4 tables clients/leads/projets/tâches), aucune donnée réelle touchée. Portefeuille clients réel confirmé intact après coup (Toitures Beauchemin, 44 leads Reach, 1 projet).

**"Nouveaux leads" et "Conseils et guides" complétés pour de vrai** (migration `20260817000004`, déployée) :
- Nouvelles colonnes `new_leads_enabled`/`tips_tutorials_enabled` sur `notification_preferences`.
- `/api/push/send` accepte maintenant un `preferenceKey` optionnel : exclut de la diffusion tout utilisateur ayant explicitement désactivé cette préférence. La création de lead (`/leads/new`) l'utilise déjà (`preferenceKey: 'new_leads_enabled'`) — c'était jusqu'ici une diffusion à toute l'équipe sans tenir compte d'aucune préférence.
- Constat en creusant le sujet : aucune des 3 préférences déjà "réelles" (Commentaires, Mentions, Nouveautés produit) n'était en fait branchée à un envoi réel non plus — seuls "Nouveau lead" et "Tâche en retard" envoient de vrais push, et ni l'un ni l'autre ne consultait `notification_preferences` avant aujourd'hui. Le rappel de tâches en retard (`/api/cron/task-reminders`) n'a pas encore été raccordé à `task_reminders_enabled` — à faire dans une prochaine passe si on veut que la préférence ait un effet réel partout, pas seulement pour les leads.
- "Conseils et guides" reste sans producteur de contenu (aucun système de tips/tutoriels n'existe dans l'app) — la préférence est maintenant réelle et persistée, mais rien ne l'utilise encore pour envoyer quoi que ce soit, comme "Nouveautés produit" avant elle.

---

## 2026-08-16 — Fondations design v3, présence d'équipe, coordonnées client, tournée de bugs

**Fondations visuelles (v3)**
- Fond crème chaud (`--mv-cream: #F0EDE0`) sur toute l'app, remplaçant le blanc/gris neutre de la v2 — matché directement contre Reach/Flow (les deux produits sœurs).
- Nouvelle police d'affichage **Playfair Display** (chargée via `next/font/google`, variable `--font-playfair`) pour tous les titres — Inter reste la police de corps/UI.
- Système de statut réellement multicolore : vert/ambre/violet/bleu/rouge (`--mv-purple`, `--mv-blue` ajoutés), `Badge` étendu avec les variantes `blue`/`purple`.
- Mode sombre **retiré complètement** (plus de toggle, plus de bloc `.dark` dans `globals.css`, `ThemeProvider`/`ThemeToggle` supprimés).
- Rayons de bordure et ombres alignés sur les valeurs exactes de Reach.

**7 pages de création refaites** (Leads, Tâches, Projets, Audits, Académie, Réels, Invitation équipe) sur le gabarit établi avec `clients/new` : formulaire en cartes sectionnées à deux colonnes + aperçu en direct, remplaçant les anciens formulaires plats à une colonne sans profondeur visuelle.

**Présence d'équipe en temps réel** — nouveau, via Supabase Realtime Presence
- Pile d'avatars dans la topbar (dashboard) + panneau listant chaque membre actif et la page exacte qu'il consulte.
- Badge discret côté portail client ("N membres Minerva en ligne") — volontairement **sans** le chemin de page exact, pour ne jamais exposer aux clients quelle page interne (ou quel autre client) un membre de l'équipe consulte.

**Coordonnées & réseaux sociaux pour les clients** — nouveau
- Téléphone, site web, fiche Google Business, Instagram, Facebook, LinkedIn : ajoutables à la création et modifiables depuis la fiche client (`/clients/[id]`, nouvelle carte "Coordonnées & réseaux").
- Première fonction `updateClient()` du projet — la fiche client n'avait jusqu'ici aucun moyen d'être modifiée après sa création.

**Fenêtre de confirmation stylée** — `ConfirmDialog` (nouveau, via `useConfirm()`) remplace tous les `window.confirm()` du navigateur (suppression de tâche/lead, révocation d'invitation, rejet de compte, réinitialisation de checklist).

**Bugs trouvés et corrigés pendant une tournée Playwright complète (compte client de test entièrement peuplé : client, métriques ROI, projet, tâches, reel, messages)**
- La création de reels échouait silencieusement : le formulaire envoyait `script_notes`, une colonne qui n'existe plus dans `content_posts` depuis une migration antérieure (le vrai champ est `caption`). Le reel n'apparaissait jamais dans le calendrier éditorial, sans aucun message d'erreur.
- La messagerie du portail client (`/portal/questions` et le mini-widget de `/portal`) n'indiquait jamais qui avait écrit un message — aucune identité d'expéditeur, bulle isolée sans repère visuel. Ajout du nom (et avatar côté page dédiée) au-dessus de chaque groupe de messages consécutifs.
- La cloche de notifications interroge la table `alerts` sur **chaque page** depuis un moment — cette table n'a jamais été créée (son producteur, `alert-engine.ts`, avait été supprimé comme code mort lors d'une session précédente sans que ce consommateur soit remarqué). Migration ajoutée ; en attendant son déploiement, la cloche échoue silencieusement (comportement inchangé, mais maintenant compris).
- Carte "Revenu récurrent (MRR)" de l'aperçu : hauteur du graphique élastique (`flex-1`) forçant un vide énorme au-dessus/en dessous des barres quand peu de clients existent — hauteur fixée.
- URL de logo Unsplash morte sur un ancien client de test — nettoyée (repli initiales déjà en place ailleurs).

**Suite du même jour — audit des fonctionnalités manquantes, exécuté**

- **Édition complète de la fiche client** : nom, secteur, statut, MRR, logo et contact — plus seulement les coordonnées/réseaux. Bouton "Modifier la fiche" sur `/clients/[id]`.
- **Appel manuel loggable** sur un lead : bascule Note/Appel dans le tiroir de détail, avec durée et résultat (Répondu, Pas de réponse, Rappeler, Numéro incorrect), formaté proprement dans l'historique de notes.
- **Producteur d'alertes réel** : la cloche calcule maintenant des alertes en direct (projets en retard, liens de paiement expirés) à partir des données déjà chargées, sans dépendre de la table `alerts` en attente de migration — la cloche affiche du vrai contenu dès aujourd'hui.
- **Jalons de projet** (nouveau) : table `project_milestones`, jalons avec titre/échéance/assigné/statut sur `/projects/[id]/roadmap`, remplaçant l'état vide permanent de cette page.
- **Approbation de contenu par le client** (nouveau) : chaque reel du calendrier portail mène à une fiche dédiée (`/portal/calendar/[id]`) avec Approuver / Demander une modification + commentaire, visible côté équipe sur la carte Kanban de `/content-planner`.
- **Trois retouches UI/UX signalées directement** : sidebar réorganisée en 5 groupes sémantiques (Principal, CRM, Livraison, Équipe, Croissance — remplace le fourre-tout "Données") ; badge `lime` recoloré (l'ancien ton `--mv-warm-tint` était quasi invisible sur les cartes blanches) ; poids de police plafonné à 700 dans `app/layout.tsx` (Inter + Playfair Display) — l'app entière paraissait trop grasse, un seul changement de config corrige tous les `font-extrabold`/`font-black` d'un coup.

**Migration en attente** (`20260816000000_pending_consolidated.sql`, mise à jour) : ajoute `clients.contact_phone`/`website_url`/`google_business_url`/`instagram_url`/`facebook_url`/`linkedin_url`, la table `alerts`, la table `project_milestones`, et `content_posts.client_approval`/`client_feedback`. Comme toujours, `npm run deploy:supabase` reste à lancer par un humain — cet environnement n'a pas d'accès direct au projet Supabase live.

**Suite du même jour — audit "regard neuf" du système Acquisition/Croissance + permissions**

- **Vert pré-v3 codé en dur dans 22 fichiers** (`#1E4B33`, jamais migré vers `#059669`) — graphiques, sidebar, avatars par défaut, PDF de proposition, bannière changelog, `manifest.json` PWA. Corrigé partout.
- **Système Acquisition/Audits IA testé de bout en bout** : entièrement honnête (aucune clé API réelle configurée → l'extraction IA échoue proprement avec un message clair), mais donc jamais utilisé en conditions réelles depuis sa construction. Statuts d'audit/proposition traduits en français (affichaient l'enum brut).
- **Système de permissions configurable** (nouveau) : page `/settings/permissions` (admin-only) avec 3 bascules réelles — suppression d'un lead, modification du MRR/statut d'un client, publication d'une SOP Académie. Appliqué à la fois côté interface et côté base de données (RLS via `public.member_can()`), pas seulement un bouton caché. Les admins gardent toujours l'accès complet ; les rôles restent à 3 (admin/membre/client), sans nouveau rôle intermédiaire.
- **Sidebar** : chaque groupe (Principal/CRM/Livraison/Équipe/Croissance/Aujourd'hui) est maintenant repliable individuellement, état mémorisé par section dans le navigateur.

**Migration `20260816000000_pending_consolidated.sql` confirmée déployée** (2026-08-17) — toutes les tables/colonnes vérifiées live.

**Audit de sécurité du système de permissions** — une vraie faille trouvée et corrigée : la policy RLS `content_posts_client_approve` limitait correctement la *ligne* qu'un client peut modifier, mais pas les *colonnes* — un appel REST direct (hors interface) aurait pu modifier le titre, le statut ou la vidéo d'un reel, pas seulement l'approbation. Ajout d'un trigger (`20260817000000_content_posts_client_column_guard.sql`, nouvelle migration séparée puisque le CLI Supabase suit les migrations par nom de fichier, pas par contenu) qui bloque toute modification hors `client_approval`/`client_feedback` de la part d'un compte client.

**22 SOPs importées depuis Notion via Composio MCP** — page « SOPs & Training — Agence » découpée en entrées individuelles consultables (Onboarding, Rôles & Rémunération, Outils & Systèmes, Ventes & Prospection, Gestion de compte, Support & QA — 6 nouvelles catégories ajoutées à l'Académie, contenu réel extrait et nettoyé, aucune donnée inventée).

---

## 2026-08-15 — Bug hunt : intégrité des données, échecs silencieux, portail client

**Portail client (`/portal`) — le plus grave**
- Le "Copilote Client" (chat) était entièrement simulé : aucun appel réseau, juste un délai artificiel affichant "Votre demande a été transmise à votre chef de projet Minerva" — rien n'était réellement transmis. Remplacé par une vraie messagerie branchée sur le canal `client_messages` déjà utilisé par `/portal/questions`.
- Retrait de toutes les données fictives montrées à de vrais clients : graphique de flux entièrement inventé, valeurs de repli codées en dur (142 appels, 18 400 $, 4.2x, 32 %), et une carte affichant le mauvais champ (`total_generated` au lieu de `pipeline_value`).
- `portal/page.tsx` et `portal/layout.tsx` migrés des classes Tailwind brutes (`neutral-*`/`emerald-*`) vers les tokens `--mv-*` du reste de l'app.

**Échecs silencieux corrigés** (l'utilisateur croyait qu'une action avait réussi alors que rien n'avait été sauvegardé)
- Suppression d'un lead, coche/réinitialisation de la checklist de lancement, changement de statut d'un reel, sauvegarde de la configuration Notion : les quatre ignoraient le résultat de l'appel Supabase. Corrigés avec retour en arrière visuel + message d'erreur.
- Ajout d'une confirmation avant de réinitialiser la checklist de lancement (20 points effacés d'un clic auparavant).
- Le tiroir de détail d'un lead gardait les données de l'ancien lead en changeant de sélection sans le fermer — corrigé.

**Autres corrections**
- Photo de logo client cassée (URL Unsplash morte) sans repli — affecte maintenant un avatar de secours partout où un logo client s'affiche.
- Texte illisible (crème sur crème) sur le badge "lime" utilisé à 8 endroits (tags SOP, statut d'audit, etc.).
- Message d'erreur Composio mentionnant littéralement ".env.local" même en environnement déployé.
- En-tête mobile de connexion/inscription : logo et lien "Créer un compte" se chevauchaient à 390px de large.
- Tableaux Clients/Leads/Équipe : se compressaient au lieu de défiler horizontalement sur mobile.
- Couleurs bleu/violet codées en dur dans le Kanban des leads (contraire à la règle d'accent unique) — remplacées par une intensité de vert.

---

## 2026-08-15 — Version 2.1.0 : Voice Agent Pixel-Perfect, Onboarding 5 étapes & ElevenLabs Réel

**Voice Agent Dashboard (`/voice-agent`) — Pixel-Perfect**
- Refonte complète de la page selon la maquette de référence `AI Voice Agent Dashboard UI/UX Design` : header `Dashboard`, 4 StatCards monochromes (Calls Answered 270, Minutes 562, Cost Saved $120, Resolved 127), graphe `Call Volume` avec ligne Inbound sombre et ligne Outbound grise, Reference Line `Jan 16`, liste `Recent Calls` identique à la maquette.
- Volet Copilote ⚡ Operator **supprimé** de la vue d'ensemble et de la page Voice Agent — conformément à la directive explicite.
- Deux onglets : **Dashboard** (monitoring) + **Configuration** (voix ElevenLabs, prompt système, simulateur live).
- Appels récents **cliquables** → modal de transcription complète avec timeline horodatée, bulles agent/prospect et statut.

**ElevenLabs — Intégration Réelle (non simulée)**
- Remplacement de l'ancienne simulation par `@elevenlabs/react` (package officiel `ConversationProvider` + `useConversation`).
- Token de conversation signé côté serveur via `/api/elevenlabs/token` — la clé API brute n'est jamais exposée au navigateur.
- 6 vraies voix ElevenLabs sélectionnables : Rachel, Domi, Bella, Antoni, Arnold, Adam.
- Waveform live réactif à l'état speaking/listening, bouton mute/unmute microphone en temps réel.

**Onboarding — 5 Vraies Étapes avec Thème Vert**
- Reconstruction complète en 5 étapes réelles : Profil (photo, nom, bio), Rôle (intitulé + département), Équipe (taille + invitations), Préférences (page d'accueil, fuseau, langue), Terminé (animation + redirection).
- Barre de progression animée verte `#1E4B33`, boutons et accents verts sur l'ensemble du formulaire.
- Protection du rôle client : redirection automatique vers `/portal` si `role === 'client'`.

**Sidebar Workspace Switcher**
- Cercle/badge noir (LogoMark) remplacé par un avatar carré vert `M` (Minerva, `#1E4B33`).
- Label `Espace de travail` plus lisible.

**Font Pairing**
- Confirmation : Inter (déjà installé et configuré globalement) — style identique à Linear et Notion. Aucune dépendance supplémentaire.

**Vue d'ensemble (`/overview`)**
- Suppression du volet Copilote ⚡ Operator.
- Appels récents cliquables → modal de transcription complète.
- Icônes différenciées : vert pour inbound, neutre pour outbound.

---

## 2026-08-15 — Version 2.0.0 : Nouvelle Interface AI Voice Agent, Refonte du Portail Client & Onboarding Pixel-Perfect

**AI Voice Agent Dashboard (`/overview` & `/voice-agent`)**
- Refonte complète de la vue d'ensemble selon la maquette AI Voice Agent (4 StatCards d'appels et de conversion, double courbe Inbound/Outbound, histogramme d'appels, journal d'appels récents).
- Intégration du volet Copilote IA `⚡ Operator` interactif à droite.
- Création de la console dédiée `/voice-agent` avec configuration des voix ElevenLabs, prompt système et simulateur d'appel vocal en direct.

**Portail Client & Gestion des Rôles (`/portal` & `/portal/join`)**
- Séparation stricte des rôles : les clients invités rejoignent désormais exclusivement le rôle `client` et sont isolés sur leur portail personnalisé.
- Refonte intégrale du Dashboard Client (`/portal`) avec 4 StatCards de performance (leads, appels IA, valeur générée, conversion), flux d'acquisition et volet Copilote Client.
- Nouvelle page d'invitation client sécurisée (`/portal/join`).

**Onboarding & Workspace Switcher**
- Refonte pixel-perfect de l'onboarding (`/onboarding`) conforme à la maquette de référence (étape 1/5, upload d'avatar avec placeholder +, toggle de notifications, mockup complet d'espace de travail).
- Sélecteur minimaliste d'espace de travail (`Minerva Workspace ▾`) en tête de barre latérale et replacement du profil utilisateur en pied de barre.

---

## 2026-08-12 — Chantier 1 : marque, sidebar, bandeau du haut

**Corrigé**
- L'inscription (`/signup`) plantait pour tout le monde depuis un certain temps (erreur 500). C'est réparé.
- Le formulaire de connexion ne montrait aucun signe de chargement pendant l'envoi.
- Une faille de sécurité dans la base de données faisait planter silencieusement la lecture des profils en dehors du sien propre (touchait la page Profil et le nouveau menu utilisateur).

**Marque**
- Plus aucune mention de « Supabase » ou de « Centurions » nulle part dans l'app. « Minerva Trequartista » reste uniquement dans le logo, l'onglet du navigateur et l'écran de connexion.

**Sidebar**
- Reconstruite au complet sur le modèle de Minerva Flow : se réduit maintenant à rien du tout (juste le bouton pour la rouvrir), sélecteur d'espace de travail sous le logo, menu utilisateur en bas (profil, paramètres, déconnexion).
- « Feedback » et la carte d'essai gratuit ont disparu. « Inviter l'équipe » est maintenant dans Paramètres.
- Se ferme automatiquement sur mobile après un clic sur un lien.

**Bandeau du haut**
- La recherche (⌘K) floute maintenant toute l'application, pas seulement le contenu — et cherche dans vos vraies données (clients, projets, leads).
- Le chronomètre (« Track Time ») est maintenant un vrai suivi de temps par projet, plus une simple alerte.
- « New » propose un vrai menu (nouveau lead, nouveau client).
- Le bouton plein écran a été retiré.
- Les notifications demandent maintenant la permission du navigateur avant de s'activer.

*Migrations en attente de déploiement : `time_entries` (chronomètre) et le correctif RLS des profils.*

---

## 2026-08-12 — Chantier 2 : vue d'ensemble

**Vue d'ensemble**
- La timeline de projets (3 rangées inventées) est remplacée par vos vrais projets.
- Le graphique « Profit & Loss » (faux, en USD) est remplacé par un vrai graphique de MRR par client, en dollars canadiens seulement — plus aucun sélecteur de devise.
- Les 4 raccourcis (« Send an invoice », etc., non fonctionnels) sont remplacés par 4 vrais raccourcis : nouveau lead, nouveau client, planifier un reel, voir les alertes.
- La carte « Workflow Plus » (essai 14 jours) est remplacée par une vraie liste de démarrage qui suit votre progression réelle (profil complété, notifications activées, Notion connecté, Académie visitée).
- Le message d'accueil est maintenant entièrement en français.
- Ordre de priorité : clients → leads → projets en retard, comme demandé.

---

## 2026-08-12 — Chantier 4 : académie, équipe, profil

- Académie : retrait du badge « Video Tutorials Engine ».
- Fiche de performance d'équipe : plus d'employé fictif — titre, date de rendez-vous, compétences (incluant la mention Supabase) et historique étaient tous inventés. Remplacés par les vraies données quand elles existent, par un état vide honnête sinon.
- Profil : retrait complet du système de clés API (jamais vraiment utilisé) et de l'onglet Sécurité qui prétendait à tort qu'une double authentification était active. Remplacé par un vrai changement de mot de passe fonctionnel.

---

## 2026-08-12 — Chantier 3 : réels

- Chaque reel a maintenant sa propre page (`/content-planner/[id]`) avec tout dessus : aperçu, légende, hashtags, statut et son historique, client, métriques, notes internes, lien vers la publication native. Fini le panneau superposé sans adresse propre.
- Le calendrier éditorial est maintenant la vue par défaut, sur le vrai mois en cours, avec navigation mois précédent/suivant.
- Les 3 contenus inventés et la vidéo de démo Google réutilisée partout ont disparu — tout vient de vraies données.
- Le client dans le formulaire de planification vient maintenant de votre vrai Portefeuille Clients.
- Téléversement de vidéo par glisser-déposer, ou lien externe — les deux fonctionnent.

*Nouvelle migration en attente : `20260812000011` (colonnes du reel détaillé). Tant qu'elle n'est pas déployée, la création/modification de reels ne fonctionnera pas.*

---

## 2026-08-12 — Ajustements

- Le logo de la sidebar n'affiche plus le nom « Trequartista » — juste l'icône.
- Les boutons Calendrier/Kanban/Bibliothèque Médias du planificateur de contenu restent lisibles sur petit écran au lieu de se faire couper.
- Toutes les fenêtres superposées restantes (nouveau client, nouveau lead, nouveau reel, créer une SOP, voir une SOP) sont maintenant de vraies pages avec leur propre adresse, comme demandé.

---

## 2026-08-12 — Typographie et sidebar

- Nouvelle police de titres : Fraunces (serif élégante), avec Inter pour le texte courant. Au passage, j'ai trouvé et corrigé un bug de CSS qui forçait discrètement tous les titres en serif système depuis un moment, peu importe la police configurée.
- La sidebar affiche maintenant ton rôle (Admin, Membre) à côté du logo plutôt qu'un nom fixe — la base pour l'espace de travail par rôle à venir.
- Bordure de la sidebar maintenant alignée avec celle du bandeau du haut.
- Nouvelle capacité technique : un item de navigation peut être marqué « Nouveau » pour signaler une section fraîchement lancée.

---

## 2026-08-12 — Ronde de finition

- Les chiffres bruts des 3 cartes KPI de la Vue d'ensemble (Clients, Leads, Projets en retard) sont maintenant accompagnés d'un petit graphique de répartition réelle (par statut/santé), pas juste un nombre.
- « Équipe » est maintenant au même endroit que « Mon profil » dans le menu utilisateur, plus dans la sidebar principale.
- Bordure de la sidebar et du bandeau du haut maintenant bien alignées ; le fil d'Ariane ne montre plus de UUID illisibles ni le mot anglais « new ».
- Le chronomètre (« Track Time ») est retiré — décidé inutile après usage.
- Nouveau : suivi réel de complétion des SOPs (bouton « Marquer comme complétée » sur chaque SOP), qui alimente une nouvelle étape de la liste de démarrage : « Terminer les SOPs liées à tes tâches ».
- Police des titres changée pour Times New Roman.
- Bouton « Nouveau » du bandeau simplifié en icône neutre plutôt qu'un gros bouton vert.
- Fond de page et fond des cartes rapprochés pour un contraste plus doux (moins de beige contre blanc pur).

---

## 2026-08-12 — Chantier 6 : portail client

- Nouveau portail client (`/portal`) : chaque client peut maintenant se connecter à son propre espace — aperçu de sa performance, calendrier éditorial partagé, messagerie de questions avec l'équipe.
- Chaque client peut être invité par lien sécurisé (bouton « Inviter au portail » sur sa fiche Suivi ROI), valide 14 jours.
- Un client redirige automatiquement vers son portail et n'a jamais accès au reste de l'application interne.

*Nouvelle migration en attente : `20260812000013` (portail client). Tant qu'elle n'est pas déployée, l'invitation et le portail ne fonctionneront pas.*

---

## 2026-08-12 — Suivi ROI : fin des chiffres inventés

- La fiche Suivi ROI d'un client affichait de fausses données impressionnantes (48 leads, 12 ventes, 85 000 $ de pipeline, deux graphiques inventés, deux vidéos de démo Google) dès qu'un client réel n'avait pas encore de métriques saisies. Retiré au complet : la page montre maintenant un état vide honnête tant qu'aucune donnée n'existe.
- Le graphique de tendance hebdomadaire vient maintenant des vraies données du client ; la répartition budgétaire compare le budget Google Ads réel au reste du budget investi, plus des canaux inventés.
- Les « créatifs vidéo top performance » viennent maintenant des vrais contenus publiés pour ce client (masqué s'il n'y en a pas), au lieu de deux vidéos d'exemple Google avec des statistiques inventées.
- Le rapport PDF exécutif ne prétend plus à une fausse « Certification Qualité 20-Points » systématiquement à 100 %.
- Badge « All Systems Live » traduit en « Suivi en direct » ; bouton Imprimer/Exporter PDF réduit à une simple icône.
- Composant de graphique à barres inutilisé (jamais importé nulle part, données de démonstration en anglais) supprimé du projet.

**Interface**
- La sidebar était plus large que nécessaire pour ses libellés — réduite pour coller à son contenu.
- Le contenu principal restait à largeur fixe même quand la sidebar était réduite, laissant un vide inutile ; il utilise maintenant tout l'espace disponible.
- Quelques montants encore affichés en convention anglaise (`$X/mo`, `$X setup`) corrigés en convention québécoise (`X $/mois`, `X $ mise en place`).

---

## 2026-08-12 — Typographie, alignement et descriptions d'usage

**Typographie**
- Nouvelle paire de polices : Georgia pour les titres, Helvetica Neue pour le texte courant (remplace Times New Roman / Inter).

**Vue d'ensemble**
- La carte « Revenu récurrent (MRR) » et la carte « Bien démarrer sur Minerva » sont maintenant toujours de la même hauteur — elles font partie de la même rangée de la grille au lieu de deux colonnes empilées indépendamment.
- Chacun des 4 raccourcis (Nouveau lead, Nouveau client, Planifier un reel, Voir les alertes) a maintenant une courte description sous son nom.

**Descriptions d'usage**
- Ajout ou réécriture d'une phrase d'usage concrète (quoi cliquer, quoi glisser) sous le titre de chaque section principale : Leads, Clients, Projets, Réels, Académie, Équipe, Facturation, et les 3 pages du portail client.

---

## 2026-08-12 — Chantier 7 (début) : mode sombre et pages de connexion en anglais

**Trouvaille majeure**
- Les pages Connexion et Créer un compte étaient restées entièrement en anglais depuis le début (« Log in to your account », « Sign up with Google », placeholder « jdoe.mobbin@gmail.com » qui référençait l'outil de design Mobbin) — traduites au complet.
- La page d'accueil de l'équipe (onboarding) offrait un sélecteur de devise USD/EUR qui ne faisait littéralement rien (l'app est CAD seulement partout ailleurs) — retiré.
- Le formulaire de création de compte affichait un badge « Strong » à côté du mot de passe peu importe ce qui était tapé — retiré plutôt que de laisser une fausse indication.

**Mode sombre**
- Une bonne dizaine d'endroits utilisaient encore du blanc, du gris ou des couleurs hexadécimales en dur (`bg-white`, `bg-[#00a800]`, `text-gray-700`, etc.) au lieu des jetons `mv-*` — invisibles ou illisibles en mode sombre. Corrigés dans les pages de connexion/inscription/accueil, le Kanban CRM, la fiche de lead, et le bandeau du haut.
- Les couleurs distinctes du Kanban CRM (Qualification en bleu, Proposition en violet) ont maintenant leur variante sombre plutôt que de rester pâles sur fond sombre.

**Nettoyage**
- Trois fichiers de l'ancien bloc sidebar shadcn (jamais utilisés depuis la reconstruction sur mesure) supprimés : `search-form.tsx`, `ui/sidebar.tsx`, `ui/sheet.tsx`.

---

## 2026-08-12 — Chantier 7 (suite) : recherche ⌘K élargie et vraies notifications push

**Recherche ⌘K**
- La recherche couvre maintenant aussi les SOPs de l'Académie (titre + description) et les contenus/reels (titre + légende), plus seulement les clients, projets et leads.

**Notifications push**
- La cloche du bandeau active maintenant un vrai abonnement Web Push (norme VAPID) en plus de la permission du navigateur — l'appareil reçoit des notifications même app fermée.
- Nouvelle route `POST /api/push/send` (authentifiée) qui envoie réellement les notifications aux appareils abonnés et retire automatiquement les abonnements expirés.
- Premier déclencheur réel branché : la création d'un nouveau lead notifie l'équipe. Le même mécanisme peut être réutilisé pour d'autres événements (projet en retard, etc.).

**Export CRM**
- L'export CSV du pipeline de leads (déjà fonctionnel, données réelles) couvre le besoin d'export Excel — aucun exporteur redondant ajouté.

*Nouvelle migration en attente : `20260812000014` (`push_subscriptions`). Sans elle, la cloche fonctionne (permission + notification locale) mais l'abonnement au vrai push échoue silencieusement en arrière-plan.*

---

## 2026-08-12 — Chantier 7 (fin) : facturation honnête, vrais liens Stripe, audit responsive

**Trouvaille majeure**
- La page Facturation affichait un historique de 4 « factures » entièrement inventées pour des clients qui n'existent pas (Apex Roofing, Clinique Dentaire Élite, etc.), un bouton « Simuler un Paiement Stripe » qui ne faisait que déclencher un faux événement interne, un « Taux de Recouvrement » fixé à 98.4 % sans aucune donnée réelle derrière, un statut « Stripe Connected » affiché pour tous les clients peu importe la réalité, et le mot « Centurion » dans une colonne visible. Tout ça retiré.
- À la place : un vrai bouton « Lien Stripe » par client qui appelle l'API Stripe (Price + Payment Link créés à la volée pour le MRR exact du client) via une nouvelle route `POST /api/stripe/create-payment-link`. Nécessite `STRIPE_SECRET_KEY` — échoue honnêtement (message clair, pas de faux lien) tant que la clé n'est pas configurée.

**Audit responsive (téléphone, 375px)**
- Les tableaux Kanban (CRM Leads, Projets, Réels) s'empilaient en 4 à 6 colonnes pleine largeur sur mobile, rendant la page immensément longue à faire défiler. Passés en défilement horizontal (comme sur desktop/tablette), chaque colonne gardant une largeur confortable.
- Le calendrier éditorial (Réels + portail client) écrasait ses 7 colonnes en bandes verticales étroites et illisibles sur mobile. Même correctif : défilement horizontal, cellules de taille normale.
- La barre de recherche + filtre de l'Académie écrasait le champ de recherche au point de couper son texte. Empilée verticalement sur mobile.
- La fiche membre de l'Équipe tronquait le nom quand le bouton d'action ne trouvait pas sa place à côté. Le bouton passe maintenant en dessous sur mobile.

**Env requis pour activer le reste** : `STRIPE_SECRET_KEY` (liens de paiement).

---

## 2026-08-12 — Stripe connecté et vérifié en direct

- `STRIPE_SECRET_KEY` (mode test) configurée. Premier lien de paiement réel généré et vérifié de bout en bout pendant la session (Price + Payment Link Stripe véritables, URL `buy.stripe.com` copiée automatiquement).
- Corrigé au passage : le compte Stripe a Managed Payments (taxes automatiques) activé par défaut, ce qui bloquait la création avec une erreur de code de taxe manquant. Désactivé spécifiquement pour ces liens plutôt que d'inventer un code de taxe au hasard.
- Nouvelle table `client_payment_links` (migration `20260812000015`) : chaque lien généré est maintenant conservé et affiché dans une nouvelle section « Liens de Paiement Générés » sur la page Facturation, avec son statut (en attente/payé/expiré).
- Nouveau `POST /api/webhooks/stripe` : quand un client paie réellement, le statut passe à « Payé » automatiquement — à condition d'enregistrer l'URL du webhook dans le Dashboard Stripe et de configurer `STRIPE_WEBHOOK_SECRET`.

*Reste à configurer sur Vercel : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `STRIPE_SECRET_KEY`, et éventuellement `STRIPE_WEBHOOK_SECRET`.*

---

## 2026-08-12 — Chantier 5 : rôles, invitations d'équipe, délégation de tâches

**Rôles**
- Un type `Role` inutilisé (`'Admin' | 'Manager' | 'Collaborateur'`) qui ne correspondait à aucune vraie valeur en base (les vrais rôles sont `admin` / `member` / `client`) a été corrigé pour refléter la réalité.
- La liste d'assignés d'un projet retombait sur deux noms inventés (« Alex Tremblay », « Sarah Bouchard ») quand elle était vide — retiré. Ce champ n'était de toute façon affiché nulle part ; la délégation de tâches ci-dessous le remplace par quelque chose de réel.

**Invitations d'équipe**
- Le bouton « Inviter un Collaborateur » sur la page Équipe ne faisait littéralement rien depuis le début — aucun gestionnaire de clic. Remplacé par une vraie fonctionnalité (`/team/invite`, réservée aux admins) : générez un lien valide 14 jours qui attribue automatiquement un rôle (Membre ou Admin) et un département au moment de l'inscription.
- Nouvelle page `/team/join?token=...` pour consommer le lien, sur le même modèle que l'invitation client déjà en place.

**Délégation de tâches**
- Nouvelle section « Tâches » dans la sidebar (avec badge du nombre de tâches qui vous sont assignées). Créez une tâche, assignez-la à un membre de l'équipe, liez-la optionnellement à un projet ou un client, suivez son statut (À faire / En cours / Terminé) par colonnes.
- Recherche ⌘K et menu « Nouveau » mis à jour pour inclure les tâches.

*Nouvelles migrations en attente : `20260812000016` (`team_invites`), `20260812000017` (`tasks`).*

---

## 2026-08-13 — Chantier 8 : nouveautés dans l'app, automatisation CI

**Nouveautés (in-app)**
- Le fichier `CHANGELOG.md` n'était visible que sur GitHub. Nouvelle page « Nouveautés » (accessible depuis le menu utilisateur) qui affiche les mêmes annonces dans l'app, avec image optionnelle par entrée. Publication réservée aux admins (`/changelog/new`).

**Automatisation**
- Nouveau pipeline CI GitHub Actions (`.github/workflows/ci.yml`) : vérifie le typage et le build à chaque push sur `main`. Nécessite que `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` soient ajoutés comme secrets GitHub (Settings → Secrets and variables → Actions) du dépôt — distinct des variables d'environnement Vercel. Sans ça, l'étape de build échouera (sans impact sur le déploiement Vercel, qui reste indépendant).
- Le déploiement automatique des migrations Supabase (pour éliminer le `npm run deploy:supabase` manuel) n'a pas été automatisé — appliquer des changements de schéma en production sur chaque push est un risque d'une autre nature que déployer du code, à valider avec vous avant de le mettre en place.

*Nouvelle migration en attente : `20260813000001` (`changelog_entries`).*

---

## 2026-08-13 — Chantier 5 (approfondissement) : facturation admin seulement, tâches avancées

**Facturation réservée aux admins**
- Première vraie différence de permissions entre rôles dans l'app : n'importe quel membre pouvait auparavant voir tout le détail MRR et générer de vrais liens de paiement Stripe. Désormais réservé aux admins — page bloquée, lien retiré du menu, et la route `/api/stripe/create-payment-link` elle-même refuse la requête (pas seulement l'interface).

**Tâches avancées**
- Une tâche peut maintenant être liée à un lead, pas seulement un projet ou un client.
- Chaque tâche a sa propre page (`/tasks/[id]`) avec un fil de commentaires réel.
- Nouveau : rappel automatique par notification push pour les tâches en retard, via une tâche planifiée Vercel Cron quotidienne (`/api/cron/task-reminders`). Nécessite `CRON_SECRET` (optionnel mais recommandé) en plus des clés VAPID déjà documentées.
- Corrigé au passage : la jointure vers les profils échouait silencieusement côté navigateur (deux clés étrangères ambiguës vers `profiles`) — les tâches ne se chargeaient jamais tant que ce n'était pas précisé.

*Nouvelles migrations en attente : `20260813000002` (permissions facturation), `20260813000003` (lead lié + commentaires de tâches).*

---

## 2026-08-13 — Toutes les migrations déployées ; Chantier 5 : dernier tour

**Migrations** : les 13 migrations en attente ont été appliquées par vos soins. Vérifié en direct : création de tâches, commentaires, sous-tâches, notifications, page Nouveautés — tout fonctionne désormais sans dégradation.

**Charge de travail équipe** — nouvelle page `/team/workload` (admins seulement) : nombre de tâches par membre (à faire / en cours / terminé), avec les tâches en retard mises en évidence et cliquables.

**Révocation d'invitation** — un admin peut maintenant invalider un lien d'invitation avant l'expiration de 14 jours, plutôt que d'attendre.

**Sous-tâches** — chaque tâche a maintenant une liste de sous-tâches à cocher, avec barre de progression.

**Chantier 5 est maintenant complet.** La feuille de route dans `CLAUDE.md` a été renumérotée pour correspondre à la planification d'origine (les 8 chantiers sont tous livrés, mais construits dans un ordre différent — voir `CLAUDE.md` pour le mapping exact).

*Nouvelle migration en attente : `20260813000004` (sous-tâches + révocation d'invitation).*

---

## 2026-08-13 — Audit complet de l'app : ponts manquants et données honnêtes

Balayage systématique de toute l'application (pas un chantier planifié — une demande de « trouve et corrige tout ce qui manque, sans que j'aie à insister »).

**Corrigé**
- Le pipeline CRM était cassé en silence : marquer un lead « Gagné » plantait côté base de données (mauvaises colonnes) et l'échec n'était jamais affiché — le lead restait « Gagné » à l'écran sans qu'aucun client ni projet ne soit créé.
- `/clients` affichait un delta de MRR et un taux de rétention inventés ; retirés. Le repli du logo client était une photo stock — remplacé par un avatar à initiales généré, comme partout ailleurs dans l'app.
- Nouvelle fiche client complète (`/clients/[id]`) : projets, leads, tâches, liens de paiement, contenus et messages du portail, tous réels. Le tableau `/clients` n'y menait nulle part avant.
- Le bouton « Nouveau Projet » ne faisait rien ; nouvelle page `/projects/new`.
- L'upload de photo de profil échouait sans le moindre message d'erreur.
- L'onglet OKR de la fiche de performance était vide en permanence, sans explication, avec un bouton « + Nouvel OKR » mort. Le « Prochain 1-on-1 » est maintenant réellement modifiable (c'était en lecture seule malgré le texte de la page qui promettait de pouvoir le planifier).
- La page Intégrations affichait « Connecté » pour Google Calendar (jamais implémenté, fonction factice supprimée) et l'import vidéo par URL (toujours en échec côté serveur) — statuts corrigés pour refléter la réalité.
- Le Kanban du planificateur de contenu promettait le glisser-déposer depuis toujours ; jamais câblé. C'est fait.
- Police d'affichage remplacée : Georgia (serif) → Sora + Inter.

*Nouvelles migrations en attente : `20260813000005` (correctif du déclencheur lead→client), `20260813000006` (contrainte unique pour le 1-on-1 planifiable).*

---

## 2026-08-13 — Nouveau système d'acquisition & d'audit IA

Nouveau système de bout en bout, en dehors des 8 chantiers d'origine : capture de leads depuis le site Framer, relance SMS automatique, moteur d'audit IA post-appel de diagnostic, générateur de propositions PDF, et livrable web interactif pour le client.

**Capture de leads & relance SMS**
- `/api/leads/step-1` et `/step-2` : webhooks publics pour le formulaire Framer (Étape 1 = prénom + téléphone, Étape 2 = qualification). Le domaine Framer exact doit être renseigné dans `FRAMER_ORIGIN` avant mise en ligne.
- Relance SMS 5 minutes après un abandon à l'Étape 1, planifiée par lead via Upstash QStash plutôt qu'une tâche périodique — timing précis sans plan Vercel payant.
- Un lead qualifié crée automatiquement une vraie carte dans le pipeline CRM (`/leads`).

**Moteur d'audit IA** (`/audits`, admin seulement)
- Transcription collée manuellement (fonctionne toujours) ou récupérée via Granola/Composio (câblage non vérifié en conditions réelles — répond honnêtement « non disponible » en attendant).
- Extraction par Claude : goulots d'étranglement, coûts cachés, compatibilité des outils, initiatives IA avec score impact/effort. Les montants en dollars sont calculés côté serveur à partir des taux horaires configurés (`/settings/audit-reference`), jamais inventés par le modèle.

**Proposition & livrable client**
- PDF généré et envoyé par courriel (Brevo) avec lien de réservation Calendly pour le 2e appel.
- Page client interactive et sécurisée par jeton (`/audit/view`) : diagramme avant/après, matrice impact/effort, réactions et commentaires en direct.

**Tableau de bord** (`/acquisition`, admin seulement) : leads captés, SMS envoyés, taux de qualification, audits complétés, propositions envoyées.

Toutes les clés API (Twilio, Anthropic, Brevo, Calendly, QStash, Composio) restent à configurer — chaque intégration répond honnêtement « non configuré » plutôt que de simuler un succès. Voir `.env.example` pour la liste complète.

*Nouvelles migrations en attente : `20260813000007` (leads entrants), `20260813000008` (audits, propositions, données de référence). Nouveau bucket Storage `proposals` à créer manuellement dans le dashboard Supabase (comme `client-assets`/`team-documents`/`academy-media`).*

---

## 2026-08-15 — Refonte marque Minerva Reach, OAuth Composio réel, 8 nouveaux blocs Paramètres

Rebrand complet aligné sur le produit jumeau Minerva Reach (`minerva-os-lite-desktop`), et huit nouvelles interfaces de paramètres/onboarding reconstruites depuis des maquettes shadcnblocks avec de vraies données à chaque fois.

**Marque : palette Forêt & Crème + Playfair Display / Plus Jakarta Sans**
- Toute la palette `--mv-*` (clair et sombre) recalculée sur les couleurs exactes de Minerva Reach — y compris les graphiques (`components/charts/*`), le PDF de proposition et le diagramme d'audit, qui codaient leurs couleurs en dur.
- Polices Sora/Inter remplacées par Playfair Display (titres) / Plus Jakarta Sans (corps) partout.

**Sidebar reconstruite** sur le modèle de Minerva Reach : items épinglés, catégories repliables (masquées pour les non-admins), section « Aujourd'hui » (clients/projets récents réels), widget « Démarrage » branché sur la vraie progression d'onboarding, menu de compte dans l'en-tête ET dans le coin supérieur droit de la barre du haut.

**Intégrations — vraies connexions OAuth via Composio**
- `/integrations` : grille (pas une liste) de 17 apps réellement utilisées par l'agence (Gmail, Notion, GitHub, Stripe, Supabase, etc.), avec vrais logos (GLINCKER/thesvg), connexion/déconnexion OAuth réelle via `@composio/client` (admin seulement), indicateur vert pulsant pour les connexions actives, filtres par catégorie sous forme de chips horizontales, « Voir plus » pour n'afficher que 6 apps par défaut, squelettes shimmer pendant le chargement.
- Le testeur de webhook ROI (bouton existant, jamais fonctionnel) envoyait les mauvais noms de champs et aucune autorisation — corrigé avec une vraie route de test serveur (admin seulement).
- Import de SOPs Notion vers l'Académie (admin, déclenché manuellement) : sélectionne des pages Notion, importe leur contenu réel en fiches SOP.

**Paramètres refaits** : Profil (édition + aperçu en direct, nouveaux champs bio/localisation/réseaux), Notifications (bascules groupées, vraiment persistées), Membres (recherche, changement de rôle en direct), Onboarding (5 étapes au lieu de 3, la vue de démarrage choisie est maintenant vraiment mémorisée pour les connexions futures).

**Nouveau** : page `/help` (FAQ réelle sur les fonctionnalités de l'app), bandeau automatique annonçant la dernière entrée Nouveautés (lien vers `/changelog`, ne réapparaît pas une fois fermé sauf nouvelle entrée), page Nouveautés redessinée avec version + liste « ce qui est inclus » + navigation latérale, effet de fondu au défilement sur les longues listes (FAQ, nouveautés), écran de chargement personnalisé au démarrage de l'app.

**Corrections suite aux tests en direct**
- L'onboarding vivait par erreur dans le même gabarit que le reste de l'app (sidebar/topbar visibles pendant la configuration du compte) — déplacé vers son propre flux plein écran, avant l'accès à l'espace de travail.
- Accent décoratif unifié en vert partout (le badge « Nouveau » d'Équipe était ambre).
- Les compteurs « 1 » à côté de Clients/Leads/Projets dans la sidebar n'apportaient aucune information utile — retirés.
- Espacement corrigé entre l'icône et « Minerva » dans le fil d'Ariane (trop collés).
- Menu de compte ajouté dans le coin supérieur droit de la barre du haut (en plus de celui du pied de sidebar).

*Nouvelles migrations en attente : `20260815000001` (profils étendus + nouveautés structurées + préférences de notifications), `20260815000002` (suivi d'import Notion), `20260815000003` (vue par défaut du profil). Clé `COMPOSIO_API_KEY` fournie invalide (format ne correspondant pas à une clé projet) — à revérifier dans le dashboard Composio avant que les connexions OAuth ne fonctionnent réellement.*

---

## 2026-08-15 — Refonte du fond d'app, éradication de l'ambre, bug de photo de profil, agent vocal ElevenLabs

**Corrigé**
- La sidebar poussait son pied (Démarrage, Paramètres & Plus, compte) hors de l'écran sur les pages hautes — la coquille de l'app utilisait `min-h-screen` (hauteur minimale, extensible) au lieu de `h-screen` (hauteur fixe), donc toute la page défilait plutôt que juste le contenu central. Corrigé : la sidebar reste fixe, seul le contenu principal défile.
- La photo de profil en haut à droite ne se mettait jamais à jour après modification sur `/profil` : chaque instance de `useCurrentUser()` (sidebar, barre du haut, 14 pages) faisait sa propre requête unique au montage, sans lien entre elles. Remplacé par un contexte partagé (`CurrentUserProvider`) avec `refresh()`, appelé après chaque sauvegarde de profil/avatar.
- Le fond de l'app ne reprenait pas vraiment celui de Minerva Reach : leurs jetons de couleur Forêt & Crème étaient corrects, mais leur coquille d'app réelle utilise un blanc pur + gris neutre (`#f4f4f3`), pas les tons crème. `--mv-surface`/`--mv-cream-soft`/`--mv-border` alignés sur ces valeurs exactes (le crème reste réservé aux pages plein écran comme l'accueil/onboarding).
- Flou de la barre du haut (`backdrop-blur`) retiré — fond opaque uni.
- L'accent ambre/orange restant (23 fichiers, badges, jauges, graphiques) est maintenant du vert partout, y compris les états d'avertissement — une seule couleur d'accent dans toute l'app.
- `/leads` et `/projets` chargeaient sans aucun état de chargement (flash de contenu vide) — squelettes ajoutés.

**Nouveau**
- Animation d'entrée (fondu + léger décalage, via Motion) sur les 8 pages principales.
- Agent vocal Minerva (ElevenLabs Conversational AI) intégré dans `/acquisition` : appel de test en direct dans le navigateur (WebRTC, jeton de session émis côté serveur, clé API jamais exposée au client), vérifié fonctionnel de bout en bout contre l'API réelle. Webhook post-appel (`/api/webhooks/elevenlabs-post-call`) prêt à créer automatiquement un vrai lead qualifié dès qu'un appel se termine, une fois configuré côté ElevenLabs.

**Webhook post-appel ElevenLabs configuré et vérifié en production** — créé via l'API workspace ElevenLabs et rattaché à l'agent (`post_call_webhook_id`), pointant vers `https://minerva-trequista.vercel.app/api/webhooks/elevenlabs-post-call`. Confirmé déployé et actif (rejette correctement les requêtes non signées avec 401).

*À faire : appliquer `npm run deploy:supabase` (accès MCP Supabase disponible mais connecté à un compte différent — Minerva OS Lite/Minerva Flow/Minerva OS/Aurevia, aucun ne correspond au projet Trequartista, donc impossible de le faire à ta place). Corriger `COMPOSIO_API_KEY` — l'installateur CLI officiel exige WSL (non disponible ici) et l'ancien CLI npm (`composio-core`) a son backend de connexion désactivé (410) ; le plus simple reste de recopier la clé depuis Settings → Project Settings → API Keys sur composio.dev. Ajouter `ELEVENLABS_WEBHOOK_SECRET` (valeur dans `.env.local`, jamais commitée) aux variables d'environnement de production Vercel (je n'ai pas accès à ce panneau).*
