'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Calendar,
  User as UserIcon,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  fetchProjects,
  fetchProjectMilestones,
  addProjectMilestone,
  toggleProjectMilestone,
  deleteProjectMilestone,
} from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Project, ProjectMilestone } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

const DEFAULT_FRAMER_PHASES = [
  {
    title: 'Architecture & Maquette Wireframe',
    deliverables: ['Sitemap', 'Copywriting', 'User Flows'],
    dueOffsetDays: 7,
  },
  {
    title: 'Design System & Composants Framer',
    deliverables: ['UI Kit', 'Typographie', 'Design Tokens'],
    dueOffsetDays: 14,
  },
  {
    title: 'Intégration CMS & Formulaires de Conversion',
    deliverables: ['SEO On-Page', 'Tracking Analytics', 'DNS'],
    dueOffsetDays: 21,
  },
  {
    title: 'Recette QA & Livraison Finale',
    deliverables: ['Checklist 20-Pts validée', 'Handoff Client'],
    dueOffsetDays: 29,
  },
];

export default function ProjectRoadmapPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const projectId = rawId as string;
  const router = useRouter();

  const { toastSuccess, toastError } = useToast();
  const confirmDialog = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Inline creation states
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDueDate, setInlineDueDate] = useState('');
  const [inlineAssigneeId, setInlineAssigneeId] = useState('');
  const [savingInline, setSavingInline] = useState(false);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const loadMilestones = async (id: string) => {
    const data = await fetchProjectMilestones(id);
    setMilestones(data);
  };

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    async function loadProject() {
      setLoading(true);
      const supabase = createClient();
      const [projects, { data: profiles }] = await Promise.all([
        fetchProjects(),
        supabase.from('profiles').select('id, full_name, email').eq('approved', true).order('full_name'),
      ]);
      const current = projects.find((p) => p.id === projectId) || null;
      setProject(current);
      setMembers(profiles || []);
      await loadMilestones(projectId);
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  // Global Keyboard shortcut: 'C' or 'N' focuses inline creation row
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setInlineOpen(true);
        setTimeout(() => inlineInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInlineSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineTitle.trim() || !projectId) return;
    setSavingInline(true);

    const created = await addProjectMilestone({
      project_id: projectId,
      title: inlineTitle.trim(),
      due_date: inlineDueDate || null,
      assignee_id: inlineAssigneeId || null,
      position: milestones.length,
    });

    setSavingInline(false);
    if (!created) {
      toastError('Erreur', 'Impossible d’enregistrer le jalon.');
      return;
    }

    toastSuccess('Jalon ajouté', `« ${inlineTitle.trim()} » a été inséré dans la roadmap.`);
    setInlineTitle('');
    setInlineDueDate('');
    setInlineAssigneeId('');
    setInlineOpen(false);
    await loadMilestones(projectId);
  };

  const handleSeedDefaultPhases = async () => {
    if (!projectId) return;
    setLoading(true);
    for (let i = 0; i < DEFAULT_FRAMER_PHASES.length; i++) {
      const phase = DEFAULT_FRAMER_PHASES[i];
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + phase.dueOffsetDays);
      await addProjectMilestone({
        project_id: projectId,
        title: phase.title,
        due_date: targetDate.toISOString().split('T')[0],
        assignee_id: members[0]?.id || null,
        position: i,
      });
    }
    await loadMilestones(projectId);
    setLoading(false);
    toastSuccess('Phases générées', 'Les 4 jalons types du projet Framer ont été créés.');
  };

  const handleToggle = async (m: ProjectMilestone, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextStatus = m.status === 'done' ? 'pending' : 'done';
    setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: nextStatus } : x)));
    const ok = await toggleProjectMilestone(m.id, nextStatus);
    if (!ok && projectId) await loadMilestones(projectId);
  };

  const handleDelete = async (m: ProjectMilestone, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Supprimer ce jalon ?',
      message: `« ${m.title} » sera retiré de la feuille de route.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok || !projectId) return;
    setMilestones((prev) => prev.filter((x) => x.id !== m.id));
    await deleteProjectMilestone(m.id);
    toastSuccess('Jalon supprimé', 'Le jalon a été retiré.');
  };

  const totalCount = milestones.length;
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Global target date calculation
  const targetDueDate = project?.due_date || '2026-09-15';
  const targetDueDateFormatted = new Date(targetDueDate + 'T00:00:00').toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(targetDueDate + 'T00:00:00').getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (!loading && !project) {
    return (
      <PageFadeIn className="max-w-7xl mx-auto py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-zinc-900">Projet introuvable.</p>
        <p className="text-xs text-zinc-500">Ce projet n’existe pas ou a été archivé.</p>
        <Link href="/projects" className="text-xs font-medium text-mv-green hover:underline inline-block">
          ← Retour aux projets
        </Link>
      </PageFadeIn>
    );
  }

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Contextual Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate">
            <Link href="/projects" className="hover:text-zinc-900 transition-colors">
              Projets
            </Link>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-zinc-900 font-semibold truncate">
              {project?.client_name || project?.name || 'Projet'}
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="text-zinc-500">Roadmap technique</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {projectId && (
            <Link
              href={`/projects/${projectId}/launch-check`}
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-mv-green" />
              <span>Checklist 20-Pts</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>
          )}

          <button
            onClick={() => {
              setInlineOpen(true);
              setTimeout(() => inlineInputRef.current?.focus(), 50);
            }}
            className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Ajouter un jalon (Touche C)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Jalon</span>
            <kbd className="hidden sm:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">C</kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Milestone Tracker Strip (36px Height) ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="h-9 px-3.5 flex items-center justify-between text-[11px] font-mono text-zinc-600 flex-wrap gap-2" style={MONO}>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-zinc-900">
              JALONS : {doneCount}/{totalCount} COMPLÉTÉS ({progressPct}%)
            </span>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline">
              ÉCHÉANCE GLOBALE : <strong className="text-zinc-800">{targetDueDateFormatted}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              SANTÉ : <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <strong className="text-emerald-700">DANS LES TEMPS</strong>
            </span>
            <span className="text-zinc-300 hidden sm:inline">|</span>
            <span>
              TEMPS RESTANT : <strong className="text-zinc-900">{daysLeft}J</strong>
            </span>
          </div>
        </div>

        {/* Continuous 3px Progress Gauge */}
        <div className="h-[3px] w-full bg-zinc-100 relative">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(2, progressPct)}%` }}
          />
        </div>
      </div>

      {/* ── 3. High-Density 36px DataTable ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-[12px] border-collapse min-w-[700px]">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 w-12 text-left font-medium">Ordre</th>
                <th className="px-2 text-left font-medium">Jalon / Phase Technique</th>
                <th className="px-2 text-left font-medium">Livrables Associés</th>
                <th className="px-2 text-left font-medium">Échéance</th>
                <th className="px-2 text-left font-medium">Statut</th>
                <th className="px-2 text-left font-medium">Responsable</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400 font-mono">
                    Chargement de la feuille de route…
                  </td>
                </tr>
              ) : milestones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center space-y-3">
                    <p className="text-xs font-semibold text-zinc-700">Aucun jalon configuré pour ce projet</p>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                      Initialisez les 4 phases standard d’un livrable Framer ou saisissez directement votre première étape ci-dessous.
                    </p>
                    <button
                      onClick={handleSeedDefaultPhases}
                      className="h-7 px-3 rounded-[4px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-mv-green" />
                      <span>Générer les 4 phases types Framer</span>
                    </button>
                  </td>
                </tr>
              ) : (
                milestones.map((m, idx) => {
                  const isDone = m.status === 'done';
                  const phaseDefaults = DEFAULT_FRAMER_PHASES[idx] || {
                    deliverables: ['Livrable client', 'Validation'],
                  };
                  const dateFormatted = m.due_date
                    ? new Date(m.due_date + 'T00:00:00').toLocaleDateString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Non fixée';

                  return (
                    <tr
                      key={m.id}
                      className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* # Ordre */}
                      <td className="pl-3.5 pr-2 py-1 font-mono text-[11px] text-zinc-400" style={MONO}>
                        #{String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Jalon / Phase */}
                      <td className="px-2 py-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleToggle(m, e)}
                            className="text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                            title={isDone ? 'Marquer à faire' : 'Marquer complété'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-zinc-400 hover:text-emerald-600" />
                            )}
                          </button>
                          <span
                            className={cn(
                              'font-medium truncate transition-colors',
                              isDone ? 'line-through text-zinc-400' : 'text-zinc-900 group-hover:text-mv-green'
                            )}
                          >
                            {m.title}
                          </span>
                        </div>
                      </td>

                      {/* Livrables Associés */}
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          {phaseDefaults.deliverables.map((item, dIdx) => (
                            <span
                              key={dIdx}
                              className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.2 rounded border border-zinc-200/50"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Échéance */}
                      <td className="px-2 py-1 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                        {dateFormatted}
                      </td>

                      {/* Statut */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                            <span>✓ Complété</span>
                          </span>
                        ) : idx === doneCount ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>● En cours</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                            <span>○ En attente</span>
                          </span>
                        )}
                      </td>

                      {/* Responsable */}
                      <td className="px-2 py-1 text-zinc-600 whitespace-nowrap">
                        <span className="text-[11px] font-medium">
                          {m.assignee_name || 'Minerva'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pr-3.5 pl-2 py-1 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={(e) => handleDelete(m, e)}
                          className="text-zinc-400 hover:text-rose-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-medium text-mv-green group-hover:underline inline-flex items-center gap-0.5">
                          <span>Ouvrir</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* ── 4. Inline Creation Row ── */}
              {inlineOpen ? (
                <tr className="bg-emerald-50/40 border-t border-emerald-200 h-10">
                  <td className="pl-3.5 pr-2 py-1 font-mono text-[11px] text-emerald-700" style={MONO}>
                    #{String(milestones.length + 1).padStart(2, '0')}
                  </td>
                  <td className="px-2 py-1" colSpan={2}>
                    <input
                      ref={inlineInputRef}
                      type="text"
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineSubmit();
                        if (e.key === 'Escape') setInlineOpen(false);
                      }}
                      placeholder="Nom du jalon technique (ex: Intégration Framer & CMS)... [Entrée pour valider]"
                      className="w-full h-7 px-2 text-xs bg-white border border-emerald-300 rounded-[4px] text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={inlineDueDate}
                      onChange={(e) => setInlineDueDate(e.target.value)}
                      className="h-7 px-1.5 text-xs bg-white border border-zinc-200 rounded-[4px] text-zinc-700 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <span className="text-[11px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                      ○ En attente
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={inlineAssigneeId}
                      onChange={(e) => setInlineAssigneeId(e.target.value)}
                      className="h-7 text-xs bg-white border border-zinc-200 rounded-[4px] text-zinc-700 px-1.5"
                    >
                      <option value="">Minerva (Auto)</option>
                      {members.map((mem) => (
                        <option key={mem.id} value={mem.id}>
                          {mem.full_name || mem.email}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="pr-3.5 pl-2 py-1 text-right space-x-1.5">
                    <button
                      onClick={() => handleInlineSubmit()}
                      disabled={savingInline || !inlineTitle.trim()}
                      className="h-6 px-2 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer disabled:opacity-50"
                    >
                      {savingInline ? '…' : 'Ajouter'}
                    </button>
                    <button
                      onClick={() => setInlineOpen(false)}
                      className="h-6 px-2 text-[11px] text-zinc-500 hover:bg-zinc-200/60 rounded cursor-pointer"
                    >
                      Annuler
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  onClick={() => {
                    setInlineOpen(true);
                    setTimeout(() => inlineInputRef.current?.focus(), 50);
                  }}
                  className="h-8 border-t border-dashed border-mv-border hover:bg-zinc-50/80 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-700 text-xs"
                >
                  <td colSpan={7} className="pl-3.5 pr-3.5 py-1">
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>+ Ajouter un jalon technique (ou appuyer sur « C »)...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageFadeIn>
  );
}
