'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { CheckCircle2, Map, Plus, Trash2, CalendarDays, User as UserIcon } from 'lucide-react';
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

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

export default function ProjectRoadmapPage() {
  const params = useParams();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastError } = useToast();
  const confirmDialog = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMilestones = async (id: string) => {
    setMilestones(await fetchProjectMilestones(id));
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
      setProject(projects.find((p) => p.id === projectId) || null);
      setMembers(profiles || []);
      await loadMilestones(projectId as string);
      setLoading(false);
    }
    loadProject();
  }, [projectId]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !projectId) return;
    setSaving(true);
    const created = await addProjectMilestone({
      project_id: projectId,
      title: newTitle.trim(),
      due_date: newDueDate || null,
      assignee_id: newAssigneeId || null,
      position: milestones.length,
    });
    setSaving(false);
    if (!created) {
      toastError('Erreur', "Impossible de créer ce jalon. La migration project_milestones est peut-être encore en attente de déploiement.");
      return;
    }
    setNewTitle('');
    setNewDueDate('');
    setNewAssigneeId('');
    setShowAddForm(false);
    await loadMilestones(projectId);
  };

  const handleToggle = async (m: ProjectMilestone) => {
    const nextStatus = m.status === 'done' ? 'pending' : 'done';
    setMilestones((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: nextStatus } : x)));
    const ok = await toggleProjectMilestone(m.id, nextStatus);
    if (!ok && projectId) await loadMilestones(projectId);
  };

  const handleDelete = async (m: ProjectMilestone) => {
    const ok = await confirmDialog({
      title: 'Supprimer ce jalon ?',
      message: `« ${m.title} » sera retiré de la feuille de route.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok || !projectId) return;
    setMilestones((prev) => prev.filter((x) => x.id !== m.id));
    await deleteProjectMilestone(m.id);
  };

  if (!loading && !project) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Projet introuvable.</p>
        <p className="text-xs text-mv-ink-soft">Ce projet n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  const doneCount = milestones.filter((m) => m.status === 'done').length;

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

      <Card
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Jalons {milestones.length > 0 && `(${doneCount}/${milestones.length})`}
              </h3>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-mv-green hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter un jalon
              </button>
            )}
          </div>
        }
      >
        {showAddForm && (
          <form onSubmit={handleAddMilestone} className="mb-4 p-4 rounded-xl bg-mv-cream-soft border border-mv-border space-y-3">
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Validation des maquettes Framer"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Non assigné</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddForm(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Création…' : 'Ajouter le jalon'}
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-10 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : milestones.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Map className="w-8 h-8 text-mv-ink-faint mx-auto" />
            <p className="text-sm font-bold text-mv-ink">Aucun jalon défini.</p>
            <p className="text-xs text-mv-ink-soft">Ajoute le premier jalon de ce projet ci-dessus.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                  m.status === 'done' ? 'bg-mv-green-tint/40 border-mv-green/20' : 'bg-mv-cream-soft border-mv-border'
                }`}
              >
                <button
                  onClick={() => handleToggle(m)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    m.status === 'done' ? 'bg-mv-green border-mv-green' : 'border-mv-ink-faint hover:border-mv-green'
                  }`}
                  title={m.status === 'done' ? 'Marquer à faire' : 'Marquer terminé'}
                >
                  {m.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${m.status === 'done' ? 'text-mv-ink-soft line-through' : 'text-mv-ink'}`}>
                    {m.title}
                  </div>
                  {m.due_date && (
                    <div className="text-[11px] text-mv-ink-faint mt-0.5">
                      Échéance : {new Date(m.due_date + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {m.assignee_name && (
                  <UserAvatar name={m.assignee_name} src={m.assignee_avatar} size="xs" className="shrink-0" />
                )}
                <button
                  onClick={() => handleDelete(m)}
                  className="p-1.5 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer shrink-0"
                  title="Supprimer le jalon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
