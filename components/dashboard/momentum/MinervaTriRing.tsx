'use client';

import React, { useMemo } from 'react';
import { Target, HeartHandshake, Cpu, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MinervaTriRingProps {
  acquisitionPct?: number;
  retentionPct?: number;
  techPct?: number;
  streakDays?: number;
}

export function MinervaTriRing({
  acquisitionPct = 82,
  retentionPct = 94,
  techPct = 100,
  streakDays = 7,
}: MinervaTriRingProps) {
  // Global Weighted Momentum Score (0-100)
  const globalScore = useMemo(() => {
    return Math.round(acquisitionPct * 0.4 + retentionPct * 0.35 + techPct * 0.25);
  }, [acquisitionPct, retentionPct, techPct]);

  // SVG Ring Geometry
  // Outer Ring (Acquisition): Radius 95, Circumference = 2 * PI * 95 = 596.9
  const c1 = 2 * Math.PI * 95;
  const strokeDash1 = (Math.min(100, Math.max(0, acquisitionPct)) / 100) * c1;

  // Middle Ring (Retention): Radius 74, Circumference = 2 * PI * 74 = 464.95
  const c2 = 2 * Math.PI * 74;
  const strokeDash2 = (Math.min(100, Math.max(0, retentionPct)) / 100) * c2;

  // Inner Ring (Tech): Radius 53, Circumference = 2 * PI * 53 = 333.0
  const c3 = 2 * Math.PI * 53;
  const strokeDash3 = (Math.min(100, Math.max(0, techPct)) / 100) * c3;

  return (
    <div className="p-5 rounded-2xl bg-white border border-[#f2f2f2] shadow-xs flex flex-col items-center justify-between gap-4">
      <div className="w-full flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block" style={MONO}>
            MÉTRIQUE PROPRIÉTAIRE (MOAT)
          </span>
          <h3 className="text-sm font-semibold text-[#08090a]">Minerva Momentum Index</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-xs font-mono font-medium" style={MONO}>
          <Flame size={13} className="text-amber-500 fill-amber-500" />
          <span>{streakDays} jours d&apos;affilée</span>
        </div>
      </div>

      {/* SVG Concentric Rings Container */}
      <div className="relative w-56 h-56 flex items-center justify-center my-1">
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full transform -rotate-90 drop-shadow-xs"
        >
          {/* Outer Ring Background (Acquisition) */}
          <circle
            cx="120"
            cy="120"
            r="95"
            fill="none"
            stroke="#ecfdf5"
            strokeWidth="11"
          />
          {/* Outer Ring Progress (Mint Green #0c8c5e) */}
          <circle
            cx="120"
            cy="120"
            r="95"
            fill="none"
            stroke="#0c8c5e"
            strokeWidth="11"
            strokeDasharray={`${strokeDash1} ${c1}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Middle Ring Background (Retention) */}
          <circle
            cx="120"
            cy="120"
            r="74"
            fill="none"
            stroke="#eff6ff"
            strokeWidth="11"
          />
          {/* Middle Ring Progress (Steel Blue #2563eb) */}
          <circle
            cx="120"
            cy="120"
            r="74"
            fill="none"
            stroke="#2563eb"
            strokeWidth="11"
            strokeDasharray={`${strokeDash2} ${c2}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />

          {/* Inner Ring Background (Tech) */}
          <circle
            cx="120"
            cy="120"
            r="53"
            fill="none"
            stroke="#f3e8ff"
            strokeWidth="11"
          />
          {/* Inner Ring Progress (Violet #7c3aed) */}
          <circle
            cx="120"
            cy="120"
            r="53"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="11"
            strokeDasharray={`${strokeDash3} ${c3}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score Metric */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-3xl font-bold font-mono text-[#08090a] tracking-tight leading-none" style={MONO}>
            {globalScore}
          </span>
          <span className="text-[10px] uppercase font-mono text-zinc-400 mt-1" style={MONO}>
            SUR 100
          </span>
          <span className="text-[10.5px] font-medium text-[#0c8c5e] mt-0.5">
            {globalScore >= 90 ? 'Élan Optimal' : globalScore >= 75 ? 'Élan Actif' : 'Vigilance'}
          </span>
        </div>
      </div>

      {/* 3 Interactive Ring Breakdowns */}
      <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-[#f2f2f2] text-xs">
        <div className="flex flex-col items-center p-2 rounded bg-zinc-50 border border-[#f2f2f2] text-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#0c8c5e] uppercase" style={MONO}>
            <Target size={11} />
            <span>Acquisition</span>
          </div>
          <span className="font-mono font-bold text-sm text-[#08090a] mt-0.5" style={MONO}>
            {acquisitionPct} %
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded bg-zinc-50 border border-[#f2f2f2] text-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#2563eb] uppercase" style={MONO}>
            <HeartHandshake size={11} />
            <span>Rétention</span>
          </div>
          <span className="font-mono font-bold text-sm text-[#08090a] mt-0.5" style={MONO}>
            {retentionPct} %
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded bg-zinc-50 border border-[#f2f2f2] text-center">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#7c3aed] uppercase" style={MONO}>
            <Cpu size={11} />
            <span>Technique</span>
          </div>
          <span className="font-mono font-bold text-sm text-[#08090a] mt-0.5" style={MONO}>
            {techPct} %
          </span>
        </div>
      </div>
    </div>
  );
}
