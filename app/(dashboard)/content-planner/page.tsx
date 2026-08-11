'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Share2, Plus, Calendar, Video, Image as ImageIcon } from 'lucide-react';

export default function ContentPlannerPage() {
  const posts = [
    {
      title: 'Reel 60s : Avant / Après Réfection Toiture Commerciale',
      client: 'Apex Roofing',
      format: 'Reel 60s',
      date: '2026-08-14',
      status: 'Publié',
    },
    {
      title: 'Carrousel IG : Les 5 erreurs d’isolation l’été au Québec',
      client: 'Apex Roofing',
      format: 'Carrousel IG',
      date: '2026-08-18',
      status: 'Enregistré',
    },
    {
      title: 'Vidéo Dégustation : Découverte du Cold Brew Espresso',
      client: 'Café Saint-Henri',
      format: 'Reel 60s',
      date: '2026-08-20',
      status: 'Idéation',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Planificateur de Contenus & Reels Clients
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Programmation de vidéos et carrousels sociaux à fort impact d'acquisition.
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
          + Planifier un Reel
        </Button>
      </div>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Calendrier des Publications</h3>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {posts.map((post, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="green">{post.client}</Badge>
                <span className="text-[11px] font-mono text-mv-ink-soft">{post.date}</span>
              </div>

              <div className="font-bold text-xs text-mv-ink leading-snug">{post.title}</div>

              <div className="flex items-center justify-between pt-2 border-t border-mv-border/60">
                <span className="text-[11px] text-mv-ink-soft flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-mv-lime" /> {post.format}
                </span>
                <Badge variant={post.status === 'Publié' ? 'lime' : 'neutral'}>
                  {post.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
