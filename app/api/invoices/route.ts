import { NextRequest, NextResponse } from 'next/server';
import { fetchInvoices, createInvoice, computeFinancialSummary } from '@/lib/services/invoicing';
import type { InvoiceType, InvoiceStatus } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;
    const type = (searchParams.get('type') as InvoiceType) || undefined;
    const status = (searchParams.get('status') as InvoiceStatus) || undefined;
    const summaryOnly = searchParams.get('summary') === 'true';

    const invoices = await fetchInvoices({ clientId, type, status });

    if (summaryOnly) {
      const summary = computeFinancialSummary(invoices);
      return NextResponse.json(summary);
    }

    const summary = computeFinancialSummary(invoices);
    return NextResponse.json({
      invoices,
      summary,
    });
  } catch (error: any) {
    console.error('[API /api/invoices GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.client_id) {
      return NextResponse.json({ error: 'Le champ client_id est obligatoire.' }, { status: 400 });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Une facture doit contenir au moins une ligne d’article.' },
        { status: 400 }
      );
    }

    const created = await createInvoice({
      type: body.type || 'invoice',
      client_id: body.client_id,
      project_id: body.project_id || null,
      status: body.status || 'draft',
      currency: body.currency || 'CAD',
      issue_date: body.issue_date,
      due_date: body.due_date,
      stripe_payment_link_url: body.stripe_payment_link_url,
      notes: body.notes,
      terms: body.terms,
      apply_taxes: body.apply_taxes ?? true,
      items: body.items,
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Échec de la création de la facture dans la base de données.' },
        { status: 500 }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[API /api/invoices POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la création de la facture' },
      { status: 500 }
    );
  }
}
