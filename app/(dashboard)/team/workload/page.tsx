'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchTasks } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Task } from '@/lib/types';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function TeamWorkloadPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: profiles }, tasksData] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').eq('approved', true).order('full_name'),
        fetchTasks(),
      ]);
      setMembers(profiles || []);
      setTasks(tasksData);
      setLoading(false);
    })();
  }, []);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const rows = useMemo(() => {
    return members.map((m) => {
      const mine = tasks.filter((t) => t.assignee_id === m.id);
      const overdue = mine.filter((t) => t.status !== 'done' && t.due_date && t.due_date < today);
      return {
        member: m,
        total: mine.length,
        todo: mine.filter((t) => t.status === 'todo').length,
        inProgress: mine.filter((t) => t.status === 'in_progress').length,
        done: mine.filter((t) => t.status === 'done').length,
        overdue,
      };
    });
  }, [members, tasks, today]);

  const unassignedCount = tasks.filter((t) => !t.assignee_id).length;

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/team" className="text-xs text-mv-green hover:underline">Retour à l'équipe</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/team" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'équipe
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Charge de Travail</h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Répartition des tâches par membre.{unassignedCount > 0 && ` ${unassignedCount} tâche(s) non assignée(s).`}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center space-y-4">
          <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
          <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ member, total, todo, inProgress, done, overdue }) => (
            <Card key={member.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-mv-ink">{member.full_name || member.email}</div>
                  <div className="text-xs text-mv-ink-soft mt-0.5">
                    {total} tâche{total !== 1 ? 's' : ''} au total
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-extrabold text-mv-ink">{todo}</div>
                    <div className="text-mv-ink-faint">À faire</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-mv-amber">{inProgress}</div>
                    <div className="text-mv-ink-faint">En cours</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-mv-green">{done}</div>
                    <div className="text-mv-ink-faint">Terminé</div>
                  </div>
                  <div className="text-center min-w-[48px]">
                    <div className={`font-extrabold ${overdue.length > 0 ? 'text-mv-red' : 'text-mv-ink-faint'}`}>
                      {overdue.length}
                    </div>
                    <div className="text-mv-ink-faint">En retard</div>
                  </div>
                </div>
              </div>

              {overdue.length > 0 && (
                <div className="mt-3 pt-3 border-t border-mv-border space-y-1.5">
                  {overdue.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tasks/${t.id}`}
                      className="flex items-center gap-1.5 text-xs text-mv-red hover:underline"
                    >
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
