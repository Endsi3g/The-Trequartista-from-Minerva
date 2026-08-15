'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Target,
  Users,
  AlertTriangle,
  Plus,
  Clapperboard,
  Bell,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { fetchProjects, fetchClients, fetchLeads } from '@/lib/services/supabase-data';
import type { Project, Client, Lead } from '@/lib/types';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { PageFadeIn } from '@/components/ui/page-transition';
import { DotBarShape } from '@/components/charts/DotBarShape';

const GREEN_SHADES = ['#1E4B33', '#3d7a5a', '#6ba585', '#a8c9b8', '#c0cdc6'];

function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

interface Segment {
  label: string;
  value: number;
  color: string;
}

function MiniDistribution({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  if (total === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-mv-cream-soft">
        {visible.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
            title={`${seg.label}: ${seg.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
        {visible.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1 text-[10px] text-mv-ink-faint">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            {seg.label} {seg.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
          const first = rawName.split(/[\s._-]/)[0] || '';
          setFirstName(first.charAt(0).toUpperCase() + first.slice(1));
        }

        const [projData, clientData, leadData] = await Promise.all([
          fetchProjects(),
          fetchClients(),
          fetchLeads(),
        ]);
        setProjects(projData);
        setClients(clientData);
        setLeads(leadData);
      } catch (err) {
        console.warn('[Overview] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayDateStr = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Bon matin';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // ── Real KPIs ──────────────────────────────────────────────
  const activeClients = clients.filter((c) => c.status === 'Active');
  const totalMrr = activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0);

  const activeLeads = leads.filter((l) => l.status !== 'Gagné' && l.status !== 'Perdu');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.mrr_value || 0) + (l.one_time_value || 0), 0);

  const now = new Date();
  const lateProjects = projects.filter((p) => {
    const isPastDue = p.due_date && new Date(p.due_date) < now;
    return p.health === 'Needs Review' || isPastDue;
  });

  const clientStatusSegments: Segment[] = [
    { label: 'Actifs', value: clients.filter((c) => c.status === 'Active').length, color: '#1E4B33' },
    { label: 'Onboarding', value: clients.filter((c) => c.status === 'Onboarding').length, color: '#6ba585' },
    { label: 'En pause', value: clients.filter((c) => c.status === 'Paused').length, color: '#cdcecd' },
    { label: 'Archivés', value: clients.filter((c) => c.status === 'Archived').length, color: '#DDD9CA' },
  ];

  const leadStatusSegments: Segment[] = [
    { label: 'Nouveau', value: leads.filter((l) => l.status === 'Nouveau').length, color: '#cdcecd' },
    { label: 'Contacté', value: leads.filter((l) => l.status === 'Contacté').length, color: '#6ba585' },
    { label: 'RDV Fixé', value: leads.filter((l) => l.status === 'RDV Fixé').length, color: '#4da37e' },
    { label: 'Gagné', value: leads.filter((l) => l.status === 'Gagné').length, color: '#1E4B33' },
  ];

  const projectHealthSegments: Segment[] = [
    { label: 'Prêt', value: projects.filter((p) => p.health === 'Ready').length, color: '#1E4B33' },
    { label: 'En cours', value: projects.filter((p) => p.health === 'On Track').length, color: '#6ba585' },
    { label: 'À revoir', value: projects.filter((p) => p.health === 'Needs Review').length, color: '#cf2d56' },
  ];

  const topClientsByMrr = [...activeClients]
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))
    .slice(0, 6)
    .map((c) => ({ name: c.name, mrr: c.mrr || 0 }));

  const recentProjects = [...projects]
    .sort((a, b) => (a.due_date && b.due_date ? new Date(a.due_date).getTime() - new Date(b.due_date).getTime() : 0))
    .slice(0, 5);

  return (
    <PageFadeIn className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Greeting ── */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-mv-ink-soft capitalize">{todayDateStr}</p>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-mv-ink tracking-tight font-display">
          {getGreetingPrefix()}{firstName ? `, ${firstName}` : ''}.
        </h1>
      </div>

      {/* ── KPI row: Clients → Leads → Projets en retard ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/clients"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green/40 hover:shadow-mv-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Clients actifs</span>
            <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">{loading ? '…' : activeClients.length}</div>
          <div className="text-xs text-mv-ink-faint mt-1 font-mono tabular-nums">{loading ? '' : `${moneyFmt(totalMrr)} MRR total`}</div>
          {!loading && <MiniDistribution segments={clientStatusSegments} />}
        </Link>

        <Link
          href="/leads"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green/40 hover:shadow-mv-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Leads actifs</span>
            <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">{loading ? '…' : activeLeads.length}</div>
          <div className="text-xs text-mv-ink-faint mt-1 font-mono tabular-nums">{loading ? '' : `${moneyFmt(pipelineValue)} en pipeline`}</div>
          {!loading && <MiniDistribution segments={leadStatusSegments} />}
        </Link>

        <Link
          href="/projects"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-red/40 hover:shadow-mv-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Projets en retard</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                lateProjects.length > 0 ? 'bg-mv-red-bg text-mv-red' : 'bg-mv-cream-soft text-mv-ink-faint'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">{loading ? '…' : lateProjects.length}</div>
          <div className="text-xs text-mv-ink-faint mt-1">
            {loading ? '' : lateProjects.length === 0 ? 'Tout est à jour' : 'à surveiller'}
          </div>
          {!loading && <MiniDistribution segments={projectHealthSegments} />}
        </Link>
      </div>

      {/* ── Main 3-Column Grid ── grid items (not two independent stacked
          columns) so a left/right pair sharing a row -- like Revenu
          récurrent and Bien démarrer -- stretch to match each other's
          height instead of each column growing independently. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Row 1: Projets */}
        <div className="lg:col-span-2 self-start bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-mv-ink font-display">Projets</h2>
            <Link href="/projects" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-mv-ink-faint mb-4">Les 5 prochains projets à échéance, cliquez sur « Voir tout » pour le suivi complet.</p>

          {loading ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
          ) : recentProjects.length === 0 ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Aucun projet pour le moment.</p>
          ) : (
            <div className="divide-y divide-mv-border/60">
              {recentProjects.map((p) => (
                <div key={p.id} className="py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-mv-ink text-sm truncate">{p.name}</div>
                    <div className="text-xs text-mv-ink-faint">{p.client_name || 'Client'} · {p.current_stage}</div>
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="h-1.5 bg-mv-cream-soft rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.health === 'Needs Review' ? 'bg-mv-red' : 'bg-mv-green'}`}
                        style={{ width: `${p.progress_pct || 0}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      p.health === 'Needs Review'
                        ? 'bg-mv-red-bg text-mv-red'
                        : p.health === 'On Track'
                          ? 'bg-mv-amber-bg text-mv-amber'
                          : 'bg-mv-green-tint text-mv-green'
                    }`}
                  >
                    {p.health}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 1: Quick actions */}
        <div className="grid grid-cols-2 gap-4 self-start">
          <Link
            href="/leads/new"
            className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-mv-ink">Nouveau lead</span>
            <span className="text-[10px] text-mv-ink-faint leading-tight">Ajoute un prospect au pipeline CRM</span>
          </Link>

          <Link
            href="/clients/new"
            className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-mv-ink">Nouveau client</span>
            <span className="text-[10px] text-mv-ink-faint leading-tight">Crée une fiche client et son suivi MRR</span>
          </Link>

          <Link
            href="/content-planner"
            className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clapperboard className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-mv-ink">Planifier un reel</span>
            <span className="text-[10px] text-mv-ink-faint leading-tight">Ouvre le calendrier éditorial des contenus</span>
          </Link>

          <Link
            href="/overview/audit-logs"
            className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green hover:shadow-mv-md transition-all text-center flex flex-col items-center justify-center gap-3 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-6 h-6 stroke-[2]" />
            </div>
            <span className="text-xs font-bold text-mv-ink">Voir les alertes</span>
            <span className="text-[10px] text-mv-ink-faint leading-tight">Journal des événements récents de l'agence</span>
          </Link>
        </div>

        {/* Row 2: Revenu récurrent + Bien démarrer -- grid stretch keeps
            these two the same height since they share a row. */}
        <div className="lg:col-span-2 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm flex flex-col">
          <h2 className="text-lg font-bold text-mv-ink font-display mb-1">Revenu récurrent (MRR)</h2>
          <p className="text-xs text-mv-ink-faint mb-6">Top clients par MRR mensuel, en dollars canadiens.</p>

          {loading ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
          ) : topClientsByMrr.length === 0 ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Aucun client actif pour le moment.</p>
          ) : (
            <div className="flex-1 min-h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsByMrr} layout="vertical" barSize={26} barCategoryGap="30%" margin={{ left: 8, right: 24 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: '#717472', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [moneyFmt(Number(value)), 'MRR']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DDD9CA', fontFamily: 'var(--font-mono)' }}
                  />
                  <Bar dataKey="mrr" shape={DotBarShape}>
                    {topClientsByMrr.map((_, i) => (
                      <Cell key={i} fill={GREEN_SHADES[i % GREEN_SHADES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <OnboardingChecklist />

        {lateProjects.length > 0 && (
          <div className="lg:col-start-3 bg-mv-red-bg border border-mv-red/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-mv-red" />
              <h3 className="text-sm font-extrabold text-mv-red font-display">Projets à surveiller</h3>
            </div>
            <ul className="space-y-2">
              {lateProjects.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href="/projects" className="text-xs text-mv-ink hover:text-mv-red transition-colors flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <ArrowRight className="w-3 h-3 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
