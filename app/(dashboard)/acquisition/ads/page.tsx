'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowRight,
  ExternalLink,
  Plus,
  Play,
  Pause,
  Filter,
  Search,
  Sparkles,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PaidCampaign {
  id: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  status: 'active' | 'paused' | 'draft';
  budget_daily_cad: number;
  spent_monthly_cad: number;
  leads_count: number;
  cost_per_lead_cad: number;
  roas: number;
  target_audience: string;
}

const INITIAL_CAMPAIGNS: PaidCampaign[] = [
  {
    id: 'camp-1',
    name: 'Campagne Restos Montréal — Offre Découverte Flow 0%',
    platform: 'meta',
    status: 'active',
    budget_daily_cad: 45.0,
    spent_monthly_cad: 1250.0,
    leads_count: 38,
    cost_per_lead_cad: 32.89,
    roas: 4.2,
    target_audience: 'Propriétaires de restaurants & gérants (Rayon 15 km)',
  },
  {
    id: 'camp-2',
    name: 'Google Search Ads — "Système commande restaurant Montréal"',
    platform: 'google',
    status: 'active',
    budget_daily_cad: 35.0,
    spent_monthly_cad: 980.0,
    leads_count: 24,
    cost_per_lead_cad: 40.83,
    roas: 3.8,
    target_audience: 'Mots-clés intentionnels POS & Menu QR',
  },
  {
    id: 'camp-3',
    name: 'TikTok Ads — Hook Reels Culinaires & Viralité Food',
    platform: 'tiktok',
    status: 'active',
    budget_daily_cad: 25.0,
    spent_monthly_cad: 620.0,
    leads_count: 19,
    cost_per_lead_cad: 32.63,
    roas: 3.1,
    target_audience: 'Restaurateurs indépendants 25-50 ans',
  },
  {
    id: 'camp-4',
    name: 'Retargeting Visiteurs Web — Vidéo Témoignage Client',
    platform: 'meta',
    status: 'paused',
    budget_daily_cad: 15.0,
    spent_monthly_cad: 280.0,
    leads_count: 11,
    cost_per_lead_cad: 25.45,
    roas: 5.4,
    target_audience: 'Visiteurs site web 30 derniers jours',
  },
];

export default function AcquisitionAdsPage() {
  const [campaigns, setCampaigns] = useState<PaidCampaign[]>(INITIAL_CAMPAIGNS);
  const [platformFilter, setPlatformFilter] = useState<'all' | 'meta' | 'google' | 'tiktok'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchPlat = platformFilter === 'all' || c.platform === platformFilter;
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.target_audience.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPlat && matchSearch;
    });
  }, [campaigns, platformFilter, searchQuery]);

  const totalSpent = useMemo(() => campaigns.reduce((acc, c) => acc + c.spent_monthly_cad, 0), [campaigns]);
  const totalLeads = useMemo(() => campaigns.reduce((acc, c) => acc + c.leads_count, 0), [campaigns]);
  const blendedCac = totalLeads > 0 ? Math.round((totalSpent / totalLeads) * 100) / 100 : 0;
  const avgRoas = campaigns.length > 0 ? Math.round((campaigns.reduce((acc, c) => acc + c.roas, 0) / campaigns.length) * 10) / 10 : 0;

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    );
  };

  return (
    <PageFadeIn className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header & Navigation Hub ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Acquisition Payante</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Meta • Google • TikTok
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
            Campagnes Publicitaires & Performance Ads
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft max-w-2xl">
            Gestion du budget média payant, suivi du coût par prospect (CAC/CPL) et attribution directe des leads générés pour l’agence.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/acquisition/organic"
            className="h-8 px-3 rounded-lg border border-mv-border bg-mv-cream-soft hover:border-mv-green text-xs font-semibold text-mv-ink flex items-center gap-1.5 transition-colors"
          >
            <span>Voir l’Organique (SEO)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/acquisition"
            className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Hub Acquisition</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Performance Metric Ribbons ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Dépenses Média (Mois)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={totalSpent} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              CAD
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Budget maîtrisé sur 3 canaux</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Leads Qualifiés Générés</span>
            <Users className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={totalLeads} />
            </span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded">
              +18% ce mois
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Directement transmis aux SDR</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Coût Moyen par Lead (CPL)</span>
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              {blendedCac.toFixed(2)} $
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              Target &lt; 45 $
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Objectif d’acquisition respecté</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>ROAS Moyen Estimé</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700 font-mono" style={MONO}>
              {avgRoas}x
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
              Multiplicateur
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Retour sur dépenses publicitaires</p>
        </div>
      </div>

      {/* ── 3. Filters and Search ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une campagne ou cible..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'meta', 'google', 'tiktok'] as const).map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer capitalize whitespace-nowrap',
                platformFilter === plat
                  ? 'bg-zinc-900 text-white shadow-2xs'
                  : 'bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink border border-mv-border'
              )}
            >
              {plat === 'all' ? 'Toutes plateformes' : plat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Campaigns List (Responsive Table / Mobile Cards) ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl overflow-hidden shadow-mv-sm">
        {/* Desktop Table View */}
        <table className="hidden sm:table w-full text-xs border-collapse">
          <thead>
            <tr className="h-8 bg-zinc-50/70 border-b border-mv-border text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
              <th className="pl-4 pr-2 text-left">Campagne</th>
              <th className="px-2 text-left">Plateforme</th>
              <th className="px-2 text-left">Audience Cible</th>
              <th className="px-2 text-right">Budget / jour</th>
              <th className="px-2 text-right">Dépensé</th>
              <th className="px-2 text-right">Leads</th>
              <th className="px-2 text-right">CPL</th>
              <th className="px-2 text-right">ROAS</th>
              <th className="pr-4 pl-2 text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mv-border">
            {filteredCampaigns.map((camp) => (
              <tr key={camp.id} className="h-12 hover:bg-black/[0.015] transition-colors">
                <td className="pl-4 pr-2 py-2 max-w-[240px]">
                  <span className="font-bold text-zinc-900 block truncate">{camp.name}</span>
                </td>
                <td className="px-2 py-2 uppercase font-bold text-[10px]">
                  <Badge
                    variant={camp.platform === 'meta' ? 'blue' : camp.platform === 'google' ? 'amber' : 'purple'}
                  >
                    {camp.platform}
                  </Badge>
                </td>
                <td className="px-2 py-2 text-zinc-600 truncate max-w-[200px]">
                  {camp.target_audience}
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold" style={MONO}>
                  {camp.budget_daily_cad.toFixed(2)} $
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold" style={MONO}>
                  {camp.spent_monthly_cad.toLocaleString('fr-CA')} $
                </td>
                <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700" style={MONO}>
                  {camp.leads_count}
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold" style={MONO}>
                  {camp.cost_per_lead_cad.toFixed(2)} $
                </td>
                <td className="px-2 py-2 text-right font-mono font-bold text-purple-700" style={MONO}>
                  {camp.roas}x
                </td>
                <td className="pr-4 pl-2 py-2 text-right">
                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors',
                      camp.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                  >
                    {camp.status === 'active' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        <span>Actif</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        <span>En pause</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Stacked Cards View (< 640px) */}
        <div className="block sm:hidden divide-y divide-mv-border">
          {filteredCampaigns.map((camp) => (
            <div key={camp.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={camp.platform === 'meta' ? 'blue' : camp.platform === 'google' ? 'amber' : 'purple'}
                  className="uppercase text-[10px]"
                >
                  {camp.platform}
                </Badge>
                <button
                  onClick={() => toggleCampaignStatus(camp.id)}
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer',
                    camp.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                  )}
                >
                  {camp.status === 'active' ? '● Actif' : '○ En pause'}
                </button>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-900">{camp.name}</h4>
                <p className="text-[10.5px] text-zinc-500 mt-0.5">{camp.target_audience}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-zinc-50/60 p-2 rounded-lg border border-mv-border text-center font-mono" style={MONO}>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Budget</span>
                  <span className="text-xs font-bold text-zinc-800">{camp.spent_monthly_cad} $</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Leads</span>
                  <span className="text-xs font-bold text-emerald-700">{camp.leads_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">ROAS</span>
                  <span className="text-xs font-bold text-purple-700">{camp.roas}x</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageFadeIn>
  );
}
