'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Users, FolderKanban, CheckCircle2, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const searchItems = [
    { title: 'Apex Roofing — ROI Tracker', category: 'Client', href: '/clients/client-apex-roofing/roi-tracker', icon: Users },
    { title: 'Café Saint-Henri — Site Mobile', category: 'Projet', href: '/projects', icon: FolderKanban },
    { title: 'Checklist 20-Points (Refonte Framer)', category: 'Qualité', href: '/projects/proj-apex-launch/launch-check', icon: CheckCircle2 },
    { title: 'Alex Tremblay — Fiche 1-on-1', category: 'Équipe', href: '/team/team-alex/performance', icon: Users },
    { title: 'SOP Déploiement Framer Mobile-First', category: 'Académie', href: '/academy', icon: GraduationCap },
  ];

  const filtered = query
    ? searchItems.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || i.category.toLowerCase().includes(query.toLowerCase()))
    : searchItems;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-mv-fade-up">
      <div className="bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg w-full max-w-xl overflow-hidden">
        {/* Search Header */}
        <div className="px-4 py-3 border-b border-mv-border flex items-center gap-3">
          <Search className="w-5 h-5 text-mv-green shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un client, projet, checklist ou SOP (ex: Apex, Framer, 1-on-1)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded text-mv-ink-soft hover:text-mv-ink">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-mv-ink-soft">
              Aucun résultat trouvé pour "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-mv-cream-soft transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-mv-green-tint text-mv-green">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-mv-ink group-hover:text-mv-green transition-colors">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-mv-ink-soft uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mv-ink-mute group-hover:text-mv-green group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2 border-t border-mv-border bg-mv-cream-soft/40 flex items-center justify-between text-[11px] text-mv-ink-soft">
          <span>Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-mv-surface border border-mv-border font-mono">ESC</kbd> pour fermer</span>
          <span>Centurions Search Engine</span>
        </div>
      </div>
    </div>
  );
}
