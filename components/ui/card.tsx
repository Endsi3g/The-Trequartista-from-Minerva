import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * Classes for the inner content wrapper (defaults to "p-6"). Override this
   * -- not just `className` -- when the card needs to be a flex-column shell
   * (e.g. a chat panel with a header/scroll-area/input stack): `className`
   * only reaches the outer div, so a plain `p-0` there can't make this inner
   * wrapper participate in that flex chain on its own.
   */
  contentClassName?: string;
}

export function Card({ children, className = '', header, footer, contentClassName = 'p-6' }: CardProps) {
  return (
    <div
      className={`bg-mv-surface border border-mv-border rounded-xl shadow-mv-sm overflow-hidden transition-all duration-200 hover:border-mv-border/80 ${className}`}
    >
      {header && (
        <div className="px-6 py-4 border-b border-mv-border flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
      {footer && (
        <div className="px-6 py-3 border-t border-mv-border bg-mv-cream-soft/50 text-xs text-mv-ink-soft">
          {footer}
        </div>
      )}
    </div>
  );
}
