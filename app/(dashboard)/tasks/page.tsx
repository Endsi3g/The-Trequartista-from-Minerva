'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  FolderKanban,
  MessageSquare,
  MoreHorizontal,
  Search,
  Layers,
  Kanban,
  Table as TableIcon,
  Download,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  UserX,
  X,
} from 'lucide-react';
import { fetchTasks, updateTaskStatus, deleteTask } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { TabTransition } from '@/components/ui/tab-transition';
import { UserAvatar } from '@/components/ui/user-avatar';
import { PaginatedColumn } from '@/components/ui/paginated-column';
import { SkeletonKanban, SkeletonRows } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do', badgeColor: 'bg-mv-ink text-white' },
  { key: 'in_progress', label: 'Doing', badgeColor: 'bg-emerald-600 text-white' },
  { key: 'done', label: 'Done', badgeColor: 'bg-mv-green text-white' },
] as const;

const PRIORITY_META: Record<Task['priority'], { label: string; variant: 'neutral' | 'blue' | 'amber' | 'red' }> = {
  low: { label: 'Basse', variant: 'neutral' },
  medium: { label: 'Moyenne', variant: 'blue' },
  high: { label: 'Haute', variant: 'amber' },
  urgent: { label: 'Urgente', variant: 'red' },
};

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date).getTime() < Date.now();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [assignedToMe, setAssignedToMe] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const confirmDialog = useConfirm();

  const loadTasks = async () => setTasks(await fetchTasks());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      await loadTasks();
      setLoading(false);
    })();
  }, []);

  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((t) => {
      if (t.project_name) names.add(t.project_name);
      else if (t.client_name) names.add(t.client_name);
    });
    return Array.from(names).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (activeTab !== 'all') list = list.filter((t) => t.status === activeTab);
    if (priorityFilter !== 'all') list = list.filter((t) => t.priority === priorityFilter);
    if (projectFilter !== 'all') list = list.filter((t) => (t.project_name || t.client_name) === projectFilter);
    if (assignedToMe && currentUserId) list = list.filter((t) => t.assignee_id === currentUserId);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.project_name?.toLowerCase().includes(q) ||
          t.client_name?.toLowerCase().includes(q) ||
          t.assignee_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, activeTab, priorityFilter, projectFilter, assignedToMe, currentUserId, searchQuery]);

  const overdueCount = tasks.filter(isOverdue).length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const unassignedCount = tasks.filter((t) => !t.assignee_name).length;

  const handleStatusChange = async (task: Task, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    await updateTaskStatus(task.id, status);
  };

  const handleDelete = async (task: Task) => {
    const ok = await confirmDialog({
      title: 'Supprimer cette tâche ?',
      message: `« ${task.title} » sera supprimée définitivement.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await deleteTask(task.id);
  };

  const handleBulkDelete = async () => {
    const ok = await confirmDialog({
      title: `Supprimer ${selectedIds.size} tâche${selectedIds.size > 1 ? 's' : ''} ?`,
      message: 'Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    const ids = Array.from(selectedIds);
    setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    await Promise.all(ids.map((id) => deleteTask(id)));
  };

  const handleExportCsv = () => {
    const listToExport = selectedIds.size > 0 ? filteredTasks.filter((t) => selectedIds.has(t.id)) : filteredTasks;
    const headers = ['Titre', 'Projet / Client', 'Assigné', 'Priorité', 'Statut', 'Échéance', 'Sous-tâches'];
    const rows = listToExport.map((t) => [
      `"${t.title}"`,
      `"${t.project_name || t.client_name || ''}"`,
      `"${t.assignee_name || 'Sans assigné'}"`,
      PRIORITY_META[t.priority]?.label || t.priority,
      t.status,
      t.due_date || '',
      `${t.subitems_done || 0}/${t.subitems_total || 0}`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `taches-minerva-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allVisibleSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t.id));
  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filteredTasks.forEach((t) => next.delete(t.id));
      else filteredTasks.forEach((t) => next.add(t.id));
      return next;
    });
  };
  const toggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };
  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDragOverColumn(columnKey);
  };
  const handleDrop = async (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    await handleStatusChange(task, status);
  };

  const renderSegmentedProgress = (done: number, total: number) => {
    const segments = Math.max(total, 1);
    return (
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-mv-ink-soft">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-mv-green" /> Sous-tâches
          </span>
          <span className="font-mono text-mv-ink-faint">
            {String(done).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i < done ? 'bg-[#059669]' : 'bg-mv-border'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  const displayColumns = activeTab === 'all' ? STATUS_COLUMNS : STATUS_COLUMNS.filter((c) => c.key === activeTab);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <ListChecks className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">Tableau des Tâches</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Kanban className="w-3 h-3" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="h-7 px-2.5 rounded-[4px] bg-white border border-mv-border text-[11.5px] font-medium text-mv-ink hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3 h-3 text-zinc-500" />
            <span>Exporter CSV</span>
          </button>

          <Link
            href="/tasks/new"
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Tâche</span>
          </Link>
        </div>
      </div>

      {/* ── 2. 4-KPI Telemetry Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Total</span>
              <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {loading ? '—' : <AnimatedNumber value={tasks.length} />}
            </div>
          </div>

          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">En retard</span>
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className={cn('text-[20px] font-semibold tracking-tight leading-none', overdueCount > 0 ? 'text-mv-red' : 'text-mv-ink')} style={MONO}>
              {loading ? '—' : overdueCount}
            </div>
          </div>

          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Complétion</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {loading ? '—' : `${completionRate}%`}
            </div>
          </div>

          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Sans assigné</span>
              <UserX className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {loading ? '—' : unassignedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Unified Filter & Search Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'todo', label: 'To Do' },
              { key: 'in_progress', label: 'Doing' },
              { key: 'done', label: 'Done' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'px-2.5 py-1 rounded-[4px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer',
                  activeTab === tab.key ? 'bg-mv-cream-soft text-mv-ink border border-mv-border' : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/40'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
            className="h-7 px-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-700 focus:outline-none focus:border-mv-green cursor-pointer"
          >
            <option value="all">Toutes priorités</option>
            {(Object.keys(PRIORITY_META) as Task['priority'][]).map((p) => (
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            ))}
          </select>

          {projectOptions.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-7 px-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-700 focus:outline-none focus:border-mv-green cursor-pointer max-w-[160px]"
            >
              <option value="all">Tous projets / clients</option>
              {projectOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}

          {currentUserId && (
            <button
              onClick={() => setAssignedToMe((v) => !v)}
              className={cn(
                'h-7 px-2.5 rounded-[4px] text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border',
                assignedToMe ? 'bg-mv-green text-white border-mv-green' : 'bg-white text-mv-ink-soft border-mv-border hover:text-mv-ink'
              )}
            >
              Mes tâches
            </button>
          )}

          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
              className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
            />
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 shrink-0" style={MONO}>
          {filteredTasks.length} tâche{filteredTasks.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── 4. Kanban / Table View ── */}
      {loading ? (
        viewMode === 'kanban' ? <SkeletonKanban columns={3} cardCount={3} /> : <SkeletonRows count={6} />
      ) : (
        <TabTransition tabKey={viewMode}>
          {viewMode === 'kanban' ? (
            <div className={cn('grid grid-cols-1 gap-6 items-start', displayColumns.length === 3 ? 'md:grid-cols-3' : '')}>
              {displayColumns.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);
                const isDragTarget = dragOverColumn === col.key;
                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDragLeave={() => setDragOverColumn(null)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className={cn(
                      'flex flex-col bg-mv-cream-soft/30 border border-mv-border rounded-2xl p-3.5 shadow-mv-sm space-y-3 transition-all',
                      isDragTarget && 'border-mv-green ring-1 ring-mv-green/30 bg-mv-green-tint/20'
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-mv-ink font-display">{col.label}</span>
                        <span className={`text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${col.badgeColor}`}>
                          {colTasks.length}
                        </span>
                      </div>
                      <Link
                        href="/tasks/new"
                        className="w-6 h-6 flex items-center justify-center rounded-lg text-mv-ink-faint hover:bg-mv-surface hover:text-mv-ink border border-transparent hover:border-mv-border transition-all"
                        title="Ajouter une tâche"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="space-y-3 min-h-[120px]">
                      <PaginatedColumn
                        items={colTasks}
                        getKey={(task) => task.id}
                        emptyLabel="Aucune tâche dans cette colonne"
                        renderItem={(task) => {
                          const totalSub = task.subitems_total || 0;
                          const doneSub = task.subitems_done || 0;
                          const hasSubitems = totalSub > 0;
                          const overdue = isOverdue(task);
                          const priorityMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

                          return (
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, task.id)}
                              className={cn(
                                'bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm space-y-3 hover:border-mv-ink-faint transition-all group cursor-grab active:cursor-grabbing',
                                draggedTaskId === task.id && 'opacity-40 scale-95'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant={priorityMeta.variant} className="text-[10px] px-1.5 py-0">
                                    {priorityMeta.label}
                                  </Badge>
                                  {task.plane_sequence_id && (
                                    <span
                                      className="text-[9.5px] font-bold text-mv-ink-soft bg-black/[0.04] border border-mv-border px-1.5 py-0 rounded font-mono"
                                      title="Ticket synchronisé avec Plane"
                                    >
                                      {task.plane_sequence_id}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.due_date ? (
                                    <div className={cn('flex items-center gap-1.5 text-[11px] font-medium', overdue ? 'text-mv-red' : 'text-mv-ink-soft')}>
                                      <span className={cn('w-1.5 h-1.5 rounded-full', overdue ? 'bg-mv-red' : 'bg-mv-green')} />
                                      <span>
                                        {new Date(task.due_date).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short' })}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-mv-ink-faint">Sans échéance</span>
                                  )}
                                  <button
                                    onClick={() => handleDelete(task)}
                                    className="opacity-0 group-hover:opacity-100 text-mv-ink-faint hover:text-mv-red transition-all cursor-pointer p-1 rounded hover:bg-mv-cream-soft"
                                    title="Supprimer la tâche"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <Link
                                href={`/tasks/${task.id}`}
                                className="block text-sm font-extrabold text-mv-ink hover:text-mv-green transition-colors leading-snug font-display"
                              >
                                {task.title}
                              </Link>

                              {task.description && (
                                <p className="text-xs text-mv-ink-soft line-clamp-2 leading-relaxed">{task.description}</p>
                              )}

                              {(task.project_name || task.client_name) && (
                                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-mv-ink-soft bg-mv-cream-soft border border-mv-border px-2 py-0.5 rounded-md truncate max-w-full">
                                  <FolderKanban className="w-3 h-3 text-mv-green shrink-0" />
                                  <span className="truncate">{task.project_name || task.client_name}</span>
                                </div>
                              )}

                              {hasSubitems && renderSegmentedProgress(doneSub, totalSub)}

                              <div className="flex items-center justify-between pt-2 border-t border-mv-border/60 text-xs text-mv-ink-faint">
                                <span className="flex items-center gap-1 text-[11px]">
                                  <MessageSquare className="w-3.5 h-3.5" /> {task.comments_count || 0}
                                </span>
                                <UserAvatar
                                  src={task.assignee_avatar_url}
                                  name={task.assignee_name || 'Sans assigné'}
                                  size="xs"
                                  shape="circle"
                                  className="ring-2 ring-mv-surface"
                                />
                              </div>

                              <div className="flex items-center gap-1.5 pt-1">
                                {STATUS_COLUMNS.map((s) => (
                                  <button
                                    key={s.key}
                                    onClick={() => handleStatusChange(task, s.key)}
                                    disabled={s.key === task.status}
                                    className={cn(
                                      'flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:cursor-default',
                                      s.key === task.status ? 'bg-mv-green text-white shadow-mv-sm' : 'bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream'
                                    )}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pl-3.5 pr-2 w-8 text-left">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleAll}
                        className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="px-2 text-left font-medium">Tâche</th>
                    <th className="px-2 text-left font-medium">Projet / Client</th>
                    <th className="px-2 text-left font-medium">Assigné</th>
                    <th className="px-2 text-left font-medium">Priorité</th>
                    <th className="px-2 text-left font-medium">Statut</th>
                    <th className="pr-3.5 pl-2 text-right font-medium">Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const isSelected = selectedIds.has(task.id);
                    const overdue = isOverdue(task);
                    const priorityMeta = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;
                    const statusMeta = STATUS_COLUMNS.find((c) => c.key === task.status);
                    return (
                      <tr
                        key={task.id}
                        className={cn('h-9 border-b border-mv-border last:border-0 transition-colors', isSelected ? 'bg-emerald-50/40' : 'hover:bg-black/[0.02]')}
                      >
                        <td className="pl-3.5 pr-2 py-1" onClick={(e) => toggleOne(task.id, e)}>
                          <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-3.5 h-3.5 rounded border-mv-border text-mv-green focus:ring-0 cursor-pointer" />
                        </td>
                        <td className="px-2 py-1 font-semibold text-zinc-900 truncate max-w-[240px]">
                          <div className="flex items-center gap-1.5 truncate">
                            {task.plane_sequence_id && (
                              <span
                                className="text-[9.5px] font-bold text-mv-ink-soft bg-black/[0.04] border border-mv-border px-1 py-0 rounded font-mono shrink-0"
                                title="Synchronisé avec Plane"
                              >
                                {task.plane_sequence_id}
                              </span>
                            )}
                            <Link href={`/tasks/${task.id}`} className="hover:text-mv-green transition-colors truncate">
                              {task.title}
                            </Link>
                          </div>
                        </td>
                        <td className="px-2 py-1 text-[11.5px] text-zinc-600 truncate max-w-[140px]">
                          {task.project_name || task.client_name || '—'}
                        </td>
                        <td className="px-2 py-1 text-[11.5px] text-zinc-600 truncate max-w-[140px]">
                          {task.assignee_name || 'Sans assigné'}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <Badge variant={priorityMeta.variant} className="text-[10px] px-1.5 py-0">{priorityMeta.label}</Badge>
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap">
                          <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] text-[11px] font-medium border', 'bg-zinc-100 text-zinc-800 border-zinc-200/60')}>
                            <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                            {statusMeta?.label || task.status}
                          </span>
                        </td>
                        <td className={cn('pr-3.5 pl-2 py-1 text-right text-[10.5px] font-mono whitespace-nowrap', overdue ? 'text-mv-red font-semibold' : 'text-zinc-400')} style={MONO}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-mv-ink-soft">Aucune tâche ne correspond à ces filtres.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabTransition>
      )}

      {/* ── 5. Floating Bottom Batch Actions Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white rounded-lg shadow-xl px-4 py-2 flex items-center gap-3 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-xs font-semibold text-zinc-200">
            {selectedIds.size} tâche{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="h-4 w-px bg-zinc-700" />
          <button onClick={handleExportCsv} className="text-xs font-medium text-white hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>Exporter sélection</span>
          </button>
          <button onClick={handleBulkDelete} className="text-xs font-medium text-white hover:text-red-400 transition-colors cursor-pointer">
            Supprimer
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer ml-1" title="Désélectionner tout">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </PageFadeIn>
  );
}
