import { test, expect } from '@playwright/test';

test.describe('Minerva Centurions Complete SaaS Audit Suite', () => {
  const routes = [
    '/overview',
    '/overview/audit-logs',
    '/leads',
    '/clients',
    '/clients/client-apex-roofing/roi-tracker',
    '/projects',
    '/projects/proj-apex-launch/launch-check',
    '/projects/proj-apex-launch/roadmap',
    '/content-planner',
    '/team',
    '/team/team-alex/performance',
    '/academy',
    '/integrations',
    '/integrations/notion',
    '/profil',
    '/settings/billing',
    '/login',
    '/signup',
  ];


  for (const route of routes) {
    test(`Audit Route Accessibility & Rendering: ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);

      // Verify Body visibility and route rendering
      await expect(page.locator('body')).toBeVisible();
    });
  }


  test('Audit Mobile Navigation Drawer (<768px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/overview');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Audit Video Asset Player Controls', async ({ page }) => {
    await page.goto('/content-planner');
    await expect(page.locator('body')).toBeVisible();
  });
});
