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

  // 3. Academy Page
  console.log('Capturing Academy (/academy)...');
  try {
    await page.goto(`${BASE_URL}/academy`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'academy-v2-4-0.png'), fullPage: false });
    console.log('✓ Academy captured: public/changelog/academy-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Academy:', err);
  }

  // 4. Documents Page
  console.log('Capturing Documents (/documents)...');
  try {
    await page.goto(`${BASE_URL}/documents`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'documents-v2-4-0.png'), fullPage: false });
    console.log('✓ Documents captured: public/changelog/documents-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Documents:', err);
  }

  // 5. Minerva Content Studio
  console.log('Capturing Content Studio (/content-planner)...');
  try {
    await page.goto(`${BASE_URL}/content-planner`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'content-v2-4-0.png'), fullPage: false });
    console.log('✓ Content Studio captured: public/changelog/content-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Content Studio:', err);
  }

  // 6. Client Portal
  console.log('Capturing Client Portal (/portal)...');
  try {
    await page.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'portal-v2-4-0.png'), fullPage: false });
    console.log('✓ Portal captured: public/changelog/portal-v2-4-0.png');
  } catch (err) {
    console.error('Error capturing Portal:', err);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
