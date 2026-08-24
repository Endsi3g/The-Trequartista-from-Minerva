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
  Trash2,
  CheckSquare,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { fetchProjects, deleteProject } from '@/lib/services/supabase-data';
import type { Project } from '@/lib/types';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
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

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const confirmDialog = useConfirm();
  const { toastSuccess, toastError } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setProjects(await fetchProjects());
    } catch (err) {
      console.warn('[Projects] Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const onTimeProjects = projects.filter((p) => {
    const isPastDue = p.due_date && new Date(p.due_date) < now;
    return p.health !== 'Needs Review' && !isPastDue;
  });
  const onTimePct = projects.length > 0 ? Math.round((onTimeProjects.length / projects.length) * 100) : 100;

  const filteredProjects = useMemo(() => {
    if (filterStage === 'all') return projects;
    if (filterStage === 'in_progress')
      return projects.filter(
        (p) => p.current_stage === 'Design Framer' || p.current_stage === 'Onboarding'
      );
    if (filterStage === 'review')
      return projects.filter(
        (p) => p.current_stage === 'Launch Check' || p.health === 'Needs Review'
      );
    if (filterStage === 'delivered')
      return projects.filter((p) => p.current_stage === 'Live Production');
    return projects;
  }, [projects, filterStage]);

  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjects.length && filteredProjects.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
    }
  };

  const handleDeleteOne = async (e: React.MouseEvent, proj: Project) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Supprimer ce projet ?',
      message: `« ${proj.name} » et l'ensemble de ses jalons associés seront définitivement supprimés.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;

    setProjects((prev) => prev.filter((p) => p.id !== proj.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(proj.id);
      return next;
    });

    const done = await deleteProject(proj.id);
    if (done) {
      toastSuccess('Projet supprimé', `« ${proj.name} » a été retiré.`);
    } else {
      toastError('Erreur', 'Impossible de supprimer le projet.');
      load();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const ok = await confirmDialog({
      title: `Supprimer ${count} projet${count > 1 ? 's' : ''} ?`,
      message: `Ces ${count} chantiers et leurs feuilles de route seront définitivement supprimés.`,
      confirmLabel: `Supprimer (${count})`,
      variant: 'danger',
    });
    if (!ok) return;

    setIsDeletingBulk(true);
    const idsToDelete = Array.from(selectedIds);

    setProjects((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());

    try {
      await Promise.all(idsToDelete.map((id) => deleteProject(id)));
      toastSuccess('Projets supprimés', `${count} projet${count > 1 ? 's ont été retirés' : ' a été retiré'}.`);
    } catch {
      toastError('Erreur', 'Certains projets n’ont pas pu être supprimés.');
      load();
    } finally {
      setIsDeletingBulk(false);
    }
  };

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
      <div
        className="h-8 bg-mv-surface border border-mv-border rounded-[5px] px-3.5 flex items-center justify-between text-[11px] font-mono text-zinc-600 shadow-2xs overflow-x-auto whitespace-nowrap gap-4"
        style={MONO}
      >
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
          <span className="text-zinc-400">TEMPLATE DISPONIBLE :</span>
          <span className="font-semibold text-emerald-700">Minerva-Flow 0%</span>
        </div>
      </div>

      {/* ── 2.5 Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-[6px] px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-rose-900">
              {selectedIds.size} projet{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md transition-colors cursor-pointer"
            >
              Désélectionner
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isDeletingBulk}
              className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. Table / Kanban Content ── */}
      {viewMode === 'table' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          {/* Quick Filters Toolbar */}
          <div className="flex items-center gap-1 px-3.5 py-2 border-b border-mv-border bg-black/[0.01] overflow-x-auto">
            {([
              { key: 'all', label: 'Tous', count: projects.length },
              {
                key: 'in_progress',
                label: 'En cours',
                count: projects.filter((p) => p.current_stage === 'Design Framer' || p.current_stage === 'Onboarding').length,
              },
              {
                key: 'review',
                label: 'En revue',
                count: projects.filter((p) => p.current_stage === 'Launch Check' || p.health === 'Needs Review').length,
              },
              {
                key: 'delivered',
                label: 'Livrés',
                count: projects.filter((p) => p.current_stage === 'Live Production').length,
              },
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
                  <th className="pl-3.5 pr-1 w-8 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredProjects.length && filteredProjects.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="px-2 text-left font-medium">Identifiant & Projet</th>
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
                  const isSelected = selectedIds.has(proj.id);

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => router.push(`/projects/${proj.id}/roadmap`)}
                      className={cn(
                        'h-9 border-b border-mv-border last:border-0 transition-colors cursor-pointer group',
                        isSelected ? 'bg-emerald-50/30' : 'hover:bg-black/[0.02]'
                      )}
                    >
                      <td className="pl-3.5 pr-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectOne(proj.id, e as unknown as React.MouseEvent)}
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="px-2 py-1.5 min-w-0 max-w-[240px]">
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

                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
                            <div
                              className="h-full bg-mv-green transition-all"
                              style={{ width: `${proj.progress_pct || 0}%` }}
                            />
                          </div>
                          <span className="text-[10.5px] font-mono text-zinc-500" style={MONO}>
                            {proj.progress_pct || 0}%
                          </span>
                        </div>
                      </td>

                      <td className="px-2 py-1.5 text-right font-mono text-[11px] text-zinc-500" style={MONO}>
                        <span className={cn(dueMeta.isLate && 'text-rose-600 font-semibold')}>
                          {dueMeta.label}
                        </span>
                      </td>

                      <td className="pr-3.5 pl-2 py-1.5 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOne(e, proj)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Supprimer le projet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-medium text-mv-green group-hover:underline inline-flex items-center gap-0.5">
                          <span>Roadmap</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── Kanban View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'] as const).map((stage) => {
            const stageProjects = projects.filter((p) => p.current_stage === stage);
            return (
              <div key={stage} className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800 pb-2 border-b border-mv-border">
                  <span>{stage}</span>
                  <span className="font-mono text-zinc-400" style={MONO}>
                    ({stageProjects.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {stageProjects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/projects/${p.id}/roadmap`)}
                      className="p-2.5 rounded bg-zinc-50 border border-zinc-200/80 hover:border-emerald-600 hover:bg-white transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-900 group-hover:text-emerald-700 truncate">
                          {p.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOne(e, p)}
                          className="p-0.5 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-500">{p.client_name}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1" style={MONO}>
                        <span>{p.progress_pct || 0}% complété</span>
                        <span>{p.due_date ? new Date(p.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}
