import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
  return (
    <div
      className={`bg-mv-surface border border-mv-border rounded-xl shadow-mv-sm overflow-hidden transition-all duration-200 hover:border-mv-border/80 ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-mv-border flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-mv-border bg-mv-cream-soft/50 text-xs text-mv-ink-soft">
          {footer}
        </div>
      )}
    </div>
  );
}
