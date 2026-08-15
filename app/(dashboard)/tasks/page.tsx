'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Calendar, FolderKanban, Trash2, MessageSquare, ListChecks, MoreHorizontal } from 'lucide-react';
import { fetchTasks, updateTaskStatus, deleteTask } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';

const STATUS_COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Terminé' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');

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

  const visibleTasks = useMemo(
    () => (scope === 'mine' ? tasks.filter((t) => t.assignee_id === currentUserId) : tasks),
    [tasks, scope, currentUserId]
  );

  const handleStatusChange = async (task: Task, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    await updateTaskStatus(task.id, status);
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await deleteTask(task.id);
  };

  return (
    <PageFadeIn className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Tâches
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Glissez-déplacez n'est pas nécessaire ici — utilisez les boutons de statut sur chaque carte pour la faire avancer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-mv-surface border border-mv-border rounded-xl p-1 shadow-mv-sm">
            <button
              onClick={() => setScope('mine')}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                scope === 'mine' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              Mes tâches
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                scope === 'all' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              Toutes
            </button>
          </div>

          <Link
            href="/tasks/new"
            className="px-4 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle Tâche</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center space-y-4">
          <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
          <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = visibleTasks.filter((t) => t.status === col.key);
            return (
              <div
                key={col.key}
                className="flex flex-col w-[300px] min-w-[300px] shrink-0 bg-mv-surface/60 border border-mv-border rounded-2xl p-3"
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-mv-ink">{col.label}</span>
                    <span className="text-[11px] font-bold text-white bg-mv-green px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {colTasks.length}
                    </span>
                  </div>
                  {col.key === 'todo' && (
                    <Link
                      href="/tasks/new"
                      className="w-6 h-6 flex items-center justify-center rounded-md text-mv-ink-faint hover:bg-mv-cream-soft hover:text-mv-ink transition-colors"
                      title="Nouvelle tâche"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                <div className="flex-1 space-y-2.5 min-h-[80px]">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-mv-ink-faint border border-dashed border-mv-border rounded-xl">
                      Aucune tâche
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const hasSubitems = (task.subitems_total ?? 0) > 0;
                      return (
                      <div
                        key={task.id}
                        className="bg-mv-surface border border-mv-border rounded-xl p-3.5 shadow-mv-sm space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 text-[10px] text-mv-ink-faint font-mono">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{new Date(task.due_date).toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          )}
                          <div className="relative ml-auto">
                            <button
                              onClick={() => handleDelete(task)}
                              className="opacity-0 group-hover:opacity-100 text-mv-ink-faint hover:text-mv-red transition-all cursor-pointer shrink-0 p-0.5"
                              title="Supprimer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <Link href={`/tasks/${task.id}`} className="block text-[13px] font-bold text-mv-ink hover:text-mv-green transition-colors">
                          {task.title}
                        </Link>

                        {task.description && (
                          <p className="text-[11px] text-mv-ink-soft line-clamp-2">{task.description}</p>
                        )}

                        {(task.project_name || task.client_name || task.lead_name) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-mv-ink-faint">
                            <FolderKanban className="w-3 h-3 shrink-0" />
                            <span className="truncate">{task.project_name || task.client_name || task.lead_name}</span>
                          </div>
                        )}

                        {hasSubitems && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-mv-ink-faint font-mono">
                              <span className="flex items-center gap-1"><ListChecks className="w-3 h-3" /> Sous-tâches</span>
                              <span>{String(task.subitems_done).padStart(2, '0')}/{String(task.subitems_total).padStart(2, '0')}</span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-mv-cream-soft overflow-hidden">
                              <div
                                className="h-full bg-mv-green rounded-full transition-all"
                                style={{ width: `${((task.subitems_done ?? 0) / (task.subitems_total ?? 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-3 text-[11px] text-mv-ink-faint">
                            {(task.comments_count ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> {task.comments_count}
                              </span>
                            )}
                          </div>
                          {task.assignee_name ? (
                            <img
                              src={task.assignee_avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(task.assignee_name)}&backgroundColor=1E4B33&fontColor=ffffff`}
                              alt={task.assignee_name}
                              title={task.assignee_name}
                              className="w-6 h-6 rounded-full object-cover border border-mv-border shrink-0"
                            />
                          ) : (
                            <span className="w-6 h-6 rounded-full border border-dashed border-mv-border shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center gap-1 pt-1 border-t border-mv-border-soft mt-1">
                          {STATUS_COLUMNS.map((s) => (
                            <button
                              key={s.key}
                              onClick={() => handleStatusChange(task, s.key)}
                              disabled={s.key === task.status}
                              className={`flex-1 mt-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:cursor-default ${
                                s.key === task.status
                                  ? 'bg-mv-green text-white'
                                  : 'bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink'
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
