'use client';

import React, { useState } from 'react';

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  secondaryColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function BarChart({
  data,
  title,
  subtitle,
  height = 200,
  color = '#059669',
  secondaryColor = '#6ba585',
  valuePrefix = '',
  valueSuffix = '',
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0))) * 1.15 || 100;
  const width = 500;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const barWidth = Math.min(32, (chartWidth / data.length) * 0.5);

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
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((ratio, i) => {
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

          {/* Bars */}
          {data.map((d, i) => {
            const centerX = paddingX + (i + 0.5) * (chartWidth / data.length);
            const barH = (d.value / maxVal) * chartHeight;
            const barY = paddingY + chartHeight - barH;

            const secH = d.secondaryValue ? (d.secondaryValue / maxVal) * chartHeight : 0;
            const secY = paddingY + chartHeight - secH;

            const isHovered = hoveredIndex === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer group"
              >
                {/* Secondary Bar if exists */}
                {d.secondaryValue !== undefined && (
                  <rect
                    x={centerX - barWidth - 2}
                    y={secY}
                    width={barWidth}
                    height={secH}
                    rx="4"
                    fill={secondaryColor}
                    opacity={isHovered ? 1 : 0.8}
                    className="transition-all duration-200"
                  />
                )}

                {/* Primary Bar */}
                <rect
                  x={d.secondaryValue !== undefined ? centerX + 2 : centerX - barWidth / 2}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx="4"
                  fill={isHovered ? '#047857' : color}
                  className="transition-all duration-200"
                />

                {/* X Axis Label */}
                <text
                  x={centerX}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[10px] font-semibold fill-mv-ink-faint"
                >
                  {d.label}
                </text>

                {/* Hover Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={centerX - 45}
                      y={Math.min(barY, secY || barY) - 28}
                      width="90"
                      height="22"
                      rx="4"
                      fill="#1a1f1c"
                    />
                    <text
                      x={centerX}
                      y={Math.min(barY, secY || barY) - 14}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-white"
                    >
                      {valuePrefix}{d.value}{valueSuffix}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
