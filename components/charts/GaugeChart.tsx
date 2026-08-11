'use client';

import React from 'react';

interface GaugeChartProps {
  score: number;
  total?: number;
  label?: string;
  size?: number;
}

export function GaugeChart({
  score,
  total = 20,
  label = 'Score Qualité',
  size = 160,
}: GaugeChartProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((score / total) * 100)));

  const radius = (size - 24) / 2;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 90
      ? 'var(--mv-green)'
      : percentage >= 70
      ? '#ab7d1f'
      : 'var(--mv-red)';

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background Half Arc */}
          <path
            d={`M 12 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2 + 10}`}
            fill="none"
            stroke="var(--mv-border)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <path
            d={`M 12 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 12} ${size / 2 + 10}`}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <span className="text-2xl sm:text-3xl font-extrabold text-mv-ink font-mono">
            {score}/{total}
          </span>
          <span className="text-[10px] text-mv-ink-faint uppercase font-bold tracking-wider">
            {label} ({percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
}
