import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/permissions';

// Pulls real Stripe invoices for every client with a stripe_customer_id
// and reflects their current status locally -- covers invoices created
// directly in the Stripe dashboard (not just ones this app itself sent
// via /api/stripe/create-invoice), so /invoices stays a true mirror of
// Stripe rather than only tracking what this app initiated.
const STRIPE_TO_LOCAL_STATUS: Record<string, string> = {
  draft: 'draft',
  open: 'sent',
  paid: 'paid',
  uncollectible: 'overdue',
  void: 'cancelled',
};

export async function POST() {
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré sur cet environnement (STRIPE_SECRET_KEY manquante)." },
      { status: 501 }
    );
  }

  const { data: clients } = await authed.from('clients').select('id, name, stripe_customer_id').not('stripe_customer_id', 'is', null);
  if (!clients || clients.length === 0) {
    return NextResponse.json({ synced: 0, created: 0, updated: 0, reason: 'Aucun client relié à un customer Stripe.' });
  }

  const stripe = new Stripe(secretKey);
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const client of clients as { id: string; name: string; stripe_customer_id: string }[]) {
    try {
      const stripeInvoices = await stripe.invoices.list({ customer: client.stripe_customer_id, limit: 50 });

      for (const inv of stripeInvoices.data) {
        const localStatus = STRIPE_TO_LOCAL_STATUS[inv.status || 'draft'] || 'draft';
        const { data: existing } = await authed.from('invoices').select('id').eq('stripe_invoice_id', inv.id).maybeSingle();

        if (existing) {
          await authed
            .from('invoices')
            .update({
              status: localStatus,
              stripe_hosted_invoice_url: inv.hosted_invoice_url,
              paid_at: inv.status === 'paid' && inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000).toISOString() : null,
            })
            .eq('id', existing.id);
          updated++;
        } else {
          const subtotal = (inv.subtotal || 0) / 100;
          const total = (inv.total || 0) / 100;
          const { data: newInvoice } = await authed
            .from('invoices')
            .insert([
              {
                invoice_number: inv.number || `STRIPE-${inv.id}`,
                type: 'invoice',
                client_id: client.id,
                status: localStatus,
                currency: (inv.currency || 'cad').toUpperCase(),
                issue_date: new Date((inv.created || Date.now() / 1000) * 1000).toISOString().slice(0, 10),
                due_date: inv.due_date ? new Date(inv.due_date * 1000).toISOString().slice(0, 10) : null,
                subtotal_cad: subtotal,
                tax_tps_cad: 0,
                tax_tvq_cad: 0,
                total_cad: total,
                stripe_invoice_id: inv.id,
                stripe_hosted_invoice_url: inv.hosted_invoice_url,
                notes: 'Synchronisée depuis Stripe (créée hors de cette app).',
              },
            ])
            .select('id')
            .single();

          if (newInvoice) {
            for (const line of inv.lines.data) {
              await authed.from('invoice_items').insert([
                {
                  invoice_id: newInvoice.id,
                  description: line.description || 'Ligne Stripe',
                  quantity: line.quantity || 1,
                  unit_price_cad: (line.amount || 0) / 100 / (line.quantity || 1),
                  amount_cad: (line.amount || 0) / 100,
                },
              ]);
            }
          }
          created++;
        }
      }
    } catch (err: unknown) {
      errors.push(`${client.name}: ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  return NextResponse.json({ synced: created + updated, created, updated, errors: errors.length ? errors : undefined });
}
