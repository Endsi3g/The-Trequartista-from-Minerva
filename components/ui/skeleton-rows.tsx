import React from 'react';

// Row-shaped shimmer placeholders for list/table pages while data loads --
// reuses the shimmer-bg/animate-mv-shimmer utility already defined for
// Changelog/Integrations, so every page's loading state looks consistent.
export function SkeletonRows({ count = 5, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl shimmer-bg animate-mv-shimmer border border-mv-border" />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-36 rounded-xl shimmer-bg animate-mv-shimmer border border-mv-border" />
      ))}
    </div>
  );
}
