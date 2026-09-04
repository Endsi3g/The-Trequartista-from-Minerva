-- ============================================================================
-- Migration : 20260904010000_tech_sop_07_multi_ai_workflow.sql
-- Description : SOP-TECH-07 - Workflow d'Équipe Multi-IA & Standard d'Ingénierie GitHub
-- Version : v2.26.0
-- ============================================================================

INSERT INTO public.academy_sops (
  title,
  description,
  category,
  target_workspace,
  content_markdown,
  read_time_min,
  author,
  is_essential,
  is_featured,
  is_onboarding_step,
  sort_order,
  pillar,
  checklist_items,
  script_template
)
SELECT
  'SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub',
  'Méthodologie complète d’ingénierie collaborative avec l’IA : synergie Perplexity, Gemini, Codex et Claude Code sur un socle GitHub professionnel (CI/CD, PRs, tests et sécurité).',
  'Workflows IA',
  'tech',
  '# SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub

> **Rôle & Posture :** Cadre directeur d''ingénierie logicielle pour l''équipe Minerva et ses assistants IA. Définit la coordination opérationnelle entre Perplexity, Gemini, Codex et Claude Code avec GitHub comme colonne vertébrale immuable.

---

## 1. Contexte & Objectifs de l''Ingénierie Multi-IA

Chez Minerva, nous développons des produits SaaS de pointe (ex. Minerva Flow, Minerva Reach) et des outils ERP d''exploitation interne (Minerva Trequartista). Ce standard vise à :
- **Sanctuariser GitHub** comme socle unique de vérité et de sécurité (branches, tests automatiques, CI/CD, sécurité des secrets).
- **Cadrer la planification produit avec Perplexity** du besoin métier jusqu''au cahier des charges technique.
- **Orchestrer un workflow d''équipe multi-IA** où chaque modèle intervient sur sa zone d''excellence sans se marcher sur les pieds.
- **Appliquer des conventions strictes** de code, de revue humaine/machine et de gouvernance.

---

## 2. GitHub : Socle de Développement, CI/CD & Sécurité

### 2.1 Organisation du Dépôt & Stratégie de Branches
La branche principale est sacrée et protégée.
- `main` : Branche de production, verrouillée, toujours déployable sans friction sur Vercel.
- `develop` (optionnel selon les chantiers) : Branche d''intégration d''épopée.
- `feat/<nom-fonctionnalite>` : Branches de fonctionnalités dédiées.
- `bugfix/<nom-bug>` : Branches de correctifs de bugs ciblés.
- `hotfix/<nom-hotfix>` : Correctifs urgents appliqués directement depuis la production.

#### Conventions de Commits (Conventional Commits)
- `feat(scope): ...` : Nouvelle fonctionnalité utilisateur ou technique.
- `fix(scope): ...` : Résolution d''un bogue ou d''un comportement inattendu.
- `refactor(scope): ...` : Refactorisation sans modification du comportement externe.
- `docs(scope): ...` : Documentation, wikis, ou SOPs d''académie.
- `chore(scope): ...` : Maintenance, dépendances, configuration CI/CD.

### 2.2 Tests & Qualité de Code Stricte
Tout code produit avec ou sans IA doit satisfaire à un triple contrôle :
1. **Typage Stricte TypeScript :** Zéro `any`. Vérification impérative via `npx tsc --noEmit`.
2. **Linting & Formatage :** Conformité aux règles ESLint et Prettier du projet.
3. **Protocole QA 20-Points :** Homologation via la console d''assurance qualité (`QualityChecklistRunner`).

### 2.3 Pipeline CI/CD GitHub Actions
Le pipeline se découpe en deux phases automatisées :
- **CI (Continuous Integration) :** Déclenchée à chaque push ou création de Pull Request.
  - Installation des dépendances avec cache de paquet (`npm ci`).
  - Validation du typage TypeScript (`npx tsc --noEmit`).
  - Linter et vérification statique.
  - Build applicatif Next.js (`npm run build`).
- **CD (Continuous Deployment) :** Déclenchée lors du merge dans `main`.
  - Déploiement automatique sur l''infrastructure de production (Vercel).
  - Validation des webhooks de notification.

### 2.4 Sécurité & Gestion des Secrets
- **Zéro Clé dans Git :** Aucune clé API, token de service ou chaîne de connexion PostgreSQL ne doit figurer dans le code source ou l''historique Git.
- **Variables d''Environnement :** Configuration via GitHub Secrets et Vercel Environment Variables (`.env.local` réservé au local et strictement gitignoré).
- **Protection des Branches :** Revue obligatoire, passage vert de tous les checks CI avant fusion.

---

## 3. Planification Produit avec Perplexity

Perplexity intervient en amont comme **cerveau de recherche et d''analyse concurrentielle**.

### 3.1 Du Besoin à la Mini-PRD
Lorsqu''une nouvelle fonctionnalité émerge :
1. **Clarification Métier :** Définir le problème utilisateur, le persona cible et le gain d''efficacité visé.
2. **Recherche & Benchmark Perplexity :**
   - Étude des standards UX du marché et des solutions concurrentes.
   - Veille sur les patterns d''architecture et bibliothèques recommandées.
   - Vérification des contraintes légales, de conformité ou de sécurité (ex. RGPD, lois québécoises sur les données).
3. **Rédaction de la Mini-PRD :**
   - Objectif business clair & métriques de succès.
   - User stories et critères d''acceptation vérifiables.
   - Contraintes techniques et dépendances tierces.

### 3.2 Découpage Technique
À partir de la PRD, décomposer le chantier en tickets GitHub clairs :
- Frontend (composants UI, accessibilité, états réactifs).
- Backend & Base de Données (schémas SQL, migrations Supabase, RLS policies).
- Intégrations externes & endpoints API.

---

## 4. Orchestration Multi-IA : Rôles & Synergies

Chaque modèle d''intelligence artificielle est positionné selon ses forces spécifiques :

| Assistant IA | Rôle Principal | Tâches Types |
| :--- | :--- | :--- |
| **Perplexity** | Recherche & Spécification | Veille technologique, benchmark UX, clarification du besoin, cadrage de mini-PRD. |
| **Gemini** | Scaffolding & Architecture | Génération de composants Next.js initiaux, structure de routes App Router, propositions d''implémentation. |
| **Codex / LLMs Spécialisés** | Implémentation Précise | Écriture de scripts SQL de migration, fonctions utilitaires, suites de tests unitaires et intégration. |
| **Claude Code** | Revue Holistique & Cohérence | Analyse cross-fichiers, détection d''incohérences, refactoring de haut niveau, documentation technique. |

---

## 5. La Boucle de Développement en 7 Étapes

Pour chaque fonctionnalité ou mise à jour, l''équipe applique rigoureusement cette boucle :

```
[1. Clarification PRD] (Perplexity)
       ↓
[2. Conception Technique] (Architecture & Modèle SQL)
       ↓
[3. Branche Git Dédiée] (feat/nom-du-module)
       ↓
[4. Génération de Code Initial] (Gemini / Codex)
       ↓
[5. Revue & Harmonisation Globale] (Claude Code + Lead Humain)
       ↓
[6. Contrôle Qualité Strict] (npx tsc --noEmit + Protocole 20-Points)
       ↓
[7. Pull Request & CI/CD] (GitHub Actions + Déploiement Staging/Prod)
```

---

## 6. Bonnes Pratiques pour Coder en Équipe avec l''IA

1. **Ne Jamais Accepter de Code Non Vérifié :** Même généré par l''IA la plus avancée, chaque ligne doit être comprise, compilée et éprouvée.
2. **Conserver la Trace Écrite :** Documenter dans les descriptions de Pull Request quelles parties ont été accélérées par l''IA et comment elles ont été auditées.
3. **Mettre à Jour la Documentation :** Toute modification de schéma DB ou de flux métier doit mettre à jour `CHANGELOG.md` et les documents de référence.',
  15,
  'Kael Belceus & Lead Tech',
  true,
  true,
  true,
  7,
  'transversal',
  '[
    "1. Cadrer le besoin et générer la mini-PRD via Perplexity (analyse comparative & contraintes)",
    "2. Définir l''architecture technique, les endpoints et le modèle de données",
    "3. Créer une branche Git dédiée (feat/... ou fix/...) rattachée au ticket GitHub",
    "4. Générer le code initial et le scaffolding avec Gemini ou Codex",
    "5. Réviser et harmoniser le code dans le codebase global avec Claude Code",
    "6. Valider la qualité stricte locale : npx tsc --noEmit et protocole QA 20-points",
    "7. Ouvrir la Pull Request détaillée, valider la CI GitHub Actions et planifier le déploiement"
  ]'::jsonb,
  '# ── 1. PROMPT SYSTÈME UNIVERSEL POUR ASSISTANT IA ──
Tu es Minerva Trequista, mon assistante technique senior et cheffe de projet produit.
Ton rôle est de m’aider à structurer, planifier et exécuter le cycle de vie d''une tâche dans mon workspace technique.
Stack : Next.js 16 (App Router) • Supabase (Postgres, RLS, Realtime) • Tailwind CSS • TypeScript Strict.
Workflow :
1. Recherche/PRD (Perplexity) -> 2. Architecture -> 3. Génération (Gemini/Codex) -> 4. Revue globale (Claude Code) -> 5. Tests/QA -> 6. GitHub PR -> 7. Déploiement CI/CD.
Règles : Zéro any TypeScript, gestion gracieuse des erreurs, design tokens Minerva (#FAFAFA / #09090B, accent #059669).

# ── 2. SÉQUENCE TERMINAL D’INGÉNIERIE GIT & CI ──
# Synchronisation & Nouvelle Branche
git checkout main && git pull origin main
git checkout -b feat/[nom-fonctionnalite]

# Développement & Vérification Qualité Stricte
npm run dev
npx tsc --noEmit

# Commit Conventionnel & Publication
git add .
git commit -m "feat([scope]): [description claire et concise]"
git push -u origin feat/[nom-fonctionnalite]

# Création de la Pull Request avec GitHub CLI
gh pr create --title "feat([scope]): [titre]" --body "### Contexte\n...\n### Modifications\n...\n### Validation\n- [x] npx tsc --noEmit (0 erreur)\n- [x] Audit QA validé"'
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_sops
  WHERE title = 'SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub'
);
