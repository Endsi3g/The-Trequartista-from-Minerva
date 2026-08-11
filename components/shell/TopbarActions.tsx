'use client';

import React, { useState } from 'react';
import { Search, Plus, Bell, Shield, Moon, Sun, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { SearchDialog } from './SearchDialog';
import Link from 'next/link';

export function TopbarActions() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const activeAlerts = [
    {
      id: 'al-1',
      title: 'Conformité Loi 25 non validée',
      desc: 'Point #17 de la checklist requis pour Apex Roofing.',
      severity: 'critical',
      url: '/projects/proj-apex-launch/launch-check',
    },
    {
      id: 'al-2',
      title: 'Revue 1-on-1 requise',
      desc: 'Session planifiée avec Alex Tremblay à 14h00.',
      severity: 'warning',
      url: '/team/team-alex/performance',
    },
  ];

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
        <Link href="/clients">
          <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
            <span className="hidden sm:inline">Nouveau Client</span>
          </Button>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink hover:border-mv-green/40 transition-all cursor-pointer"
          title={isDarkMode ? 'Passer en Mode Clair' : 'Passer en Mode Sombre (Défaut)'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-mv-lime" /> : <Moon className="w-4 h-4 text-mv-green" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mv-lime animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg p-3 z-50 animate-mv-scale-in space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-mv-border">
                <span className="text-xs font-bold text-mv-ink uppercase tracking-wider">
                  Centre d'Alertes ({activeAlerts.length})
                </span>
                <button onClick={() => setIsNotifOpen(false)} className="text-mv-ink-soft hover:text-mv-ink">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeAlerts.map((al) => (
                  <Link
                    key={al.id}
                    href={al.url}
                    onClick={() => setIsNotifOpen(false)}
                    className="block p-2.5 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border transition-colors text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-mv-ink flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${al.severity === 'critical' ? 'text-mv-red' : 'text-mv-amber'}`} />
                        {al.title}
                      </span>
                      <Badge variant={al.severity === 'critical' ? 'red' : 'amber'}>
                        {al.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-mv-ink-soft leading-tight">{al.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

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
