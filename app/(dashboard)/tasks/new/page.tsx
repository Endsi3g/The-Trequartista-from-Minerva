'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, CalendarDays, Link2, User as UserIcon } from 'lucide-react';
import { addTask, fetchClients, fetchProjects, fetchLeads } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Client, Project, Lead } from '@/lib/types';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewTaskPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: profiles }, projectsData, clientsData, leadsData] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').eq('approved', true).order('full_name'),
        fetchProjects(),
        fetchClients(),
        fetchLeads(),
      ]);
      setMembers(profiles || []);
      setProjects(projectsData);
      setClients(clientsData);
      setLeads(leadsData);
    })();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await addTask({
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: assigneeId || null,
      project_id: projectId || null,
      client_id: clientId || null,
      lead_id: leadId || null,
      created_by: user.id,
      due_date: dueDate || null,
    });

    setSaving(false);
    router.push('/tasks');
  };

  const assignee = members.find((m) => m.id === assigneeId);
  const linkedProject = projects.find((p) => p.id === projectId);
  const linkedClient = clients.find((c) => c.id === clientId);
  const linkedLead = leads.find((l) => l.id === leadId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/tasks" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux tâches
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouvelle Tâche</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Délègue une action à un membre de l&apos;équipe.</p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Détails</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Titre</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Préparer la présentation Q3 pour le client X"
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Description (optionnel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Assigné à</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Non assigné</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Échéance (optionnel)</label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Liens (optionnel)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Projet lié</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Aucun</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Client lié</label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Aucun</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Lead lié</label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Aucun</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.company_name || l.contact_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/tasks" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Création…' : 'Créer la tâche'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="font-bold text-sm text-mv-ink">{title || 'Titre de la tâche'}</div>
            {description && <p className="text-[11px] text-mv-ink-soft leading-relaxed line-clamp-3">{description}</p>}
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Assigné à</span>
              {assignee ? (
                <span className="flex items-center gap-1.5">
                  <UserAvatar name={assignee.full_name || assignee.email || '?'} size="xs" />
                  <span className="text-xs font-semibold text-mv-ink">{assignee.full_name || assignee.email}</span>
                </span>
              ) : (
                <span className="text-xs text-mv-ink-faint">Non assigné</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Échéance</span>
              <span className="text-xs font-semibold text-mv-ink">
                {dueDate ? new Date(dueDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : 'Aucune'}
              </span>
            </div>
            {(linkedProject || linkedClient || linkedLead) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {linkedProject && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-mv-blue-bg text-mv-blue border border-mv-blue/30">{linkedProject.name}</span>
                )}
                {linkedClient && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-mv-green-tint text-mv-green border border-mv-green/30">{linkedClient.name}</span>
                )}
                {linkedLead && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-mv-purple-bg text-mv-purple border border-mv-purple/30">{linkedLead.company_name || linkedLead.contact_name}</span>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment cette tâche apparaîtra dans la liste une fois créée.
          </p>
        </div>
      </form>
    </div>
  );
}
