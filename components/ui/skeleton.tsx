import React from 'react';
import { cn } from '@/lib/utils';

// Static "bone" placeholder for non-text shapes (avatars, cards, badges, table
// rows). Deliberately unanimated — the loading state should read as calm
// structure, not motion. Only SkeletonText below gets the shimmer sweep.
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-md bg-mv-cream-soft border border-mv-border/60', className)} {...props} />;
}

// Text-shaped placeholder — the one element that gets the shimmer sweep
// (reuses the existing .shimmer-bg gradient/animation from globals.css).
export function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-3 rounded shimmer-bg', className)} {...props} />;
}

export function SkeletonAvatar({ size = 32, className }: { size?: number; className?: string }) {
  return <Skeleton className={cn('rounded-full shrink-0', className)} style={{ width: size, height: size }} />;
}

export function SkeletonBadge({ className }: { className?: string }) {
  return <SkeletonText className={cn('h-5 w-16 rounded-full', className)} />;
}

// A single list/table row: avatar + two stacked text lines + a trailing badge.
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-4', className)}>
      <SkeletonAvatar size={32} />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonText className="w-1/3" />
        <SkeletonText className="w-1/2 h-2.5" />
      </div>
      <SkeletonBadge />
    </div>
  );
}

export function SkeletonRows({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('divide-y divide-mv-border/60 rounded-2xl border border-mv-border bg-mv-surface overflow-hidden', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

// A card matching the app's standard bg-mv-surface / border / rounded-2xl card shape.
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-mv-border bg-mv-surface p-5 space-y-3 shadow-mv-sm', className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={36} />
        <div className="flex-1 space-y-2">
          <SkeletonText className="w-2/3" />
          <SkeletonText className="w-1/3 h-2.5" />
        </div>
      </div>
      <SkeletonText className="w-full" />
      <SkeletonText className="w-4/5" />
    </div>
  );
}

export function SkeletonCards({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// A Kanban-style column: header + a stack of small cards, matching the
// Tasks/Leads board shape.
export function SkeletonKanbanColumn({ cardCount = 3, className }: { cardCount?: number; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-mv-border bg-mv-cream-soft p-3 space-y-2.5', className)}>
      <SkeletonText className="w-1/2 h-3.5 mb-1" />
      {Array.from({ length: cardCount }).map((_, i) => (
        <div key={i} className="rounded-xl border border-mv-border bg-mv-surface p-3 space-y-2">
          <SkeletonText className="w-3/4" />
          <SkeletonText className="w-1/2 h-2.5" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKanban({ columns = 3, cardCount = 3, className }: { columns?: number; cardCount?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonKanbanColumn key={i} cardCount={cardCount} />
      ))}
    </div>
  );
}
