'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Youtube,
  Search,
  ExternalLink,
  Play,
  Copy,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { extractYouTubeVideoId } from '@/components/media/VideoAssetPlayer';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface YouTubeCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'prospection' | 'managing' | 'tech' | 'reach';
  onSelectUrl?: (url: string) => void;
}

interface CuratedSearchTemplate {
  id: string;
  title: string;
  category: 'prospection' | 'managing' | 'tech' | 'reach';
  query: string;
  description: string;
  suggestedChannels: string[];
}

const CURATED_TEMPLATES: CuratedSearchTemplate[] = [
  {
    id: 'b2b-cold-calling',
    title: 'Prospection B2B & Cold Calling Restauration',
    category: 'prospection',
    query: 'cold calling restaurant b2b sales live sales call pitch',
    description: 'Vrais appels à froid de vente avec gestion des objections restaurateurs.',
    suggestedChannels: ['Trent Dressel', 'Alex Hormozi', 'Josh Braun'],
  },
  {
    id: 'closing-demo',
    title: 'Closing & Négociation Démo sans Friction',
    category: 'prospection',
    query: 'b2b software demo script SaaS closing techniques sales framework',
    description: 'Structures de démonstration produit haute conversion et passage à la signature.',
    suggestedChannels: ['Chris Do', 'Patrick Dang', 'Jeremy Miner'],
  },
  {
    id: 'reach-maps',
    title: 'Minerva Reach & Prospection Locale Google Maps',
    category: 'reach',
    query: 'google maps b2b lead generation local business outreach workflow',
    description: 'Extraction de commerces locaux montréalais et qualification rapide.',
    suggestedChannels: ['Jordan Welch', 'Liam Ottley', 'Brett Malinowski'],
  },
  {
    id: 'account-management',
    title: 'Account Management & Rétention Agence (90%+)',
    category: 'managing',
    query: 'agency client onboarding client retention frameworks customer success SaaS',
    description: 'Protocoles d’accueil client J+2, prévention churn et charge d’équipe.',
    suggestedChannels: ['Nick Saraev', 'Agency Velocity', 'Goran de Silva'],
  },
  {
    id: 'nextjs-supabase',
    title: 'Next.js 16 App Router & Supabase RLS Haute Performance',
    category: 'tech',
    query: 'Next.js 16 App Router Supabase PostgreSQL RLS architecture tutorial',
    description: 'Tutoriels avancés sur l’architecture Next.js 16 et la sécurité PostgreSQL RLS.',
    suggestedChannels: ['Jack Herrington', 'Theo - t3.gg', 'Supabase Official'],
  },
  {
    id: 'pos-printers',
    title: 'Intégration Systèmes POS & Imprimantes Thermiques ESC/POS',
    category: 'tech',
    query: 'ESC POS thermal printer web bluetooth receipt printing kitchen display system',
    description: 'Guides d’ingénierie pour protocoles d’impression en cuisine et caisses directes.',
    suggestedChannels: ['Web Dev Simplified', 'Dave Gray', 'Fireship'],
  },
];

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'prospection', label: 'Prospection & Vente' },
  { id: 'reach', label: 'Minerva Reach' },
  { id: 'managing', label: 'Managing & Ops' },
  { id: 'tech', label: 'Tech & Systèmes' },
];

export function YouTubeCuratorModal({
  isOpen,
  onClose,
  defaultCategory = 'prospection',
  onSelectUrl,
}: YouTubeCuratorModalProps) {
  const { toastSuccess } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = useMemo(() => {
    return CURATED_TEMPLATES.filter((t) => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.suggestedChannels.some((ch) => ch.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        setSelectedIndex(0);
      }, 50);
    }
  }, [isOpen]);

  const handleOpenSearch = (template: CuratedSearchTemplate) => {
    const encoded = encodeURIComponent(template.query);
    const url = `https://www.youtube.com/results?search_query=${encoded}`;
    if (onSelectUrl) {
      onSelectUrl(url);
      onClose();
    } else {
      window.open(url, '_blank');
    }
  };

  const handleCopyUrl = (template: CuratedSearchTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const encoded = encodeURIComponent(template.query);
    const url = `https://www.youtube.com/results?search_query=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopiedId(template.id);
    toastSuccess('Lien copié', url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Keyboard navigation: Escape to close, Up/Down to navigate, Enter to trigger, ⌘+C to copy
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredTemplates.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && filteredTemplates.length > 0) {
        e.preventDefault();
        const current = filteredTemplates[selectedIndex];
        if (current) handleOpenSearch(current);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        const current = filteredTemplates[selectedIndex];
        if (current) {
          handleCopyUrl(current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredTemplates]);

  if (!isOpen) return null;

  const testVideoId = extractYouTubeVideoId(testUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-[680px] bg-white border border-zinc-200 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* ── 1. Top Search Bar (h-10 / 40px) ── */}
        <div className="h-10 border-b border-zinc-100 px-3 flex items-center gap-2.5 bg-white">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher playbook vidéo, chaîne créateur ou sujet..."
            className="w-full h-full text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none bg-transparent"
          />

          {/* Domain Micro-Badge Filter */}
          <select
            value={activeCategory}
            onChange={(e) => {
              setActiveCategory(e.target.value);
              setSelectedIndex(0);
            }}
            className="h-6 px-1.5 text-[10px] font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-700 focus:outline-none cursor-pointer shrink-0"
            style={MONO}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-900 rounded transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── 2. Quick Filters Ribbon (h-7 / 28px) ── */}
        <div className="h-7 bg-zinc-50 border-b border-zinc-100 px-3 flex items-center gap-1 text-[11px] overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedIndex(0);
              }}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer shrink-0',
                activeCategory === cat.id
                  ? 'bg-white text-zinc-900 border border-zinc-200 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── 3. Dense Results & Playbooks List (40px rows) ── */}
        <div className="max-h-[280px] overflow-y-auto divide-y divide-zinc-100 bg-white">
          {filteredTemplates.length === 0 ? (
            <div className="h-16 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
              Aucun playbook vidéo correspondant
            </div>
          ) : (
            filteredTemplates.map((template, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={template.id}
                  onClick={() => handleOpenSearch(template)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'h-10 px-3 flex items-center justify-between text-xs cursor-pointer transition-colors group',
                    isSelected ? 'bg-zinc-100/80 text-zinc-900' : 'hover:bg-zinc-50 text-zinc-800'
                  )}
                >
                  {/* Left: Icon + Title + Snippet */}
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-5 h-5 rounded bg-red-50 text-red-600 border border-red-200/80 flex items-center justify-center shrink-0">
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate leading-tight text-xs">
                        {template.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate leading-tight">
                        {template.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Channel Pill & Action Hints */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded truncate max-w-[120px]"
                      style={MONO}
                      title={template.suggestedChannels.join(', ')}
                    >
                      {template.suggestedChannels[0]}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleCopyUrl(template, e)}
                      className="h-6 px-1.5 text-[10px] font-mono rounded border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                      title="Copier lien (⌘+C)"
                    >
                      {copiedId === template.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                      <span className="hidden sm:inline">⌘C</span>
                    </button>

                    <span
                      className={cn(
                        'h-6 px-1.5 text-[10px] font-mono rounded flex items-center gap-0.5',
                        isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                      )}
                      style={MONO}
                    >
                      ↵
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 4. Quick URL Tester ── */}
        <div className="p-2.5 border-t border-zinc-100 bg-zinc-50/50 space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Coller URL YouTube ou Reel direct (ex: https://youtu.be/...)"
              className="h-7 px-2 text-xs font-mono bg-white border border-zinc-200 rounded flex-1 focus:outline-none focus:border-emerald-600"
              style={MONO}
            />
            {testVideoId && (
              <a
                href={`https://www.youtube.com/watch?v=${testVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
              >
                <span>Ouvrir</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* ── 5. Technical Micro-Footer (h-7 / 28px) ── */}
        <div className="h-7 bg-zinc-50 border-t border-zinc-100 px-3 flex justify-between items-center text-[10px] text-zinc-400 font-mono" style={MONO}>
          <span>↑↓ naviguer • ↵ ouvrir recherche • ⌘C copier • Échap quitter</span>
          <span className="text-zinc-600 font-medium">Académie Minerva</span>
        </div>
      </div>
    </div>
  );
}
