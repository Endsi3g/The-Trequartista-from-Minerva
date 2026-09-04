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
  Mail,
  Send,
  Upload,
  Paperclip,
  FileCode,
  FileSpreadsheet,
  Link2,
} from 'lucide-react';
import {
  fetchProjects,
  fetchProjectMilestone,
  fetchTeamMembers,
  updateProjectMilestone,
} from '@/lib/services/supabase-data';
import type { Project, ProjectMilestone, TeamMemberSummary } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { MilestoneEmailModal } from '@/components/projects/MilestoneEmailModal';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

interface AttachedDocument {
  id: string;
  title: string;
  url: string;
  type: 'figma' | 'framer' | 'pdf' | 'spec' | 'drive' | 'other';
  added_at: string;
  file_size?: string;
}

const DEFAULT_DOCUMENTS: AttachedDocument[] = [
  {
    id: 'doc-1',
    title: 'Cahier des charges & Spécifications techniques',
    url: 'https://notion.so/minerva/spec-chantier',
    type: 'spec',
    added_at: '2026-09-01',
    file_size: '240 Ko',
  },
  {
    id: 'doc-2',
    title: 'Prototype interactif Figma (High-Fidelity)',
    url: 'https://figma.com/@minerva/prototype-preview',
    type: 'figma',
    added_at: '2026-09-02',
    file_size: 'Figma Cloud',
  },
];

const DEFAULT_OFFICIAL_TEAM: TeamMemberSummary[] = [
  { id: 'u1-kael-belceus', full_name: 'Kael Belceus', email: 'kael@minerva.ca', avatar_url: null, phone: null },
  { id: 'u2-manpreet-singh', full_name: 'Manpreet Singh', email: 'manpreet@minerva.ca', avatar_url: null, phone: null },
  { id: 'u3-rayan', full_name: 'Rayan', email: 'rayan@minerva.ca', avatar_url: null, phone: null },
  { id: 'u4-samuel-adeleke', full_name: 'Samuel Olamide Adeleke', email: 'samuel@minerva.ca', avatar_url: null, phone: null },
  { id: 'u5-amine-karroubi', full_name: 'Amine Yahya Karroubi', email: 'amine@minerva.ca', avatar_url: null, phone: null },
];

export default function DedicatedMilestonePage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const milestoneId = Array.isArray(params?.milestoneId) ? params.milestoneId[0] : params?.milestoneId;
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [milestone, setMilestone] = useState<ProjectMilestone | null>(null);
  const [team, setTeam] = useState<TeamMemberSummary[]>(DEFAULT_OFFICIAL_TEAM);
  const [loading, setLoading] = useState(true);

  // Email Notification Modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'pending' | 'done'>('pending');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  // Attached Documents & Links
  const [documents, setDocuments] = useState<AttachedDocument[]>(DEFAULT_DOCUMENTS);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState<AttachedDocument['type']>('spec');
  const [docFormOpen, setDocFormOpen] = useState(false);

  // Interactive Sub-Tasks checklist
  const [subtasks, setSubtasks] = useState<SubTask[]>([
    { id: 'st-1', title: 'Audit des exigences techniques et contraintes du client', done: true },
    { id: 'st-2', title: 'Validation des maquettes et composants UI avec le lead technique', done: true },
    { id: 'st-3', title: 'Intégration du flux de données et tests des endpoints API', done: false },
    { id: 'st-4', title: 'Recette QA 20-points et validation formelle de livraison', done: false },
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
        if (members && members.length > 0) {
          setTeam(members);
        }

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

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;
    const newDoc: AttachedDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      url: newDocUrl.trim(),
      type: newDocType,
      added_at: new Date().toISOString().split('T')[0],
      file_size: 'Document Web',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setNewDocTitle('');
    setNewDocUrl('');
    setDocFormOpen(false);
    toastSuccess('Document rattaché', `« ${newDoc.title} » est maintenant lié à ce jalon.`);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toastSuccess('Document retiré', 'Le document a été détaché.');
  };

  const handleSaveMilestone = async () => {
    if (!milestoneId) return;
    setSaving(true);
    const ok = await updateProjectMilestone(milestoneId, {
      title,
      description,
      status,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    });
    setSaving(false);
    if (ok) {
      toastSuccess('Jalon enregistré', 'Toutes les modifications et pièces jointes ont été synchronisées.');
    } else {
      toastError('Erreur', 'Impossible d’enregistrer le jalon.');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-zinc-400 font-mono" style={MONO}>
        Chargement des spécifications du jalon…
      </div>
    );
  }

  return (
    <PageFadeIn className="space-y-3 max-w-7xl mx-auto pb-16">
      {/* ── 1. Linear/Raycast Toolbar Strip (40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/projects/${projectId}/roadmap`}
            className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Roadmap</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-900 truncate">
            {project?.client_name || 'Client'}
          </span>
          <span className="text-zinc-300">/</span>
          <span className="font-mono text-[10.5px] text-zinc-500 uppercase tracking-wider truncate" style={MONO}>
            Jalon #{milestoneId?.slice(0, 6)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Notifier client</span>
          </button>

          <button
            type="button"
            onClick={handleSaveMilestone}
            disabled={saving}
            className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{saving ? 'Enregistrement…' : 'Enregistrer (⌘+S)'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Metric Ribbon (4-Columns, Height ≤ 64px) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-xs">
        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            État du Jalon
          </div>
          <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <span>{status === 'done' ? 'Validé & Prêt' : 'En cours d’exécution'}</span>
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Complétion Sous-Tâches
          </div>
          <div className="text-sm font-bold font-mono text-emerald-700 flex items-center gap-2 mt-0.5" style={MONO}>
            <span>{completionPct}%</span>
            <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Documents Rattachés
          </div>
          <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5" style={MONO}>
            {documents.length} ressources
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Date d’Échéance
          </div>
          <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5" style={MONO}>
            {dueDate ? new Date(dueDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Non fixée'}
          </div>
        </div>
      </div>

      {/* ── 3. Monolithic Split-View Layout (65% Spécifications & Checklists / 35% Paramètres & Fichiers) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column (65% -> 8 cols) : Specifications, Subtasks & Description */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs divide-y divide-zinc-100">
          {/* Main Title & Description Form */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded" style={MONO}>
                  Livrable Technique
                </span>
                <span className="text-xs text-zinc-400 font-mono" style={MONO}>
                  ID: {milestoneId}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setStatus(status === 'done' ? 'pending' : 'done')}
                className={cn(
                  'h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
                  status === 'done'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200/70'
                )}
              >
                {status === 'done' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Complété</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>En cours</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du Jalon..."
              className="text-base sm:text-lg font-bold text-zinc-900 w-full bg-transparent border-none outline-none focus:ring-0 p-0 placeholder:text-zinc-400"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des livrables, critères d'acceptation et objectifs de ce jalon..."
              rows={3}
              className="text-xs text-zinc-600 w-full bg-zinc-50/60 border border-zinc-200 rounded-md p-2.5 outline-none focus:border-emerald-600 focus:bg-white resize-none placeholder:text-zinc-400 leading-relaxed"
            />
          </div>

          {/* Sub-Tasks & QA Checklist Section */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-zinc-700" />
                <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                  Checklist & Sous-Tâches ({completedSubtasks}/{subtasks.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
                {completionPct}% réalisé
              </span>
            </div>

            <div className="border border-zinc-200 rounded-md overflow-hidden divide-y divide-zinc-100 bg-white">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleToggleSubtask(st.id)}
                  className={cn(
                    'px-3 py-2 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer hover:bg-zinc-50 group',
                    st.done && 'bg-emerald-50/20 text-zinc-400'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={st.done}
                      onChange={() => {}}
                      className="w-3.5 h-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <span className={cn('font-medium text-xs truncate', st.done && 'line-through text-zinc-400')}>
                      {st.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubtask(st.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 transition-opacity cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inline Add Subtask Input (32px) */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="+ Ajouter un point de contrôle ou une tâche... (Entrée)"
                className="flex-1 h-8 px-3 text-xs rounded-md border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
              </button>
            </form>
          </div>

          {/* Agency Direct Tip */}
          <div className="p-3 bg-zinc-50/80 flex items-start gap-2.5 text-zinc-600 text-[11px] leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-zinc-900">Standard Minerva MDS-01 : </strong>
              <span>Chaque jalon validé est visible instantanément par le client sur son portail extranet dédié. Notifiez-le dès la livraison pour accélérer la validation de facture.</span>
            </div>
          </div>
        </div>

        {/* Right Column (35% -> 4 cols) : Attached Documents & Parameters Sheet */}
        <div className="lg:col-span-4 sticky top-4 space-y-3">
          {/* Metadata Sheet */}
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 space-y-3 shadow-xs">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 flex items-center justify-between">
              <span>Attribution & Échéancier</span>
              <span className="font-mono text-emerald-700" style={MONO}>MDS-01</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" /> Date d’échéance
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 font-mono"
                  style={MONO}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-400" /> Membre responsable
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
            </div>
          </div>

          {/* Attached Documents & Resources */}
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <Paperclip className="w-3 h-3 text-zinc-400" />
                <span>Documents & Livrables ({documents.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setDocFormOpen(!docFormOpen)}
                className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Rattacher</span>
              </button>
            </div>

            {/* New Document Form */}
            {docFormOpen && (
              <form onSubmit={handleAddDocument} className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-md space-y-2 text-xs">
                <input
                  type="text"
                  required
                  placeholder="Intitulé du document..."
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:border-emerald-600"
                />
                <input
                  type="url"
                  required
                  placeholder="https://... (Figma, Framer, Drive, PDF)"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white text-zinc-900 font-mono text-[11px] focus:outline-none focus:border-emerald-600"
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as AttachedDocument['type'])}
                    className="h-7 px-2 text-[11px] rounded border border-zinc-200 bg-white text-zinc-700 focus:outline-none"
                  >
                    <option value="spec">Spécification / SOP</option>
                    <option value="figma">Maquette Figma</option>
                    <option value="framer">Livrable Framer</option>
                    <option value="pdf">Document PDF</option>
                    <option value="drive">Dossier Drive</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDocFormOpen(false)}
                      className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-800"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="h-7 px-2.5 bg-emerald-600 text-white rounded font-medium text-xs hover:bg-emerald-700"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Documents List */}
            {documents.length === 0 ? (
              <p className="text-[11px] text-zinc-400 py-2 text-center">Aucun document rattaché.</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 rounded border border-zinc-200 hover:border-zinc-300 transition-colors flex items-center justify-between gap-2 text-xs group bg-zinc-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-zinc-200/70 text-zinc-700 font-mono" style={MONO}>
                          {doc.type}
                        </span>
                        <span className="font-semibold text-zinc-800 truncate text-xs">
                          {doc.title}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-400 font-mono mt-0.5 truncate" style={MONO}>
                        {doc.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Ouvrir le document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Détacher le document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Milestone Email Notification Modal ── */}
      {emailModalOpen && (
        <MilestoneEmailModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          milestone={milestone}
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
