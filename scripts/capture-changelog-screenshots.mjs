// Captures screenshots for the changelog (both the STATIC_ENTRIES fallback
// array in app/(dashboard)/changelog/page.tsx and, going forward, real
// changelog_entries.image_url rows). Manual/on-demand only -- there is
// deliberately no automatic in-app trigger at publish time (running
// headless Chromium inside a serverless publish request is fragile; see
// the note in the changelog phase of the project plan).
//
// Usage:
//   PLAYWRIGHT_TEST_EMAIL=admin@example.com \
//   PLAYWRIGHT_TEST_PASSWORD=•••••• \
//   BASE_URL=https://minerva-trequista.vercel.app \
//   pnpm changelog:screenshots
//
// - PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD: required. Every
//   captured page lives under an authenticated route (app/(dashboard)/*,
//   app/(portal)/*) -- without a real login the script would just
//   screenshot the /login page. Use an existing admin account; nothing
//   here creates one.
// - BASE_URL: defaults to the production deployment. Point it at
//   http://localhost:3000 (with `pnpm dev` running separately) to capture
//   against local changes before they're deployed.
//
// Output goes to public/changelog/*.png, matching how STATIC_ENTRIES
// already references them (e.g. image_url: '/changelog/academy-v2-4-3.png')
// -- these are static assets shipped with the app, not Supabase Storage.
// After running, `git add public/changelog` and commit/push so the images
// actually ship on the next deploy; for a live changelog_entries row (not
// a STATIC_ENTRIES one), also update that row's image_url to match.

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const TARGETS = [
  { path: '/overview', file: 'overview-v2-4-0.png', label: 'Overview' },
  { path: '/projects', file: 'roadmap-v2-4-0.png', label: 'Roadmap' },
  { path: '/academy', file: 'academy-v2-4-3.png', label: 'Academy Cockpit', alsoWrite: 'academy-v2-4-0.png' },
  { path: '/academy/sop-anti-friction-master', file: 'sop-anti-friction-v2-4-3.png', label: 'SOP Master Anti-Friction' },
  { path: '/minerva-flow', file: 'minerva-flow-v2-4-2.png', label: 'Minerva-Flow', waitUntil: 'domcontentloaded' },
  { path: '/portal/tasks', file: 'portal-tasks-v2-4-0.png', label: 'Client Portal Tasks' },
  { path: '/changelog', file: 'changelog-v2-4-3.png', label: 'In-App Changelog' },
  { path: '/voice-agent', file: 'voice-agent-v2-5-0.png', label: 'Agent Vocal IA (v2.5.0)' },
];

async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 });
}

async function main() {
  const outputDir = path.resolve('public/changelog');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const BASE_URL = process.env.BASE_URL || 'https://minerva-trequista.vercel.app';
  const EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL;
  const PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!EMAIL || !PASSWORD) {
    console.error('PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD are required -- every target page is behind auth.');
    process.exit(1);
  }

  console.log(`Launching browser to capture changelog screenshots from ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-DPI crisp capture
  });
  const page = await context.newPage();

  console.log('Logging in...');
  try {
    await login(page, BASE_URL, EMAIL, PASSWORD);
    console.log('✓ Logged in');
  } catch (err) {
    console.error('Login failed -- aborting before capturing any protected pages:', err);
    await browser.close();
    process.exit(1);
  }

  for (const target of TARGETS) {
    console.log(`Capturing ${target.label} (${target.path})...`);
    try {
      await page.goto(`${BASE_URL}${target.path}`, { waitUntil: target.waitUntil || 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);
      const outPath = path.join(outputDir, target.file);
      await page.screenshot({ path: outPath, fullPage: false });
      if (target.alsoWrite) {
        fs.copyFileSync(outPath, path.join(outputDir, target.alsoWrite));
      }
      console.log(`✓ ${target.label} captured: public/changelog/${target.file}`);
    } catch (err) {
      console.error(`Error capturing ${target.label}:`, err);
    }
  }

  await browser.close();
  console.log('Done. Review public/changelog/, then commit + push the new/updated PNGs.');
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
