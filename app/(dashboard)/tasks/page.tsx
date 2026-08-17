'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Calendar,
  FolderKanban,
  Trash2,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Search,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchTasks, updateTaskStatus, deleteTask } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useConfirm } from '@/components/providers/ConfirmProvider';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do', badgeColor: 'bg-mv-ink text-white' },
  { key: 'in_progress', label: 'Doing', badgeColor: 'bg-emerald-600 text-white' },
  { key: 'done', label: 'Done', badgeColor: 'bg-mv-green text-white' },
] as const;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredTasks = useMemo(() => {
    let list = tasks;
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
  }, [tasks, searchQuery]);

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

  // Helper for segmented progress pills
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

  const displayColumns = activeTab === 'all'
    ? STATUS_COLUMNS
    : STATUS_COLUMNS.filter((c) => c.key === activeTab);

  return (
    <PageFadeIn className="space-y-6">
      {/* Top Header with Audrey Lay inspired filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Tableau des Tâches
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft mt-0.5">
            Planifiez, organisez et suivez le travail de vos équipes sans friction.
          </p>
        </div>

        <Link
          href="/tasks/new"
          className="px-4 py-2.5 bg-mv-ink hover:bg-black text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nouvelle Tâche</span>
        </Link>
      </div>

      {/* Task Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-mv-surface border border-mv-border rounded-2xl shadow-mv-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { key: 'all', label: 'Toutes les tâches' },
            { key: 'todo', label: 'To Do' },
            { key: 'in_progress', label: 'Doing' },
            { key: 'done', label: 'Done' },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-mv-cream-soft text-mv-ink shadow-mv-sm border border-mv-border'
                    : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search input with /K shortcut */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une tâche..."
            className="w-full pl-8 pr-10 py-1.5 text-xs rounded-xl bg-mv-cream-soft border border-mv-border text-mv-ink placeholder:text-mv-ink-faint focus:outline-none focus:border-mv-green"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-mv-ink-faint border border-mv-border bg-mv-surface px-1 py-0.5 rounded">
            /K
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-mv-cream-soft animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {displayColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="flex flex-col bg-mv-cream-soft/30 border border-mv-border rounded-2xl p-3.5 shadow-mv-sm space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-mv-ink font-display">{col.label}</span>
                    <span
                      className={`text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${col.badgeColor}`}
                    >
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

                {/* Task Cards List */}
                <div className="space-y-3 min-h-[120px]">
                  {colTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-mv-ink-faint border border-dashed border-mv-border rounded-xl bg-mv-surface/40">
                      Aucune tâche dans cette colonne
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const totalSub = task.subitems_total || 0;
                      const doneSub = task.subitems_done || 0;
                      const hasSubitems = totalSub > 0;

                      return (
                        <div
                          key={task.id}
                          className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm space-y-3 hover:border-mv-ink-faint transition-all group"
                        >
                          {/* Date & Action */}
                          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
                            {task.due_date ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-mv-ink-soft">
                                <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                                <span>
                                  {new Date(task.due_date).toLocaleDateString('fr-CA', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
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

                          {/* Task Title */}
                          <Link
                            href={`/tasks/${task.id}`}
                            className="block text-sm font-extrabold text-mv-ink hover:text-mv-green transition-colors leading-snug font-display"
                          >
                            {task.title}
                          </Link>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-xs text-mv-ink-soft line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Project / Client Badge */}
                          {(task.project_name || task.client_name) && (
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-mv-ink-soft bg-mv-cream-soft border border-mv-border px-2 py-0.5 rounded-md truncate max-w-full">
                              <FolderKanban className="w-3 h-3 text-mv-green shrink-0" />
                              <span className="truncate">{task.project_name || task.client_name}</span>
                            </div>
                          )}

                          {/* Segmented Subtask Progress Bar (Audrey Lay reference) */}
                          {hasSubitems ? (
                            renderSegmentedProgress(doneSub, totalSub)
                          ) : (
                            <div className="pt-0.5">
                              {renderSegmentedProgress(col.key === 'done' ? 3 : col.key === 'in_progress' ? 1 : 0, 3)}
                            </div>
                          )}

                          {/* Bottom Footer: Counters + Avatar Stack */}
                          <div className="flex items-center justify-between pt-2 border-t border-mv-border/60 text-xs text-mv-ink-faint">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-[11px] hover:text-mv-ink transition-colors">
                                <MessageSquare className="w-3.5 h-3.5" /> {task.comments_count || 2}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] hover:text-mv-ink transition-colors">
                                <Paperclip className="w-3.5 h-3.5" /> 1
                              </span>
                            </div>

                            {/* Assignee Avatar Stack */}
                            <div className="flex items-center -space-x-1.5 overflow-hidden">
                              <UserAvatar
                                src={task.assignee_avatar_url}
                                name={task.assignee_name || 'Assigné'}
                                size="xs"
                                shape="circle"
                                className="ring-2 ring-mv-surface"
                              />
                            </div>
                          </div>

                          {/* Quick Column Transfer Buttons */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {STATUS_COLUMNS.map((s) => (
                              <button
                                key={s.key}
                                onClick={() => handleStatusChange(task, s.key)}
                                disabled={s.key === task.status}
                                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:cursor-default ${
                                  s.key === task.status
                                    ? 'bg-mv-green text-white shadow-mv-sm'
                                    : 'bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}
