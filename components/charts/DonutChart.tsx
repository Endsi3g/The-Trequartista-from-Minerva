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
  innerRadiusRatio?: number;
}

export function DonutChart({
  data,
  title,
  subtitle,
  size = 180,
  innerRadiusRatio = 0.65,
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = size / 2;
  const innerRadius = radius * innerRadiusRatio;
  const strokeWidth = radius - innerRadius;
  const center = radius;

  let cumulativeAngle = 0;

  const slices = data.map((d, idx) => {
    const percentage = d.value / total;
    const angle = percentage * 360;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = center + innerRadius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = center + innerRadius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = center + innerRadius * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = center + innerRadius * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;
    const midAngle = startAngle + angle / 2;

    return {
      ...d,
      percentage: Math.round(percentage * 100),
      midAngle,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col items-center">
      {(title || subtitle) && (
        <div className="w-full text-left mb-4">
          {title && <h3 className="text-sm font-bold text-mv-ink">{title}</h3>}
          {subtitle && <p className="text-xs text-mv-ink-soft">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((slice, idx) => {
              const dashArray = (slice.value / total) * Math.PI * (radius + innerRadius);
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={(radius + innerRadius) / 2}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${dashArray} 9999`}
                  strokeDashoffset={-((slices.slice(0, idx).reduce((a, s) => a + s.value, 0) / total) * Math.PI * (radius + innerRadius))}
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-mv-ink-faint font-semibold uppercase">
              {activeSlice ? activeSlice.label : 'Total'}
            </span>
            <span className="text-lg font-extrabold text-mv-ink">
              {activeSlice ? `${activeSlice.percentage}%` : total.toLocaleString('fr-CA')}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 w-full sm:w-auto">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between gap-4 text-xs p-1.5 rounded-lg cursor-pointer transition-colors ${
                hoveredIdx === idx ? 'bg-mv-green-tint' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="font-semibold text-mv-ink">{slice.label}</span>
              </div>
              <span className="font-mono font-bold text-mv-ink-soft">{slice.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
