import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoiceById, updateInvoiceStatus, deleteInvoice, convertQuoteToInvoice } from '@/lib/services/invoicing';
import type { InvoiceStatus } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const invoice = await fetchInvoiceById(id);

    if (!invoice) {
      return NextResponse.json({ error: 'Facture ou devis introuvable.' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: unknown) {
    console.error('[API /api/invoices/[id] handler] Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (body.action === 'convert_to_invoice') {
      const converted = await convertQuoteToInvoice(id);
      if (!converted) {
        return NextResponse.json(
          { error: 'Impossible de convertir ce devis en facture.' },
          { status: 500 }
        );
      }
      return NextResponse.json(converted);
    }

    if (body.status) {
      const success = await updateInvoiceStatus(id, body.status as InvoiceStatus, body.paid_at);
      if (!success) {
        return NextResponse.json(
          { error: 'Échec de la mise à jour du statut de la facture.' },
          { status: 500 }
        );
      }
      const updated = await fetchInvoiceById(id);
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Aucune action valide fournie.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('[API /api/invoices/[id] PATCH] Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const success = await deleteInvoice(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Échec de la suppression de la facture.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Facture supprimée avec succès.' });
  } catch (error: unknown) {
    console.error('[API /api/invoices/[id] DELETE] Error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur lors de la suppression';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
