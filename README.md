<div align="center">

  <img src="public/icon.svg" width="96" height="96" alt="Minerva Centurions Logo" />

  # Minerva Centurions

  **The Master Operations & Client ROI Command Center for High-Growth Agencies**

  <p>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js 15" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase_Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright_E2E-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" /></a>
    <a href="https://vercel.com"><img src="https://img.shields.io/badge/Vercel_PWA-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

  <p>
    <strong>Client CRM</strong> &nbsp;•&nbsp;
    <strong>ROAS Tracker</strong> &nbsp;•&nbsp;
    <strong>Reels Studio (yt-dlp)</strong> &nbsp;•&nbsp;
    <strong>Notion MCP Sync</strong> &nbsp;•&nbsp;
    <strong>Checklist 20/20</strong> &nbsp;•&nbsp;
    <strong>PWA Enabled</strong>
  </p>

  ---

</div>

## 🛡️ Executive Summary

**Minerva Centurions** is a unified, enterprise-grade B2B SaaS operations engine designed for agency delivery management, revenue attribution, lead management, and automated quality assurance.

```
                  ┌─────────────────────────────────────────┐
                  │    MINERVA CENTURIONS COMMAND CENTER    │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Clients CRM   │           │ Social Reels    │           │ Notion MCP Sync │
│ & ROI Analytics │           │ Studio (yt-dlp) │           │ & SOP Academy   │
└─────────────────┘           └─────────────────┘           └─────────────────┘
```

---

## ⚡ Core Capabilities

- 📈 **Realtime Client ROI & ROAS Tracker**: Live financial performance dashboards with automated edge aggregations (`client_roi_metrics`).
- 🎬 **Social Reels Studio & Universal Video Player**: 9:16 smartphone inspector, 1-click `.mp4` video downloads powered by `yt-dlp` media downloader service.
- 🔗 **Notion MCP Server Integration**: Native 2-way database synchronization connecting Notion workspaces (`https://mcp.notion.com/mcp`).
- 🎯 **Leads Pipeline CRM**: Kanban & Table views with lead quality scoring (A/B/C/D), fast actions, and CSV export.
- 📋 **Checklist 20-Points Quality Assurance**: Real-time project launch checklist with Edge Function validation.
- 💬 **Global User Toast & In-App Feedback**: Toast alerts (`ToastProvider.tsx`), in-app feedback modal (`UserFeedbackModal.tsx`), and confirmation dialogs (`ConfirmDialog.tsx`).
- 📱 **Progressive Web App (PWA)**: Standalone mobile installation, offline Service Worker (`/sw.js`), and manifest support.
- 🧪 **Playwright E2E Test Audit**: 100% automated test suite validating all 23 static and dynamic routes.

---

## 🛠️ Tech Stack

<div align="center">

| Core | Database & Storage | Testing & Deployment |
| :--- | :--- | :--- |
| **Next.js 15 App Router** | **Supabase Postgres** | **Playwright E2E (`@playwright/test`)** |
| **TypeScript 5.7** | **Supabase Realtime WebSockets** | **Vercel Platform Deployment** |
| **Tailwind CSS (Vanilla HSL)** | **Supabase Storage Buckets** | **PWA Web App Manifest & SW** |

</div>

---

## 🚀 Quick Start

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eobatkwbwcdsdqbemrma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the cockpit.

---

## 🧪 Verification Commands

```bash
# TypeScript Typecheck (0 errors)
npx tsc --noEmit

# Production Build Test
pnpm build

# Playwright E2E Audit Suite
npx playwright test
```

---

<div align="center">

  <sub>Built with precision by **Minerva Flow Inc.** &nbsp;•&nbsp; All Rights Reserved</sub>

</div>
