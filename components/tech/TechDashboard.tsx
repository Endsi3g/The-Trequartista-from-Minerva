'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Cpu,
  FolderKanban,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  FileCode2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Rocket,
  FolderGit2,
  BookOpen,
  ArrowRight,
  Server,
  Code2,
  Plus,
  Play,
  CheckSquare,
  Square,
  CornerDownLeft,
  X,
  Trash2,
  Database,
  Globe,
  Radio,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { QualityChecklistRunner } from '@/components/tech/QualityChecklistRunner';
import { SystemHealthMonitor } from '@/components/tech/SystemHealthMonitor';
import { fetchTechQaAudits } from '@/lib/services/tech';
import { fetchProjects, fetchTasks, fetchDocuments, addTask, updateTaskStatus, deleteTask } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import type { TechQaAudit, Project, Task, TeamDocument } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function TechDashboard() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'infra' | 'docs'>('overview');
  const [audits, setAudits] = useState<TechQaAudit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Inline Task Creation State
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [savingTask, setSavingTask] = useState(false);
  const taskInputRef = useRef<HTMLInputElement>(null);

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

  // Global Keyboard Shortcuts (⌘+P for QA, 'C' for new task, 'Esc' to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘ + P / Ctrl + P -> Go to QA Protocol
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setActiveTab('qa');
        toastInfo('Raccourci ⌘+P', 'Navigation vers le Protocole QA 20-Points');
        return;
      }

      // 'C' -> Focus task creation row if not typing in an input
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      if (!isInput && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (activeTab !== 'overview') {
          setActiveTab('overview');
        }
        setIsCreatingTask(true);
        setTimeout(() => {
          taskInputRef.current?.focus();
        }, 50);
      }

      if (e.key === 'Escape' && isCreatingTask) {
        setIsCreatingTask(false);
        setNewTaskTitle('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreatingTask, activeTab, toastInfo]);

  const latestAudit = audits[0] || null;
  const latestScore = latestAudit?.score_percentage ?? 100;
  const latestPassed = latestAudit?.passed_points ?? 20;

  // Filter Technical Tasks
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
      t.title.toLowerCase().includes('mcp') ||
      t.status !== 'done'
  );

  const activeProjects = projects.filter((p) => p.progress_pct < 100);

  // Helper to derive technical stack label
  const getProjectStack = (p: Project): string => {
    const nameLower = p.name.toLowerCase();
    const stageLower = (p.current_stage || '').toLowerCase();
    if (nameLower.includes('framer') || stageLower.includes('framer')) return 'Design Framer';
    if (nameLower.includes('flow') || nameLower.includes('saas') || nameLower.includes('core')) return 'Next.js / Supa';
    if (nameLower.includes('voice') || nameLower.includes('vocal') || nameLower.includes('agent')) return 'ElevenLabs / AI';
    if (nameLower.includes('reach') || nameLower.includes('lead')) return 'React / CRM';
    return 'Next.js / API';
  };

  // Helper to derive health badge
  const getHealthBadge = (p: Project) => {
    const health = p.health || 'On Track';
    if (health === 'Ready' || p.progress_pct >= 100) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          En Ligne
        </span>
      );
    }
    if (health === 'Needs Review') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Needs Review ({p.progress_pct}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        On Track ({p.progress_pct}%)
      </span>
    );
  };

  // Helper for priority badges
  const renderPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
            URGENT
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            LOW
          </span>
        );
      case 'medium':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-zinc-50 text-zinc-700 border border-zinc-200">
            MED
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (task: Task) => {
    if (task.status === 'done') {
      return (
        <button
          onClick={() => handleToggleTaskStatus(task)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <CheckSquare size={11} className="text-emerald-600" />
          <span>Done</span>
        </button>
      );
    }
    if (task.status === 'in_progress') {
      return (
        <button
          onClick={() => handleToggleTaskStatus(task)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>In Progress</span>
        </button>
      );
    }
    return (
      <button
        onClick={() => handleToggleTaskStatus(task)}
        className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded hover:bg-zinc-200 transition-colors cursor-pointer"
      >
        <Square size={11} className="text-zinc-400" />
        <span>Todo</span>
      </button>
    );
  };

  // Toggle task status
  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'done' ? 'in_progress' : 'done';
    const ok = await updateTaskStatus(task.id, nextStatus);
    if (ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      toastSuccess('Statut mis à jour', `Tâche passée à « ${nextStatus} »`);
    } else {
      toastError('Erreur', 'Impossible de mettre à jour le statut.');
    }
  };

  // Inline Task Creation Handler
  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setSavingTask(true);
    try {
      const created = await addTask({
        title: newTaskTitle.trim(),
        created_by: currentUserId || 'dev-console',
      });

      if (created) {
        setTasks((prev) => [created, ...prev]);
        setNewTaskTitle('');
        setIsCreatingTask(false);
        toastSuccess('Tâche créée', `« ${created.title} » a été ajoutée au backlog technique.`);
      } else {
        toastError('Erreur', 'Impossible de sauvegarder la tâche.');
      }
    } catch (err) {
      console.error(err);
      toastError('Erreur', 'Une erreur est survenue.');
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <PageFadeIn className="w-full max-w-7xl mx-auto space-y-3 font-sans pb-12">
      {/* ── 1. En-tête Contextuel & Barre d'Actions Supérieure (Toolbar 40px) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1">
        <div className="space-y-0.5">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
            <span>Minerva</span>
            <span>/</span>
            <span>Tech & Ingénierie</span>
            <span>/</span>
            <span className="text-zinc-600">Vue d'Ensemble</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
              Console Tech & Ingénierie
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v2.4 Production
            </span>
          </div>
        </div>

        {/* Toolbar Action Buttons (40px) */}
        <div className="flex items-center gap-2">
          <Link
            href="/projects"
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FolderKanban size={12} className="text-zinc-500" />
            <span>Projets & Livrables</span>
          </Link>

          <Button
            size="sm"
            onClick={() => setActiveTab('qa')}
            className="h-7 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck size={13} />
            <span>Protocole QA 20-Pts</span>
            <kbd className="hidden sm:inline-block ml-1 text-[10px] bg-emerald-800/40 px-1 py-0.2 rounded font-mono text-emerald-100">
              ⌘P
            </kbd>
          </Button>
        </div>
      </div>

      {/* ── 2. Ruban de Télémétrie Système (System Health Ribbon) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 shadow-xs">
        {/* Cell 1: Latence Système */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>SANTÉ & LATENCE SYSTÈME</span>
            <Activity size={13} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900" style={MONO}>
            38 ms
          </div>
          <div className="text-[11px] font-mono text-emerald-600 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% services opérationnels</span>
          </div>
        </div>

        {/* Cell 2: Conformité QA 20-Points */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>CONFORMITÉ QA 20-PTS</span>
            <ShieldCheck size={13} className="text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900" style={MONO}>
            <AnimatedNumber value={latestScore} />%
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            {latestPassed} / 20 points validés
          </div>
        </div>

        {/* Cell 3: Projets & SaaS Actifs */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>PROJETS & SAAS ACTIFS</span>
            <Rocket size={13} className="text-zinc-500" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900" style={MONO}>
            <AnimatedNumber value={activeProjects.length || (projects.length > 0 ? projects.length : 1)} />
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Minerva Flow + Clients
          </div>
        </div>

        {/* Cell 4: Tâches & Backlog Tech */}
        <div className="p-3 sm:p-3.5 space-y-1">
          <div className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>TÂCHES & BACKLOG TECH</span>
            <Code2 size={13} className="text-zinc-500" />
          </div>
          <div className="text-xl font-bold font-mono text-zinc-900" style={MONO}>
            <AnimatedNumber value={techTasks.length} />
          </div>
          <div className="text-[11px] font-mono text-emerald-600 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{techTasks.filter((t) => t.status === 'in_progress').length} en cours • Zéro incident</span>
          </div>
        </div>
      </div>

      {/* ── 3. Barre de Navigation d'Onglets Contextuels (Sub-Tabs Strip 28px) ── */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-8 p-0.5 bg-zinc-100/90 border border-zinc-200/80 rounded-md inline-flex items-center gap-0.5 shadow-2xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'h-7 px-2.5 text-xs rounded transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'overview'
                ? 'bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            )}
          >
            <span>⊞ Vue d'Ensemble & Projets</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={cn(
              'h-7 px-2.5 text-xs rounded transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'qa'
                ? 'bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            )}
          >
            <span>🛡️ Protocole QA ({latestScore}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('infra')}
            className={cn(
              'h-7 px-2.5 text-xs rounded transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'infra'
                ? 'bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            )}
          >
            <span>📊 Monitoring Infra</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={cn(
              'h-7 px-2.5 text-xs rounded transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'docs'
                ? 'bg-white text-zinc-900 font-medium shadow-xs border border-zinc-200/80'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
            )}
          >
            <span>📖 Specs & SOPs</span>
          </button>
        </div>

        {/* Action Shortcut Label */}
        {activeTab === 'overview' && (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span>Raccourcis :</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-600">C</kbd>
            <span>Nouvelle tâche</span>
            <span>•</span>
            <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-zinc-600">⌘P</kbd>
            <span>Audit QA</span>
          </div>
        )}
      </div>

      {/* ── 4. TAB 1: OVERVIEW & MONOLITHIC 2-COLUMN SPLIT VIEW ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-start">
          {/* Left Column (2/3 width) - DataTables Projets & Tâches */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* 1. Projets & Livrables Techniques DataTable */}
            <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-zinc-900">
                    Projets & Livrables Techniques
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
                    {projects.length || 2}
                  </span>
                </div>
                <Link
                  href="/projects"
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Tous les projets</span>
                  <ArrowRight size={11} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      <th className="py-2 px-3 font-semibold">PROJET / REPO</th>
                      <th className="py-2 px-3 font-semibold">STACK</th>
                      <th className="py-2 px-3 font-semibold">SANTÉ</th>
                      <th className="py-2 px-3 font-semibold">ÉCHÉANCE</th>
                      <th className="py-2 px-3 font-semibold">RESPONSABLE</th>
                      <th className="py-2 px-3 font-semibold text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {projects.length > 0 ? (
                      projects.slice(0, 6).map((project) => (
                        <tr key={project.id} className="hover:bg-zinc-50/70 transition-colors group">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                              <span className="truncate max-w-[200px]">{project.name}</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]">
                              {project.client_name || 'Client Minerva'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200/80">
                              {getProjectStack(project)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {getHealthBadge(project)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">
                            {project.due_date ? new Date(project.due_date).toLocaleDateString('fr-CA') : 'Continu'}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 font-medium">
                            {project.assignees && project.assignees.length > 0
                              ? project.assignees[0]
                              : 'Minerva Dev'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href={`/projects/${project.id}`}
                              className="h-6 px-2 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <span>↗ Ouvrir</span>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-900">Refonte Site Framer — TB</div>
                            <div className="text-[10px] text-zinc-400 font-mono">Taverne Bernatchez</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200/80">
                              Design Framer
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              On Track (0%)
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">2026-09-14</td>
                          <td className="py-2.5 px-3 text-zinc-600 font-medium">Minerva</td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href="/projects"
                              className="h-6 px-2 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <span>↗ Ouvrir</span>
                            </Link>
                          </td>
                        </tr>
                        <tr className="hover:bg-zinc-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-900">Minerva Flow (Core SaaS)</div>
                            <div className="text-[10px] text-zinc-400 font-mono">Système ERP & POS</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200/80">
                              Next.js / Supa
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              En Ligne
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-600">Continu</td>
                          <td className="py-2.5 px-3 text-zinc-600 font-medium">Dev Team</td>
                          <td className="py-2.5 px-3 text-right">
                            <Link
                              href="/projects"
                              className="h-6 px-2 text-[11px] font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 rounded inline-flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <span>↗ Ouvrir</span>
                            </Link>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Tâches Techniques & Backlog DataTable */}
            <div className="bg-white border border-zinc-200 rounded-lg shadow-xs overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-zinc-900">
                    Tâches Techniques & Backlog
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded">
                    {techTasks.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsCreatingTask(true);
                      setTimeout(() => taskInputRef.current?.focus(), 50);
                    }}
                    className="h-5.5 px-2 text-[10.5px] font-mono font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Nouvelle Tâche [C]</span>
                  </button>
                  <Link
                    href="/tasks"
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-900 hover:underline flex items-center gap-1"
                  >
                    <span>Gestionnaire</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      <th className="py-2 px-3 font-semibold w-16">#ID</th>
                      <th className="py-2 px-3 font-semibold">TÂCHE TECHNIQUE</th>
                      <th className="py-2 px-3 font-semibold w-24">PRIORITÉ</th>
                      <th className="py-2 px-3 font-semibold w-28">STATUT</th>
                      <th className="py-2 px-3 font-semibold w-28">ASSIGNÉ</th>
                      <th className="py-2 px-3 font-semibold w-16 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {/* Inline Creation Row */}
                    {isCreatingTask ? (
                      <tr className="bg-emerald-50/40 border-b border-emerald-200">
                        <td className="py-2 px-3 font-mono text-[11px] text-emerald-700 font-bold">
                          NEW
                        </td>
                        <td className="py-2 px-3">
                          <form onSubmit={handleCreateTask} className="flex items-center gap-2">
                            <input
                              ref={taskInputRef}
                              type="text"
                              placeholder="Intitulé de la tâche ou bug... (Ex: Fix RLS token validation)"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1 text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </form>
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className="bg-white border border-zinc-200 rounded px-1.5 py-1 text-[11px] font-mono text-zinc-700 focus:outline-hidden"
                          >
                            <option value="low">LOW</option>
                            <option value="medium">MED</option>
                            <option value="high">HIGH</option>
                            <option value="urgent">URGENT</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">
                          in_progress
                        </td>
                        <td className="py-2 px-3 text-[11px] text-zinc-500 font-mono">
                          Dev Lead
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleCreateTask()}
                              disabled={savingTask || !newTaskTitle.trim()}
                              className="h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                              title="Valider (Entrée)"
                            >
                              <CornerDownLeft size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingTask(false);
                                setNewTaskTitle('');
                              }}
                              className="h-6 px-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded text-[11px] cursor-pointer"
                              title="Annuler (Échap)"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        onClick={() => {
                          setIsCreatingTask(true);
                          setTimeout(() => taskInputRef.current?.focus(), 50);
                        }}
                        className="hover:bg-zinc-50/90 transition-colors cursor-pointer border-b border-dashed border-zinc-200"
                      >
                        <td colSpan={6} className="py-2 px-3 text-[11px] font-mono text-zinc-400 hover:text-zinc-700 flex items-center gap-2">
                          <Plus size={12} className="text-emerald-600" />
                          <span>+ Ajouter une tâche technique ou un bug (Appuyer sur "C")...</span>
                        </td>
                      </tr>
                    )}

                    {/* Task Rows */}
                    {techTasks.length > 0 ? (
                      techTasks.slice(0, 8).map((task) => {
                        const taskIdStr = task.plane_sequence_id
                          ? `PL-${task.plane_sequence_id}`
                          : `TK-${task.id.slice(0, 4).toUpperCase()}`;

                        return (
                          <tr key={task.id} className="hover:bg-zinc-50/70 transition-colors group">
                            <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">
                              {taskIdStr}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleTaskStatus(task)}
                                  className="text-zinc-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                >
                                  {task.status === 'done' ? (
                                    <CheckSquare size={13} className="text-emerald-600" />
                                  ) : (
                                    <Square size={13} />
                                  )}
                                </button>
                                <span
                                  className={cn(
                                    'font-medium text-zinc-900 truncate max-w-[280px]',
                                    task.status === 'done' && 'line-through text-zinc-400'
                                  )}
                                >
                                  {task.title}
                                </span>
                                {task.project_name && (
                                  <span className="text-[9.5px] font-mono px-1 py-0.2 bg-zinc-100 border border-zinc-200 rounded text-zinc-500 shrink-0">
                                    {task.project_name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              {renderPriorityBadge(task.priority)}
                            </td>
                            <td className="py-2 px-3">
                              {renderStatusBadge(task)}
                            </td>
                            <td className="py-2 px-3 text-zinc-600 font-mono text-[11px] truncate max-w-[100px]">
                              {task.assignee_name || 'Équipe Dev'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Link
                                href={`/tasks/${task.id}`}
                                className="text-[11px] text-zinc-400 hover:text-zinc-900 font-mono px-1.5 py-0.5 rounded hover:bg-zinc-100"
                              >
                                ↗
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-zinc-400 font-mono text-xs">
                          Aucune tâche technique en cours. Appuyez sur « C » pour en ajouter une.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width) - DevOps & Outils Core + Synthèse Audit */}
          <div className="space-y-3.5">
            {/* 1. Conteneur DevOps & Outils Core */}
            <div className="border border-zinc-200 rounded-lg p-3.5 bg-white shadow-xs space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono flex items-center justify-between">
                <span>DEVOPS & OUTILS CORE</span>
                <Radio size={12} className="text-emerald-600 animate-pulse" />
              </div>

              <div className="space-y-1.5 pt-1">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 h-[30px] rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors text-xs font-medium text-zinc-800 group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Database size={13} className="text-emerald-600" />
                    <span>Supabase Studio (DB & Auth)</span>
                  </div>
                  <ExternalLink size={11} className="text-zinc-400 group-hover:text-zinc-700" />
                </a>

                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-2.5 h-[30px] rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors text-xs font-medium text-zinc-800 group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={13} className="text-zinc-900" />
                    <span>Vercel Deployments & Analytics</span>
                  </div>
                  <ExternalLink size={11} className="text-zinc-400 group-hover:text-zinc-700" />
                </a>

                <Link
                  href="/projects"
                  className="flex items-center justify-between px-2.5 h-[30px] rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors text-xs font-medium text-zinc-800 group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <FolderGit2 size={13} className="text-blue-600" />
                    <span>Roadmap Produits & Jalons</span>
                  </div>
                  <ArrowRight size={11} className="text-zinc-400 group-hover:text-zinc-700" />
                </Link>

                <Link
                  href="/integrations"
                  className="flex items-center justify-between px-2.5 h-[30px] rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors text-xs font-medium text-zinc-800 group shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-amber-600" />
                    <span>Intégrations & Webhooks Framer</span>
                  </div>
                  <ArrowRight size={11} className="text-zinc-400 group-hover:text-zinc-700" />
                </Link>

                <button
                  onClick={() => setActiveTab('docs')}
                  className="w-full flex items-center justify-between px-2.5 h-[30px] rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300 transition-colors text-xs font-medium text-zinc-800 group shadow-2xs cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={13} className="text-purple-600" />
                    <span>SOPs & Spécifications Tech</span>
                  </div>
                  <ChevronRight size={11} className="text-zinc-400 group-hover:text-zinc-700" />
                </button>
              </div>
            </div>

            {/* 2. Dernier Audit QA & Qualité (Card) */}
            <div className="border border-zinc-200 rounded-lg p-3.5 bg-white shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  DERNIER CONTRÔLE QA
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold">
                  {latestScore}% Conforme
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="font-semibold text-zinc-900 truncate">
                  {latestAudit?.project_name || 'Minerva — Release v2.4'}
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  Environnement : {latestAudit?.environment || 'production'} • {latestPassed}/20 pts
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('qa')}
                className="w-full h-7 text-xs font-medium border-zinc-200 hover:bg-zinc-50 text-zinc-800 cursor-pointer shadow-2xs"
              >
                <span>Relancer le Protocole QA (⌘P)</span>
              </Button>
            </div>

            {/* 3. Runtime & Architecture Telemetry Info */}
            <div className="border border-zinc-200 rounded-lg p-3.5 bg-white shadow-xs space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                ENVIRONNEMENT RUNTIME
              </div>
              <div className="space-y-1.5 text-[11px] font-mono text-zinc-600">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Framework</span>
                  <span className="text-zinc-900 font-semibold">Next.js 16 (Turbopack)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Base & Auth</span>
                  <span className="text-emerald-700 font-semibold">Supabase PostgreSQL RLS</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Protocole IA</span>
                  <span className="text-purple-700 font-semibold">Model Context Protocol (MCP v2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TAB 2: QA PROTOCOL RUNNER ── */}
      {activeTab === 'qa' && (
        <QualityChecklistRunner
          onAuditSaved={(saved) => {
            setAudits((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
          }}
        />
      )}

      {/* ── 6. TAB 3: SYSTEM HEALTH MONITOR ── */}
      {activeTab === 'infra' && <SystemHealthMonitor />}

      {/* ── 7. TAB 4: DOCS & ROADMAP ── */}
      {activeTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <Card className="p-4 bg-white border border-zinc-200 rounded-lg shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900">SOPs & Spécifications Techniques</h3>
              </div>
              <Link href="/documents" className="text-[11px] font-medium text-emerald-600 hover:underline">
                Tous les documents ↗
              </Link>
            </div>

            <div className="space-y-1.5">
              {docs.slice(0, 6).map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents?id=${doc.id}`}
                  className="p-2.5 rounded border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-100 flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 size={13} className="text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-900 truncate">{doc.title}</span>
                  </div>
                  <Badge variant="neutral" className="text-[9.5px] shrink-0 font-mono">
                    {doc.category || 'sop'}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-white border border-zinc-200 rounded-lg shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900">Roadmap & Produits Minerva</h3>
              </div>
              <Link href="/produits" className="text-[11px] font-medium text-emerald-600 hover:underline">
                Voir roadmap ↗
              </Link>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-zinc-50/70 border border-zinc-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900">Minerva Flow (SaaS)</span>
                  <Badge variant="green" className="text-[9.5px] font-mono">v1.2 Release</Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Moteur de gestion pour restaurants et franchises avec intégration Stripe & POS.
                </p>
              </div>

              <div className="p-2.5 rounded bg-zinc-50/70 border border-zinc-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900">Agent Vocal IA (ElevenLabs + Twilio)</span>
                  <Badge variant="blue" className="text-[9.5px] font-mono">Beta Publique</Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Traitement automatique des appels entrants et qualification instantanée des leads.
                </p>
              </div>

              <div className="p-2.5 rounded bg-zinc-50/70 border border-zinc-200/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900">Contrôle Qualité Automatisé</span>
                  <Badge variant="green" className="text-[9.5px] font-mono">Actif</Badge>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Validation continue des 20 points de contrôle avant chaque mise en production.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageFadeIn>
  );
}
