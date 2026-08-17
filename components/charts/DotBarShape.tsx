import React from 'react';

interface DotBarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}

const DOT_SPACING = 5;
const DOT_RADIUS = 1.3;

// Custom Recharts <Bar shape> that fills the bar's rect with a dot grid
// instead of a solid fill -- the v2 "tramage" motif extended from photos
// (HalftoneImage) into data-viz, per the Revenue dot-matrix reference.
export function DotBarShape({ x = 0, y = 0, width = 0, height = 0, fill = '#059669' }: DotBarShapeProps) {
  if (width <= 0 || height <= 0) return null;
  const cols = Math.max(1, Math.round(width / DOT_SPACING));
  const rows = Math.max(1, Math.round(height / DOT_SPACING));
  const colSpacing = width / cols;
  const rowSpacing = height / rows;
  const dots: React.ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={x + c * colSpacing + colSpacing / 2}
          cy={y + r * rowSpacing + rowSpacing / 2}
          r={DOT_RADIUS}
          fill={fill}
        />
      );
    }
  }
  return <g>{dots}</g>;
}
