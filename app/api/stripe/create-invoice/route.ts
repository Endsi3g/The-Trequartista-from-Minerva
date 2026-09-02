import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/permissions';

// Creates a real Stripe invoice from a local /invoices row and sends it to
// the client by email -- distinct from the existing one-off Payment Links
// feature (client_payment_links), which is for a single MRR charge, not a
// itemized invoice with real line items. Fails honestly with 501 instead
// of a fake invoice when STRIPE_SECRET_KEY isn't configured.
export async function POST(req: Request) {
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

  let body: { invoiceId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (!body.invoiceId) {
    return NextResponse.json({ error: 'invoiceId requis' }, { status: 400 });
  }

  const { data: invoice, error: invoiceError } = await authed
    .from('invoices')
    .select('*, items:invoice_items(*), client:clients(id, name, contact_email, stripe_customer_id)')
    .eq('id', body.invoiceId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
  }
  if (invoice.stripe_invoice_id) {
    return NextResponse.json({ error: 'Cette facture a déjà été envoyée via Stripe.' }, { status: 400 });
  }
  const client = invoice.client as { id: string; name: string; contact_email: string | null; stripe_customer_id: string | null } | null;
  if (!client) {
    return NextResponse.json({ error: 'Client introuvable pour cette facture.' }, { status: 404 });
  }
  if (!client.contact_email) {
    return NextResponse.json({ error: `${client.name} n'a pas de courriel de contact -- ajoute-en un avant d'envoyer une facture Stripe.` }, { status: 400 });
  }
  const items = (invoice.items || []) as { description: string; quantity: number; unit_price_cad: number }[];
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cette facture n\'a aucune ligne à facturer.' }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);

  try {
    let stripeCustomerId = client.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: client.contact_email,
        name: client.name,
        metadata: { client_id: client.id },
      });
      stripeCustomerId = customer.id;
      await authed.from('clients').update({ stripe_customer_id: stripeCustomerId }).eq('id', client.id);
    }

    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: 15,
      currency: invoice.currency?.toLowerCase() || 'cad',
      auto_advance: false,
      metadata: { invoice_id: invoice.id, invoice_number: invoice.invoice_number },
    });

    for (const item of items) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: stripeInvoice.id,
        currency: invoice.currency?.toLowerCase() || 'cad',
        description: `${item.description} (x${item.quantity})`,
        amount: Math.round(item.unit_price_cad * item.quantity * 100),
      });
    }

    const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id!);
    const sent = await stripe.invoices.sendInvoice(finalized.id!);

    await authed
      .from('invoices')
      .update({
        stripe_invoice_id: sent.id,
        stripe_hosted_invoice_url: sent.hosted_invoice_url,
        status: 'sent',
      })
      .eq('id', invoice.id);

    return NextResponse.json({ stripeInvoiceId: sent.id, hostedInvoiceUrl: sent.hosted_invoice_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
