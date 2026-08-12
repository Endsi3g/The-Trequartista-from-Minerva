'use client';

import React, { useEffect, useState } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchOpenTimeEntry, startTimeEntry, stopTimeEntry } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { TimeEntry, Project } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function TrackTimeButton() {
  const [userId, setUserId] = useState<string | null>(null);
  const [openEntry, setOpenEntry] = useState<TimeEntry | null>(null);
  const [projectName, setProjectName] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const entry = await fetchOpenTimeEntry(user.id);
      if (entry) setOpenEntry(entry);

      const { data: proj } = await supabase.from('projects').select('id, name').order('name');
      if (proj) setProjects(proj as Project[]);
    })();
  }, []);

  useEffect(() => {
    if (!openEntry) return;
    if (projects.length) {
      const p = projects.find((pr) => pr.id === openEntry.project_id);
      setProjectName(p?.name || 'Projet');
    }
    const tick = () => {
      setElapsed(Math.round((Date.now() - new Date(openEntry.started_at).getTime()) / 1000));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [openEntry, projects]);

  const handleStart = async (projectId: string, name: string) => {
    if (!userId) return;
    const entry = await startTimeEntry(userId, projectId);
    if (entry) {
      setOpenEntry(entry);
      setProjectName(name);
    } else {
      toastError('Erreur', "Impossible de démarrer le chronomètre.");
    }
  };

  const handleStop = async () => {
    if (!openEntry) return;
    const ok = await stopTimeEntry(openEntry.id, openEntry.started_at);
    if (ok) {
      toastSuccess('Temps enregistré', `${formatElapsed(elapsed)} sur ${projectName}.`);
      setOpenEntry(null);
      setElapsed(0);
    } else {
      toastError('Erreur', "Impossible d'arrêter le chronomètre.");
    }
  };

  if (openEntry) {
    return (
      <button
        onClick={handleStop}
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mv-red/30 bg-mv-red-bg text-xs font-semibold text-mv-red hover:bg-mv-red/10 transition-all cursor-pointer"
        title={`Arrêter — ${projectName}`}
      >
        <Square className="w-3 h-3 fill-current" />
        <span className="font-mono tabular-nums">{formatElapsed(elapsed)}</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-mv-border bg-white text-xs font-semibold text-mv-ink hover:bg-mv-surface transition-all cursor-pointer shadow-mv-sm">
          <Clock className="w-3.5 h-3.5 text-mv-green" />
          <span>Chronomètre</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Démarrer sur quel projet ?</DropdownMenuLabel>
        {projects.length === 0 ? (
          <div className="px-2 py-3 text-xs text-mv-ink-faint">Aucun projet pour l'instant.</div>
        ) : (
          projects.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => handleStart(p.id, p.name)} className="flex items-center gap-2.5">
              <Play className="w-3.5 h-3.5 text-mv-green shrink-0" />
              <span className="truncate">{p.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
