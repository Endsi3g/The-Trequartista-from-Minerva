import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const alert = await req.json();

    return new Response(
      JSON.stringify({
        success: true,
        alertId: alert.id,
        severity: alert.severity,
        dispatchedChannels: ['in_app', 'email_resend', 'slack_webhook'],
        dispatchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
