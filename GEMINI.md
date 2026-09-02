# Minerva Trequartista — Guide Technique & Directives IA (GEMINI.md)

**Version du Système :** v2.17.2  
**Stack Principale :** Next.js 16 (App Router) • Supabase (PostgreSQL + RLS + Realtime) • Tailwind CSS • TypeScript Strict Mode

---

## 1. Vue d'Ensemble & Écosystème Minerva

Minerva Trequartista est l'ERP et système d'exploitation central de l'agence Minerva. Il communique avec 2 applications externes :
1. **Minerva Reach (Desktop / Mobile)** : `https://minerva-os-lite-desktop.vercel.app/today`
   - Application de routine quotidienne et de qualification de leads terrain.
2. **Minerva Flow (SaaS Client)** : `https://minerva-flow.vercel.app/login`
   - Produit SaaS de commande en ligne et QR code vendu aux restaurateurs et commerçants.

---

## 2. Architecture des Workspaces & Routage

L'application supporte 3 workspaces spécialisés configurés sur le profil utilisateur (`profiles.workspace`) :
- **Prospection** : Focus acquisition, CRM Leads, Appels vocaux IA, Réseau & Contacts, Propositions & Devis.
- **Managing** : Focus rétention client, gestion des projets/livrables, facturation Stripe, suivi ROI et équilibrage de charge d'équipe (`/team/workload`).
- **Tech** : Console d'ingénierie haute densité (`/tech`), monitoring d'infrastructure, protocole d'assurance qualité 20-points (`QualityChecklistRunner`) et changelog technique.

> **Règle Critique React Hooks** : Dans `app/(dashboard)/overview/page.tsx`, tous les hooks (`useState`, `useEffect`, `useRouter`) doivent être déclarés en tête du composant AVANT toute condition sur `workspace === 'tech'`.

---

## 3. Base de Données & Déploiement 1-Clic

Le schéma complet de la base de données est consolidé en un script unique et idempotent :
- **Fichier maître :** `supabase/deploy_production_complete.sql`
- **Exécution :** Copier-coller dans le [SQL Editor Supabase](https://supabase.com/dashboard/project/_/sql) et exécuter en 1 clic.

### Tables Clés :
- `profiles` : Utilisateurs et rôles (`admin`, `manager`, `member`).
- `clients` : Comptes clients avec MRR et jeton de portail.
- `leads` : Pipeline de vente avec étapes de conversion.
- `projects` & `tasks` : Gestion des projets et tâches techniques.
- `documents` : Documents et wikis avec hiérarchie de blocs `DocumentBlock[]`.
- `proposals` : Propositions commerciales avec signature électronique (Canvas SVG) et acompte Stripe 50%.
- `invoices` : Factures générées automatiquement avec TPS/TVQ.
- `team_commissions` : Moteur de commissions RevOps (10% Setup + 5% MRR + multiplicateur quota 1.25x).
- `team_chat_messages` : Messagerie d'équipe temps réel avec canaux thématiques (`#général`, `#annonces`) et mentions `@all`.
- `tech_qa_audits` : Audits d'assurance qualité 20-points pré-déploiement.
- `academy_sops` : Procédures opérationnelles standardisées et cours interactifs.
- `ai_generation_logs` : Télémétrie et logs d'audit des opérations Notion AI (actions, modèles, durées, tokens).

---

## 4. Protocole MCP & Intégrations Composio

- **Serveur MCP Interne :** Route API `app/api/mcp/route.ts` exposant les outils d'extraction CRM, de gestion de leads et de documentation SOP.
- **Hub Composio Hosted MCP :** `https://connect.composio.dev/mcp` permettant la connexion directe aux services externes (Gmail, Google Drive, Stripe, GitHub).

---

## 5. Règles de Développement & Validation

1. **Typage Stricte :** Aucun `any` autorisé. Vérification obligatoire via :
   ```bash
   npx tsc --noEmit
   ```
2. **Design Tokens :**
   - Fond primaire : `#FAFAFA` (Light) / `#09090B` (Dark).
   - Accents : Vert émeraude `#059669` (hover `#047857`, fond subtil `#ECFDF5`, bordure `#A7F3D0`).
   - Chiffres & Compteurs : `font-mono tabular-nums`.
3. **Gestion des Erreurs :** Fallback gracieux et dégradation propre sur toutes les requêtes (zéro freeze ni écran blanc).
4. **Commits Conventionnels & Changelog :** Mettre à jour `CHANGELOG.md` à chaque release avant tout push sur la branche active.
