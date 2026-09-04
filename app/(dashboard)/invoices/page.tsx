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

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        e.preventDefault();
        setModalType('invoice');
        setShowCreateModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [syncingStripe, setSyncingStripe] = useState(false);

  const handleSyncStripe = async () => {
    setSyncingStripe(true);
    try {
      const res = await fetch('/api/stripe/sync-invoices', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        toastError('Stripe non configuré', data.error || "Ajoute STRIPE_SECRET_KEY pour activer la synchronisation.");
      } else if (res.ok) {
        toastSuccess('Synchronisation Stripe terminée', `${data.created || 0} facture(s) importée(s), ${data.updated || 0} mise(s) à jour.`);
        await loadData();
      } else {
        toastError('Erreur', data.error || 'La synchronisation a échoué.');
      }
    } catch {
      toastError('Erreur réseau', 'La synchronisation a échoué.');
    } finally {
      setSyncingStripe(false);
    }
  };

  const handleSendViaStripe = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch('/api/stripe/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        toastError('Stripe non configuré', data.error || "Ajoute STRIPE_SECRET_KEY pour activer l'envoi via Stripe.");
      } else if (res.ok) {
        toastSuccess('Facture envoyée via Stripe', 'Le client recevra un courriel avec le lien de paiement.');
        await loadData();
      } else {
        toastError('Erreur', data.error || "Impossible d'envoyer cette facture via Stripe.");
      }
    } catch {
      toastError('Erreur réseau', "L'envoi a échoué.");
    } finally {
      setActionLoading(null);
    }
  };

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

  const updateLineItem = (index: number, field: 'description' | 'quantity' | 'unit_price_cad', value: string | number) => {
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
    <PageFadeIn className="space-y-3 max-w-7xl mx-auto pb-16">
      {/* ── 1. Linear-Style Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Finance</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Facturation & Trésorerie
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-mono" style={MONO}>
            Taxes QC (TPS + TVQ)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSyncStripe}
            disabled={syncingStripe}
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
            title="Synchroniser les factures Stripe"
          >
            <RefreshCw size={12} className={cn(syncingStripe && 'animate-spin')} />
            <span className="hidden md:inline">{syncingStripe ? 'Sync...' : 'Sync Stripe'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalType('quote');
              setShowCreateModal(true);
            }}
            className="h-7 px-2.5 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText size={12} />
            <span>+ Devis</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalType('invoice');
              setShowCreateModal(true);
            }}
            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
            title="Nouvelle Facture (⌘+N)"
          >
            <Plus size={13} />
            <span>+ Facture</span>
            <kbd className="hidden lg:inline text-[9.5px] font-mono bg-emerald-700/60 text-emerald-100 px-1 py-0.2 rounded ml-0.5">⌘N</kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Monolithic Financial Ribbon (divide-x) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1: CA Total Facturé */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>CA Total Facturé</span>
            <DollarSign size={13} className="text-zinc-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              $<AnimatedNumber value={summary?.totalInvoicedCad || 0} />
            </span>
            <span className="text-[10.5px] text-zinc-400 font-mono">CAD</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            {summary?.invoicesCount || 0} factures émises
          </span>
        </div>

        {/* Metric 2: Encaissements Réalisés */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Encaissements Réalisés</span>
            <CheckCircle2 size={13} className="text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-700" style={MONO}>
              $<AnimatedNumber value={summary?.totalCollectedCad || 0} />
            </span>
            <span className="text-[10.5px] text-emerald-600/70 font-mono">CAD</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono mt-0.5" style={MONO}>
            {summary?.paidInvoicesCount || 0} factures réglées
          </span>
        </div>

        {/* Metric 3: En Attente / En Cours */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>En Attente / Échéance</span>
            <Clock size={13} className="text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-amber-700" style={MONO}>
              $<AnimatedNumber value={summary?.totalPendingCad || 0} />
            </span>
            <span className="text-[10.5px] text-amber-600/70 font-mono">CAD</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            {summary?.pendingInvoicesCount || 0} factures en attente
          </span>
        </div>

        {/* Metric 4: Retainers & MRR */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <span>Retainers & MRR</span>
            <TrendingUp size={13} className="text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono tabular-nums text-purple-700" style={MONO}>
              $<AnimatedNumber value={summary?.mrrCad || 0} />
            </span>
            <span className="text-[10.5px] text-purple-600/70 font-mono">/ mois</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-0.5" style={MONO}>
            Revenus récurrents
          </span>
        </div>
      </div>

      {/* ── 3. Main Filter & Segmented Control Strip (h-8) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="h-8 p-0.5 bg-zinc-100 border border-zinc-200 rounded-md inline-flex items-center gap-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={cn(
              'h-7 px-2.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'invoices' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Factures & Règlements ({invoices.filter((i) => i.type !== 'quote').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quotes')}
            className={cn(
              'h-7 px-2.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'quotes' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Devis & Propositions ({invoices.filter((i) => i.type === 'quote').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cashflow')}
            className={cn(
              'h-7 px-2.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'cashflow' ? 'bg-white text-zinc-900 font-semibold shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            Flux de Trésorerie
          </button>
        </div>

        {activeTab !== 'cashflow' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrer réf ou client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-48 h-7 pl-7 pr-2 text-xs rounded-md bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-7 px-2 text-xs rounded-md bg-white border border-zinc-200 text-zinc-700 focus:outline-none focus:border-emerald-600 cursor-pointer font-mono"
              style={MONO}
            >
              <option value="all">Tous statuts</option>
              <option value="paid">Payé</option>
              <option value="sent">Envoyé</option>
              <option value="draft">Brouillon</option>
              <option value="overdue">En retard</option>
            </select>
          </div>
        )}
      </div>

      {/* ── 4. Dense High-Precision DataTable (36px per row) ── */}
      {(activeTab === 'invoices' || activeTab === 'quotes') && (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  <th className="py-2 px-3 font-semibold w-24"># RÉF</th>
                  <th className="py-2 px-3 font-semibold min-w-[180px]">CLIENT</th>
                  <th className="py-2 px-3 font-semibold w-24">ÉMISSION</th>
                  <th className="py-2 px-3 font-semibold w-24">ÉCHÉANCE</th>
                  <th className="py-2 px-3 font-semibold w-28 text-right">MONTANT HT</th>
                  <th className="py-2 px-3 font-semibold w-24 text-right">TPS/TVQ</th>
                  <th className="py-2 px-3 font-semibold w-32 text-right">TOTAL TTC</th>
                  <th className="py-2 px-3 font-semibold w-24 text-center">STATUT</th>
                  <th className="py-2 px-3 font-semibold w-32 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-zinc-400">
                      <div className="space-y-1.5 max-w-sm mx-auto">
                        <Receipt className="w-6 h-6 text-zinc-300 mx-auto" />
                        <p className="font-medium text-zinc-600">
                          {activeTab === 'invoices' ? 'Aucune facture trouvée' : 'Aucun devis trouvé'}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {activeTab === 'invoices'
                            ? 'Créez votre première facture ou synchronisez depuis Stripe.'
                            : 'Créez un devis avec calcul automatique des taxes québécoises.'}
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setModalType(activeTab === 'invoices' ? 'invoice' : 'quote');
                              setShowCreateModal(true);
                            }}
                            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus size={12} />
                            <span>Créer maintenant</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    const isSent = inv.status === 'sent';
                    const isOverdue = inv.status === 'overdue';
                    const isQuote = inv.type === 'quote';

                    const subtotal = Number(inv.subtotal_cad || 0);
                    const total = Number(inv.total_cad || 0);
                    const taxes = Math.max(0, total - subtotal);

                    return (
                      <tr
                        key={inv.id}
                        className="h-9 hover:bg-zinc-50/80 transition-colors group select-none"
                      >
                        {/* Ref number */}
                        <td className="py-1.5 px-3 font-mono text-[11.5px] font-semibold text-zinc-900 whitespace-nowrap">
                          <Link href={`/invoices/${inv.id}`} className="hover:text-emerald-700 hover:underline">
                            {inv.invoice_number}
                          </Link>
                        </td>

                        {/* Client name */}
                        <td className="py-1.5 px-3 min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-zinc-900 truncate">{inv.client_name}</span>
                            {inv.project_name && (
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1 rounded truncate hidden md:inline">
                                {inv.project_name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Issue date */}
                        <td className="py-1.5 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                          {new Date(inv.issue_date).toLocaleDateString('fr-CA')}
                        </td>

                        {/* Due date */}
                        <td className="py-1.5 px-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                          {inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-CA') : '—'}
                        </td>

                        {/* Montant HT */}
                        <td className="py-1.5 px-3 font-mono text-[11.5px] text-zinc-600 text-right whitespace-nowrap" style={MONO}>
                          ${subtotal.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Taxes */}
                        <td className="py-1.5 px-3 font-mono text-[11px] text-zinc-400 text-right whitespace-nowrap" style={MONO}>
                          +${taxes.toFixed(2)}
                        </td>

                        {/* Total TTC */}
                        <td className="py-1.5 px-3 font-mono text-xs font-bold text-zinc-900 text-right whitespace-nowrap" style={MONO}>
                          ${total.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {inv.currency}
                        </td>

                        {/* Status badge */}
                        <td className="py-1.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider',
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isSent
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                            )}
                          >
                            {isPaid
                              ? 'Payé'
                              : isSent
                              ? 'Envoyé'
                              : isOverdue
                              ? 'En retard'
                              : inv.status === 'draft'
                              ? 'Brouillon'
                              : inv.status}
                          </span>
                        </td>

                        {/* Actions (visible on row hover) */}
                        <td className="py-1.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isQuote && inv.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => handleConvertToInvoice(inv.id)}
                                disabled={actionLoading === inv.id}
                                title="Convertir ce devis en facture"
                                className="h-6 px-1.5 text-[10.5px] font-mono rounded border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Sparkles size={11} />
                                <span>Facturer</span>
                              </button>
                            )}

                            {!isQuote && !isPaid && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(inv.id, 'paid')}
                                disabled={actionLoading === inv.id}
                                title="Marquer comme payé"
                                className="h-6 px-1.5 text-[10.5px] font-mono rounded border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 size={11} />
                                <span>Payé</span>
                              </button>
                            )}

                            <Link
                              href={`/invoices/${inv.id}`}
                              className="p-1 text-zinc-400 hover:text-zinc-900 rounded hover:bg-zinc-100 transition-colors"
                              title="Aperçu & Impression PDF"
                            >
                              <Printer size={13} />
                            </Link>

                            {inv.stripe_hosted_invoice_url ? (
                              <a
                                href={inv.stripe_hosted_invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-zinc-400 hover:text-blue-600 rounded hover:bg-zinc-100 transition-colors"
                                title="Ouvrir la facture Stripe"
                              >
                                <CreditCard size={13} />
                              </a>
                            ) : !isQuote && !isPaid ? (
                              <button
                                type="button"
                                onClick={() => handleSendViaStripe(inv.id)}
                                disabled={actionLoading === inv.id}
                                title="Envoyer cette facture via Stripe"
                                className="h-6 px-1.5 text-[10.5px] font-mono rounded border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CreditCard size={11} />
                                <span>Stripe</span>
                              </button>
                            ) : null}

                            {inv.stripe_payment_link_url && (
                              <a
                                href={inv.stripe_payment_link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-zinc-400 hover:text-blue-600 rounded hover:bg-zinc-100 transition-colors"
                                title="Ouvrir le lien de paiement Stripe"
                              >
                                <ArrowUpRight size={13} />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteInvoice(inv.id)}
                              disabled={actionLoading === inv.id}
                              className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-100 transition-colors cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Fast Row */}
          <div className="h-8 px-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setModalType(activeTab === 'invoices' ? 'invoice' : 'quote');
                setShowCreateModal(true);
              }}
              className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 font-mono text-[11px] cursor-pointer"
              style={MONO}
            >
              <span>+ {activeTab === 'invoices' ? 'Créer une nouvelle facture... [ ⌘ + N ]' : 'Créer un nouveau devis...'}</span>
            </button>
            <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
              {filteredInvoices.length} élément{filteredInvoices.length > 1 ? 's' : ''}
            </span>
          </div>
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
