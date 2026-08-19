'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  Table as TableIcon,
  Kanban,
  CheckCircle2,
  Map,
  ArrowRight,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { fetchProjects } from '@/lib/services/supabase-data';
import type { Project } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { PaginatedColumn } from '@/components/ui/paginated-column';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function formatRelativeDueDate(dateStr: string | null) {
  if (!dateStr) return { label: '—', isLate: false };
  const target = new Date(dateStr);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthDay = target.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' });

  if (diffDays < 0) {
    return { label: `${monthDay} (J+${Math.abs(diffDays)} retard)`, isLate: true };
  }
  if (diffDays === 0) {
    return { label: `${monthDay} (Aujourd'hui)`, isLate: false };
  }
  return { label: `${monthDay} (J-${diffDays})`, isLate: false };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState<'all' | 'in_progress' | 'review' | 'delivered'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setProjects(await fetchProjects());
      } catch (err) {
        console.warn('[Projects] Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = new Date();
  const activeProjects = projects.filter((p) => p.current_stage !== 'Live Production');
  const onTimeProjects = projects.filter((p) => {
    const isPastDue = p.due_date && new Date(p.due_date) < now;
    return p.health !== 'Needs Review' && !isPastDue;
  });
  const onTimePct = projects.length > 0 ? Math.round((onTimeProjects.length / projects.length) * 100) : 100;

  const filteredProjects = useMemo(() => {
    if (filterStage === 'all') return projects;
    if (filterStage === 'in_progress') return projects.filter((p) => p.current_stage === 'Design Framer' || p.current_stage === 'Onboarding');
    if (filterStage === 'review') return projects.filter((p) => p.current_stage === 'Launch Check' || p.health === 'Needs Review');
    if (filterStage === 'delivered') return projects.filter((p) => p.current_stage === 'Live Production');
    return projects;
  }, [projects, filterStage]);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Projets & Livraison
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({projects.length} projet{projects.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls: Segmented Control & Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control [ Table | Kanban ] */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Kanban className="w-3 h-3" />
              <span>Kanban</span>
            </button>
          </div>

          <Link
            href="/projects/new"
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Projet</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Top Continuous Synthesis Strip (32px) ── */}
      <div className="h-8 bg-mv-surface border border-mv-border rounded-[5px] px-3.5 flex items-center justify-between text-[11px] font-mono text-zinc-600 shadow-2xs overflow-x-auto whitespace-nowrap gap-4" style={MONO}>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">PROJETS ACTIFS :</span>
          <span className="font-semibold text-zinc-900">{projects.length}</span>
        </div>
        <span className="text-zinc-300">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">DANS LES TEMPS :</span>
          <span className="font-semibold text-mv-green">{onTimePct}%</span>
        </div>
        <span className="text-zinc-300">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">LIVRAISONS DU MOIS :</span>
          <span className="font-semibold text-zinc-900">1</span>
        </div>
        <span className="text-zinc-300">·</span>
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">TEMPS RESTANT MOYEN :</span>
          <span className="font-semibold text-zinc-900">29j</span>
        </div>
      </div>

      {/* ── 3. Table / Kanban Content ── */}
      {viewMode === 'table' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          {/* Quick Filters Toolbar */}
          <div className="flex items-center gap-1 px-3.5 py-2 border-b border-mv-border bg-black/[0.01] overflow-x-auto">
            {([
              { key: 'all', label: 'Tous', count: projects.length },
              { key: 'in_progress', label: 'En cours', count: projects.filter((p) => p.current_stage === 'Design Framer').length },
              { key: 'review', label: 'En revue', count: projects.filter((p) => p.current_stage === 'Launch Check' || p.health === 'Needs Review').length },
              { key: 'delivered', label: 'Livrés', count: projects.filter((p) => p.current_stage === 'Live Production').length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStage(tab.key)}
                className={cn(
                  'px-2 py-1 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
                  filterStage === tab.key
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold border border-mv-border'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                  ({tab.count})
                </span>
              </button>
            ))}
          </div>

          {/* DataTable */}
          {loading ? (
            <p className="text-xs text-zinc-400 text-center py-10 font-mono">Chargement des projets…</p>
          ) : filteredProjects.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <p className="text-xs font-semibold text-zinc-700">Aucun projet trouvé</p>
              <p className="text-[11px] text-zinc-400">Ajoutez un nouveau projet pour démarrer le suivi de production.</p>
            </div>
          ) : (
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                  <th className="pl-3.5 pr-2 text-left font-medium">Identifiant & Projet</th>
                  <th className="px-2 text-left font-medium">Client</th>
                  <th className="px-2 text-left font-medium">Étape / Livrable</th>
                  <th className="px-2 text-left font-medium">Santé</th>
                  <th className="px-2 text-left font-medium">Progression</th>
                  <th className="px-2 text-right font-medium">Échéance</th>
                  <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((proj, idx) => {
                  const keyId = `MIN-0${idx + 1}`;
                  const isAlert = proj.health === 'Needs Review' || (proj.due_date && new Date(proj.due_date) < now);
                  const dueMeta = formatRelativeDueDate(proj.due_date);

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => router.push(`/projects/${proj.id}/roadmap`)}
                      className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[240px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] font-mono text-zinc-400 shrink-0" style={MONO}>
                            {keyId}
                          </span>
                          <span className="font-semibold text-zinc-900 truncate group-hover:text-mv-green transition-colors">
                            {proj.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 py-1.5 text-[11.5px] text-zinc-600 font-medium truncate max-w-[140px]">
                        {proj.client_name || 'Client'}
                      </td>

                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] bg-zinc-100/90 text-zinc-700 text-[10.5px] font-medium border border-zinc-200/50">
                          {proj.current_stage || 'En production'}
                        </span>
                      </td>

                      <td className="px-2 py-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn('w-1.5 h-1.5 rounded-full shrink-0', isAlert ? 'bg-rose-500' : 'bg-mv-green')}
                          />
                          <span className="text-[11px] font-medium text-zinc-700">
                            {isAlert ? 'À surveiller' : 'On Track'}
                          </span>
                        </div>
                      </td>

                      <td className="px-2 py-1.5 w-28">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all', isAlert ? 'bg-rose-500' : 'bg-mv-green')}
                              style={{ width: `${proj.progress_pct || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 w-7 text-right" style={MONO}>
                            {proj.progress_pct || 0}%
                          </span>
                        </div>
                      </td>

                      <td className={cn('px-2 py-1.5 text-right font-mono text-[11px] whitespace-nowrap', dueMeta.isLate ? 'text-rose-600 font-semibold' : 'text-zinc-600')} style={MONO}>
                        {dueMeta.label}
                      </td>

                      <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/projects/${proj.id}/roadmap`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-0.5"
                        >
                          <span>Roadmap</span>
                          <Map className="w-2.5 h-2.5" />
                        </Link>
                        <Link
                          href={`/projects/${proj.id}/launch-check`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-medium text-mv-green hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Checklist</span>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Kanban View (Dense Columns) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
          {['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'].map((stage) => {
            const stageProjects = projects.filter((p) => p.current_stage === stage);
            return (
              <div
                key={stage}
                className="bg-mv-cream-soft/60 border border-mv-border rounded-lg flex flex-col min-h-[400px] overflow-hidden"
              >
                <div className="p-2.5 border-b border-mv-border bg-mv-surface flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-mv-ink truncate">
                    {stage}
                  </span>
                  <span className="text-[10px] font-mono text-mv-ink-soft bg-mv-cream-soft px-1.5 py-0.2 rounded" style={MONO}>
                    {stageProjects.length}
                  </span>
                </div>

                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  <PaginatedColumn
                    items={stageProjects}
                    getKey={(p) => p.id}
                    emptyLabel="Vide"
                    renderItem={(p) => (
                      <div
                        onClick={() => router.push(`/projects/${p.id}/roadmap`)}
                        className="border border-mv-border bg-mv-surface hover:border-mv-green/40 rounded-md p-2.5 shadow-2xs transition-all cursor-pointer group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="font-semibold text-[12px] text-mv-ink group-hover:text-mv-green transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[10.5px] text-mv-ink-faint font-medium truncate">{p.client_name}</div>
                          </div>
                          <span className="text-[10px] font-mono text-mv-green font-semibold" style={MONO}>
                            {p.progress_pct}%
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-mv-border/60 text-[10.5px]">
                          <span className="text-mv-ink-soft font-mono" style={MONO}>
                            {p.due_date ? new Date(p.due_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : '—'}
                          </span>
                          <Link
                            href={`/projects/${p.id}/launch-check`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-mv-green font-semibold hover:underline flex items-center gap-0.5"
                          >
                            <span>Check</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}
