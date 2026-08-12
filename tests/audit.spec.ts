import { test, expect } from '@playwright/test';

// Protected dashboard routes (behind proxy.ts). Without a seeded Supabase
// test account + auth fixture, these can't be exercised while logged in
// from this suite — but the previous version of this file asserted only
// `status < 400` and `body visible`, which passed just as happily whether
// the real page rendered or the visitor got redirected to /login. That
// masked the fact these assertions were meaningless. This suite instead
// asserts the behavior we can actually verify without a session: every
// protected route must redirect an unauthenticated visitor to /login. If
// this test starts failing, it means the access-control regression from
// the security audit (login/signup accepting any password, the
// centurions_session cookie backdoor, proxy.ts failing open) has come
// back in some form.
test.describe('Minerva Centurions — Access Control', () => {
  const protectedRoutes = [
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
  ];

  for (const route of protectedRoutes) {
    test(`Unauthenticated visitor to ${route} is redirected to /login`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
      await expect(page).toHaveURL(/\/login(\?.*)?$/);
      // Confirms we actually landed on the login form, not just some 200
      // page — the shallow version of this test could not tell the
      // difference.
      await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    });
  }

  test('Root / redirects through to /login when signed out', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test('/pending-approval is reachable without a session (middleware bypass list)', async ({ page }) => {
    const response = await page.goto('/pending-approval', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /compte en attente/i })).toBeVisible();
  });
});

test.describe('Minerva Centurions — Public Pages', () => {
  test('/login renders the email/password form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/courriel/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('/signup renders the account creation form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByLabel(/courriel/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /créer un compte/i })).toBeVisible();
  });

  test('/login rejects a domain outside the allowlist client-side', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/courriel/i).fill('someone@not-allowed-domain.com');
    await page.getByLabel(/mot de passe/i).fill('whatever-password-123');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/accès restreint/i)).toBeVisible();
    // Must still be on /login — this used to be bypassable: a disallowed
    // domain that also failed Supabase auth would previously still get a
    // centurions_session cookie and redirect through. There is no client
    // path to a dashboard route from here anymore.
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── RLS Integration Tests ───────────────────────────────────────────────────
// These tests hit the Supabase REST API directly with the anon key to verify
// that Row Level Security blocks unauthenticated reads on protected tables.
// They run against the dev/prod instance (NEXT_PUBLIC_SUPABASE_URL must be set).
test.describe('Minerva — RLS Policies (anon key must be blocked)', () => {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const protectedTables = [
    'clients',
    'projects',
    'leads',
    'audit_logs',
    'content_posts',
    'team_performance_reviews',
    'academy_sops',
  ];

  for (const table of protectedTables) {
    test(`anon key cannot SELECT from public.${table}`, async ({ request }) => {
      if (!SUPABASE_URL || !ANON_KEY) {
        test.skip(true, 'NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set — skipping RLS test');
      }
      const response = await request.get(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          Accept: 'application/json',
        },
      });
      // RLS should reject unauthenticated reads with 401 or return empty array via 200
      // but NEVER return actual rows to an unauthenticated session.
      if (response.status() === 200) {
        const body = await response.json();
        expect(Array.isArray(body) && body.length).toBe(0);
      } else {
        expect(response.status()).toBe(401);
      }
    });
  }

  test('anon key cannot SELECT own notion_config (per-owner table)', async ({ request }) => {
    if (!SUPABASE_URL || !ANON_KEY) {
      test.skip(true, 'NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set — skipping RLS test');
    }
    const response = await request.get(`${SUPABASE_URL}/rest/v1/notion_config?limit=1`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        Accept: 'application/json',
      },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(Array.isArray(body) && body.length).toBe(0);
    } else {
      expect(response.status()).toBe(401);
    }
  });
});

// ── Rate-Limit Tests ────────────────────────────────────────────────────────
test.describe('Minerva — Rate Limiting', () => {
  test('/login returns 429 after 5 rapid requests from same IP', async ({ request }) => {
    const attempts = Array.from({ length: 6 }, (_, i) =>
      request.get('http://localhost:3000/login')
    );
    const responses = await Promise.all(attempts);
    const statuses = responses.map((r) => r.status());
    // At least one of the responses after the 5th should be 429
    const has429 = statuses.some((s) => s === 429);
    expect(has429).toBe(true);
  });
});

// ── Accessibility Tests ─────────────────────────────────────────────────────
test.describe('Minerva — ARIA Accessibility', () => {
  test('/login page has a main heading and labelled form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/courriel/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test('/signup page has a main heading and labelled form fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible();
    await expect(page.getByLabel(/courriel/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });
});
