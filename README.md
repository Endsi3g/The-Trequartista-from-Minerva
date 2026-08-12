<div align="center">

  # Minerva Trequartista

  **Le système d'exploitation de livraison client, de suivi du ROI et d'excellence opérationnelle**

  [![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/Release-v2.0.0-green?style=flat-square)](https://github.com/Endsi3g/The-Trequartista-from-Minerva)

  ---

</div>

<div align="center">
  <img src="public/dashboard_preview.png" alt="Aperçu de l'application Minerva Trequartista" width="100%" />
</div>

---

## 🚀 Présentation du Projet

**Minerva Trequartista** (v2.0.0) est la plateforme centrale de gestion et de livraison client développée pour l'agence **Minerva**. Conçue pour unifier les opérations, la plateforme regroupe le suivi financier des clients, l'attribution des leads CRM, le contrôle qualité 20-points des livrables, le studio de contenu vidéo et la gestion des procédures internes (SOP) au sein d'une interface réactive et sécurisée.

Minerva Trequartista offre aux dirigeants d'agence, directeurs de comptes et équipes média une visibilité en temps réel sur la rentabilité des campagnes, l'avancement des projets et la performance opérationnelle.

---

## ⚡ Modules Principaux

### 📊 Vue d'Ensemble & Dashboard Opérationnel
- **Métriques financiers en direct** : Suivi du MRR Total Agence + SaaS, du nombre de projets actifs et de la moyenne de ROI client.
- **Visualisations interactives** : Graphiques de tendance en zone (AreaChart), sparklines de croissance et histogrammes interactifs.
- **Journal d'audit en temps réel** : Traçabilité complète de l'ensemble des événements et modifications applicatives.

### 💰 Suivi du ROI & Rapports Exécutifs
- **Calculateur de rentabilité** : Analyse de l'investissement publicitaire, de la valeur du pipeline généré, du coût par lead (CPL), du ROAS et du positionnement SEO.
- **Rapports clients** : Génération et impression de rapports exécutifs prêts pour présentation client.

### 🗂️ CRM Leads & Pipeline d'Acquisition
- **Vues Kanban & Tableau** : Gestionnaire complet d'opportunités avec classification par qualification (A, B, C, D).
- **Import / Export CSV** : Filtrage par client, recherche instantanée et export des leads au format CSV.

### ✅ Checklist Qualité 20-Points & Validation de Lancement
- **Protocole d'assurance qualité** : 20 points de contrôle obligatoires avant la mise en ligne des sites et campagnes (performances Web Vitals, balises OpenGraph, conformité Loi 25, intégrations formulaires).
- **Edge Functions** : Calcul automatique du score de conformité et validation en direct.

### 🎬 Studio Reels & Contenus Vidéo
- **Prévisualisation multi-format** : Conteneurs de lecture dédiés aux formats verticaux (9:16 - Reels, TikTok, Shorts) et paysage (16:9).
- **Import & Téléchargement MP4** : Service d'import vidéo et téléchargement 1-clic.

### 📚 Académie SOP & Base de Connaissances
- **Procédures opérationnelles (SOP)** : Guide centralisé de design, de développement et de processus client pour la formation des équipes.

### 🔗 Intégrations & Synchronisation Notion
- **Protocole MCP (Model Context Protocol)** : Synchronisation des bases de connaissances Notion.
- **Banc de test d'API & Webhooks** : Outil de test des événements d'acquisition d'opportunités (`/api/webhooks/roi-event`).

### 📦 Supabase Storage Browser
- **Gestionnaire de fichiers** : Navigation paginée (10 fichiers par page) avec filtres de buckets (`client-assets`, `team-documents`, `academy-media`).
- **Confirmation de suppression** : Boîte de dialogue ARIA de confirmation avant toute suppression définitive.

### 📱 PWA & Accessibilité
- **Progressive Web App** : Installation mobile, icônes adaptatives et mises à jour PWA automatiques.
- **Accessibilité ARIA** : Modales dialog avec focus trap natif (`inert`), annonces aux lecteurs d'écran via `aria-live` et raccourcis clavier globaux (`Cmd+K` / `Ctrl+K`).

---

## 🛡️ Sécurité, Authentification & Architecture

- **Row Level Security (RLS)** : Activation stricte des politiques RLS sur 9 tables Supabase avec isolation par propriétaire (`user_id = auth.uid()`) pour les clés d'API et configurations d'intégration.
- **Système de Whitelist & Auto-Approbation** : Restriction des connexions aux domaines autorisés et aux courriels figurant dans la table `allowed_emails`. Déclencheur SQL (`handle_new_user`) d'approbation automatique des comptes invités.
- **Nettoyage Automatique des Variables d'Environnement** : Assainissement de toutes les clés d'environnement Supabase (`lib/supabase/env.ts`) pour éliminer tout retour à la ligne CRLF (%0D%0A).
- **Rate-Limiting Middleware** : Limitation des tentatives de brute-force (5 req/60s sur `/login` et `/signup`, 20 req/min sur les routes API publiques) avec en-têtes `HTTP 429 Retry-After`.
- **Navigation Directe (Hard Navigation)** : Connexion et inscription avec redirection `window.location.href` pour assurer la mise à jour immédiate des cookies de session Supabase.

---

## 🛠️ Stack Technique

- **Framework** : [Next.js 16 (App Router & Turbopack)](https://nextjs.org/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Style & UI** : Vanilla CSS Tokens, [Tailwind CSS](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/), [TheSVG](https://github.com/glincker/thesvg)
- **Backend & Base de données** : [Supabase](https://supabase.com/) (@supabase/ssr, Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **Tests de Qualité & RLS** : [Playwright](https://playwright.dev/) (Access Control, Rate-limiting & RLS API integration tests)
- **Hébergement** : [Vercel Production](https://vercel.com/)

---

## 💻 Installation & Développement

```bash
# 1. Cloner le projet
git clone https://github.com/Endsi3g/The-Trequartista-from-Minerva.git
cd The-Trequartista-from-Minerva

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 4. Lancer le serveur de développement
pnpm dev

# 5. Exécuter les tests automatisés Playwright
pnpm test

# 6. Compiler pour la production
pnpm build
```

---

<div align="center">

  <sub>Minerva Flow Inc. &bull; Tous droits réservés</sub>

</div>
