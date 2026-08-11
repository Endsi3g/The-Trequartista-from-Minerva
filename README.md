# 🛡️ MINERVA CENTURIONS — COCKPIT IN-HOUSE

**Centurions de Minerva** est le cockpit interne à usage exclusif de la direction et des collaborateurs de **Minerva** pour piloter l'agence, la livraison des projets clients (avec la checklist 20 points obligatoire), la mesure du ROI, et la gestion du personnel / 1-on-1s.

---

## 🎨 Design System Minerva (Mode Sombre Natif)

L'application applique rigoureusement les règles et tokens CSS du Design System Minerva :

| Token | Rôle | Valeur Sombre (Défaut) |
| --- | --- | --- |
| `--mv-cream` | Fond principal | `#14170f` |
| `--mv-surface` | Cartes / Surfaces | `#1e231a` |
| `--mv-green` | Vert principal de marque | `#1c9a6f` |
| `--mv-lime` | Accent secondaire | `#dfff5f` |
| `--mv-ink` | Texte principal | `#f3f2ea` |
| `--mv-ink-soft` | Texte secondaire | `#a0a89a` |
| `--mv-border` | Bordures | `#282e22` |

- **Typographies** : *New York* (display serif) & *Plus Jakarta Sans* (`font-feature-settings: "ss01" 1, "cv05" 1`).
- **Animations Globales** : `mv-fade-up`, `mv-shimmer`, `mv-leaf-breathe`, `mv-check-pop`, `mv-scale-in`.
- **Sidebar Rétractable** : Navigation unifiée avec bascule de rétraction (68px icônes / 260px étendu).

---

## 🗺️ Architecture des Pages (3 Domaines)

### 📊 DOMAINE 1 : PILOTAGE & FINANCES
- `/overview` — Command Center MRR, projets actifs, NPS et raccourcis opérations.
- `/clients` — Répertoire des abonnements clients et statut des contrats.
- `/clients/[id]/roi-tracker` — Vue détaillée du ROI client (Leads, CPL, Pipeline, SEO, Ads & Heatmap scale).

### 🚀 DOMAINE 2 : OPÉRATIONS & QUALITÉ
- `/projects` — Pipeline Kanban/Table de tous les projets en cours.
- `/projects/[id]/roadmap` — Roadmap des jalons (Framer, GMB, WhatsApp IA, Text-back).
- `/projects/[id]/launch-check` — Checklist Qualité 20-Points avec score bar et modale de célébration.
- `/content-planner` — Planificateur de Reels & Carrousels réseaux sociaux.

### 👥 DOMAINE 3 : ÉQUIPE & ACADÉMIE
- `/team` — Répertoire de l'équipe in-house.
- `/team/[id]/performance` — Fiche 1-on-1, synchronisation Google Calendar, OKRs Q3 et Matrice de Compétences.
- `/academy` — Académie LMS & SOPs internes de référence.

---

## ⚡ Supabase Backend & Integration

- **Instance Supabase** : `https://eobatkwbwcdsdqbemrma.supabase.co`
- **Buckets Storage** : `client-assets`, `team-documents`, `academy-media`
- **Edge Functions** :
  1. `launch-check-validator` : Valide la conformité 20/20 avant publication.
  2. `google-calendar-sync` : Synchronise les créneaux 1-on-1 sur Google Calendar.
  3. `roi-aggregator` : Calcule et agrège les données de conversion et ROI client.

---

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
pnpm install

# Lancement du serveur de développement Next.js
pnpm dev

# Build de production
npx next build
```
