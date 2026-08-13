'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, FolderKanban, Target, Calendar, Trash2, Send } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  fetchTask,
  updateTaskStatus,
  deleteTask,
  fetchTaskComments,
  addTaskComment,
} from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task, TaskComment } from '@/lib/types';

const STATUS_COLUMNS: { key: Task['status']; label: string }[] = [
  { key: 'todo', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Terminé' },
];

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = Array.isArray(params?.id) ? params.id[0] : params?.id || '';

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const [t, c] = await Promise.all([fetchTask(taskId), fetchTaskComments(taskId)]);
      if (!t) {
        setNotFound(true);
      } else {
        setTask(t);
        setComments(c);
      }
      setLoading(false);
    })();
  }, [taskId]);

  const handleStatusChange = async (status: Task['status']) => {
    if (!task) return;
    setTask({ ...task, status });
    await updateTaskStatus(task.id, status);
  };

  const handleDelete = async () => {
    if (!task || !confirm(`Supprimer la tâche « ${task.title} » ?`)) return;
    await deleteTask(task.id);
    router.push('/tasks');
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || !task) return;
    setPosting(true);
    const ok = await addTaskComment(task.id, currentUserId, newComment.trim());
    if (ok) {
      setComments(await fetchTaskComments(task.id));
      setNewComment('');
    }
    setPosting(false);
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
      </div>
    );
  }

  if (notFound || !task) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Tâche introuvable.</p>
        <Link href="/tasks" className="text-xs text-mv-green hover:underline">Retour aux tâches</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/tasks" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux tâches
      </Link>

      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-extrabold text-mv-ink font-display">{task.title}</h1>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-mv-ink-faint hover:text-mv-red hover:bg-mv-red-bg transition-all cursor-pointer shrink-0"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {task.description && <p className="text-sm text-mv-ink-soft leading-relaxed">{task.description}</p>}

          <div className="flex flex-wrap gap-4 text-xs text-mv-ink-faint pt-2 border-t border-mv-border">
            {task.assignee_name && (
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {task.assignee_name}</span>
            )}
            {task.project_name && (
              <span className="flex items-center gap-1.5"><FolderKanban className="w-3.5 h-3.5" /> {task.project_name}</span>
            )}
            {task.lead_name && (
              <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> {task.lead_name}</span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> {new Date(task.due_date).toLocaleDateString('fr-CA')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {STATUS_COLUMNS.map((s) => (
              <button
                key={s.key}
                onClick={() => handleStatusChange(s.key)}
                disabled={s.key === task.status}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                  s.key === task.status ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink-soft hover:text-mv-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Commentaires ({comments.length})</h3>}>
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-xs text-mv-ink-faint text-center py-4">Aucun commentaire pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-mv-cream-soft border border-mv-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-mv-ink">{c.author_name || 'Membre'}</span>
                    <span className="text-[10px] text-mv-ink-faint">
                      {new Date(c.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-mv-ink-soft whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="flex-1 px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
            <button
              type="submit"
              disabled={posting || !newComment.trim()}
              className="p-2.5 rounded-xl bg-mv-green hover:bg-mv-green-dark text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
