import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'lime' | 'amber' | 'red' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'green', className = '' }: BadgeProps) {
  const variantStyles = {
    green: 'bg-mv-green-tint text-mv-green border-mv-green/30',
    lime: 'bg-mv-warm-tint text-mv-ink border-mv-warm-dark/50',
    amber: 'bg-mv-amber-bg text-mv-amber border-mv-amber/30',
    red: 'bg-mv-red-bg text-mv-red border-mv-red/30',
    neutral: 'bg-mv-cream-soft text-mv-ink-soft border-mv-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
