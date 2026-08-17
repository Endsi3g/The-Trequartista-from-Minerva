import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Sends real Web Push notifications to every subscribed device (or a
// specific subset via userIds). Only signed-in team members can trigger
// this -- it's called from app code right after a real event (new lead,
// overdue project, etc.), never exposed as a public endpoint.
export async function POST(req: Request) {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json(
      { error: 'VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY ne sont pas configurées sur cet environnement.' },
      { status: 501 }
    );
  }

  webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);

  let body: { title?: string; body?: string; url?: string; userIds?: string[]; preferenceKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: 'title requis' }, { status: 400 });
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);

  // preferenceKey opts a broadcast into notification_preferences: any user
  // with that column explicitly set to false is excluded. A user with no
  // preferences row keeps the column's DB default (opt-out lists stay
  // short, matching how the settings page seeds new rows on first toggle).
  let excludedUserIds: string[] = [];
  if (body.preferenceKey) {
    const { data: optedOut } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq(body.preferenceKey, false);
    excludedUserIds = (optedOut || []).map((r) => r.user_id);
  }

  let query = supabase.from('push_subscriptions').select('id, user_id, endpoint, p256dh, auth_key');
  if (body.userIds?.length) {
    query = query.in('user_id', body.userIds);
  }
  if (excludedUserIds.length) {
    query = query.not('user_id', 'in', `(${excludedUserIds.join(',')})`);
  }
  const { data: subs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = JSON.stringify({ title: body.title, body: body.body || '', url: body.url || '/overview' });
  let sent = 0;
  const staleIds: string[] = [];

  await Promise.all(
    (subs || []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  return NextResponse.json({ sent, total: subs?.length || 0, staleRemoved: staleIds.length });
}
