'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpen,
  Clock,
  ArrowRight,
  Search,
  Film,
  Plus,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Play,
  CheckCircle2,
  X,
} from 'lucide-react';
import { fetchAcademySops } from '@/lib/services/supabase-data';
import type { AcademySOP } from '@/lib/types';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function AcademyPage() {
  const router = useRouter();
  const { can } = useAppPermissions();
  const [sops, setSops] = useState<AcademySOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setSops(await fetchAcademySops());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Keyboard shortcut: 'C' to create new SOP if permitted
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key.toLowerCase() === 'c' && can('publish_academy_sop')) {
        router.push('/academy/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [can, router]);

  const categoryCounts = useMemo(() => {
    return sops.reduce<Record<string, number>>((acc, sop) => {
      acc[sop.category] = (acc[sop.category] || 0) + 1;
      return acc;
    }, {});
  }, [sops]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
  }, [categoryCounts]);

  const filteredSops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sops.filter((sop) => {
      const matchSearch =
        !q ||
        sop.title.toLowerCase().includes(q) ||
        sop.description.toLowerCase().includes(q) ||
        sop.author.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'all' || sop.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [sops, searchQuery, selectedCategory]);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Académie & Process
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({sops.length} guide{sops.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control [ Grille | Liste ] */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'grid'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Grille</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <TableIcon className="w-3 h-3" />
              <span>Liste</span>
            </button>
          </div>

          {can('publish_academy_sop') && (
            <Link
              href="/academy/new"
              className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
              title="Nouvelle SOP (Touche C)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle SOP</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. Unified Search & Category Filter Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2 py-1 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              selectedCategory === 'all'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold border border-mv-border'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
            )}
          >
            <span>Toutes</span>
            <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
              ({sops.length})
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-2 py-1 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold border border-mv-border'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
              )}
            >
              <span>{cat}</span>
              <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                ({categoryCounts[cat]})
              </span>
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une SOP, un sujet... (/)"
            className="h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green w-56 sm:w-64 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Main Views: Grid vs Dense List (Linear Docs Style) ── */}
      {loading ? (
        <p className="text-xs text-zinc-400 text-center py-12 font-mono">Chargement des procédures…</p>
      ) : filteredSops.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <GraduationCap className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Aucune SOP trouvée</p>
          <p className="text-[11px] text-zinc-400">Modifiez vos critères de recherche ou créez une nouvelle procédure.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid of 3-column Compact SOP Cards ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSops.map((sop) => (
            <div
              key={sop.id}
              onClick={() => router.push(`/academy/${sop.id}`)}
              className="bg-mv-surface border border-mv-border hover:border-zinc-300 rounded-[6px] p-3.5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2">
                {/* Category Micro-Badge + Reading Time */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] bg-zinc-100/90 text-zinc-700 text-[10.5px] font-medium border border-zinc-200/50">
                    {sop.category}
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-500 flex items-center gap-1" style={MONO}>
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{sop.read_time_min} min</span>
                  </span>
                </div>

                {/* Title & Excerpt */}
                <h3 className="text-[13px] font-semibold text-zinc-900 group-hover:text-mv-green transition-colors leading-snug">
                  {sop.title}
                </h3>
                <p className="text-[11.5px] text-zinc-500 leading-relaxed line-clamp-2">
                  {sop.description}
                </p>

                {/* Video Snippet Banner (16:9) */}
                {sop.video_url && (
                  <div className="relative aspect-video rounded-[4px] overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xs">
                      <Play className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 text-[9.5px] bg-black/80 text-zinc-200 px-1.5 py-0.2 rounded font-mono font-medium" style={MONO}>
                      Tutoriel Vidéo .MP4
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: Author & Direct Link */}
              <div className="pt-2.5 border-t border-mv-border/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">Par {sop.author}</span>
                <span className="text-mv-green font-medium group-hover:underline flex items-center gap-0.5">
                  <span>Consulter</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Dense 36px DataTable List View (Linear Docs Style) ── */
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          <table className="w-full text-[12.5px] border-collapse">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 text-left font-medium">Procédure & Titre</th>
                <th className="px-2 text-left font-medium">Catégorie</th>
                <th className="px-2 text-left font-medium">Auteur</th>
                <th className="px-2 text-right font-medium">Temps de lecture</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSops.map((sop) => (
                <tr
                  key={sop.id}
                  onClick={() => router.push(`/academy/${sop.id}`)}
                  className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                        {sop.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] bg-zinc-100/90 text-zinc-700 text-[10.5px] font-medium border border-zinc-200/50">
                      {sop.category}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-[11.5px] text-zinc-600 font-medium truncate max-w-[140px]">
                    {sop.author}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                    {sop.read_time_min} min
                  </td>
                  <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap">
                    <span className="text-[11px] font-medium text-mv-green group-hover:underline inline-flex items-center gap-0.5">
                      <span>Consulter</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 4. Collapsible Media Storage Browser Section ── */}
      <div className="border border-mv-border rounded-[6px] bg-mv-surface overflow-hidden shadow-2xs">
        <button
          onClick={() => setIsStorageOpen((prev) => !prev)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-800 hover:bg-black/[0.015] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-zinc-500" />
            <span>Médiathèque & Fichiers Vidéos SOPs (Storage)</span>
          </div>
          {isStorageOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </button>

        {isStorageOpen && (
          <div className="p-3 border-t border-mv-border">
            <StorageBrowser defaultBucket="academy-media" title="Fichiers Vidéos & Supports SOPs" />
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
