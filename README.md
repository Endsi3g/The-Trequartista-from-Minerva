# 🛡️ Minerva Centurions — Master Production SaaS Cockpit

**Minerva Centurions** est la plateforme SaaS B2B de pilotage de l'agence Minerva : gestion des clients & du ROI publicitaire, CRM des leads, contrôle qualité des projets (Checklist 20 points), Social Reels Studio avec lecteur vidéo universel, base de connaissances SOPs, intégration Notion MCP Server et PWA (Progressive Web App).

---

## ✨ Points Forts & Architecture

- **⚡ Architecture Fullstack Live & Realtime** : Conçu sur Next.js 15 App Router avec Supabase Postgres, Row Level Security (RLS) et WebSocket Channels (`SupabaseRealtimeProvider`).
- **📱 Progressive Web App (PWA)** : Support d'installation PWA avec Service Worker offline (`/sw.js`), `manifest.json` et raccourci mobile.
- **🎬 Social Reels Studio & Media Downloader** : Lecteur vidéo universel (`VideoAssetPlayer.tsx`) supportant les formats 9:16 vertical & 16:9 widescreen, contrôle de vitesse, téléchargement `.mp4` 1-clic et service Downloader (`yt-dlp`).
- **🔗 Intégration Notion MCP Server** : Connexion au serveur Notion MCP (`https://mcp.notion.com/mcp`) et synchronisation 2-voies (`/api/integrations/notion/sync`).
- **🎯 Leads CRM & Quality Pipeline** : Kanban / Tableau des leads avec qualification A/B/C/D et export CSV.
- **📋 Checklist 20-Points Qualité** : Validation automatique avec animations confettis et Edge Functions Supabase.
- **💬 Système Feedback & Toasts** : Moteur global de notifications toast (`ToastProvider.tsx`), widget feedback in-app (`UserFeedbackModal.tsx`) et modale de confirmation (`ConfirmDialog.tsx`).
- **🧪 Playwright E2E Audit Suite** : Suite de tests automatisés auditant les 23 routes desktop & mobile.

---

## 🛠️ Stack Technique

| Layer | Technologie |
| :--- | :--- |
| **Framework** | Next.js 15.1.7 (App Router, Server Actions) |
| **Styling** | Vanilla Tailwind CSS (Variables HSL Minerva) |
| **Database** | Supabase Postgres (Realtime & Storage) |
| **Icons** | Lucide React Icons |
| **PWA** | Web App Manifest & Custom Service Worker |
| **Testing** | Playwright E2E (`@playwright/test`) |
| **Deployment** | Vercel Platform & Supabase Edge Functions |

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
pnpm install
```

### 2. Variables d'environnement
Créez un fichier `.env.local` à la racine :
```env
NEXT_PUBLIC_SUPABASE_URL=https://eobatkwbwcdsdqbemrma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Lancer le serveur de développement
```bash
pnpm dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🧪 Tests & Build

```bash
# Vérification des types TypeScript (0 erreur)
npx tsc --noEmit

# Production Build
pnpm build

# Playwright E2E Audit Tests
npx playwright test
```

---

## 📄 Licence
Propriété exclusive de **Minerva Flow Inc.** — Tous droits réservés.
