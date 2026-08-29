'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import {
  Utensils,
  ExternalLink,
  Sparkles,
  TrendingUp,
  DollarSign,
  Store,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Calculator,
  QrCode,
  ArrowRight,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import {
  fetchFlowRestaurants,
  computeFlowTelemetrySummary,
  calculateCommissionSavings,
  DEFAULT_COMMISSION_RATE_PCT,
} from '@/lib/services/minerva-flow';
import type { MinervaFlowRestaurant, FlowTelemetrySummary } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function MinervaFlowSupervisionPage() {
  const { toastSuccess } = useToast();
  const [restaurants, setRestaurants] = useState<MinervaFlowRestaurant[]>([]);
  const [summary, setSummary] = useState<FlowTelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'restaurants' | 'calculator' | 'upsells'>('restaurants');

  // Calculator State
  const [calcVolume, setCalcVolume] = useState<number>(20000);
  const [calcRate, setCalcRate] = useState<number>(DEFAULT_COMMISSION_RATE_PCT);
  const [calcRestoName, setCalcRestoName] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flow/telemetry');
      const data = await res.json();
      if (data.restaurants) {
        setRestaurants(data.restaurants);
        setSummary(data.summary || computeFlowTelemetrySummary(data.restaurants));
      }
    } catch {
      const fallback = await fetchFlowRestaurants();
      setRestaurants(fallback);
      setSummary(computeFlowTelemetrySummary(fallback));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.address || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [restaurants, searchQuery, typeFilter]);

  const calcResult = useMemo(() => {
    return calculateCommissionSavings(calcVolume, calcRate);
  }, [calcVolume, calcRate]);

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Top Header Banner ── */}
      <div className="bg-gradient-to-r from-mv-green-darker via-emerald-900 to-zinc-900 border border-mv-green/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-mv-md">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-mv-green/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-mv-green/20 border border-mv-green/40 flex items-center justify-center text-mv-green">
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold font-display tracking-tight text-white">
                Minerva Flow (SaaS) & Hub Restauration
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold animate-pulse">
                ● LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-zinc-300 max-w-2xl">
              Supervision des restaurants connectés à{' '}
              <a href="https://minerva-flow.vercel.app/overview" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">
                minerva-flow.vercel.app
              </a>{' '}
              et passerelle de croissance avec la vitrine Framer{' '}
              <a href="https://minervaflow.framer.website/" target="_blank" rel="noopener noreferrer" className="text-emerald-300 underline font-semibold">
                minervaflow.framer.website
              </a>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
              <span>Actualiser</span>
            </Button>
            <a
              href="https://minerva-flow.vercel.app/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mv-green text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <span>Ouvrir Minerva Flow</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Telemetry Continuous Ribbon (4 Monolithic KPIs) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: CA Traité 30j */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>CA Traité (30j)</span>
            <DollarSign className="w-4 h-4 text-mv-green" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={summary?.total_revenue_processed_cad ?? 0} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Direct
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Volume de commandes via les QR menus & POS</p>
        </div>

        {/* KPI 2: Commissions Économisées */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Commissions Sauvegardées</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono" style={MONO}>
              <AnimatedNumber value={summary?.total_commissions_saved_cad ?? 0} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              ~28%
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Économies nettes vs UberEats & DoorDash</p>
        </div>

        {/* KPI 3: MRR SaaS Actif */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>MRR SaaS Flow</span>
            <TrendingUp className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={summary?.mrr_saas_cad ?? 0} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              / mois
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">{summary?.active_restaurants ?? 0} établissement{(summary?.active_restaurants ?? 0) > 1 ? 's' : ''} payant{(summary?.active_restaurants ?? 0) > 1 ? 's' : ''}</p>
        </div>

        {/* KPI 4: Opportunités Upsell Studio */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Opportunités Studio</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-600 font-mono" style={MONO}>
              {summary?.upsell_opportunities_count ?? 0}
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              À pitcher
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Packs Reels 4K & Campagnes Ads à débloquer</p>
        </div>
      </div>

      {/* ── 3. Navigation Tabs (Restaurants, Simulateur de Commissions, Matrice Upsell) ── */}
      <div className="flex items-center justify-between border-b border-mv-border pb-3">
        <div className="flex items-center gap-1.5 bg-mv-surface p-1 rounded-xl border border-mv-border">
          <button
            onClick={() => setActiveTab('restaurants')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'restaurants'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Restaurants Connectés ({restaurants.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'calculator'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Simulateur Commissions Inbound</span>
          </button>
          <button
            onClick={() => setActiveTab('upsells')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
              activeTab === 'upsells'
                ? 'bg-mv-green text-white shadow-sm'
                : 'text-mv-ink-soft hover:text-mv-ink'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matrice Upsell Studio</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: RESTAURANTS CONNECTÉS ── */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-mv-surface p-3 rounded-xl border border-mv-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, propriétaire, rue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-semibold text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
              >
                <option value="all">Tous les types</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Café & Torréfacteur</option>
                <option value="bistro">Bistro & Bar</option>
                <option value="boulangerie">Boulangerie</option>
              </select>
            </div>
          </div>

          {/* Restaurants Grid / Cards */}
          {filteredRestaurants.length === 0 ? (
            <Card className="p-12 text-center bg-mv-surface border-mv-border rounded-xl space-y-3 shadow-xs">
              <Utensils className="w-10 h-10 text-mv-ink-faint mx-auto opacity-50" />
              <h3 className="text-sm font-bold text-mv-ink">Aucun restaurant partenaire connecté</h3>
              <p className="text-xs text-mv-ink-soft max-w-md mx-auto">
                Connectez vos premiers restaurants partenaires ou utilisez le simulateur pour quantifier les économies de commissions de vos prospects.
              </p>
              <Button
                onClick={() => setActiveTab('calculator')}
                className="bg-mv-green hover:bg-mv-green/90 text-white text-xs font-semibold gap-1.5 cursor-pointer mt-2"
              >
                <Calculator size={14} />
                <span>Ouvrir le simulateur de commissions</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRestaurants.map((resto) => (
                <Card key={resto.id} className="p-5 space-y-4 hover:border-mv-green/40 transition-all bg-mv-surface border-mv-border rounded-xl shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-mv-ink font-display">{resto.name}</h3>
                        <Badge variant={resto.status === 'active' ? 'green' : resto.status === 'churn_risk' ? 'amber' : 'neutral'}>
                          {resto.status === 'active' ? 'Actif' : resto.status === 'churn_risk' ? 'Risque Churn' : resto.status}
                        </Badge>
                        <Badge variant="blue">Score {resto.health_score}/100</Badge>
                      </div>
                      <p className="text-xs text-mv-ink-soft mt-1">{resto.address}</p>
                    </div>
                    <span className="font-mono font-extrabold text-xs text-mv-green bg-mv-green/10 px-2 py-1 rounded-md">
                      {resto.mrr_plan_cad} $/mo
                    </span>
                  </div>

                  {/* Metrics ribbon for restaurant */}
                  <div className="grid grid-cols-3 gap-2 bg-mv-cream-soft p-2.5 rounded-xl border border-mv-border text-center">
                    <div>
                      <span className="text-[10.5px] text-mv-ink-soft block font-medium">Commandes 30j</span>
                      <span className="font-mono font-bold text-xs text-mv-ink" style={MONO}>
                        {resto.orders_count_30d.toLocaleString('fr-CA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-mv-ink-soft block font-medium">CA Traité</span>
                      <span className="font-mono font-bold text-xs text-mv-ink" style={MONO}>
                        {resto.revenue_volume_30d.toLocaleString('fr-CA')} $
                      </span>
                    </div>
                    <div>
                      <span className="text-[10.5px] text-emerald-700 block font-medium">Économisé</span>
                      <span className="font-mono font-bold text-xs text-emerald-600" style={MONO}>
                        +{resto.commission_saved_30d.toLocaleString('fr-CA')} $
                      </span>
                    </div>
                  </div>

                  {/* Contact & Upsell */}
                  <div className="flex items-center justify-between pt-2 border-t border-mv-border text-xs">
                    <span className="text-mv-ink-soft">
                      Propriétaire : <strong className="text-mv-ink font-semibold">{resto.owner_name}</strong>
                    </span>
                    {resto.has_studio_upsell ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Client Studio
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveTab('upsells');
                          toastSuccess('Opportunité Studio', `Pitch de packs suggéré pour ${resto.name}.`);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-amber-600" /> Pitcher Studio
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SIMULATEUR COMMISSIONS INBOUND ── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Input sliders */}
          <Card className="lg:col-span-6 p-6 space-y-6">
            <div>
              <h2 className="font-extrabold text-base text-mv-ink font-display">Calculateur de Pertes UberEats & DoorDash</h2>
              <p className="text-xs text-mv-ink-soft mt-1">
                Générez un rapport d’économies sur mesure pour vos rendez-vous de prospection ou vos leads Framer.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du restaurant / prospect</label>
                <input
                  type="text"
                  placeholder="Ex: Le Petit Bistro Gourmand"
                  value={calcRestoName}
                  onChange={(e) => setCalcRestoName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-mv-ink mb-1.5">
                  <span>Volume de ventes mensuelles en livraison (CAD)</span>
                  <span className="font-mono text-mv-green text-sm">{calcVolume.toLocaleString('fr-CA')} $ / mois</span>
                </div>
                <input
                  type="range"
                  min="3000"
                  max="100000"
                  step="1000"
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-mv-ink-faint font-mono mt-1">
                  <span>3 000 $</span>
                  <span>50 000 $</span>
                  <span>100 000 $</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-mv-ink mb-1.5">
                  <span>Taux de commission moyen de la plateforme</span>
                  <span className="font-mono text-mv-ink text-sm">{calcRate} %</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full accent-mv-green cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-mv-ink-faint font-mono mt-1">
                  <span>15% (Retrait)</span>
                  <span>28% (Standard QC)</span>
                  <span>35% (Premium)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Right: Results Breakdown */}
          <Card className="lg:col-span-6 p-6 space-y-6 bg-gradient-to-br from-mv-surface to-emerald-50/40 border-emerald-200/60">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800">
                Diagnostic Financier Estimé
              </span>
              <h3 className="text-xl font-extrabold text-mv-ink font-display mt-0.5">
                {calcRestoName || 'Établissement Analysé'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200">
                <span className="text-[11px] font-semibold text-red-800 block">Commissions Perdues / An</span>
                <span className="text-xl font-extrabold text-red-600 font-mono" style={MONO}>
                  -{calcResult.annualCommissionPaidCad.toLocaleString('fr-CA')} $
                </span>
                <span className="text-[10px] text-red-700 block mt-0.5">
                  ~{calcResult.monthlyCommissionPaidCad.toLocaleString('fr-CA')} $/mois donnés aux apps
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-100/70 border border-emerald-300">
                <span className="text-[11px] font-semibold text-emerald-900 block">Économies Nettes avec Flow</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono" style={MONO}>
                  +{calcResult.netAnnualSavingsCad.toLocaleString('fr-CA')} $
                </span>
                <span className="text-[10px] text-emerald-800 block mt-0.5">
                  ROI de {calcResult.savingsRoiPercentage}% sur l'abonnement
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-mv-surface border border-mv-border space-y-2 text-xs">
              <div className="flex justify-between text-mv-ink-soft">
                <span>Coût annuel Minerva Flow (149 $/mois)</span>
                <span className="font-mono font-semibold text-mv-ink">1 788 $ CAD</span>
              </div>
              <div className="flex justify-between text-mv-ink-soft">
                <span>Part des ventes sauvée dans la trésorerie</span>
                <span className="font-mono font-semibold text-emerald-600">{(100 - calcRate)}% préservés</span>
              </div>
              <div className="pt-2 border-t border-mv-border flex justify-between font-bold text-mv-ink">
                <span>Gain net de marge pour le restaurant</span>
                <span className="font-mono text-emerald-700">+{calcResult.netAnnualSavingsCad.toLocaleString('fr-CA')} $ / an</span>
              </div>
            </div>

            <Link href={`/audit/resto/demo-flow-simulator`}>
              <Button variant="primary" className="w-full justify-center">
                <span>Visualiser la Page d’Audit Interactive Client</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </Card>
        </div>
      )}

      {/* ── TAB 3: MATRICE UPSELL STUDIO ── */}
      {activeTab === 'upsells' && (
        <div className="space-y-4">
          <div className="bg-mv-surface p-4 rounded-xl border border-mv-border flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-sm text-mv-ink font-display">Passerelle Agence & Studio — Minerva</h2>
              <p className="text-xs text-mv-ink-soft mt-0.5">
                Chaque restaurant équipé de Flow génère une opportunité naturelle de production vidéo Reels, de refonte de site Framer ou de campagnes Ads.
              </p>
            </div>
            <Link href="/invoices">
              <Button size="sm" variant="secondary" className="text-xs">
                <span>Créer Devis Studio</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 space-y-3 border-emerald-200/80 bg-gradient-to-b from-mv-surface to-emerald-50/20">
              <div className="flex items-center gap-2 text-mv-green font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Pack 8 Reels 4K</span>
              </div>
              <h3 className="font-extrabold text-base text-mv-ink">1 500 $ CAD</h3>
              <p className="text-xs text-mv-ink-soft leading-relaxed">
                Tournage cinéma des plats vedettes à Montréal + montage vertical pour TikTok & Instagram afin de remplir les tables du mardi au jeudi.
              </p>
              <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                Délai : 7 jours ouvrés
              </span>
            </Card>

            <Card className="p-5 space-y-3 border-blue-200/80 bg-gradient-to-b from-mv-surface to-blue-50/20">
              <div className="flex items-center gap-2 text-mv-blue font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Site Framer & Menu QR</span>
              </div>
              <h3 className="font-extrabold text-base text-mv-ink">2 800 $ CAD</h3>
              <p className="text-xs text-mv-ink-soft leading-relaxed">
                Refonte moderne et responsive sur Framer. Intégration de la carte interactive, Google Maps, réservation et click-to-WhatsApp.
              </p>
              <span className="inline-block text-[11px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                Délai : 14 jours ouvrés
              </span>
            </Card>

            <Card className="p-5 space-y-3 border-amber-200/80 bg-gradient-to-b from-mv-surface to-amber-50/20">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Campagne Ads 5 km</span>
              </div>
              <h3 className="font-extrabold text-base text-mv-ink">1 200 $ CAD / mo</h3>
              <p className="text-xs text-mv-ink-soft leading-relaxed">
                Acquisition locale ciblée sur Meta & Google pour capter la clientèle de bureau et de quartier autour de l'établissement.
              </p>
              <span className="inline-block text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                Délai : En continu 30j
              </span>
            </Card>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
