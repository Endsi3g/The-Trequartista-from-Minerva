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
  Utensils,
  BookOpen,
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
import { MinervaFlowProjectGuide } from '@/components/projects/MinervaFlowProjectGuide';
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
  minerva_flow: {
    label: 'Minerva-Flow (0% Commission)',
    description: 'Commande directe, carte digitalisée, QR codes cuisine et 0 % commission',
    phases: [
      { title: '01. Audit des Marges & Démonstration Live', dueOffsetDays: 2, deliverables: ['Audit Marge', 'Démo /minerva-flow'] },
      { title: '02. Digitalisation du Menu & Photos Culinaire HD', dueOffsetDays: 5, deliverables: ['10+ Plats Digitalisés', 'Allergènes & Options'] },
      { title: '03. Passerelle de Paiement Stripe & QR Codes Cuisine', dueOffsetDays: 8, deliverables: ['Stripe Direct', 'Impression ESC/POS', 'QR Tables'] },
      { title: '04. Protocole Test 5-Min en Cuisine Réelle', dueOffsetDays: 11, deliverables: ['Test Commande Live', 'Validation Chef < 20 min'] },
      { title: '05. Lancement Officiel & Suivi en Temps Réel', dueOffsetDays: 14, deliverables: ['Mise en Ligne', 'Formation Salle', 'Dashboard Client'] },
    ],
  },
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
  const [activeTab, setActiveTab] = useState<'milestones' | 'guide'>('milestones');

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
    if (created) {
      setInlineTitle('');
      setInlineDueDate('');
      setInlineAssigneeId('');
      setInlineOpen(false);
      await loadMilestones(projectId);
      toastSuccess('Jalon créé', `« ${created.title} » a été ajouté à la feuille de route.`);
    } else {
      toastError('Erreur', 'Impossible de créer le jalon.');
    }
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
          </button>
        </div>
      </div>

      {/* ── Sub-Tabs Switcher: Jalons vs Guide Déploiement Minerva-Flow ── */}
      <div className="flex items-center gap-2 border-b border-mv-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={cn(
            'px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'milestones'
              ? 'border-emerald-600 text-zinc-900 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Feuille de Route & Jalons ({milestones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={cn(
            'px-3 py-1.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'guide'
              ? 'border-emerald-600 text-zinc-900 font-extrabold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          )}
        >
          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
          <span>📖 Guide Déploiement Minerva-Flow</span>
        </button>
      </div>

      {/* ── Tab 2: Minerva-Flow Deployment Guide ── */}
      {activeTab === 'guide' ? (
        <MinervaFlowProjectGuide
          restaurantName={project?.client_name || project?.name || 'Votre Client'}
          projectId={projectId}
          sector={(project as any)?.sector || (project as any)?.client?.industry || project?.client_name}
        />
      ) : (
        /* ── Tab 1: Milestones & Roadmap ── */
        <>
          {/* ── 2. Continuous Project Synthesis Strip (32px) ── */}
          <div
            className="h-8 bg-mv-surface border border-mv-border rounded-[5px] px-3.5 flex items-center justify-between text-[11px] font-mono text-zinc-600 shadow-2xs overflow-x-auto whitespace-nowrap gap-4"
            style={MONO}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">STATUS :</span>
              <span className="font-semibold text-zinc-900">{project?.current_stage || 'Onboarding'}</span>
            </div>
            <span className="text-zinc-300">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">JALONS COMPLÉTÉS :</span>
              <span className="font-semibold text-mv-green">
                {doneCount}/{totalCount} ({progressPct}%)
              </span>
            </div>
            <span className="text-zinc-300">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">ÉCHÉANCE GLOBALE :</span>
              <span className="font-semibold text-zinc-900">{targetDueDateFormatted}</span>
            </div>
            <span className="text-zinc-300">·</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">TEMPS RESTANT :</span>
              <span className="font-semibold text-zinc-900">{daysLeft} jours</span>
            </div>
          </div>

          {/* ── 3. Main Milestones List ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            {/* Inline Quick Creation Row */}
            {inlineOpen && (
              <form
                onSubmit={handleInlineSubmit}
                className="p-3 bg-emerald-50/50 border-b border-emerald-200/80 flex items-center gap-2 flex-wrap text-xs animate-in fade-in"
              >
                <input
                  ref={inlineInputRef}
                  type="text"
                  required
                  placeholder="Intitulé du nouveau jalon... (Entrée pour valider)"
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  className="flex-1 min-w-[200px] h-7 px-2.5 rounded bg-white border border-emerald-300 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="date"
                  value={inlineDueDate}
                  onChange={(e) => setInlineDueDate(e.target.value)}
                  className="h-7 px-2 rounded bg-white border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none"
                />
                <select
                  value={inlineAssigneeId}
                  onChange={(e) => setInlineAssigneeId(e.target.value)}
                  className="h-7 px-2 rounded bg-white border border-zinc-200 text-[11px] text-zinc-700 focus:outline-none"
                >
                  <option value="">Assigné...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingInline || !inlineTitle.trim()}
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setInlineOpen(false)}
                  className="h-7 px-2 text-zinc-500 hover:text-zinc-800 text-xs"
                >
                  Annuler
                </button>
              </form>
            )}

            {loading ? (
              <p className="text-xs text-zinc-400 text-center py-10 font-mono">Chargement des jalons…</p>
            ) : milestones.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs font-semibold text-zinc-700">Aucun jalon défini sur ce chantier.</p>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Cliquez sur « Générer selon service » ci-dessus pour appliquer le template Minerva-Flow ou appuyez sur « C » pour ajouter un jalon.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {milestones.map((m, idx) => {
                  const isDone = m.status === 'done';
                  const assignee = members.find((mem) => mem.id === m.assignee_id);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/60 transition-colors group',
                        isDone && 'bg-zinc-50/30'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => handleToggle(m, e)}
                          className="text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                          title={isDone ? 'Marquer comme en cours' : 'Marquer comme complété'}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-300" />
                          )}
                        </button>

                        <span className="text-[11px] font-mono text-zinc-400 shrink-0" style={MONO}>
                          #{String(idx + 1).padStart(2, '0')}
                        </span>

                        <Link
                          href={`/projects/${projectId}/roadmap/${m.id}`}
                          className="min-w-0 flex items-center gap-2 group/link"
                          title="Cliquer pour ouvrir les détails et livrables de ce jalon"
                        >
                          <span
                            className={cn(
                              'text-xs sm:text-sm font-semibold truncate transition-colors group-hover/link:text-emerald-700 group-hover/link:underline',
                              isDone ? 'line-through text-zinc-400' : 'text-zinc-900'
                            )}
                          >
                            {m.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-zinc-300 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {m.due_date && (
                          <span className="text-[11px] font-mono text-zinc-500" style={MONO}>
                            {new Date(m.due_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                          </span>
                        )}

                        {assignee && (
                          <span className="text-[11px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded font-medium">
                            {assignee.full_name || assignee.email}
                          </span>
                        )}

                        <Link
                          href={`/projects/${projectId}/roadmap/${m.id}`}
                          className="h-6 px-2 text-[11px] font-medium border border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 rounded text-zinc-600 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Ouvrir la page du jalon (documents, checklist)"
                        >
                          <span>Détails</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setEmailMilestone(m)}
                          className="p-1 rounded text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Notifier le client par email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(m, e)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                          title="Supprimer ce jalon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Email Notification Modal */}
      {emailMilestone && (
        <MilestoneEmailModal
          isOpen={Boolean(emailMilestone)}
          onClose={() => setEmailMilestone(null)}
          milestone={emailMilestone}
          clientName={project?.client_name || 'Client'}
          clientEmail={
            ((project as unknown as Record<string, unknown>)?.client_email as string) ||
            (project?.client_name ? `direction@${project.client_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.ca` : 'client@entreprise.ca')
          }
        />
      )}
    </PageFadeIn>
  );
}
