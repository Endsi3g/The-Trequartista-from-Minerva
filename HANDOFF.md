# 🤝 HANDOFF — Minerva Centurions Master Architecture

Document de transmission technique et opérationnel pour l'écosystème **Minerva Centurions**.

---

## 📌 Statut Actuel du Projet

- **Version Production** : `v1.0.0` / Tag `v1.0.0-master-architecture`
- **Déploiement Vercel** : En ligne sur Vercel Platform avec PWA active (`/manifest.json`, `/sw.js`).
- **Score Playwright E2E** : **20 / 20 tests réussis (100%)**
- **Typecheck TypeScript** : **0 erreur** (`npx tsc --noEmit`)
- **Audit sécurité/UI/architecture** : voir le rapport du 11 août 2026 — 7 failles critiques corrigées (auth, RLS, clés API, secret webhook, schéma `profiles`).

---

## 🗄️ Migrations SQL Supabase

Toutes les migrations SQL sont situées dans le dossier `supabase/migrations/` :

1. `20260811000000_init_centurions.sql` — Schéma fondateur (profiles, clients, projects, leads, etc.).
2. `20260811000001_audit_logs_and_realtime.sql` — Journal d'audit et abonnements Realtime.
3. `20260811000002_leads_crm.sql` — Table CRM des leads et score A/B/C/D.
4. `20260811000003_content_posts_and_media.sql` — Metadata vidéos et Social Reels Studio.
5. `20260811000004_notion_config.sql` — Tokens Notion et serveur Notion MCP (`https://mcp.notion.com/mcp`).
6. `20260811000005_user_feedbacks.sql` — Widget feedback in-app et persistance Supabase.
7. `20260811000006_user_api_keys.sql` — Générateur de clés API Webhook.
8. `20260811000010_allowed_emails.sql` — Liste blanche manuelle d'emails hors domaine.
9. `20260812000001_profiles_and_roles.sql` — Système de rôles et d'approbation (approved/admin).
10. `20260812000002_fix_profiles_schema.sql` — Fusion du schéma `profiles` en collision entre (1) et (9).
11. `20260812000003_user_api_keys_ownership.sql` — Colonne `user_id` pour scoper les clés API par propriétaire.
12. `20260812000004_harden_rls_policies.sql` — RLS restreinte à `TO authenticated` + scoping par propriétaire sur `notion_config`/`user_api_keys`.

⚠️ Ces migrations doivent être appliquées dans l'ordre (`supabase db push` ou `npm run deploy:supabase`) avant tout accès externe à l'environnement — les migrations 10 à 12 corrigent des failles de sécurité critiques.

---

## ⚡ Edge Functions & Server API Routes

- **Edge Functions Supabase** :
  - `launch-check-validator` : Validation automatique 20/20 points.
  - `roi-aggregator` : Recalcul en temps réel du multiplicateur ROI client.
  - `alert-dispatcher` : Dispatch des alertes Slack et Email.

- **API Routes Next.js** (authentifiées, sauf `/api/webhooks/*`) :
  - `/api/media/download` : retourne actuellement `501 Not Implemented` — l'ingestion vidéo réelle (`yt-dlp`/`ffmpeg`) nécessite un binaire indisponible sur le runtime serverless Vercel. Import manuel requis en attendant un worker dédié.
  - `/api/integrations/notion/test` : validation d'un token Notion + listing des pages/bases accessibles (implémentation réelle, appelle l'API Notion).
  - `/api/webhooks/roi-event` : webhook récepteur de leads pour la reconstitution du ROI, protégé par `CENTURIONS_WEBHOOK_SECRET` (comparaison en temps constant, aucune valeur par défaut).

---

## 📱 Service Worker & PWA

Le Service Worker PWA (`public/sw.js`) gère la mise en cache offline des ressources critiques (`/`, `/manifest.json`, `/icon.svg`, `/overview`, `/clients`, `/leads`).

---

## 👨‍💻 Responsables & Support

Pour toute modification d'architecture ou de schéma Postgres, référez-vous au guide Supabase local dans `.agents/skills/supabase/SKILL.md`.
