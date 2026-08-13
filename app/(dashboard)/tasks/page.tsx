'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Calendar, User, FolderKanban, Trash2 } from 'lucide-react';
import { fetchTasks, updateTaskStatus, deleteTask } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';

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
    <div className="space-y-8">
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
                  <span className="text-xs font-extrabold text-mv-ink uppercase tracking-wider">{col.label}</span>
                  <span className="text-xs font-extrabold text-mv-ink-soft bg-mv-surface border border-mv-border px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 min-h-[80px]">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-mv-ink-faint border border-dashed border-mv-border rounded-xl">
                      Aucune tâche
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-mv-surface border border-mv-border rounded-xl p-3.5 shadow-mv-sm space-y-2.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/tasks/${task.id}`} className="text-xs font-bold text-mv-ink hover:text-mv-green transition-colors">
                            {task.title}
                          </Link>
                          <button
                            onClick={() => handleDelete(task)}
                            className="opacity-0 group-hover:opacity-100 text-mv-ink-faint hover:text-mv-red transition-all cursor-pointer shrink-0"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-mv-ink-soft line-clamp-2">{task.description}</p>
                        )}

                        <div className="space-y-1 text-[11px] text-mv-ink-faint">
                          {task.assignee_name && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{task.assignee_name}</span>
                            </div>
                          )}
                          {(task.project_name || task.client_name || task.lead_name) && (
                            <div className="flex items-center gap-1.5">
                              <FolderKanban className="w-3 h-3 shrink-0" />
                              <span className="truncate">{task.project_name || task.client_name || task.lead_name}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{new Date(task.due_date).toLocaleDateString('fr-CA')}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          {STATUS_COLUMNS.map((s) => (
                            <button
                              key={s.key}
                              onClick={() => handleStatusChange(task, s.key)}
                              disabled={s.key === task.status}
                              className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:cursor-default ${
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
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
