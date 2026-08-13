'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { addProject, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { Client, Project } from '@/lib/types';

const STAGES: Project['current_stage'][] = ['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'];
const HEALTHS: Project['health'][] = ['Ready', 'On Track', 'Needs Review'];

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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/projects" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux projets
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Projet</h1>

      <Card>
        {loadingClients ? (
          <div className="py-8 text-center text-xs text-mv-ink-soft">Chargement des clients…</div>
        ) : clients.length === 0 ? (
          <div className="py-8 text-center text-xs text-mv-ink-soft">
            Aucun client enregistré. <Link href="/clients/new" className="text-mv-green hover:underline">Créez d'abord un client</Link>.
          </div>
        ) : (
          <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-mv-ink mb-1">Nom du Projet</label>
              <input
                type="text"
                required
                placeholder="Ex: Refonte Site Framer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <div>
              <label className="block font-bold text-mv-ink mb-1">Client</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-mv-ink mb-1">Étape</label>
                <select
                  value={currentStage}
                  onChange={(e) => setCurrentStage(e.target.value as Project['current_stage'])}
                  className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                >
                  {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-bold text-mv-ink mb-1">Santé</label>
                <select
                  value={health}
                  onChange={(e) => setHealth(e.target.value as Project['health'])}
                  className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
                >
                  {HEALTHS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-mv-ink mb-1">Échéance</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="secondary" className="w-full">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
