'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { GraduationCap, BookOpen, Clock, ArrowRight, Search, Film } from 'lucide-react';
import { fetchAcademySops } from '@/lib/services/supabase-data';
import { AcademySOP } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';

export default function AcademyPage() {
  const [sops, setSops] = useState<AcademySOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    (async () => {
      setSops(await fetchAcademySops());
      setLoading(false);
    })();
  }, []);

  const filteredSops = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageFadeIn className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Académie Interne & SOPs Minerva
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Ouvrez une SOP pour suivre le guide, puis marquez-la comme complétée une fois terminée.
          </p>
        </div>

        <Link href="/academy/new">
          <Button variant="primary" icon={<BookOpen className="w-4 h-4" />}>
            + Créer une SOP
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mv-ink-soft" />
              <input
                type="text"
                placeholder="Rechercher une SOP, un sujet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mv-cream-soft border border-mv-border rounded-xl pl-9 pr-4 py-2 text-xs text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Design Framer">Design Framer</option>
              <option value="Workflows IA">Workflows IA</option>
              <option value="Campagnes Ads">Campagnes Ads</option>
              <option value="Loi 25 & Compliance">Loi 25 & Compliance</option>
            </select>
          </div>

          <span className="text-xs text-mv-ink-soft font-mono">
            Total SOPs : <strong className="text-mv-green">{filteredSops.length}</strong>
          </span>
        </div>
      </Card>

      {/* SOP Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-sm text-mv-ink-soft">Chargement des SOPs…</div>
      ) : filteredSops.length === 0 ? (
        <Card className="text-center py-16">
          <GraduationCap className="w-8 h-8 text-mv-ink-faint mx-auto mb-3" />
          <p className="text-sm text-mv-ink-soft">
            {sops.length === 0
              ? 'Aucune SOP pour le moment. Créez la première avec le bouton ci-dessus.'
              : 'Aucune SOP ne correspond à cette recherche.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSops.map((sop) => (
            <Card key={sop.id} className="flex flex-col justify-between hover:border-mv-green transition-all shadow-mv-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="lime">{sop.category}</Badge>
                  <span className="text-[11px] font-mono text-mv-ink-soft flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-mv-green" /> {sop.read_time_min} min
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-mv-ink leading-snug">{sop.title}</h3>
                <p className="text-xs text-mv-ink-soft leading-relaxed line-clamp-3">{sop.description}</p>

                {sop.video_url && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-mv-border">
                    <Film className="w-8 h-8 text-mv-warm animate-pulse" />
                    <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-white px-2 py-0.5 rounded font-mono font-bold">
                      Tutoriel Vidéo .MP4
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-mv-border flex items-center justify-between text-xs">
                <span className="text-mv-ink-faint font-medium">Par {sop.author}</span>
                <Link href={`/academy/${sop.id}`} className="font-bold text-mv-green hover:underline flex items-center gap-1 cursor-pointer">
                  Visionner SOP <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Storage Media & Video SOPs */}
      <StorageBrowser defaultBucket="academy-media" title="Bibliothèque Média & Vidéos SOPs" />
    </PageFadeIn>
  );
}
