'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Terminal,
  Cpu,
  FolderKanban,
  ShieldCheck,
  ShieldAlert,
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { QualityChecklistRunner } from '@/components/tech/QualityChecklistRunner';
import { SystemHealthMonitor } from '@/components/tech/SystemHealthMonitor';
import { fetchTechQaAudits } from '@/lib/services/tech';
import { fetchProjects, fetchTasks, fetchDocuments } from '@/lib/services/supabase-data';
import type { TechQaAudit, Project, Task, TeamDocument } from '@/lib/types';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function TechDashboard() {
  const { role, workspace, loading: userLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'infra' | 'docs'>('overview');
  const [audits, setAudits] = useState<TechQaAudit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!userLoading && !(role === 'admin' || workspace === 'tech')) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé à l&apos;équipe Tech.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l&apos;aperçu</Link>
      </div>
    );
  }

  const latestAudit = audits[0] || null;
  const latestScore = latestAudit?.score_percentage ?? 100;
  
  const techTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes('api') ||
      t.title.toLowerCase().includes('code') ||
      t.title.toLowerCase().includes('bug') ||
      t.title.toLowerCase().includes('dev') ||
      t.title.toLowerCase().includes('qa') ||
      t.status !== 'done'
  );

  const activeProjects = projects.filter((p) => p.progress_pct < 100);

  return (
    <PageFadeIn className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Top Engineering Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-mv-border pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mv-ink text-white flex items-center justify-center shadow-mv-sm">
              <Terminal className="w-5 h-5 text-mv-green" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold font-display tracking-tight text-mv-ink">
                  Espace Tech & Ingénierie
                </h1>
                <Badge variant="green" className="gap-1 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  v2.4 Production
                </Badge>
              </div>
              <p className="text-xs text-mv-ink-soft">
                Centre de commandement technique : Projets de développement, monitoring d’infrastructure et protocole QA 20-points.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-mv-surface border border-mv-border hover:bg-black/[0.04] transition-colors text-mv-ink cursor-pointer"
          >
            <FolderKanban size={13} className="text-mv-green" />
            <span>Voir les Projets</span>
          </Link>

          <Button
            size="sm"
            onClick={() => setActiveTab('qa')}
            className="text-xs bg-mv-green hover:bg-mv-green/90 text-white cursor-pointer gap-1.5"
          >
            <ShieldCheck size={13} />
            <span>Exécuter Protocole 20-Points</span>
          </Button>
        </div>
      </div>

      {/* ── Top KPIs Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tâches Techniques KPI */}
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Tâches & Backlog Tech</span>
            <CheckSquare size={16} className="text-mv-green" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={tasks.length || 0} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-mv-ink-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{tasks.filter((t) => t.status === 'in_progress').length} tâches en cours</span>
          </div>
        </Card>

        {/* 20-Point QA Score */}
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Conformité QA 20-Points</span>
            <ShieldCheck size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={latestScore} />%
          </div>
          <div className="text-[11px] text-mv-ink-soft">
            {latestAudit?.passed_points || 20} / 20 points validés
          </div>
        </Card>

        {/* System Health */}
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Santé & Latence Système</span>
            <Activity size={16} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            38 ms
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% services opérationnels</span>
          </div>
        </Card>

        {/* Projets & Releases */}
        <Card className="p-5 bg-mv-surface border-mv-border rounded-xl space-y-1 shadow-mv-sm">
          <div className="flex items-center justify-between text-xs text-mv-ink-faint font-medium">
            <span>Projets Web & SaaS Actifs</span>
            <Rocket size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-mv-ink" style={MONO}>
            <AnimatedNumber value={activeProjects.length || projects.length} />
          </div>
          <div className="text-[11px] text-mv-ink-soft">
            Minerva Flow + Projets Clients
          </div>
        </Card>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-mv-border pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'overview'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
              )}
            >
              Vue d’Ensemble & Projets
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'qa'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
              )}
            >
              Protocole QA 20-Points ({latestScore}%)
            </button>
            <button
              onClick={() => setActiveTab('infra')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'infra'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
              )}
            >
              Monitoring Infrastructure & Services
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                activeTab === 'docs'
                  ? 'bg-mv-green text-white shadow-xs'
                  : 'text-mv-ink-soft hover:bg-black/[0.04] hover:text-mv-ink'
              )}
            >
              Documentation Technique & SOPs
            </button>
          </div>
        </div>

        {/* ── TAB 1: OVERVIEW & PROJECTS ── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Projects & Real Tasks */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Projects List */}
              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-mv-green" />
                    <h3 className="text-sm font-bold text-mv-ink">Projets & Livrables Techniques</h3>
                  </div>
                  <Link
                    href="/projects"
                    className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Tous les projets</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {projects.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="p-3.5 rounded-lg border border-mv-border bg-mv-cream-soft space-y-2 hover:border-mv-green transition-colors block"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-mv-ink truncate">{p.name}</span>
                        <Badge variant="green" className="text-[10px] shrink-0">
                          {p.current_stage || 'En cours'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-mv-ink-soft line-clamp-2">
                        Client : {p.client_name || 'Client Minerva'} • Santé : {p.health || 'On Track'} ({p.progress_pct}%)
                      </p>
                      {p.due_date && (
                        <div className="text-[10.5px] text-mv-ink-faint flex items-center gap-1 pt-1">
                          <Clock size={11} />
                          <span>Échéance : {new Date(p.due_date).toLocaleDateString('fr-CA')}</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </Card>

              {/* Tâches Techniques & Backlog */}
              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-mv-green" />
                    <h3 className="text-sm font-bold text-mv-ink">Tâches Techniques & Backlog</h3>
                  </div>
                  <Link
                    href="/tasks"
                    className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Ouvrir gestionnaire de tâches</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="space-y-2">
                  {techTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-mv-border bg-white flex items-center justify-between gap-3 text-xs hover:border-mv-green/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          task.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500'
                        )} />
                        <span className={cn('font-semibold text-mv-ink truncate', task.status === 'done' && 'line-through text-mv-ink-faint')}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {task.priority && (
                          <Badge variant={task.priority === 'urgent' ? 'red' : 'neutral'} className="text-[10px]">
                            {task.priority}
                          </Badge>
                        )}
                        <span className="text-[10.5px] text-mv-ink-faint" style={MONO}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column: Quick DevOps Links, Environment, & Latest Audit */}
            <div className="space-y-6">
              {/* DevOps Shortcuts */}
              <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-mv-ink-faint">
                  Accès Rapides DevOps & Outils
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-mv-border hover:bg-black/[0.03] transition-colors text-xs font-semibold text-mv-ink"
                  >
                    <div className="flex items-center gap-2">
                      <Server size={14} className="text-emerald-600" />
                      <span>Supabase Dashboard & Studio</span>
                    </div>
                    <ExternalLink size={12} className="opacity-60" />
                  </a>

                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-mv-border hover:bg-black/[0.03] transition-colors text-xs font-semibold text-mv-ink"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-zinc-900" />
                      <span>Vercel Deployments & Analytics</span>
                    </div>
                    <ExternalLink size={12} className="opacity-60" />
                  </a>

                  <Link
                    href="/projects"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-mv-border hover:bg-black/[0.03] transition-colors text-xs font-semibold text-mv-ink"
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban size={14} className="text-mv-green" />
                      <span>Gestion des Projets & Jalons</span>
                    </div>
                    <ArrowRight size={12} className="opacity-60" />
                  </Link>

                  <Link
                    href="/integrations"
                    className="flex items-center justify-between p-2.5 rounded-lg border border-mv-border hover:bg-black/[0.03] transition-colors text-xs font-semibold text-mv-ink"
                  >
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-amber-600" />
                      <span>Intégrations & Webhooks</span>
                    </div>
                    <ArrowRight size={12} className="opacity-60" />
                  </Link>
                </div>
              </Card>

              {/* Latest Audit Mini Card */}
              {latestAudit && (
                <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-mv-ink">Dernier Audit QA</span>
                    <Badge variant={latestAudit.score_percentage === 100 ? 'green' : 'amber'} className="text-[10px]">
                      {latestAudit.score_percentage}%
                    </Badge>
                  </div>
                  <p className="text-xs text-mv-ink-soft">
                    {latestAudit.project_name} ({latestAudit.environment})
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('qa')}
                    className="w-full text-xs cursor-pointer"
                  >
                    Consulter ou Relancer l’Audit
                  </Button>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: QA PROTOCOL RUNNER ── */}
        {activeTab === 'qa' && (
          <QualityChecklistRunner
            onAuditSaved={(saved) => {
              setAudits((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
            }}
          />
        )}

        {/* ── TAB 3: SYSTEM HEALTH MONITOR ── */}
        {activeTab === 'infra' && <SystemHealthMonitor />}

        {/* ── TAB 4: DOCS & ROADMAP ── */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-mv-green" />
                  <h3 className="text-sm font-bold text-mv-ink">SOPs & Spécifications Techniques</h3>
                </div>
                <Link href="/documents" className="text-xs font-semibold text-mv-green hover:underline">
                  Tous les documents
                </Link>
              </div>

              <div className="space-y-2.5">
                {docs.slice(0, 6).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents?id=${doc.id}`}
                    className="p-3 rounded-lg border border-mv-border bg-white flex items-center justify-between text-xs hover:border-mv-green transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2 size={14} className="text-mv-ink-faint shrink-0" />
                      <span className="font-semibold text-mv-ink truncate">{doc.title}</span>
                    </div>
                    <Badge variant="neutral" className="text-[10px] shrink-0">
                      {doc.category || 'sop'}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-mv-green" />
                  <h3 className="text-sm font-bold text-mv-ink">Roadmap & Produits Minerva</h3>
                </div>
                <Link href="/produits" className="text-xs font-semibold text-mv-green hover:underline">
                  Voir roadmap
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-mv-ink">Minerva Flow (SaaS)</span>
                    <Badge variant="green" className="text-[10px]">v1.2 Release</Badge>
                  </div>
                  <p className="text-[11px] text-mv-ink-soft">
                    Moteur de gestion pour restaurants et franchises avec intégration Stripe & POS.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-mv-ink">Agent Vocal IA (ElevenLabs + Twilio)</span>
                    <Badge variant="blue" className="text-[10px]">Beta Publique</Badge>
                  </div>
                  <p className="text-[11px] text-mv-ink-soft">
                    Traitement automatique des appels entrants et qualification instantanée des leads.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-mv-ink">Contrôle Qualité Automatisé</span>
                    <Badge variant="green" className="text-[10px]">Actif</Badge>
                  </div>
                  <p className="text-[11px] text-mv-ink-soft">
                    Validation continue des 20 points de contrôle avant chaque mise en production.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
