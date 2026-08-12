<div align="center">

# Minerva Trequartista

**Système d'exploitation de livraison client, de suivi du ROI et d'excellence opérationnelle**

---

[![Next.js](https://img.shields.io/badge/Next.js-16.3-14170f?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-14170f?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-14170f?style=flat-square&logo=supabase)](https://supabase.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20%26%20RLS-14170f?style=flat-square&logo=playwright)](https://playwright.dev/)
[![License](https://img.shields.io/badge/Release-v2.0.0-14170f?style=flat-square)](https://github.com/Endsi3g/The-Trequartista-from-Minerva)

<br />

<img src="public/dashboard_preview.png" alt="Aperçu de l'application Minerva Trequartista" width="100%" />

---

</div>

<div align="center">

## Architecture & Présentation

Minerva Trequartista est la plateforme d'entreprise unifiée développée pour l'agence Minerva. Conçue pour remplacer la dispersion des outils opérationnels et garantir un niveau d'exécution homogène, la plateforme centralise le suivi financier des comptes, l'attribution des leads CRM, le contrôle qualité des livrables, la production de contenus vidéo et la gestion des procédures opérationnelles au sein d'un environnement unique et sécurisé.

---

## Modules Applicatifs

</div>

| Module | Fonctionnalités Clés |
| :--- | :--- |
| **Vue d'Ensemble & Dashboard** | Métriques financiers en temps réel (MRR Agence + SaaS), indicateurs de performance, journal d'audit et visualisations graphiques interactives. |
| **Suivi du ROI & Performance** | Analyse approfondie de l'investissement publicitaire, de la valeur du pipeline généré, du coût par lead (CPL), du ROAS et impression de rapports exécutifs. |
| **CRM Leads & Acquisition** | Gestionnaire complet des opportunités d'affaires en vues Kanban et Tableau, classification par niveau de qualification (A à D) et export CSV. |
| **Contrôle Qualité 20-Points** | Protocole d'assurance qualité à 20 points de contrôle obligatoires avant la mise en ligne des projets web et campagnes, validé via Edge Functions. |
| **Studio Reels & Vidéo** | Lecteur multi-format dédié aux contenus verticaux (9:16 - Reels, TikTok, Shorts) et paysage (16:9), avec service d'importation d'assets et téléchargement MP4. |
| **Académie SOP & Connaissances** | Base de connaissances centralisée regroupant les procédures opérationnelles standardisées (SOP), guides de design et normes de développement. |
| **Synchronisation Notion & Webhooks** | Intégration du protocole MCP (Model Context Protocol) pour la synchronisation bidirectionnelle des documentations et banc de test des webhooks d'acquisition. |
| **Supabase Storage Manager** | Interface d'administration des fichiers d'actifs clients et documents internes, avec pagination dynamique (10 fichiers par page) et modales de confirmation. |
| **Accessibilité ARIA & PWA** | Support Progressive Web App (PWA) avec mises à jour automatiques, conformité aux normes ARIA (focus traps natifs, aria-live) et raccourcis clavier globaux (Cmd+K). |

---

<div align="center">

## Sécurité & Gouvernance des Données

</div>

- **Row Level Security (RLS)** : Application stricte des politiques d'isolation au niveau des lignes de base de données PostgreSQL pour l'ensemble des tables applicatives et d'intégration.
- **Gestion des Accès & Approbation** : Contrôle d'accès basé sur les rôles (`admin`, `member`), restriction des domaines autorisés, table de liste blanche (`allowed_emails`) et déclencheur d'auto-approbation (`handle_new_user`).
- **Protection contre le Brute-Force** : Middleware de rate-limiting (5 requêtes par minute sur l'authentification, 20 requêtes par minute sur les API publiques) émettant un en-tête `HTTP 429 Retry-After`.
- **Assainissement des Variables d'Environnement** : Nettoyage automatique des clés d'API et jetons d'authentification pour prévenir toute corruption par caractères de saut de ligne (`CRLF`).

---

<div align="center">

## Spécifications Techniques

</div>

<div align="center">

| Composant | Technologie |
| :--- | :--- |
| **Framework Web** | Next.js 16 (App Router, Turbopack) |
| **Langage** | TypeScript (Mode Stricte) |
| **Interface & Styles** | Tailwind CSS, System Tokens, Lucide Icons, TheSVG |
| **Base de Données & Auth** | Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions) |
| **Assurance Qualité** | Playwright (Tests End-to-End, Contrôle d'Accès & Politiques RLS) |
| **Hébergement** | Vercel Enterprise Infrastructure |

---

## Déploiement & Mode Opératoire

</div>

```bash
# 1. Cloner le dépôt d'entreprise
git clone https://github.com/Endsi3g/The-Trequartista-from-Minerva.git
cd The-Trequartista-from-Minerva

# 2. Installer les dépendances du projet
pnpm install

# 3. Configurer l'environnement local (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 4. Démarrer le serveur de développement
pnpm dev

# 5. Lancer la suite de tests de sécurité et d'accessibilité
pnpm test

# 6. Générer le build d'optimisation pour la production
pnpm build
```

---

<div align="center">

  <sub>Minerva Flow Inc. &bull; Tous droits réservés</sub>

</div>
