'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Shield, Moon, Sun } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SearchDialog } from './SearchDialog';

export function TopbarActions() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Command Search Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-mv-surface border border-mv-border text-xs text-mv-ink-soft hover:border-mv-green/40 hover:text-mv-ink transition-all cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-mv-green" />
          <span className="hidden sm:inline">Rechercher...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-mv-cream-soft border border-mv-border text-[10px] font-mono text-mv-ink-faint">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Client Button */}
        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
          <span className="hidden sm:inline">Nouveau Client</span>
        </Button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink hover:border-mv-green/40 transition-all cursor-pointer"
          title={isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre (Défaut)'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-mv-lime" /> : <Moon className="w-4 h-4 text-mv-green" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mv-lime animate-pulse" />
        </button>

        {/* System Badge */}
        <Badge variant="green" className="hidden lg:inline-flex">
          <Shield className="w-3 h-3 text-mv-green" />
          <span>In-House v1.0</span>
        </Badge>
      </div>

      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
