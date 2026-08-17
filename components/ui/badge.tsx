import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'neutral';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'green', className = '', style }: BadgeProps) {
  const variantStyles = {
    green: 'bg-mv-green-tint text-mv-green border-mv-green/30',
    amber: 'bg-mv-amber-bg text-mv-amber border-mv-amber/30',
    red: 'bg-mv-red-bg text-mv-red border-mv-red/30',
    blue: 'bg-mv-blue-bg text-mv-blue border-mv-blue/30',
    purple: 'bg-mv-purple-bg text-mv-purple border-mv-purple/30',
    neutral: 'bg-mv-cream-soft text-mv-ink-soft border-mv-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all ${variantStyles[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
