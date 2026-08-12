import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ONE-TIME admin route — adds kbelceus776@gmail.com to allowed_emails
// and auto-approves their profile if it exists.
// DELETE this file after use.
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const email = 'kbelceus776@gmail.com';

  // 1. Add to allowed_emails
  const { error: allowedError } = await supabase
    .from('allowed_emails')
    .upsert({ email, note: 'Accès manuel — compte fondateur' }, { onConflict: 'email' });

  if (allowedError) {
    return NextResponse.json({ step: 'allowed_emails', error: allowedError.message }, { status: 500 });
  }

  // 2. Find the user in auth.users
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    return NextResponse.json({ step: 'list_users', error: userError.message }, { status: 500 });
  }

  const authUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!authUser) {
    return NextResponse.json({
      ok: true,
      allowed_emails: 'inserted',
      profile: 'user not signed up yet — ask them to sign up at /signup first',
    });
  }

  // 3. Approve the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ approved: true })
    .eq('id', authUser.id);

  if (profileError) {
    return NextResponse.json({ step: 'approve_profile', error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    allowed_emails: 'inserted',
    profile: `approved for user ${authUser.id}`,
  });
}
