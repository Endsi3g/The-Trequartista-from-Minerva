'use client';

import React from 'react';
import Link from 'next/link';
import { PageFadeIn } from '@/components/ui/page-transition';
import { MinervaTriRing } from './MinervaTriRing';
import { PrescriptiveActionCard } from './PrescriptiveActionCard';
import { MinervaTerritoryLiveMap } from './MinervaTerritoryLiveMap';
import { MinervaDailyBriefCarousel } from './MinervaDailyBriefCarousel';
import { MinervaAiContextBanner } from './MinervaAiContextBanner';
import { Radio, Flame, Sparkles, ArrowLeft } from 'lucide-react';
import type { Lead, Client, Project, Task } from '@/lib/types';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MomentumLiveTabProps {
  leads?: Lead[];
  clients?: Client[];
  projects?: Project[];
  tasks?: Task[];
}

export function MomentumLiveTab({
  leads = [],
  clients = [],
  projects = [],
  tasks = [],
}: MomentumLiveTabProps) {
  return (
    <PageFadeIn className="w-full max-w-7xl mx-auto space-y-5 font-sans pb-12">
      {/* ── En-tête Contextuel (Screenshot Test Ready) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div className="space-y-0.5">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span>Overview</span>
            <span>/</span>
            <span className="text-[#08090a] font-medium">Momentum & Live Cockpit</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#08090a] tracking-tight">
              Tableau de Bord Haute Vélocité & Télémétrie
            </h1>
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium"
              style={MONO}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c8c5e] animate-pulse" />
              Télémétrie Connectée
            </span>
          </div>
        </div>

        {/* Global Streak Pill & Navigation Back */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-zinc-50 border border-[#f2f2f2] px-3 py-1.5 rounded text-xs">
            <Flame size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-zinc-600">Série Collective :</span>
            <span className="font-mono font-bold text-[#08090a]" style={MONO}>
              7 Jours Consécutifs
            </span>
          </div>

          <Link
            href="/overview"
            className="h-8 px-3 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} className="text-zinc-500" />
            <span>Cockpit Métier</span>
          </Link>
        </div>
      </div>

      {/* ── ROW 1: Signature Metric (Tri-Ring) & Prescriptive Actions (2 Colonnes) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex flex-col">
          <MinervaTriRing
            acquisitionPct={82}
            retentionPct={94}
            techPct={100}
            streakDays={7}
          />
        </div>
        <div className="lg:col-span-7 flex flex-col">
          <PrescriptiveActionCard />
        </div>
      </div>

      {/* ── ROW 2: Embedded AI Context Engine Explanation Banner ── */}
      <MinervaAiContextBanner />

      {/* ── ROW 3: Spatial Territory Live Map & Consumable Daily Brief ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 flex flex-col">
          <MinervaTerritoryLiveMap />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <MinervaDailyBriefCarousel />
        </div>
      </div>
    </PageFadeIn>
  );
}
