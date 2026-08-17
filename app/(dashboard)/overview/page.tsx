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
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchClients, fetchLeads, fetchProjects, fetchVoiceCalls, fetchTasks } from '@/lib/services/supabase-data';
import type { Client, Lead, Project, VoiceCall, Task } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useCurrentUser } from '@/hooks/use-current-user';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const HAIRLINE = 'border-mv-border';

const STAGE_ORDER: { key: string; label: string }[] = [
  { key: 'nouveau', label: 'Nouveau' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'proposition', label: 'Proposition' },
  { key: 'negociation', label: 'Négociation' },
  { key: 'gagne', label: 'Gagné' },
];

function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

function getDueDateLabel(dueDateStr: string | null) {
  if (!dueDateStr) return '—';
  const target = new Date(dueDateStr);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `J+${Math.abs(diffDays)} (retard)`;
  if (diffDays === 0) return "Aujourd'hui";
  return `J-${diffDays}`;
}

// Mini SVG Sparkline for MRR trend (80px x 24px)
function MrrSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const padding = 3;
  const innerH = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 6) + 3;
    const y = height - padding - ((val - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(' ');
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${width - 3},${height} L 3,${height} Z`;

  return (
    <div className="flex items-center gap-1.5" title="Tendance MRR (6 mois)">
      <svg width={width} height={height} className="overflow-visible" aria-label="MRR Trend Sparkline">
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparklineGrad)" />
        <polyline
          fill="none"
          stroke="#059669"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="2"
            fill="#059669"
          />
        )}
      </svg>
    </div>
  );
}

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
  const { fullName } = useCurrentUser();
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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
      {/* ── 1. Discrete Context Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-mv-ink tracking-tight">{greetingText}</span>
          <span className="text-mv-ink-mute text-xs">·</span>
          <span className="text-xs font-medium text-mv-ink-soft capitalize">{todayDateStr}</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-xs text-mv-ink-soft" style={MONO}>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-mv-surface border border-mv-border text-[11px] font-medium text-mv-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
              {activeLeads.length} lead{activeLeads.length !== 1 ? 's' : ''} actif{activeLeads.length !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-mv-surface border border-mv-border text-[11px] font-medium text-mv-ink">
              <span className={`w-1.5 h-1.5 rounded-full ${lateProjects.length > 0 ? 'bg-mv-red' : 'bg-mv-green'}`} />
              {lateProjects.length} en retard
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-mv-surface border border-mv-border text-[11px] font-medium text-mv-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
              {last7dCalls.length} appel{last7dCalls.length !== 1 ? 's' : ''} IA
            </span>
          </div>
        )}
      </div>

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

      {/* ── 3. Main Data Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column (Span 2): Projects DataTable & MRR Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Projects DataTable */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Projets en cours
                </span>
                <span className="text-[10px] text-mv-ink-faint font-mono" style={MONO}>
                  ({projects.length})
                </span>
              </div>
              <Link
                href="/projects"
                className="text-[11px] font-medium text-mv-green hover:underline flex items-center gap-1"
              >
                Voir tout <span className="text-[9.5px] font-mono text-mv-ink-faint border border-mv-border px-1 rounded bg-white" style={MONO}>G P</span>
              </Link>
            </div>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Chargement…</p>
            ) : recentProjects.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Aucun projet actif pour le moment.</p>
            ) : (
              <table className="w-full text-[12.5px] border-collapse">
                <tbody>
                  {recentProjects.map((p) => {
                    const isAlert = p.health === 'Needs Review' || (p.due_date && new Date(p.due_date) < now);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => router.push(`/projects/${p.id}/roadmap`)}
                        className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="pl-3.5 pr-2 py-1.5 min-w-0 max-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAlert ? 'bg-mv-red' : 'bg-mv-green'}`}
                            />
                            <span className="font-medium text-mv-ink truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5 text-[11.5px] text-mv-ink-soft truncate max-w-[130px] hidden sm:table-cell">
                          {p.client_name || 'Client'}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-mv-ink-faint whitespace-nowrap hidden md:table-cell">
                          {p.current_stage || 'En production'}
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-mv-ink-soft whitespace-nowrap text-right" style={MONO}>
                          {getDueDateLabel(p.due_date)}
                        </td>
                        <td className="px-2.5 py-1.5 w-24 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 bg-black/[0.06] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isAlert ? 'bg-mv-red' : 'bg-mv-green'}`}
                                style={{ width: `${p.progress_pct || 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-mv-ink-faint w-7 text-right" style={MONO}>
                              {p.progress_pct || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="pl-2 pr-3.5 py-1.5 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded-[4px] ${
                              isAlert ? 'bg-mv-red/10 text-mv-red' : 'bg-mv-green/10 text-mv-green'
                            }`}
                          >
                            {p.health === 'Needs Review' ? 'À surveiller' : 'Dans les temps'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* MRR Breakdown Table */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Revenu récurrent (MRR)
                </span>
                <p className="text-[10.5px] text-mv-ink-faint">Top clients · Part de contribution</p>
              </div>
              <div className="flex items-center gap-3">
                <MrrSparkline data={mrrTrendData} />
                <span className="text-[13px] font-semibold text-mv-ink" style={MONO}>
                  {moneyFmt(totalMrr)}
                </span>
              </div>
            </div>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Chargement…</p>
            ) : topClientsByMrr.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Aucun client actif pour le moment.</p>
            ) : (
              <table className="w-full text-[12.5px] border-collapse">
                <tbody>
                  {topClientsByMrr.map((c) => {
                    const pctOfTotal = totalMrr > 0 ? Math.round((c.mrr / totalMrr) * 100) : 0;
                    return (
                      <tr
                        key={c.name}
                        onClick={() => c.id && router.push(`/clients/${c.id}`)}
                        className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="pl-3.5 pr-2 py-1.5 font-medium text-mv-ink truncate max-w-[150px]">
                          {c.name}
                        </td>
                        <td className="px-3 py-1.5 w-full">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-mv-green rounded-full transition-all duration-300"
                                style={{ width: `${(c.mrr / maxClientMrr) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-mv-ink-faint w-8 text-right" style={MONO}>
                              {pctOfTotal}%
                            </span>
                          </div>
                        </td>
                        <td className="pl-2 pr-3.5 py-1.5 text-right font-medium text-mv-ink whitespace-nowrap text-[12.5px]" style={MONO}>
                          {moneyFmt(c.mrr)} <span className="text-[10px] text-mv-ink-faint font-normal">/ mois</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column (Span 1): Sales Pipeline Funnel & Priorities */}
        <div className="space-y-4">
          {/* Sales Pipeline Funnel */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Pipeline des leads
              </span>
              <span className="text-[11px] font-semibold text-mv-ink" style={MONO}>
                {activeLeads.length} leads
              </span>
            </div>
            <p className="text-[10.5px] text-mv-ink-faint mb-3">Répartition par étape de conversion</p>

            {loading ? (
              <p className="text-xs text-mv-ink-faint py-4 text-center">Chargement…</p>
            ) : leads.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-4 text-center">Aucun lead pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {leadFunnelStages.map((s, i) => (
                  <Link
                    key={s.key}
                    href={`/leads?stage=${s.key}`}
                    className="block group p-1.5 -mx-1.5 rounded-[4px] hover:bg-black/[0.03] transition-colors"
                  >
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="font-medium text-mv-ink group-hover:text-mv-green transition-colors">
                        {s.label}
                      </span>
                      <div className="flex items-center gap-1.5" style={MONO}>
                        <span className="text-[10.5px] text-mv-ink-faint">({s.pct}%)</span>
                        <span className="font-medium text-mv-ink text-[12px]">{s.count}</span>
                      </div>
                    </div>
                    <div className="h-1 bg-black/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-mv-green transition-all duration-300"
                        style={{
                          width: `${(s.count / maxStageCount) * 100}%`,
                          opacity: 0.4 + (i / (leadFunnelStages.length - 1)) * 0.6,
                        }}
                      />
                    </div>
                  </Link>
                ))}

                {/* Funnel Footer */}
                <div className="pt-2.5 mt-2 border-t border-mv-border flex items-center justify-between text-[11px]">
                  <span className="text-mv-ink-soft">Valeur totale estimée</span>
                  <span className="font-semibold text-mv-ink" style={MONO}>
                    {moneyFmt(totalPipelineValue || totalMrr * 3.5)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pending Tasks & Priorities */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-mv-green" />
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Tâches en attente
                </span>
              </div>
              <Link
                href="/tasks"
                className="text-[10.5px] font-medium text-mv-green hover:underline flex items-center gap-0.5"
              >
                Voir tout <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-4 text-center">Chargement…</p>
            ) : pendingTasks.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-4 text-center">Toutes les tâches sont terminées ✓</p>
            ) : (
              <ul className="space-y-1">
                {pendingTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/tasks/${t.id}`}
                      className="flex items-center justify-between text-[12px] py-1 px-1.5 -mx-1.5 rounded-[4px] hover:bg-black/[0.03] transition-colors"
                    >
                      <span className="truncate text-mv-ink-soft hover:text-mv-ink font-medium max-w-[200px]">
                        {t.title}
                      </span>
                      {t.due_date && (
                        <span className="text-[10px] text-mv-ink-faint shrink-0 ml-2" style={MONO}>
                          {new Date(t.due_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
