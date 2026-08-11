import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    pathname === '/pending-approval'
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const devSessionCookie = request.cookies.get('centurions_session');

  // 1. Not authenticated → redirect to /login
  if (!user && !devSessionCookie) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Authenticated → check approval status from profiles table
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('approved, role')
      .eq('id', user.id)
      .single();

    // Profile exists and not approved → redirect to pending-approval
    if (profile && !profile.approved) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/pending-approval';
      return NextResponse.redirect(redirectUrl);
    }

    // No profile yet (first login before trigger fires) → allow through with devSession fallback
  }

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
  ],
};
