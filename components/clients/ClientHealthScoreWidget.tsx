'use client';

import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Receipt, Layers, MessageSquare, AlertCircle } from 'lucide-react';
import type { ClientHealthBreakdown } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface ClientHealthScoreWidgetProps {
  health: ClientHealthBreakdown;
  className?: string;
}

export function ClientHealthScoreWidget({ health, className }: ClientHealthScoreWidgetProps) {
  const { score, tier, tier_label, factors, alerts } = health;

  const tierColors = {
    excellent: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      bar: 'bg-emerald-600',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    stable: {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-600',
      pill: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    warning: {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
      pill: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    critical: {
      text: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      bar: 'bg-rose-600',
      pill: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  }[tier];

  return (
    <div className={cn('bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('w-6 h-6 rounded-md flex items-center justify-center border', tierColors.bg, tierColors.border, tierColors.text)}>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-zinc-900 block leading-tight">
              Score de Santé &amp; Rétention Client
            </span>
            <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
              Algorithme prédictif anti-churn
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wider', tierColors.pill)} style={MONO}>
            {tier_label}
          </span>
          <span className="text-base font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Global Gauge Bar */}
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60 flex">
        <div
          className={cn('h-full transition-all duration-500', tierColors.bar)}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 4 Factor Sub-meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {/* Factor 1: Livrables */}
        <div className="p-2 rounded bg-zinc-50 border border-zinc-200/70 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono" style={MONO}>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>Livrables</span>
            </span>
            <span className="font-bold text-zinc-800">{factors.deliverables_score}/30</span>
          </div>
          <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full"
              style={{ width: `${(factors.deliverables_score / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 2: Facturation */}
        <div className="p-2 rounded bg-zinc-50 border border-zinc-200/70 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono" style={MONO}>
            <span className="flex items-center gap-1">
              <Receipt className="w-3 h-3 text-zinc-400" />
              <span>Facturation</span>
            </span>
            <span className="font-bold text-zinc-800">{factors.invoices_score}/30</span>
          </div>
          <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${(factors.invoices_score / 30) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 3: ROI & Flow */}
        <div className="p-2 rounded bg-zinc-50 border border-zinc-200/70 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono" style={MONO}>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-zinc-400" />
              <span>ROI &amp; Flow</span>
            </span>
            <span className="font-bold text-zinc-800">{factors.roi_score}/20</span>
          </div>
          <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${(factors.roi_score / 20) * 100}%` }}
            />
          </div>
        </div>

        {/* Factor 4: Engagement */}
        <div className="p-2 rounded bg-zinc-50 border border-zinc-200/70 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono" style={MONO}>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-zinc-400" />
              <span>Engagement</span>
            </span>
            <span className="font-bold text-zinc-800">{factors.engagement_score}/20</span>
          </div>
          <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(factors.engagement_score / 20) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Churn Risk Alerts or All-Clear */}
      <div className="pt-1">
        {alerts.length > 0 ? (
          <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Signaux à traiter pour sécuriser la rétention :</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-amber-900/90 pl-1 space-y-0.5">
              {alerts.map((alt, idx) => (
                <li key={idx}>{alt}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-2 rounded bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tous les voyants de rétention sont au vert. Aucune anomalie détectée.</span>
          </div>
        )}
      </div>
    </div>
  );
}
