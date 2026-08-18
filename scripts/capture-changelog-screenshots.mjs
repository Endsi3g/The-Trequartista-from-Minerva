import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function main() {
  const outputDir = path.resolve('public/changelog');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const BASE_URL = process.env.BASE_URL || 'https://minerva-trequista.vercel.app';
  console.log(`Launching browser to capture changelog screenshots from ${BASE_URL}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-DPI crisp capture
  });

  const page = await context.newPage();

  // 1. Overview Page
  console.log('Capturing Overview (/overview)...');
  try {
    await page.goto(`${BASE_URL}/overview`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'overview-v2-4-0.png'), fullPage: false });
    console.log('✓ Overview captured: public/changelog/overview-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Overview:', err);
  }

  // 2. Roadmap Page
  console.log('Capturing Roadmap (/projects)...');
  try {
    await page.goto(`${BASE_URL}/projects`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'roadmap-v2-4-0.png'), fullPage: false });
    console.log('✓ Roadmap captured: public/changelog/roadmap-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Roadmap:', err);
  }

  // 3. Academy Cockpit (v2.4.3)
  console.log('Capturing Academy Cockpit (/academy)...');
  try {
    await page.goto(`${BASE_URL}/academy`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outputDir, 'academy-v2-4-3.png'), fullPage: false });
    await page.screenshot({ path: path.join(outputDir, 'academy-v2-4-0.png'), fullPage: false });
    console.log('✓ Academy Cockpit captured: public/changelog/academy-v2-4-3.png');
  } catch (err) {
    console.error('Error capturing Academy:', err);
  }

  // 4. SOP Master Anti-Friction Detail (v2.4.3)
  console.log('Capturing SOP Master Anti-Friction (/academy/sop-anti-friction-master)...');
  try {
    await page.goto(`${BASE_URL}/academy/sop-anti-friction-master`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outputDir, 'sop-anti-friction-v2-4-3.png'), fullPage: false });
    console.log('✓ SOP Master Anti-Friction captured: public/changelog/sop-anti-friction-v2-4-3.png');
  } catch (err) {
    console.error('Error capturing SOP Anti-Friction:', err);
  }

  // 5. Minerva-Flow Restaurant Direct Ordering Demo
  console.log('Capturing Minerva-Flow (/minerva-flow)...');
  try {
    await page.goto(`${BASE_URL}/minerva-flow`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outputDir, 'minerva-flow-v2-4-2.png'), fullPage: false });
    console.log('✓ Minerva-Flow captured: public/changelog/minerva-flow-v2-4-2.png');
  } catch (err) {
    console.error('Error capturing Minerva-Flow:', err);
  }

  // 6. Client Portal Tasks & Deliverables
  console.log('Capturing Client Portal Tasks (/portal/tasks)...');
  try {
    await page.goto(`${BASE_URL}/portal/tasks`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'portal-tasks-v2-4-0.png'), fullPage: false });
    console.log('✓ Portal Tasks captured: public/changelog/portal-tasks-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Portal Tasks:', err);
  }

  // 7. In-App Changelog Page
  console.log('Capturing In-App Changelog (/changelog)...');
  try {
    await page.goto(`${BASE_URL}/changelog`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'changelog-v2-4-3.png'), fullPage: false });
    console.log('✓ In-App Changelog captured: public/changelog/changelog-v2-4-3.png');
  } catch (err) {
    console.error('Error capturing Changelog:', err);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
