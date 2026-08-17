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

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function AreaChart({
  data,
  title,
  subtitle,
  height = 190,
  valuePrefix = '',
  valueSuffix = '',
  color = '#059669',
}: AreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values) * 1.15 || 100;

  const width = 600;
  const paddingX = 28;
  const paddingY = 20;
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
    <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs">
      {(title || subtitle) && (
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-mv-border">
          <div>
            {title && <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">{title}</span>}
            {subtitle && <p className="text-[10.5px] text-mv-ink-faint">{subtitle}</p>}
          </div>
          {activePoint && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-mv-ink-faint uppercase font-mono" style={MONO}>
                {activePoint.label}
              </span>
              <span className="text-[13px] font-semibold text-mv-green" style={MONO}>
                {valuePrefix}{activePoint.value.toLocaleString('fr-CA')}{valueSuffix}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGradientPrecision" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Precision dashed grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + chartHeight * ratio;
            return (
              <line
                key={i}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#E4E4E7"
                strokeDasharray="2 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradientPrecision)" />

          {/* Precision 1.5px line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover interactive columns */}
          {points.map((p, i) => (
            <g
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer"
            >
              <rect
                x={p.x - chartWidth / (data.length * 2)}
                y={paddingY}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
              />
              {/* Point: visible if hovered or if it's the last point */}
              {(activeIndex === i || (activeIndex === null && i === points.length - 1)) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth="2"
                  className="transition-transform duration-100"
                />
              )}
            </g>
          ))}

          {/* X Axis labels */}
          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 4}
              textAnchor="middle"
              className="text-[9.5px] font-mono fill-zinc-400"
              style={MONO}
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
