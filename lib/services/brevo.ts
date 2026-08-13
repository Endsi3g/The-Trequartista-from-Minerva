// Direct Brevo transactional email API (POST /v3/smtp/email). Composio's
// exposed Brevo toolset only covers template/campaign management
// (BREVO_CREATE_OR_UPDATE_EMAIL_TEMPLATE etc.) -- no single
// send-with-attachment action was found, so this goes straight to Brevo's
// REST API instead of round-tripping through Composio.
export async function sendTransactionalEmail(params: {
  to: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  attachment?: { name: string; contentBase64: string };
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Minerva';

  if (!apiKey || !senderEmail) {
    return { sent: false, error: 'Brevo non configuré (BREVO_API_KEY / BREVO_SENDER_EMAIL manquants)' };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [params.to],
      subject: params.subject,
      htmlContent: params.htmlContent,
      attachment: params.attachment ? [{ name: params.attachment.name, content: params.attachment.contentBase64 }] : undefined,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { sent: false, error: `Brevo a refusé l'envoi (${res.status}): ${errText}` };
  }

  const data = await res.json();
  return { sent: true, messageId: data?.messageId };
}
