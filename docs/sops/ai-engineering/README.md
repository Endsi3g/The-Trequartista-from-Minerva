# Cursus Officiel Minerva : AI Engineering & Outils Agentiques

Bienvenue sur le cursus de formation technique et opérationnel de Minerva dédié à l'**AI Engineering moderne**, à la maîtrise de la suite **Google Antigravity IDE**, de **Claude Code CLI**, de notre **Serveur MCP v2**, ainsi qu'aux méthodologies de développement **AI-First**.

---

## 🎯 Objectifs Pédagogiques

À l'issue de ce cursus de 6 modules, chaque ingénieur et développeur technique de Minerva sera capable de :
1. **Comprendre en profondeur la mécanique des LLMs** : Context windows, context engineering, function calling, boucles agentiques (ReAct), token economics et prompt caching.
2. **Exploiter Antigravity IDE au niveau expert** : Utiliser les slash commands (`/goal`, `/grill-me`, `/learn`, `/schedule`), orchestrer des subagents (dont browser subagents), manipuler le Planning Mode et créer des Custom Skills / Rules.
3. **Maîtriser Claude Code dans le terminal** : Automatiser des refactorings multi-fichiers, gérer le contexte mémoire (`/compact`, `CLAUDE.md`), optimiser les coûts et déléguer des tâches complexes.
4. **Interagir avec le serveur MCP Minerva** : Connecter des agents au serveur MCP (`/api/mcp`), utiliser les outils de production Supabase et développer de nouveaux tools sécurisés.
5. **Appliquer le workflow de développement AI-First de Minerva** : Rédiger des specs pilotées par IA, garantir la politique *Real Data Only*, gérer les migrations Supabase en toute sécurité et automatiser les tests avec Playwright.
6. **Concevoir des architectures RAG avancées** : Implémenter la recherche vectorielle avec `pgvector` sous Supabase, configurer le chunking sémantique, la recherche hybride (FTS + Vector) et le reranking.

---

## 🗺️ Matrice des Modules

| Module | Code | Titre | Focus Clé | Durée |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `SOP-IA-01` | [Fondations du AI Engineering Moderne](./01-fondations-ai-engineering.md) | LLMs, Context Engineering, Tool Calling, Agent Loops, Token Economics | 25 min |
| **02** | `SOP-IA-02` | [Guide Expert Antigravity IDE & Écosystème](./02-guide-expert-antigravity.md) | Slash Commands, Subagents, Planning Mode, Skills, Knowledge Items | 30 min |
| **03** | `SOP-IA-03` | [Guide Expert Claude Code & Terminal Agentique](./03-guide-expert-claude-code.md) | CLI, Session Management, `CLAUDE.md`, Multi-file Edits, Git Workflow | 25 min |
| **04** | `SOP-IA-04` | [Minerva MCP Server & Tool Augmentation](./04-minerva-mcp-tool-augmentation.md) | Model Context Protocol v2, `/api/mcp`, Auth Tokens, Custom Tools | 20 min |
| **05** | `SOP-IA-05` | [Workflow de Développement "AI-First" chez Minerva](./05-workflow-dev-ai-first-minerva.md) | Spec-to-Code, Playwright QA, Migrations Supabase, Real Data Only | 25 min |
| **06** | `SOP-IA-06` | [RAG Avancé, Vector Search & Stratégies Hybrides](./06-rag-vector-search-fine-tuning.md) | pgvector, Chunking, Hybrid Search (FTS + Dense), Reranking | 25 min |

---

## 🛠️ Stack Technique de Référence

Toutes les pratiques enseignées dans ce cursus sont calibrées pour la stack Minerva Trequartista :
- **Framework** : Next.js 16 (App Router), React 19, TypeScript strict
- **Styling** : Tailwind CSS v3, Design System Minerva v3 (Playfair Display + Inter, warm cream)
- **Base de Données & Backend** : Supabase (PostgreSQL 15+, Auth, Storage, Realtime, pgvector)
- **Agentique & IDE** : Google Antigravity IDE, Claude Code CLI, Hermes Agent
- **Protocole d'Outils** : Model Context Protocol v2 (`@modelcontextprotocol/server`)
- **Qualité & QA** : Playwright E2E, Zod runtime validation

---

## 🚀 Parcours d'Onboarding Recommandé

1. **Semaine 1 (J1-J2)** : Lire et expérimenter les modules **SOP-IA-01** et **SOP-IA-02**. Configurer Antigravity et tester les slash commands sur une branche de travail.
2. **Semaine 1 (J3-J4)** : Prise en main de **SOP-IA-03** (Claude Code) et **SOP-IA-04** (Minerva MCP). Connecter Claude Code et Antigravity au endpoint MCP local/distant.
3. **Semaine 2 (J5-J7)** : Mettre en œuvre le workflow complet **SOP-IA-05** sur une vraie tâche issue du backlog (création de spec, tests Playwright, PR).
4. **Semaine 2 (J8-J10)** : Étudier **SOP-IA-06** pour la conception de fonctionnalités de recherche sémantique et d'assistant documentaire.
