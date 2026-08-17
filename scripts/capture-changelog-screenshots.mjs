import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function main() {
  const outputDir = path.resolve('public/changelog');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser to capture changelog screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // High-DPI crisp capture
  });

  const page = await context.newPage();

  // 1. Overview Page
  console.log('Capturing Overview (/overview)...');
  try {
    await page.goto('http://localhost:3000/overview', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'overview-v2-2-0.png'), fullPage: false });
    console.log('✓ Overview captured: public/changelog/overview-v2-2-0.png');
  } catch (err) {
    console.error('Error capturing Overview:', err);
  }

  // 2. Team Chat Page
  console.log('Capturing Team Chat (/chat)...');
  try {
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'chat-v2-2-0.png'), fullPage: false });
    console.log('✓ Team Chat captured: public/changelog/chat-v2-2-0.png');
  } catch (err) {
    console.error('Error capturing Chat:', err);
  }

  // 3. Social Reels Studio & Contenu Minerva (/content-planner)
  console.log('Capturing Content Planner (/content-planner)...');
  try {
    await page.goto('http://localhost:3000/content-planner', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'content-v2-2-0.png'), fullPage: false });
    console.log('✓ Content Planner captured: public/changelog/content-v2-2-0.png');
  } catch (err) {
    console.error('Error capturing Content Planner:', err);
  }

  // 4. ROI Tracker
  console.log('Capturing ROI Tracker (/clients/1/roi-tracker)...');
  try {
    await page.goto('http://localhost:3000/clients/client-toitures-beauchemin/roi-tracker', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outputDir, 'roi-v2-2-0.png'), fullPage: false });
    console.log('✓ ROI Tracker captured: public/changelog/roi-v2-2-0.png');
  } catch (err) {
    console.error('Error capturing ROI Tracker:', err);
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
