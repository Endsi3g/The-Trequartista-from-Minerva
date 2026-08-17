'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  AlertTriangle,
  Plus,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchClients, fetchLeads, fetchProjects, fetchVoiceCalls } from '@/lib/services/supabase-data';
import type { Client, Lead, Project, VoiceCall } from '@/lib/types';
import { DotBarShape } from '@/components/charts/DotBarShape';
import { FunnelChart, type FunnelStage } from '@/components/charts/FunnelChart';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';

const STAGE_ORDER: { key: string; label: string; color: string }[] = [
  { key: 'nouveau', label: 'Nouveau', color: '#2563EB' },
  { key: 'qualification', label: 'Qualification', color: '#7c3aed' },
  { key: 'proposition', label: 'Proposition', color: '#D97706' },
  { key: 'negociation', label: 'Négociation', color: '#059669' },
  { key: 'gagne', label: 'Gagné', color: '#047857' },
];

const GREEN_SHADES = ['#059669', '#3d7a5a', '#6ba585', '#a8c9b8', '#c0cdc6'];

function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

export default function OverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const rawName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
          const first = rawName.split(/[\s._-]/)[0] || '';
          setFirstName(first.charAt(0).toUpperCase() + first.slice(1));
        }
        const [cData, lData, pData, vData] = await Promise.all([
          fetchClients(),
          fetchLeads(),
          fetchProjects(),
          fetchVoiceCalls(),
        ]);
        setClients(cData);
        setLeads(lData);
        setProjects(pData);
        setVoiceCalls(vData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayDateStr = new Date().toLocaleDateString('fr-CA', { weekday: 'long', month: 'long', day: 'numeric' });
  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Bon matin';
    if (hour >= 12 && hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

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

  const leadFunnelStages: FunnelStage[] = STAGE_ORDER.map(({ key, label, color }) => ({
    label,
    color,
    count: leads.filter((l) => (l.stage || 'nouveau') === key).length,
  }));

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

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/clients"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green/40 hover:shadow-mv-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Clients actifs</span>
            <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">
            {loading ? '…' : <AnimatedNumber value={activeClients.length} />}
          </div>
          <div className="text-xs text-mv-ink-faint mt-1 font-mono">{loading ? '' : `${moneyFmt(totalMrr)} MRR total`}</div>
        </Link>

        <Link
          href="/leads"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green/40 hover:shadow-mv-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Leads actifs</span>
            <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">
            {loading ? '…' : <AnimatedNumber value={activeLeads.length} />}
          </div>
          <div className="text-xs text-mv-ink-faint mt-1">{loading ? '' : 'en cours de qualification'}</div>
        </Link>

        <Link
          href="/projects"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-red/40 hover:shadow-mv-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Projets en retard</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${lateProjects.length > 0 ? 'bg-mv-red-bg text-mv-red' : 'bg-mv-cream-soft text-mv-ink-faint'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">
            {loading ? '…' : <AnimatedNumber value={lateProjects.length} />}
          </div>
          <div className="text-xs text-mv-ink-faint mt-1">{loading ? '' : lateProjects.length === 0 ? 'Tout est à jour' : 'à surveiller'}</div>
        </Link>

        <Link
          href="/voice-agent"
          className="bg-mv-surface border border-mv-border rounded-2xl p-5 hover:border-mv-green/40 hover:shadow-mv-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Appels IA (7j)</span>
            <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-mv-ink font-mono tabular-nums">
            {loading ? '…' : <AnimatedNumber value={last7dCalls.length} />}
          </div>
          <div className="text-xs text-mv-ink-faint mt-1 font-mono">{loading ? '' : `${callMinutes} min au total`}</div>
        </Link>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 self-start bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-mv-ink font-display">Projets</h2>
            <Link href="/projects" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-mv-ink-faint mb-4">Les 5 prochains projets à échéance.</p>

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
                      p.health === 'Needs Review' ? 'bg-mv-red-bg text-mv-red' : 'bg-mv-green-tint text-mv-green'
                    }`}
                  >
                    {p.health}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link href="/leads" className="self-start block">
          {leads.length === 0 ? (
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm h-full flex items-center justify-center">
              <p className="text-xs text-mv-ink-faint text-center">Aucun lead pour le moment.</p>
            </div>
          ) : (
            <FunnelChart
              stages={leadFunnelStages}
              title="Pipeline des leads"
              subtitle="Répartition par étape, cliquez pour voir le détail."
            />
          )}
        </Link>

        <div className="lg:col-span-2 self-start bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm flex flex-col">
          <h2 className="text-lg font-bold text-mv-ink font-display mb-1">Revenu récurrent (MRR)</h2>
          <p className="text-xs text-mv-ink-faint mb-6">Top clients par MRR mensuel, en dollars canadiens.</p>

          {loading ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Chargement…</p>
          ) : topClientsByMrr.length === 0 ? (
            <p className="text-xs text-mv-ink-faint py-8 text-center">Aucun client actif pour le moment.</p>
          ) : (
            <div className="h-56">
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
      </div>
    </PageFadeIn>
  );
}
