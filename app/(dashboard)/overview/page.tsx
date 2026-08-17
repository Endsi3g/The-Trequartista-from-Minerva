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
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchClients, fetchLeads, fetchProjects, fetchVoiceCalls, fetchTasks } from '@/lib/services/supabase-data';
import type { Client, Lead, Project, VoiceCall, Task } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { useCurrentUser } from '@/hooks/use-current-user';

// --- Design-prototype note -----------------------------------------------
// This page is a deliberate, ISOLATED break from the rest of the app's
// design system (Playfair Display, warm cream, 5-color badge palette) --
// a Linear/Superhuman-style density pass, scoped to Overview only per an
// explicit product decision. No shared tokens (tailwind.config.js,
// globals.css, CLAUDE.md) were touched, so every other page keeps the
// current look until/unless this direction is validated and propagated
// on purpose. `MONO` bypasses the app's tailwind `font-mono` -> Inter
// alias (a known quirk, see CLAUDE.md's Typography section) to get real
// monospaced tabular figures from the already-loaded JetBrains Mono
// variable.
const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const HAIRLINE = 'border-black/[0.08]';

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

// Two-key sequences (Linear-style "G then X"), scoped to this page only --
// ignored while focus is in a text field, and cleared if the second key
// doesn't land within 800ms.
const SHORTCUTS: { keys: string; href: string }[] = [
  { keys: 'gc', href: '/clients' },
  { keys: 'gl', href: '/leads' },
  { keys: 'gp', href: '/projects' },
  { keys: 'gv', href: '/voice-agent' },
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
  const now = new Date();
  const lateProjects = projects.filter((p) => {
    const isPastDue = p.due_date && new Date(p.due_date) < now;
    return p.health === 'Needs Review' || isPastDue;
  });

  const last7dCalls = voiceCalls.filter((c) => Date.now() - new Date(c.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);
  const callMinutes = Math.round(last7dCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);

  const leadFunnelStages = STAGE_ORDER.map(({ key, label }) => ({
    label,
    count: leads.filter((l) => (l.stage || 'nouveau') === key).length,
  }));
  const maxStageCount = Math.max(...leadFunnelStages.map((s) => s.count), 1);

  const topClientsByMrr = [...activeClients]
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))
    .slice(0, 8)
    .map((c) => ({ name: c.name, mrr: c.mrr || 0 }));
  const maxClientMrr = topClientsByMrr[0]?.mrr || 1;

  const recentProjects = [...projects]
    .sort((a, b) => (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : 0))
    .slice(0, 8);

  const pendingTasks = tasks.filter((t) => t.status !== 'done').slice(0, 5);

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
      label: 'Projets en retard',
      icon: AlertTriangle,
      value: lateProjects.length,
      sublabel: lateProjects.length === 0 ? 'Tout est à jour' : 'à surveiller',
      alert: lateProjects.length > 0,
    },
    {
      key: 'calls',
      href: '/voice-agent',
      shortcut: 'G V',
      label: 'Appels IA (7j)',
      icon: PhoneCall,
      value: last7dCalls.length,
      sublabel: `${callMinutes} min au total`,
    },
  ];

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Greeting & Context bar */}
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-bold font-display text-mv-ink tracking-tight">
          {greetingText}
        </h1>
        <div className="flex items-center justify-between flex-wrap gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-mv-ink-faint capitalize">{todayDateStr}</span>
          {!loading && (
            <span className="text-[13px] text-mv-ink-faint" style={MONO}>
              {activeLeads.length} lead{activeLeads.length !== 1 ? 's' : ''} actif{activeLeads.length !== 1 ? 's' : ''}
              {' · '}
              {lateProjects.length} projet{lateProjects.length !== 1 ? 's' : ''} en retard
              {' · '}
              {last7dCalls.length} appel{last7dCalls.length !== 1 ? 's' : ''} IA (7j)
            </span>
          )}
        </div>
      </div>

      {/* Unified metric band */}
      <div className={`bg-white border ${HAIRLINE} rounded-lg overflow-hidden`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-black/[0.08]">
          {metrics.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group relative px-5 py-3.5 hover:bg-black/[0.025] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-mv-ink-faint">{m.label}</span>
                <kbd
                  className="hidden md:inline-flex opacity-0 group-hover:opacity-100 items-center gap-0.5 text-[9px] font-bold text-mv-ink-faint border border-black/10 rounded px-1 py-0.5 transition-opacity"
                  style={MONO}
                >
                  {m.shortcut}
                </kbd>
              </div>
              <div
                className={`text-[22px] font-semibold leading-tight ${m.alert ? 'text-mv-red' : 'text-mv-ink'}`}
                style={MONO}
              >
                {loading ? '—' : <AnimatedNumber value={m.value} />}
              </div>
              <div className="text-[11px] text-mv-ink-faint mt-0.5" style={MONO}>{loading ? '' : m.sublabel}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Column: Projects & MRR */}
        <div className="lg:col-span-2 space-y-5">
          {/* Dense project table */}
          <div className={`bg-white border ${HAIRLINE} rounded-lg overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${HAIRLINE}`}>
              <h2 className="text-[13px] font-semibold text-mv-ink">Projets</h2>
              <Link href="/projects" className="text-[11px] font-medium text-mv-green hover:underline flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
            ) : recentProjects.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-8 text-center">Aucun projet pour le moment.</p>
            ) : (
              <table className="w-full text-[13px] border-collapse">
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p.id} className={`border-b ${HAIRLINE} last:border-0 hover:bg-black/[0.02] transition-colors`}>
                      <td className="pl-4 pr-3 py-2.5 min-w-0 max-w-0 w-full">
                        <div className="font-medium text-mv-ink truncate">{p.name}</div>
                        <div className="text-[11px] text-mv-ink-faint truncate">{p.client_name || 'Client'}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-mv-ink-faint whitespace-nowrap hidden sm:table-cell">
                        {p.current_stage}
                      </td>
                      <td className="px-3 py-2.5 w-20 hidden md:table-cell">
                        <div className="h-1 bg-black/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.health === 'Needs Review' ? 'bg-mv-red' : 'bg-mv-green'}`}
                            style={{ width: `${p.progress_pct || 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="pl-3 pr-4 py-2.5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-mv-ink-soft">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.health === 'Needs Review' ? 'bg-mv-red' : 'bg-mv-green'}`} />
                          {p.health}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* MRR -- dense table with an inline distribution gauge per row */}
          <div className={`bg-white border ${HAIRLINE} rounded-lg overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${HAIRLINE}`}>
              <h2 className="text-[13px] font-semibold text-mv-ink">Revenu récurrent (MRR)</h2>
              <p className="text-[11px] text-mv-ink-faint mt-0.5">Top clients, en dollars canadiens</p>
            </div>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
            ) : topClientsByMrr.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-8 text-center">Aucun client actif pour le moment.</p>
            ) : (
              <table className="w-full text-[13px] border-collapse">
                <tbody>
                  {topClientsByMrr.map((c) => (
                    <tr key={c.name} className={`border-b ${HAIRLINE} last:border-0 hover:bg-black/[0.02] transition-colors`}>
                      <td className="pl-4 pr-3 py-2.5 font-medium text-mv-ink truncate max-w-[160px]">{c.name}</td>
                      <td className="px-3 py-2.5 w-full">
                        <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                          <div className="h-full bg-mv-green rounded-full" style={{ width: `${(c.mrr / maxClientMrr) * 100}%` }} />
                        </div>
                      </td>
                      <td className="pl-3 pr-4 py-2.5 text-right font-medium text-mv-ink whitespace-nowrap" style={MONO}>
                        {moneyFmt(c.mrr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Pipeline, Onboarding & Recent Tasks */}
        <div className="space-y-5">
          {/* Pipeline */}
          <div className={`bg-white border ${HAIRLINE} rounded-lg p-4`}>
            <h2 className="text-[13px] font-semibold text-mv-ink mb-0.5">Pipeline des leads</h2>
            <p className="text-[11px] text-mv-ink-faint mb-4">Répartition par étape</p>
            {loading ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Chargement…</p>
            ) : leads.length === 0 ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Aucun lead pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {leadFunnelStages.map((s, i) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-mv-ink">{s.label}</span>
                      <span className="font-medium text-mv-ink-faint" style={MONO}>{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-mv-green"
                        style={{
                          width: `${(s.count / maxStageCount) * 100}%`,
                          opacity: 0.35 + (i / (leadFunnelStages.length - 1)) * 0.65,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Onboarding Checklist */}
          <OnboardingChecklist />

          {/* Tasks / Priorités */}
          {pendingTasks.length > 0 && (
            <div className={`bg-white border ${HAIRLINE} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-mv-green" />
                  <h2 className="text-[13px] font-semibold text-mv-ink">Tâches en attente</h2>
                </div>
                <Link href="/tasks" className="text-[11px] font-medium text-mv-green hover:underline">
                  Voir tout
                </Link>
              </div>
              <ul className="space-y-2">
                {pendingTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-black/[0.04] last:border-0">
                    <span className="truncate text-mv-ink-soft hover:text-mv-ink font-medium">{t.title}</span>
                    {t.due_date && (
                      <span className="text-[10px] text-mv-ink-faint shrink-0 ml-2" style={MONO}>
                        {new Date(t.due_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PageFadeIn>
  );
}
