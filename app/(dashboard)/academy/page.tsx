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
  Plus,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  X,
  Filter,
  Bot,
  Cpu,
  Terminal,
  Network,
  Code2,
  Database,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { fetchAcademySops, addDocument, fetchCompletedSopIds } from '@/lib/services/supabase-data';
import { SkeletonCards } from '@/components/ui/skeleton';
import type { AcademySOP } from '@/lib/types';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

// SOPs no longer have stable hardcoded ids (they're real DB UUIDs now) --
// look them up by their known, stable title prefix instead.
function findSopIdByTitle(sops: AcademySOP[], titlePrefix: string): string | null {
  return sops.find((s) => s.title.startsWith(titlePrefix))?.id || null;
}

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const TECH_IA_CATEGORIES = [
  'IA & Ingénierie',
  'Workflows IA',
  'Développement',
  'Tech',
  'Tech & Ingénierie',
  'Design Framer',
  'Framer & Design',
];

export default function AcademyPage() {
  const router = useRouter();
  const { can } = useAppPermissions();
  const { id: userId, workspace, role } = useCurrentUser();
  const isTechCursusVisible = role === 'admin' || workspace === 'tech';
  const isTechAllowed = role === 'admin' || workspace === 'tech';
  const [sops, setSops] = useState<AcademySOP[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [showAllSops, setShowAllSops] = useState(false);

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

  useEffect(() => {
    if (!userId) return;
    fetchCompletedSopIds(userId).then(setCompletedIds);
  }, [userId]);

  const visibleSopsByWorkspace = useMemo(() => {
    if (isTechAllowed) return sops;
    return sops.filter((s) => !TECH_IA_CATEGORIES.includes(s.category));
  }, [sops, isTechAllowed]);

  const onboardingPath = useMemo(
    () =>
      visibleSopsByWorkspace
        .filter((s) => s.is_onboarding_step)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
    [visibleSopsByWorkspace]
  );
  const onboardingDoneCount = onboardingPath.filter((s) => completedIds.includes(s.id)).length;

  // Keyboard shortcut: 'C' to create new SOP, '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key.toLowerCase() === 'c' && can('publish_academy_sop')) {
        e.preventDefault();
        router.push('/academy/new');
      } else if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('academy-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [can, router]);

  const categoryCounts = useMemo(() => {
    return visibleSopsByWorkspace.reduce<Record<string, number>>((acc, sop) => {
      acc[sop.category] = (acc[sop.category] || 0) + 1;
      return acc;
    }, {});
  }, [visibleSopsByWorkspace]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
  }, [categoryCounts]);

  const filteredSops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return visibleSopsByWorkspace.filter((sop) => {
      const matchSearch =
        !q ||
        sop.title.toLowerCase().includes(q) ||
        sop.description.toLowerCase().includes(q) ||
        sop.author.toLowerCase().includes(q) ||
        (sop.content_markdown || '').toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'all' || sop.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [visibleSopsByWorkspace, searchQuery, selectedCategory]);

  // Distinguish Essential / Pillar SOPs from secondary SOPs -- now a clean
  // read of the real is_featured/is_essential DB columns (populated by the
  // academy rebuild migration) instead of a heuristic guessing at fields
  // that didn't actually exist in the database.
  const { essentialSops, secondarySops } = useMemo(() => {
    const essential: AcademySOP[] = [];
    const secondary: AcademySOP[] = [];

    filteredSops.forEach((sop) => {
      if (sop.is_featured || sop.is_essential) {
        essential.push(sop);
      } else {
        secondary.push(sop);
      }
    });

    return { essentialSops: essential, secondarySops: secondary };
  }, [filteredSops]);

  const visibleSops = useMemo(() => {
    if (searchQuery || selectedCategory !== 'all' || showAllSops) {
      return filteredSops;
    }
    return essentialSops.length > 0 ? essentialSops : filteredSops.slice(0, 6);
  }, [filteredSops, essentialSops, showAllSops, searchQuery, selectedCategory]);

  const remainingCount = filteredSops.length - visibleSops.length;

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
              Académie & Process Minerva
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({sops.length} process)
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

          <button
            onClick={async () => {
              const doc = await addDocument('Brief Prospect — Nouveau Client', null);
              if (doc) router.push(`/documents/${doc.id}`);
            }}
            className="h-7 px-2.5 rounded-[4px] border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Créer un document de prospection vierge"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Brief Prospect</span>
          </button>

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

      {/* ── 1.5 Parcours d'intégration : ordre suggéré pour un nouveau membre ── */}
      {onboardingPath.length > 0 && (
        <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-mv-green-tint text-mv-green border border-mv-green/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <GraduationCap className="w-3 h-3" />
                  <span>Parcours d&apos;intégration</span>
                </span>
              </div>
              <p className="text-xs text-mv-ink-soft">
                L&apos;ordre suggéré pour un nouveau membre d&apos;équipe — {onboardingDoneCount}/{onboardingPath.length} complétées.
              </p>
            </div>
            <div className="h-1.5 w-full sm:w-40 bg-black/[0.06] rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-mv-green rounded-full transition-all duration-300"
                style={{ width: `${(onboardingDoneCount / onboardingPath.length) * 100}%` }}
              />
            </div>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {onboardingPath.map((sop, idx) => {
              const done = completedIds.includes(sop.id);
              return (
                <li key={sop.id}>
                  <Link
                    href={`/academy/${sop.id}`}
                    className={cn(
                      'flex items-start gap-2 p-3 rounded-[6px] border transition-colors h-full',
                      done
                        ? 'bg-mv-green-tint/40 border-mv-green/30'
                        : 'bg-mv-cream-soft border-mv-border hover:border-mv-green/40'
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-mv-green shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-mv-ink-faint shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-mv-ink-faint" style={MONO}>
                        ÉTAPE {idx + 1}
                      </span>
                      <p className="text-[12px] font-semibold text-mv-ink leading-snug line-clamp-2">
                        {sop.title}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* ── 2. Cursus Officiel : AI Engineering & Outils Agentiques (Tech uniquement) ── */}
      {isTechCursusVisible && (
      <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mv-border/60 pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3 text-emerald-700" />
                <span>Cursus Technique Officiel</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                6 Modules • 145 min au total
              </span>
            </div>
            <h2 className="text-[15px] sm:text-base font-bold text-mv-ink tracking-tight">
              AI Engineering, Antigravity & Claude Code
            </h2>
            <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
              Le programme complet pour maîtriser les architectures agentiques, les workflows d’ingénierie IA, le serveur MCP v2 et les pratiques AI-First de Minerva.
            </p>
          </div>
          <button
            onClick={() => setSelectedCategory('IA & Ingénierie')}
            className="self-start sm:self-center px-3 py-1.5 rounded-[4px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-mv-border"
          >
            <Filter className="w-3 h-3 text-zinc-500" />
            <span>Filtrer ce cursus ({categoryCounts['IA & Ingénierie'] || 6})</span>
          </button>
        </div>

        {/* 6 Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              titlePrefix: 'SOP-IA-01',
              step: '01',
              title: 'Fondations AI Engineering',
              focus: 'LLMs, Context Engineering, Tool Calling & Loops',
              duration: '25 min',
              icon: Cpu,
              color: 'text-blue-700 bg-blue-50 border-blue-200',
            },
            {
              titlePrefix: 'SOP-IA-02',
              step: '02',
              title: 'Guide Expert Antigravity',
              focus: 'Slash Commands, Subagents, Planning Mode & Skills',
              duration: '30 min',
              icon: Bot,
              color: 'text-purple-700 bg-purple-50 border-purple-200',
            },
            {
              titlePrefix: 'SOP-IA-03',
              step: '03',
              title: 'Guide Expert Claude Code',
              focus: 'Terminal CLI, /compact, CLAUDE.md & Git Workflows',
              duration: '25 min',
              icon: Terminal,
              color: 'text-amber-700 bg-amber-50 border-amber-200',
            },
            {
              titlePrefix: 'SOP-IA-04',
              step: '04',
              title: 'Minerva MCP Server',
              focus: 'Protocole MCP v2, /api/mcp, Auth Tokens & Tools',
              duration: '20 min',
              icon: Network,
              color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            },
            {
              titlePrefix: 'SOP-IA-05',
              step: '05',
              title: 'Workflow Dev AI-First',
              focus: 'Spec-to-Code, Playwright QA, Migrations & Real Data',
              duration: '25 min',
              icon: Code2,
              color: 'text-rose-700 bg-rose-50 border-rose-200',
            },
            {
              titlePrefix: 'SOP-IA-06',
              step: '06',
              title: 'RAG Avancé & pgvector',
              focus: 'Vector Search pgvector, Chunking, FTS & RRF Hybride',
              duration: '25 min',
              icon: Database,
              color: 'text-teal-700 bg-teal-50 border-teal-200',
            },
          ].map((item) => {
            const Icon = item.icon;
            const sopId = findSopIdByTitle(sops, item.titlePrefix);
            return (
              <Link
                key={item.titlePrefix}
                href={sopId ? `/academy/${sopId}` : '/academy'}
                className="group relative bg-white hover:bg-zinc-50/80 border border-mv-border rounded-[6px] p-3.5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-[3px]" style={MONO}>
                      M{item.step}
                    </span>
                    <div className={cn('w-6 h-6 rounded-[4px] border flex items-center justify-center shrink-0', item.color)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="text-[10.5px] font-mono text-zinc-400 flex items-center gap-1" style={MONO}>
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {item.duration}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[13px] font-bold text-mv-ink group-hover:text-mv-green transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11.5px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {item.focus}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] font-semibold text-zinc-600 group-hover:text-mv-green transition-colors">
                  <span>Accéder au module</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      {/* ── 3. Compact & Navigable Toolbar (Search + Compact Filter Pills + Dropdown) ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left Search Bar with '/' Shortcut */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            id="academy-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une SOP... (Touche /)"
            className="w-full h-8 pl-8 pr-7 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-2 px-1 rounded bg-zinc-100 border border-zinc-200 text-[9px] font-mono text-zinc-400 pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Compact Category Navigation (Responsive Horizontal Pills + Dropdown) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          {/* Quick Dropdown for dense navigation */}
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-7 pl-2 pr-6 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-[4px] text-zinc-700 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all">Toutes les catégories ({sops.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-2 pointer-events-none" />
          </div>

          <div className="h-4 w-px bg-zinc-200 shrink-0" />

          {/* Quick Filter Pills (Top categories) */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0',
              selectedCategory === 'all'
                ? 'bg-zinc-900 text-white font-semibold'
                : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
            )}
          >
            <span>Toutes</span>
            <span className="font-mono text-[10px] opacity-80" style={MONO}>
              {sops.length}
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-2.5 py-1 text-[11px] font-medium rounded-[4px] transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0',
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-600'
              )}
            >
              <span>{cat}</span>
              <span className="font-mono text-[10px] opacity-80" style={MONO}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Main Views: Grid vs 36px DataTable ── */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : visibleSops.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Aucun guide dans cette catégorie</p>
          <p className="text-[11px] text-zinc-400">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Compact Cards Grid ── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleSops.map((sop) => {
              const isPillar = !!sop.pillar || sop.is_featured;
              return (
                <div
                  key={sop.id}
                  onClick={() => router.push(`/academy/${sop.id}`)}
                  className={cn(
                    'bg-mv-surface border rounded-[6px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group space-y-3',
                    isPillar ? 'border-emerald-200 hover:border-emerald-300' : 'border-zinc-200/80 hover:border-zinc-300'
                  )}
                >
                  {/* Card Header: Category Badge & Reading Time */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-200/60">
                        {sop.category}
                      </span>
                      {isPillar && (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                          PILIER
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono" style={MONO}>
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{sop.read_time_min || 5} min</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-[13.5px] font-semibold text-zinc-900 leading-snug group-hover:text-mv-green transition-colors line-clamp-2">
                      {sop.title}
                    </h3>
                    <p className="text-[11.5px] text-zinc-500 line-clamp-2 leading-relaxed mt-1">
                      {sop.description || 'Guide opératoire standardisé et checklist étape par étape.'}
                    </p>
                  </div>

                  {/* Card Footer: Minerva Badge & Action Link */}
                  <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                      <div className="w-4 h-4 rounded-[3px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[9px] font-bold">
                        M
                      </div>
                      <span>{sop.author || 'Minerva'}</span>
                    </div>

                    <span className="text-[11.5px] font-medium text-emerald-700 group-hover:text-emerald-800 group-hover:underline inline-flex items-center gap-0.5">
                      <span>Consulter</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Collapsible 'Voir plus' button for secondary SOPs */}
          {!searchQuery && selectedCategory === 'all' && remainingCount > 0 && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAllSops(true)}
                className="h-8 px-4 rounded-[5px] bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-700 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                <span>Afficher les autres guides et SOPs (+{remainingCount} restants)</span>
              </button>
            </div>
          )}

          {showAllSops && !searchQuery && selectedCategory === 'all' && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setShowAllSops(false)}
                className="h-7 px-3 rounded-[4px] bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Réduire la vue (afficher seulement les piliers essentiels)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── 36px DataTable View (Linear Docs Style) ── */
        <div className="space-y-4">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pl-3.5 pr-2 text-left font-medium">Titre de la SOP</th>
                  <th className="px-2 text-left font-medium">Catégorie</th>
                  <th className="px-2 text-left font-medium">Temps</th>
                  <th className="px-2 text-left font-medium">Auteur</th>
                  <th className="pr-3.5 pl-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleSops.map((sop) => (
                  <tr
                    key={sop.id}
                    onClick={() => router.push(`/academy/${sop.id}`)}
                    className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-semibold text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                          {sop.title}
                        </span>
                        {(sop.is_featured || sop.pillar) && (
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                            PILIER
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-200/60 whitespace-nowrap">
                        {sop.category}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                      {sop.read_time_min || 5} min
                    </td>
                    <td className="px-2 py-1.5 text-zinc-600 text-[11.5px] whitespace-nowrap">
                      {sop.author || 'Minerva'}
                    </td>
                    <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap">
                      <span className="text-[11px] font-medium text-emerald-700 group-hover:underline inline-flex items-center gap-0.5">
                        <span>Ouvrir</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!searchQuery && selectedCategory === 'all' && remainingCount > 0 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllSops(true)}
                className="h-8 px-4 rounded-[5px] bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-700 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                <span>Afficher les {remainingCount} autres guides</span>
              </button>
            </div>
          )}

          {showAllSops && !searchQuery && selectedCategory === 'all' && (
            <div className="text-center">
              <button
                onClick={() => setShowAllSops(false)}
                className="h-7 px-3 rounded-[4px] bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 text-[11px] font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Réduire la vue</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 5. Collapsible Media Storage Drawer (36px Height Header) ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <button
          onClick={() => setIsStorageOpen(!isStorageOpen)}
          className="w-full h-9 px-3.5 flex items-center justify-between text-[12px] font-medium text-zinc-700 hover:bg-black/[0.02] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
            <span>Médiathèque & Fichiers Vidéos SOPs</span>
            <span className="text-[11px] font-mono text-zinc-400 ml-1" style={MONO}>
              (Stockage Cloud)
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-[10.5px] font-mono" style={MONO}>
              {isStorageOpen ? 'Masquer' : 'Explorer les fichiers'}
            </span>
            <ChevronDown
              className={cn('w-3.5 h-3.5 transition-transform duration-200', isStorageOpen && 'rotate-180')}
            />
          </div>
        </button>

        {isStorageOpen && (
          <div className="p-3.5 border-t border-mv-border bg-mv-cream-soft">
            <StorageBrowser defaultBucket="academy-media" title="Médiathèque de l’Académie" />
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
