'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  Plus,
  ArrowRight,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Trash2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Zap,
  Check,
  Mail,
  Send,
} from 'lucide-react';
import {
  fetchProjects,
  fetchProjectMilestones,
  addProjectMilestone,
  toggleProjectMilestone,
  deleteProjectMilestone,
} from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import type { Project, ProjectMilestone } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { MilestoneEmailModal } from '@/components/projects/MilestoneEmailModal';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

const SERVICE_PACKAGE_TEMPLATES: Record<
  string,
  { label: string; description: string; phases: { title: string; dueOffsetDays: number; deliverables: string[] }[] }
> = {
  framer: {
    label: 'Framer Web Design',
    description: 'Structure complète de refonte web Framer & animations',
    phases: [
      { title: '01. Wireframes UX & Architecture de Contenu', dueOffsetDays: 3, deliverables: ['Sitemap', 'Wireframes Figma'] },
      { title: '02. Design System & Maquettes Haute-Fidélité', dueOffsetDays: 7, deliverables: ['Composants UI', 'Validation Client'] },
      { title: '03. Intégration Framer, Effets & Micro-Interactions', dueOffsetDays: 14, deliverables: ['Prototypage', 'Animations'] },
      { title: '04. Recette Responsive & Audit Checklist 20-Pts', dueOffsetDays: 18, deliverables: ['Mobile/Tablet QA', 'Score SEO 95+'] },
      { title: '05. Mise en Ligne, Redirections DNS & Tracking', dueOffsetDays: 21, deliverables: ['Production DNS', 'Pixel & Analytics'] },
    ],
  },
  leadgen: {
    label: 'Acquisition & Ads LeadGen',
    description: 'Campagnes de conversion Meta/Google & tracking CAPI',
    phases: [
      { title: '01. Audit d’Audience & Stratégie d’Angles Créatifs', dueOffsetDays: 2, deliverables: ['Étude Avatars', 'Angles Publicitaires'] },
      { title: '02. Production des Créatives Vidéo & Copywriting Ads', dueOffsetDays: 5, deliverables: ['Scripts Ads', 'Visuels Carrousels'] },
      { title: '03. Implémentation Pixels CAPI & Événements Conversion', dueOffsetDays: 7, deliverables: ['GTM Setup', 'Vérification Domaine'] },
      { title: '04. Lancement Campagnes Meta Ads & Google Search', dueOffsetDays: 10, deliverables: ['Structure AB Test', 'Budget Pacing'] },
      { title: '05. Optimisation Continue du CPL & Scaling Rentable', dueOffsetDays: 20, deliverables: ['Rapport ROI', 'Itérations Créas'] },
    ],
  },
  reels: {
    label: 'Growth & Social Reels',
    description: 'Planning 30j, production de capsules & montage 9:16',
    phases: [
      { title: '01. Brainstorming & Calendrier Éditorial 30 Jours', dueOffsetDays: 3, deliverables: ['30 Hooks Viraux', 'Planning Notion'] },
      { title: '02. Session de Tournage & Captation Vidéo Client', dueOffsetDays: 7, deliverables: ['Rushes 4K', 'Audio Studio'] },
      { title: '03. Montage Dynamique, Sous-titres & Sound Design', dueOffsetDays: 14, deliverables: ['Formats 9:16', 'Pills & B-Rolls'] },
      { title: '04. Validation Client & Programmation Multi-Plateforme', dueOffsetDays: 17, deliverables: ['Buffer/Later', 'Hashtag Clusters'] },
      { title: '05. Bilan des Métriques de Portée & Taux de Rétention', dueOffsetDays: 30, deliverables: ['Analyse Algorithme', 'Next Wave'] },
    ],
  },
  seo: {
    label: 'SEO Local & Fiche GMB',
    description: 'Positionnement organique, GMB & Netlinking ciblé',
    phases: [
      { title: '01. Audit Technique SEO & Cartographie Mots-Clés Locaux', dueOffsetDays: 4, deliverables: ['Keywords Map', 'Audit Vitesse'] },
      { title: '02. Optimisation Fiche Google Business & Géolocalisation', dueOffsetDays: 8, deliverables: ['Catégories GMB', 'Photos Géocodées'] },
      { title: '03. Rédaction Pages Services Locales & Balises Schema', dueOffsetDays: 15, deliverables: ['Landing Pages', 'Schema LocalBusiness'] },
      { title: '04. Campagne de Netlinking & Citations Annuaires Pro', dueOffsetDays: 22, deliverables: ['Backlinks Locaux', 'Nettoyage NAP'] },
      { title: '05. Rapport Mensuel Positionnement & Appels Générés', dueOffsetDays: 30, deliverables: ['Google Search Console', 'Rapport Leads'] },
    ],
  },
  ai_consulting: {
    label: 'Audit & Conseil IA',
    description: 'Cartographie des flux & automatisation d’agents IA',
    phases: [
      { title: '01. Cartographie des Goulots d’Étranglement & Processus', dueOffsetDays: 3, deliverables: ['Workflow Map', 'Calcul ROI IA'] },
      { title: '02. Spécification Technique des Agents & Connecteurs API', dueOffsetDays: 8, deliverables: ['Schéma Archi', 'Prompt Blueprints'] },
      { title: '03. Développement & Intégration dans le CRM / ERP', dueOffsetDays: 16, deliverables: ['Webhooks Supabase', 'Tests Équipes'] },
      { title: '04. Formation des Collaborateurs & SOPs de l’Académie', dueOffsetDays: 20, deliverables: ['Vidéos Loom', 'Checklist de Bord'] },
      { title: '05. Bilan d’Adoption & Support Post-Déploiement', dueOffsetDays: 28, deliverables: ['Audit Trimestriel', 'Documentation'] },
    ],
  },
};

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
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [emailMilestone, setEmailMilestone] = useState<ProjectMilestone | null>(null);

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

  const handleApplyServiceTemplate = async (templateKey: string) => {
    if (!projectId) return;
    const template = SERVICE_PACKAGE_TEMPLATES[templateKey];
    if (!template) return;

    setLoading(true);
    setTemplateMenuOpen(false);
    for (let i = 0; i < template.phases.length; i++) {
      const phase = template.phases[i];
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + phase.dueOffsetDays);
      await addProjectMilestone({
        project_id: projectId,
        title: phase.title,
        due_date: targetDate.toISOString().split('T')[0],
        assignee_id: members[0]?.id || null,
        position: milestones.length + i,
      });
    }
    await loadMilestones(projectId);
    setLoading(false);
    toastSuccess('Jalons générés', `Les ${template.phases.length} étapes du package « ${template.label} » ont été appliquées.`);
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
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {/* Service Package Generator Menu */}
          <div className="relative">
            <button
              onClick={() => setTemplateMenuOpen(!templateMenuOpen)}
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-[4px] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Générer selon service</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {templateMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTemplateMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-zinc-200 rounded-[6px] shadow-lg py-1 z-50 text-left">
                  <div className="px-3 py-1.5 border-b border-zinc-100 text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Templates de Jalons par Service
                  </div>
                  {Object.entries(SERVICE_PACKAGE_TEMPLATES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => handleApplyServiceTemplate(key)}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-semibold text-zinc-900">{t.label}</span>
                      <span className="text-[10.5px] text-zinc-500">{t.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link
            href={`/projects/${projectId}/launch-check`}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-[4px] transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            <span>Checklist 20-Pts</span>
          </Link>

          <button
            onClick={() => {
              setInlineOpen(true);
              setTimeout(() => inlineInputRef.current?.focus(), 50);
            }}
            className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-[4px] transition-colors flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
            title="Nouveau Jalon (Touche C ou N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Jalon</span>
            <kbd className="hidden sm:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-mono">C</kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Unified 36px Synthesis Strip ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] shadow-2xs overflow-hidden">
        <div className="h-9 px-3.5 flex items-center justify-between gap-4 text-xs">
          {/* Progress Counters */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Avancement :</span>
            <span className="font-semibold font-mono text-zinc-900 text-[12px]" style={MONO}>
              {doneCount}/{totalCount} complétés
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-bold ml-0.5" style={MONO}>
              ({progressPct}%)
            </span>
          </div>

          {/* Date Cible */}
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-600 font-mono text-[11.5px]" style={MONO}>
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cible : {targetDueDateFormatted}</span>
          </div>

          {/* Statut Dans les temps */}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono" style={MONO}>
              Dans les temps
            </span>
          </div>

          {/* Compte à rebours */}
          <div className="flex items-center gap-1 text-zinc-600 font-mono text-[11.5px]" style={MONO}>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold text-zinc-900">{daysLeft}j</span>
            <span className="text-zinc-400 hidden sm:inline">restants</span>
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

      {/* ── 3. High-Density 36px DataTable with Dedicated Page Routing ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-[12px] border-collapse min-w-[700px]">
            <thead>
              <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                <th className="pl-3.5 pr-2 w-12 text-left font-medium">Ordre</th>
                <th className="px-2 text-left font-medium">Jalon / Phase Technique</th>
                <th className="px-2 text-left font-medium">Échéance</th>
                <th className="px-2 text-left font-medium">Statut</th>
                <th className="px-2 text-left font-medium">Responsable</th>
                <th className="pr-3.5 pl-2 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-400 font-mono">
                    Chargement de la feuille de route…
                  </td>
                </tr>
              ) : milestones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center space-y-3">
                    <p className="text-xs font-semibold text-zinc-700">Aucun jalon configuré pour ce projet</p>
                    <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                      Cliquez sur « Générer selon service » ci-dessus ou appliquez les 5 phases standard Framer.
                    </p>
                    <button
                      onClick={() => handleApplyServiceTemplate('framer')}
                      className="h-7 px-3 rounded-[4px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Générer les 5 phases types Framer</span>
                    </button>
                  </td>
                </tr>
              ) : (
                milestones.map((m, idx) => {
                  const isDone = m.status === 'done';
                  const dateFormatted = m.due_date
                    ? new Date(m.due_date + 'T00:00:00').toLocaleDateString('fr-CA', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Non fixée';

                  return (
                    <tr
                      key={m.id}
                      onClick={() => router.push(`/projects/${projectId}/roadmap/${m.id}`)}
                      className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                    >
                      {/* # Ordre */}
                      <td className="pl-3.5 pr-2 py-1 font-mono text-[11px] text-zinc-400" style={MONO}>
                        #{String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* Jalon / Phase */}
                      <td className="px-2 py-1 min-w-[240px]">
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
                              'font-semibold truncate transition-colors',
                              isDone ? 'line-through text-zinc-400' : 'text-zinc-900 group-hover:text-emerald-700'
                            )}
                          >
                            {m.title}
                          </span>
                        </div>
                      </td>

                      {/* Échéance */}
                      <td className="px-2 py-1 font-mono text-[11px] text-zinc-500 whitespace-nowrap" style={MONO}>
                        {dateFormatted}
                      </td>

                      {/* Statut */}
                      <td className="px-2 py-1 whitespace-nowrap">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                            <span>✓ Complété</span>
                          </span>
                        ) : idx === doneCount ? (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>● En cours</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10.5px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                            <span>○ En attente</span>
                          </span>
                        )}
                      </td>

                      {/* Responsable */}
                      <td className="px-2 py-1 text-zinc-600 whitespace-nowrap text-[11px]">
                        {m.assignee_name || 'Équipe Minerva'}
                      </td>

                      {/* Actions */}
                      <td className="pr-3.5 pl-2 py-1 text-right whitespace-nowrap space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmailMilestone(m);
                          }}
                          className="h-6 px-1.5 text-[10.5px] font-medium border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Notifier le client par email"
                        >
                          <Mail className="w-3 h-3 text-emerald-600" />
                          <span className="hidden sm:inline">Notifier</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(m, e)}
                          className="text-zinc-400 hover:text-rose-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-medium text-emerald-700 group-hover:underline inline-flex items-center gap-0.5">
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
                <tr className="h-10 bg-emerald-50/40 border-t border-emerald-200">
                  <td className="pl-3.5 pr-2 py-1 font-mono text-[11px] text-emerald-600" style={MONO}>
                    +{String(milestones.length + 1).padStart(2, '0')}
                  </td>
                  <td className="px-2 py-1">
                    <input
                      ref={inlineInputRef}
                      type="text"
                      value={inlineTitle}
                      onChange={(e) => setInlineTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineSubmit();
                        if (e.key === 'Escape') setInlineOpen(false);
                      }}
                      placeholder="Nom du jalon (ex: Validation des maquettes)..."
                      className="w-full h-7 px-2 text-xs rounded border border-emerald-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      value={inlineDueDate}
                      onChange={(e) => setInlineDueDate(e.target.value)}
                      className="h-7 px-1.5 text-xs rounded border border-emerald-300 bg-white text-zinc-900 focus:outline-none font-mono"
                      style={MONO}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <span className="text-[10.5px] font-medium text-emerald-700 bg-white px-2 py-1 rounded border border-emerald-200">
                      Nouveau
                    </span>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={inlineAssigneeId}
                      onChange={(e) => setInlineAssigneeId(e.target.value)}
                      className="h-7 px-1.5 text-xs rounded border border-emerald-300 bg-white text-zinc-900 focus:outline-none"
                    >
                      <option value="">Assigner...</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name || m.email}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="pr-3.5 pl-2 py-1 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => setInlineOpen(false)}
                      className="h-6 px-2 text-[11px] text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50 rounded transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleInlineSubmit()}
                      disabled={savingInline || !inlineTitle.trim()}
                      className="h-6 px-2.5 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                    >
                      Ajouter
                    </button>
                  </td>
                </tr>
              ) : (
                <tr
                  onClick={() => {
                    setInlineOpen(true);
                    setTimeout(() => inlineInputRef.current?.focus(), 50);
                  }}
                  className="h-8 border-t border-dashed border-mv-border hover:bg-zinc-50/80 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-700"
                >
                  <td colSpan={6} className="px-3.5 py-1 text-left text-[11.5px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Ajouter un jalon à la feuille de route (C ou N)</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Milestone Email Notification Modal ── */}
      <MilestoneEmailModal
        isOpen={!!emailMilestone}
        onClose={() => setEmailMilestone(null)}
        milestone={emailMilestone}
        clientName={project?.client_name || 'Client'}
      />
    </PageFadeIn>
  );
}
