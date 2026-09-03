import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { scoreLead, getInitialInterventionChecklist } from '@/lib/leads/scoring';
import { sendEmailServerSide } from '@/lib/services/email-service';
import { sendSms } from '@/lib/services/twilio';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

const LeadIngestionSchema = z.object({
  company_name: z.string().trim().min(1).max(150),
  contact_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().optional().nullable(),
  monthly_transactions: z.union([z.number(), z.string()]).optional().nullable(),
  pos_system: z.string().trim().optional().nullable(),
  business_type: z.string().trim().optional().nullable(),
  loyalty_goal: z.string().trim().optional().nullable(),
  is_multi_site: z.boolean().optional().nullable(),
  consent_sms: z.boolean().optional().default(false),
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  utm_term: z.string().optional().nullable(),
  utm_content: z.string().optional().nullable(),
  gclid: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // 1. Rate-limiting par IP (20 soumissions / minute max)
  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'leads-inbound-post', 20, 60_000);
  if (limited) {
    return NextResponse.json(
      { error: 'Trop de requêtes, réessayez plus tard.' },
      { status: 429, headers: { ...headers, 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  // 2. Parsing du payload
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers });
  }

  const parsed = LeadIngestionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Champs invalides', details: parsed.error.flatten() },
      { status: 400, headers }
    );
  }

  const data = parsed.data;
  const phone = normalizePhone(data.phone);

  // 3. Calcul du score et du Tier
  const scoreResult = scoreLead({
    city: data.city,
    monthly_transactions: data.monthly_transactions,
    pos_system: data.pos_system,
    business_type: data.business_type,
    loyalty_goal: data.loyalty_goal,
    is_multi_site: data.is_multi_site,
  });

  const nextActionDueAt = new Date(Date.now() + scoreResult.slaMinutes * 60 * 1000).toISOString();
  const initialChecklist = getInitialInterventionChecklist();

  // 4. Détermination de l'URL de base pour le bookingLink
  const host = req.headers.get('host') || 'minerva-trequista.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const supabase = getSupabase();

  // 5. Insertion dans public.leads
  const parsedTx =
    typeof data.monthly_transactions === 'number'
      ? data.monthly_transactions
      : data.monthly_transactions
      ? parseInt(String(data.monthly_transactions).replace(/[^\d]/g, ''), 10) || 0
      : 0;

  const leadInsertPayload = {
    company_name: data.company_name,
    contact_name: data.contact_name,
    email: data.email,
    phone,
    status: 'Nouveau',
    stage: 'nouveau',
    source: data.utm_source || 'inbound_form',
    city: data.city || null,
    monthly_transactions: parsedTx,
    pos_system: data.pos_system || null,
    business_type: data.business_type || null,
    loyalty_goal: data.loyalty_goal || null,
    is_multi_site: Boolean(data.is_multi_site),
    qualification_score: scoreResult.score,
    qualification_tier: scoreResult.tier,
    qualification_breakdown: scoreResult.breakdown,
    next_action_due_at: nextActionDueAt,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    utm_term: data.utm_term || null,
    utm_content: data.utm_content || null,
    gclid: data.gclid || null,
    consent_sms: Boolean(data.consent_sms),
    intervention_checklist: initialChecklist,
    notes: data.notes || null,
  };

  const { data: insertedLead, error: insertError } = await supabase
    .from('leads')
    .insert([leadInsertPayload])
    .select('id')
    .single();

  if (insertError || !insertedLead) {
    console.error('[leads/route] Erreur insertion lead:', insertError);
    return NextResponse.json({ error: "Impossible d'enregistrer le lead." }, { status: 500, headers });
  }

  const leadId = insertedLead.id;
  const bookingLink = `${baseUrl}/merci?leadId=${leadId}`;

  // Mettre à jour le booking_link sur le lead
  await supabase.from('leads').update({ booking_link: bookingLink }).eq('id', leadId);

  // 6. Enregistrement des événements lead_created et qualification_scored
  await supabase.from('lead_events').insert([
    {
      lead_id: leadId,
      event_type: 'lead_created',
      payload: {
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email,
        phone,
        source: data.utm_source || 'inbound_form',
        gclid: data.gclid || null,
        consent_sms: Boolean(data.consent_sms),
      },
    },
    {
      lead_id: leadId,
      event_type: 'qualification_scored',
      payload: {
        score: scoreResult.score,
        tier: scoreResult.tier,
        slaMinutes: scoreResult.slaMinutes,
        actionLabel: scoreResult.actionLabel,
        breakdown: scoreResult.breakdown,
      },
    },
  ]);

  // 7. Alerte instantanée pour les leads A (Tier A - SLA < 10 min)
  if (scoreResult.tier === 'A') {
    // 7.1 Message instantané dans team_chat_messages (canal topic/annonces)
    try {
      await supabase.from('team_chat_messages').insert({
        channel_type: 'topic',
        channel_id: 'annonces',
        body: `🚨 **ALERTE LEAD TIER A (<10 MIN)** : ${data.company_name} (Score ${scoreResult.score}/100) !\n• Contact : ${data.contact_name} — 📞 ${phone}\n• Ville : ${data.city || 'Non renseignée'} | POS : ${data.pos_system || 'Non renseigné'}\n• Action requise : ${scoreResult.actionLabel}`,
      });
    } catch (chatErr) {
      console.warn('[leads/route] Erreur envoi chat alerte:', chatErr);
    }

    // 7.2 Courriel d'alerte haute priorité à l'équipe commerciale
    const alertEmailTarget = process.env.ADMIN_ALERT_EMAIL || 'equipe@minervaflow.com';
    sendEmailServerSide({
      to: alertEmailTarget,
      subject: `🚨 [TIER A - URGENT 10 MIN] Nouveau lead qualifié : ${data.company_name} (Score ${scoreResult.score}/100)`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #059669; border-radius: 8px;">
          <h2 style="color: #059669; margin-top: 0;">🚨 Lead Tier A - Intervention sous 10 minutes</h2>
          <p>Un nouveau prospect prioritaire vient de soumettre le formulaire avec un score de <strong>${scoreResult.score}/100</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px; font-weight: bold;">Établissement :</td><td>${data.company_name}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Contact :</td><td>${data.contact_name}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Téléphone :</td><td><a href="tel:${phone}">${phone}</a></td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Courriel :</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Ville :</td><td>${data.city || 'Non renseignée'}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">POS :</td><td>${data.pos_system || 'Non renseigné'}</td></tr>
            <tr><td style="padding: 6px; font-weight: bold;">Transactions :</td><td>${data.monthly_transactions || 'Non renseigné'}</td></tr>
          </table>
          <p><a href="${baseUrl}/leads/${leadId}" style="display: inline-block; background: #059669; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Ouvrir la fiche Lead dans Minerva</a></p>
        </div>
      `,
    }).catch((err) => console.warn('[leads/route] Erreur envoi email alerte:', err));

    // 7.3 SMS d'alerte admin si configuré
    const adminPhone = process.env.ADMIN_ALERT_PHONE;
    if (adminPhone) {
      sendSms(
        adminPhone,
        `🚨 ALERTE TIER A : ${data.company_name} (Score ${scoreResult.score}/100). Rappeler ${data.contact_name} au ${phone} sous 10 min.`,
        { requireConsent: false, includeOptOut: false }
      ).catch((err) => console.warn('[leads/route] Erreur envoi SMS admin:', err));
    }

    await supabase.from('lead_events').insert({
      lead_id: leadId,
      event_type: 'tier_a_alert_sent',
      payload: { targetEmail: alertEmailTarget, score: scoreResult.score },
    });
  }

  // 8. Envoi de l'email de confirmation automatique au prospect avec le bookingLink
  sendEmailServerSide({
    to: data.email,
    subject: `Votre demande est confirmée - Choisissez votre créneau d'installation`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; color: #18181b;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 12px;">Minerva Flow</div>
        <h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 16px 0;">Bonjour ${data.contact_name},</h1>
        <p style="font-size: 14px; line-height: 22px; color: #3f3f46;">
          Nous avons bien reçu votre demande pour <strong>${data.company_name}</strong>. Notre équipe a analysé vos paramètres (système ${data.pos_system || 'de caisse'} à ${data.city || 'votre établissement'}).
        </p>
        <p style="font-size: 14px; line-height: 22px; color: #3f3f46;">
          Pour finaliser la mise en service sans perturber votre service, vous pouvez réserver directement l'un de nos créneaux d'installation sur place (durée 45-60 min) :
        </p>
        <div style="margin: 28px 0;">
          <a href="${bookingLink}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            📅 Choisir mon créneau d'installation
          </a>
        </div>
        <p style="font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 16px; margin-top: 32px;">
          Minerva Agency • Montréal, QC • Support : support@minervaflow.com
        </p>
      </div>
    `,
  })
    .then(async (res) => {
      if (res.success) {
        await supabase.from('lead_events').insert({
          lead_id: leadId,
          event_type: 'confirmation_email_sent',
          payload: { emailId: res.id, to: data.email },
        });
      }
    })
    .catch((err) => console.warn('[leads/route] Erreur envoi confirmation email:', err));

  // 9. Réponse JSON
  return NextResponse.json(
    {
      success: true,
      leadId,
      score: scoreResult.score,
      tier: scoreResult.tier,
      bookingLink,
      nextAction: scoreResult.actionLabel,
      nextActionDueAt,
    },
    { status: 201, headers }
  );
}
