import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/server/permissions';

// Creates a real Stripe Payment Link for a client's monthly MRR -- a fresh
// Product + recurring Price on every call (Stripe has no first-class
// "update this link's amount" primitive, and MRR changes over time), then
// a Payment Link pointing at that price. Fails honestly with 501 instead
// of a fake link when STRIPE_SECRET_KEY isn't configured.
export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;
  const { user } = guard;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré sur cet environnement (STRIPE_SECRET_KEY manquante)." },
      { status: 501 }
    );
  }

  let body: { clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  if (!body.clientId) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
  }

  const { data: client, error: clientError } = await authed
    .from('clients')
    .select('id, name, mrr')
    .eq('id', body.clientId)
    .maybeSingle();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }
  if (!client.mrr || client.mrr <= 0) {
    return NextResponse.json({ error: "Ce client n'a pas de MRR défini." }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);

  try {
    const price = await stripe.prices.create({
      currency: 'cad',
      unit_amount: Math.round(client.mrr * 100),
      recurring: { interval: 'month' },
      product_data: { name: `Minerva — ${client.name}` },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { client_id: client.id },
      // This Stripe account has Managed Payments (automatic tax) on by
      // default, which requires a product tax_code we have no reliable
      // way to assign per service line -- disable it for these links
      // rather than mis-tag every product with a guessed tax code.
      managed_payments: { enabled: false },
    });

    await authed.from('client_payment_links').insert([
      {
        client_id: client.id,
        created_by: user.id,
        stripe_payment_link_id: paymentLink.id,
        stripe_price_id: price.id,
        url: paymentLink.url,
        amount: client.mrr,
        currency: 'cad',
      },
    ]);

    return NextResponse.json({ url: paymentLink.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
