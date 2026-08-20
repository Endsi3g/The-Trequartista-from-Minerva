'use client';

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

// Smooth crossfade for in-page tab/view switches (e.g. content-planner's
// calendar/kanban/storage tabs, leads' kanban/table toggle) -- these used
// to swap content instantly with no transition, or leaned on a loading
// shimmer even when the data was already in memory. This replaces the
// jump-cut with a short fade + rise, keyed by the active tab so React
// treats each tab's content as a distinct element to animate between.
export function TabTransition({ tabKey, children, className }: { tabKey: string; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
