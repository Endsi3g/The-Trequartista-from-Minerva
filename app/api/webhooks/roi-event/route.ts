import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

// Lazily instantiated -- a module-scope createClient() call with a `!`
// assertion throws during `next build`'s page-data collection when the
// service-role key isn't present in the build environment (e.g. CI), even
// though it's only ever needed at request time.
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// No hardcoded fallback: if the secret isn't configured, every request is
// rejected instead of silently trusting a value that has been public in
// .env.example (and therefore in git history) since day one.
function isValidWebhookSecret(authHeader: string | null): boolean {
  const webhookSecret = process.env.CENTURIONS_WEBHOOK_SECRET;
  if (!webhookSecret || !authHeader) return false;

  const provided = authHeader.replace(/^Bearer\s+/i, '').trim();
  const expected = Buffer.from(webhookSecret);
  const received = Buffer.from(provided);

  // Different lengths must fail before timingSafeEqual (it throws on
  // mismatched buffer lengths rather than returning false).
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  try {
    const authHeader = req.headers.get('authorization');

    if (!isValidWebhookSecret(authHeader)) {
      return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const body = await req.json();
    const { clientId, eventType, data } = body;

    if (!clientId || !eventType) {
      return NextResponse.json({ error: 'Missing clientId or eventType' }, { status: 400 });
    }

    // Fetch existing client metrics
    const { data: existingMetrics, error: fetchErr } = await supabase
      .from('client_roi_metrics')
      .select('*')
      .eq('client_id', clientId)
      .single();

    let updatedMetrics = existingMetrics || {
      client_id: clientId,
      leads_sent_30d: 0,
      sales_completed: 0,
      pipeline_value: 0,
      google_ads_spent: 0,
      gmb_reviews_count: 0,
      total_invested: 5000,
      total_generated: 0,
    };

    switch (eventType) {
      case 'lead.created':
        updatedMetrics.leads_sent_30d += 1;
        break;

      case 'sale.completed':
        updatedMetrics.sales_completed += 1;
        updatedMetrics.pipeline_value += Number(data?.amount || 0);
        updatedMetrics.total_generated += Number(data?.amount || 0);
        break;

      case 'ads.spend_updated':
        updatedMetrics.google_ads_spent += Number(data?.spentAmount || 0);
        updatedMetrics.total_invested += Number(data?.spentAmount || 0);
        if (updatedMetrics.leads_sent_30d > 0) {
          updatedMetrics.cost_per_lead = Math.round(updatedMetrics.google_ads_spent / updatedMetrics.leads_sent_30d);
        }
        break;

      case 'gmb.review_added':
        updatedMetrics.gmb_reviews_count += 1;
        if (data?.rating) {
          updatedMetrics.gmb_rating = Number(data.rating);
        }
        break;

      default:
        return NextResponse.json({ error: `Unknown event type: ${eventType}` }, { status: 400 });
    }

    // Recalculate ROI Multiplier
    if (updatedMetrics.total_invested > 0) {
      updatedMetrics.roi_multiplier = Number((updatedMetrics.total_generated / updatedMetrics.total_invested).toFixed(1));
    }

    // Save to Supabase
    const { error: saveErr } = await supabase
      .from('client_roi_metrics')
      .upsert(updatedMetrics, { onConflict: 'client_id' });

    if (saveErr) {
      return NextResponse.json({ error: saveErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      eventType,
      clientId,
      updatedMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
