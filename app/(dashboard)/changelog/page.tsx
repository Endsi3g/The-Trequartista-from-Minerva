'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Sparkles, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchChangelogEntries } from '@/lib/services/supabase-data';
import type { ChangelogEntry } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { PageFadeIn } from '@/components/ui/page-transition';

const STATIC_ENTRIES: ChangelogEntry[] = [
  {
    id: 'v2-2-0',
    version: '2.2.0',
    title: 'Refonte Chirurgicale Linear & Superhuman (v2.2.0)',
    body: `Une transformation complète de l’ensemble des pages de l’écosystème Minerva. Adoption d’une esthétique ultra-haute densité, monochrome rehaussée de vert émeraude (#059669), chiffres tabulaires Geist/Mono, navigation par raccourcis clavier et suppression intégrale des widgets espacés au profit de bandeaux continus connectés.`,
    included_items: [
      'Vue d’ensemble repensée : Ruban télémétrique 5 métriques connecté, graphiques AreaChart épurés à courbe fine 1.5px et DonutChart 80px.',
      'Chat d’équipe Monolithique : Split-pane pleine hauteur, filtre instantané ⌘F, 44px top bar, flux dense avec micro-avatars et enregistreur vocal avec chronomètre.',
      'Contenu Minerva & Studio Réels : Jauge linéaire multi-plateforme 56px, grille calendrier monolithique Notion-style et sous-vues Opus Clip.',
      'Suivi ROI & Leads : En-tête compact 24px TB, comparatif SEO vs Ads en 2 colonnes 32px et zone d’importation hairlines 44px.',
      'Répertoire Clients & Suivi MRR : DataTable haute densité 40px, point d’état dynamique 6px et barre d’actions groupées flottante.',
      'Pipeline CRM & Projets : Cartes compactes 48-54px, synchronisation optimiste drag-and-drop et tableau 36px Linear Issues.',
      'Bannière de version automatique et menu utilisateur popover macOS / Linear.',
    ],
    image_url: '/changelog/overview-v2-2-0.png',
    created_at: new Date().toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-1-0',
    version: '2.1.0',
    title: 'Chat d’Équipe Temps Réel & Pièces Jointes Multimédias',
    body: `Introduction de la messagerie instantanée en split-pane continue. Canaux par projet, discussions directes (DM), partage de fichiers sécurisé et lecteur de notes vocales intégré.`,
    included_items: [
      'Canaux automatiques rattachés aux projets et clients sous gestion.',
      'Support des pièces jointes images, audio, documents et GIFs.',
      'Filtre de recherche rapide par raccourci clavier ⌘F.',
    ],
    image_url: '/changelog/chat-v2-2-0.png',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
  {
    id: 'v2-0-0',
    version: '2.0.0',
    title: 'Studio Réels & Automatisation IA Opus Clip',
    body: `Planificateur de contenus multi-plateforme (Instagram, TikTok, YouTube Shorts) avec synchronisation Google Drive et intégration du pipeline Opus Clip pour la découpe automatique de capsules vidéo.`,
    included_items: [
      'Calendrier éditorial visuel avec micro-pills et marqueur dynamique Aujourd’hui.',
      'Banque d’inspiration et de ressources internes de l’agence.',
      'Suivi des jobs de découpe IA Opus Clip et export automatisé.',
    ],
    image_url: '/changelog/content-v2-2-0.png',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'system',
    author_name: 'Minerva Core Team',
  },
];

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>(STATIC_ENTRIES);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>('v2-2-0');
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchChangelogEntries();
        if (data && data.length > 0) {
          // Merge database entries with latest v2.2.0 showcase
          const combined = [STATIC_ENTRIES[0], ...data.filter((d) => d.version !== '2.2.0')];
          setEntries(combined);
          setActiveId(combined[0].id);
        } else {
          setEntries(STATIC_ENTRIES);
          setActiveId(STATIC_ENTRIES[0].id);
        }
      } catch {
        setEntries(STATIC_ENTRIES);
        setActiveId(STATIC_ENTRIES[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageFadeIn className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 max-w-6xl mx-auto pb-16">
      {/* Left Sticky Sidebar (Shadcnblocks / Linear style) */}
      <div className="lg:sticky lg:top-20 lg:self-start space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-mv-ink tracking-tight">
            Nouveautés
          </h1>
          <p className="text-xs text-mv-ink-soft mt-1">
            Découvrez les dernières mises à jour et améliorations apportées à Minerva.
          </p>
        </div>

        {isAdmin && (
          <Link href="/changelog/new">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} className="bg-mv-ink hover:bg-black text-white text-xs h-7 px-3 rounded-[4px]">
              Nouvelle entrée
            </Button>
          </Link>
        )}

        {entries.length > 0 && (
          <div className="border-t border-mv-border/80 pt-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
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
                    className={`block p-2.5 rounded-[5px] transition-all ${
                      isActive
                        ? 'bg-white border border-mv-border shadow-2xs text-zinc-900 font-semibold'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{entry.title}</div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {entry.version && <span>v{entry.version} · </span>}
                      {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Content Feed */}
      <div className="space-y-6">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Dernières mises à jour
        </h2>

        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-white border border-mv-border rounded-[6px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {entries.map((entry) => (
              <div
                key={entry.id}
                id={`entry-${entry.id}`}
                className="space-y-4 scroll-mt-24 pb-10 border-b border-mv-border last:border-b-0"
              >
                {/* Version & Date row */}
                <div className="flex items-center gap-2.5">
                  {entry.version && (
                    <span className="px-2 py-0.5 rounded-[4px] bg-zinc-100 border border-mv-border text-zinc-900 text-[11px] font-mono font-semibold">
                      v{entry.version}
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(entry.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Title & Body */}
                <h3 className="font-semibold text-zinc-900 text-lg sm:text-xl tracking-tight">
                  {entry.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {entry.body}
                </p>

                {/* What's included card */}
                {entry.included_items && entry.included_items.length > 0 && (
                  <div className="bg-white border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-2">
                    <p className="text-xs font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-mv-green" /> Ce qui est inclus :
                    </p>
                    <ul className="space-y-1.5 pt-1">
                      {entry.included_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-mv-green mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Real In-App Screenshot Preview */}
                {entry.image_url && (
                  <div className="rounded-[6px] overflow-hidden border border-mv-border shadow-xs bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.image_url}
                      alt={entry.title}
                      className="w-full max-h-[440px] object-cover object-top"
                    />
                  </div>
                )}

                {entry.author_name && (
                  <p className="text-[11px] text-zinc-400 font-mono">Publié par {entry.author_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
