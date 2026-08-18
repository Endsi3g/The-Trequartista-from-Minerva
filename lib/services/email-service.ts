import type { ProjectMilestone, Client } from '@/lib/types';

export interface EmailPayload {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  clientName?: string;
  milestoneTitle?: string;
  deliverableUrl?: string;
  restaurantName?: string;
  signatureDish?: string;
  monthlyLossEstimated?: string;
  demoUrl?: string;
}

/**
 * Generates a direct Web Gmail compose URL that pre-fills 'to', 'subject', and 'body'.
 */
export function generateGmailComposeUrl(params: {
  to: string;
  subject: string;
  body: string;
}): string {
  const encodedTo = encodeURIComponent(params.to || '');
  const encodedSubject = encodeURIComponent(params.subject || '');
  const encodedBody = encodeURIComponent(params.body || '');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Generates the HTML template for Milestone Completion email.
 */
export function generateMilestoneEmailHtml(data: {
  clientName: string;
  milestoneTitle: string;
  milestoneDescription?: string;
  deliverableUrl?: string;
  portalUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `[Minerva Agency] Jalon complété : ${data.milestoneTitle}`;
  const portalLink = data.portalUrl || 'https://minerva-trequista.vercel.app/portal/tasks';
  const deliverableButton = data.deliverableUrl
    ? `<div style="margin: 24px 0 16px 0;">
        <a href="${data.deliverableUrl}" style="background-color: #059669; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
          ↗ Inspecter le livrable
        </a>
       </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; background-color: #fafafa; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; }
          .header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 12px; }
          h1 { font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 16px 0; }
          p { font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px 0; }
          .badge { display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; margin-bottom: 16px; }
          .footer { font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Minerva Core Agency</div>
          <div class="badge">✓ Étape validée par l'équipe</div>
          <h1>${data.milestoneTitle}</h1>
          <p>Bonjour <strong>${data.clientName}</strong>,</p>
          <p>Nous avons le plaisir de vous informer que le jalon <strong>« ${data.milestoneTitle} »</strong> a été finalisé avec succès par nos spécialistes.</p>
          ${data.milestoneDescription ? `<p style="background: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 13px; color: #52525b;">${data.milestoneDescription}</p>` : ''}
          ${deliverableButton}
          <p>Vous pouvez suivre l'avancement global de votre projet et valider les prochains livrables directement sur votre espace client :</p>
          <p><a href="${portalLink}" style="color: #059669; font-weight: 600; text-decoration: underline;">Accéder à votre Portail Client →</a></p>
          <div class="footer">
            Minerva — Performance digitale, acquisition et automatisations.<br>
            Des questions ? Répondez directement à cet email.
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Bonjour ${data.clientName},\n\nLe jalon « ${data.milestoneTitle} » a été complété avec succès par l'équipe Minerva.\n\n${data.milestoneDescription ? `${data.milestoneDescription}\n\n` : ''}${data.deliverableUrl ? `Lien du livrable : ${data.deliverableUrl}\n\n` : ''}Accéder à votre espace client : ${portalLink}\n\nL'équipe Minerva`;

  return { subject, html, text };
}

/**
 * Generates the Restaurant Margin Leak Pitch email template.
 */
export function generateRestaurantPitchEmail(data: {
  restaurantName: string;
  signatureDish: string;
  monthlyLossEstimated: string;
  demoUrl?: string;
  videoUrl?: string;
}): { subject: string; html: string; text: string } {
  const subject = `Question rapide sur vos commandes en ligne — ${data.restaurantName}`;
  const demoLink = data.demoUrl || 'https://minerva-trequista.vercel.app/minerva-flow';
  const videoLink = data.videoUrl || 'https://minerva-trequista.vercel.app/minerva-flow';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; background-color: #fafafa; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; padding: 32px; }
          .header { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #059669; margin-bottom: 12px; }
          h1 { font-size: 18px; font-weight: 700; color: #09090b; margin: 0 0 16px 0; }
          p { font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 16px 0; }
          .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 16px 0; }
          .footer { font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Audit de Fuite de Marge — Restauration</div>
          <h1>Estimation pour ${data.restaurantName}</h1>
          <p>Bonjour,</p>
          <p>En analysant vos prix sur place vs sur Uber Eats / DoorDash pour <strong>${data.restaurantName}</strong>, nous avons constaté une fuite de marge conséquente sur votre plat signature <strong>« ${data.signatureDish} »</strong>.</p>
          
          <div class="highlight-box">
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">
              📉 Perte estimée : environ <strong>${data.monthlyLossEstimated}</strong> en commissions tierces chaque mois.
            </p>
          </div>

          <p>Pour vous faire gagner du temps, nous avons déjà pré-configuré vos meilleurs plats sur une page de commande directe à <strong>0 % de commission</strong> :</p>
          
          <div style="margin: 20px 0;">
            <a href="${demoLink}" style="background-color: #059669; color: #ffffff; padding: 11px 22px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-block;">
              ↗ Tester votre menu pré-configuré (0% commission)
            </a>
          </div>

          <p style="font-size: 13px; color: #52525b;">
            💡 <em>Protocole sans risque : On branche une commande test en 5 minutes sur votre imprimante de cuisine actuelle. Si ça prend plus de 5 minutes ou perturbe votre service, on ne lance rien.</em>
          </p>

          <p>Seriez-vous ouvert à ce qu'on vous montre la simulation en 2 minutes cette semaine ?</p>

          <div class="footer">
            Minerva Growth Agency<br>
            Optimisation des marges & Commande directe pour restaurateurs.
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Bonjour,\n\nEn analysant vos prix pour ${data.restaurantName}, nous avons constaté une fuite de marge sur votre plat signature « ${data.signatureDish} ».\n\nPerte estimée en commissions tierces : environ ${data.monthlyLossEstimated}/mois.\n\nPour vous faire gagner du temps, nous avons déjà pré-configuré vos plats sur une page de commande directe à 0% de commission :\n${demoLink}\n\nProtocole sans risque opérationnel : on branche une commande test en 5 minutes sur votre imprimante actuelle.\n\nSeriez-vous ouvert à ce qu'on vous montre la simulation cette semaine ?\n\nMinerva Agency`;

  return { subject, html, text };
}

/**
 * Sends email via the Next.js Resend API endpoint.
 */
export async function sendEmailViaResend(payload: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('[EmailService] Error calling Resend API:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}
