'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  MapPin,
  TrendingUp,
  Share2,
  Mail,
  Search,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Sparkles,
  BarChart,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface LocalRankingItem {
  keyword: string;
  location: string;
  rank: number;
  change: number;
  monthly_searches: number;
  status: 'top3' | 'page1' | 'improving';
}

const LOCAL_RANKINGS: LocalRankingItem[] = [
  { keyword: 'agence marketing restaurant montréal', location: 'Montréal, QC', rank: 2, change: +1, monthly_searches: 720, status: 'top3' },
  { keyword: 'menu qr code sans commission québec', location: 'Montréal, QC', rank: 1, change: 0, monthly_searches: 540, status: 'top3' },
  { keyword: 'production vidéo tiktok restaurant montréal', location: 'Montréal, QC', rank: 3, change: +2, monthly_searches: 890, status: 'top3' },
  { keyword: 'création site web framer montréal', location: 'Montréal, QC', rank: 4, change: +3, monthly_searches: 1200, status: 'page1' },
  { keyword: 'système pos pour café montréal', location: 'Montréal, QC', rank: 6, change: +4, monthly_searches: 410, status: 'page1' },
];

export default function AcquisitionOrganicPage() {
  const [rankings] = useState<LocalRankingItem[]>(LOCAL_RANKINGS);

  return (
    <PageFadeIn className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header & Switcher ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <Globe className="w-3.5 h-3.5" />
              <span>Acquisition Organique</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              SEO Local • Google Maps • Outbound • Contenu
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
            Croissance Organique & Référencement Naturel
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft max-w-2xl">
            Suivi des positions SEO locales à Montréal, performance de la fiche Google Maps et métriques d’engagement social.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/acquisition/ads"
            className="h-8 px-3 rounded-lg border border-mv-border bg-mv-cream-soft hover:border-mv-green text-xs font-semibold text-mv-ink flex items-center gap-1.5 transition-colors"
          >
            <span>Voir les Pubs Payantes</span>
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

      {/* ── 2. Metric Ribbons ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Vues Google Maps & Recherche</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={14250} />
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              +24%
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Impressions locales 30j</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Visites Site Web Organiques</span>
            <Eye className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={3840} />
            </span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded">
              Visiteurs
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Trafic direct & SEO</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Portée Vidéo Reels & TikTok</span>
            <Share2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700 font-mono" style={MONO}>
              <AnimatedNumber value={89400} />
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
              Vues 30j
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Viralité organique locale</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Taux de Réponse Outbound</span>
            <Mail className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700 font-mono" style={MONO}>
              18.4 %
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              22 RDV pris
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Séquences Reach ultra-ciblées</p>
        </div>
      </div>

      {/* ── 3. Local SEO Table ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-mv-ink flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              <span>Positions Mots-Clés Stratégiques (Google Local Pack Montréal)</span>
            </h2>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Suivi automatisé du classement organique pour capturer les restaurateurs qui cherchent activement.
            </p>
          </div>
          <Badge variant="green">5 mots-clés suivis</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="h-8 bg-zinc-50/70 border-b border-mv-border text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="pl-3 text-left">Mot-Clé / Requête</th>
                <th className="px-2 text-left">Localisation</th>
                <th className="px-2 text-right">Volume Rech. / mois</th>
                <th className="px-2 text-center">Position</th>
                <th className="pr-3 text-right">Évolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mv-border">
              {rankings.map((r, i) => (
                <tr key={i} className="h-10 hover:bg-black/[0.015] transition-colors">
                  <td className="pl-3 py-2 font-bold text-zinc-900">{r.keyword}</td>
                  <td className="px-2 py-2 text-zinc-500">{r.location}</td>
                  <td className="px-2 py-2 text-right font-mono text-zinc-700" style={MONO}>
                    {r.monthly_searches}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span
                      className={cn(
                        'inline-block w-6 h-6 rounded-full font-bold text-xs leading-6 text-center font-mono',
                        r.rank <= 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                      )}
                      style={MONO}
                    >
                      #{r.rank}
                    </span>
                  </td>
                  <td className="pr-3 py-2 text-right font-mono font-bold text-emerald-600" style={MONO}>
                    {r.change > 0 ? `+${r.change}` : r.change === 0 ? '=' : r.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageFadeIn>
  );
}
