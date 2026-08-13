import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getSupabaseEnv } from '@/lib/supabase/env';

const ALLOWED_DOMAINS = ['minervaflow.com', 'minerva.com'];

// ── Rate-Limiting ──────────────────────────────────────────────────────────
// Edge-compatible in-memory store. Resets per-isolate, which is acceptable
// for a lightweight brute-force deterrent on auth routes.
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(
  ip: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const storeKey = `${ip}:${key}`;
  const now = Date.now();
  const entry = rateLimitStore.get(storeKey);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  return { limited: false, retryAfterSeconds: 0 };
}


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // ── Rate-limit: auth routes (5 req / 60 s per IP) ──────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    const rl = checkRateLimit(ip, 'auth', 5, 60_000);
    if (rl.limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSeconds),
          'Content-Type': 'text/plain',
        },
      });
    }
  }

  // ── Rate-limit: public API routes (20 req / 60 s per IP) ───────────────
  if (pathname.startsWith('/api/webhooks') || pathname.startsWith('/api/integrations')) {
    const rl = checkRateLimit(ip, 'api', 20, 60_000);
    if (rl.limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSeconds),
          'Content-Type': 'text/plain',
        },
      });
    }
  }

  // Bypass: public pages, static assets, auth callbacks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/icon-512.png') ||
    pathname.startsWith('/icon-192.png') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/opengraph-image') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/pending-approval' ||
    pathname.startsWith('/portal/join')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Not authenticated → redirect to /login. There is no dev/backdoor
  //    cookie fallback: Supabase's own session cookie is the only source
  //    of truth for authentication.
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Client-role accounts only ever see the portal — bounce any attempt
  //    at the internal dashboard straight there. Internal team can still
  //    reach /portal (useful for previewing what a client sees).
  const isPortalRoute = pathname.startsWith('/portal');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isClient = profile?.role === 'client';

  if (isClient && !isPortalRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/portal';
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated internal team user → allow access
  return response;
}

export const config = {
  matcher: [
    '/overview/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/team/:path*',
    '/academy/:path*',
    '/content-planner/:path*',
    '/leads/:path*',
    '/profil/:path*',
    '/settings/:path*',
    '/integrations/:path*',
    '/portal/:path*',
    '/api/media/:path*',
    '/api/integrations/:path*',
  ],
};
