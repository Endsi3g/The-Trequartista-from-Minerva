import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // CORS Headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    const alert = await req.json();

    if (!alert || !alert.title) {
      return new Response(JSON.stringify({ error: 'Missing alert payload or title' }), {
        status: 400,
        headers,
      });
    }

    const severity = alert.severity || 'warning';
    const channelsDispatched: string[] = ['in_app_hub'];

    // If Supabase credentials are present, broadcast into team chat for critical alerts
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && (severity === 'critical' || severity === 'warning')) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const icon = severity === 'critical' ? '🚨' : '⚠️';
        const alertMessage = `${icon} **[ALERTE SYSTÈME - ${severity.toUpperCase()}]** : ${alert.title}\n\n${alert.message || 'Aucun détail additionnel fourni.'}\n\n*Source : ${alert.source || 'Tech Edge Sentinel'} • Détecté le ${new Date().toLocaleString('fr-CA')}*`;

        await supabase.from('team_chat_messages').insert({
          channel_type: 'topic',
          channel_id: '00000000-0000-0000-0000-000000000002', // #annonces channel
          sender_id: null,
          body: alertMessage,
        });
        channelsDispatched.push('team_chat_annonces');
      } catch (dbErr) {
        console.warn('[AlertDispatcher] Could not broadcast to team_chat_messages:', dbErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        alertId: alert.id || `alert-${Date.now()}`,
        severity,
        title: alert.title,
        dispatchedChannels: channelsDispatched,
        dispatchedAt: new Date().toISOString(),
      }),
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers,
    });
  }
});
