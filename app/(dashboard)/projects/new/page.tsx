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
  Utensils,
  Layout,
  Target,
  Sparkles,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { addProject, fetchClients, fetchDepartments, addProjectMilestone } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { Client, Department, Project } from '@/lib/types';
import { cn } from '@/lib/utils';

const STAGES: Project['current_stage'][] = ['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'];
const HEALTHS: Project['health'][] = ['Ready', 'On Track', 'Needs Review'];

const TEMPLATES = [
  {
    id: 'minerva_flow',
    label: 'Minerva-Flow (0% Commission)',
    icon: Utensils,
    tag: 'Recommandé Restauration',
    description: 'Commande en ligne directe, QR codes cuisine, menu digitalisé et 0 % de commission.',
    defaultTitle: 'Déploiement Minerva-Flow — Commande Directe 0%',
    defaultDays: 14,
    milestones: [
      { title: '01. Audit des Marges & Démonstration Live', offset: 2 },
      { title: '02. Digitalisation du Menu & Photos Culinaire HD', offset: 5 },
      { title: '03. Passerelle de Paiement Stripe & QR Codes Cuisine', offset: 8 },
      { title: '04. Protocole Test 5-Min en Cuisine Réelle', offset: 11 },
      { title: '05. Lancement Officiel & Suivi en Temps Réel', offset: 14 },
    ],
  },
  {
    id: 'framer',
    label: 'Refonte Web Framer & Design',
    icon: Layout,
    tag: 'Web & Brand',
    description: 'Wireframes UX, maquettes haute-fidélité, animations Framer et recette responsive.',
    defaultTitle: 'Refonte Site Web Framer & SEO',
    defaultDays: 21,
    milestones: [
      { title: '01. Wireframes UX & Architecture de Contenu', offset: 3 },
      { title: '02. Design System & Maquettes Haute-Fidélité', offset: 7 },
      { title: '03. Intégration Framer, Effets & Micro-Interactions', offset: 14 },
      { title: '04. Recette Responsive & Audit Checklist 20-Pts', offset: 18 },
      { title: '05. Mise en Ligne, Redirections DNS & Tracking', offset: 21 },
    ],
  },
  {
    id: 'leadgen',
    label: 'Acquisition & Ads LeadGen',
    icon: Target,
    tag: 'Growth & Ads',
    description: 'Campagnes Meta Ads, Google Ads Search, CAPI et suivi CRM des conversions.',
    defaultTitle: 'Campagne Acquisition & Ads LeadGen',
    defaultDays: 20,
    milestones: [
      { title: '01. Audit d’Audience & Stratégie d’Angles Créatifs', offset: 2 },
      { title: '02. Production des Créatives Vidéo & Copywriting Ads', offset: 5 },
      { title: '03. Implémentation Pixels CAPI & Événements Conversion', offset: 7 },
      { title: '04. Lancement Campagnes Meta Ads & Google Search', offset: 10 },
      { title: '05. Optimisation Continue du CPL & Scaling Rentable', offset: 20 },
    ],
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('minerva_flow');
  const [name, setName] = useState('Déploiement Minerva-Flow — Commande Directe 0%');
  const [isInternal, setIsInternal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [department, setDepartment] = useState('');
  const [currentStage, setCurrentStage] = useState<Project['current_stage']>('Onboarding');
  const [health, setHealth] = useState<Project['health']>('On Track');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    async function loadData() {
      setLoadingClients(true);
      const [clientData, departmentData] = await Promise.all([fetchClients(), fetchDepartments()]);
      setClients(clientData);
      setDepartments(departmentData);
      if (clientData[0]) setClientId(clientData[0].id);
      setLoadingClients(false);
    }
    loadData();
  }, []);

  const handleSelectTemplate = (tmpl: typeof TEMPLATES[0]) => {
    setSelectedTemplateId(tmpl.id);
    setName(tmpl.defaultTitle);
    const d = new Date();
    d.setDate(d.getDate() + tmpl.defaultDays);
    setDueDate(d.toISOString().slice(0, 10));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dueDate) return;
    if (!isInternal && !clientId) return;
    if (isInternal && !department) return;
    setSaving(true);

    const newProject = await addProject({
      client_id: isInternal ? null : clientId,
      department: isInternal ? department : null,
      name,
      current_stage: currentStage,
      health,
      due_date: dueDate,
    });

    if (newProject) {
      // Auto-generate milestones from template
      const tmpl = TEMPLATES.find((t) => t.id === selectedTemplateId);
      if (tmpl && tmpl.milestones.length > 0) {
        try {
          await Promise.all(
            tmpl.milestones.map((m, idx) => {
              const mDate = new Date();
              mDate.setDate(mDate.getDate() + m.offset);
              return addProjectMilestone({
                project_id: newProject.id,
                title: m.title,
                due_date: mDate.toISOString().slice(0, 10),
                position: idx + 1,
              });
            })
          );
        } catch {
          // Milestones fallback
        }
      }

      toastSuccess('Projet créé avec succès', `Le chantier « ${newProject.name} » a été initialisé.`);
      router.push(`/projects/${newProject.id}/roadmap`);
    } else {
      setSaving(false);
      toastError('Erreur', 'Impossible de créer ce projet. Réessayez.');
    }
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
        <p className="text-sm text-mv-ink-soft mt-1">Lance un nouveau chantier à partir d&apos;un modèle pré-configuré ou personnalisé.</p>
      </div>

      {/* ── Template Selection Ribbon ── */}
      <div className="space-y-3">
        <SectionLabel>1. Choisir un modèle de projet</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplateId === tmpl.id;
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={cn(
                  'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative',
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs',
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                    {tmpl.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-zinc-900">{tmpl.label}</h3>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between text-[10.5px] font-medium text-emerald-700">
                  <span>{tmpl.milestones.length} jalons auto-générés</span>
                  <span>{tmpl.defaultDays} jours</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {loadingClients ? (
        <div className="bg-mv-surface border border-mv-border rounded-2xl py-12 text-center text-xs text-mv-ink-soft shadow-mv-sm">Chargement des clients…</div>
      ) : (
        <form onSubmit={handleCreateProject} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
              <SectionLabel>2. Identité du projet</SectionLabel>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du projet</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Déploiement Minerva-Flow"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-mv-cream-soft border border-mv-border w-fit">
                <button
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                    !isInternal ? 'bg-white text-mv-ink shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
                  )}
                >
                  Projet client
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                    isInternal ? 'bg-white text-mv-ink shadow-2xs' : 'text-mv-ink-soft hover:text-mv-ink'
                  )}
                >
                  Projet interne
                </button>
              </div>

              {isInternal ? (
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Département</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                    >
                      <option value="">Sélectionner un département</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {departments.length === 0 && (
                    <p className="text-[11px] text-mv-ink-faint mt-1.5">
                      Aucun département enregistré. <Link href="/team" className="text-mv-green hover:underline">Créez-en un dans Équipe</Link>.
                    </p>
                  )}
                </div>
              ) : clients.length === 0 ? (
                <p className="text-[11px] text-mv-ink-faint">
                  Aucun client enregistré. <Link href="/clients/new" className="text-mv-green hover:underline">Créez d&apos;abord un client</Link>, ou choisissez « Projet interne » ci-dessus.
                </p>
              ) : (
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
              )}
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
              <SectionLabel>3. Suivi & Échéance</SectionLabel>
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
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Échéance de livraison</label>
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
                {saving ? 'Création en cours…' : 'Créer le projet avec modèle'}
              </Button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Aperçu du chantier</SectionLabel>
            <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar name={isInternal ? (department || 'Interne') : client?.name || 'Client'} src={isInternal ? undefined : client?.logo_url} size="lg" shape="rounded" />
                <div className="min-w-0">
                  <div className="font-bold text-sm text-mv-ink truncate">{name || 'Nom du projet'}</div>
                  <div className="text-[11px] text-mv-ink-soft truncate">
                    {isInternal ? `Projet interne${department ? ` · ${department}` : ''}` : client?.name || 'Client'}
                  </div>
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
              Le guide complet de déploiement et les 5 jalons de production seront automatiquement injectés dans la feuille de route du projet.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
