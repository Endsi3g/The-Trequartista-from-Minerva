'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchChangelogEntries } from '@/lib/services/supabase-data';
import { ChangelogEntry } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useCurrentUser();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setEntries(await fetchChangelogEntries());
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Nouveautés
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">Ce qui a changé dans Minerva, dans l'ordre.</p>
        </div>
        {role === 'admin' && (
          <Link
            href="/changelog/new"
            className="px-4 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle entrée</span>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 shimmer-bg rounded-2xl animate-mv-shimmer" />
          <div className="h-32 shimmer-bg rounded-2xl animate-mv-shimmer" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <div className="py-10 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-mv-ink-faint mx-auto" />
            <p className="text-sm font-bold text-mv-ink">Rien à afficher pour le moment.</p>
            <p className="text-xs text-mv-ink-soft">Les prochaines nouveautés apparaîtront ici.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-extrabold text-mv-ink font-display text-lg">{entry.title}</h2>
                  <span className="text-[11px] text-mv-ink-faint font-mono shrink-0">
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    className="w-full max-h-80 object-cover rounded-xl border border-mv-border"
                  />
                )}
                <p className="text-sm text-mv-ink-soft leading-relaxed whitespace-pre-wrap">{entry.body}</p>
                {entry.author_name && (
                  <p className="text-[11px] text-mv-ink-faint">Par {entry.author_name}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
