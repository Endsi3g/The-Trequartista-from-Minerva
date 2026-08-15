import React from 'react';

interface DotPatternProps {
  className?: string;
  density?: number;
}

// Abstract decorative dot grid (radial fade toward the edges) for empty
// states / hero moments -- the photo-less counterpart to HalftoneImage,
// same "tramage" visual language without needing a real image.
export function DotPattern({ className = '', density = 14 }: DotPatternProps) {
  const id = React.useId().replace(/[:]/g, '');
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id={`dots-${id}`} x="0" y="0" width={density} height={density} patternUnits="userSpaceOnUse">
          <circle cx={density / 2} cy={density / 2} r={1.4} className="fill-mv-ink-mute" />
        </pattern>
        <radialGradient id={`fade-${id}`}>
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="75%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id={`mask-${id}`}>
          <rect width="100%" height="100%" fill={`url(#fade-${id})`} />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dots-${id})`} mask={`url(#mask-${id})`} />
    </svg>
  );
}
