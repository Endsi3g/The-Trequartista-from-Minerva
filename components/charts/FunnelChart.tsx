'use client';

import React from 'react';

export interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  title?: string;
  subtitle?: string;
}

export function FunnelChart({ stages, title, subtitle }: FunnelChartProps) {
  if (!stages || stages.length === 0) return null;

  const maxCount = Math.max(...stages.map((s) => s.count)) || 1;

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-bold text-mv-ink">{title}</h3>}
          {subtitle && <p className="text-xs text-mv-ink-soft">{subtitle}</p>}
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const widthPct = Math.max(15, Math.round((stage.count / maxCount) * 100));
          const conversionFromPrev =
            idx > 0 && stages[idx - 1].count > 0
              ? Math.round((stage.count / stages[idx - 1].count) * 100)
              : null;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-mv-ink">{stage.label}</span>
                <div className="flex items-center gap-2">
                  {idx > 0 && conversionFromPrev !== null && (
                    <span className="text-[10px] text-mv-ink-faint bg-mv-surface px-1.5 py-0.5 rounded border border-mv-border">
                      {conversionFromPrev}% conv.
                    </span>
                  )}
                  <span className="font-mono text-mv-green font-bold">{stage.count} leads</span>
                </div>
              </div>

              <div className="h-7 w-full bg-mv-surface rounded-lg overflow-hidden border border-mv-border flex items-center">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center px-3 text-white text-xs font-bold font-mono"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: stage.color,
                  }}
                >
                  {widthPct > 20 && `${widthPct}%`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
