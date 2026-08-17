'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, Briefcase, CalendarDays, Building2 } from 'lucide-react';
import { addProject, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { Client, Project } from '@/lib/types';

const STAGES: Project['current_stage'][] = ['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'];
const HEALTHS: Project['health'][] = ['Ready', 'On Track', 'Needs Review'];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [currentStage, setCurrentStage] = useState<Project['current_stage']>('Onboarding');
  const [health, setHealth] = useState<Project['health']>('On Track');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    async function loadClients() {
      setLoadingClients(true);
      const data = await fetchClients();
      setClients(data);
      if (data[0]) setClientId(data[0].id);
      setLoadingClients(false);
    }
    loadClients();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientId || !dueDate) return;
    setSaving(true);

    const newProject = await addProject({
      client_id: clientId,
      name,
      current_stage: currentStage,
      health,
      due_date: dueDate,
    });

    setSaving(false);
    if (newProject) {
      router.push(`/projects/${newProject.id}/roadmap`);
    } else {
      toastError('Erreur', 'Impossible de créer ce projet. Réessayez.');
    }
  };

  const client = clients.find((c) => c.id === clientId);
  const healthVariant = health === 'Needs Review' ? 'red' : health === 'Ready' ? 'green' : 'blue';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
