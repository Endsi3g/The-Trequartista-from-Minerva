import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// #annonces -- same fixed-slug topic-channel pattern as #général (see
// app/(dashboard)/chat/page.tsx's TOPIC_CHANNELS).
const ANNOUNCEMENTS_CHANNEL_ID = '00000000-0000-0000-0000-000000000002';

// Runs on the 1st of the month via Vercel Cron. The "reset" itself is
// implicit -- a new period_month naturally starts empty on the next daily
// recompute, nothing is deleted, so past months stay browsable in
// /classement. This just closes out and celebrates last month's podium in
// #annonces before the new month's scores start accumulating.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);

  const now = new Date();
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthStr = lastMonth.toISOString().slice(0, 10);

  const { data: podium } = await supabase
    .from('productivity_scores')
    .select('user_id, total_points')
    .eq('period_month', lastMonthStr)
    .order('total_points', { ascending: false })
    .limit(3);

  if (!podium?.length) {
    return NextResponse.json({ announced: false, reason: 'Aucun score le mois dernier' });
  }

  const userIds = podium.map((p) => p.user_id);
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const nameById = new Map((profiles || []).map((p) => [p.id, p.full_name || 'Membre']));

  const medals = ['🥇', '🥈', '🥉'];
  const monthLabel = lastMonth.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const lines = podium.map((p, i) => `${medals[i] || '•'} ${nameById.get(p.user_id) || 'Membre'} — ${p.total_points} points`);
  const messageBody = `🏆 Podium productivité de ${monthLabel} :\n\n${lines.join('\n')}\n\nUn nouveau mois, un nouveau classement à zéro pour tout le monde !`;

  await supabase.from('team_chat_messages').insert([
    { channel_type: 'topic', channel_id: ANNOUNCEMENTS_CHANNEL_ID, sender_id: null, body: messageBody },
  ]);

  let sent = 0;
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);
    const { data: members } = await supabase.from('profiles').select('id').eq('approved', true).in('role', ['admin', 'member']);
    const memberIds = (members || []).map((m) => m.id);
    if (memberIds.length) {
      const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').in('user_id', memberIds);
      const payload = JSON.stringify({ title: '🏆 Podium du mois', body: `${nameById.get(podium[0].user_id)} termine #1 !`, url: '/classement' });
      const staleIds: string[] = [];
      for (const sub of subs || []) {
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
    }
  }

  return NextResponse.json({ announced: true, sent });
}
