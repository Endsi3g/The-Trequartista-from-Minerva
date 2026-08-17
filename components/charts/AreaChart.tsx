'use client';

import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface AreaChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  color?: string;
}

export function AreaChart({
  data,
  title,
  subtitle,
  height = 220,
  valuePrefix = '',
  valueSuffix = '',
  color = '#059669',
}: AreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values) * 1.15 || 100;
  const minVal = 0;

  const width = 600;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  const activePoint = activeIndex !== null ? points[activeIndex] : points[points.length - 1];

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm">
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-mv-ink">{title}</h3>}
            {subtitle && <p className="text-xs text-mv-ink-soft">{subtitle}</p>}
          </div>
          {activePoint && (
            <div className="text-right">
              <span className="text-xs text-mv-ink-faint uppercase font-semibold">{activePoint.label}</span>
              <p className="text-base font-extrabold text-mv-green">
                {valuePrefix}{activePoint.value.toLocaleString('fr-CA')}{valueSuffix}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="var(--mv-border)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Smooth line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points & hover triggers */}
          {points.map((p, i) => (
            <g key={i} onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)} className="cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r={activeIndex === i ? 6 : 4}
                fill={activeIndex === i ? '#dfff5f' : color}
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-150"
              />
              <rect
                x={p.x - chartWidth / (data.length * 2)}
                y={paddingY}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
              />
            </g>
          ))}

          {/* X Axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              className="text-[10px] font-semibold fill-mv-ink-faint"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
