'use client';

import React, { useEffect, useRef } from 'react';

interface HalftoneImageProps {
  src: string;
  className?: string;
  dotSpacing?: number;
  dotColor?: string;
  backgroundColor?: string;
}

// Renders a photo as a halftone/dither dot-matrix pattern (dot size scales
// with pixel darkness) on a <canvas> -- the recurring "tramage" motif from
// the v2 design references (sign-in portrait, revenue chart bars). Reused
// wherever a real photo needs this treatment; for a photo-less decorative
// dot grid, use DotPattern instead.
export function HalftoneImage({
  src,
  className,
  dotSpacing = 6,
  dotColor = '#1a1f1c',
  backgroundColor = '#ffffff',
}: HalftoneImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = canvas.clientWidth || img.width;
      const height = canvas.clientHeight || img.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Draw the source image to an offscreen canvas at low resolution to
      // sample average luminance per dot cell.
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      const sample = document.createElement('canvas');
      sample.width = cols;
      sample.height = rows;
      const sctx = sample.getContext('2d');
      if (!sctx) return;
      sctx.drawImage(img, 0, 0, cols, rows);
      const data = sctx.getImageData(0, 0, cols, rows).data;

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = dotColor;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const darkness = 1 - luminance;
          const radius = (dotSpacing / 2) * Math.min(1, darkness * 1.15);
          if (radius < 0.4) continue;
          ctx.beginPath();
          ctx.arc(x * dotSpacing + dotSpacing / 2, y * dotSpacing + dotSpacing / 2, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    img.src = src;
  }, [src, dotSpacing, dotColor, backgroundColor]);

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
