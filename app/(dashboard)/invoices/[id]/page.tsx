'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Receipt,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogoMark } from '@/components/shell/Logo';
import { useToast } from '@/components/providers/ToastProvider';
import type { Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const json = await res.json();
        setInvoice(json);
      } else {
        toastError('Erreur', 'Impossible de charger la facture demandée.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de chargement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'paid' }),
      });
      if (res.ok) {
        toastSuccess('Payé', 'La facture a été marquée comme payée.');
        await loadInvoice();
      }
    } catch {
      toastError('Erreur', 'Impossible de mettre à jour le statut.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-black/[0.06] rounded animate-pulse" />
        <div className="h-[600px] bg-mv-surface border border-mv-border rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-12 max-w-md mx-auto text-center space-y-4">
        <Receipt className="w-12 h-12 text-mv-ink-faint mx-auto" />
        <h2 className="text-lg font-bold text-mv-ink">Document introuvable</h2>
        <p className="text-xs text-mv-ink-soft">Cette facture ou ce devis n&apos;existe pas ou a été supprimé.</p>
        <Link href="/invoices">
          <Button variant="outline" className="text-xs">
            Retour à la facturation
          </Button>
        </Link>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';
  const isQuote = invoice.type === 'quote';

  return (
    <div className="min-h-screen bg-mv-cream-soft p-4 sm:p-8 print:p-0 print:bg-white">
      {/* ── Top Bar (Hidden on Print) ── */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-mv-ink-soft hover:text-mv-ink transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Retour aux factures</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {!isPaid && !isQuote && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="text-xs text-emerald-700 hover:bg-emerald-50 cursor-pointer gap-1.5"
            >
              <CheckCircle2 size={13} />
              <span>Marquer comme payé</span>
            </Button>
          )}

          {invoice.stripe_payment_link_url && (
            <a
              href={invoice.stripe_payment_link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition-colors"
            >
              <CreditCard size={13} />
              <span>Lien de paiement Stripe</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
          )}

          <Button
            size="sm"
            onClick={handlePrint}
            className="text-xs bg-mv-green hover:bg-mv-green/90 text-white gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer size={13} />
            <span>Imprimer / Exporter PDF</span>
          </Button>
        </div>
      </div>

      {/* ── Printable Invoice Document ── */}
      <div className="max-w-4xl mx-auto bg-white border border-mv-border rounded-2xl shadow-mv-md p-8 md:p-12 space-y-8 print:shadow-none print:border-none print:p-0 print:m-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-zinc-200 pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <LogoMark size={32} />
              </div>
              <div>
                <span className="text-xl font-bold font-display tracking-tight text-zinc-900 block">
                  MINERVA TREQUARTISTA
                </span>
                <span className="text-xs text-zinc-500 font-medium">Agence d&apos;Excellence Opérationnelle & IA</span>
              </div>
            </div>
            <div className="text-xs text-zinc-500 space-y-0.5 leading-relaxed">
              <p>Minerva Flow Inc.</p>
              <p>Montréal, QC, Canada</p>
              <p>contact@minerva.agency • +1 (514) 800-MINERVA</p>
              <p className="text-[11px] text-zinc-400">TPS: 123456789RT0001 • TVQ: 1234567890TQ0001</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <div className="inline-block">
              <Badge
                variant={isPaid ? 'green' : 'neutral'}
                className="text-xs font-bold uppercase tracking-wider px-3 py-1"
              >
                {isPaid ? 'PAYÉ / RÈGLEMENT CONFIRMÉ' : isQuote ? 'DEVIS DE PRESTATION' : 'FACTURE OFFICIELLE'}
              </Badge>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-900">{invoice.invoice_number}</div>
            <div className="text-xs text-zinc-500 space-y-1">
              <div>
                <span className="text-zinc-400">Émise le : </span>
                <span className="font-semibold text-zinc-800">
                  {new Date(invoice.issue_date).toLocaleDateString('fr-CA')}
                </span>
              </div>
              {invoice.due_date && (
                <div>
                  <span className="text-zinc-400">Date d&apos;échéance : </span>
                  <span className="font-semibold text-zinc-800">
                    {new Date(invoice.due_date).toLocaleDateString('fr-CA')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Billing Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 p-5 rounded-xl border border-zinc-100">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Facturé à :</span>
            <div className="text-sm font-bold text-zinc-900">{invoice.client_name}</div>
            {invoice.client_company && <div className="text-xs text-zinc-600">{invoice.client_company}</div>}
            {invoice.client_email && <div className="text-xs text-zinc-500">{invoice.client_email}</div>}
          </div>

          {invoice.project_name && (
            <div className="space-y-1 sm:text-right">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Projet Associé :</span>
              <div className="text-sm font-bold text-zinc-900">{invoice.project_name}</div>
              <div className="text-xs text-zinc-500">Livraison continue Minerva</div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase text-[10.5px]">
                <th className="py-2.5 font-bold">Description des Livrables & Services</th>
                <th className="py-2.5 text-center w-16">Qté</th>
                <th className="py-2.5 text-right w-28">Prix Unit.</th>
                <th className="py-2.5 text-right w-28">Total ({invoice.currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-zinc-50/50">
                    <td className="py-3 font-medium text-zinc-900 pr-4">{item.description}</td>
                    <td className="py-3 text-center text-zinc-600" style={MONO}>
                      {Number(item.quantity)}
                    </td>
                    <td className="py-3 text-right text-zinc-600" style={MONO}>
                      ${Number(item.unit_price_cad).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-900" style={MONO}>
                      ${Number(item.amount_cad).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-zinc-400">
                    Aucune ligne d&apos;article enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-t border-zinc-200 pt-6">
          <div className="space-y-2 max-w-sm text-xs text-zinc-600">
            {invoice.notes && (
              <div>
                <span className="font-bold text-zinc-900 block mb-0.5">Notes :</span>
                <p className="text-zinc-600 whitespace-pre-line leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="pt-2">
                <span className="font-bold text-zinc-900 block mb-0.5">Modalités de règlement :</span>
                <p className="text-zinc-500 text-[11px] leading-relaxed">{invoice.terms}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Sous-total HT :</span>
              <span className="font-semibold text-zinc-900" style={MONO}>
                ${Number(invoice.subtotal_cad).toFixed(2)} {invoice.currency}
              </span>
            </div>

            {invoice.tax_tps_cad > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>TPS Fédérale (5.00%) :</span>
                <span style={MONO}>${Number(invoice.tax_tps_cad).toFixed(2)}</span>
              </div>
            )}

            {invoice.tax_tvq_cad > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>TVQ Québec (9.975%) :</span>
                <span style={MONO}>${Number(invoice.tax_tvq_cad).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-zinc-900 border-t border-zinc-300 pt-2">
              <span>Total TTC :</span>
              <span className="text-emerald-700" style={MONO}>
                ${Number(invoice.total_cad).toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="border-t border-zinc-100 pt-6 text-center text-[11px] text-zinc-400 space-y-1">
          <p>Merci pour votre collaboration avec l&apos;équipe Minerva.</p>
          <p>Pour toute question comptable ou virement bancaire : finance@minerva.agency</p>
        </div>
      </div>
    </div>
  );
}
