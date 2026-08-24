'use client';

import React, { useState } from 'react';

// Shared "Voir plus" pattern for Kanban-style columns (leads, tasks,
// projects, content planner) that used to render every card in a column
// at once with no cap -- a column with dozens of cards became an
// unscrollable wall with no way to see just the first few.
interface PaginatedColumnProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  pageSize?: number;
  emptyLabel?: string;
  getKey: (item: T) => string;
}

export function PaginatedColumn<T>({ items, renderItem, pageSize = 8, emptyLabel = 'Vide', getKey }: PaginatedColumnProps<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  if (items.length === 0) {
    return (
      <div className="h-20 border border-dashed border-mv-border rounded-lg flex items-center justify-center text-[10.5px] text-mv-ink-faint">
        {emptyLabel}
      </div>
    );
  }

  const visible = items.slice(0, visibleCount);
  const remaining = items.length - visible.length;

  return (
    <>
      {visible.map((item) => (
        <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>
      ))}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + pageSize)}
          className="w-full h-8 rounded-lg border border-dashed border-mv-border text-[10.5px] font-semibold text-mv-ink-soft hover:text-mv-green hover:border-mv-green/40 transition-colors cursor-pointer"
        >
          Voir plus (+{remaining})
        </button>
      )}
    </>
  );
}
