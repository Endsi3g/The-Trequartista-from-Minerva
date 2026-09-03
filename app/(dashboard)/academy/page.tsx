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
  Youtube,
  Sparkles,
  Target,
  Building2,
  Briefcase,
  Zap,
} from 'lucide-react';
import { fetchAcademySops, addDocument, fetchCompletedSopIds } from '@/lib/services/supabase-data';
import { SkeletonCards } from '@/components/ui/skeleton';
import type { AcademySOP } from '@/lib/types';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useAppPermissions } from '@/components/providers/AppPermissionsProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { YouTubeCuratorModal } from '@/components/academy/YouTubeCuratorModal';
import { cn } from '@/lib/utils';

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
  const isTechAllowed = role === 'admin' || workspace === 'tech';

  const [sops, setSops] = useState<AcademySOP[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<'my-workspace' | 'prospection' | 'managing' | 'tech' | 'all'>('my-workspace');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [showAllSops, setShowAllSops] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

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

  const effectiveUserWorkspace = (workspace === 'tech' || workspace === 'managing' || workspace === 'prospection')
    ? workspace
    : 'prospection';

  const visibleSopsByRole = useMemo(() => {
    if (isTechAllowed) return sops;
    return sops.filter((s) => !TECH_IA_CATEGORIES.includes(s.category));
  }, [sops, isTechAllowed]);

  // Filter SOPs based on selected Workspace tab
  const workspaceFilteredSops = useMemo(() => {
    if (selectedWorkspace === 'all') return visibleSopsByRole;
    const target = selectedWorkspace === 'my-workspace' ? effectiveUserWorkspace : selectedWorkspace;

    return visibleSopsByRole.filter((s) => {
      if (s.target_workspace) {
        return s.target_workspace === target || s.target_workspace === 'all';
      }
      // Heuristic fallback
      if (target === 'tech') {
        return TECH_IA_CATEGORIES.includes(s.category) || s.category === 'Support & QA';
      }
      if (target === 'prospection') {
        return (
          s.category === 'Ventes & Prospection' ||
          s.pillar === 'flow' ||
          s.pillar === 'reach' ||
          s.title.includes('Reach') ||
          s.title.includes('Flow')
        );
      }
      if (target === 'managing') {
        return (
          s.category === 'Gestion de compte' ||
          s.category === 'Onboarding' ||
          s.category === 'Rôles & Rémunération' ||
          s.category === 'Stratégie & Offre'
        );
      }
      return true;
    });
  }, [visibleSopsByRole, selectedWorkspace, effectiveUserWorkspace]);

  // Workload / Workspace Progress
  const activeWorkspaceTarget = selectedWorkspace === 'my-workspace' ? effectiveUserWorkspace : selectedWorkspace;
  const currentWorkspaceSops = useMemo(() => {
    if (activeWorkspaceTarget === 'all') return visibleSopsByRole;
    return visibleSopsByRole.filter((s) => s.target_workspace === activeWorkspaceTarget);
  }, [visibleSopsByRole, activeWorkspaceTarget]);

  const workspaceDoneCount = currentWorkspaceSops.filter((s) => completedIds.includes(s.id)).length;
  const workspaceTotalCount = currentWorkspaceSops.length || 6;

  const onboardingPath = useMemo(
    () =>
      workspaceFilteredSops
        .filter((s) => s.is_onboarding_step)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
    [workspaceFilteredSops]
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
    return workspaceFilteredSops.reduce<Record<string, number>>((acc, sop) => {
      acc[sop.category] = (acc[sop.category] || 0) + 1;
      return acc;
    }, {});
  }, [workspaceFilteredSops]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]);
  }, [categoryCounts]);

  const filteredSops = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return workspaceFilteredSops.filter((sop) => {
      const matchSearch =
        !q ||
        sop.title.toLowerCase().includes(q) ||
        sop.description.toLowerCase().includes(q) ||
        sop.author.toLowerCase().includes(q) ||
        (sop.content_markdown || '').toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'all' || sop.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [workspaceFilteredSops, searchQuery, selectedCategory]);

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
    if (searchQuery || selectedCategory !== 'all' || showAllSops || selectedWorkspace !== 'all') {
      return filteredSops;
    }
    return essentialSops.length > 0 ? essentialSops : filteredSops.slice(0, 6);
  }, [filteredSops, essentialSops, showAllSops, searchQuery, selectedCategory, selectedWorkspace]);

  const remainingCount = filteredSops.length - visibleSops.length;

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-[5px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <GraduationCap className="w-4 h-4 text-mv-green" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Académie & SOPs Minerva
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({sops.length} process)
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* YouTube Curator Trigger */}
          <button
            onClick={() => setIsYouTubeModalOpen(true)}
            className="h-7 px-2.5 rounded-[4px] border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Dénicher des vidéos YouTube de formation et analyse"
          >
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>Curation YouTube</span>
          </button>

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
            title="Créer un document de travail vierge"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Brief Doc</span>
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

      {/* ── 1.2 WORKSPACE SELECTOR TABS ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[8px] p-2 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            {
              id: 'my-workspace',
              label: `Mon Workspace (${effectiveUserWorkspace})`,
              icon: Sparkles,
              color: 'text-emerald-700',
            },
            { id: 'prospection', label: 'Prospection (6)', icon: Target, color: 'text-emerald-700' },
            { id: 'managing', label: 'Managing (6)', icon: Building2, color: 'text-amber-700' },
            { id: 'tech', label: 'Tech (6)', icon: Code2, color: 'text-blue-700' },
            { id: 'all', label: 'Toutes les SOPs', icon: LayoutGrid, color: 'text-zinc-600' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedWorkspace === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedWorkspace(tab.id as typeof selectedWorkspace);
                  setSelectedCategory('all');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-[5px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                  active
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-emerald-400' : tab.color)} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Progress Indicator */}
        {activeWorkspaceTarget !== 'all' && (
          <div className="flex items-center gap-2.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-[5px] text-[11px] shrink-0">
            <span className="font-semibold text-zinc-700 capitalize">
              Parcours {activeWorkspaceTarget} :
            </span>
            <span className="font-mono font-bold text-emerald-700" style={MONO}>
              {workspaceDoneCount}/{workspaceTotalCount} validés
            </span>
            <div className="h-1.5 w-16 bg-zinc-200 rounded-full overflow-hidden shrink-0">
              <div
                className="h-full bg-mv-green rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (workspaceDoneCount / Math.max(1, workspaceTotalCount)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 1.5 Parcours d'intégration (Ordre suggéré) ── */}
      {onboardingPath.length > 0 && (
        <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-mv-green-tint text-mv-green border border-mv-green/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <GraduationCap className="w-3 h-3" />
                  <span>Parcours Prioritaire</span>
                </span>
              </div>
              <p className="text-xs text-mv-ink-soft">
                Étapes structurantes pour votre montée en compétences — {onboardingDoneCount}/{onboardingPath.length} complétées.
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
            {onboardingPath.slice(0, 5).map((sop, idx) => {
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

      {/* ── 3. Search & Filter Bar ── */}
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

        {/* Compact Category Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          <div className="relative shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-7 pl-2 pr-6 text-[11px] font-medium bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-[4px] text-zinc-700 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="all">Toutes les catégories ({workspaceFilteredSops.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat]})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-1.5 top-2 pointer-events-none" />
          </div>

          <div className="h-4 w-px bg-zinc-200 shrink-0" />

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
              {workspaceFilteredSops.length}
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

      {/* ── 4. Main Views: Grid vs DataTable ── */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : visibleSops.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-xs font-semibold text-zinc-700">Aucun guide dans cette sélection</p>
          <p className="text-[11px] text-zinc-400">Essayez un autre mot-clé ou réinitialisez les filtres.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Compact Cards Grid ── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleSops.map((sop) => {
              const isPillar = !!sop.pillar || sop.is_featured;
              const hasVideo = !!sop.video_url || sop.pillar === 'reach' || sop.title.includes('Reach');
              const isDone = completedIds.includes(sop.id);

              return (
                <div
                  key={sop.id}
                  onClick={() => router.push(`/academy/${sop.id}`)}
                  className={cn(
                    'bg-mv-surface border rounded-[6px] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group space-y-3',
                    isDone
                      ? 'border-emerald-200/90 bg-emerald-50/20'
                      : isPillar
                      ? 'border-emerald-200 hover:border-emerald-300'
                      : 'border-zinc-200/80 hover:border-zinc-300'
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-200/60">
                        {sop.category}
                      </span>
                      {sop.target_workspace && sop.target_workspace !== 'all' && (
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                            sop.target_workspace === 'prospection'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sop.target_workspace === 'tech'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          )}
                        >
                          {sop.target_workspace}
                        </span>
                      )}
                      {hasVideo && (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Youtube className="w-2.5 h-2.5" />
                          <span>VIDÉO</span>
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono" style={MONO}>
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{sop.read_time_min || 10} min</span>
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

                  {/* Card Footer */}
                  <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-[3px] bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[9px] font-bold">
                          M
                        </div>
                      )}
                      <span>{sop.author || 'Minerva'}</span>
                    </div>

                    <span className="text-[11.5px] font-medium text-emerald-700 group-hover:text-emerald-800 group-hover:underline inline-flex items-center gap-0.5">
                      <span>{isDone ? 'Revoir' : 'Consulter'}</span>
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
                <span>Afficher tous les guides (+{remainingCount} restants)</span>
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
                <span>Réduire la vue</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── 36px DataTable View ── */
        <div className="space-y-4">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pl-3.5 pr-2 text-left font-medium">Titre de la SOP</th>
                  <th className="px-2 text-left font-medium">Catégorie</th>
                  <th className="px-2 text-left font-medium">Workspace</th>
                  <th className="px-2 text-left font-medium">Temps</th>
                  <th className="px-2 text-left font-medium">Auteur</th>
                  <th className="pr-3.5 pl-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleSops.map((sop) => {
                  const isDone = completedIds.includes(sop.id);
                  return (
                    <tr
                      key={sop.id}
                      onClick={() => router.push(`/academy/${sop.id}`)}
                      className={cn(
                        'h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group',
                        isDone && 'bg-emerald-50/20'
                      )}
                    >
                      <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[320px]">
                        <div className="flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          )}
                          <span className="font-semibold text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                            {sop.title}
                          </span>
                          {(sop.video_url || sop.pillar === 'reach') && (
                            <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="bg-zinc-100 text-zinc-700 text-[10px] font-medium px-2 py-0.5 rounded border border-zinc-200/60 whitespace-nowrap">
                          {sop.category}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                          {sop.target_workspace || 'transversal'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                        {sop.read_time_min || 10} min
                      </td>
                      <td className="px-2 py-1.5 text-zinc-600 text-[11.5px] whitespace-nowrap">
                        {sop.author || 'Minerva'}
                      </td>
                      <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap">
                        <span className="text-[11px] font-medium text-emerald-700 group-hover:underline inline-flex items-center gap-0.5">
                          <span>{isDone ? 'Revoir' : 'Ouvrir'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Storage Drawer ── */}
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

      {/* YouTube Curator Modal */}
      <YouTubeCuratorModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        defaultCategory={
          effectiveUserWorkspace === 'tech'
            ? 'tech'
            : effectiveUserWorkspace === 'managing'
            ? 'managing'
            : 'prospection'
        }
      />
    </PageFadeIn>
  );
}
