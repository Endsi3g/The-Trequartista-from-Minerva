import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { fetchAuditWithFindings } from '@/lib/services/supabase-data';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';
import { createSingleUseSchedulingLink } from '@/lib/services/calendly';
import { sendTransactionalEmail } from '@/lib/services/brevo';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ auditId: string }> }) {
  const { auditId } = await params;
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: profile } = await authed.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
  }

  let recipientEmail: string | undefined;
  try {
    const body = await req.json();
    recipientEmail = body?.recipientEmail;
  } catch {
    // no body is fine -- generation-only, sending is optional
  }

  const audit = await fetchAuditWithFindings(auditId);
  if (!audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 });
  }
  if (audit.status !== 'extracted' && audit.status !== 'reviewed') {
    return NextResponse.json({ error: "L'audit doit être extrait avant de générer une proposition." }, { status: 400 });
  }

  const { data: proposalRow, error: createError } = await authed
    .from('proposals')
    .insert([{ audit_id: auditId, status: 'draft', created_by: user.id }])
    .select('id')
    .single();
  if (createError || !proposalRow) {
    return NextResponse.json({ error: 'Impossible de créer la proposition.' }, { status: 500 });
  }

  const { url: calendlyLink, error: calendlyError } = await createSingleUseSchedulingLink();
  if (calendlyError) {
    console.warn('[proposals/generate] Calendly link not generated:', calendlyError);
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(React.createElement(ProposalDocument, { audit, calendlyLink }) as Parameters<typeof renderToBuffer>[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur de génération PDF';
    await authed.from('proposals').update({ status: 'failed', send_error: message }).eq('id', proposalRow.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const storagePath = `proposals/${auditId}/${proposalRow.id}.pdf`;
  const { error: uploadError } = await authed.storage.from('proposals').upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    const message = `Échec du téléversement PDF (le bucket "proposals" existe-t-il dans Supabase Storage ?): ${uploadError.message}`;
    await authed.from('proposals').update({ status: 'failed', send_error: message, calendly_link: calendlyLink }).eq('id', proposalRow.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await authed.from('proposals').update({ status: 'generated', pdf_storage_path: storagePath, calendly_link: calendlyLink }).eq('id', proposalRow.id);
  await authed.from('audits').update({ status: 'proposal_sent' }).eq('id', auditId);

  if (recipientEmail) {
    const { sent, messageId, error: sendError } = await sendTransactionalEmail({
      to: { email: recipientEmail, name: audit.prospect_name },
      subject: `Votre diagnostic Minerva — ${audit.prospect_name}`,
      htmlContent: `<p>Bonjour,</p><p>Merci pour votre temps lors de notre appel de diagnostic. Vous trouverez en pièce jointe notre proposition personnalisée pour ${audit.prospect_name}.</p>${calendlyLink ? `<p>Réservez votre second appel ici : <a href="${calendlyLink}">${calendlyLink}</a></p>` : ''}<p>Au plaisir d'échanger avec vous,<br/>L'équipe Minerva</p>`,
      attachment: { name: `Proposition-Minerva-${audit.prospect_name}.pdf`, contentBase64: pdfBuffer.toString('base64') },
    });

    if (sent) {
      await authed.from('proposals').update({ status: 'sent', sent_at: new Date().toISOString(), brevo_message_id: messageId }).eq('id', proposalRow.id);
    } else {
      await authed.from('proposals').update({ send_error: sendError }).eq('id', proposalRow.id);
      return NextResponse.json({ success: true, proposalId: proposalRow.id, calendlyLink, emailSent: false, emailError: sendError });
    }
  }

  return NextResponse.json({ success: true, proposalId: proposalRow.id, calendlyLink, emailSent: !!recipientEmail });
}
