import { createClient } from '@/lib/supabase/client';
import type { Invoice, InvoiceItem, InvoiceType, InvoiceStatus, InvoiceCurrency, FinancialSummary } from '@/lib/types';

function getSupabase() {
  return createClient();
}

/**
 * Tax rates for Quebec / Canada
 * TPS: 5.0%
 * TVQ: 9.975%
 */
export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;

export function calculateInvoiceTotals(
  items: Array<{ quantity: number; unit_price_cad: number }>,
  applyTaxes = true
) {
  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price_cad) || 0;
    return acc + qty * price;
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const tps = applyTaxes ? Math.round(roundedSubtotal * TPS_RATE * 100) / 100 : 0;
  const tvq = applyTaxes ? Math.round(roundedSubtotal * TVQ_RATE * 100) / 100 : 0;
  const total = Math.round((roundedSubtotal + tps + tvq) * 100) / 100;

  return {
    subtotal_cad: roundedSubtotal,
    tax_tps_cad: tps,
    tax_tvq_cad: tvq,
    total_cad: total,
  };
}

export async function generateNextInvoiceNumber(type: InvoiceType = 'invoice'): Promise<string> {
  const prefix = type === 'quote' ? 'DEV' : type === 'retainer' ? 'RET' : 'INV';
  const year = new Date().getFullYear();

  try {
    const supabase = getSupabase();
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('type', type);

    const nextSeq = ((count || 0) + 1).toString().padStart(3, '0');
    return `${prefix}-${year}-${nextSeq}`;
  } catch {
    const random = Math.floor(Math.random() * 900 + 100);
    return `${prefix}-${year}-${random}`;
  }
}

export async function fetchInvoices(options?: {
  clientId?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
}): Promise<Invoice[]> {
  try {
    const supabase = getSupabase();
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, company, email, avatar_url, logo_url),
        project:projects(id, name),
        items:invoice_items(*)
      `)
      .order('issue_date', { ascending: false });

    if (options?.clientId) query = query.eq('client_id', options.clientId);
    if (options?.type) query = query.eq('type', options.type);
    if (options?.status) query = query.eq('status', options.status);

    const { data, error } = await query;

    if (error || !data) {
      console.warn('[Invoicing] Supabase query failed or empty, returning fallback data:', error);
      return getFallbackInvoices();
    }

    return data.map((row: any) => ({
      ...row,
      client_name: row.client?.name || row.client?.company || 'Client',
      client_email: row.client?.email,
      client_company: row.client?.company,
      client_avatar_url: row.client?.avatar_url || row.client?.logo_url,
      project_name: row.project?.name,
      items: (row.items || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
    })) as Invoice[];
  } catch (err) {
    console.warn('[Invoicing] Error loading invoices, using fallback:', err);
    return getFallbackInvoices();
  }
}

export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, company, email, phone, avatar_url, logo_url),
        project:projects(id, name),
        items:invoice_items(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      const fallback = getFallbackInvoices().find((inv) => inv.id === id);
      return fallback || null;
    }

    return {
      ...data,
      client_name: data.client?.name || data.client?.company || 'Client',
      client_email: data.client?.email,
      client_company: data.client?.company,
      client_avatar_url: data.client?.avatar_url || data.client?.logo_url,
      project_name: data.project?.name,
      items: (data.items || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
    } as Invoice;
  } catch (err) {
    console.error('[Invoicing] Error in fetchInvoiceById:', err);
    return null;
  }
}

export async function createInvoice(payload: {
  invoice_number?: string;
  type: InvoiceType;
  client_id: string;
  project_id?: string | null;
  status?: InvoiceStatus;
  currency?: InvoiceCurrency;
  issue_date?: string;
  due_date?: string | null;
  stripe_payment_link_url?: string | null;
  notes?: string | null;
  terms?: string | null;
  apply_taxes?: boolean;
  items: Array<{
    description: string;
    quantity: number;
    unit_price_cad: number;
  }>;
}): Promise<Invoice | null> {
  try {
    const supabase = getSupabase();
    const invoiceNumber = payload.invoice_number || (await generateNextInvoiceNumber(payload.type));
    const totals = calculateInvoiceTotals(payload.items, payload.apply_taxes ?? true);

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .insert([
        {
          invoice_number: invoiceNumber,
          type: payload.type,
          client_id: payload.client_id,
          project_id: payload.project_id || null,
          status: payload.status || 'draft',
          currency: payload.currency || 'CAD',
          issue_date: payload.issue_date || new Date().toISOString().split('T')[0],
          due_date: payload.due_date || null,
          subtotal_cad: totals.subtotal_cad,
          tax_tps_cad: totals.tax_tps_cad,
          tax_tvq_cad: totals.tax_tvq_cad,
          total_cad: totals.total_cad,
          stripe_payment_link_url: payload.stripe_payment_link_url || null,
          notes: payload.notes || null,
          terms: payload.terms || 'Paiement net 30 jours à réception. Virement Interac ou carte de crédit.',
        },
      ])
      .select()
      .single();

    if (invoiceError || !invoiceData) {
      console.error('[Invoicing] Error creating invoice:', invoiceError);
      return null;
    }

    if (payload.items.length > 0) {
      const itemsToInsert = payload.items.map((it, idx) => ({
        invoice_id: invoiceData.id,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price_cad: Number(it.unit_price_cad) || 0,
        amount_cad: Math.round((Number(it.quantity) || 1) * (Number(it.unit_price_cad) || 0) * 100) / 100,
        sort_order: idx,
      }));

      await supabase.from('invoice_items').insert(itemsToInsert);
    }

    return await fetchInvoiceById(invoiceData.id);
  } catch (err) {
    console.error('[Invoicing] createInvoice threw exception:', err);
    return null;
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  paidAt?: string | null
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'paid') {
      updatePayload.paid_at = paidAt || new Date().toISOString();
    } else if (status === 'draft' || status === 'sent') {
      updatePayload.paid_at = null;
    }

    const { error } = await supabase.from('invoices').update(updatePayload).eq('id', id);
    return !error;
  } catch (err) {
    console.error('[Invoicing] updateInvoiceStatus failed:', err);
    return false;
  }
}

export async function convertQuoteToInvoice(quoteId: string): Promise<Invoice | null> {
  try {
    const quote = await fetchInvoiceById(quoteId);
    if (!quote) return null;

    const newInvoiceNumber = await generateNextInvoiceNumber('invoice');
    const created = await createInvoice({
      invoice_number: newInvoiceNumber,
      type: 'invoice',
      client_id: quote.client_id,
      project_id: quote.project_id,
      status: 'draft',
      currency: quote.currency,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: quote.notes ? `Converti depuis le devis ${quote.invoice_number}.\n${quote.notes}` : `Converti depuis le devis ${quote.invoice_number}.`,
      terms: quote.terms,
      apply_taxes: quote.tax_tps_cad > 0,
      items: (quote.items || []).map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unit_price_cad: it.unit_price_cad,
      })),
    });

    if (created) {
      await updateInvoiceStatus(quoteId, 'paid'); // mark quote as accepted/processed
    }

    return created;
  } catch (err) {
    console.error('[Invoicing] convertQuoteToInvoice failed:', err);
    return null;
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('[Invoicing] deleteInvoice failed:', err);
    return false;
  }
}

export function computeFinancialSummary(invoices: Invoice[]): FinancialSummary {
  let totalInvoicedCad = 0;
  let totalCollectedCad = 0;
  let totalPendingCad = 0;
  let totalOverdueCad = 0;
  let mrrCad = 0;
  let totalQuotesCad = 0;

  let invoicesCount = 0;
  let quotesCount = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;
  let overdueInvoicesCount = 0;

  const now = new Date();

  invoices.forEach((inv) => {
    const total = Number(inv.total_cad) || 0;

    if (inv.type === 'quote') {
      quotesCount++;
      totalQuotesCad += total;
      return;
    }

    if (inv.type === 'retainer') {
      mrrCad += Number(inv.subtotal_cad) || 0;
    }

    invoicesCount++;
    totalInvoicedCad += total;

    if (inv.status === 'paid') {
      paidInvoicesCount++;
      totalCollectedCad += total;
    } else if (inv.status === 'overdue' || (inv.due_date && new Date(inv.due_date) < now && inv.status !== 'cancelled')) {
      overdueInvoicesCount++;
      totalOverdueCad += total;
    } else if (inv.status === 'sent' || inv.status === 'draft') {
      pendingInvoicesCount++;
      totalPendingCad += total;
    }
  });

  return {
    totalInvoicedCad: Math.round(totalInvoicedCad * 100) / 100,
    totalCollectedCad: Math.round(totalCollectedCad * 100) / 100,
    totalPendingCad: Math.round(totalPendingCad * 100) / 100,
    totalOverdueCad: Math.round(totalOverdueCad * 100) / 100,
    mrrCad: Math.round(mrrCad * 100) / 100,
    totalQuotesCad: Math.round(totalQuotesCad * 100) / 100,
    invoicesCount,
    quotesCount,
    paidInvoicesCount,
    pendingInvoicesCount,
    overdueInvoicesCount,
  };
}

/**
 * Fallback seed data used if database tables are in the process of provisioning
 */
function getFallbackInvoices(): Invoice[] {
  return [
    {
      id: 'inv-demo-1',
      invoice_number: 'INV-2026-001',
      type: 'invoice',
      client_id: 'client-1',
      client_name: 'Studio Nova Inc.',
      client_company: 'Studio Nova Inc.',
      client_email: 'finance@studionova.ca',
      status: 'paid',
      currency: 'CAD',
      issue_date: '2026-08-01',
      due_date: '2026-08-31',
      paid_at: '2026-08-15T14:30:00Z',
      subtotal_cad: 4500.0,
      tax_tps_cad: 225.0,
      tax_tvq_cad: 448.88,
      total_cad: 5173.88,
      stripe_payment_link_url: 'https://buy.stripe.com/demo1',
      notes: 'Développement de la plateforme et intégration CRM.',
      terms: 'Paiement net 30 jours. Merci pour votre confiance !',
      created_at: '2026-08-01T10:00:00Z',
      updated_at: '2026-08-15T14:30:00Z',
      items: [
        {
          id: 'item-1',
          invoice_id: 'inv-demo-1',
          description: 'Déploiement Système Minerva Trequartista & Setup Supabase',
          quantity: 1,
          unit_price_cad: 3500.0,
          amount_cad: 3500.0,
          sort_order: 0,
        },
        {
          id: 'item-2',
          invoice_id: 'inv-demo-1',
          description: 'Configuration Agent Vocal IA & Webhooks',
          quantity: 1,
          unit_price_cad: 1000.0,
          amount_cad: 1000.0,
          sort_order: 1,
        },
      ],
    },
    {
      id: 'inv-demo-2',
      invoice_number: 'INV-2026-002',
      type: 'invoice',
      client_id: 'client-2',
      client_name: 'Apex Horizon Marketing',
      client_company: 'Apex Horizon Marketing',
      client_email: 'direction@apexhorizon.com',
      status: 'sent',
      currency: 'CAD',
      issue_date: '2026-08-15',
      due_date: '2026-09-15',
      subtotal_cad: 2800.0,
      tax_tps_cad: 140.0,
      tax_tvq_cad: 279.3,
      total_cad: 3219.3,
      stripe_payment_link_url: 'https://buy.stripe.com/demo2',
      notes: 'Production mensuelle pack Réels & Stratégie Publicitaire.',
      terms: 'Paiement par virement ou carte de crédit.',
      created_at: '2026-08-15T09:00:00Z',
      updated_at: '2026-08-15T09:00:00Z',
      items: [
        {
          id: 'item-3',
          invoice_id: 'inv-demo-2',
          description: 'Pack Production 12 Réels / Shorts 4K',
          quantity: 1,
          unit_price_cad: 1800.0,
          amount_cad: 1800.0,
          sort_order: 0,
        },
        {
          id: 'item-4',
          invoice_id: 'inv-demo-2',
          description: 'Optimisation Campagnes Meta Ads & CPL Tracking',
          quantity: 1,
          unit_price_cad: 1000.0,
          amount_cad: 1000.0,
          sort_order: 1,
        },
      ],
    },
    {
      id: 'inv-demo-3',
      invoice_number: 'DEV-2026-001',
      type: 'quote',
      client_id: 'client-3',
      client_name: 'Nexus BioHealth',
      client_company: 'Nexus BioHealth',
      client_email: 'contact@nexusbiohealth.io',
      status: 'sent',
      currency: 'CAD',
      issue_date: '2026-08-20',
      due_date: '2026-09-20',
      subtotal_cad: 6000.0,
      tax_tps_cad: 300.0,
      tax_tvq_cad: 598.5,
      total_cad: 6898.5,
      notes: 'Devis pour refonte UX/UI et intégration Extranet.',
      terms: 'Proposition valable 30 jours.',
      created_at: '2026-08-20T11:00:00Z',
      updated_at: '2026-08-20T11:00:00Z',
      items: [
        {
          id: 'item-5',
          invoice_id: 'inv-demo-3',
          description: 'Conception UI/UX Design System Figma & Prototype',
          quantity: 1,
          unit_price_cad: 3500.0,
          amount_cad: 3500.0,
          sort_order: 0,
        },
        {
          id: 'item-6',
          invoice_id: 'inv-demo-3',
          description: 'Développement Next.js 16 & Portail Client sécurisé',
          quantity: 1,
          unit_price_cad: 2500.0,
          amount_cad: 2500.0,
          sort_order: 1,
        },
      ],
    },
  ];
}
