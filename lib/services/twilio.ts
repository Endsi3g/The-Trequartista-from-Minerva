export interface SendSmsOptions {
  requireConsent?: boolean;
  hasConsent?: boolean;
  includeOptOut?: boolean;
}

/**
 * Direct Twilio REST API call -- no SDK needed for a single send.
 * Respecte strictement le consentement et inclut les mentions d'opt-out conformes (CASL/TCPA).
 */
export async function sendSms(
  to: string,
  body: string,
  options?: SendSmsOptions
): Promise<{ sent: boolean; error?: string }> {
  // 1. Vérification stricte du consentement
  if (options?.requireConsent && !options?.hasConsent) {
    return {
      sent: false,
      error: 'Consentement SMS absent (consent_sms est faux ou non renseigné). Envoi annulé conformément aux règles CASL/TCPA.',
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      sent: false,
      error: 'Twilio non configuré (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER manquants)',
    };
  }

  // 2. Mention légale d'opt-out si demandée
  let finalBody = body;
  if (options?.includeOptOut !== false && !finalBody.includes('STOP')) {
    finalBody = `${finalBody.trim()}\n\nRépondre STOP pour refuser.`;
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: fromNumber, Body: finalBody }).toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { sent: false, error: `Twilio a refusé l'envoi (${res.status}): ${errText}` };
  }

  return { sent: true };
}
