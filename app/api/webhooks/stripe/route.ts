import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient as createServiceClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Real Stripe webhook receiver: marks a generated payment link as paid the
// moment the client actually pays, instead of the team having to check the
// Stripe dashboard manually. Register this route's URL in the Stripe
// dashboard (Developers -> Webhooks) listening for checkout.session.completed,
// and set STRIPE_WEBHOOK_SECRET to the signing secret it gives you.
export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook non configuré.' }, { status: 501 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentLinkId = typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id;

    if (paymentLinkId) {
      const supabase = createServiceClient(supabaseUrl, supabaseSecret);
      await supabase
        .from('client_payment_links')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('stripe_payment_link_id', paymentLinkId);
    }
  }

  return NextResponse.json({ received: true });
}
