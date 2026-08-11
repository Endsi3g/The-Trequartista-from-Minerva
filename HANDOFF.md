# DOCUMENT DE HANDOFF COMPLET — MINERVA CENTURIONS

## 🏛️ Résumé du projet

**Centurions de Minerva** est le cockpit in-house haute performance conçu exclusivement pour la direction et l'équipe opérationnelle de Minerva. L'application est intégralement développée selon le système de design strict du repo `Endsi3g/Minerva-Flow`.

---

## 🎨 Stack & Composants Clés

1. **Framework** : Next.js 15.1.7 (App Router) + TypeScript + Tailwind CSS v3.
2. **Design System** : `globals.css` natif avec support mode sombre par défaut (`--mv-cream: #14170f`, `--mv-surface: #1e231a`, `--mv-green: #1c9a6f`, `--mv-lime: #dfff5f`), tokens HSL/HEX exacts, 5 micro-animations personnalisées, typographies *New York* et *Plus Jakarta Sans*. Zéro émoticônes.
3. **Composants Shell & Navigation** :
   - `AppShell.tsx` : Enveloppe réactive responsive.
   - `AppSidebar.tsx` : Sidebar entièrement rétractable (mode compact 68px icônes avec tooltips / mode étendu 260px accordéon par domaines).
   - `AppBreadcrumb.tsx` : Fil d'Ariane dynamique sur l'ensemble des 16 routes.
   - `TopbarActions.tsx` : Actionneur de thème, tiroir de notifications d'alertes temps réel.
   - `SearchDialog.tsx` : Palette de recherche globale `⌘K`.
4. **Composants Fonctionnels Nouveaux** :
   - `StorageBrowser.tsx` : Explorateur & Drag-and-Drop uploader pour Supabase Storage (`client-assets`, `team-documents`, `academy-media`) avec copie en 1-clic des URLs publiques.
   - `ClientExecutiveReport.tsx` : Synthèse exécutive à 4 sections avec mode d'impression dédié `@media print` pour génération de bilans PDF clients.

---

## 🚀 Écrans & Routes Implémentés (16 Routes)

- `/overview` : Command Center avec StatCards, projets prioritaires, raccourcis ops et tiroir d'alertes.
- `/overview/audit-logs` : Journal d'audit et flux de traçabilité en temps réel des actions d'équipe.
- `/clients` : Répertoire clients et modal "Nouveau Client Supabase" liée directement à la base de données.
- `/clients/[id]/roi-tracker` : Suivi ROI temps réel, graphique SVG des leads, callout 8.7x ROI, filtre 7j/30j/90j/YTD, exportateur PDF et StorageBrowser.
- `/projects` : Pipeline de projets avec sélecteur de vues Table & Kanban.
- `/projects/[id]/roadmap` : Feuille de route par jalons.
- `/projects/[id]/launch-check` : Checklist qualité 20-points certifiée Minerva avec barre de progression temps réel, animations `mv-check-pop` et modale de célébration avec confettis (`canvas-confetti`) à 20/20.
- `/content-planner` : Planificateur de publications et Reels sociaux.
- `/team` & `/team/[id]/performance` : Répertoire équipe, fiches 1-on-1, bouton de synchronisation Google Calendar, OKRs Q3 et StorageBrowser.
- `/academy` : Base de connaissances LMS & SOPs avec StorageBrowser pour vidéos et PDFs.
- `/profil` : Gestion du profil collaborateur (3 onglets), rôles et préférences d'alertes (Email, Slack, In-App).
- `/settings/billing` : Dashboard de facturation agence, métriques MRR/ARR, abonnements Stripe et téléchargeur de factures.
- `/login` : Écran de connexion Google Workspace OAuth (`@minervaflow.com`) enveloppé dans un boundary Suspense.
- `middleware.ts` : Middleware Edge Next.js protégeant automatiquement toutes les routes cockpit via `@supabase/ssr`.

---

## 🔒 Configuration Supabase & Sécurité

- Clés d'accès configurées dans `.env.local` et `.env.example`.
- Base de données PostgreSQL avec RLS configurée dans `supabase/migrations/20260811000000_init_centurions.sql` et `supabase/seed.sql`.
- 5 Edge Functions Supabase sous `supabase/functions/` (`launch-check-validator`, `google-calendar-sync`, `roi-aggregator`, `webhook-validator`, `alert-dispatcher`).
- Agent Skills Supabase installés sous `.agents/skills/supabase` et `.agents/skills/supabase-postgres-best-practices`.

---

## ⚡ Procédure de Déploiement

1. Déployer les migrations et Edge Functions Supabase :
   `pnpm run deploy:supabase` ou `.\scripts\deploy-supabase.ps1`
2. Déployer sur Vercel :
   Pousser le dépôt sur GitHub/Vercel avec les variables d'environnement Supabase. Les en-têtes de sécurité sont automatiquement appliqués via `vercel.json`.
