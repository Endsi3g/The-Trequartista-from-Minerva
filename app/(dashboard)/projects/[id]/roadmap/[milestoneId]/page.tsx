'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  User,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Sparkles,
  Layers,
  Flag,
  Share2,
  Check,
  Edit3,
} from 'lucide-react';
import {
  fetchProjects,
  fetchProjectMilestone,
  fetchTeamMembers,
  updateProjectMilestone,
} from '@/lib/services/supabase-data';
import type { Project, ProjectMilestone, TeamMemberSummary } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export default function DedicatedMilestonePage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const milestoneId = Array.isArray(params?.milestoneId) ? params.milestoneId[0] : params?.milestoneId;
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<ProjectMilestone | null>(null);
  const [team, setTeam] = useState<TeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'done'>('pending');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [deliverableUrl, setDeliverableUrl] = useState('');

  // Interactive Sub-Tasks checklist
  const [subtasks, setSubtasks] = useState<SubTask[]>([
    { id: 'st-1', title: 'Audit des composants et compatibilité responsive (Desktop, Tablet, Mobile)', done: true },
    { id: 'st-2', title: 'Validation des balises meta, OpenGraph et structure SEO on-page', done: false },
    { id: 'st-3', title: 'Test du tunnel de conversion et formulaires de capture de leads', done: false },
    { id: 'st-4', title: 'Revue client et validation formelle de livraison', done: false },
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (!projectId || !milestoneId) return;
    (async () => {
      setLoading(true);
      try {
        const [projects, ms, members] = await Promise.all([
          fetchProjects(),
          fetchProjectMilestone(milestoneId),
          fetchTeamMembers(),
        ]);
        const foundProj = projects.find((p) => p.id === projectId) || null;
        setProject(foundProj);
        setMilestone(ms);
        setTeam(members);

        if (ms) {
          setTitle(ms.title || 'Jalon Technique');
          setDescription(ms.description || 'Livrable standard et spécifications du package client.');
          setStatus(ms.status || 'pending');
          setDueDate(ms.due_date || '2026-09-15');
          setAssigneeId(ms.assignee_id || '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, milestoneId]);

  const completedSubtasks = useMemo(() => subtasks.filter((s) => s.done).length, [subtasks]);
  const completionPct = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), done: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveMilestone = async () => {
    if (!milestoneId) return;
    const ok = await updateProjectMilestone(milestoneId, {
      title,
      description,
      status,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    });
    if (ok) {
      toastSuccess('Jalon mis à jour', 'Toutes les modifications ont été enregistrées.');
    } else {
      toastError('Erreur', 'Impossible d’enregistrer le jalon.');
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-zinc-400 font-mono">Chargement du jalon…</div>;
  }

  return (
    <PageFadeIn className="space-y-4 max-w-5xl mx-auto pb-16">
      {/* ── 1. Top Contextual Breadcrumb & Actions Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 min-w-0">
          <Link href="/projects" className="hover:text-zinc-900 transition-colors">
            Projets
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href={`/projects/${projectId}/roadmap`} className="hover:text-zinc-900 transition-colors truncate">
            {project?.client_name || 'Client'}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 font-semibold truncate">Jalon : {title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/projects/${projectId}/roadmap`}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour Roadmap</span>
          </Link>

          <button
            onClick={handleSaveMilestone}
            className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {/* ── 2. Milestone Main Header & Quick Metadata Strip ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono" style={MONO}>
                Phase Technique Framer
              </span>
              <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
                Réf: {milestoneId?.slice(0, 8)}
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du Jalon..."
              className="text-lg sm:text-xl font-bold text-zinc-900 w-full bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-zinc-400"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des livrables et objectifs de ce jalon..."
              rows={2}
              className="text-xs text-zinc-600 w-full bg-transparent border-none outline-none focus:ring-0 p-0 resize-none placeholder:text-zinc-400 leading-relaxed"
            />
          </div>

          {/* Status Switcher Button */}
          <button
            onClick={() => setStatus(status === 'done' ? 'pending' : 'done')}
            className={cn(
              'h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0',
              status === 'done'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200/70'
            )}
          >
            {status === 'done' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Jalon Complété</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4 text-zinc-400" />
                <span>En cours d’exécution</span>
              </>
            )}
          </button>
        </div>

        {/* 3-Column Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-mv-border">
          {/* Due Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-400" /> Date Limite
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 font-mono"
              style={MONO}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <User className="w-3 h-3 text-zinc-400" /> Responsable
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">Non assigné (Équipe Minerva)</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Progress gauge */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              <span>Avancement</span>
              <span className="font-mono text-emerald-700" style={MONO}>
                {completedSubtasks}/{subtasks.length} ({completionPct}%)
              </span>
            </div>
            <div className="h-8 flex items-center">
              <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200/60">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Sub-Tasks & QA Checklist Section ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-semibold text-zinc-900">Checklist & Sous-Tâches d’Exécution</h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
            {completedSubtasks} complétée{completedSubtasks > 1 ? 's' : ''} sur {subtasks.length}
          </span>
        </div>

        {/* Subtasks List */}
        <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-md overflow-hidden bg-white">
          {subtasks.map((st) => (
            <div
              key={st.id}
              onClick={() => handleToggleSubtask(st.id)}
              className={cn(
                'px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer hover:bg-zinc-50 group',
                st.done && 'bg-zinc-50/40 text-zinc-400'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={st.done}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer pointer-events-none"
                />
                <span className={cn('font-medium truncate', st.done && 'line-through text-zinc-400')}>
                  {st.title}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSubtask(st.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity cursor-pointer"
                title="Supprimer la sous-tâche"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Subtask Form */}
        <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="+ Ajouter un point de contrôle ou une sous-tâche..."
            className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </form>
      </div>

      {/* ── 4. Deliverables & Documentation Links ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-700" />
          <h2 className="text-sm font-semibold text-zinc-900">Livrables & Liens de Production</h2>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
            Lien du Livrable (ex: URL Framer Preview, Figma, Dossier Assets)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={deliverableUrl}
              onChange={(e) => setDeliverableUrl(e.target.value)}
              placeholder="https://framer.com/projects/..."
              className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 font-mono text-[11.5px]"
            />
            {deliverableUrl && (
              <a
                href={deliverableUrl}
                target="_blank"
                rel="noreferrer"
                className="h-8 px-3 rounded-md border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center gap-1.5 shadow-2xs"
              >
                <span>Tester le lien</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
