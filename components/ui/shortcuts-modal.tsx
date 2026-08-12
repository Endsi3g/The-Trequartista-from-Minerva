'use client';

import React, { useEffect, useState } from 'react';
import { Keyboard, X, Search, Sidebar, Plus, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ + K', label: 'Palette de recherche globale (SearchDialog)', icon: Search },
    { key: '⌘ + B', label: 'Rétracter / Déplier la Sidebar', icon: Sidebar },
    { key: '⌘ + L', label: 'Nouveau Lead CRM', icon: Plus },
    { key: '⌘ + P', label: 'Générer le Rapport Exécutif PDF', icon: Printer },
    { key: 'ESC', label: 'Fermer les modales et tiroirs actifs', icon: X },
    { key: '?', label: 'Afficher ce guide des raccourcis clavier', icon: Keyboard },
  ];

  return (
    <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-md w-full p-6 space-y-6 shadow-mv-lg animate-mv-scale-in">
        <div className="flex items-center justify-between border-b border-mv-border pb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-mv-green" />
            <h3 className="text-base font-extrabold text-mv-ink">Raccourcis Clavier Minerva</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-mv-cream-soft border border-mv-border text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-mv-green" />
                  <span className="font-semibold text-mv-ink">{sc.label}</span>
                </div>
                <kbd className="px-2.5 py-1 bg-mv-surface border border-mv-border rounded-md font-mono text-[11px] font-extrabold text-mv-ink shadow-mv-sm">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
