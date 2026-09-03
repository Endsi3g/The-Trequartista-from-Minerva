import { NextResponse } from 'next/server';
import { withSupabaseRouteHandler } from '@/lib/supabase/server-auth';
import { sendEmailServerSide } from '@/lib/services/email-service';
import { sendSms } from '@/lib/services/twilio';

export const GET = withSupabaseRouteHandler(
  { auth: 'secret' },
  async (req, ctx) => {
    const supabase = ctx.supabaseAdmin;
    const now = new Date();
    const report = {
      reminders24hSent: 0,
      reminders2hSent: 0,
      relances2hSent: 0,
      relances24hSent: 0,
      errors: [] as string[],
    };

  try {
    // =========================================================================
    // A. RAPPELS DE RENDEZ-VOUS (24H & 2H AVANT CALL_AT)
    // =========================================================================

    // Fenêtre 24h : entre now + 23h et now + 25h
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: leads24h, error: err24h } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, email, phone, consent_sms, call_at')
      .gte('call_at', window24hStart)
      .lte('call_at', window24hEnd);

    if (err24h) {
      report.errors.push(`Erreur query 24h: ${err24h.message}`);
    } else if (leads24h && leads24h.length > 0) {
      for (const lead of leads24h) {
        // Vérifier dans lead_events qu'aucun rappel 24h n'a déjà été envoyé
        const { data: existingEvents } = await supabase
          .from('lead_events')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('event_type', 'reminder_24h_sent')
          .limit(1);

        if (!existingEvents || existingEvents.length === 0) {
          const dateStr = new Date(lead.call_at).toLocaleDateString('fr-CA', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          // Envoi courriel
          if (lead.email) {
            await sendEmailServerSide({
              to: lead.email,
              subject: `Rappel : Votre intervention Minerva Flow demain à ${dateStr}`,
              html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                  <h3 style="color: #059669; margin-top: 0;">Rappel d'intervention à J-1</h3>
                  <p>Bonjour ${lead.contact_name},</p>
                  <p>Nous vous confirmons notre passage demain pour l'installation et la configuration de votre terminal Minerva Flow chez <strong>${lead.company_name}</strong> :</p>
                  <p style="background: #ecfdf5; padding: 12px; border-radius: 6px; font-weight: bold; color: #065f46;">
                    📅 ${dateStr} (Durée prévue : 45 à 60 minutes)
                  </p>
                  <p>Pensez à avoir les accès à votre réseau Wi-Fi/caisse à portée de main.</p>
                  <p style="font-size: 12px; color: #71717a;">L'équipe technique Minerva</p>
                </div>
              `,
            });
          }

          // Envoi SMS (strictement conditionné à consent_sms === true)
          if (lead.phone && lead.consent_sms) {
            await sendSms(
              lead.phone,
              `Rappel Minerva: Votre installation sur place pour ${lead.company_name} a lieu demain (${dateStr}). À très vite!`,
              { requireConsent: true, hasConsent: true, includeOptOut: true }
            );
          }

          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'reminder_24h_sent',
            payload: { sent_at: new Date().toISOString(), call_at: lead.call_at },
          });

          report.reminders24hSent++;
        }
      }
    }

    // Fenêtre 2h : entre now + 1h15 et now + 2h45
    const window2hStart = new Date(now.getTime() + 75 * 60 * 1000).toISOString();
    const window2hEnd = new Date(now.getTime() + 165 * 60 * 1000).toISOString();

    const { data: leads2h, error: err2h } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, email, phone, consent_sms, call_at')
      .gte('call_at', window2hStart)
      .lte('call_at', window2hEnd);

    if (err2h) {
      report.errors.push(`Erreur query 2h: ${err2h.message}`);
    } else if (leads2h && leads2h.length > 0) {
      for (const lead of leads2h) {
        // Vérifier dans lead_events qu'aucun rappel 2h n'a déjà été envoyé
        const { data: existingEvents } = await supabase
          .from('lead_events')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('event_type', 'reminder_2h_sent')
          .limit(1);

        if (!existingEvents || existingEvents.length === 0) {
          const dateStr = new Date(lead.call_at).toLocaleTimeString('fr-CA', {
            hour: '2-digit',
            minute: '2-digit',
          });

          // Envoi courriel
          if (lead.email) {
            await sendEmailServerSide({
              to: lead.email,
              subject: `Rappel : Intervention Minerva Flow dans 2 heures (${dateStr})`,
              html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                  <h3 style="color: #059669; margin-top: 0;">Notre expert arrive dans 2 heures</h3>
                  <p>Bonjour ${lead.contact_name},</p>
                  <p>Notre technicien se prépare pour l'intervention chez <strong>${lead.company_name}</strong> prévue à <strong>${dateStr}</strong>.</p>
                  <p>Si vous avez un contretemps de dernière minute, répondez directement à ce courriel.</p>
                  <p style="font-size: 12px; color: #71717a;">Minerva Agency • Support prioritaire</p>
                </div>
              `,
            });
          }

          // Envoi SMS si consentement
          if (lead.phone && lead.consent_sms) {
            await sendSms(
              lead.phone,
              `Minerva Flow: Notre expert sera chez ${lead.company_name} dans 2h (à ${dateStr}) pour votre setup.`,
              { requireConsent: true, hasConsent: true, includeOptOut: true }
            );
          }

          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'reminder_2h_sent',
            payload: { sent_at: new Date().toISOString(), call_at: lead.call_at },
          });

          report.reminders2hSent++;
        }
      }
    }

    // =========================================================================
    // B. RELANCES D'ABANDON (2-4H ET 24H SI AUCUN RDV FIXÉ)
    // =========================================================================

    // 1. Relance à 2-4h post-formulaire si call_at IS NULL
    const relance2hStart = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const relance2hEnd = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    const { data: abandoned2h, error: errAb2h } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, email, phone, consent_sms, booking_link')
      .is('call_at', null)
      .gte('created_at', relance2hStart)
      .lte('created_at', relance2hEnd);

    if (!errAb2h && abandoned2h && abandoned2h.length > 0) {
      for (const lead of abandoned2h) {
        const { data: alreadySent } = await supabase
          .from('lead_events')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('event_type', 'relance_2h_sent')
          .limit(1);

        if (!alreadySent || alreadySent.length === 0) {
          const bookingUrl = lead.booking_link || `https://minerva-trequista.vercel.app/merci?leadId=${lead.id}`;

          if (lead.email) {
            await sendEmailServerSide({
              to: lead.email,
              subject: `Finalisation de votre créneau d'installation - ${lead.company_name}`,
              html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                  <h3 style="color: #059669; margin-top: 0;">Un créneau pour votre installation ?</h3>
                  <p>Bonjour ${lead.contact_name},</p>
                  <p>Vous avez complété votre qualification pour <strong>${lead.company_name}</strong> il y a quelques heures. Nos équipes n'ont pas vu de créneau sélectionné.</p>
                  <p>Deux créneaux hebdomadaires sont réservés pour les déploiements sur place :</p>
                  <div style="margin: 20px 0;">
                    <a href="${bookingUrl}" style="background: #059669; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      👉 Choisir mon créneau maintenant
                    </a>
                  </div>
                </div>
              `,
            });
          }

          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'relance_2h_sent',
            payload: { sent_at: new Date().toISOString() },
          });

          report.relances2hSent++;
        }
      }
    }

    // 2. Relance à 24h post-formulaire si toujours aucun RDV
    const relance24hStart = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();
    const relance24hEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();

    const { data: abandoned24h, error: errAb24h } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, email, phone, consent_sms, booking_link')
      .is('call_at', null)
      .gte('created_at', relance24hStart)
      .lte('created_at', relance24hEnd);

    if (!errAb24h && abandoned24h && abandoned24h.length > 0) {
      for (const lead of abandoned24h) {
        const { data: alreadySent } = await supabase
          .from('lead_events')
          .select('id')
          .eq('lead_id', lead.id)
          .eq('event_type', 'relance_24h_sent')
          .limit(1);

        if (!alreadySent || alreadySent.length === 0) {
          const bookingUrl = lead.booking_link || `https://minerva-trequista.vercel.app/merci?leadId=${lead.id}`;

          if (lead.email) {
            await sendEmailServerSide({
              to: lead.email,
              subject: `Derniers créneaux d'installation disponibles cette semaine - ${lead.company_name}`,
              html: `
                <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                  <h3 style="color: #059669; margin-top: 0;">Disponibilités d'installation limitées</h3>
                  <p>Bonjour ${lead.contact_name},</p>
                  <p>Les plages d'installation sur place pour <strong>${lead.company_name}</strong> se remplissent rapidement cette semaine.</p>
                  <p>Prenez 30 secondes pour bloquer la date qui convient le mieux à vos heures de service :</p>
                  <div style="margin: 20px 0;">
                    <a href="${bookingUrl}" style="background: #059669; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      📅 Bloquer mon créneau d'intervention
                    </a>
                  </div>
                </div>
              `,
            });
          }

          // SMS de relance uniquement si consentement
          if (lead.phone && lead.consent_sms) {
            await sendSms(
              lead.phone,
              `Minerva Flow: Plus que 2 créneaux d'installation dispo pour ${lead.company_name}. Réservez ici: ${bookingUrl}`,
              { requireConsent: true, hasConsent: true, includeOptOut: true }
            );
          }

          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'relance_24h_sent',
            payload: { sent_at: new Date().toISOString() },
          });

          report.relances24hSent++;
        }
      }
    }

    return NextResponse.json({ success: true, timestamp: now.toISOString(), report });
  } catch (err: any) {
    console.error('[cron/lead-reminders] Erreur globale:', err);
    return NextResponse.json({ error: err.message, report }, { status: 500 });
  }
}
);
