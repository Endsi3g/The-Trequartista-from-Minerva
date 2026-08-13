'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { addTask, fetchClients, fetchProjects, fetchLeads } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { Client, Project, Lead } from '@/lib/types';

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/tasks" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux tâches
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouvelle Tâche</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Titre</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Préparer la présentation Q3 pour le client X"
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Description (optionnel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Assigné à</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="">Non assigné</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">Projet lié</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
              >
                <option value="">Aucun</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">Client lié</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
              >
                <option value="">Aucun</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Lead lié (optionnel)</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="">Aucun</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.company_name || l.contact_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Échéance (optionnel)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-mv-green hover:bg-mv-green-dark text-white font-bold text-sm rounded-xl shadow-mv-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Création…' : 'Créer la tâche'}
          </button>
        </form>
      </Card>
    </div>
  );
}
