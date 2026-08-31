-- Migration: Add Developer & Tech Tutorials to Academy
-- SOP-DEV-01: GitHub Workflow
-- SOP-DEV-02: Framer Sites
-- SOP-DEV-03: New App Features

INSERT INTO public.academy_sops (
  title,
  description,
  category,
  content_markdown,
  read_time_min,
  author,
  is_essential,
  is_featured,
  is_onboarding_step,
  sort_order,
  pillar
)
VALUES
(
  'Guide Pratique : Maîtriser GitHub & le Flux de Travail Git chez Minerva',
  'Protocole de collaboration Git, branches feature/fix, commits conventionnels et validation stricte TypeScript.',
  'Tech & Ingénierie',
  '# SOP-DEV-01 — Guide Pratique : Maîtriser GitHub & le Flux de Travail Git chez Minerva

## 1. Principes Fondamentaux du Workflow Git Minerva
- La branche main est toujours déployable en production sur Vercel.
- Tout nouveau développement passe par une branche dédiée au format feat/nom, fix/nom ou chantierX-nom.
- Règle absolue : Aucun commit direct sur main sans validation préalable de compilation TypeScript (npx tsc --noEmit).

## 2. Cycle de Travail Quotidien
1. git checkout main && git pull origin main
2. git checkout -b feat/ma-feature
3. npm run dev
4. Commits conventionnels : feat(module): description, fix(module): description
5. Validation statique : npx tsc --noEmit
6. git push -u origin feat/ma-feature

## 3. Checklist Avant Mise en Production
- [ ] npx tsc --noEmit passe avec 0 erreur.
- [ ] CHANGELOG.md est mis à jour avec la version et les notes.
- [ ] Aucun secret ou clé API n''est commité.',
  10,
  'Kael Belceus & Lead Tech',
  true,
  true,
  true,
  1,
  'Tech'
),
(
  'Guide Pratique : Créer & Déployer un Site Framer Haute Conversion pour Clients',
  'Architecture de page client, design tokens Minerva, intégration de formulaires webhooks et publication en ligne.',
  'Tech & Ingénierie',
  '# SOP-DEV-02 — Guide Pratique : Créer & Déployer un Site Framer Haute Conversion pour Clients

## 1. Structure Standard d''une Page Client
1. Hero Section : Proposition de valeur claire + Badge avis + CTA Commander
2. Preuve Sociale : Bandeau de logos partenaires / Médias locaux (La Presse, Eater)
3. Menu / Offre Phare : Grille visuelle avec photos 4K, prix et badges
4. Galerie & Ambiance : Slider fluide des photos du restaurant
5. Témoignages Clients : Avis Google 5 étoiles authentiques
6. Formulaire & Footer : Horaires, Maps intégrée, formulaire connecté

## 2. Connexion du Formulaire aux Webhooks Minerva
- Méthode POST vers https://app.minerva.agency/api/webhooks/roi-event
- Payload : clientId, name, email, phone, channel, value
- Test en direct pour vérifier l''attribution de leads dans le tableau de bord.',
  12,
  'Kael Belceus & UI/UX Architect',
  true,
  true,
  false,
  2,
  'Tech'
),
(
  'Guide Pratique : Créer de Nouvelles Fonctionnalités à Travers les Apps Minerva',
  'Guide technique pas-à-pas pour implémenter de nouvelles fonctionnalités : Schéma Supabase, Typescript, Tailwind et App Router.',
  'Tech & Ingénierie',
  '# SOP-DEV-03 — Guide Pratique : Créer de Nouvelles Fonctionnalités à Travers les Apps Minerva

## 1. Cycle de Développement d''une Fonctionnalité Minerva (The 6-Step Loop)
1. Schéma Postgres & RLS : Migration SQL dans supabase/migrations/
2. Typage TypeScript Strict : Interfaces dans lib/types/index.ts
3. Service de Données : Fonctions async avec fallback dans lib/services/supabase-data.ts
4. Composants UI : Design tokens haute densité (#FAFAFA, zinc-200, tabular-nums)
5. Route App Router : Page dans app/(dashboard)/...
6. Raccourcis Clavier & Realtime : Raccourcis intuitifs et notifications.',
  15,
  'Kael Belceus & Lead Architect',
  true,
  true,
  false,
  3,
  'Tech'
)
ON CONFLICT DO NOTHING;
