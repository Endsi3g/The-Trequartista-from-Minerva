'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogoMark } from '@/components/shell/Logo';

// Custom-built word preloader (no @skiper-ui/skiper8 -- that slug turned
// out to be a paid Skiper UI Pro component; this is a from-scratch
// equivalent styled to the Forêt & Crème brand). Cycles through the real
// domains Minerva Trequartista actually covers, one word fading/sliding
// into the next, rather than a generic spinner.
const WORDS = ['Clients', 'Leads', 'Projets', 'Contenu', 'Équipe', 'Résultats'];

export function WordPreloader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % WORDS.length);
    }, 550);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-6 bg-white">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark size={36} />
      </motion.div>

      <div className="h-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={WORDS[index]}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="block text-2xl font-extrabold text-mv-ink font-display tracking-tight"
          >
            {WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="w-40 h-1 rounded-full bg-mv-border overflow-hidden">
        <motion.div
          className="h-full bg-mv-green rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}
