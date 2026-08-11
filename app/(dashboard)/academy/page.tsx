'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { GraduationCap, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { INITIAL_SOPS } from '@/lib/mock-data';

export default function AcademyPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Académie Interne & SOPs Minerva
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Standardisation des méthodes de travail, guides vidéos et procédures opérationnelles (SOPs).
          </p>
        </div>

        <Button variant="primary" icon={<BookOpen className="w-4 h-4" />}>
          + Créer une SOP
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INITIAL_SOPS.map((sop) => (
          <Card key={sop.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Badge variant="lime">{sop.category}</Badge>
                <span className="text-[11px] font-mono text-mv-ink-soft flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {sop.read_time_min} min
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-mv-ink mt-3 leading-snug">
                {sop.title}
              </h3>
              <p className="text-xs text-mv-ink-soft mt-2 leading-relaxed">
                {sop.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-mv-border flex items-center justify-between text-xs">
              <span className="text-mv-ink-faint">Par {sop.author}</span>
              <button className="font-bold text-mv-green hover:underline flex items-center gap-1 cursor-pointer">
                Consulter SOP <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Supabase Storage Media & Video SOPs */}
      <StorageBrowser defaultBucket="academy-media" title="Bibliothèque Média & Vidéos SOPs (Supabase Storage)" />
    </div>
  );
}
