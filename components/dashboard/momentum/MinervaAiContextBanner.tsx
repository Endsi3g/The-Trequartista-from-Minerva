'use client';

import React from 'react';
import { Sparkles, ArrowRight, TrendingUp, Lightbulb } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MinervaAiContextBannerProps {
  summaryText?: string;
  contextTag?: string;
}

export function MinervaAiContextBanner({
  summaryText,
  contextTag = 'ANALYSE DU JOUR • VÉLOCITÉ +24%',
}: MinervaAiContextBannerProps) {
  const defaultSummary =
    summaryText ||
    'Pic d’accélération détecté sur l’axe Montréal (+35% de commandes directes sur les tables Minerva Flow). Les 3 anneaux d’élan progressent en avance de 24h sur les jalons hebdomadaires. Recommandation : capitaliser sur ce momentum pour convertir les 6 propositions en attente avant 18h.';

  const handleOpenAiAssistant = () => {
    triggerHaptic('medium');
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'j', metaKey: true, bubbles: true })
    );
  };

  return (
    <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 rounded bg-purple-100 border border-purple-300 text-[#7c3aed] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={16} />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7c3aed] font-semibold" style={MONO}>
              {contextTag}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
              • Moteur Contextuel IA
            </span>
          </div>
          <p className="text-xs text-zinc-700 leading-relaxed max-w-4xl">
            {defaultSummary}
          </p>
        </div>
      </div>

      <div className="shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleOpenAiAssistant}
          className="h-8 px-3 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
        >
          <span>Explorer avec l&apos;IA</span>
          <kbd className="hidden sm:inline-block text-[9.5px] bg-zinc-700 text-zinc-200 px-1 py-0.2 rounded font-mono ml-0.5">
            ⌘J
          </kbd>
        </button>
      </div>
    </div>
  );
}
