'use client';

import React from 'react';

export interface PerformanceSkill {
  skill: string;
  score: number; // 0 to 100
  category?: string;
}

interface PerformanceBarChartProps {
  skills: PerformanceSkill[];
  title?: string;
  subtitle?: string;
}

export function PerformanceBarChart({
  skills,
  title,
  subtitle,
}: PerformanceBarChartProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm space-y-4">
      {(title || subtitle) && (
        <div>
          {title && <h3 className="text-sm font-bold text-mv-ink">{title}</h3>}
          {subtitle && <p className="text-xs text-mv-ink-soft">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-3">
        {skills.map((item, idx) => {
          const color =
            item.score >= 85
              ? 'var(--mv-green)'
              : item.score >= 65
              ? 'var(--mv-amber)'
              : 'var(--mv-red)';

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-mv-ink">{item.skill}</span>
                <span className="font-mono font-bold text-mv-green">{item.score}%</span>
              </div>
              <div className="h-2.5 w-full bg-mv-surface rounded-full overflow-hidden border border-mv-border">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.score}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
