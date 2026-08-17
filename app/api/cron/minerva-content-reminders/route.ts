import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Runs daily via Vercel Cron (see vercel.json). Unlike task-reminders
// (per-assignee), this broadcasts to the WHOLE team -- the "Contenu
// Minerva" calendar is explicitly shared/collective, not owned by one
// assignee, so everyone should see a scheduled post is due today.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ sent: 0, reason: 'VAPID non configurée' }, { status: 200 });
  }
  webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);

  const today = new Date().toISOString().slice(0, 10);
  const { data: dueItems, error } = await supabase
    .from('minerva_content_items')
    .select('id, title')
    .eq('kind', 'own_video')
    .eq('posted', false)
    .lte('scheduled_date', today);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!dueItems || dueItems.length === 0) {
    return NextResponse.json({ sent: 0, due: 0 });
  }

  const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth_key');
  if (!subs?.length) {
    return NextResponse.json({ sent: 0, due: dueItems.length, reason: 'Aucun abonnement push' });
  }

  const body =
    dueItems.length === 1
      ? `« ${dueItems[0].title} » doit être publié aujourd'hui.`
      : `${dueItems.length} vidéos Minerva doivent être publiées aujourd'hui.`;
  const payload = JSON.stringify({ title: 'Contenu Minerva à poster', body, url: '/content-planner' });

  let sent = 0;
  const staleIds: string[] = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
    }
  }
  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  return NextResponse.json({ sent, due: dueItems.length, subscribers: subs.length });
}
