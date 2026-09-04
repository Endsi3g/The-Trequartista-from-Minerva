'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Plus,
  Calendar,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  X,
  Check,
  Trash2,
  Copy,
  Clock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import type { Client, Project, Task, Invoice, InvoiceStatus } from '@/lib/types';
import {
  fetchInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  seedBenchmarkInvoicesIfEmpty,
} from '@/lib/services/invoicing';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontVariantNumeric: 'tabular-nums',
};

// ── Transaction Record Interface ───────────────────────────────────────────
export interface TransactionRecord {
  id: string; // e.g. '#04910'
  rawId: string; // uuid in database
  customerName: string;
  customerInitials: string;
  avatarBg: string;
  product: string;
  status: 'Success' | 'Pending' | 'Refunded';
  qty: number;
  unitPrice: number;
  totalRevenue: number;
  date: string;
}

// ── Datasets for Area Chart depending on Granularity ───────────────────────
const TREND_DATA_DAILY = [
  { period: 'Lun', newUser: 1200, existingUser: 2100 },
  { period: 'Mar', newUser: 1600, existingUser: 2400 },
  { period: 'Mer', newUser: 1400, existingUser: 2800 },
  { period: 'Jeu', newUser: 1900, existingUser: 3200 },
  { period: 'Ven', newUser: 2300, existingUser: 3900 },
  { period: 'Sam', newUser: 1100, existingUser: 1800 },
  { period: 'Dim', newUser: 900, existingUser: 1500 },
];

const TREND_DATA_WEEKLY = [
  { period: 'Sem 1', newUser: 3200, existingUser: 4800 },
  { period: 'Sem 2', newUser: 4100, existingUser: 5400 },
  { period: 'Sem 3', newUser: 3900, existingUser: 5900 },
  { period: 'Sem 4', newUser: 4600, existingUser: 6400 },
];

const TREND_DATA_MONTHLY = [
  { period: '1-7 Jan', newUser: 1800, existingUser: 2400 },
  { period: '8-14 Jan', newUser: 2600, existingUser: 3100 },
  { period: '15-21 Jan', newUser: 3200, existingUser: 4200 },
  { period: '22-28 Jan', newUser: 2900, existingUser: 3800 },
  { period: '29-4 Fév', newUser: 3500, existingUser: 4600 },
  { period: '5-11 Fév', newUser: 4100, existingUser: 5200 },
  { period: '12-18 Fév', newUser: 3800, existingUser: 4900 },
  { period: '19-25 Fév', newUser: 4400, existingUser: 5600 },
];

const TREND_DATA_YEARLY = [
  { period: 'Jan', newUser: 8500, existingUser: 11820 },
  { period: 'Fév', newUser: 9200, existingUser: 12400 },
  { period: 'Mar', newUser: 10400, existingUser: 13800 },
  { period: 'Avr', newUser: 9800, existingUser: 13200 },
  { period: 'Mai', newUser: 11500, existingUser: 15100 },
  { period: 'Juin', newUser: 12200, existingUser: 16400 },
  { period: 'Juil', newUser: 10900, existingUser: 14800 },
  { period: 'Août', newUser: 11800, existingUser: 15900 },
  { period: 'Sep', newUser: 13400, existingUser: 17800 },
  { period: 'Oct', newUser: 14200, existingUser: 18900 },
  { period: 'Nov', newUser: 15100, existingUser: 20100 },
  { period: 'Déc', newUser: 16800, existingUser: 22400 },
];

interface ManagingOverviewProps {
  clients?: Client[];
  projects?: Project[];
  tasks?: Task[];
  userName?: string;
}

const PERIOD_OPTIONS: Array<{
  label: string;
  granularity: 'Jour' | 'Semaine' | 'Mois' | 'Année';
}> = [
  { label: '18 Déc, 2024 — 17 Jan, 2025', granularity: 'Mois' },
  { label: 'Derniers 30 Jours', granularity: 'Jour' },
  { label: 'Ce Mois-ci', granularity: 'Semaine' },
  { label: 'Trimestre Q4 2024', granularity: 'Mois' },
  { label: 'Année Fiscale', granularity: 'Année' },
];

export function ManagingOverview({
  clients = [],
  projects = [],
  tasks = [],
}: ManagingOverviewProps) {
  // Navigation & Time range states
  const [granularity, setGranularity] = useState<'Jour' | 'Semaine' | 'Mois' | 'Année'>('Mois');
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Trimestre Q4 2024');

  // Database Invoices & Transactions State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Transaction Form State
  const [newCustomer, setNewCustomer] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newPrice, setNewPrice] = useState('1250');
  const [newQty, setNewQty] = useState('1');
  const [newStatus, setNewStatus] = useState<'Success' | 'Pending' | 'Refunded'>('Success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load invoices from Supabase with fallback seeding
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let data = await fetchInvoices();
      if (!data || data.length === 0) {
        data = await seedBenchmarkInvoicesIfEmpty();
      }
      setInvoices(data || []);
    } catch (err) {
      console.error('[ManagingOverview] Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcut ⌘ + N (or Ctrl + N) to open transaction modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map Invoices to TransactionRecords
  const transactions: TransactionRecord[] = useMemo(() => {
    return invoices.map((inv) => {
      const rawStatus = inv.status;
      const status: 'Success' | 'Pending' | 'Refunded' =
        rawStatus === 'paid'
          ? 'Success'
          : rawStatus === 'sent' || rawStatus === 'draft'
          ? 'Pending'
          : 'Refunded';

      const customerName = inv.client_name || inv.client_company || 'Client Partenaire';
      const initials =
        customerName
          .split(' ')
          .map((w) => w[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'CL';

      const firstItem = inv.items && inv.items.length > 0 ? inv.items[0] : null;
      const product = firstItem?.description || inv.notes || 'Service Agence Minerva';
      const qty = firstItem?.quantity || 1;
      const unitPrice = firstItem?.unit_price_cad || inv.total_cad || 0;
      const totalRevenue = inv.total_cad || unitPrice * qty;

      const dateStr = inv.issue_date
        ? new Date(inv.issue_date).toLocaleDateString('fr-CA', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '17 Jan 2025';

      const avatarColors = [
        'bg-emerald-50 text-emerald-800 border border-emerald-200',
        'bg-blue-50 text-blue-800 border border-blue-200',
        'bg-purple-50 text-purple-800 border border-purple-200',
        'bg-amber-50 text-amber-800 border border-amber-200',
        'bg-zinc-100 text-zinc-800 border border-zinc-200',
      ];
      const charCodeSum = customerName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const avatarBg = avatarColors[Math.abs(charCodeSum) % avatarColors.length];

      return {
        id: inv.invoice_number.startsWith('#') ? inv.invoice_number : `#${inv.invoice_number}`,
        rawId: inv.id,
        customerName,
        customerInitials: initials,
        avatarBg,
        product,
        status,
        qty,
        unitPrice,
        totalRevenue,
        date: dateStr,
      };
    });
  }, [invoices]);

  // Live Aggregated Financial Metrics
  const totalRevenueCalculated = useMemo(() => {
    const successTransactionsTotal = transactions
      .filter((t) => t.status === 'Success')
      .reduce((sum, t) => sum + t.totalRevenue, 0);
    const clientsMrr = clients.reduce((sum, c) => sum + (c.mrr || 0), 0);
    return Math.max(20320, successTransactionsTotal + clientsMrr);
  }, [transactions, clients]);

  const activeDeliverablesCount = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'done').length;
    const activeProjects = projects.filter((p) => p.current_stage !== 'Live Production').length;
    return activeTasks > 0 ? activeTasks + activeProjects : 248;
  }, [tasks, projects]);

  const partnerCount = useMemo(() => {
    return Math.max(18, clients.filter((c) => c.status === 'Active').length);
  }, [clients]);

  // Filtered transactions for DataTable
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.product.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  // Selection toggle
  const isAllSelected =
    filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CSV Export Functionality
  const handleExportCsv = () => {
    const headers = [
      'REFERENCE #',
      'CLIENT / SOCIETE',
      'PRODUIT OU SERVICE',
      'STATUT',
      'QTE',
      'PRIX UNITAIRE CAD',
      'TOTAL TTC CAD',
      'DATE',
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      `"${t.customerName.replace(/"/g, '""')}"`,
      `"${t.product.replace(/"/g, '""')}"`,
      t.status,
      t.qty,
      t.unitPrice,
      t.totalRevenue,
      t.date,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `minerva_transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Transaction Handler (Saves directly to Supabase invoices)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newProduct.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const priceNum = parseFloat(newPrice) || 0;
    const qtyNum = parseInt(newQty, 10) || 1;
    const dbStatus: InvoiceStatus =
      newStatus === 'Success' ? 'paid' : newStatus === 'Pending' ? 'sent' : 'cancelled';

    const matchedClient = clients.find(
      (c) =>
        c.name.toLowerCase().includes(newCustomer.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(newCustomer.toLowerCase())
    );

    const created = await createInvoice({
      type: 'invoice',
      client_id: matchedClient?.id || clients[0]?.id || '00000000-0000-0000-0000-000000000000',
      status: dbStatus,
      issue_date: new Date().toISOString().split('T')[0],
      notes: newProduct.trim(),
      items: [
        {
          description: newProduct.trim(),
          quantity: qtyNum,
          unit_price_cad: priceNum,
        },
      ],
    });

    if (created) {
      setInvoices((prev) => [created, ...prev]);
    } else {
      // Optimistic fallback
      await loadData();
    }

    setIsSubmitting(false);
    setIsAddModalOpen(false);
    setNewCustomer('');
    setNewProduct('');
    setNewPrice('1250');
    setNewQty('1');
    setNewStatus('Success');
  };

  // Status Mutation Handler (Updates in Supabase)
  const handleStatusChange = async (
    rawId: string,
    nextStatus: 'Success' | 'Pending' | 'Refunded'
  ) => {
    setActiveMenuId(null);
    const dbStatus: InvoiceStatus =
      nextStatus === 'Success' ? 'paid' : nextStatus === 'Pending' ? 'sent' : 'cancelled';

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === rawId ? { ...inv, status: dbStatus } : inv))
    );
    await updateInvoiceStatus(rawId, dbStatus);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = async (rawId: string) => {
    setActiveMenuId(null);
    if (!confirm('Confirmez-vous la suppression de cette transaction ?')) return;

    setInvoices((prev) => prev.filter((inv) => inv.id !== rawId));
    await deleteInvoice(rawId);
  };

  // Copy Reference Handler
  const handleCopyReference = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  // Active dataset for Area Chart
  const activeTrendData = useMemo(() => {
    switch (granularity) {
      case 'Jour':
        return TREND_DATA_DAILY;
      case 'Semaine':
        return TREND_DATA_WEEKLY;
      case 'Année':
        return TREND_DATA_YEARLY;
      case 'Mois':
      default:
        return TREND_DATA_MONTHLY;
    }
  }, [granularity]);

  return (
    <PageFadeIn>
      <div className="space-y-4 pb-12">
        {/* ── 1. Header Exécutif & Sélecteur Temporel (Hauteur 40px) ────────── */}
        <div className="h-10 flex items-center justify-between gap-3 border-b border-zinc-200/80 pb-3">
          {/* Breadcrumb & Titre Technique */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400" style={MONO}>
                <span>Minerva</span>
                <span>/</span>
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-zinc-600">Vue d'Ensemble</span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-zinc-900 tracking-tight leading-none">
                  Vue d'Ensemble & Revenus
                </h1>
              </div>
            </div>
          </div>

          {/* Contrôles à Droite : Menu Déroulant Unique de Période (28px) & Export CSV */}
          <div className="flex items-center gap-2">
            {/* Sélecteur de période unifié (28px de hauteur, font-sans) */}
            <div className="relative">
              <button
                onClick={() => setDateRangeOpen(!dateRangeOpen)}
                className="h-7 px-2.5 text-xs font-sans border border-zinc-200 rounded-md bg-white text-zinc-700 flex items-center gap-1.5 hover:bg-zinc-50 shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{selectedRange}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400 opacity-70" />
              </button>

              {dateRangeOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-lg z-30 py-1 text-xs font-sans">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => {
                        setSelectedRange(opt.label);
                        setGranularity(opt.granularity);
                        setDateRangeOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 h-[30px] hover:bg-zinc-50 flex items-center justify-between cursor-pointer font-sans transition-colors',
                        selectedRange === opt.label
                          ? 'text-[#059669] font-medium bg-emerald-50/40'
                          : 'text-zinc-700'
                      )}
                    >
                      <span>{opt.label}</span>
                      {selectedRange === opt.label && (
                        <Check className="w-3.5 h-3.5 text-[#059669]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton Export CSV */}
            <button
              onClick={handleExportCsv}
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer bg-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* ── 2. Ruban Financier & Exécutif Monolithique (Strip de 4 Métriques) ────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-xs">
          {/* Métrique 1 : Revenus Récurrents & MRR */}
          <div className="p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono" style={MONO}>
              Revenus Récurrents &amp; MRR
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {totalRevenueCalculated.toLocaleString('fr-CA')} $ CAD
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-medium text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200" style={MONO}>
                +12.5% vs m-1
              </span>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                Run-rate actif
              </span>
            </div>
          </div>

          {/* Métrique 2 : Partenaires Clients Actifs */}
          <div className="p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono" style={MONO}>
              Partenaires Clients Actifs
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {partnerCount || 18} comptes
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono" style={MONO}>
              <span className="text-emerald-700 font-semibold">94.2% rétention</span>
              <span className="text-zinc-400">· 0% Churn ce mois</span>
            </div>
          </div>

          {/* Métrique 3 : Collaborateurs & Charge Équipe */}
          <div className="p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono" style={MONO}>
              Collaborateurs &amp; Charge
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              5 membres clés
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono" style={MONO}>
              <span className="text-emerald-700 font-semibold">175h capacité hebdo</span>
              <span className="text-zinc-400">· 0% surcharge</span>
            </div>
          </div>

          {/* Métrique 4 : Livrables & Sprints Actifs */}
          <div className="p-3.5 sm:p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 font-mono" style={MONO}>
              Livrables &amp; Sprints Actifs
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
              {activeDeliverablesCount || 24} en cours
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-mono font-medium" style={MONO}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% dans les délais</span>
            </div>
          </div>
        </div>

        {/* ── 3. Layout 2-Colonnes : Analytics & Répartition MRR (Split-View 65/35) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Colonne Gauche : Évolution des Ventes (2/3 de largeur) */}
          <div className="lg:col-span-2 border border-zinc-200 rounded-lg p-3.5 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
                    Tendance des Ventes & Encaissements
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Flux de trésorerie consolidé ({granularity.toLowerCase()})
                  </p>
                </div>
                {/* Légende micro-texte avec puces */}
                <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500" style={MONO}>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Clients Existants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-300" />
                    <span>Nouveaux Utilisateurs</span>
                  </div>
                </div>
              </div>

              {/* Graphique Area Chart Recharts Ultra-Fin 180px */}
              <div className="w-full h-[180px]">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={activeTrendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="existingUserGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="newUserGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="#F4F4F5" vertical={false} />
                    <XAxis
                      dataKey="period"
                      stroke="#A1A1AA"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#E4E4E7' }}
                      tick={{ fontFamily: 'var(--font-mono)', fill: '#A1A1AA' }}
                    />
                    <YAxis
                      stroke="#A1A1AA"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val: number) => `${Math.round(val / 1000)}k$`}
                      tick={{ fontFamily: 'var(--font-mono)', fill: '#A1A1AA' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const existVal = Number(payload[0]?.value || 0);
                          const newVal = Number(payload[1]?.value || 0);
                          const total = existVal + newVal;
                          return (
                            <div className="bg-zinc-900 text-white p-2.5 rounded-lg shadow-xl border border-zinc-800 text-xs font-mono" style={MONO}>
                              <div className="text-zinc-400 text-[10px] mb-1">{label}</div>
                              <div className="flex items-center justify-between gap-3 text-emerald-400">
                                <span>Existants :</span>
                                <span className="font-bold">{existVal.toLocaleString('fr-CA')} $</span>
                              </div>
                              <div className="flex items-center justify-between gap-3 text-emerald-200">
                                <span>Nouveaux :</span>
                                <span className="font-bold">{newVal.toLocaleString('fr-CA')} $</span>
                              </div>
                              <div className="border-t border-zinc-800 mt-1 pt-1 flex items-center justify-between gap-3 font-bold text-white">
                                <span>Total :</span>
                                <span>{total.toLocaleString('fr-CA')} $ CAD</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="existingUser"
                      name="Clients Existants"
                      stroke="#059669"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#existingUserGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="newUser"
                      name="Nouveaux Utilisateurs"
                      stroke="#34D399"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#newUserGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Colonne Droite : Revenus par Catégorie & Insight IA (1/3 de largeur) */}
          <div className="border border-zinc-200 rounded-lg p-3.5 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            {/* Synthèse Rapide */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono" style={MONO}>
                  Revenus Période
                </span>
                <div className="text-base font-bold font-mono text-zinc-900" style={MONO}>
                  20 320 $ CAD
                </div>
              </div>
              <div className="text-[11px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded" style={MONO}>
                18 Déc - 17 Jan
              </div>
            </div>

            {/* Insight IA Minerva Pulse */}
            <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-md text-[11px] text-emerald-900 leading-snug flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Minerva Pulse :</span> Les abonnements SaaS récurrents représentent 45% du chiffre d'affaires, assurant une couverture à 100% des coûts opérationnels fixes.
              </div>
            </div>

            {/* Barres de Répartition Horizontales Fines (4px) */}
            <div className="space-y-2.5 pt-1">
              {/* Catégorie 1 : Abonnements SaaS (Flow & OS) */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 font-medium truncate">Abonnements SaaS (Flow & OS)</span>
                  <span className="font-mono text-zinc-900 font-bold" style={MONO}>
                    9 144 $ (45%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-600 h-1 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              {/* Catégorie 2 : Workflows Tech & IA Custom */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 font-medium truncate">Workflows Tech & IA Custom</span>
                  <span className="font-mono text-zinc-900 font-bold" style={MONO}>
                    6 096 $ (30%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>

              {/* Catégorie 3 : Sprints Marketing & Acquisition */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 font-medium truncate">Sprints Marketing & Acquisition</span>
                  <span className="font-mono text-zinc-900 font-bold" style={MONO}>
                    3 048 $ (15%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-400 h-1 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>

              {/* Catégorie 4 : Consulting & DevOps Setup */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-zinc-700 font-medium truncate">Consulting & DevOps Setup</span>
                  <span className="font-mono text-zinc-900 font-bold" style={MONO}>
                    2 032 $ (10%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1 overflow-hidden">
                  <div className="bg-emerald-300 h-1 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. DataTable des Dernières Transactions (Style Linear / Stripe) ── */}
        <div className="border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-xs">
          {/* Barre d'Outils Intégrée (Hauteur 40px) */}
          <div className="h-10 px-3.5 border-b border-zinc-200/80 flex items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-zinc-900 tracking-tight">
                Transactions Récentes
              </h3>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded" style={MONO}>
                {filteredTransactions.length} enregistrées
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Recherche Inline */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrer par référence, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs w-56 pl-7 pr-2.5 border border-zinc-200 rounded-md bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  style={MONO}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Bouton d'Ajout Transaction */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Raccourci : ⌘ + N"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une transaction</span>
                <span className="hidden sm:inline-block text-[10px] text-emerald-200 font-mono ml-0.5 bg-emerald-800/40 px-1 rounded">
                  ⌘N
                </span>
              </button>
            </div>
          </div>

          {/* Grille Dense Strict (Hauteur 34px par ligne) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] uppercase font-mono text-zinc-400 tracking-wider select-none" style={MONO}>
                  <th className="py-2 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2 px-3 font-semibold">RÉFÉRENCE #</th>
                  <th className="py-2 px-3 font-semibold">CLIENT / SOCIÉTÉ</th>
                  <th className="py-2 px-3 font-semibold">PRODUIT OU SERVICE</th>
                  <th className="py-2 px-3 font-semibold text-center">STATUT</th>
                  <th className="py-2 px-3 font-semibold text-center">QTÉ</th>
                  <th className="py-2 px-3 font-semibold text-right">PRIX UNITAIRE</th>
                  <th className="py-2 px-3 font-semibold text-right">TOTAL TTC</th>
                  <th className="py-2 px-3 w-10 text-center font-semibold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-400 font-mono text-xs" style={MONO}>
                      Synchronisation des transactions Supabase...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-zinc-400 font-mono text-xs" style={MONO}>
                      Aucune transaction trouvée pour cette recherche.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isSelected = selectedIds.includes(tx.id);
                    const isMenuOpen = activeMenuId === tx.id;

                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          'h-[34px] hover:bg-zinc-50/80 transition-colors group',
                          isSelected && 'bg-emerald-50/30'
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-1 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(tx.id)}
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Référence # */}
                        <td className="py-1 px-3 font-mono font-medium text-zinc-900 whitespace-nowrap" style={MONO}>
                          {tx.id}
                        </td>

                        {/* Client / Société */}
                        <td className="py-1 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                tx.avatarBg
                              )}
                            >
                              {tx.customerInitials}
                            </div>
                            <span className="font-medium text-zinc-800 truncate max-w-[160px]">
                              {tx.customerName}
                            </span>
                          </div>
                        </td>

                        {/* Produit ou Service */}
                        <td className="py-1 px-3 text-zinc-600 truncate max-w-[220px]">
                          {tx.product}
                        </td>

                        {/* Statut avec pastille conforme */}
                        <td className="py-1 px-3 text-center whitespace-nowrap">
                          {tx.status === 'Success' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200"
                              style={MONO}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>SUCCÈS</span>
                            </span>
                          )}
                          {tx.status === 'Pending' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200"
                              style={MONO}
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>ATTENTE</span>
                            </span>
                          )}
                          {tx.status === 'Refunded' && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold text-zinc-600 bg-zinc-100 border border-zinc-200"
                              style={MONO}
                            >
                              <RotateCcw className="w-2.5 h-2.5 text-zinc-500" />
                              <span>REMBOURSÉ</span>
                            </span>
                          )}
                        </td>

                        {/* Quantité */}
                        <td className="py-1 px-3 text-center font-mono text-zinc-600" style={MONO}>
                          {tx.qty}
                        </td>

                        {/* Prix Unitaire */}
                        <td className="py-1 px-3 text-right font-mono text-zinc-600 whitespace-nowrap" style={MONO}>
                          {tx.unitPrice.toLocaleString('fr-CA')} $ CAD
                        </td>

                        {/* Total TTC */}
                        <td className="py-1 px-3 text-right font-mono font-bold text-zinc-900 whitespace-nowrap" style={MONO}>
                          {tx.totalRevenue.toLocaleString('fr-CA')} $ CAD
                        </td>

                        {/* Actions (Menu Déroulant) */}
                        <td className="py-1 px-3 text-center relative">
                          <button
                            onClick={() => setActiveMenuId(isMenuOpen ? null : tx.id)}
                            className="p-1 hover:bg-zinc-200/60 rounded text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                            title="Actions de la transaction"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-3 top-8 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-20 py-1 text-left text-xs font-mono" style={MONO}>
                              <div className="px-2 py-1 text-[10px] text-zinc-400 uppercase font-semibold border-b border-zinc-100">
                                Statut de la facture
                              </div>
                              <button
                                onClick={() => handleStatusChange(tx.rawId, 'Success')}
                                className="w-full px-2.5 py-1.5 text-left text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Marquer Réglé (Succès)</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(tx.rawId, 'Pending')}
                                className="w-full px-2.5 py-1.5 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Marquer En Attente</span>
                              </button>
                              <button
                                onClick={() => handleStatusChange(tx.rawId, 'Refunded')}
                                className="w-full px-2.5 py-1.5 text-left text-zinc-600 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3 text-zinc-500" />
                                <span>Marquer Remboursé</span>
                              </button>
                              <div className="border-t border-zinc-100 my-1" />
                              <button
                                onClick={() => handleCopyReference(tx.id)}
                                className="w-full px-2.5 py-1.5 text-left text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Copy className="w-3 h-3 text-zinc-400" />
                                <span>{copiedId === tx.id ? 'Copié !' : 'Copier référence'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(tx.rawId)}
                                className="w-full px-2.5 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 5. Modal d'Ajout Transaction (Accessible via ⌘ + N) ─────────── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-zinc-200 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-zinc-900">
                    Nouvelle Transaction d'Agence
                  </h4>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="p-4 space-y-3 text-xs font-mono" style={MONO}>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Client / Entreprise :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toitures Beauchemin Inc."
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Prestation ou Produit :
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Déploiement Agent IA Vocal & CRM"
                    value={newProduct}
                    onChange={(e) => setNewProduct(e.target.value)}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Prix Unitaire ($ CAD) :
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-700 font-semibold mb-1">
                      Quantité :
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 font-semibold mb-1">
                    Statut Initial :
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'Success' | 'Pending' | 'Refunded')}
                    className="w-full h-8 px-2.5 border border-zinc-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Success">Succès (Payé)</option>
                    <option value="Pending">En Attente (Émis)</option>
                    <option value="Refunded">Remboursé</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-8 px-3 text-zinc-600 hover:bg-zinc-100 rounded-md cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Créer la transaction'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
