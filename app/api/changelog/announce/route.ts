import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { requireAdmin } from '@/lib/server/permissions';
import { generateGeminiText } from '@/lib/services/gemini';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// #annonces -- same fixed-slug topic-channel pattern as #général (see
// app/(dashboard)/chat/page.tsx's TOPIC_CHANNELS).
const ANNOUNCEMENTS_CHANNEL_ID = '00000000-0000-0000-0000-000000000002';

// Called (fire-and-forget) from /changelog/new right after a changelog
// entry is created. Turns it into a short chat announcement -- posted as
// the app's own "Assistant Minerva" identity (sender_id NULL, same pattern
// as Coach Minerva) -- and pushes it to every team member, so a shipped
// update doesn't just sit unread on the changelog page.
export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const entryId = typeof body?.entryId === 'string' ? body.entryId : '';
  if (!entryId) {
    return NextResponse.json({ error: 'entryId manquant' }, { status: 400 });
  }

  const { data: entry } = await authed
    .from('changelog_entries')
    .select('title, body, version')
    .eq('id', entryId)
    .maybeSingle();
  if (!entry) {
    return NextResponse.json({ error: 'Entrée de changelog introuvable' }, { status: 404 });
  }

  const announcement = await generateGeminiText(
    `Résume cette nouveauté de l'app Minerva en 1-2 phrases courtes, en français, ton enthousiaste mais factuel, pour une annonce dans le chat d'équipe. Ne répète pas le titre mot pour mot dans le résumé -- explique ce que ça change concrètement. Titre : "${entry.title}"${entry.version ? ` (v${entry.version})` : ''}. Description : "${entry.body}". Réponds uniquement avec le résumé, sans préambule ni guillemets.`,
    entry.body.slice(0, 200)
  );

  const messageBody = `📣 Nouveauté${entry.version ? ` v${entry.version}` : ''} : ${entry.title}\n\n${announcement}`;

  const service = createServiceClient(supabaseUrl, supabaseSecret);
  await service.from('team_chat_messages').insert([
    { channel_type: 'topic', channel_id: ANNOUNCEMENTS_CHANNEL_ID, sender_id: null, body: messageBody },
  ]);

  let sent = 0;
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);
    const { data: members } = await service.from('profiles').select('id').eq('approved', true).in('role', ['admin', 'member']);
    const memberIds = (members || []).map((m) => m.id);
    if (memberIds.length) {
      const { data: subs } = await service.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').in('user_id', memberIds);
      const payload = JSON.stringify({ title: '📣 Nouveauté Minerva', body: entry.title, url: '/chat' });
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
        await service.from('push_subscriptions').delete().in('id', staleIds);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
