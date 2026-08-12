import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Completes the OAuth PKCE flow started by signInWithOAuth() in
// login-form.tsx / signup-form.tsx. Without this route the Google SSO
// button redirected to a 404 and the code exchange never happened.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/overview';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
