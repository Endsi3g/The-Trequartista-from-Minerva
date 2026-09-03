import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';
import { sendEmailServerSide } from '@/lib/services/email-service';
import { sendSms } from '@/lib/services/twilio';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const BookSlotSchema = z.object({
  slotIso: z.string().datetime(),
  notes: z.string().optional(),
});

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers });
  }

  const parsed = BookSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Format de créneau invalide (ISO 8601 requis)', details: parsed.error.flatten() },
      { status: 400, headers }
    );
  }

  const { slotIso, notes } = parsed.data;
  const supabase = getSupabase();

  // 1. Récupérer le lead
  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('id, company_name, contact_name, email, phone, consent_sms')
    .eq('id', id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404, headers });
  }

  // 2. Mettre à jour call_at et le statut du lead
  const { error: updateErr } = await supabase
    .from('leads')
    .update({
      call_at: slotIso,
      status: 'RDV Fixé',
      stage: 'qualification',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateErr) {
    console.error('[leads/book] Erreur mise à jour RDV:', updateErr);
    return NextResponse.json({ error: 'Erreur lors de la réservation' }, { status: 500, headers });
  }

  // 3. Enregistrer l'événement booking_scheduled dans lead_events
  await supabase.from('lead_events').insert({
    lead_id: id,
    event_type: 'booking_scheduled',
    payload: {
      slotIso,
      notes: notes || null,
      scheduled_at: new Date().toISOString(),
    },
  });

  const formattedDate = new Date(slotIso).toLocaleDateString('fr-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 4. Envoi du courriel de confirmation de RDV
  if (lead.email) {
    sendEmailServerSide({
      to: lead.email,
      subject: `Rendez-vous confirmé : Installation Minerva Flow le ${formattedDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; color: #18181b;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 12px;">Minerva Flow</div>
          <h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 16px 0;">Rendez-vous confirmé !</h1>
          <p style="font-size: 14px; line-height: 22px; color: #3f3f46;">
            Bonjour ${lead.contact_name}, votre créneau d'intervention sur place pour <strong>${lead.company_name}</strong> est validé pour le :
          </p>
          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 16px; margin: 20px 0; font-weight: 600; color: #065f46; font-size: 16px;">
            📅 ${formattedDate}
          </div>
          <p style="font-size: 14px; line-height: 22px; color: #3f3f46;">
            <strong>Déroulement de l'intervention (45 à 60 minutes) :</strong><br/>
            1. Branchement de l'imprimante thermique & synchronisation POS<br/>
            2. Test d'une commande réelle sur place<br/>
            3. Formation rapide de l'équipe et remise du script<br/>
            4. Pose des chevalets et QR codes
          </p>
          <p style="font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px;">
            Pour tout empêchement ou modification, répondez simplement à ce courriel ou écrivez à support@minervaflow.com.
          </p>
        </div>
      `,
    }).catch((err) => console.warn('[leads/book] Erreur envoi confirmation email RDV:', err));
  }

  // 5. SMS de confirmation si consentement accordé
  if (lead.phone && lead.consent_sms) {
    sendSms(
      lead.phone,
      `Minerva Flow: Votre rdv d'installation pour ${lead.company_name} est confirmé pour le ${formattedDate}. Durée: 45-60 min.`,
      { requireConsent: true, hasConsent: true, includeOptOut: true }
    ).catch((err) => console.warn('[leads/book] Erreur envoi SMS confirmation RDV:', err));
  }

  return NextResponse.json(
    {
      success: true,
      call_at: slotIso,
      formattedDate,
      message: 'Rendez-vous réservé avec succès',
    },
    { status: 200, headers }
  );
}
