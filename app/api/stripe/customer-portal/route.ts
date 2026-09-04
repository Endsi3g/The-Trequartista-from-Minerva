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

  const { data: client, error: clientError } = await authed
    .from('clients')
    .select('id, name, contact_email, stripe_customer_id')
    .eq('id', body.clientId)
    .maybeSingle();

  if (clientError || !client) {
    return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
  }

  const stripe = new Stripe(secretKey);

  try {
    let customerId = client.stripe_customer_id;

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

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnBase,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('[Stripe Customer Portal Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Erreur lors de la création de la session du portail client Stripe.' },
      { status: 500 }
    );
  }
}
