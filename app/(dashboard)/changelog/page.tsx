'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Layers, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchChangelogEntries } from '@/lib/services/supabase-data';
import { ChangelogEntry } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageFadeIn } from '@/components/ui/page-transition';

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchChangelogEntries();
      setEntries(data);
      if (data.length > 0) setActiveId(data[0].id);
      setLoading(false);
    })();
  }, []);

  return (
    <PageFadeIn className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 max-w-6xl mx-auto pb-16">
      {/* Left Sticky Sidebar (Shadcnblocks inspiration) */}
      <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Nouveautés
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft mt-1">
            Découvrez les dernières mises à jour et améliorations apportées à Minerva.
          </p>
        </div>

        {isAdmin && (
          <Link href="/changelog/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} className="bg-mv-ink hover:bg-black text-white">
              Nouvelle entrée
            </Button>
          </Link>
        )}

        {entries.length > 0 && (
          <div className="border-t border-mv-border/80 pt-4 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-mv-ink-faint">
              Sur cette page
            </p>
            <div className="space-y-1">
              {entries.map((entry) => {
                const isActive = activeId === entry.id;
                return (
                  <a
                    key={entry.id}
                    href={`#entry-${entry.id}`}
                    onClick={() => setActiveId(entry.id)}
                    className={`block p-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-mv-surface border border-mv-border shadow-mv-sm text-mv-ink'
                        : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/50'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{entry.title}</div>
                    <div className="text-[11px] text-mv-ink-faint mt-0.5">
                      {entry.version && <span>Version {entry.version} · </span>}
                      {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Content Feed (Shadcnblocks inspiration) */}
      <div className="space-y-6">
        <h2 className="text-xs font-extrabold text-mv-ink-faint uppercase tracking-wider">
          Dernières mises à jour
        </h2>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-mv-surface border border-mv-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="py-16 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-mv-ink-faint mx-auto" />
            <p className="text-sm font-bold text-mv-ink">Aucune entrée pour le moment.</p>
            <p className="text-xs text-mv-ink-soft">Les prochaines nouveautés apparaîtront ici.</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {entries.map((entry) => (
              <div
                key={entry.id}
                id={`entry-${entry.id}`}
                className="space-y-4 scroll-mt-24 pb-10 border-b border-mv-border/80 last:border-b-0"
              >
                {/* Version & Date row */}
                <div className="flex items-center gap-3">
                  {entry.version && (
                    <span className="px-2.5 py-0.5 rounded-full bg-mv-surface border border-mv-border text-mv-ink text-[11px] font-extrabold">
                      Version {entry.version}
                    </span>
                  )}
                  <span className="text-xs text-mv-ink-soft font-mono">
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Title & Body */}
                <h3 className="font-extrabold text-mv-ink font-display text-xl sm:text-2xl">
                  {entry.title}
                </h3>
                <p className="text-xs sm:text-sm text-mv-ink-soft leading-relaxed whitespace-pre-wrap">
                  {entry.body}
                </p>

                {/* What's included card */}
                {entry.included_items && entry.included_items.length > 0 && (
                  <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm space-y-2.5">
                    <p className="text-xs font-extrabold text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-mv-green" /> Ce qui est inclus :
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {entry.included_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-mv-ink-soft">
                          <span className="w-1.5 h-1.5 rounded-full bg-mv-green mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Media preview box / banner */}
                {entry.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.image_url}
                    alt={entry.title}
                    className="w-full max-h-96 object-cover rounded-2xl border border-mv-border shadow-mv-sm"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-64 rounded-2xl bg-mv-cream-soft border border-mv-border flex items-center justify-center text-mv-ink-faint">
                    <div className="text-center space-y-2">
                      <Layers className="w-8 h-8 text-mv-green/60 mx-auto" />
                      <span className="text-xs font-semibold text-mv-ink-soft">Minerva Trequartista Écosystème</span>
                    </div>
                  </div>
                )}

                {entry.author_name && (
                  <p className="text-[11px] text-mv-ink-faint">Publié par {entry.author_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
