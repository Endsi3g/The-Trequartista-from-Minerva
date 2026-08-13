@AGENTS.md

# Minerva Trequartista

Internal operations tool for the Minerva agency — clients, leads/CRM, projects, social content (reels), an internal academy/SOP library, and team management. Next.js 16 App Router, React 19, TypeScript, Tailwind, Supabase (Postgres + Auth + Storage + Realtime). Single French-language product (Quebec clients only) — no i18n, no USD/EUR, everything CAD.

## Brand name

"Minerva Trequartista" appears in exactly three places: the browser tab title (`app/layout.tsx` metadata), the login/signup screens, and the PDF client report (`components/reports/ClientExecutiveReport.tsx`). Nowhere else — not in the sidebar (icon only, plus the current user's **role** as the workspace label — see below), not in toasts, not in section titles. "Supabase" and "Centurions" (an old, abandoned name) must never appear in user-facing text; grep for both before shipping a page that touches either.

## No modals for content or forms

Every create/edit/detail view is a routed page (`/clients/new`, `/leads/new`, `/content-planner/[id]`, `/academy/[id]`, etc.), not a `fixed inset-0` overlay. This was a deliberate, explicit instruction — keep following it for new features. The exception is transient, non-navigable UI: confirmation dialogs (`ConfirmDialog`), success celebrations, and the ⌘K search palette (a portal-rendered full-viewport overlay, not app content).

## Sidebar

`components/app-sidebar.tsx` is a from-scratch rebuild (not shadcn's sidebar primitive) modeled on Minerva Flow's sidebar (`github.com/Endsi3g/Minerva-Flow`, `components/shell/AppSidebar.tsx` — fetch it again if you need the reference). Key behaviors:
- Collapses to **zero width** (not an icon rail) — only the toggle button (`components/shell/AppShell.tsx`'s `SidebarTrigger`) stays visible.
- Header shows the logo mark plus the current user's **role** as the workspace name (`components/shell/WorkspaceSwitcher.tsx`, sourced from `useCurrentUser().role`) — this is intentionally the seed of a real multi-workspace/per-role system planned for the team chantier, not a static label. Don't hardcode a workspace name here.
- Sidebar header height (`h-16`) must match the topbar header height (`h-16` in `AppShell.tsx`) so their bottom borders line up — if you resize one, resize the other.
- Auto-closes on mobile after a nav click (`useSidebarState().closeOnNavigate`).
- `NavItem.isNew` renders a small "Nouveau" pill — flip it on for a freshly-shipped section, off once it's not new anymore.

## Typography

Display face is **Sora**, body is **Inter** — both loaded via `next/font/google` in `app/layout.tsx` (alongside JetBrains Mono) and exposed as CSS variables (`--font-sora`, `--font-inter`) consumed by `tailwind.config.js`'s `theme.fontFamily.display`/`.sans`. `.font-display` used to be silently overridden by a hardcoded system-serif rule left in `globals.css`; that's been removed, so the Tailwind utility is now the only source of truth for it. Don't reintroduce a manual `.font-display` (or similar) override in `globals.css`. (This pairing has changed several times before this session: Fraunces → Times New Roman → Georgia/Helvetica Neue → Sora/Inter. If display typography comes up again, check `git log -- tailwind.config.js app/layout.tsx` for the current state rather than assuming any of these.)

## Real data only

No hardcoded/fictional records — no fake employees, fake clients, fake feedback, fake metrics. Empty states should say so honestly ("Aucun X pour le moment") rather than showing placeholder content. When a widget can't be backed by real data yet, prefer an honest empty/disabled state over inventing numbers. `lib/services/supabase-data.ts` holds all the Supabase read/write functions — extend it rather than querying Supabase ad hoc from a page.

## Pending migrations

Several migrations are written but **not yet applied** to the live Supabase project (no CLI/MCP access to that project from this environment — the connected accounts don't have it). Check `supabase/migrations/` for anything newer than what's been confirmed deployed, and remind the human to run `npm run deploy:supabase`. Reads generally degrade gracefully (`SELECT *` still works pre-migration); writes to new columns will 400 until the migration lands.

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
