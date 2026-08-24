'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Link2,
  User as UserIcon,
  Sparkles,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Bot,
  Layers,
  Building2,
  UserCheck,
  Zap,
  CornerDownLeft,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useToast } from '@/components/providers/ToastProvider';
import { addTask, fetchClients, fetchProjects, fetchLeads } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import type { Client, Project, Lead } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

interface SubTaskItem {
  id: string;
  text: string;
  completed: boolean;
}

type PriorityLevel = 'P1' | 'P2' | 'P3';

const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; bg: string; text: string; border: string; dot: string }> = {
  P1: { label: 'P1 Urgent', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  P2: { label: 'P2 Normal', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  P3: { label: 'P3 Basse', bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200', dot: 'bg-zinc-400' },
};

export default function NewTaskPage() {
  const router = useRouter();
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('P2');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Subtasks Generator State
  const [subtasks, setSubtasks] = useState<SubTaskItem[]>([]);
  const [generatingSubtasks, setGeneratingSubtasks] = useState(false);

  // Relations Data
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: profiles }, projectsData, clientsData, leadsData] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, avatar_url').eq('approved', true).order('full_name'),
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

  // Keyboard shortcut: ⌘+Enter or Ctrl+Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleGenerateSubtasks = () => {
    if (!title.trim()) {
      toastInfo('Titre requis', 'Veuillez saisir un titre de tâche pour découper les étapes.');
      titleInputRef.current?.focus();
      return;
    }

    setGeneratingSubtasks(true);
    setTimeout(() => {
      const t = title.toLowerCase();
      let generated: string[] = [];

      if (t.includes('flow') || t.includes('commande') || t.includes('menu')) {
        generated = [
          'Importer la carte et le menu avec les options et suppléments',
          'Configurer les identifiants Stripe Connect pour le versement direct',
          'Tester le parcours de commande en ligne sur mobile & desktop',
          'Former le personnel de cuisine sur la tablette de commande',
        ];
      } else if (t.includes('lead') || t.includes('audit') || t.includes('appel') || t.includes('prospect')) {
        generated = [
          'Analyser la transcription de l’appel de qualification',
          'Extraire les 3 opportunités de croissance et le scoring IA',
          'Générer la proposition personnalisée avec lien de paiement',
          'Programmer la relance SMS / WhatsApp sous 48h',
        ];
      } else {
        generated = [
          `Définir le cahier des charges pour : ${title.slice(0, 30)}`,
          'Exécuter l’implémentation technique et les tests de validation',
          'Mettre à jour la documentation et notifier le client',
        ];
      }

      setSubtasks(
        generated.map((text, idx) => ({
          id: `st-${Date.now()}-${idx}`,
          text,
          completed: false,
        }))
      );
      setGeneratingSubtasks(false);
      toastSuccess('Étapes générées par IA', `${generated.length} sous-tâches créées.`);
    }, 600);
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toastError('Champ obligatoire', 'Veuillez indiquer un titre pour la tâche.');
      titleInputRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toastError('Erreur', 'Session expirée.');
        return;
      }

      // Compile subtasks into description if any
      let finalDescription = description.trim();
      if (subtasks.length > 0) {
        const subtasksMarkdown = subtasks
          .map((st) => `- [${st.completed ? 'x' : ' '}] ${st.text}`)
          .join('\n');
        finalDescription = finalDescription
          ? `${finalDescription}\n\n### Étapes :\n${subtasksMarkdown}`
          : `### Étapes :\n${subtasksMarkdown}`;
      }

      const created = await addTask({
        title: title.trim(),
        description: finalDescription || null,
        assignee_id: assigneeId || null,
        project_id: projectId || null,
        client_id: clientId || null,
        lead_id: leadId || null,
        created_by: user.id,
        due_date: dueDate || null,
      });

      if (created) {
        toastSuccess('Tâche créée !', `« ${title} » a été ajoutée au tableau.`);
        router.push('/tasks');
      } else {
        toastError('Erreur', "Impossible de créer la tâche.");
      }
    } finally {
      setSaving(false);
    }
  };

  const assignee = members.find((m) => m.id === assigneeId);
  const linkedProject = projects.find((p) => p.id === projectId);
  const linkedClient = clients.find((c) => c.id === clientId);
  const linkedLead = leads.find((l) => l.id === leadId);
  const prioConf = PRIORITY_CONFIG[priority];

  return (
    <div className="space-y-4 pb-8 max-w-6xl mx-auto">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs text-zinc-400 font-mono" style={MONO}>
            Minerva / Productivité / Tâches / Nouvelle
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-base font-semibold text-zinc-900 tracking-tight font-display">
              Créer une Tâche
            </h1>
            <span className="hidden sm:inline text-xs text-zinc-400 font-mono" style={MONO}>
              • 0-Scroll Single Viewport
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="h-7 px-2.5 text-xs text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:bg-zinc-50 rounded-md flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </Link>

          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            variant="primary"
            className="h-7 px-3 text-xs font-bold gap-1.5 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{saving ? 'Création…' : 'Créer la Tâche (⌘ + Entrée)'}</span>
          </Button>
        </div>
      </div>

      {/* ── Monolithic 2-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ── Left Column (2/3): Formulaire d'Édition ── */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg p-5 shadow-xs space-y-4">
          
          {/* 1. Title Input */}
          <div className="space-y-1">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Titre de la tâche (ex: Déployer commande directe sans commission)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold text-zinc-900 placeholder:text-zinc-400 border-b border-zinc-200 pb-2 focus:outline-none focus:border-emerald-600 bg-transparent transition-colors"
              autoFocus
            />
          </div>

          {/* 2. Description Textarea */}
          <div className="space-y-1">
            <textarea
              placeholder="Description, contexte ou spécifications techniques..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full text-xs text-zinc-800 placeholder:text-zinc-400 p-2.5 rounded-md border border-zinc-200 focus:outline-none focus:border-emerald-600 bg-zinc-50/40 resize-none transition-colors"
            />
          </div>

          {/* 3. AI Subtask Generator (`✦ Découper en étapes`) */}
          <div className="space-y-2 pt-1 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sous-tâches &amp; Checklist</span>
                <span className="text-[10px] font-mono text-zinc-400">({subtasks.length})</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateSubtasks}
                disabled={generatingSubtasks}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{generatingSubtasks ? 'Génération IA…' : '✦ Découper en étapes (IA)'}</span>
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/60 max-h-48 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded bg-white border border-zinc-200/60 text-xs hover:border-zinc-300 transition-colors group"
                  >
                    <div
                      onClick={() => toggleSubtask(st.id)}
                      className="flex items-center gap-2 flex-1 cursor-pointer select-none min-w-0"
                    >
                      <button type="button" className="text-zinc-400 hover:text-emerald-600">
                        {st.completed ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </button>
                      <span
                        className={cn(
                          'text-xs truncate font-medium',
                          st.completed ? 'line-through text-zinc-400' : 'text-zinc-800'
                        )}
                      >
                        {st.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-400 hover:text-red-600 transition-opacity cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Compact Metadata Ribbon (32px height) */}
          <div className="pt-2 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {/* Priority Segmented Control */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Priorité</label>
              <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-xs font-mono" style={MONO}>
                {(['P1', 'P2', 'P3'] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer text-center',
                      priority === p ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Assigné à</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">Non assigné</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Projet</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">Aucun projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 font-mono focus:outline-none focus:border-emerald-600"
                style={MONO}
              />
            </div>
          </div>

        </div>

        {/* ── Right Column (1/3): Aperçu Live Kanban & Liaisons CRM ── */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Live Kanban Preview Card */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Aperçu Carte Kanban</span>
              <span className="text-[10.5px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold" style={MONO}>
                Live Preview
              </span>
            </div>

            {/* Realistic Preview Card */}
            <div className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/50 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border',
                    prioConf.bg,
                    prioConf.text,
                    prioConf.border
                  )}
                  style={MONO}
                >
                  {prioConf.label}
                </span>

                {linkedProject && (
                  <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]" style={MONO}>
                    {linkedProject.name}
                  </span>
                )}
              </div>

              <div className="font-semibold text-xs text-zinc-900 leading-snug">
                {title.trim() || 'Titre de la tâche…'}
              </div>

              {description.trim() && (
                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                  {description.trim()}
                </p>
              )}

              <div className="pt-1.5 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <UserAvatar
                    name={assignee?.full_name || 'Non assigné'}
                    src={assignee?.avatar_url || null}
                    size="xs"
                  />
                  <span className="text-[11px] font-medium text-zinc-700 truncate max-w-[100px]">
                    {assignee?.full_name?.split(' ')[0] || 'Libre'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10.5px] font-mono text-zinc-400" style={MONO}>
                  {subtasks.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      <CheckSquare className="w-3 h-3 text-emerald-600" />
                      <span>{subtasks.filter((s) => s.completed).length}/{subtasks.length}</span>
                    </span>
                  )}

                  {dueDate && (
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{dueDate}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Liaisons CRM / Client */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
              Liaisons CRM &amp; Contexte
            </div>

            {/* Client Link */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Client associé</span>
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">Aucun client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Link */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>Lead / Prospect associé</span>
              </label>
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full h-7 px-2 text-xs border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="">Aucun lead</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.contact_name} ({l.company_name || l.client_name || 'Prospect'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Submit Shortcut Box */}
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-mono text-[11px]" style={MONO}>Raccourci clavier :</span>
            <kbd className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-[10.5px] font-mono font-bold text-zinc-700 shadow-2xs" style={MONO}>
              ⌘ + Entrée
            </kbd>
          </div>

        </div>

      </div>

    </div>
  );
}
