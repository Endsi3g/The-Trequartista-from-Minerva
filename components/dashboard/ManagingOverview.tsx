'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import type { Client, Project, Task } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontVariantNumeric: 'tabular-nums',
};

// ── Micro-Histogram Sparkline Component (Matching Reference Card Micro-Bars) ──
function MicroBarSparkline({
  values = [40, 60, 50, 75, 65, 85, 70, 95],
  height = 36,
  activeColor = '#059669',
  mutedColor = '#E4E4E7',
}: {
  values?: number[];
  height?: number;
  activeColor?: string;
  mutedColor?: string;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 shrink-0 select-none" style={{ height }}>
      {values.map((val, idx) => {
        const pct = Math.max(15, Math.round((val / max) * 100));
        const isLast = idx === values.length - 1;
        return (
          <div
            key={idx}
            className="w-1.5 sm:w-2 rounded-full transition-all duration-300"
            style={{
              height: `${pct}%`,
              backgroundColor: isLast ? activeColor : mutedColor,
            }}
            title={`${val}`}
          />
        );
      })}
    </div>
  );
}

// ── Transaction Record Interface ───────────────────────────────────────────
interface TransactionRecord {
  id: string;
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

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: '#04910',
    customerName: 'Toitures Beauchemin',
    customerInitials: 'TB',
    avatarBg: 'bg-emerald-100 text-emerald-800',
    product: 'Déploiement Agent IA Vocal & CRM',
    status: 'Success',
    qty: 1,
    unitPrice: 2500,
    totalRevenue: 2500,
    date: '17 Jan 2025',
  },
  {
    id: '#04909',
    customerName: 'Bistro Laurent',
    customerInitials: 'BL',
    avatarBg: 'bg-blue-100 text-blue-800',
    product: 'Setup QR Minerva Flow SaaS + Menu',
    status: 'Success',
    qty: 1,
    unitPrice: 1250,
    totalRevenue: 1250,
    date: '16 Jan 2025',
  },
  {
    id: '#04908',
    customerName: 'Clinique Dentaire Apex',
    customerInitials: 'CA',
    avatarBg: 'bg-purple-100 text-purple-800',
    product: 'Abonnement Flow Enterprise (Annuel)',
    status: 'Success',
    qty: 1,
    unitPrice: 4800,
    totalRevenue: 4800,
    date: '15 Jan 2025',
  },
  {
    id: '#04907',
    customerName: 'Le Burger Urbain',
    customerInitials: 'BU',
    avatarBg: 'bg-amber-100 text-amber-800',
    product: 'Licence OS Lite Pro + Terminal',
    status: 'Pending',
    qty: 2,
    unitPrice: 650,
    totalRevenue: 1300,
    date: '14 Jan 2025',
  },
  {
    id: '#04906',
    customerName: 'Apex Logistique',
    customerInitials: 'AL',
    avatarBg: 'bg-indigo-100 text-indigo-800',
    product: 'Sprint Architecture Next.js 16',
    status: 'Success',
    qty: 1,
    unitPrice: 3500,
    totalRevenue: 3500,
    date: '12 Jan 2025',
  },
  {
    id: '#04905',
    customerName: 'Garage Du Sommet',
    customerInitials: 'GS',
    avatarBg: 'bg-rose-100 text-rose-800',
    product: 'Module Avis Google Automatisé',
    status: 'Refunded',
    qty: 1,
    unitPrice: 450,
    totalRevenue: 450,
    date: '10 Jan 2025',
  },
  {
    id: '#04904',
    customerName: 'Kael Belceus (Test)',
    customerInitials: 'KB',
    avatarBg: 'bg-zinc-100 text-zinc-800',
    product: 'Test Paiement Clé Limitée Stripe',
    status: 'Success',
    qty: 1,
    unitPrice: 100,
    totalRevenue: 100,
    date: '08 Jan 2025',
  },
];

// Sales Trend dataset for stacked bar chart
const SALES_TREND_DATA = [
  { period: '1-7 Jan', newUser: 1800, existingUser: 2400 },
  { period: '8-14 Jan', newUser: 2600, existingUser: 3100 },
  { period: '15-21 Jan', newUser: 3200, existingUser: 4200 },
  { period: '22-28 Jan', newUser: 2900, existingUser: 3800 },
  { period: '29-4 Feb', newUser: 3500, existingUser: 4600 },
  { period: '5-11 Feb', newUser: 4100, existingUser: 5200 },
  { period: '12-18 Feb', newUser: 3800, existingUser: 4900 },
  { period: '19-25 Feb', newUser: 4400, existingUser: 5600 },
];

interface ManagingOverviewProps {
  clients?: Client[];
  projects?: Project[];
  tasks?: Task[];
  userName: string;
}

export function ManagingOverview({ userName }: ManagingOverviewProps) {
  // Navigation & Time range states
  const [periodFilter, setPeriodFilter] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [salesTrendPeriod, setSalesTrendPeriod] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [categoryDateDropdown, setCategoryDateDropdown] = useState(false);
  const [selectedCategoryRange, setSelectedCategoryRange] = useState('18 Dec - 17 Jan');

  // AI Insight Toggle State
  const [showAiInsight, setShowAiInsight] = useState(true);

  // Transactions State & Search
  const [transactions, setTransactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Transaction Form State
  const [newCustomer, setNewCustomer] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newPrice, setNewPrice] = useState('1250');
  const [newStatus, setNewStatus] = useState<'Success' | 'Pending' | 'Refunded'>('Success');

  // Filtered transactions
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

  // Checkbox select all
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
      'Transaction ID',
      'Customer',
      'Product / Service',
      'Status',
      'Qty',
      'Unit Price CAD',
      'Total Revenue CAD',
      'Date',
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
    link.setAttribute('download', `minerva_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Transaction Handler
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newProduct.trim()) return;
    const priceNum = parseFloat(newPrice) || 0;
    const nextIndex = transactions.length + 10;
    const initials = newCustomer
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const created: TransactionRecord = {
      id: `#0${4900 + nextIndex}`,
      customerName: newCustomer.trim(),
      customerInitials: initials || 'CL',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      product: newProduct.trim(),
      status: newStatus,
      qty: 1,
      unitPrice: priceNum,
      totalRevenue: priceNum,
      date: new Date().toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setTransactions([created, ...transactions]);
    setNewCustomer('');
    setNewProduct('');
    setNewPrice('1250');
    setIsAddModalOpen(false);
  };

  return (
    <PageFadeIn className="space-y-5 pb-12 font-sans bg-[#FAFAFA] min-h-screen">
      {/* ── 1. Header Toolbar (Welcome back, Kael & Period Switchers) ──────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono tracking-tight" style={MONO}>
            <span>Dashboard</span>
            <span>&gt;</span>
            <span className="text-zinc-600 font-medium">Overview</span>
          </div>
          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mt-1">
            Welcome back, {userName ? userName.trim().split(' ')[0] : 'Kael'}
          </h1>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Time Segmented Pills */}
          <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center border border-zinc-200/80">
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  periodFilter === p
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Date Range Badge */}
          <div className="h-9 px-3 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-2 shadow-2xs font-mono" style={MONO}>
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Dec 18, 2024 - Jan 17, 2025</span>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top 4 Metric KPI Cards (Clean SaaS Monolith) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL REVENUE */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total Revenue
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
                $20,320
              </div>
            </div>
            {/* Vertical Micro-Bars Sparkline */}
            <MicroBarSparkline values={[35, 45, 40, 60, 55, 75, 70, 95]} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-mono" style={MONO}>
              +0.94 last year
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              +12.5% M/M
            </span>
          </div>
        </div>

        {/* Card 2: TOTAL ORDERS */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Total Orders
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
                10,320
              </div>
            </div>
            {/* Vertical Micro-Bars Sparkline */}
            <MicroBarSparkline values={[50, 40, 65, 50, 80, 70, 85, 90]} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-mono" style={MONO}>
              +0.94 last year
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              248 Livrables
            </span>
          </div>
        </div>

        {/* Card 3: NEW CUSTOMERS */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                New Customers
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
                4,305
              </div>
            </div>
            {/* Vertical Micro-Bars Sparkline */}
            <MicroBarSparkline values={[30, 45, 35, 55, 65, 60, 80, 85]} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-mono" style={MONO}>
              +0.94 last year
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              18 Partenaires
            </span>
          </div>
        </div>

        {/* Card 4: CONVERSION RATE */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Conversion Rate
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-900 mt-1 tracking-tight" style={MONO}>
                94.2%
              </div>
            </div>
            {/* Vertical Micro-Bars Sparkline */}
            <MicroBarSparkline values={[70, 75, 80, 82, 88, 90, 92, 94]} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 font-mono" style={MONO}>
              +0.94 last year
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Zero Churn
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Middle Section: Sales Trend (65%) & Revenue Breakdown (35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column (65% on desktop): SALES TREND Stacked Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header: Title, Metric, Legend & Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Sales Trend</h2>
                <div className="text-xs text-zinc-500 mt-0.5 font-mono" style={MONO}>
                  Total Revenue: <span className="font-bold text-zinc-900">$20,320</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Legend Dots */}
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200" />
                    <span>New User</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                    <span>Existing User</span>
                  </div>
                </div>

                {/* Period Selector */}
                <div className="bg-zinc-100 p-0.5 rounded-lg flex items-center border border-zinc-200">
                  {(['Weekly', 'Monthly', 'Yearly'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSalesTrendPeriod(t)}
                      className={cn(
                        'px-2.5 py-1 text-[11px] font-medium rounded-md transition-all',
                        salesTrendPeriod === t
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Recharts Stacked Vertical Histogram */}
            <div className="h-[270px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'var(--font-mono)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#71717A', fontFamily: 'var(--font-mono)' }}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(5, 150, 105, 0.04)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const newU = Number(payload[0]?.value || 0);
                        const existU = Number(payload[1]?.value || 0);
                        const total = newU + existU;
                        return (
                          <div className="bg-zinc-900 text-white p-3 rounded-lg shadow-xl border border-zinc-700 text-xs font-mono space-y-1.5 min-w-[170px]" style={MONO}>
                            <div className="font-semibold text-zinc-300 font-sans border-b border-zinc-700 pb-1">
                              {label}
                            </div>
                            <div className="flex justify-between items-center text-emerald-300 font-bold">
                              <span>Total :</span>
                              <span>${total.toLocaleString()} CAD</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-xs bg-emerald-200" /> New :
                              </span>
                              <span>${newU.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-xs bg-emerald-600" /> Existing :
                              </span>
                              <span>${existU.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="newUser" stackId="sales" fill="#A7F3D0" radius={[0, 0, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="existingUser" stackId="sales" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (35% on desktop): REVENUE BREAKDOWN & AI INSIGHT */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header: Title, Amount & Dropdown */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-600">Revenue by Category</h3>
                <div className="text-2xl font-bold font-mono text-zinc-900 mt-1" style={MONO}>
                  $20,320
                </div>
              </div>

              {/* Date Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoryDateDropdown(!categoryDateDropdown)}
                  className="h-8 px-2.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 flex items-center gap-1.5 transition-colors font-mono"
                  style={MONO}
                >
                  <span>{selectedCategoryRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {categoryDateDropdown && (
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-30 font-mono text-xs" style={MONO}>
                    {['18 Dec - 17 Jan', '18 Nov - 17 Dec', '18 Oct - 17 Nov'].map((rng) => (
                      <button
                        key={rng}
                        onClick={() => {
                          setSelectedCategoryRange(rng);
                          setCategoryDateDropdown(false);
                        }}
                        className="w-full px-3 py-1.5 text-left hover:bg-zinc-50 text-zinc-700 transition-colors"
                      >
                        {rng}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ✨ Inline AI Insight Banner (As Seen in Reference Design) */}
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 shadow-2xs space-y-2">
              <div
                onClick={() => setShowAiInsight(!showAiInsight)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Get AI insight for better analysis</span>
                </div>
                {showAiInsight ? (
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                )}
              </div>

              {showAiInsight && (
                <div className="text-[11.5px] text-zinc-600 leading-relaxed pt-1 border-t border-emerald-100 animate-in fade-in duration-200">
                  <span className="font-semibold text-emerald-900">Minerva AI Pulse :</span> Le MRR des abonnements SaaS Flow progresse de <span className="font-bold text-zinc-900">+24%</span> avec une rétention de <span className="font-bold text-zinc-900">94.2%</span>. Action prioritaire : convertir les 3 comptes Tech à fort volume en abonnements annuels.
                </div>
              )}
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="space-y-3 pt-1">
              {[
                { label: 'SaaS Subscriptions (Flow & OS)', amount: '$9,144', pct: 45, color: 'bg-emerald-600' },
                { label: 'Custom Tech & AI Workflows', amount: '$6,096', pct: 30, color: 'bg-emerald-500' },
                { label: 'Marketing & Acquisition Sprints', amount: '$3,048', pct: 15, color: 'bg-emerald-400' },
                { label: 'Consulting & RevOps Setup', amount: '$2,032', pct: 10, color: 'bg-emerald-300' },
              ].map((cat) => (
                <div key={cat.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 truncate max-w-[200px]">{cat.label}</span>
                    <span className="font-mono font-semibold text-zinc-900" style={MONO}>
                      {cat.amount} <span className="text-zinc-400 font-normal">({cat.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-500', cat.color)} style={{ width: `${cat.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Section: RECENT TRANSACTIONS Table ──────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Table Toolbar Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Recent Transactions</h2>
            <p className="text-xs text-zinc-500">
              {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''} enregistrée{filteredTransactions.length > 1 ? 's' : ''} sur la période
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search for transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 pr-3 w-48 sm:w-64 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all font-mono"
                style={MONO}
              />
            </div>

            {/* + Add Transaction Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Dense DataTable */}
        <div className="border border-zinc-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 h-9 select-none">
                <th className="w-10 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-3">Transaction ID</th>
                <th className="px-3">Customer</th>
                <th className="px-3">Product / Service</th>
                <th className="px-3">Status</th>
                <th className="px-3 text-center">Qty</th>
                <th className="px-3 text-right">Unit Price</th>
                <th className="px-3 text-right">Total Revenue</th>
                <th className="w-10 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-24 text-center text-xs text-zinc-400 font-mono" style={MONO}>
                    Aucune transaction ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isChecked = selectedIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={cn(
                        'h-11 hover:bg-zinc-50/80 transition-colors',
                        isChecked && 'bg-zinc-50'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(tx.id)}
                          className="rounded border-zinc-300 text-zinc-900 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Transaction ID */}
                      <td className="px-3 font-mono font-medium text-zinc-600 whitespace-nowrap" style={MONO}>
                        {tx.id}
                      </td>

                      {/* Customer Name + Avatar */}
                      <td className="px-3">
                        <div className="flex items-center gap-2 min-w-[150px]">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0',
                              tx.avatarBg
                            )}
                          >
                            {tx.customerInitials}
                          </div>
                          <span className="font-medium text-zinc-900 truncate">
                            {tx.customerName}
                          </span>
                        </div>
                      </td>

                      {/* Product / Service */}
                      <td className="px-3 text-zinc-600 max-w-[240px] truncate">
                        {tx.product}
                      </td>

                      {/* Status Pill Badge */}
                      <td className="px-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border font-mono tracking-wide uppercase',
                            tx.status === 'Success' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            tx.status === 'Pending' && 'bg-amber-50 text-amber-700 border-amber-200',
                            tx.status === 'Refunded' && 'bg-zinc-100 text-zinc-600 border-zinc-200'
                          )}
                          style={MONO}
                        >
                          {tx.status}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="px-3 text-center font-mono text-zinc-600" style={MONO}>
                        {tx.qty}
                      </td>

                      {/* Unit Price */}
                      <td className="px-3 text-right font-mono text-zinc-600 whitespace-nowrap" style={MONO}>
                        ${tx.unitPrice.toLocaleString()} CAD
                      </td>

                      {/* Total Revenue */}
                      <td className="px-3 text-right font-mono font-bold text-zinc-900 whitespace-nowrap" style={MONO}>
                        ${tx.totalRevenue.toLocaleString()} CAD
                      </td>

                      {/* Actions */}
                      <td className="px-3 text-center">
                        <button
                          className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          title="Options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Add Transaction Modal Dialog ───────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Nouvelle Transaction</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Nom du Client / Entreprise</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bistro Laurent"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Produit ou Service</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Setup QR Flow SaaS + Menu"
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Montant ($ CAD)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full h-9 px-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 font-mono"
                    style={MONO}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-700 mb-1">Statut Initial</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'Success' | 'Pending' | 'Refunded')}
                    className="w-full h-9 px-3 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                  >
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-9 px-3.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold shadow-2xs transition-colors"
                >
                  Ajouter la transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
