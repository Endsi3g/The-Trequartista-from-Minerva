import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Runs daily via Vercel Cron (see vercel.json). Auto-tracks MRR from real
// Stripe subscriptions -- previously clients.mrr was only ever set
// manually. For each client with a stripe_customer_id, sums their active
// subscriptions' recurring amounts and, if it changed, updates
// clients.mrr and logs the change in client_mrr_history (the same table
// the manual "Ajuster le MRR" flow writes to), attributed to no one
// (created_by NULL) since this is an automated sync, not a team member
// decision.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ synced: 0, reason: 'Stripe non configuré' }, { status: 200 });
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);
  const { data: clients } = await supabase.from('clients').select('id, name, mrr, stripe_customer_id').not('stripe_customer_id', 'is', null);
  if (!clients || clients.length === 0) {
    return NextResponse.json({ synced: 0, updated: 0, reason: 'Aucun client relié à un customer Stripe.' });
  }

  const stripe = new Stripe(secretKey);
  let updated = 0;
  const errors: string[] = [];

  for (const client of clients as { id: string; name: string; mrr: number; stripe_customer_id: string }[]) {
    try {
      const subs = await stripe.subscriptions.list({ customer: client.stripe_customer_id, status: 'active', limit: 20 });
      let monthlyTotal = 0;
      for (const sub of subs.data) {
        for (const item of sub.items.data) {
          const amount = (item.price.unit_amount || 0) / 100;
          const interval = item.price.recurring?.interval;
          const intervalCount = item.price.recurring?.interval_count || 1;
          const monthlyEquivalent =
            interval === 'year' ? (amount * (item.quantity || 1)) / (12 * intervalCount) : interval === 'week' ? (amount * (item.quantity || 1) * 52) / (12 * intervalCount) : (amount * (item.quantity || 1)) / intervalCount;
          monthlyTotal += monthlyEquivalent;
        }
      }
      const roundedMrr = Math.round(monthlyTotal * 100) / 100;

      if (roundedMrr !== (client.mrr || 0)) {
        await supabase.from('clients').update({ mrr: roundedMrr }).eq('id', client.id);
        await supabase.from('client_mrr_history').insert([
          {
            client_id: client.id,
            mrr: roundedMrr,
            note: 'Synchronisation automatique Stripe (abonnements actifs)',
            created_by: null,
          },
        ]);
        updated++;
      }
    } catch (err: unknown) {
      errors.push(`${client.name}: ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  return NextResponse.json({ synced: clients.length, updated, errors: errors.length ? errors : undefined });
}
