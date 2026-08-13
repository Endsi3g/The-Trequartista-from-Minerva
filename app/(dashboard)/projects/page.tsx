'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus, CheckCircle2, ArrowRight, Map } from 'lucide-react';
import { fetchProjects } from '@/lib/services/supabase-data';
import type { Project } from '@/lib/types';

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setProjects(await fetchProjects());
      } catch (err) {
        console.warn('[Projects] Error loading projects:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Pipeline Projets & Delivery
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Basculez entre vue Kanban et liste ; cliquez sur un projet pour voir sa feuille de route et sa checklist de lancement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-mv-green text-mv-cream font-bold' : 'text-mv-ink-soft'
              }`}
            >
              Tableau
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                viewMode === 'kanban' ? 'bg-mv-green text-mv-cream font-bold' : 'text-mv-ink-soft'
              }`}
            >
              Kanban
            </button>
          </div>

          <Link href="/projects/new">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
              Nouveau Projet
            </Button>
          </Link>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card
          header={
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Projets en Exécution
            </h3>
          }
        >
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-mv-ink-soft">Chargement des projets…</div>
            ) : projects.length === 0 ? (
              <div className="py-12 text-center text-sm text-mv-ink-soft">Aucun projet pour le moment.</div>
            ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Projet & Client</th>
                  <th className="pb-3 font-semibold">Étape Actuelle</th>
                  <th className="pb-3 font-semibold">Santé</th>
                  <th className="pb-3 font-semibold">Progression</th>
                  <th className="pb-3 font-semibold">Échéance</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border/40">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-mv-cream-soft/40 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="font-bold text-mv-ink text-sm">{proj.name}</div>
                      <div className="text-[11px] text-mv-ink-soft">{proj.client_name}</div>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="neutral">{proj.current_stage}</Badge>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant={proj.health === 'Ready' ? 'green' : 'lime'}>
                        ● {proj.health}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-mv-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-mv-green rounded-full"
                            style={{ width: `${proj.progress_pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-mv-ink">{proj.progress_pct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-mono text-mv-ink-soft">{proj.due_date}</span>
                    </td>
                    <td className="py-4 pl-4 text-right space-x-2">
                      <Link href={`/projects/${proj.id}/roadmap`}>
                        <Button variant="outline" size="sm" icon={<Map className="w-3.5 h-3.5" />}>
                          Roadmap
                        </Button>
                      </Link>
                      <Link href={`/projects/${proj.id}/launch-check`}>
                        <Button variant="lime" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                          Checklist
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'].map((stage) => {
            const stageProjects = projects.filter((p) => p.current_stage === stage);
            return (
              <div key={stage} className="bg-mv-surface border border-mv-border rounded-xl p-4 space-y-3 w-[280px] min-w-[280px] shrink-0">
                <div className="flex items-center justify-between pb-2 border-b border-mv-border">
                  <span className="text-xs font-extrabold text-mv-ink uppercase tracking-wider">
                    {stage}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-mv-cream-soft text-mv-ink-soft">
                    {stageProjects.length}
                  </span>
                </div>

                {stageProjects.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border space-y-2">
                    <div className="font-bold text-xs text-mv-ink">{p.name}</div>
                    <div className="text-[11px] text-mv-ink-soft">{p.client_name}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-mv-border/60">
                      <Badge variant="green">{p.progress_pct}%</Badge>
                      <Link href={`/projects/${p.id}/launch-check`}>
                        <span className="text-[11px] text-mv-green hover:underline font-semibold flex items-center gap-0.5">
                          Check <ArrowRight className="w-3 h-3" />
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
