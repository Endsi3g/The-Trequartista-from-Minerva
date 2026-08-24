'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Utensils,
  DollarSign,
  TrendingUp,
  Percent,
  Sparkles,
  ExternalLink,
  Clock,
  CheckCircle2,
  ChefHat,
  ShoppingBag,
  ArrowUpRight,
  Flame,
  Zap,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { fetchMinervaFlowResults } from '@/lib/services/supabase-data';
import type { MinervaFlowResults, MinervaFlowOrderItem, MinervaFlowLiveTicket } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type PeriodKey = '7d' | '30d' | '90d' | 'ytd';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  'ytd': 'Année 2026 (YTD)',
};

interface MinervaFlowResultsCardProps {
  clientId?: string;
  className?: string;
}

export function MinervaFlowResultsCard({ clientId = 'default', className }: MinervaFlowResultsCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [data, setData] = useState<MinervaFlowResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kpi' | 'items' | 'tickets'>('kpi');
  const [liveTicketFeed, setLiveTicketFeed] = useState<MinervaFlowLiveTicket[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetchMinervaFlowResults(clientId, selectedPeriod);
      setData(res);
      setLiveTicketFeed(res.recentTickets);
      setLoading(false);
    })();
  }, [clientId, selectedPeriod]);

  // Periodic subtle live tick for recent orders demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTicketFeed((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        // Rotate first item status if en_cuisine -> prêt
        if (updated[0] && updated[0].prepStatus === 'en_cuisine') {
          updated[0] = { ...updated[0], prepStatus: 'prêt', timestamp: 'À l’instant' };
        }
        return updated;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const formattedGross = useMemo(() => {
    return (data?.grossVolume || 12840).toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [data]);

  const formattedSavings = useMemo(() => {
    return (data?.directSavings || 3852).toLocaleString('fr-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [data]);

  return (
    <Card className={cn('overflow-hidden border-zinc-200/80 shadow-sm bg-white', className)}>
      {/* ── 1. Header with Minerva-Flow Brand & Period Filter ── */}
      <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-r from-emerald-950/[0.03] via-transparent to-emerald-900/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <Utensils className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight font-display">
                  Mes résultats • Minerva-Flow
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  0 % Commission Directe
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Flux des commandes digitalisées, économies de marge préservées et performance du menu en direct.
            </p>
          </div>

          {/* Period selector pills */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100/90 rounded-lg border border-zinc-200/60 text-xs">
            {(['7d', '30d', '90d', 'ytd'] as PeriodKey[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                  selectedPeriod === period
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                {period === '7d' ? '7j' : period === '30d' ? '30j' : period === '90d' ? '90j' : 'YTD'}
              </button>
            ))}
          </div>
        </div>

        {/* ── 2. Top Highlight KPIs Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          {/* Card 1: Économies nettes de commission (The big value prop) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Économies 0 % Préservées</span>
              <Percent className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 tracking-tight" style={MONO}>
              +{formattedSavings} $
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-800/80">
              <span className="font-semibold text-emerald-700">30 % conservés</span> vs plateformes tierces
            </div>
          </div>

          {/* Card 2: Chiffre d'Affaires Direct */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">CA Direct Encaissé</span>
              <DollarSign className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 tracking-tight" style={MONO}>
              {formattedGross} $
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+{data?.growthPct || 24.8} % de croissance</span>
            </div>
          </div>

          {/* Card 3: Total Commandes Directes */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Commandes Directes</span>
              <ShoppingBag className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 tracking-tight" style={MONO}>
              {data?.totalOrders || 342}
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Panier moyen direct : <span className="font-semibold text-zinc-800" style={MONO}>{data?.averageOrderValue || 37.54} $</span>
            </div>
          </div>

          {/* Card 4: Délai Moyen Cuisine */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <div className="flex items-center justify-between text-zinc-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Délai Préparation</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-zinc-900 tracking-tight" style={MONO}>
              {data?.averagePrepTimeMinutes || 18} min
            </div>
            <div className="mt-1 text-[11px] text-zinc-500">
              Protocole test en direct : <span className="font-semibold text-emerald-600">Optimal</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Interactive Sub-Tabs: Graphique Évolution / Top Plats / Tickets en direct ── */}
      <div className="px-5 sm:px-6 pt-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/40">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('kpi')}
            className={cn(
              'pb-3 px-1 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'kpi'
                ? 'border-emerald-600 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Évolution des Économies & CA</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('items')}
            className={cn(
              'pb-3 px-1 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'items'
                ? 'border-emerald-600 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Top Plats Digitalisés ({data?.popularItems.length || 5})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={cn(
              'pb-3 px-1 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'tickets'
                ? 'border-emerald-600 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bons Cuisine en Direct</span>
          </button>
        </div>

        <Link
          href="/minerva-flow"
          className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 pb-3 transition-colors"
        >
          <span>Tester le menu démo</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* ── 4. Tab Contents ── */}
      <div className="p-5 sm:p-6">
        {/* Tab 1: Graphique Timeline */}
        {activeTab === 'kpi' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span>Économies 0% générées ($)</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <span className="w-3 h-3 rounded-full bg-zinc-300 inline-block" />
                  <span>Volume CA ($)</span>
                </div>
              </div>
              <span className="text-zinc-400 text-[11px]">
                Données actualisées en temps réel depuis le moteur Minerva-Flow
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.timeline || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    axisLine={{ stroke: '#e4e4e7' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#71717a' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v} $`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-zinc-900 text-white rounded-lg p-2.5 text-xs shadow-xl border border-zinc-800 space-y-1">
                          <div className="font-bold text-zinc-200">{label}</div>
                          <div className="text-emerald-400 font-semibold" style={MONO}>
                            Économies : +{d.savings} $
                          </div>
                          <div className="text-zinc-300" style={MONO}>
                            CA : {d.revenue} $ ({d.orders} commandes)
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#71717a"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Top Plats Digitalisés */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.popularItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 hover:border-emerald-300/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-200 shrink-0 overflow-hidden relative border border-zinc-200">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-xs">
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-900 truncate">{item.name}</span>
                      <span className="text-xs font-bold text-zinc-800 shrink-0" style={MONO}>
                        {item.price.toFixed(2)} $
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">{item.category}</div>
                    <div className="mt-1 flex items-center justify-between text-[10.5px]">
                      <span className="text-zinc-600 font-medium">{item.orderCount} commandes directes</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded" style={MONO}>
                        +{item.savingsGenerated.toFixed(2)} $ sauvés
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Bons Cuisine en Direct */}
        {activeTab === 'tickets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Flux d&apos;impression et tickets synchronisés</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2">
              {liveTicketFeed.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-100/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      {ticket.orderNumber.replace('#MF-', '')}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{ticket.orderNumber}</span>
                        <span className="text-[11px] text-zinc-500">• {ticket.customerName}</span>
                        <span className="text-[10.5px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-medium">
                          {ticket.pickupType}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-600 truncate">
                        {ticket.items.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-900" style={MONO}>
                        {ticket.totalAmount.toFixed(2)} $
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        +{ticket.savingsAmount.toFixed(2)} $ préservés
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10.5px] font-bold',
                        ticket.prepStatus === 'en_cuisine'
                          ? 'bg-amber-100 text-amber-800'
                          : ticket.prepStatus === 'prêt'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      )}
                    >
                      {ticket.prepStatus === 'en_cuisine'
                        ? 'En cuisine'
                        : ticket.prepStatus === 'prêt'
                        ? 'Prêt au comptoir'
                        : 'Complété'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Bottom Callout Footer ── */}
      <div className="px-5 py-3 bg-zinc-50/80 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            Votre passerelle de commande directe est active. <strong>0% de frais</strong> appliqués sur chaque repas.
          </span>
        </div>
        <Link
          href="/minerva-flow"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <span>Ouvrir l&apos;interface de commande</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
}
