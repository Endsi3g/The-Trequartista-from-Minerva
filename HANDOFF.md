# 🤝 HANDOFF — Minerva Centurions Master Architecture

Document de transmission technique et opérationnel pour l'écosystème **Minerva Centurions**.

---

## 📌 Statut Actuel du Projet

- **Version Production** : `v1.0.0` / Tag `v1.0.0-master-architecture`
- **Déploiement Vercel** : En ligne sur Vercel Platform avec PWA active (`/manifest.json`, `/sw.js`).
- **Score Playwright E2E** : **19 / 19 tests réussis (100%)**
- **Typecheck TypeScript** : **0 erreur** (`npx tsc --noEmit`)

---

## 🗄️ Migrations SQL Supabase

Toutes les migrations SQL sont situées dans le dossier `supabase/migrations/` :

1. `20260811000001_audit_logs_and_realtime.sql` — Journal d'audit et abonnements Realtime.
2. `20260811000002_leads_crm.sql` — Table CRM des leads et score A/B/C/D.
3. `20260811000003_content_posts_and_media.sql` — Metadata vidéos et Social Reels Studio.
4. `20260811000004_notion_config.sql` — Tokens Notion et serveur Notion MCP (`https://mcp.notion.com/mcp`).
5. `20260811000005_user_feedbacks.sql` — Widget feedback in-app et persistance Supabase.
6. `20260811000006_user_api_keys.sql` — Générateur de clés API Webhook.

---

## ⚡ Edge Functions & Server API Routes

- **Edge Functions Supabase** :
  - `launch-check-validator` : Validation automatique 20/20 points.
  - `roi-aggregator` : Recalcul en temps réel du multiplicateur ROI client.
  - `alert-dispatcher` : Dispatch des alertes Slack et Email.

- **API Routes Next.js** :
  - `/api/media/download` : Proxy du service de téléchargement vidéo `yt-dlp` vers Supabase Storage.
  - `/api/integrations/notion/sync` : Synchronisateur Notion MCP 2-voies.
  - `/api/webhooks/roi-event` : Webhook récepteur de leads pour la reconstitution du ROI.

---

## 📱 Service Worker & PWA

Le Service Worker PWA (`public/sw.js`) gère la mise en cache offline des ressources critiques (`/`, `/manifest.json`, `/icon.svg`, `/overview`, `/clients`, `/leads`).

---

## 👨‍💻 Responsables & Support

Pour toute modification d'architecture ou de schéma Postgres, référez-vous au guide Supabase local dans `.agents/skills/supabase/SKILL.md`.
