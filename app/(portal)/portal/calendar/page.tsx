'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchContentPosts } from '@/lib/services/supabase-data';
import type { ContentPost } from '@/lib/types';

export default function PortalCalendarPage() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    (async () => {
      // RLS scopes this to the signed-in client's own content automatically.
      setPosts(await fetchContentPosts());
      setLoading(false);
    })();
  }, []);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date | null; posts: ContentPost[] }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, posts: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ date, posts: posts.filter((p) => p.scheduled_date?.split('T')[0] === dateStr) });
    }
    return days;
  }, [calendarMonth, posts]);

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('fr-CA', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-mv-ink font-display">Calendrier éditorial</h1>
        <p className="text-xs text-mv-ink-faint mt-1">Les contenus planifiés et publiés pour votre compte, mois par mois. Cliquez sur une case pour voir les détails.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2 capitalize">
            <Calendar className="w-4 h-4 text-mv-green" />
            {monthLabel}
          </h3>
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              onClick={() => setCalendarMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))}
              className="px-2.5 py-1 rounded-lg border border-mv-border hover:bg-mv-cream-soft cursor-pointer"
            >
              ←
            </button>
            <button
              onClick={() => setCalendarMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))}
              className="px-2.5 py-1 rounded-lg border border-mv-border hover:bg-mv-cream-soft cursor-pointer"
            >
              →
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-mv-ink-soft mb-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, i) =>
                day.date === null ? (
                  <div key={i} className="min-h-[100px]" />
                ) : (
                  <div key={i} className="min-h-[100px] max-h-[150px] p-2 bg-mv-cream-soft border border-mv-border rounded-xl flex flex-col gap-1.5 overflow-hidden">
                    <span className="font-bold text-[11px] text-mv-ink-faint text-right shrink-0">{day.date.getDate()}</span>
                    <div className="space-y-1 overflow-y-auto flex-1">
                      {day.posts.map((p) => (
                        <div key={p.id} className="p-1 rounded bg-mv-green/10 border border-mv-green/30 text-[10px] font-bold text-mv-green truncate">
                          {p.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
