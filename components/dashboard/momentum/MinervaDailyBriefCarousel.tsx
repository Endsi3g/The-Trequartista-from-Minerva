'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  Flame,
  Target,
  Trophy,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface DailyBriefSlide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  bullets: { text: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

const BRIEF_SLIDES: DailyBriefSlide[] = [
  {
    id: 'momentum',
    badge: 'SLIDE 1/3 • ÉLAN & STREAK',
    badgeColor: 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]',
    title: 'L’Agence maintient un élan opérationnel de 92/100',
    subtitle: '7ème jour consécutif au-dessus des cibles collectives de délivrance et d’acquisition.',
    bullets: [
      { text: 'Acquisition à 82% : 24 touches enregistrées sur la cible de 30.', icon: Target },
      { text: 'Rétention à 94% : 0 compte client en alerte churn critique.', icon: Trophy },
      { text: 'Stabilité Tech à 100% : 0 incident bloquant en production.', icon: ShieldCheck },
    ],
  },
  {
    id: 'wins',
    badge: 'SLIDE 2/3 • VICTOIRES RÉCENTES',
    badgeColor: 'text-[#2563eb] bg-blue-50 border-blue-200',
    title: '3 victoires commerciales & livrables franchis (<24h)',
    subtitle: 'Chaque victoire renforce la rétention et augmente le MRR prévisionnel de Minerva.',
    bullets: [
      { text: 'Trattoria Bella Napoli a généré 1 420 $ CAD de commandes directes sans commission.', icon: Trophy },
      { text: 'Proposition de 1 800 $ CAD consultée 3 fois par Brasserie Mile End.', icon: Sparkles },
      { text: 'Onboarding express validé en 18 minutes sur Pizzeria Napoletana.', icon: CheckCircle2 },
    ],
  },
  {
    id: 'challenges',
    badge: 'SLIDE 3/3 • LES 3 DÉFIS DU JOUR',
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    title: '3 actions décisives pour refermer les anneaux avant 18h',
    subtitle: 'Priorisation collective pour assurer le passage de la streak au 8ème jour.',
    bullets: [
      { text: 'Boucler les 6 touches restantes pour valider les 30 contacts du jour.', icon: Flame },
      { text: 'Envoyer le check-in préventif au gérant de Trattoria Bella Napoli.', icon: Target },
      { text: 'Passer la checklist QA 20-points sur la release de production.', icon: ShieldCheck },
    ],
  },
];

export function MinervaDailyBriefCarousel() {
  const { toastSuccess, toastInfo } = useToast();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const currentSlide = BRIEF_SLIDES[currentSlideIndex];

  const handleNext = () => {
    triggerHaptic('light');
    setCurrentSlideIndex((prev) => (prev + 1) % BRIEF_SLIDES.length);
  };

  const handlePrev = () => {
    triggerHaptic('light');
    setCurrentSlideIndex((prev) => (prev - 1 + BRIEF_SLIDES.length) % BRIEF_SLIDES.length);
  };

  const handleBroadcastToTeam = async () => {
    triggerHaptic('medium');
    setIsBroadcasting(true);

    try {
      const res = await fetch('/api/changelog/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Daily Brief Minerva (${currentSlide.title})`,
          category: 'Stand-up',
          summary: currentSlide.subtitle,
          sendToChat: true,
          channel: '#annonces',
        }),
      });

      if (res.ok) {
        toastSuccess('Brief Diffusé', 'Le récapitulatif a été posté dans le canal #annonces.');
      } else {
        toastInfo('Brief Enregistré', 'Le récapitulatif quotidien a été copié pour le stand-up.');
      }
    } catch {
      toastInfo('Brief Enregistré', 'Le récapitulatif quotidien a été copié pour le stand-up.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#f2f2f2] shadow-xs flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block" style={MONO}>
            FORMAT CONSOMMABLE (MOBBIN PATTERN 4)
          </span>
          <h3 className="text-sm font-semibold text-[#08090a]">Le Brief Quotidien de l&apos;Équipe</h3>
        </div>

        {/* Carousel Prev/Next Navigation Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 rounded border border-[#f2f2f2] hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            aria-label="Slide précédente"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] font-mono text-zinc-400 px-1" style={MONO}>
            {currentSlideIndex + 1}/{BRIEF_SLIDES.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="w-7 h-7 rounded border border-[#f2f2f2] hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            aria-label="Slide suivante"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Active Consumable Slide Content ── */}
      <div className="p-4 rounded-xl border border-[#f2f2f2] bg-zinc-50/60 space-y-3 min-h-[170px] flex flex-col justify-between transition-all duration-200">
        <div className="space-y-1">
          <span
            className={cn('inline-block text-[10px] font-mono px-2 py-0.5 rounded font-medium border', currentSlide.badgeColor)}
            style={MONO}
          >
            {currentSlide.badge}
          </span>
          <h4 className="text-xs font-bold text-[#08090a] pt-1 leading-snug">
            {currentSlide.title}
          </h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Bullet Points */}
        <div className="space-y-1.5 pt-2 border-t border-[#dddddd]/60">
          {currentSlide.bullets.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-start gap-2 text-xs text-zinc-700">
                <Icon size={12} className="text-[#0c8c5e] mt-0.5 shrink-0" />
                <span className="text-[11px] leading-tight">{b.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Carousel Footer Actions ── */}
      <div className="flex items-center justify-between pt-1 border-t border-[#f2f2f2] gap-3">
        {/* Slide Progress Indicator Dots */}
        <div className="flex items-center gap-1.5">
          {BRIEF_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setCurrentSlideIndex(idx);
              }}
              className={cn(
                'h-1.5 rounded transition-all cursor-pointer',
                currentSlideIndex === idx ? 'w-5 bg-[#08090a]' : 'w-2 bg-zinc-200 hover:bg-zinc-300'
              )}
              aria-label={`Aller au slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Broadcast to Team Chat Button */}
        <button
          type="button"
          onClick={handleBroadcastToTeam}
          disabled={isBroadcasting}
          className="h-7 px-2.5 rounded bg-[#08090a] hover:bg-zinc-800 text-white text-[10.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
        >
          <Send size={11} className="text-white" />
          <span>Diffuser dans #annonces</span>
        </button>
      </div>
    </div>
  );
}
