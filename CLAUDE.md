@AGENTS.md

# Minerva Trequartista

Internal operations tool for the Minerva agency — clients, leads/CRM, projects, social content (reels), an internal academy/SOP library, and team management. Next.js 16 App Router, React 19, TypeScript, Tailwind, Supabase (Postgres + Auth + Storage + Realtime). Single French-language product (Quebec clients only) — no i18n, no USD/EUR, everything CAD.

## Brand name

"Minerva Trequartista" appears in exactly three places: the browser tab title (`app/layout.tsx` metadata), the login/signup screens, and the PDF client report (`components/reports/ClientExecutiveReport.tsx`). Nowhere else — not in the sidebar, not in toasts, not in section titles. (The sidebar header card shows the *signed-in user's own* name/email/avatar — see Sidebar below — that's a different thing from the brand string and doesn't violate this rule.) "Supabase" and "Centurions" (an old, abandoned name) must never appear in user-facing text; grep for both before shipping a page that touches either.

## No modals for content or forms

Every create/edit/detail view is a routed page (`/clients/new`, `/leads/new`, `/content-planner/[id]`, `/academy/[id]`, etc.), not a `fixed inset-0` overlay. This was a deliberate, explicit instruction — keep following it for new features. The exception is transient, non-navigable UI: confirmation dialogs (`ConfirmDialog`), success celebrations, and the ⌘K search palette (a portal-rendered full-viewport overlay, not app content).

## Sidebar

`components/app-sidebar.tsx` is a from-scratch rebuild (not shadcn's sidebar primitive). As of the v2 design pass (2026-08-15) it's structurally modeled on a curated Kanban/task-management reference (`inpsiration/v2/` — a task board UI with a profile card + "Main Menu"/"Records" grouping), superseding the earlier Minerva Reach-modeled structure. Key behaviors:
- Collapses to **zero width** (not an icon rail) — only the toggle button (`components/shell/AppShell.tsx`'s `SidebarTrigger`) stays visible.
- Header is a bordered **profile card** (`UserMenu` with `variant="card"`) showing the signed-in user's own avatar/name/email, opening the account dropdown on click — not the role-as-workspace-label pattern used before v2 (that seed-of-multi-workspace idea is shelved; re-introduce deliberately if the team chantier revives it, don't assume it's still current).
- Nav is two flat sections — "Menu principal" (Accueil, Tâches) and "Données" (Clients, Leads, Projets, Équipe, Réels, Académie, plus admin-only Charge de travail/Acquisition/Audits) — replacing the earlier pinned-items + collapsible-category model. "Aujourd'hui" (most recently created clients/projects, `hooks/use-recent-items.ts`, real data — no generic `/clients/[id]` or `/projects/[id]` page exists yet, so items link to the real sub-pages that do: `/clients/[id]/roi-tracker`, `/projects/[id]/roadmap`) sits below as its own section. Footer: a "Démarrage" progress card (real data via `hooks/use-onboarding-checklist.ts`, the same hook `components/dashboard/OnboardingChecklist.tsx` uses — hides itself once 100% done) above a "Paramètres" accordion (Profil/Membres/Notifications/Aide/Nouveautés/Facturation-admin).
- Auto-closes on mobile after a nav click (`useSidebarState().closeOnNavigate`).
- `NavItem.isNew` renders a small "Nouveau" pill — flip it on for a freshly-shipped section, off once it's not new anymore.
- `components/shell/WorkspaceSwitcher.tsx` is now orphaned (no longer imported) since the header switched to the profile-card pattern — left in place rather than deleted in case a real multi-workspace feature revives the concept; don't assume it's wired in without checking.

## Typography

As of the v3 design pass (2026-08-16), **Playfair Display** (serif) is back for headings/`.font-display`, paired with **Inter** for body/UI — loaded via `next/font/google` in `app/layout.tsx` alongside JetBrains Mono, exposed as `--font-playfair`/`--font-inter`/`--font-mono`. `tailwind.config.js`'s `fontFamily.mono` still points at `--font-inter` (not `--font-mono`) — a deliberate v2-era choice (numbers render in Inter, not JetBrains Mono) that was never reverted when v3 brought Playfair back; check `tailwind.config.js` directly if this matters for what you're building, don't assume. `.font-display` has no manual override in `globals.css` — the Tailwind utility generated from `theme.fontFamily.display` is the only source of truth; don't reintroduce one. (Pairing history: Fraunces → Times New Roman → Georgia/Helvetica Neue → Sora/Inter → Playfair Display/Plus Jakarta Sans → Inter-only (v2) → **Playfair Display + Inter (v3, current)**. Check `git log -- tailwind.config.js app/layout.tsx` before assuming any of these is still current.)

## Couleurs (v3 — crème chaud, multicolore réel)

The `--mv-*` tokens in `app/globals.css` moved again (2026-08-16, v3 design pass) — this time matched directly against the two real sibling products (Reach and Flow) rather than an internal-only direction. Warm cream page background is back (`--mv-cream: #F0EDE0`, `--mv-surface: #FAFAF5` for cards — distinct near-white tone), and the color system is genuinely multicolor: green/amber/purple/blue/red are five distinct hues (`--mv-amber` is **no longer** aliased to green), used for status badges (`Badge` component variants `green|lime|amber|red|blue|purple|neutral`). **Dark mode has been removed entirely** — no toggle, no `.dark` CSS block, `ThemeProvider`/`ThemeToggle` deleted. Don't reintroduce dark-mode overrides without deciding to rebuild the toggle first. `--mv-green: #059669` itself changed from the earlier `#1E4B33` Forêt & Crème green — if a hardcoded hex literal anywhere still reads `#1E4B33`/`#4a9e6e`, it's stale, not a chart-color exception. Chart/graph color literals (`components/charts/*`, `app/(dashboard)/overview/page.tsx`, `components/pdf/ProposalDocument.tsx`, `components/audit/ProcessFlowDiagram.tsx`) still hardcode hex rather than reference the CSS vars — grep for stray hex before adding new hardcoded chart colors.

A recurring **halftone/dot-matrix motif** (`components/ui/halftone-image.tsx` for a real photo rendered as dots, `components/ui/dot-pattern.tsx` for a photo-less decorative dot grid) is a deliberate v2 brand signature — inspired by `inpsiration/v2/` references (sign-in portrait, revenue chart). Use it for hero/empty-state moments and chart styling rather than inventing a different decorative treatment.

## Real data only

No hardcoded/fictional records — no fake employees, fake clients, fake feedback, fake metrics. Empty states should say so honestly ("Aucun X pour le moment") rather than showing placeholder content. When a widget can't be backed by real data yet, prefer an honest empty/disabled state over inventing numbers. `lib/services/supabase-data.ts` holds all the Supabase read/write functions — extend it rather than querying Supabase ad hoc from a page.

## Pending migrations

No CLI/MCP access to the live Supabase project from this environment (the connected accounts don't have it; confirmed 2026-08-16, `mcp__claude_ai_Supabase__list_projects` does not list this project) — a human always has to run `npm run deploy:supabase` for any new migration file. All migrations through `20260817000004_notification_preferences_extra_toggles.sql` are confirmed **deployed** as of 2026-08-17 (verified live end-to-end: `minerva_roadmap_items` populated, `notification_preferences.new_leads_enabled` write-then-read round-tripped correctly from the UI; `20260817000002`/`20260817000003` inferred deployed too since the CLI applies migrations in strict filename order and would have stopped before reaching `20260817000004` if either had failed). `20260817000005_documents_realtime.sql` (the `documents`/`yjs_documents` tables backing `/documents`) and `20260817000006_team_chat.sql` (`team_chat_messages` backing `/chat`) are **pending** — both pages degrade gracefully to an empty/honest-failure state until they land (verified live: sending a message logs a caught Supabase error and does not clear the draft or fake a success). Check `supabase/migrations/` for anything newer than what's been confirmed deployed before assuming a table/column exists live. Reads generally degrade gracefully (`SELECT *` still works pre-migration); writes to new columns will 400 until the migration lands — `addClient`/`updateClient` in `lib/services/supabase-data.ts` strip empty optional fields from the payload before writing specifically so this doesn't regress the base flow while a migration is still pending (only an actively-filled new field fails, not the whole save).

Supabase CLI (`supabase db push`, invoked by `deploy-supabase.ps1`) tracks applied migrations **by filename**, not content hash — editing a migration file after it's already been pushed will never re-run, silently. A fix discovered after deploying always needs a genuinely new, later-dated file, never an edit to an already-applied one.

## Team presence

`components/providers/PresenceProvider.tsx` tracks who's online via two separate Supabase Realtime Presence channels, not one — this split is deliberate and load-bearing, don't collapse it into a single channel. `minerva-team-presence` carries full detail including the exact page path each teammate is on, consumed by `useTeamPresence()` (the avatar stack + panel in `TopbarActions.tsx`, internal dashboard only). `minerva-team-presence-public` carries only name/avatar/online-status with no path, consumed by `usePublicTeamPresence()` (`TeamOnlineBadge` in the client portal header). A client-role user must never learn which internal page — or which OTHER client's record — a teammate is currently viewing; only admin/member roles `track()` presence, client-role users only subscribe to the public channel.

## Roadmap (chantiers)

Tracked as an informal sequence, not a hard spec — check recent `git log` and `CHANGELOG.md` for what's actually shipped:
All 8 chantiers below are shipped and deployed. Numbering matches the original roadmap this project was planned against — use these numbers, not any other ordering, when referring to a chantier.

1. ✅ Rebrand cleanup, sidebar/topbar rebuild
2. ✅ Overview dashboard on real data
3. ✅ Reels: dedicated page, real Storage upload, editorial calendar
4. ✅ Academy/Team/Profil: removed fictional data and dead features
5. ✅ Roles (admin/member/client — the only real values), team invite links (`/team/invite`, admin-only, revocable), task delegation (`/tasks`: subtasks, comments, lead links, overdue push reminders via Vercel Cron), admin-only Facturation as the first real per-role permission split, `/team/workload` admin view
6. ✅ Client portal (invite links, editorial calendar, Q&A messaging — cross-project Minerva Flow sync remains explicitly out of scope, no credentials for that project in this repo)
7. ✅ Push notifications (real VAPID Web Push), dark mode repaint, responsive audit, Stripe payment links (real Price + Payment Link generation, verified against a live test key, persisted history)
8. ✅ Deploy pipeline automation (GitHub Actions CI on push to main), in-app changelog with image support (`/changelog`, admin-only publishing)

Check `CHANGELOG.md` for the accurate dated sequence — chantiers were built in a different order than this numbering (6 and 7 shipped before 5 and 8, for instance) and revisited multiple times as gaps were found.

`CHANGELOG.md` at the repo root has the human-readable version of what's shipped so far.

## Acquisition & AI audit system (post-chantier-8, unnumbered)

A separate, newer initiative outside the original 8-chantier plan: top-of-funnel lead capture from the Framer marketing site, 5-minute SMS follow-up (Twilio + Upstash QStash), an AI audit engine that extracts bottlenecks/hidden costs/tool compatibility/initiatives from a diagnostic-call transcript (Claude, structured tool-use, Zod-validated), a PDF proposal generator (`@react-pdf/renderer`) emailed via Brevo with a Calendly booking link, an interactive token-gated client deliverable (`/audit/view`), and an admin telemetry dashboard (`/acquisition`). See `CHANGELOG.md`'s 2026-08-13 entries for what shipped and `.env.example` for the full list of integration env vars — none of the real API keys (Twilio/Anthropic/Brevo/Calendly/QStash/Composio) are wired in yet by design; every integration degrades to an honest "not configured" error instead of a fake success. Data model lives in `intake_leads` (distinct from the sales-pipeline `leads` table — see that table's own NOT NULL constraints for why) and `audits`/`audit_*`/`proposals`. New Storage bucket `proposals` needs manual creation in the Supabase dashboard, same as the three existing buckets.

## Notion import (2026-08-17) & Produits Minerva

A one-time content pull from the agency's real Notion workspace ("Espace de Minerva"), done via Composio MCP (not the app's own dormant Notion-integration UI code). Imported: 22 Academy SOPs (`academy_sops`, 6 new categories added to `AcademySOP.category` in `lib/types/index.ts` — `Onboarding`/`Rôles & Rémunération`/`Outils & Systèmes`/`Ventes & Prospection`/`Gestion de compte`/`Support & QA` — no DB migration needed, the column has no CHECK constraint), and 44 real CRM prospects into `leads` (all Montreal restaurants/cafés, `service_requested` inferred as `'Minerva Flow'` for all 44, `stage`/`status`/`probability_pct` mapped from Notion's Contacted/Meeting stages). Import scripts and source JSON live in job-scratch space, not the repo — they're one-time seed scripts, not something to re-run.

Broader exploration of the same workspace surfaced **Minerva's own product-strategy databases** (distinct from client/agency-ops content) — Reach, Flow, OS, and unlaunched Ascend/Forge/Atlas. Only the Roadmap database had real rows (10 items) at exploration time; Bugs/Feature Backlog/Développement d'applications were empty and were NOT built. This became `/produits` ("Produits Minerva", admin-only, `minerva_roadmap_items` table + `MinervaRoadmapItem` type + CRUD in `supabase-data.ts`) — see the pending-migrations note above for its deploy status and the ready-but-unrun import script.

## MCP server (2026-08-21)

`app/api/mcp/route.ts` is a real Model Context Protocol server (`mcp-handler` + `@modelcontextprotocol/server` v2 — **not** `@modelcontextprotocol/sdk` v1; the ecosystem split into a v1 combined SDK and a v2 server-only package mid-2026, both still published, don't assume the v1 import paths from older MCP guides/blog posts are current). It exposes 5 read-only tools backed by live Supabase queries — `minerva_get_leads`, `minerva_get_kpi`, `minerva_list_sops`, `minerva_get_clients`, `minerva_get_projects` — to any MCP client: Claude Desktop/Code/API, and an externally-hosted Hermes Agent instance (a separate project, not vendored into this repo).

- **Auth**: `withMcpAuth` + a hand-rolled `verifyToken` checking the bearer token against two independent env-var secrets (`MCP_SERVER_TOKEN` for Claude, `MCP_HERMES_TOKEN` for Hermes) with `timingSafeEqual`, same constant-time-compare pattern as `app/api/webhooks/roi-event/route.ts`. Fails closed — if a token env var isn't set, that caller can never authenticate, no fallback secret.
- **Caller identity**: `verifyToken` returns a distinct `clientId` per matched token; tool handlers read it back via `extra.http?.authInfo?.clientId` (the real accessor per the SDK's `RequestHandlerExtra` type — confirmed by reading the actual `.d.mts` files in `node_modules/@modelcontextprotocol/server`, not assumed from docs) and write one `audit_logs` row per tool call.
- **Rate limiting**: `lib/rate-limit.ts`'s existing per-IP in-memory limiter (60 req/min), applied as an outer wrapper before the auth handler even runs.
- **`minerva_get_kpi` deliberately omits ROAS/CPL** — the pasted third-party guide that prompted this feature invented mocked values for those; Minerva has no real ad-spend tracking table anywhere, so exposing them would violate the real-data-only convention. Only `mrr_total` (sum of `clients.mrr` where `status='Active'`), `pipeline_value_total` (sum of `leads.mrr_value` + `leads.one_time_value`), and `active_clients_count` are real and exposed.
- Hermes Agent itself is **not** part of this repo — it's a separate, independently-hosted project this MCP endpoint is designed to be reachable by, not a dependency added here.

## Documents & Wiki Collaboratif (/documents) (2026-08-21)

High-density Notion/Linear-style collaborative documentation engine (`app/(dashboard)/documents/page.tsx` & `app/(dashboard)/documents/[id]/page.tsx`):
- **Block Editor (`components/documents/BlockEditor.tsx`)**: Editable block hierarchy (H1/H2/H3, paragraphs, todo checklists with instant toggle, bullet/numbered lists, color-coded callouts, quotes, syntax-highlighted code with 1-click copy, tables, dividers) triggered via slash commands (`/`) and natural Markdown shortcuts.
- **Persistence & Search**: Structured `content_json JSONB` alongside extracted `content_text TEXT` for full-text search indexing on `public.documents`, backed by migration `20260821000013_documents_wiki_rich_editor.sql`.
- **Version History (`components/documents/DocumentVersionHistory.tsx`)**: Automatic and manual snapshot table `public.document_versions` with author attribution, diff previews, and 1-click restore.
- **Agency Blueprints (`components/documents/templates.ts`)**: 5 ready-to-run agency templates (*Dossier Produit*, *Compte-Rendu de Réunion*, *Cahier des Charges*, *SOP Interne*, *Proposition Commerciale*).
- **Export & Portability**: 1-click Markdown (`.md`) download, clean print/PDF layout, and batch ZIP archive generation.

