'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Users, FolderKanban, Target, GraduationCap, Clapperboard, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Result {
  title: string;
  subtitle: string;
  category: string;
  href: string;
  icon: typeof Users;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const term = `%${query.trim()}%`;
      const [clients, projects, leads, sops, posts] = await Promise.all([
        supabase.from('clients').select('id, name, industry').ilike('name', term).limit(5),
        supabase.from('projects').select('id, name, client_name').ilike('name', term).limit(5),
        supabase.from('leads').select('id, contact_name, company_name, client_name').or(`contact_name.ilike.${term},company_name.ilike.${term}`).limit(5),
        supabase.from('academy_sops').select('id, title, category, description').or(`title.ilike.${term},description.ilike.${term}`).limit(5),
        supabase.from('content_posts').select('id, title, caption, platform').or(`title.ilike.${term},caption.ilike.${term}`).limit(5),
      ]);

      const found: Result[] = [
        ...(clients.data || []).map((c) => ({
          title: c.name,
          subtitle: c.industry || 'Client',
          category: 'Client',
          href: `/clients/${c.id}/roi-tracker`,
          icon: Users,
        })),
        ...(projects.data || []).map((p) => ({
          title: p.name,
          subtitle: p.client_name || 'Projet',
          category: 'Projet',
          href: `/projects`,
          icon: FolderKanban,
        })),
        ...(leads.data || []).map((l) => ({
          title: l.company_name || l.contact_name,
          subtitle: l.contact_name,
          category: 'Lead',
          href: `/leads`,
          icon: Target,
        })),
        ...(sops.data || []).map((s) => ({
          title: s.title,
          subtitle: s.category || 'SOP',
          category: 'Académie',
          href: `/academy/${s.id}`,
          icon: GraduationCap,
        })),
        ...(posts.data || []).map((p) => ({
          title: p.title,
          subtitle: p.platform || 'Contenu',
          category: 'Réel',
          href: `/content-planner/${p.id}`,
          icon: Clapperboard,
        })),
      ];
      setResults(found);
      setLoading(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-mv-ink/70 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-mv-fade-up"
      onClick={onClose}
    >
      <div
        className="bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-mv-border flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-mv-green shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-mv-green shrink-0" />
          )}
          <input
            type="text"
            placeholder="Rechercher un client, un projet, un lead..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-mv-ink placeholder-mv-ink-mute focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded text-mv-ink-soft hover:text-mv-ink cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {!query.trim() ? (
            <div className="p-6 text-center text-xs text-mv-ink-soft">Commencez à taper pour chercher.</div>
          ) : results.length === 0 && !loading ? (
            <div className="p-6 text-center text-xs text-mv-ink-soft">Aucun résultat pour « {query} ».</div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-mv-cream-soft transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-mv-green-tint text-mv-green shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-mv-ink group-hover:text-mv-green transition-colors truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-mv-ink-soft">{item.subtitle}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-mv-ink-mute group-hover:text-mv-green group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-mv-border bg-mv-cream-soft/40 flex items-center justify-center text-[11px] text-mv-ink-soft">
          <span>
            Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-mv-surface border border-mv-border font-mono">Échap</kbd> ou cliquez à l'extérieur pour fermer
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
