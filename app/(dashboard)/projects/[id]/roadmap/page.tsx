'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Map } from 'lucide-react';
import { fetchProjects } from '@/lib/services/supabase-data';
import { Project } from '@/lib/types';

export default function ProjectRoadmapPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    async function loadProject() {
      setLoading(true);
      const projects = await fetchProjects();
      setProject(projects.find((p) => p.id === projectId) || null);
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  if (!loading && !project) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Projet introuvable.</p>
        <p className="text-xs text-mv-ink-soft">Ce projet n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Roadmap des Jalons Client
            </h1>
            {!loading && project && <Badge variant="green">{project.client_name}</Badge>}
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Feuille de route d'exécution technique du projet{!loading && project ? ` « ${project.name} »` : ''}.
          </p>
        </div>

        {projectId && (
          <Link href={`/projects/${projectId}/launch-check`}>
            <Button variant="lime" icon={<CheckCircle2 className="w-4 h-4" />}>
              Passer à la Checklist 20-Pts
            </Button>
          </Link>
        )}
      </div>

      {/* Roadmap steps -- no per-milestone data source exists yet for this project */}
      <Card>
        <div className="py-10 text-center space-y-2">
          <Map className="w-8 h-8 text-mv-ink-faint mx-auto" />
          <p className="text-sm font-bold text-mv-ink">Aucune étape de feuille de route disponible.</p>
          <p className="text-xs text-mv-ink-soft">
            Les jalons de ce projet apparaîtront ici une fois définis.
          </p>
        </div>
      </Card>
    </div>
  );
}
