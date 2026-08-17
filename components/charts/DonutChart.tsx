'use client';

import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  size?: number;
  centerLabel?: string;
}

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function DonutChart({
  data,
  title,
  subtitle,
  size = 80,
  centerLabel = 'TOTAL INVESTI',
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2;
  const strokeWidth = 10;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  let cumulativeOffset = 0;

  const slices = data.map((d, idx) => {
    const percentage = d.value / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += percentage * circumference;

    return {
      ...d,
      percentage: Math.round(percentage * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs h-full flex flex-col justify-between">
      {(title || subtitle) && (
        <div className="pb-2.5 mb-2.5 border-b border-mv-border">
          {title && <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">{title}</span>}
          {subtitle && <p className="text-[10.5px] text-mv-ink-faint">{subtitle}</p>}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 py-2">
        {/* Fine Donut SVG (80px) */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {/* Background ring */}
            <circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              fill="transparent"
              stroke="#E4E4E7"
              strokeWidth={strokeWidth}
            />
            {/* Slices */}
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx={radius}
                cy={radius}
                r={innerRadius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 2 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                transform={`rotate(-90 ${radius} ${radius})`}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>
        </div>

        {/* Center/Total Callout & Lateral Legend */}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="text-[9.5px] uppercase font-mono tracking-wider text-mv-ink-faint leading-none" style={MONO}>
              {centerLabel}
            </div>
            <div className="text-[16px] font-semibold text-mv-ink leading-tight" style={MONO}>
              {Math.round(total).toLocaleString('fr-CA')} $
            </div>
          </div>

          <div className="space-y-1 pt-1 border-t border-mv-border">
            {slices.map((s, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between text-[11px] px-1 py-0.5 rounded transition-colors ${
                  hoveredIdx === idx ? 'bg-black/[0.03]' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-[1px] shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-mv-ink-soft truncate max-w-[100px]">{s.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-mv-ink" style={MONO}>
                  <span className="font-medium">{Math.round(s.value).toLocaleString('fr-CA')} $</span>
                  <span className="text-mv-ink-faint text-[9.5px]">({s.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
