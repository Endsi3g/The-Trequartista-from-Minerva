'use client';

import React from 'react';
import { motion } from 'motion/react';

// Shared entrance animation for page-level content -- a small fade + rise,
// consistently applied instead of every page hand-rolling its own
// (or, more often, none at all).
export function PageFadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
