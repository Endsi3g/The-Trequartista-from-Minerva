'use client';

import React, { useState } from 'react';

export interface MatrixPoint {
  id: string;
  title: string;
  impact_score: number;
  effort_score: number;
}

interface ImpactEffortMatrixProps {
  points: MatrixPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
}

// Hand-rolled SVG scatter, matching the rest of components/charts/* rather
// than introducing recharts (a listed but otherwise-unused dependency) for
// one chart.
export function ImpactEffortMatrix({ points, title, subtitle, height = 320 }: ImpactEffortMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  if (!points || points.length === 0) return null;

  const width = 500;
  const padding = 40;
  const plotSize = Math.min(width, height) - padding * 2;

  const toXY = (impact: number, effort: number) => ({
    x: padding + ((impact - 1) / 9) * plotSize,
    y: padding + plotSize - ((effort - 1) / 9) * plotSize,
  });

  const activePoint = points.find((p) => p.id === activeId);

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-bold text-mv-ink">{title}</h3>}
          {subtitle && <p className="text-xs text-mv-ink-soft">{subtitle}</p>}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Quadrant backgrounds */}
          <rect x={padding} y={padding} width={plotSize / 2} height={plotSize / 2} fill="#dfff5f" opacity={0.12} />
          <rect x={padding + plotSize / 2} y={padding} width={plotSize / 2} height={plotSize / 2} fill="#167f5b" opacity={0.12} />
          <rect x={padding} y={padding + plotSize / 2} width={plotSize / 2} height={plotSize / 2} fill="var(--mv-border)" opacity={0.15} />
          <rect x={padding + plotSize / 2} y={padding + plotSize / 2} width={plotSize / 2} height={plotSize / 2} fill="var(--mv-amber)" opacity={0.1} />

          <text x={padding + plotSize * 0.75} y={padding + 16} textAnchor="middle" className="text-[9px] font-bold fill-mv-green uppercase">Prioriser</text>
          <text x={padding + plotSize * 0.25} y={padding + 16} textAnchor="middle" className="text-[9px] font-bold fill-mv-ink-soft uppercase">Gains rapides</text>

          {/* Axes */}
          <line x1={padding} y1={padding} x2={padding} y2={padding + plotSize} stroke="var(--mv-border)" strokeWidth="1.5" />
          <line x1={padding} y1={padding + plotSize} x2={padding + plotSize} y2={padding + plotSize} stroke="var(--mv-border)" strokeWidth="1.5" />

          <text x={padding + plotSize / 2} y={height - 6} textAnchor="middle" className="text-[10px] font-bold fill-mv-ink-soft uppercase tracking-wide">Effort →</text>
          <text x={12} y={padding + plotSize / 2} textAnchor="middle" transform={`rotate(-90, 12, ${padding + plotSize / 2})`} className="text-[10px] font-bold fill-mv-ink-soft uppercase tracking-wide">Impact →</text>

          {points.map((p) => {
            const { x, y } = toXY(p.impact_score, p.effort_score);
            const isActive = activeId === p.id;
            return (
              <g key={p.id} onMouseEnter={() => setActiveId(p.id)} onMouseLeave={() => setActiveId(null)} className="cursor-pointer">
                <circle cx={x} cy={y} r={isActive ? 9 : 7} fill={isActive ? '#dfff5f' : '#167f5b'} stroke="#ffffff" strokeWidth="2" className="transition-all duration-150" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 text-xs">
        {activePoint ? (
          <p className="font-bold text-mv-ink">{activePoint.title} <span className="font-normal text-mv-ink-soft">— Impact {activePoint.impact_score}/10, Effort {activePoint.effort_score}/10</span></p>
        ) : (
          <p className="text-mv-ink-faint">Survolez un point pour voir l'initiative correspondante.</p>
        )}
      </div>
    </div>
  );
}
