# DOCUMENT DE HANDOFF — MINERVA CENTURIONS

## Résumé du projet

**Centurions de Minerva** a été développé pour servir de cockpit in-house haute performance. L'application est intégralement construite selon les spécifications strictes du repo `Endsi3g/Minerva-Flow`.

---

## Stack & Composants Clés

1. **Framework** : Next.js 15 (App Router) + TypeScript + Tailwind CSS.
2. **Design System** : `globals.css` natif avec support mode sombre par défaut, tokens HSL/HEX exacts, 5 animations personnalisées, typographies *New York* et *Plus Jakarta Sans*.
3. **Composants Shell** :
   - `AppShell.tsx` : Enveloppe réactive.
   - `AppSidebar.tsx` : Sidebar entièrement rétractable (mode compact 68px icônes / mode étendu 260px accordéon).
   - `AppBreadcrumb.tsx` : Fil d'Ariane dynamique sur tous les écrans.
   - `TopbarActions.tsx` : Actionneur de thème (Dark/Light), notifications, raccourcis.
   - `SearchDialog.tsx` : Palette de recherche globale `⌘K`.
4. **Composants UI Minerva** :
   - `StatCard.tsx` : Cartes de métriques avec indicateurs de variation et icônes.
   - `Card.tsx` : Conteneur de surface Minerva avec ombres et bordures.
   - `Badge.tsx` : Pillules d'état (Ready, On Track, At Risk).
   - `Button.tsx` : Boutons interactifs avec états de survol et micro-scale.
   - `HeatmapScale.tsx` : Échelle de chaleur à 5 paliers (`--mv-heat-1` à `--mv-heat-5`).

---

## Configuration Supabase & Sécurité

- Les clés d'accès Supabase sont définies dans `.env.local` et prêtes pour la production.
- Les schémas de base de données et politiques RLS sont documentés dans `supabase/migrations/20260811000000_init_centurions.sql`.
- Les 3 Edge Functions Supabase sont localisées sous `supabase/functions/`.

---

## Prochaines Étape pour l'Équipe Minerva

1. Déployer les migrations SQL sur Supabase via le CLI Supabase ou le Dashboard Supabase.
2. Déployer l'application web sur Vercel avec les variables d'environnement Supabase.
