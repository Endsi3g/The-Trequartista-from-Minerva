import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authed = await createServerClient();
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: "Stripe n'est pas configuré sur cet environnement (STRIPE_SECRET_KEY manquante)." },
      { status: 501 }
    );
  }

  let body: { clientId?: string; returnUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  if (!body.clientId) {
    return NextResponse.json({ error: 'clientId requis' }, { status: 400 });
  }

  // Fetch client details
  const { data: client, error: clientError } = await authed
    .from('clients')
    .select('id, name, contact_email, mrr, stripe_customer_id')
    .eq('id', body.clientId)
    .maybeSingle();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const mrrAmount = client.mrr && client.mrr > 0 ? client.mrr : 500; // fallback standard 500$ CAD/mo
  const stripe = new Stripe(secretKey);

  try {
    let customerId = client.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: client.name,
        email: client.contact_email || undefined,
        metadata: { client_id: client.id },
      });
      customerId = customer.id;

      await authed
        .from('clients')
        .update({ stripe_customer_id: customerId })
        .eq('id', client.id);
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const returnBase = body.returnUrl || `${origin}/portal`;

    // Create Checkout Session in subscription mode
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Abonnement Minerva — ${client.name}`,
              description: 'Partenariat digital & gestion Minerva Flow (Mensuel)',
            },
            unit_amount: Math.round(mrrAmount * 100),
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      success_url: `${returnBase}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnBase}?payment=cancelled`,
      metadata: {
        client_id: client.id,
        type: 'monthly_subscription',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[Stripe Checkout Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la création de la session Stripe.' },
      { status: 500 }
    );
  }
}
