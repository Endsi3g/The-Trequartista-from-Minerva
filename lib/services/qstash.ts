import { Client } from '@upstash/qstash';

// Schedules a one-off delayed callback (default 5 minutes) rather than
// relying on a periodic Vercel Cron -- precise per-lead timing without
// needing a Pro-plan minute-level cron. Honest no-op when QSTASH_TOKEN
// isn't configured: the caller is expected to record
// sms_follow_up_status = 'skipped_no_config' rather than pretend it was
// scheduled.
export async function scheduleDelayedCallback(
  callbackPath: string,
  body: Record<string, unknown>,
  delaySeconds = 300
): Promise<{ scheduled: boolean; error?: string }> {
  const token = process.env.QSTASH_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!token) {
    return { scheduled: false, error: 'QSTASH_TOKEN non configuré' };
  }
  if (!baseUrl) {
    return { scheduled: false, error: 'NEXT_PUBLIC_APP_URL non configuré -- QStash a besoin d\'une URL publique à rappeler' };
  }

  try {
    const client = new Client({ token });
    await client.publishJSON({
      url: `${baseUrl}${callbackPath}`,
      body,
      delay: delaySeconds,
      headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    });
    return { scheduled: true };
  } catch (err) {
    return { scheduled: false, error: err instanceof Error ? err.message : 'Erreur QStash inconnue' };
  }
}
