import React from 'react';

// Shared status indicator for Employee-Management-style tables. Kept to the
// app's single-accent palette: green = positive/active, neutral = everything
// else. Red is reserved for destructive/error UI only (see CLAUDE.md), so
// "lost"/"archived" business states render neutral, not red.
export function StatusDot({ active, className = '' }: { active: boolean; className?: string }) {
  return (
    <span
      className={`w-2 h-2 rounded-[2px] shrink-0 ${active ? 'bg-mv-green' : 'bg-mv-ink-faint/50 border border-mv-ink-faint'} ${className}`}
    />
  );
}
