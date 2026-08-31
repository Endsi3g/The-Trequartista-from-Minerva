# SOP-IA-05 : Workflow de Développement "AI-First" chez Minerva

**Catégorie :** IA & Ingénierie  
**Public cible :** Toute l'équipe technique Minerva  
**Temps de lecture :** 25 minutes  
**Auteur :** Équipe Technique Minerva  

---

## 1. Le Manifeste AI-First de Minerva

Chez Minerva, nous ne développons plus de logiciel comme en 2020. L'ingénieur n'est plus un simple « rédacteur de syntaxe », mais un **Architecte Système et Tech Lead** qui pilote des agents IA de pointe (Antigravity, Claude Code) pour concevoir, implémenter et valider des fonctionnalités à haute valeur ajoutée.

```
┌─────────────────────────────────────────────────────────────┐
│                 LE CYCLE SPEC-TO-CODE EN 5 ÉTAPES           │
│                                                             │
│  [1. Spécification]  ──►  [2. Plan Architectural]           │
│     (/grill-me)             (implementation_plan.md)        │
│                                        │                    │
│                                        ▼                    │
│  [4. Tests & QA]     ◄──  [3. Implémentation Atomique]      │
│  (Playwright + tsc)         (Agents & Diff Engine)          │
│        │                                                    │
│        ▼                                                    │
│  [5. Walkthrough & Déploiement]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Le Cycle de Développement en 5 Étapes

### Étape 1 : Cadrage & `/grill-me`
- Ne sautez jamais directement sur l'implémentation.
- Utilisez la commande `/grill-me` pour que l'agent audite la codebase, identifie les contraintes cachées (ex: colonnes nullable, tables de liaison, types de badges existants) et pose les questions d'arbitrage.

### Étape 2 : Plan Architectural Formel
- L'agent rédige `implementation_plan.md`.
- L'ingénieur examine les schémas modifiés, la stratégie de dégradation gracieuse et le plan de test.
- Approbation explicite obligatoire avant toute modification de fichier.

### Étape 3 : Implémentation Atomique
- Modifications par blocs logiques cohérents (Types `lib/types/` → Service `lib/services/` → Composant UI → Page routée).
- Préservation systématique des docstrings et commentaires pertinents.

### Étape 4 : Validation Automatisée & Visual QA
- Validation stricte des types : `npx tsc --noEmit`.
- Tests E2E Playwright pour valider le comportement utilisateur sans régression.

### Étape 5 : Revue & Walkthrough
- Rédaction du `walkthrough.md` récapitulant les modifications, les résultats des tests et les preuves de bon fonctionnement.

---

## 3. Règle d'Or : Real Data Only & Dégradation Gracieuse

> [!CAUTION]
> Aucune donnée fictive (fake clients, fake MRR, fake metrics) ne doit être introduite dans l'application.

- **États Vides Honnêtes** : Si une table est vide, l'interface affiche explicitement : *« Aucun élément pour le moment »* avec un CTA d'action réel.
- **Dégradation Gracieuse** : Si une intégration tierce (ex: Twilio, Stripe, Brevo, ElevenLabs) n'a pas ses clés d'API configurées dans l'environnement, l'interface et les API doivent intercepter l'erreur proprement et indiquer *« Service non configuré »* sans planter la page ni simuler un faux succès.

---

## 4. Gestion des Migrations Supabase avec l'IA

Les migrations Supabase sont critiques et irréversibles si mal gérées.

### Règles de Gestion des Migrations SQL :
1. **Nommage Horodaté Strict** : `supabase/migrations/YYYYMMDDHHMMSS_description_courte.sql`.
2. **Idempotence Obligatoire** :
   ```sql
   -- Exemple d'ajout de colonne sécurisé
   ALTER TABLE public.clients
   ADD COLUMN IF NOT EXISTS tier_level TEXT DEFAULT 'Standard';

   -- Création de table avec RLS activé d'emblée
   CREATE TABLE IF NOT EXISTS public.ai_agent_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       agent_name TEXT NOT NULL,
       execution_ms INT NOT NULL,
       status TEXT NOT NULL CHECK (status IN ('success', 'error'))
   );

   ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;
   ```
3. **Jamais d'édition d'une migration déjà déployée** : Le CLI Supabase suit les migrations appliquées par nom de fichier. Tout correctif nécessite un nouveau fichier avec un horodatage postérieur.

---

## 5. Tests Automatisés & Visual QA avec Playwright

Chaque nouvelle vue routée ou composant critique doit être couvert par un test E2E Playwright.

### Exemple de Test E2E Standard (`tests/academy.spec.ts`) :
```typescript
import { test, expect } from '@playwright/test';

test.describe('Académie & Cursus AI Engineering', () => {
  test('Affiche le parcours de formation et permet de consulter un SOP', async ({ page }) => {
    await page.goto('/academy');

    // Vérifier la présence du bloc de formation officiel
    await expect(page.getByText('Cursus Officiel : AI Engineering')).toBeVisible();

    // Cliquer sur le module 1
    await page.getByText('Fondations du AI Engineering').click();

    // Vérifier l'URL et le rendu du contenu markdown
    await expect(page).toHaveURL(/\/academy\/sop-ai-01-foundations/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
```

---

## 6. Checklist de Code Review pour les PRs Générées par IA

Avant de merger une branche assistée par IA, vérifiez systématiquement :

- [ ] **Typage TypeScript Strict** : Aucun `any` injustifié. Tous les payloads API passent par des types `lib/types/index.ts`.
- [ ] **Respect de l'App Router Next.js 16** : Utilisation adéquate des Server Components vs Client Components (`'use client'`).
- [ ] **Pas de Modals pour les formulaires** : Les flux de création utilisent des pages dédiées `/feature/new`.
- [ ] **Design System Minerva v3** : Typographie Playfair Display pour les titres, Inter pour le texte, palette warm cream `#F0EDE0`.
- [ ] **Sécurité & Tokens** : Aucune variable d'environnement secrète exposée côté client (`NEXT_PUBLIC_*`).
- [ ] **Zero Mock** : Aucune donnée codée en dur.
