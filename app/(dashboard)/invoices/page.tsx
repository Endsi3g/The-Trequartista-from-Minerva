'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Printer,
  Copy,
  ChevronRight,
  Building2,
  Calendar,
  Layers,
  X,
  CreditCard,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import { SkeletonRows } from '@/components/ui/skeleton';
import type { Invoice, InvoiceType, InvoiceStatus, InvoiceCurrency, FinancialSummary, Client } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TPS_RATE, TVQ_RATE, calculateInvoiceTotals } from '@/lib/services/invoicing';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function InvoicesHubPage() {
  const { toastSuccess, toastError, toastInfo } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'cashflow'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState<InvoiceType>('invoice');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoiceCurrency, setInvoiceCurrency] = useState<InvoiceCurrency>('CAD');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [stripeLink, setStripeLink] = useState('');
  const [applyTaxes, setApplyTaxes] = useState(true);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ description: string; quantity: number; unit_price_cad: number }>>([
    { description: 'Prestation de services digitaux & optimisation', quantity: 1, unit_price_cad: 2500 },
  ]);

  const loadData = async () => {
    try {
      const [invRes, clientsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients').catch(() => null),
      ]);

      if (invRes.ok) {
        const invJson = await invRes.json();
        setInvoices(invJson.invoices || []);
        setSummary(invJson.summary || null);
      }

      if (clientsRes && clientsRes.ok) {
        const cJson = await clientsRes.json();
        setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
      }
    } catch {
      toastError('Erreur de chargement', 'Impossible de charger les données financières.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: InvoiceStatus) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toastSuccess('Statut mis à jour', `La facture est désormais notée comme "${status}".`);
        await loadData();
      } else {
        toastError('Erreur', 'Impossible de mettre à jour le statut.');
      }
    } catch {
      toastError('Erreur réseau', 'La mise à jour a échoué.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToInvoice = async (quoteId: string) => {
    setActionLoading(quoteId);
    try {
      const res = await fetch(`/api/invoices/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_to_invoice' }),
      });
      if (res.ok) {
        toastSuccess('Devis converti', 'Une nouvelle facture a été générée avec succès.');
        setActiveTab('invoices');
        await loadData();
      } else {
        toastError('Erreur', 'Impossible de convertir ce devis.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de la conversion du devis.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture/devis ?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toastSuccess('Supprimé', 'Le document a été supprimé.');
        await loadData();
      } else {
        toastError('Erreur', 'Impossible de supprimer ce document.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de la suppression.');
    } finally {
      setActionLoading(null);
    }
  };

  // Line item manipulation
  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price_cad: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: 'description' | 'quantity' | 'unit_price_cad', value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const modalCalculatedTotals = useMemo(() => {
    return calculateInvoiceTotals(lineItems, applyTaxes);
  }, [lineItems, applyTaxes]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toastError('Champ requis', 'Veuillez sélectionner un client.');
      return;
    }
    if (lineItems.some((item) => !item.description.trim())) {
      toastError('Champ requis', 'Toutes les lignes doivent comporter une description.');
      return;
    }

    setActionLoading('creating');
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: modalType,
          client_id: selectedClientId,
          currency: invoiceCurrency,
          issue_date: issueDate,
          due_date: dueDate,
          stripe_payment_link_url: stripeLink || null,
          apply_taxes: applyTaxes,
          notes: notes || null,
          items: lineItems,
        }),
      });

      if (res.ok) {
        toastSuccess(
          modalType === 'quote' ? 'Devis créé' : 'Facture créée',
          'Le document a été enregistré avec succès.'
        );
        setShowCreateModal(false);
        // Reset form
        setLineItems([{ description: 'Prestation de services digitaux & optimisation', quantity: 1, unit_price_cad: 2500 }]);
        setNotes('');
        setStripeLink('');
        await loadData();
      } else {
        const json = await res.json();
        toastError('Erreur', json.error || 'Impossible de créer la facture.');
      }
    } catch {
      toastError('Erreur réseau', 'Échec de la communication avec le serveur.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const isQuote = inv.type === 'quote';
      if (activeTab === 'invoices' && isQuote) return false;
      if (activeTab === 'quotes' && !isQuote) return false;

      const matchSearch =
        !searchQuery ||
        inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.client_name && inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, activeTab, searchQuery, statusFilter]);

  if (loading) {
    return (
      <PageFadeIn className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-black/[0.06] rounded animate-pulse" />
          <div className="h-4 w-96 bg-black/[0.04] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
          <div className="h-28 bg-mv-surface border border-mv-border rounded-xl animate-pulse" />
        </div>
        <SkeletonRows count={6} />
      </PageFadeIn>
    );
  }

  return (
    <PageFadeIn className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-mv-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mv-green text-white flex items-center justify-center shadow-mv-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-display tracking-tight text-mv-ink">Facturation & Finance</h1>
                <Badge variant="green" className="font-semibold">
                  Taxes QC (TPS + TVQ)
                </Badge>
              </div>
              <p className="text-xs text-mv-ink-soft">
                Gestion des factures clients, devis signables, encaissements Stripe et prévisions de trésorerie.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => {
              setModalType('quote');
              setShowCreateModal(true);
            }}
            variant="outline"
            className="gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <FileText size={14} />
            <span>Nouveau Devis</span>
          </Button>

          <Button
            onClick={() => {
              setModalType('invoice');
              setShowCreateModal(true);
            }}
            className="gap-1.5 bg-mv-green hover:bg-mv-green/90 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Nouvelle Facture</span>
          </Button>
        </div>
      </div>

      {/* ── Key Financial Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>CA Total Facturé</span>
            <DollarSign size={16} className="text-mv-green" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            $<AnimatedNumber value={summary?.totalInvoicedCad || 0} />
            <span className="text-xs font-normal text-mv-ink-faint ml-1">CAD</span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">{summary?.invoicesCount || 0} factures émises</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Encaissements Réalisés</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700" style={MONO}>
            $<AnimatedNumber value={summary?.totalCollectedCad || 0} />
            <span className="text-xs font-normal text-emerald-600/70 ml-1">CAD</span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">{summary?.paidInvoicesCount || 0} factures réglées</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>En Attente / En Cours</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700" style={MONO}>
            $<AnimatedNumber value={summary?.totalPendingCad || 0} />
            <span className="text-xs font-normal text-blue-600/70 ml-1">CAD</span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">{summary?.pendingInvoicesCount || 0} factures en attente</p>
        </Card>

        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Retainers & MRR</span>
            <TrendingUp size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700" style={MONO}>
            $<AnimatedNumber value={summary?.mrrCad || 0} />
            <span className="text-xs font-normal text-purple-600/70 ml-1">/ mois</span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">Revenus récurrents prévisibles</p>
        </Card>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mv-border pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'invoices'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
              )}
            >
              Factures & Règlements ({invoices.filter((i) => i.type !== 'quote').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quotes')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'quotes'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
              )}
            >
              Devis & Propositions ({invoices.filter((i) => i.type === 'quote').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cashflow')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'cashflow'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.05] hover:text-mv-ink'
              )}
            >
              Prévisions de Cashflow
            </button>
          </div>

          {activeTab !== 'cashflow' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mv-ink-faint" />
                <input
                  type="text"
                  placeholder="Rechercher numéro ou client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft focus:outline-none cursor-pointer"
              >
                <option value="all">Tous les statuts</option>
                <option value="paid">Payé</option>
                <option value="sent">Envoyé</option>
                <option value="draft">Brouillon</option>
                <option value="overdue">En retard</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Factures & Devis List Table ── */}
        {(activeTab === 'invoices' || activeTab === 'quotes') && (
          <div className="space-y-3">
            {filteredInvoices.length === 0 ? (
              <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-2">
                <Receipt className="w-8 h-8 text-mv-ink-faint mx-auto" />
                <h3 className="text-sm font-bold text-mv-ink">
                  {activeTab === 'invoices' ? 'Aucune facture trouvée' : 'Aucun devis trouvé'}
                </h3>
                <p className="text-xs text-mv-ink-soft max-w-sm mx-auto">
                  {activeTab === 'invoices'
                    ? 'Créez votre première facture ou convertissez un devis accepté.'
                    : 'Créez un devis détaillé avec calcul de taxes québécoises en quelques clics.'}
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setModalType(activeTab === 'invoices' ? 'invoice' : 'quote');
                      setShowCreateModal(true);
                    }}
                    className="gap-1.5 text-xs bg-mv-green text-white"
                  >
                    <Plus size={13} />
                    <span>Créer maintenant</span>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="border border-mv-border rounded-xl bg-mv-surface overflow-hidden divide-y divide-mv-border shadow-xs">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'paid';
                  const isSent = inv.status === 'sent';
                  const isOverdue = inv.status === 'overdue';

                  return (
                    <div
                      key={inv.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.015] transition-colors"
                    >
                      <div className="flex items-start md:items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs',
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isSent
                              ? 'bg-blue-100 text-blue-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-800'
                              : 'bg-zinc-100 text-zinc-700'
                          )}
                        >
                          {inv.type === 'quote' ? 'DEV' : 'INV'}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-mv-ink font-mono">{inv.invoice_number}</span>
                            <span className="text-xs text-mv-ink-faint">•</span>
                            <span className="text-xs font-semibold text-mv-ink truncate">{inv.client_name}</span>
                            {inv.project_name && (
                              <Badge variant="neutral" className="text-[10px] hidden sm:inline-flex">
                                {inv.project_name}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-mv-ink-faint">
                            <span>Émis le : {new Date(inv.issue_date).toLocaleDateString('fr-CA')}</span>
                            {inv.due_date && (
                              <span>Échéance : {new Date(inv.due_date).toLocaleDateString('fr-CA')}</span>
                            )}
                            {inv.items && inv.items.length > 0 && (
                              <span>
                                {inv.items.length} article{inv.items.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-mv-ink" style={MONO}>
                            ${Number(inv.total_cad).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} {inv.currency}
                          </div>
                          <div className="text-[10.5px] text-mv-ink-faint">
                            Sous-total : ${Number(inv.subtotal_cad).toFixed(2)} + taxes
                          </div>
                        </div>

                        <Badge
                          variant={isPaid ? 'green' : isSent ? 'blue' : isOverdue ? 'red' : 'neutral'}
                          className="text-[10.5px] uppercase font-semibold tracking-wide"
                        >
                          {inv.status === 'paid'
                            ? 'Payé'
                            : inv.status === 'sent'
                            ? 'Envoyé'
                            : inv.status === 'overdue'
                            ? 'En retard'
                            : inv.status === 'draft'
                            ? 'Brouillon'
                            : inv.status}
                        </Badge>

                        <div className="flex items-center gap-1">
                          {inv.type === 'quote' && inv.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToInvoice(inv.id)}
                              disabled={actionLoading === inv.id}
                              title="Convertir ce devis en facture"
                              className="h-7 px-2 text-[11px] gap-1 cursor-pointer"
                            >
                              <Sparkles size={12} className="text-purple-600" />
                              <span className="hidden sm:inline">Facturer</span>
                            </Button>
                          )}

                          {inv.type !== 'quote' && !isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(inv.id, 'paid')}
                              disabled={actionLoading === inv.id}
                              title="Marquer comme payé"
                              className="h-7 px-2 text-[11px] gap-1 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                            >
                              <CheckCircle2 size={12} />
                              <span className="hidden sm:inline">Payé</span>
                            </Button>
                          )}

                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-1.5 text-mv-ink-soft hover:text-mv-ink rounded-md hover:bg-black/[0.05] transition-colors"
                            title="Aperçu & Impression PDF"
                          >
                            <Printer size={15} />
                          </Link>

                          {inv.stripe_payment_link_url && (
                            <a
                              href={inv.stripe_payment_link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-mv-ink-soft hover:text-blue-600 rounded-md hover:bg-black/[0.05] transition-colors"
                              title="Ouvrir le lien Stripe"
                            >
                              <CreditCard size={15} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            disabled={actionLoading === inv.id}
                            className="p-1.5 text-mv-ink-faint hover:text-red-600 rounded-md hover:bg-black/[0.05] transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Prévisions de Cashflow Tab ── */}
        {activeTab === 'cashflow' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-2">
                <div className="text-xs text-mv-ink-faint font-semibold uppercase tracking-wider">
                  Trésorerie Actuelle (Encaissé)
                </div>
                <div className="text-2xl font-bold text-mv-ink" style={MONO}>
                  ${summary?.totalCollectedCad?.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) || '0.00'} CAD
                </div>
                <p className="text-xs text-mv-ink-soft">Liquidités déjà reçues ce cycle</p>
              </Card>

              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-2">
                <div className="text-xs text-mv-ink-faint font-semibold uppercase tracking-wider">
                  Encaissements Prévus (30 jours)
                </div>
                <div className="text-2xl font-bold text-blue-700" style={MONO}>
                  +${summary?.totalPendingCad?.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) || '0.00'} CAD
                </div>
                <p className="text-xs text-mv-ink-soft">Factures émises en attente d&apos;échéance</p>
              </Card>

              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-2">
                <div className="text-xs text-mv-ink-faint font-semibold uppercase tracking-wider">
                  Pipeline Devis en Négociation
                </div>
                <div className="text-2xl font-bold text-purple-700" style={MONO}>
                  ${summary?.totalQuotesCad?.toLocaleString('fr-CA', { minimumFractionDigits: 2 }) || '0.00'} CAD
                </div>
                <p className="text-xs text-mv-ink-soft">Devis envoyés prêts à être signés</p>
              </Card>
            </div>

            <Card className="p-6 bg-mv-surface border-mv-border rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-mv-ink">Simulation des Entrées Financières</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-mv-ink border-b border-mv-border pb-2">
                  <span>Client & Facture</span>
                  <span>Échéance Prévue</span>
                  <span>Montant TTC</span>
                </div>
                {invoices
                  .filter((i) => i.status === 'sent' || i.status === 'overdue')
                  .map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-xs py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-mv-ink-soft">{inv.invoice_number}</span>
                        <span className="font-semibold text-mv-ink">{inv.client_name}</span>
                      </div>
                      <span className="text-mv-ink-faint">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : 'À réception'}
                      </span>
                      <span className="font-bold text-mv-ink" style={MONO}>
                        ${Number(inv.total_cad).toLocaleString('fr-CA', { minimumFractionDigits: 2 })} CAD
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ── Create / Edit Invoice Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-mv-surface border border-mv-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-mv-border bg-mv-cream-soft">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-mv-green text-white flex items-center justify-center font-bold text-xs">
                  {modalType === 'quote' ? 'DEV' : 'INV'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-mv-ink">
                    {modalType === 'quote' ? 'Créer un Devis Professionnel' : 'Créer une Facture Client'}
                  </h2>
                  <p className="text-xs text-mv-ink-soft">
                    Calcul automatique de la TPS (5%) et TVQ (9.975%) selon les normes québécoises.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-mv-ink-faint hover:text-mv-ink rounded-lg hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Type, Client, Devise */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Type de document</label>
                  <select
                    value={modalType}
                    onChange={(e) => setModalType(e.target.value as InvoiceType)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  >
                    <option value="invoice">Facture ponctuelle</option>
                    <option value="quote">Devis / Proposition</option>
                    <option value="retainer">Facture Retainer (MRR)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Client destinataire *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  >
                    <option value="">Sélectionner un client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Devise</label>
                  <select
                    value={invoiceCurrency}
                    onChange={(e) => setInvoiceCurrency(e.target.value as InvoiceCurrency)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  >
                    <option value="CAD">CAD ($ Dollar Canadien)</option>
                    <option value="USD">USD ($ Dollar US)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </select>
                </div>
              </div>

              {/* Dates & Stripe Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Date d&apos;émission</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Date d&apos;échéance</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-mv-ink">Lien Stripe Payment (optionnel)</label>
                  <input
                    type="url"
                    placeholder="https://buy.stripe.com/..."
                    value={stripeLink}
                    onChange={(e) => setStripeLink(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-mv-ink">
                    Lignes d&apos;articles & Prestations
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                    className="h-7 text-xs gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Ajouter une ligne</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-black/[0.02] border border-mv-border rounded-xl flex flex-col sm:flex-row items-center gap-3"
                    >
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          placeholder="Description du livrable ou service..."
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                        />
                      </div>

                      <div className="w-full sm:w-24">
                        <input
                          type="number"
                          placeholder="Qté"
                          min="0.1"
                          step="0.1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                          className="w-full px-3 py-1.5 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green text-center"
                        />
                      </div>

                      <div className="w-full sm:w-36">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-mv-ink-faint">$</span>
                          <input
                            type="number"
                            placeholder="Prix Unit."
                            min="0"
                            step="0.01"
                            value={item.unit_price_cad}
                            onChange={(e) => updateLineItem(idx, 'unit_price_cad', parseFloat(e.target.value) || 0)}
                            required
                            className="w-full pl-6 pr-3 py-1.5 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green text-right"
                          />
                        </div>
                      </div>

                      <div className="w-full sm:w-28 text-right font-bold text-xs text-mv-ink pr-2" style={MONO}>
                        ${((item.quantity || 0) * (item.unit_price_cad || 0)).toFixed(2)}
                      </div>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="p-1.5 text-mv-ink-faint hover:text-red-600 rounded-lg hover:bg-black/[0.05] transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Taxes Toggle & Totals Summary */}
              <div className="p-4 bg-mv-cream-soft border border-mv-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-semibold text-mv-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTaxes}
                      onChange={(e) => setApplyTaxes(e.target.checked)}
                      className="rounded border-mv-border text-mv-green focus:ring-mv-green"
                    />
                    <span>Appliquer les taxes québécoises (TPS 5% + TVQ 9.975%)</span>
                  </label>
                </div>

                <div className="border-t border-mv-border pt-2 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-mv-ink-soft">
                    <span>Sous-total Hors Taxes :</span>
                    <span className="font-semibold text-mv-ink" style={MONO}>
                      ${modalCalculatedTotals.subtotal_cad.toFixed(2)} {invoiceCurrency}
                    </span>
                  </div>
                  {applyTaxes && (
                    <>
                      <div className="flex justify-between text-mv-ink-soft">
                        <span>TPS (5.00%) :</span>
                        <span style={MONO}>${modalCalculatedTotals.tax_tps_cad.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-mv-ink-soft">
                        <span>TVQ (9.975%) :</span>
                        <span style={MONO}>${modalCalculatedTotals.tax_tvq_cad.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between text-sm font-bold text-mv-ink border-t border-mv-border pt-1">
                    <span>Total TTC à Payer :</span>
                    <span className="text-mv-green font-bold text-base" style={MONO}>
                      ${modalCalculatedTotals.total_cad.toFixed(2)} {invoiceCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-mv-ink">Notes et instructions de règlement</label>
                <textarea
                  rows={2}
                  placeholder="Notes personnalisées pour le client ou détails de virement Interac..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-xs rounded-lg bg-mv-surface border border-mv-border focus:outline-none focus:border-mv-green"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading === 'creating'}
                  className="text-xs bg-mv-green text-white gap-1.5 cursor-pointer"
                >
                  {actionLoading === 'creating' ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>{modalType === 'quote' ? 'Enregistrer le Devis' : 'Émettre la Facture'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
