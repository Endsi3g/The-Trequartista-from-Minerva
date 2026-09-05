'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  BookOpen,
  ArrowRight,
  Flame,
  Code2,
  Plus,
  CheckSquare,
  Square,
  CornerDownLeft,
  X,
  Database,
  Globe,
  Radio,
  RadioTower,
  Cpu,
  Server,
  FileCode2,
  ExternalLink,
  ShieldAlert,
  Terminal,
  Eye,
  Send,
  Loader2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { QualityChecklistRunner } from '@/components/tech/QualityChecklistRunner';
import { SystemHealthMonitor } from '@/components/tech/SystemHealthMonitor';
import { EdgeFunctionConsole } from '@/components/tech/EdgeFunctionConsole';
import { fetchTechQaAudits } from '@/lib/services/tech';
import { fetchProjects, fetchTasks, fetchDocuments, addTask, updateTaskStatus } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { TechQaAudit, Project, Task, TeamDocument } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface TechIncident {
  id: string;
  title: string;
  severity: 'P1 Critique' | 'P2 Majeur' | 'P3 Mineur';
  service: string;
  description: string;
  reportedAt: string;
  status: 'active' | 'resolved';
}

const DEFAULT_INCIDENTS: TechIncident[] = [];

const TECH_SOPS_SHORTCUTS = [
  {
    id: 'sop-08',
    code: 'SOP-08',
    title: 'Gestion d\'un incident de production',
    duration: '5 min',
    target: '/academy',
    category: 'Infra & Securité',
  },
  {
    id: 'sop-02',
    code: 'SOP-02',
    title: 'Déploiement Vercel & Migrations Supabase',
    duration: '8 min',
    target: '/academy',
    category: 'CI/CD & Release',
  },
  {
    id: 'sop-15',
    code: 'SOP-15',
    title: 'Audit Sécurité, Tokens & RLS PostgreSQL',
    duration: '6 min',
    target: '/academy',
    category: 'Architecture DB',
  },
];

const RECENT_CHANGELOG_ENTRIES = [
  { version: 'v2.30.9', title: 'Edge Console & Télémétrie Latence', date: '4 sept. 2026' },
  { version: 'v2.30.8', title: 'WebGL Auth Shaders & Mintlify Geometry (0 pilules)', date: '4 sept. 2026' },
  { version: 'v2.30.7', title: 'Audit Design System & Tokens Mintlify', date: '3 sept. 2026' },
];

export function TechDashboard() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { role, workspace, loading: userLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'infra' | 'docs'>(
    initialTab === 'qa' || initialTab === 'infra' || initialTab === 'docs'
      ? initialTab
      : 'overview'
  );

  const [expandQaOnOpen, setExpandQaOnOpen] = useState(false);
  const [audits, setAudits] = useState<TechQaAudit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Incidents dual-state management
  const [incidents, setIncidents] = useState<TechIncident[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('minerva_tech_incidents');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return DEFAULT_INCIDENTS;
  });

  const [isDeclareIncidentOpen, setIsDeclareIncidentOpen] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'P1 Critique' | 'P2 Majeur' | 'P3 Mineur'>('P2 Majeur');
  const [incidentService, setIncidentService] = useState('Supabase PostgreSQL');
  const [broadcastToChat, setBroadcastToChat] = useState(true);

  // Inline Task Creation State
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [savingTask, setSavingTask] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const isObserverMode = role === 'member' && workspace !== 'tech';

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const [auditsRes, projRes, tasksRes, docsRes] = await Promise.all([
        fetchTechQaAudits(),
        fetchProjects(),
        fetchTasks(),
        fetchDocuments(),
      ]);
      setAudits(auditsRes);
      setProjects(projRes);
      setTasks(tasksRes);
      setDocs(docsRes);
    } catch (err) {
      console.error('[TechDashboard] Erreur chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save incidents to localStorage
  const saveIncidents = (updated: TechIncident[]) => {
    setIncidents(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('minerva_tech_incidents', JSON.stringify(updated));
      } catch {}
    }
  };

  // Keyboard Shortcuts (A or ⌘+P for QA, C for Task, W for Workspace notice)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      // 'A' or ⌘+P -> Launch Release QA Audit
      if (!isInput && (e.key === 'a' || e.key === 'A') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setExpandQaOnOpen(true);
        setActiveTab('qa');
        toastInfo('Audit QA Activé', 'Vérification complète des 20 points prête.');
        return;
      }

      // 'C' -> Focus task creation row
      if (!isInput && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (activeTab !== 'overview') {
          setActiveTab('overview');
        }
        setIsCreatingTask(true);
        setTimeout(() => {
          taskInputRef.current?.focus();
        }, 60);
        return;
      }

      if (e.key === 'Escape') {
        if (isCreatingTask) {
          setIsCreatingTask(false);
          setNewTaskTitle('');
        }
        if (isDeclareIncidentOpen) {
          setIsDeclareIncidentOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingTask, isDeclareIncidentOpen, activeTab, toastInfo]);

  const latestAudit = audits[0] || null;
  const latestScore = latestAudit?.score_percentage ?? 100;
  const latestPassed = latestAudit?.passed_points ?? 20;

  // Filter top 5 priority or blocking technical tasks
  const techTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes('api') ||
      t.title.toLowerCase().includes('code') ||
      t.title.toLowerCase().includes('bug') ||
      t.title.toLowerCase().includes('dev') ||
      t.title.toLowerCase().includes('qa') ||
      t.title.toLowerCase().includes('supabase') ||
      t.title.toLowerCase().includes('auth') ||
      t.title.toLowerCase().includes('infra') ||
      t.status !== 'done'
  );

  const topPriorityTasks = [...techTasks]
    .sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const pA = pOrder[a.priority as keyof typeof pOrder] ?? 2;
      const pB = pOrder[b.priority as keyof typeof pOrder] ?? 2;
      if (pA !== pB) return pA - pB;
      return (a.status === 'in_progress' ? 0 : 1) - (b.status === 'in_progress' ? 0 : 1);
    })
    .slice(0, 5);

  const activeIncidents = incidents.filter((i) => i.status === 'active');

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'done' ? 'in_progress' : 'done';
    const ok = await updateTaskStatus(task.id, nextStatus);
    if (ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      toastSuccess('Statut mis à jour', `Tâche marquée « ${nextStatus} »`);
    } else {
      toastError('Erreur', 'Impossible de mettre à jour la tâche.');
    }
  };

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSavingTask(true);
    try {
      const created = await addTask({
        title: newTaskTitle.trim(),
        created_by: currentUserId || 'lead-tech',
      });

      if (created) {
        setTasks((prev) => [created, ...prev]);
        setNewTaskTitle('');
        setIsCreatingTask(false);
        toastSuccess('Tâche créée', `« ${created.title} » ajoutée aux priorités.`);
      } else {
        toastError('Erreur', 'Impossible de créer la tâche.');
      }
    } catch (err) {
      console.error(err);
      toastError('Erreur', 'Une erreur est survenue.');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeclareIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentTitle.trim()) return;

    const newInc: TechIncident = {
      id: `inc-${Date.now()}`,
      title: incidentTitle.trim(),
      severity: incidentSeverity,
      service: incidentService,
      description: `Incident signalé sur ${incidentService}. Prise en charge en cours.`,
      reportedAt: new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
      status: 'active',
    };

    const updated = [newInc, ...incidents];
    saveIncidents(updated);
    setIsDeclareIncidentOpen(false);
    setIncidentTitle('');

    // Optional announcement to #annonces
    if (broadcastToChat) {
      try {
        const supabase = createClient();
        await supabase.from('team_chat_messages').insert({
          channel_type: 'thematic',
          thematic_channel: 'annonces',
          sender_id: currentUserId,
          sender_name: 'Minerva Sentinel (Tech)',
          content: `🚨 **Incident Technique Déclaré [${incidentSeverity}]** : ${newInc.title} sur ${incidentService}. L'équipe tech investigue.`,
        });
      } catch {}
    }

    toastError('Incident déclaré', `Alerte ${incidentSeverity} enregistrée.`);
  };

  const handleResolveIncident = async (id: string, title: string) => {
    const updated = incidents.map((i) => (i.id === id ? { ...i, status: 'resolved' as const } : i));
    saveIncidents(updated);

    try {
      const supabase = createClient();
      await supabase.from('team_chat_messages').insert({
        channel_type: 'thematic',
        thematic_channel: 'annonces',
        sender_id: currentUserId,
        sender_name: 'Minerva Sentinel (Tech)',
        content: `✅ **Incident Résolu** : « ${title} » a été corrigé et validé par l'équipe Tech. Tous les services sont opérationnels.`,
      });
    } catch {}

    toastSuccess('Incident résolu', 'Le statut a été mis à jour et diffusé dans #annonces.');
  };

  return (
    <PageFadeIn className="w-full max-w-7xl mx-auto space-y-4 font-sans pb-12">
      {/* ── Mode Observateur Bienveillant (Question 42) ── */}
      {isObserverMode && (
        <div className="bg-white border border-[#f2f2f2] rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-zinc-600">
            <Eye size={14} className="text-zinc-400 shrink-0" />
            <span>
              <strong>Mode Observateur Tech</strong> — Vous consultez la console technique en lecture seule pour favoriser l'entraide d'équipe.
            </span>
          </div>
          <Link
            href="/overview"
            className="text-xs font-medium text-[#0c8c5e] hover:underline shrink-0"
          >
            Retour à mon espace ↗
          </Link>
        </div>
      )}

      {/* ── 1. En-tête Contextuel & Barre d'Actions Supérieure (Toolbar Mintlify) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div className="space-y-0.5">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#08090a] font-medium">Tech & Ingénierie</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#08090a] tracking-tight">
              Tech Cockpit
            </h1>
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium"
              style={MONO}
            >
              <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
              v2.30.9
            </span>
          </div>
        </div>

        {/* Action Header Mintlify : Ink Black #08090a (4px radius) + Action Secondaire */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDeclareIncidentOpen(true)}
            className="h-8 px-3 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle size={13} className="text-amber-600" />
            <span>Signaler un incident</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExpandQaOnOpen(true);
              setActiveTab('qa');
            }}
            className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck size={14} className="text-white" />
            <span>Lancer l'audit de release</span>
            <kbd className="hidden sm:inline-block text-[9.5px] bg-zinc-700 text-zinc-200 px-1 py-0.2 rounded font-mono ml-0.5">
              A
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Modal Déclaration Rapide d'Incident ── */}
      {isDeclareIncidentOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <AlertTriangle size={14} />
                </div>
                <h3 className="text-sm font-semibold text-[#08090a]">Déclarer un Incident Technique</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeclareIncidentOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleDeclareIncident} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Intitulé du problème
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Latence anormale sur le webhook de paiement Stripe"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Sévérité
                  </label>
                  <select
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value as any)}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                  >
                    <option value="P1 Critique">P1 Critique (Blocage total)</option>
                    <option value="P2 Majeur">P2 Majeur (Service dégradé)</option>
                    <option value="P3 Mineur">P3 Mineur (Anomalie cosmétique)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Service impacté
                  </label>
                  <select
                    value={incidentService}
                    onChange={(e) => setIncidentService(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                  >
                    <option value="Supabase PostgreSQL & Auth">Supabase DB & Auth</option>
                    <option value="Supabase Edge Functions">Edge Functions</option>
                    <option value="Vercel Infrastructure">Vercel SSR / Edge</option>
                    <option value="ElevenLabs AI Voice">ElevenLabs Voice</option>
                    <option value="Stripe / Webhooks">Stripe Webhooks</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="broadcastChat"
                  checked={broadcastToChat}
                  onChange={(e) => setBroadcastToChat(e.target.checked)}
                  className="rounded text-[#0c8c5e] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="broadcastChat" className="text-xs text-zinc-600 cursor-pointer">
                  Diffuser l'alerte à l'équipe dans <strong>#annonces</strong>
                </label>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeclareIncidentOpen(false)}
                  className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Enregistrer l'incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 3. Navigation d'Onglets Contextuels (4 Tabs Mintlify) ── */}
      <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'overview'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <span>⊞ Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qa')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'qa'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <ShieldCheck size={13} className={cn(activeTab === 'qa' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Assurance Qualité (QA)</span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              ({latestScore}%)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('infra')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'infra'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <Activity size={13} className={cn(activeTab === 'infra' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Infrastructure & Edge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'docs'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <BookOpen size={13} className={cn(activeTab === 'docs' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>SOPs & Architecture</span>
          </button>

          <Link
            href="/overview?tab=momentum"
            className="h-8 px-3 text-xs rounded font-medium text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Flame size={13} className="text-amber-500" />
            <span>⚡ Momentum & Live</span>
          </Link>
        </div>

        <Link
          href="/changelog"
          className="text-xs font-mono text-zinc-500 hover:text-[#08090a] flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
          style={MONO}
        >
          <span>Changelog</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      {/* ── 4. ONGLET 1 : COCKPIT TECH (LES 3 PILIERS MAJEURS) ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* ── PILIER 1 : BARRE UNIFIÉE DE SANTÉ DES SERVICES (Question 5) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0">
                <Activity size={15} className="text-[#0c8c5e]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-[#08090a]">
                    Système Opérationnel
                  </h2>
                  <span
                    className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-1"
                    style={MONO}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                    100% services actifs
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Latence moyenne de production : <strong className="font-mono text-[#08090a]">38 ms</strong> • Zéro rupture détectée
                </p>
              </div>
            </div>

            {/* Pastilles cliquables vers les services (Infra tab) */}
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono" style={MONO}>
              <button
                type="button"
                onClick={() => setActiveTab('infra')}
                className="px-2 py-1 rounded border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50 hover:bg-white text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                <span>Supabase DB</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('infra')}
                className="px-2 py-1 rounded border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50 hover:bg-white text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                <span>Edge Functions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('infra')}
                className="px-2 py-1 rounded border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50 hover:bg-white text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                <span>Vercel Edge</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('infra')}
                className="px-2 py-1 rounded border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50 hover:bg-white text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                <span>AI Voice Engine</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('infra')}
                className="text-xs text-[#0c8c5e] hover:underline flex items-center gap-0.5 ml-1 font-sans"
              >
                <span>Détail</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>

          {/* ── GRILLE CENTRALE : PILIER 2 & PILIER 3 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── PILIER 2 : CARTE DUAL-STATE INCIDENTS & BLOQUANTS (Question 8) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-zinc-50 border border-[#f2f2f2] flex items-center justify-center">
                      <AlertTriangle size={14} className={activeIncidents.length > 0 ? 'text-red-600' : 'text-zinc-500'} />
                    </div>
                    <span className="text-xs font-semibold text-[#08090a]">
                      Incidents & Bloquants Actifs
                    </span>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded border font-medium',
                      activeIncidents.length === 0
                        ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                        : 'text-red-700 bg-red-50 border-red-200'
                    )}
                    style={MONO}
                  >
                    {activeIncidents.length === 0 ? '0 incident actif' : `${activeIncidents.length} bloquant(s)`}
                  </span>
                </div>

                {/* Contenu de la carte d'incidents (Double État) */}
                {activeIncidents.length === 0 ? (
                  /* ÉTAT NORMAL ZEN (Rassurant & Épuré) */
                  <div className="py-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center mx-auto text-[#0c8c5e]">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[#08090a]">
                        Aucun incident actif • 100% opérationnel
                      </p>
                      <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                        Toutes les sondes de base de données, edge functions et authentification répondent dans les seuils nominaux.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ÉTAT ALERTE (Liste des incidents avec action de résolution) */
                  <div className="space-y-2.5 pt-3">
                    {activeIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3 rounded-xl border border-red-200 bg-red-50/50 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-red-900">{inc.title}</span>
                          <span className="text-[9.5px] font-mono text-red-700 bg-red-100 px-1.5 py-0.2 rounded font-bold" style={MONO}>
                            {inc.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-red-700 leading-relaxed">
                          {inc.description}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500">
                          <span className="font-mono" style={MONO}>Signalé à {inc.reportedAt} sur {inc.service}</span>
                          <button
                            type="button"
                            onClick={() => handleResolveIncident(inc.id, inc.title)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            Résoudre l'incident
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                  Protocole d'escalade : P1 &lt; 15 min • P2 &lt; 2h
                </span>
                <button
                  type="button"
                  onClick={() => setIsDeclareIncidentOpen(true)}
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline"
                >
                  + Déclarer un blocage
                </button>
              </div>
            </div>

            {/* ── PILIER 3 : CARTE PIPELINE & DÉPLOIEMENTS (Question 9) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-zinc-50 border border-[#f2f2f2] flex items-center justify-center">
                      <Rocket size={14} className="text-zinc-700" />
                    </div>
                    <span className="text-xs font-semibold text-[#08090a]">
                      Pipeline & Déploiements Actifs
                    </span>
                  </div>

                  <span
                    className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium inline-flex items-center gap-1"
                    style={MONO}
                  >
                    <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
                    Vercel Production
                  </span>
                </div>

                <div className="space-y-3 pt-3">
                  {/* Version active et hash git */}
                  <div className="p-3 bg-zinc-50 border border-[#f2f2f2] rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
                        RELEASE ACTIVE
                      </div>
                      <div className="font-semibold text-[#08090a] font-mono mt-0.5" style={MONO}>
                        v2.30.9 (commit dc197b2)
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 bg-white border border-[#f2f2f2] px-2 py-0.5 rounded" style={MONO}>
                      branch: main
                    </span>
                  </div>

                  {/* 3 dernières entrées changelog */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
                      Dernières Notes de Version
                    </div>
                    {RECENT_CHANGELOG_ENTRIES.map((entry) => (
                      <div
                        key={entry.version}
                        className="flex items-center justify-between text-xs py-1 border-b border-[#f2f2f2] last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-semibold text-[#08090a] text-[11px]" style={MONO}>
                            {entry.version}
                          </span>
                          <span className="text-zinc-600 truncate text-[11px]">
                            {entry.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0 ml-2" style={MONO}>
                          {entry.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Build statique & SSR : 127 routes compilées
                </span>
                <Link
                  href="/changelog"
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
                >
                  <span>Changelog complet</span>
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── TÂCHES PRIORITAIRES TECHNIQUES (SYNTHÈSE TOP 5 - Question 4) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#f2f2f2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={15} className="text-[#0c8c5e]" />
                <span className="text-xs font-semibold text-[#08090a]">
                  Tâches Techniques Prioritaires & Bloquantes
                </span>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-[#f2f2f2] px-1.5 py-0.2 rounded" style={MONO}>
                  Top 5 ({techTasks.length} total)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTask(true);
                    setTimeout(() => taskInputRef.current?.focus(), 50);
                  }}
                  className="h-6 px-2 text-[10.5px] font-mono font-medium text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#ecfdf5]/80 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                  style={MONO}
                >
                  <Plus size={11} />
                  <span>Ajouter [C]</span>
                </button>
                <Link
                  href="/tasks"
                  className="text-[11px] font-medium text-zinc-500 hover:text-[#08090a] hover:underline flex items-center gap-1 ml-1"
                >
                  <span>Voir toutes les tâches</span>
                  <ArrowRight size={11} />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#f2f2f2] bg-zinc-50/50 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <th className="py-2 px-3.5 font-semibold w-12 text-center">STATUT</th>
                    <th className="py-2 px-3 font-semibold">INTITULÉ DE LA TÂCHE</th>
                    <th className="py-2 px-3 font-semibold w-24">PRIORITÉ</th>
                    <th className="py-2 px-3 font-semibold w-28">RESPONSABLE</th>
                    <th className="py-2 px-3 font-semibold w-16 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {/* Row de création rapide */}
                  {isCreatingTask && (
                    <tr className="bg-[#ecfdf5]/30 border-b border-[#a7f3d0]">
                      <td className="py-2 px-3.5 text-center font-mono text-[10px] text-[#0c8c5e] font-bold" style={MONO}>
                        NEW
                      </td>
                      <td className="py-2 px-3" colSpan={2}>
                        <form onSubmit={handleCreateTask} className="flex items-center gap-2">
                          <input
                            ref={taskInputRef}
                            type="text"
                            placeholder="Nouvelle tâche technique ou correctif (Appuyer sur Entrée)..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full bg-white border border-[#a7f3d0] rounded px-2.5 py-1 text-xs text-[#08090a] focus:outline-hidden"
                          />
                        </form>
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-zinc-500" style={MONO}>
                        Lead Tech
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleCreateTask()}
                            disabled={savingTask || !newTaskTitle.trim()}
                            className="h-6 px-2 bg-[#08090a] hover:bg-zinc-800 text-white rounded text-[10px] font-medium cursor-pointer"
                          >
                            <CornerDownLeft size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingTask(false);
                              setNewTaskTitle('');
                            }}
                            className="h-6 px-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-[10px] cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {topPriorityTasks.length > 0 ? (
                    topPriorityTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className="text-zinc-400 hover:text-[#0c8c5e] transition-colors cursor-pointer inline-flex items-center justify-center"
                          >
                            {task.status === 'done' ? (
                              <CheckSquare size={14} className="text-[#0c8c5e]" />
                            ) : (
                              <Square size={14} className="text-zinc-400 hover:text-zinc-700" />
                            )}
                          </button>
                        </td>

                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'font-medium text-[#08090a]',
                              task.status === 'done' && 'line-through text-zinc-400 font-normal'
                            )}
                          >
                            {task.title}
                          </span>
                        </td>

                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase font-medium',
                              task.priority === 'urgent'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : task.priority === 'high'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-zinc-100 text-zinc-600 border border-[#f2f2f2]'
                            )}
                            style={MONO}
                          >
                            {task.priority || 'medium'}
                          </span>
                        </td>

                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-500" style={MONO}>
                          {task.assignee_name || 'Équipe Tech'}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="text-[11px] text-zinc-400 hover:text-[#08090a] font-mono px-1.5 py-0.5 rounded hover:bg-zinc-100"
                            style={MONO}
                          >
                            ↗
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-zinc-400 font-mono" style={MONO}>
                        Aucune tâche prioritaire en attente. Appuyez sur « C » pour en créer une.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── SOPS & PROCÉDURES TECHNIQUES RAPIDES (Question 48) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#0c8c5e]" />
                <span className="text-xs font-semibold text-[#08090a]">
                  Procédures Opérationnelles Clés (Academy SOPs)
                </span>
              </div>
              <Link
                href="/academy"
                className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
              >
                <span>Accéder à l'Academy</span>
                <ArrowRight size={10} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TECH_SOPS_SHORTCUTS.map((sop) => (
                <Link
                  key={sop.id}
                  href={sop.target}
                  className="p-3 rounded-xl border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50/40 hover:bg-white transition-colors group space-y-1 block"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400" style={MONO}>
                    <span className="text-[#0c8c5e] font-semibold">{sop.code}</span>
                    <span>Lecture {sop.duration}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-[#08090a] group-hover:text-[#0c8c5e] transition-colors line-clamp-1">
                    {sop.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    {sop.category}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ONGLET 2 : PROTOCOLE QA (20 POINTS) ── */}
      {activeTab === 'qa' && (
        <QualityChecklistRunner
          initialExpandAll={expandQaOnOpen}
          onAuditSaved={(saved) => {
            setAudits((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
          }}
        />
      )}

      {/* ── 6. ONGLET 3 : INFRASTRUCTURE & EDGE FUNCTIONS (Consolidé - Q6) ── */}
      {activeTab === 'infra' && (
        <div className="space-y-6">
          <SystemHealthMonitor />
          <div className="pt-4 border-t border-[#f2f2f2]">
            <EdgeFunctionConsole />
          </div>
        </div>
      )}

      {/* ── 7. ONGLET 4 : SOPS & ARCHITECTURE ── */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-[#f2f2f2] rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0c8c5e]" />
                <h3 className="text-xs font-semibold text-[#08090a]">
                  Documentation Technique & Architecture
                </h3>
              </div>
              <Link href="/documents" className="text-[11px] font-medium text-[#0c8c5e] hover:underline">
                Tous les documents ↗
              </Link>
            </div>

            <div className="space-y-2">
              {docs.slice(0, 6).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents?id=${doc.id}`}
                  className="p-3 rounded-xl border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50/40 hover:bg-white flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode2 size={14} className="text-zinc-400 shrink-0" />
                    <span className="font-semibold text-[#08090a] truncate">{doc.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 bg-white border border-[#f2f2f2] px-1.5 py-0.5 rounded" style={MONO}>
                    {doc.category || 'sop'}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-5 bg-white border border-[#f2f2f2] rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#0c8c5e]" />
                <h3 className="text-xs font-semibold text-[#08090a]">
                  Écosystème Produits & Applications
                </h3>
              </div>
              <Link href="/projects" className="text-[11px] font-medium text-[#0c8c5e] hover:underline">
                Roadmaps ↗
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50/50 border border-[#f2f2f2] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#08090a]">Minerva Flow (SaaS Client)</span>
                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded" style={MONO}>
                    Production
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Plateforme de commande en ligne et QR code pour restaurateurs. Stack : Next.js 16 + Supabase + Stripe.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/50 border border-[#f2f2f2] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#08090a]">Minerva Reach (Desktop / Mobile)</span>
                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded" style={MONO}>
                    En Ligne
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Application de routine quotidienne et de qualification de leads terrain. URL : minerva-os-lite-desktop.vercel.app.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50/50 border border-[#f2f2f2] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#08090a]">Agent Vocal IA</span>
                  <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-[#f2f2f2] px-1.5 py-0.2 rounded" style={MONO}>
                    Beta Active
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Synthèse neuronale ElevenLabs et qualification instantanée d'appels entrants et sortants.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
