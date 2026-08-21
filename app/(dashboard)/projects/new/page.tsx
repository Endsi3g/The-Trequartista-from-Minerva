'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Building2,
  DollarSign,
  Users,
  Eye,
  EyeOff,
  Flag,
  Plus,
  X,
  Paperclip,
  UploadCloud,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import {
  addProject,
  fetchClients,
  fetchTeamMembers,
  addProjectMilestone,
  addProjectAttachment,
} from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { Client, Project, TeamMemberSummary } from '@/lib/types';

const STAGES: Project['current_stage'][] = ['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'];
const HEALTHS: Project['health'][] = ['Ready', 'On Track', 'Needs Review'];

interface DraftMilestone {
  title: string;
  due_date: string;
}

interface DraftAttachment {
  name: string;
  url: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [currentStage, setCurrentStage] = useState<Project['current_stage']>('Onboarding');
  const [health, setHealth] = useState<Project['health']>('On Track');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [clientVisible, setClientVisible] = useState(true);

  const [milestones, setMilestones] = useState<DraftMilestone[]>([]);
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');

  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoadingClients(true);
      const [clientData, members] = await Promise.all([fetchClients(), fetchTeamMembers()]);
      setClients(clientData);
      if (clientData[0]) setClientId(clientData[0].id);
      setTeamMembers(members);
      setLoadingClients(false);
    }
    loadData();
  }, []);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const addMilestoneDraft = () => {
    if (!milestoneTitle.trim()) return;
    setMilestones((prev) => [...prev, { title: milestoneTitle.trim(), due_date: milestoneDate }]);
    setMilestoneTitle('');
    setMilestoneDate('');
  };
  const removeMilestoneDraft = (i: number) => setMilestones((prev) => prev.filter((_, idx) => idx !== i));

  const addAttachmentDraft = () => {
    if (!attachmentName.trim() || !attachmentUrl.trim()) return;
    setAttachments((prev) => [...prev, { name: attachmentName.trim(), url: attachmentUrl.trim() }]);
    setAttachmentName('');
    setAttachmentUrl('');
  };
  const removeAttachmentDraft = (i: number) => setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const handleFileUpload = async (file: File) => {
    setUploadingFile(true);
    try {
      const supabase = createClient();
      const filePath = `project-attachments/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('client-assets').upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) {
        toastError('Erreur', 'Impossible de téléverser ce fichier.');
        return;
      }
      const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath);
      setAttachments((prev) => [...prev, { name: file.name, url: data.publicUrl }]);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !dueDate) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const newProject = await addProject({
      client_id: clientId,
      name,
      current_stage: currentStage,
      health,
      due_date: dueDate,
      budget_cad: budget ? Number(budget) : null,
      assignees: assigneeIds,
      client_visible: clientVisible,
    });

    if (newProject) {
      await Promise.all([
        ...milestones.map((m, i) =>
          addProjectMilestone({ project_id: newProject.id, title: m.title, due_date: m.due_date || null, position: i })
        ),
        ...(user
          ? attachments.map((a) => addProjectAttachment({ project_id: newProject.id, name: a.name, url: a.url, created_by: user.id }))
          : []),
      ]);
      router.push(`/projects/${newProject.id}/roadmap`);
    } else {
      toastError('Erreur', 'Impossible de créer ce projet. Réessayez.');
    }
    setSaving(false);
  };

  const client = clients.find((c) => c.id === clientId);
  const healthVariant = health === 'Needs Review' ? 'red' : health === 'Ready' ? 'green' : 'blue';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <Link href="/projects" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux projets
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Projet</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Lance un nouveau chantier pour un client.</p>
      </div>

      {loadingClients ? (
        <div className="bg-mv-surface border border-mv-border rounded-2xl py-12 text-center text-xs text-mv-ink-soft shadow-mv-sm">Chargement des clients…</div>
      ) : clients.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-2xl py-12 text-center text-xs text-mv-ink-soft shadow-mv-sm">
          Aucun client enregistré. <Link href="/clients/new" className="text-mv-green hover:underline">Créez d&apos;abord un client</Link>.
        </div>
      ) : (
        <form onSubmit={handleCreateProject} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
              <SectionLabel>Identité du projet</SectionLabel>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du projet</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Refonte Site Framer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Client</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
              <SectionLabel>Suivi</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Étape</label>
                  <select
                    value={currentStage}
                    onChange={(e) => setCurrentStage(e.target.value as Project['current_stage'])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                  >
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Santé</label>
                  <select
                    value={health}
                    onChange={(e) => setHealth(e.target.value as Project['health'])}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
                  >
                    {HEALTHS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Échéance</label>
                  <div className="relative">
                    <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Budget (CAD, optionnel)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={0}
                      placeholder="5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
              <SectionLabel>Équipe & visibilité</SectionLabel>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Membres assignés
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.length === 0 ? (
                    <p className="text-[11px] text-mv-ink-faint">Aucun membre d&apos;équipe disponible.</p>
                  ) : (
                    teamMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          assigneeIds.includes(m.id)
                            ? 'bg-mv-green text-white border-mv-green'
                            : 'bg-mv-cream-soft text-mv-ink-soft border-mv-border hover:text-mv-ink'
                        }`}
                      >
                        {m.full_name}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClientVisible((v) => !v)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border cursor-pointer"
              >
                <span className="text-xs font-bold text-mv-ink flex items-center gap-1.5">
                  {clientVisible ? <Eye className="w-3.5 h-3.5 text-mv-green" /> : <EyeOff className="w-3.5 h-3.5 text-mv-ink-faint" />}
                  Visible dans le portail client
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${clientVisible ? 'bg-mv-green-tint text-mv-green' : 'bg-mv-cream text-mv-ink-faint'}`}>
                  {clientVisible ? 'Visible' : 'Interne'}
                </span>
              </button>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-3">
              <SectionLabel>Jalons (optionnel)</SectionLabel>
              {milestones.length > 0 && (
                <div className="space-y-1.5">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Flag className="w-3 h-3 text-mv-green shrink-0" />
                        <span className="font-semibold text-mv-ink truncate">{m.title}</span>
                        {m.due_date && <span className="text-mv-ink-faint shrink-0">— {m.due_date}</span>}
                      </span>
                      <button type="button" onClick={() => removeMilestoneDraft(i)} className="text-mv-ink-faint hover:text-mv-red cursor-pointer shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Titre du jalon"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                />
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                />
                <button type="button" onClick={addMilestoneDraft} className="px-3 py-2 rounded-lg bg-mv-ink hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-3">
              <SectionLabel>Fichiers & ressources (optionnel)</SectionLabel>
              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                      <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 min-w-0 text-mv-ink hover:text-mv-green">
                        <Paperclip className="w-3 h-3 shrink-0" />
                        <span className="font-semibold truncate">{a.name}</span>
                      </a>
                      <button type="button" onClick={() => removeAttachmentDraft(i)} className="text-mv-ink-faint hover:text-mv-red cursor-pointer shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-mv-border hover:border-mv-green/50 bg-mv-cream-soft/40 cursor-pointer transition-all text-xs font-bold text-mv-ink">
                {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin text-mv-green" /> : <UploadCloud className="w-4 h-4 text-mv-green" />}
                {uploadingFile ? 'Envoi…' : 'Téléverser un fichier'}
                <input type="file" className="hidden" disabled={uploadingFile} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://…"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nom du lien"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-32 px-2 py-2 rounded-lg bg-mv-cream-soft border border-mv-border text-xs text-mv-ink focus:outline-none focus:border-mv-green"
                />
                <button type="button" onClick={addAttachmentDraft} className="px-3 py-2 rounded-lg bg-mv-ink hover:bg-black text-white text-xs font-bold cursor-pointer shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="secondary" className="w-full">Annuler</Button>
              </Link>
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Créer le projet'}
              </Button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Aperçu</SectionLabel>
            <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={client?.name || 'Client'} src={client?.logo_url} size="lg" shape="rounded" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-mv-ink truncate">{name || 'Nom du projet'}</div>
                  <div className="text-[11px] text-mv-ink-soft truncate">{client?.name || 'Client'}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-mv-border flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Étape</span>
                <span className="text-xs font-semibold text-mv-ink">{currentStage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Échéance</span>
                <span className="text-xs font-semibold text-mv-ink">
                  {dueDate ? new Date(dueDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' }) : 'À définir'}
                </span>
              </div>
              {budget && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-mv-ink-soft">Budget</span>
                  <span className="text-xs font-mono font-bold text-mv-green">{Number(budget).toLocaleString('fr-CA')} $</span>
                </div>
              )}
              {assigneeIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-mv-ink-soft">Équipe</span>
                  <span className="text-xs font-semibold text-mv-ink">{assigneeIds.length} membre{assigneeIds.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {milestones.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-mv-ink-soft">Jalons</span>
                  <span className="text-xs font-semibold text-mv-ink">{milestones.length}</span>
                </div>
              )}
              <Badge variant={healthVariant}>{health}</Badge>
            </div>
            <p className="text-[11px] text-mv-ink-faint leading-relaxed">
              Voici comment ce projet apparaîtra dans la liste une fois créé.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
