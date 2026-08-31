'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Target,
  AlertTriangle,
  PhoneCall,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  Calendar,
  Flame,
  Zap,
  TrendingUp,
  Building2,
  Layers,
  HelpCircle,
  Filter,
  X,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchClients, fetchLeads, fetchProjects, fetchVoiceCalls, fetchTasks } from '@/lib/services/supabase-data';
import type { Client, Lead, Project, VoiceCall, Task } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useCurrentUser } from '@/hooks/use-current-user';
import { TechDashboard } from '@/components/tech/TechDashboard';
import { ManagingOverview } from '@/components/overview/ManagingOverview';
import { ProspectionOverview } from '@/components/overview/ProspectionOverview';
import { moneyFmt } from '@/components/overview/OverviewWidgets';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const HAIRLINE = 'border-mv-border';
const WELCOME_BANNER_KEY = 'mv-overview-welcome-dismissed';
const PRIORITY_BANNER_KEY = 'mv-overview-priority-dismissed';

const STAGE_ORDER: { key: string; label: string }[] = [
  { key: 'nouveau', label: 'Nouveau' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'proposition', label: 'Proposition' },
  { key: 'negociation', label: 'Négociation' },
  { key: 'gagne', label: 'Gagné' },
];

// Two-key sequences (Linear-style "G then X")
const SHORTCUTS: { keys: string; href: string }[] = [
  { keys: 'gc', href: '/clients' },
  { keys: 'gl', href: '/leads' },
  { keys: 'gp', href: '/projects' },
  { keys: 'gv', href: '/voice-agent' },
  { keys: 'gt', href: '/tasks' },
];

function useSequenceShortcuts() {
  const router = useRouter();
  useEffect(() => {
    let buffer = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-2);
      clearTimeout(timer);
      timer = setTimeout(() => { buffer = ''; }, 800);
      const match = SHORTCUTS.find((s) => s.keys === buffer);
      if (match) {
        buffer = '';
        router.push(match.href);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(timer);
    };
  }, [router]);
}

export default function OverviewPage() {
  const router = useRouter();
  const { fullName, workspace, role } = useCurrentUser();
  const [overviewTab, setOverviewTab] = useState<'metrics' | 'hub'>('metrics');
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [showPriorityBanner, setShowPriorityBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(WELCOME_BANNER_KEY)) setShowWelcomeBanner(true);
    if (!localStorage.getItem(PRIORITY_BANNER_KEY)) setShowPriorityBanner(true);
  }, []);

  const dismissWelcomeBanner = () => {
    localStorage.setItem(WELCOME_BANNER_KEY, '1');
    setShowWelcomeBanner(false);
  };
  const dismissPriorityBanner = () => {
    localStorage.setItem(PRIORITY_BANNER_KEY, '1');
    setShowPriorityBanner(false);
  };

  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [objectives, setObjectives] = useState([
    { id: '1', label: 'Restructurer le partenariat (50/50 → commission 30%)', done: false },
    { id: '2', label: 'Créer les SOPs & Training Courses (onboarding 30 min)', done: false },
    { id: '3', label: 'Recruter 2–3 coéquipiers à la commission', done: false },
    { id: '4', label: 'Fermer 1–2 clients', done: false },
    { id: '5', label: 'Onboarder Eli (partenariat vidéo)', done: false },
    { id: '6', label: 'Lancer le test Reach + démo Flow', done: false },
  ]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('minerva_team_objectives');
      if (saved) {
        setObjectives(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const toggleObjective = (id: string) => {
    setObjectives((prev) => {
      const updated = prev.map((obj) => (obj.id === id ? { ...obj, done: !obj.done } : obj));
      try {
        localStorage.setItem('minerva_team_objectives', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  useSequenceShortcuts();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cData, lData, pData, vData, tData] = await Promise.all([
          fetchClients(),
          fetchLeads(),
          fetchProjects(),
          fetchVoiceCalls(),
          fetchTasks(),
        ]);
        setClients(cData);
        setLeads(lData);
        setProjects(pData);
        setVoiceCalls(vData);
        setTasks(tData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // All hooks above run unconditionally, on every render, regardless of
  // workspace -- this fork must come after every hook call (Rules of Hooks),
  // otherwise switching workspace away from 'tech' without a full page
  // navigation would change the number of hooks called between renders.
  if (workspace === 'tech') {
    return <TechDashboard />;
  }

  const todayDateStr = new Date().toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' });

  const hour = new Date().getHours();
  const timeGreeting = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
  const firstName = fullName ? fullName.trim().split(' ')[0] : '';
  const greetingText = firstName ? `${timeGreeting}, ${firstName} 👋` : `${timeGreeting} 👋`;

  const activeClients = clients.filter((c) => c.status === 'Active');
  const totalMrr = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0);
  const activeLeads = leads.filter((l) => l.status !== 'Gagné' && l.status !== 'Perdu');
  const totalPipelineValue = leads.reduce((acc, l) => acc + (l.mrr_value || 0) + (l.one_time_value || 0), 0);

  const now = new Date();
  const lateProjects = projects.filter((p) => {
    const isPastDue = p.due_date && new Date(p.due_date) < now;
    return p.health === 'Needs Review' || isPastDue;
  });

  const last7dCalls = voiceCalls.filter((c) => Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);
  const callMinutes = Math.round(last7dCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);

  const leadFunnelStages = STAGE_ORDER.map(({ key, label }) => {
    const stageLeads = leads.filter((l) => (l.stage || 'nouveau') === key);
    return {
      key,
      label,
      count: stageLeads.length,
      pct: leads.length > 0 ? Math.round((stageLeads.length / leads.length) * 100) : 0,
    };
  });
  const maxStageCount = Math.max(...leadFunnelStages.map((s) => s.count), 1);

  const topClientsByMrr = [...activeClients]
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))
    .slice(0, 8)
    .map((c) => ({ id: c.id, name: c.name, mrr: c.mrr || 0 }));
  const maxClientMrr = topClientsByMrr[0]?.mrr || 1;

  // Mocked 6-month historical MRR progression with current totalMrr as anchor
  const mrrTrendData = [
    Math.round(totalMrr * 0.55),
    Math.round(totalMrr * 0.68),
    Math.round(totalMrr * 0.75),
    Math.round(totalMrr * 0.82),
    Math.round(totalMrr * 0.94),
    totalMrr || 4200,
  ];

  const recentProjects = [...projects]
    .sort((a, b) => (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : 0))
    .slice(0, 8);

  const pendingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 6);

  const metrics = [
    {
      key: 'clients',
      href: '/clients',
      shortcut: 'G C',
      label: 'Clients actifs',
      icon: Users,
      value: activeClients.length,
      sublabel: `${moneyFmt(totalMrr)} MRR total`,
    },
    {
      key: 'leads',
      href: '/leads',
      shortcut: 'G L',
      label: 'Leads actifs',
      icon: Target,
      value: activeLeads.length,
      sublabel: 'en cours de qualification',
    },
    {
      key: 'projects',
      href: '/projects',
      shortcut: 'G P',
      label: 'Projets en cours',
      icon: AlertTriangle,
      value: projects.length,
      sublabel: lateProjects.length === 0 ? 'Tout est à jour' : `${lateProjects.length} à surveiller`,
      alert: lateProjects.length > 0,
    },
    {
      key: 'calls',
      href: '/voice-agent',
      shortcut: 'G V',
      label: 'Appels IA (7j)',
      icon: PhoneCall,
      value: last7dCalls.length,
      sublabel: `${callMinutes} min consommée${callMinutes > 1 ? 's' : ''}`,
    },
  ];

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* ── 0. Welcome & Orientation Banner (Notion Hub) ── */}
      {showWelcomeBanner && (
      <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-[8px] p-4 pr-9 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={dismissWelcomeBanner}
          aria-label="Fermer la bannière"
          className="absolute right-2 top-2 p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20" style={MONO}>
                Tu viens d’arriver ?
              </span>
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">5 minutes pour tout comprendre</span>
            </div>
            <p className="text-xs font-semibold text-zinc-200 truncate mt-0.5">
              Bienvenue chez Minerva — Explore la vision d’agence, nos capacités &amp; tarifs et l’onboarding 30 minutes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/company"
            className="px-3 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <Building2 className="w-3 h-3 text-zinc-300" />
            <span>Vue d’ensemble</span>
          </Link>
          <Link
            href="/academy/sop-ops-01-onboarding-30min"
            className="px-3 py-1.5 rounded-[4px] bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Onboarding 30 min</span>
          </Link>
        </div>
      </div>
      )}

      {/* ── 1. Discrete Context Bar & Tab Switcher ── */}
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-mv-ink tracking-tight">{greetingText}</span>
          <span className="text-mv-ink-mute text-xs">·</span>
          <span className="text-xs font-medium text-mv-ink-soft capitalize">{todayDateStr}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-xs font-medium">
            <button
              onClick={() => setOverviewTab('metrics')}
              className={cn(
                'px-3 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                overviewTab === 'metrics'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cockpit Métriques</span>
            </button>
            <button
              onClick={() => setOverviewTab('hub')}
              className={cn(
                'px-3 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1.5',
                overviewTab === 'hub'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Hub Opérationnel &amp; Rituels</span>
            </button>
          </div>
        </div>
      </div>

      {overviewTab === 'hub' ? (
        <div className="space-y-4">
          {/* Priorité du mois Banner */}
          {showPriorityBanner && (
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-850 to-zinc-900 border border-zinc-700/80 rounded-[8px] p-5 pr-9 text-white shadow-sm space-y-3">
            <button
              onClick={dismissPriorityBanner}
              aria-label="Fermer la bannière"
              className="absolute right-2 top-2 p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Priorité du Mois — Restructuration</span>
                </span>
                <span className="text-xs text-zinc-400 font-mono" style={MONO}>Août–Septembre</span>
              </div>
              <Link
                href="/academy/sop-ops-01-onboarding-30min"
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Consulter le guide onboarding</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed max-w-3xl">
              <strong>Objectif #1 :</strong> Finaliser les SOPs &amp; Training Courses pour garantir un <strong>onboarding en 30 minutes</strong> chrono pour tout nouveau membre d’équipe et recentrer le fondateur sur la programmation (4h+ de code/jour).
            </p>
          </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Left Col (Span 2) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Structure d'équipe */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Nouvelle Structure d’Équipe</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-zinc-50 border border-mv-border space-y-1">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-mv-green" />
                      <span>Modèle 100% Commission</span>
                    </span>
                    <p className="text-zinc-600 text-[11.5px]">Fin du 50/50 → Partenaire recentré sur la prospection (30% commission). Chacun gagne selon son travail réel.</p>
                  </div>
                  <div className="p-3 rounded bg-zinc-50 border border-mv-border space-y-1">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Rôle Fondateur</span>
                    </span>
                    <p className="text-zinc-600 text-[11.5px]">Focus programmation &amp; architecture : 4h+ de code bloquées chaque jour. La tête qui réfléchit, l’équipe qui exécute.</p>
                  </div>
                </div>
              </div>

              {/* Objectifs 3 mois */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Objectifs 3 Mois (Checklist d’Équipe)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400" style={MONO}>
                    {objectives.filter((o) => o.done).length} / {objectives.length} complétés
                  </span>
                </div>
                <div className="space-y-2">
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => toggleObjective(obj.id)}
                      className={cn(
                        'w-full text-left p-2.5 rounded-[5px] border transition-all flex items-center gap-3 cursor-pointer text-xs',
                        obj.done
                          ? 'bg-emerald-50/60 border-emerald-200 text-zinc-800'
                          : 'bg-white border-mv-border text-zinc-700 hover:bg-zinc-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors',
                          obj.done
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-zinc-300 bg-white'
                        )}
                      >
                        {obj.done && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={cn(obj.done && 'line-through opacity-80 font-medium')}>{obj.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bloquants cette semaine */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bloquants cette semaine</span>
                </h3>
                <div className="p-3 rounded bg-zinc-50 border border-mv-border text-xs text-zinc-600 flex items-center justify-between">
                  <span>Aucun bloquant actif pour le moment. Exécution fluide.</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" style={MONO}>100% OK</span>
                </div>
              </div>
            </div>

            {/* Right Col (Span 1) */}
            <div className="space-y-4">
              {/* Routine Quotidienne */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Routine Quotidienne</span>
                </h3>
                <div className="space-y-2 text-xs text-zinc-700">
                  <div className="p-2.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                    <p className="font-bold text-zinc-900">☀️ Matin (15 min)</p>
                    <p className="text-[11.5px] text-zinc-600">Ouvrir les Tâches (/tasks), mettre à jour les statuts, identifier le #1 focus et check-in d’équipe rapide.</p>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                    <p className="font-bold text-zinc-900">🌙 Fin de journée (5 min)</p>
                    <p className="text-[11.5px] text-zinc-600">Noter ce qui a avancé, flaguer les bloquants et préparer le focus du lendemain.</p>
                  </div>
                </div>
              </div>

              {/* Rituels Hebdo */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-700" />
                  <span>Rituels Hebdomadaires</span>
                </h3>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-800">Lundi</p>
                      <p className="text-[11px] text-zinc-500">Weekly planning (3 priorités)</p>
                    </div>
                    <span className="font-mono text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded" style={MONO}>30 min</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-800">Vendredi</p>
                      <p className="text-[11px] text-zinc-500">Weekly review (ce qui a shippé)</p>
                    </div>
                    <span className="font-mono text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded" style={MONO}>30 min</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-800">Dernier Vendredi</p>
                      <p className="text-[11px] text-zinc-500">Sprint review + mois suivant</p>
                    </div>
                    <span className="font-mono text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded" style={MONO}>60 min</span>
                  </div>
                </div>
              </div>

              {/* Navigation Rapide */}
              <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Navigation Rapide</h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <Link href="/projects" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-mv-green shrink-0" />
                    <span>Projets</span>
                  </Link>
                  <Link href="/tasks" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Tâches</span>
                  </Link>
                  <Link href="/leads" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>CRM Leads</span>
                  </Link>
                  <Link href="/academy" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>SOPs Agence</span>
                  </Link>
                  <Link href="/content-planner" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Content Studio</span>
                  </Link>
                  <Link href="/company" className="p-2 rounded bg-zinc-50 hover:bg-zinc-100 border border-mv-border font-medium text-zinc-700 truncate flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                    <span>Company Wiki</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. Top KPI Ribbon (Unified 64px Strip) ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.key}
                href={m.href}
                className="group relative px-4 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.025] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    {m.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 text-mv-ink-faint group-hover:text-mv-ink transition-colors" />
                    <kbd
                      className="hidden md:inline-flex opacity-0 group-hover:opacity-100 items-center text-[9px] font-mono font-medium text-mv-ink-faint border border-mv-border rounded px-1 transition-opacity bg-white"
                      style={MONO}
                    >
                      {m.shortcut}
                    </kbd>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div
                    className={`text-[20px] font-semibold tracking-tight leading-none ${m.alert ? 'text-mv-red' : 'text-mv-ink'}`}
                    style={MONO}
                  >
                    {loading ? '—' : <AnimatedNumber value={m.value} />}
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2 text-right" style={MONO}>
                    {loading ? '' : m.sublabel}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 3. Main Data Grid — priorisée selon le workspace ── */}
      {workspace === 'prospection' ? (
        <ProspectionOverview
          projects={recentProjects}
          topClientsByMrr={topClientsByMrr}
          totalMrr={totalMrr}
          maxClientMrr={maxClientMrr}
          mrrTrendData={mrrTrendData}
          leadFunnelStages={leadFunnelStages}
          activeLeadsCount={activeLeads.length}
          totalPipelineValue={totalPipelineValue}
          leadsCount={leads.length}
          maxStageCount={maxStageCount}
          pendingTasks={pendingTasks}
          loading={loading}
        />
      ) : (
        <ManagingOverview
          projects={recentProjects}
          topClientsByMrr={topClientsByMrr}
          totalMrr={totalMrr}
          maxClientMrr={maxClientMrr}
          mrrTrendData={mrrTrendData}
          leadFunnelStages={leadFunnelStages}
          activeLeadsCount={activeLeads.length}
          totalPipelineValue={totalPipelineValue}
          leadsCount={leads.length}
          maxStageCount={maxStageCount}
          pendingTasks={pendingTasks}
          loading={loading}
        />
      )}
    </>
  )}
</PageFadeIn>
  );
}
