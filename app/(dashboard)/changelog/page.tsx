'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { fetchChangelogEntries } from '@/lib/services/supabase-data';
import { ChangelogEntry } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ScrollFade } from '@/components/ui/scroll-fade';

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
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
      {/* Sidebar */}
      <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouveautés</h1>
          <p className="text-sm text-mv-ink-soft mt-1">Ce qui a changé dans Minerva Trequartista.</p>
        </div>

        {role === 'admin' && (
          <Link
            href="/changelog/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Nouvelle entrée
          </Link>
        )}

        {entries.length > 0 && (
          <div className="border-t border-mv-border pt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-faint mb-2">Sur cette page</p>
            <ScrollFade maxHeight="320px" className="space-y-1">
              {entries.map((entry) => (
                <a
                  key={entry.id}
                  href={`#entry-${entry.id}`}
                  className="block px-2.5 py-2 rounded-lg hover:bg-mv-cream-soft transition-colors"
                >
                  <div className="text-xs font-bold text-mv-ink truncate">{entry.title}</div>
                  <div className="text-[11px] text-mv-ink-faint flex items-center gap-1">
                    {entry.version && <span>Version {entry.version} ·</span>}
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </a>
              ))}
            </ScrollFade>
          </div>
        )}
      </div>

      {/* Entries */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-mv-ink-faint uppercase tracking-wider">Dernières mises à jour</h2>

        {loading ? (
          <div className="space-y-4">
            <div className="h-48 shimmer-bg rounded-2xl animate-mv-shimmer" />
            <div className="h-48 shimmer-bg rounded-2xl animate-mv-shimmer" />
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
          <div className="space-y-10">
            {entries.map((entry) => (
              <div key={entry.id} id={`entry-${entry.id}`} className="space-y-4 scroll-mt-20">
                <div className="flex items-center gap-3 flex-wrap">
                  {entry.version && (
                    <span className="px-2.5 py-0.5 rounded-full bg-mv-green-tint text-mv-green text-xs font-bold">
                      Version {entry.version}
                    </span>
                  )}
                  <span className="text-xs text-mv-ink-faint font-mono">
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="font-extrabold text-mv-ink font-display text-xl">{entry.title}</h3>
                <p className="text-sm text-mv-ink-soft leading-relaxed whitespace-pre-wrap">{entry.body}</p>

                {entry.included_items.length > 0 && (
                  <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4">
                    <p className="text-xs font-bold text-mv-ink mb-2">Ce qui est inclus :</p>
                    <ul className="space-y-1.5">
                      {entry.included_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-mv-ink-soft">
                          <span className="w-1 h-1 rounded-full bg-mv-ink-faint mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.image_url && (
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    className="w-full max-h-96 object-cover rounded-xl border border-mv-border"
                  />
                )}

                {entry.author_name && (
                  <p className="text-[11px] text-mv-ink-faint">Par {entry.author_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
