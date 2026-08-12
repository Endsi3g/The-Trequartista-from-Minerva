'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      id="topbar-theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink hover:border-mv-green/40 transition-all cursor-pointer"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4 text-mv-warm" /> : <Moon className="w-4 h-4 text-mv-green" />}
    </button>
  );
}
