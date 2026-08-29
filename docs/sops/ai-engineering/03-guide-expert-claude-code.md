# SOP-IA-03 : Guide Expert Claude Code & Terminal Agentique

**Catégorie :** IA & Ingénierie  
**Public cible :** Développeurs Fullstack, DevOps, Ingénieurs IA  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Introduction à Claude Code

**Claude Code** est l'agent de programmation en ligne de commande (CLI) développé par Anthropic. Il s'exécute directement dans le terminal du développeur, accède à l'arbre Git local, lit et modifie les fichiers, exécute des commandes shell et interagit avec des serveurs MCP.

```
┌─────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE RUNTIME                    │
│                                                             │
│  Terminal Prompt ──► Tool Orchestration ──► Local Shell     │
│        ▲                     │                     │        │
│        │                     ▼                     ▼        │
│   CLAUDE.md          File Diff Engine       Git & Build     │
│  (Repo Rules)       (Multi-file edit)     (pnpm, tsc, test) │
└─────────────────────────────────────────────────────────────┘
```

### Installation & Configuration Initiale :
```bash
# Installation globale via npm / pnpm
npm install -g @anthropic-ai/claude-code

# Authentification initiale
claude

# Vérification de l'environnement
claude doctor
```

---

## 2. Commandes & Flags de Ligne de Commande

| Commande / Flag | Rôle & Comportement | Cas d'Usage Typique |
| :--- | :--- | :--- |
| `claude` | Ouvre une session de chat interactive dans le terminal courant | Session standard de pair-programming |
| `claude -p "prompt"` | Mode **Headless** (one-shot) : exécute la tâche et rend la main | Intégration CI/CD, scripts de migration automatisés |
| `claude --dangerously-skip-permissions` | Désactive les demandes de confirmation pour la lecture/écriture de fichiers et l'exécution bash | Environnements sandboxés ou scripts automatisés sûrs |
| `claude --verbose` | Affiche le détail des requêtes de tokens, headers et raw tool calls | Débogage fin des interactions d'outils |

---

## 3. Gestion du Contexte & Commandes Intégrées

Lors d'une session de développement avec Claude Code, la saturation de la fenêtre de contexte dégrade la qualité des réponses et augmente les coûts. Utilisez les commandes internes :

### `/compact`
- **Action** : Résume l'historique complet de la session en conservant les faits marquants, l'état du code et les décisions architecturales.
- **Bonne pratique Minerva** : Exécutez `/compact` toutes les 15 à 20 interactions ou avant d'aborder un nouveau sous-problème.

### `/cost`
- **Action** : Affiche la consommation exacte en tokens (Prompt, Completion, Cache Read, Cache Write) et le coût en dollars de la session en cours.

### `/clear`
- **Action** : Réinitialise entièrement l'historique de la session sans fermer le CLI. Idéal pour repartir sur une tâche complètement distincte.

---

## 4. Architecture de Mémoire & `CLAUDE.md`

Le fichier `CLAUDE.md` situé à la racine du dépôt est lu automatiquement par Claude Code au démarrage de chaque session. Il constitue la mémoire de référence du projet.

### Structure Recommandée du `CLAUDE.md` chez Minerva :
```markdown
# Minerva Trequartista — Guide Agentique

## Stack & Règles Fondamentales
- Next.js 16 App Router, React 19, TypeScript strict, Tailwind v3
- Pas de modals pour les formulaires (uniquement pages routées /view/new)
- Charte graphique v3 : Warm cream (#F0EDE0), Playfair Display + Inter, pas de Dark Mode

## Politique Real Data Only
- Aucun mock ou fausse donnée autorisée.
- Les requêtes passent par lib/services/supabase-data.ts

## Commandes de Vérification
- Validation des types : npx tsc --noEmit
- Tests E2E : npx playwright test
- Lint : npm run lint
```

---

## 5. Workflows de Code Multi-Fichiers & Git

Claude Code excelle dans les refactorings touchant de multiples fichiers simultanément.

### Workflow Standard d'une Modification avec Claude Code :
1. **Énoncer clairement la tâche avec son périmètre** :
   ```bash
   > "Ajoute un champ `is_archived` sur la table clients : mets à jour lib/types/index.ts, lib/services/supabase-data.ts, la migration SQL correspondante et le composant ClientCard.tsx."
   ```
2. **Laisser l'agent inspecter les fichiers nécessaires** : Claude Code lit les définitions TypeScript existantes avant de toucher au code.
3. **Appliquer les modifications atomiques** : Claude applique les patches et vérifie la syntaxe.
4. **Vérification automatique** :
   ```bash
   > "Lance npx tsc --noEmit et corrige immédiatement les éventuelles erreurs de typage."
   ```
5. **Revue du Git Diff** :
   ```bash
   > "Génère un résumé clair des modifications et prépare un commit atomique selon la convention Conventional Commits."
   ```

---

## 6. Bonnes Pratiques & Token Economics avec Claude Code

1. **Préférer des requêtes chirurgicales** : Mentionnez directement les chemins des fichiers pertinents dans votre prompt (ex: `@lib/types/index.ts`) pour éviter que l'agent ne scanne inutilement l'arborescence.
2. **Utiliser le Prompt Caching** : Ne modifiez pas sans raison le `CLAUDE.md` en cours de session, afin de profiter du cache de préfixe d'Anthropic.
3. **Ne jamais laisser l'agent deviner une clé d'API** : Utiliser les variables d'environnement définies dans `.env.local`.
