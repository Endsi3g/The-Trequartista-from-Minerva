# SOP-DEV-03 — Guide Pratique : Créer de Nouvelles Fonctionnalités à Travers les Apps Minerva

**Dernière mise à jour :** 31 août 2026  
**Audience :** Développeurs Fullstack, Ingénieurs IA & Architectes Logiciels  
**Objectif :** Décrire le cycle de conception et de livraison de bout en bout d'une nouvelle fonctionnalité sur l'application Minerva (Next.js 16 App Router, Supabase RLS, TypeScript, Tailwind CSS).

---

## 1. Cycle de Développement d'une Fonctionnalité Minerva (The 6-Step Loop)

```
[1. Schéma Postgres / Supabase] ──> [2. Typage TypeScript & Zod]
             │
             ▼
[3. Service d'Accès aux Données] ──> [4. Composants UI & Design System]
             │
             ▼
[5. Route Page / API App Router] ──> [6. Raccourcis Clavier & Télémétrie]
```

---

## 2. Étape par Étape : Du Schéma à l'Interface

### Étape 1 : Schéma de Base de Données (Postgres & RLS)
Créez un nouveau fichier de migration SQL dans `supabase/migrations/YYYYMMDD00000X_nom_de_la_feature.sql` :
```sql
-- Création de la table
CREATE TABLE IF NOT EXISTS public.ma_nouvelle_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'draft' CHECK (statut IN ('draft', 'active', 'archived')),
  metadonnees JSONB DEFAULT '{}'::jsonb
);

-- Activation de la sécurité RLS
ALTER TABLE public.ma_nouvelle_table ENABLE ROW LEVEL SECURITY;

-- Politique d'accès lecture/écriture pour les membres authentifiés
CREATE POLICY "Acces membres authentifies" ON public.ma_nouvelle_table
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Étape 2 : Typage TypeScript Strict (`lib/types/index.ts`)
Ajoutez les interfaces typées dans `lib/types/index.ts` :
```typescript
export interface MaNouvelleEntite {
  id: string;
  created_at: string;
  updated_at: string;
  client_id?: string | null;
  titre: string;
  statut: 'draft' | 'active' | 'archived';
  metadonnees?: Record<string, any>;
}
```

### Étape 3 : Service de Données avec Fallback Optimiste (`lib/services/supabase-data.ts`)
Écrivez les fonctions d'accès avec gestion d'erreurs gracieuse :
```typescript
export async function fetchMesEntites(): Promise<MaNouvelleEntite[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('ma_nouvelle_table')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[Supabase] Erreur fetchMesEntites, utilisation fallback');
    return [];
  }
  return data as MaNouvelleEntite[];
}
```

### Étape 4 : Composants UI avec Design Tokens Minerva
Créez des composants haute densité dans `components/...` en appliquant les règles UI :
- Fond `#FAFAFA` / `#FFFFFF`.
- Bordures fines `border-zinc-200` (`1px solid rgba(0,0,0,0.08)`).
- Chiffres et badges en `font-mono tabular-nums`.
- États de survol fluides (`transition-colors duration-150`).

### Étape 5 : Assemblage dans l'App Router Next.js 16
Créez la page dans `app/(dashboard)/ma-feature/page.tsx` :
- Utilisez `'use client'` pour les pages interactives.
- Enveloppez dans `<PageFadeIn>` pour les transitions fluides.
- Intégrez les retours visuels via `useToast()`.

### Étape 6 : Raccourcis Clavier & Notifications Temps Réel
- Si la vue gère des listes ou des formulaires, ajoutez des raccourcis intuitifs (`C` pour créer, `/` pour filtrer, `⌘ + Entrée` pour enregistrer).
- Connectez les événements critiques au `NativeNotificationProvider` pour avertir l'équipe en direct.

---

## 3. Règles d'Or & Antipatterns à Proscrire

| Ce qu'il faut faire (Standard Minerva) | Ce qui est strictement interdit |
|---|---|
| Typage TS strict sans aucun `any` | Utiliser `as any` ou désactiver le linter |
| États de chargement avec SkeletonRows | Écrans blancs ou freeze de l'UI pendant les requêtes |
| Toast de confirmation en haut à droite | Alertes JavaScript natives `alert()` ou `confirm()` |
| Vérification préalable `npx tsc --noEmit` | Pousser du code sans validation statique |
| Mise à jour systématique de `CHANGELOG.md` | Livrer une version sans note de version |
