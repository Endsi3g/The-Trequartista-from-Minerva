<div align="center">

  <img src="public/icon.svg" width="80" height="80" alt="Minerva Centurions Logo" />

  # Minerva Centurions

  **The Operating System for Client Delivery, ROI Tracking, and Agency Excellence**

  <p>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
    <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://vercel.com"><img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" /></a>
  </p>

  <p>
    <strong>Revenue Attribution</strong> &nbsp;&bull;&nbsp;
    <strong>Client CRM</strong> &nbsp;&bull;&nbsp;
    <strong>Quality Assurance</strong> &nbsp;&bull;&nbsp;
    <strong>Content Studio</strong> &nbsp;&bull;&nbsp;
    <strong>Notion Workspace Sync</strong> &nbsp;&bull;&nbsp;
    <strong>PWA Enabled</strong>
  </p>

  ---

</div>

## Platform Overview

Minerva Centurions is the master client delivery and operations cockpit built for Minerva agency teams. Designed to eliminate fragmented spreadsheets and disconnected tools, Centurions unifies client financial reporting, lead attribution, campaign quality control, media asset planning, and internal SOP knowledge management into a cohesive web application.

The platform grants agency executives, account directors, media buyers, and developers continuous, real-time visibility into client performance, campaign progress, and operational health.

---

## Detailed Platform Capabilities

### 1. Command Center & Audit Intelligence
The central dashboard provides an aggregate view of total agency Monthly Recurring Revenue (MRR), active client health statuses, team capacity, and recent system actions. Integrated real-time audit logging records every major database change, quality checklist update, and campaign event to maintain accountability across team members.

### 2. Revenue & Client ROI Tracking Engine
A specialized financial dashboard for tracking client campaign profitability. Monitors key acquisition metrics including total ad investment, generated pipeline value, Cost Per Lead (CPL), Return on Ad Spend (ROAS), Google Business Profile interactions, and organic SEO keyword positioning. Includes an executive report generator formatted for PDF printing.

### 3. Lead CRM & Acquisition Pipeline
A comprehensive lead management engine offering both Kanban board and tabular views. Organizes incoming client leads by quality grade (A, B, C, D), status stage (New, Contacted, Qualified, Closed), and attribution channel. Enables team members to record notes, initiate quick contact triggers, and export lead data to CSV format.

### 4. Quality Assurance & 20-Point Launch Validation
Enforces strict quality benchmarks before client websites, Framer builds, or advertising campaigns go live. Features a 20-point launch checklist covering performance optimization, OpenGraph metadata, forms validation, responsive layout checks, and Quebec data privacy compliance (Loi 25). Supabase Edge Functions validate readiness scores and trigger alerts when items require attention.

### 5. Social Reels Studio & Media Asset Downloader
A dedicated video production workspace tailored for short-form video content. Allows media teams to draft script notes, assign target platforms (Instagram Reels, TikTok, YouTube Shorts, LinkedIn Video), and preview creatives in vertical 9:16 smartphone containers or widescreen 16:9 formats. Includes an integrated media downloader service (yt-dlp) for importing public video URLs directly into Supabase Storage with 1-click MP4 downloading.

### 6. Knowledge Academy & SOP Library
A central knowledge repository for standardizing agency workflows. Houses interactive Standard Operating Procedures (SOPs), design guidelines, Framer templates, and video walkthrough tutorials to accelerate onboarding and maintain execution consistency across team members.

### 7. Notion Workspace Sync & Integrations Ecosystem
Connects directly to Notion workspaces via the Model Context Protocol (MCP) server at `https://mcp.notion.com/mcp`. Enables 2-way synchronization between Notion pages and Minerva SOPs or content plans. The integrations hub also provides testing tools for custom incoming lead webhooks and edge function dispatchers.

### 8. User Feedback System, Global Toasts & PWA Support
Includes an in-app feedback modal for submitting bug reports and feature ideas directly to Supabase, a global animated toast notification engine for real-time action feedback, and reusable confirmation dialogs. Complete Progressive Web App (PWA) support enables offline caching via Service Worker and standalone installation on mobile devices.

---

## Technical Architecture & Security Model

- **Frontend Application**: Next.js 15 App Router with server-rendered routes, client components, and custom CSS design system tailored to Minerva brand tokens.
- **Database & Storage Layer**: Supabase Postgres featuring Row Level Security (RLS) policies, database triggers for change logging, and Storage buckets (`client-assets`, `team-documents`, `academy-media`).
- **Realtime Communications**: WebSocket subscription layer via Supabase Realtime for instant synchronization across connected client sessions.
- **API Key Management**: Custom API key generation (`user_api_keys`) for authenticating external webhooks and third-party integrations.

---

## Quality & Test Verification

The platform is continuously audited using an automated Playwright end-to-end test suite covering all 23 static and dynamic routes across desktop and mobile viewports. TypeScript strict type-checking ensures 0 type errors across the codebase.

---

<div align="center">

  <sub>Minerva Flow Inc. &bull; All Rights Reserved</sub>

</div>
