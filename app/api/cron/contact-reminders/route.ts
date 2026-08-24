import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Runs daily via Vercel Cron (see vercel.json).
// Verifies Authorization: Bearer $CRON_SECRET when set.
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

  // Contacts whose follow_up_date is today or overdue and not yet contacted
  const { data: contactsToRemind, error } = await supabase
    .from('contacts')
    .select('id, full_name, company, follow_up_date, follow_up_note, created_by')
    .lte('follow_up_date', today)
    .eq('status', 'a_contacter');

  if (error) {
    console.error('[contact-reminders] Error fetching contacts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!contactsToRemind || contactsToRemind.length === 0) {
    return NextResponse.json({ sent: 0, due_contacts: 0 });
  }

  // Get all push subscriptions
  const { data: allSubscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_key');

  if (subError || !allSubscriptions || allSubscriptions.length === 0) {
    return NextResponse.json({ sent: 0, due_contacts: contactsToRemind.length, reason: 'Aucune souscription push' });
  }

  let sent = 0;

  for (const contact of contactsToRemind) {
    // Target specific user who created the contact or all users if created_by is null
    const targetSubs = contact.created_by
      ? allSubscriptions.filter((s) => s.user_id === contact.created_by)
      : allSubscriptions;

    if (targetSubs.length === 0) continue;

    const nameWithCompany = contact.company ? `${contact.full_name} (${contact.company})` : contact.full_name;
    const noteSnippet = contact.follow_up_note ? ` — « ${contact.follow_up_note} »` : '';

    const payload = JSON.stringify({
      title: `🎯 Rappel contact : ${nameWithCompany}`,
      body: `Relance prévue aujourd'hui${noteSnippet}`,
      tag: `contact-reminder-${contact.id}`,
      data: {
        url: `/contacts/${contact.id}`,
      },
    });

    for (const sub of targetSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth_key,
            },
          },
          payload
        );
        sent++;
      } catch (err: any) {
        // 410 Gone / 404 Not Found -> unsubscribe stale
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.warn('[contact-reminders] Webpush error:', err?.message || err);
        }
      }
    }
  }

  return NextResponse.json({ sent, due_contacts: contactsToRemind.length });
}
