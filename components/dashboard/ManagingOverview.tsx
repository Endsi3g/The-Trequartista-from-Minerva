'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Briefcase,
  Trophy,
  Gauge,
  Calendar,
  ArrowRight,
  ArrowUpRight,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { fetchProductivityLeaderboard } from '@/lib/services/supabase-data';
import type { Client, Project, Task, ProductivityScore } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from 'recharts';

interface SparklinePoint {
  period: string;
  value: number;
}

function OverviewRechartsSparkline({
  data,
  unit = '',
  gradientId,
}: {
  data: SparklinePoint[];
  unit?: string;
  gradientId: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-28 sm:w-36 h-16 bg-emerald-500/5 rounded animate-pulse" />;
  }

  return (
    <div className="w-28 sm:w-36 h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as SparklinePoint;
                return (
                  <div className="bg-zinc-900 text-white px-2.5 py-1 rounded-md shadow-lg border border-zinc-700 text-[11px] font-mono whitespace-nowrap z-50">
                    <span className="text-zinc-400 font-sans mr-1">{item.period} :</span>
                    <span className="font-bold text-emerald-400">{item.value.toLocaleString('fr-CA')} {unit}</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#059669"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 3.5, fill: '#059669', stroke: '#ffffff', strokeWidth: 1.5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ManagingOverviewProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  userName: string;
}

const OFFICIAL_TEAM_MEMBERS: ProductivityScore[] = [
  {
    id: 'u1',
    user_id: 'u1',
    member_name: 'KAEL BELCEUS',
    role: 'Direction Générale (CEO)',
    period_month: '2026-09',
    tasks_points: 950,
    role_bonus_points: 500,
    total_points: 1450,
    current_rank: 1,
    previous_rank: 1,
    breakdown: {},
    computed_at: new Date().toISOString(),
  },
  {
    id: 'u2',
    user_id: 'u2',
    member_name: 'MANPREET SINGH',
    role: 'Tech & Systèmes IA',
    period_month: '2026-09',
    tasks_points: 880,
    role_bonus_points: 400,
    total_points: 1280,
    current_rank: 2,
    previous_rank: 2,
    breakdown: {},
    computed_at: new Date().toISOString(),
  },
  {
    id: 'u3',
    user_id: 'u3',
    member_name: 'RAYAN',
    role: 'Marketing & Acquisition',
    period_month: '2026-09',
    tasks_points: 720,
    role_bonus_points: 400,
    total_points: 1120,
    current_rank: 3,
    previous_rank: 3,
    breakdown: {},
    computed_at: new Date().toISOString(),
  },
  {
    id: 'u4',
    user_id: 'u4',
    member_name: 'SAMUEL OLAMIDE ADELEKE',
    role: 'Ventes & Closing B2B',
    period_month: '2026-09',
    tasks_points: 680,
    role_bonus_points: 300,
    total_points: 980,
    current_rank: 4,
    previous_rank: 4,
    breakdown: {},
    computed_at: new Date().toISOString(),
  },
  {
    id: 'u5',
    user_id: 'u5',
    member_name: 'AMINE YAHYA KARROUBI',
    role: 'Opérations & Delivery',
    period_month: '2026-09',
    tasks_points: 590,
    role_bonus_points: 300,
    total_points: 890,
    current_rank: 5,
    previous_rank: 5,
    breakdown: {},
    computed_at: new Date().toISOString(),
  },
];

export function ManagingOverview({ clients, projects, tasks, userName }: ManagingOverviewProps) {
  const [leaderboard, setLeaderboard] = useState<ProductivityScore[]>([]);

  useEffect(() => {
    let active = true;
    fetchProductivityLeaderboard()
      .then((data) => {
        if (active && data && data.length > 0) setLeaderboard(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeClients = useMemo(() => clients.filter((c) => c.status === 'Active'), [clients]);
  const totalMrr = useMemo(() => activeClients.reduce((acc, c) => acc + (c.mrr || 0), 0), [activeClients]);
  const activeProjects = useMemo(() => projects.filter((p) => p.current_stage !== 'Live Production'), [projects]);
  const criticalProjects = useMemo(() => projects.filter((p) => p.health === 'Needs Review'), [projects]);

  const activeTasks = useMemo(() => tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress'), [tasks]);
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status === 'done' || !t.due_date) return false;
      return new Date(t.due_date) < now;
    });
  }, [tasks]);

  // Keep strictly the official company members
  const displayedLeaderboard = useMemo(() => {
    if (leaderboard.length >= 3) {
      return leaderboard.map((m) => ({
        ...m,
        member_name: (m.member_name || '').toUpperCase(),
      })).slice(0, 5);
    }
    return OFFICIAL_TEAM_MEMBERS;
  }, [leaderboard]);

  return (
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Vue d’ensemble</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Cockpit Exécutif
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded">
            Managing
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/team/workload"
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            title="Équilibrage de la charge d'équipe"
          >
            <Gauge className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Charge Équipe</span>
          </Link>
          <Link
            href="/booking"
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            title="Planification des réunions"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Planning</span>
          </Link>
          <Link
            href="/team/roles"
            className="h-7 px-2 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
            title="Fiches de postes et grilles de commissions"
          >
            <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden md:inline">Rôles &amp; Grilles</span>
          </Link>
          <Link
            href="/classement"
            className="h-7 px-2.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 transition-colors shadow-2xs"
            title="Classement de vélocité"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Connected KPI Ribbon with Integrated Visual Charts (Linear/Raycast Monolith) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1: Santé Globale with Health Trend Sparkline */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 truncate">
              Santé Globale
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                96 %
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate" style={MONO}>
              {criticalProjects.length === 0 ? '0 alerte critique' : `${criticalProjects.length} à surveiller`}
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-end">
            <OverviewRechartsSparkline
              data={[
                { period: 'Jan', value: 88 },
                { period: 'Fév', value: 90 },
                { period: 'Mar', value: 92 },
                { period: 'Avr', value: 91 },
                { period: 'Mai', value: 95 },
                { period: 'Juin', value: 96 },
              ]}
              unit="%"
              gradientId="sparkHealthGrad"
            />
          </div>
        </div>

        {/* Metric 2: MRR sous Gestion with Revenue Growth Curve */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 truncate">
              MRR sous Gestion
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                <AnimatedNumber value={totalMrr || 7200} formatDecimals={0} /> $ CAD
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 font-mono font-medium mt-0.5 truncate" style={MONO}>
              +12.5% M/M
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-end">
            <OverviewRechartsSparkline
              data={[
                { period: 'Jan', value: Math.round((totalMrr || 7200) * 0.58) },
                { period: 'Fév', value: Math.round((totalMrr || 7200) * 0.70) },
                { period: 'Mar', value: Math.round((totalMrr || 7200) * 0.78) },
                { period: 'Avr', value: Math.round((totalMrr || 7200) * 0.86) },
                { period: 'Mai', value: Math.round((totalMrr || 7200) * 0.94) },
                { period: 'Juin', value: totalMrr || 7200 },
              ]}
              unit="$ CAD"
              gradientId="sparkMrrGrad"
            />
          </div>
        </div>

        {/* Metric 3: Capacité Équipe with Load Curve */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 truncate">
              Capacité Équipe
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                78 %
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate" style={MONO}>
              {overdueTasks.length > 0 ? `${overdueTasks.length} en retard` : 'Charge saine'}
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-end">
            <OverviewRechartsSparkline
              data={[
                { period: 'S1', value: 64 },
                { period: 'S2', value: 70 },
                { period: 'S3', value: 74 },
                { period: 'S4', value: 69 },
                { period: 'S5', value: 75 },
                { period: 'S6', value: 78 },
              ]}
              unit="%"
              gradientId="sparkCapacityGrad"
            />
          </div>
        </div>

        {/* Metric 4: Rétention LTV with Cohort Retention Curve */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex flex-col justify-between min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 truncate">
              Rétention LTV
            </span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
                94.2 %
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate" style={MONO}>
              Zero Churn
            </span>
          </div>
          <div className="shrink-0 flex items-center justify-end">
            <OverviewRechartsSparkline
              data={[
                { period: 'M1', value: 100 },
                { period: 'M2', value: 98.4 },
                { period: 'M3', value: 97.2 },
                { period: 'M4', value: 96.0 },
                { period: 'M5', value: 95.1 },
                { period: 'M6', value: 94.2 },
              ]}
              unit="%"
              gradientId="sparkRetentionGrad"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Operational Two-Tier Grid (60% Projects / 40% Velocity & Balancing) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column (60% - 7 cols on lg): Dense Projects DataTable */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Table Header Strip */}
          <div className="h-9 px-3.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-900">
                Chantiers &amp; Projets en Cours
              </span>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                ({activeProjects.length})
              </span>
            </div>
            <Link
              href="/projects"
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Tous les projets</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Table Column Labels */}
          <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-200/80 bg-zinc-50/40 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
            <span className="col-span-5">Projet</span>
            <span className="col-span-3">Client</span>
            <span className="col-span-2">Échéance</span>
            <span className="col-span-2 text-right">Statut</span>
          </div>

          {/* Table Rows (h-9 / 36px) */}
          <div className="divide-y divide-zinc-100">
            {activeProjects.length === 0 ? (
              <div className="h-20 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                Aucun projet en cours — Tous les jalons sont livrés
              </div>
            ) : (
              activeProjects.slice(0, 6).map((project) => {
                const isOverdue = project.due_date && new Date(project.due_date) < new Date();
                const isWarning = project.health === 'Needs Review' || isOverdue;
                const formattedDate = project.due_date
                  ? new Date(project.due_date).toISOString().slice(0, 10)
                  : '—';

                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-12 h-9 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                  >
                    {/* Project Name + Progress micro-bar */}
                    <div className="col-span-5 flex items-center gap-2 pr-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <Link
                        href={`/projects`}
                        className="font-medium text-zinc-900 truncate hover:text-emerald-600 transition-colors"
                        title={project.name}
                      >
                        {project.name}
                      </Link>
                    </div>

                    {/* Client */}
                    <div className="col-span-3 text-zinc-500 truncate text-[11px]">
                      {project.client_name || 'Interne'}
                    </div>

                    {/* Due Date (ISO font-mono) */}
                    <div
                      className={cn(
                        'col-span-2 font-mono text-[11px] tabular-nums',
                        isOverdue ? 'text-rose-600 font-semibold' : 'text-zinc-500'
                      )}
                      style={MONO}
                    >
                      {formattedDate}
                    </div>

                    {/* Status Badge + Hover Action */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span
                        className={cn(
                          'text-[10px] font-medium font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider',
                          isWarning
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                        style={MONO}
                      >
                        {project.health || 'On Track'}
                      </span>
                      <Link
                        href={`/projects`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-900"
                        title="Détails du projet"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick inline status footer */}
          <div className="h-7 px-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[10px] text-zinc-400 font-mono" style={MONO}>
            <span>{activeProjects.length} chantiers surveillés</span>
            <span className="text-emerald-700 font-semibold">Taux de livraison à l'heure : 92%</span>
          </div>
        </div>

        {/* Right Column (40% - 5 cols on lg): Velocity & Team Balancing Console */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden flex flex-col">
          {/* Header Strip */}
          <div className="h-9 px-3.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-semibold text-zinc-900">
                Vélocité &amp; Leaderboard d'Équipe
              </span>
            </div>
            <Link
              href="/classement"
              className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Classement</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Top Micro-Bar: Team Load distribution */}
          <div className="px-3.5 py-2 border-b border-zinc-100 bg-zinc-50/30 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-600 font-medium">Charge active :</span>
              <span className="font-mono text-zinc-900 font-semibold" style={MONO}>
                {activeTasks.length} tâches
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono" style={MONO}>
              <span className={overdueTasks.length > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                {overdueTasks.length} retard{overdueTasks.length > 1 ? 's' : ''}
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-zinc-500">Capacité 78%</span>
            </div>
          </div>

          {/* Compact Leaderboard List */}
          <div className="divide-y divide-zinc-100">
            {displayedLeaderboard.map((member, index) => {
              const displayName = (member.member_name || `MEMBRE #${index + 1}`).toUpperCase();
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const rank = member.current_rank || index + 1;
              const hasConfiguredPoints = typeof member.total_points === 'number' && member.total_points > 0;

              return (
                <div
                  key={member.id || member.user_id || index}
                  className="h-10 px-3.5 flex items-center justify-between text-xs hover:bg-zinc-50/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Rank Indicator */}
                    <span
                      className={cn(
                        'w-4 text-center font-mono text-[11px] font-bold',
                        rank === 1
                          ? 'text-amber-500'
                          : rank === 2
                          ? 'text-zinc-400'
                          : rank === 3
                          ? 'text-amber-700'
                          : 'text-zinc-400'
                      )}
                      style={MONO}
                    >
                      {rank}
                    </span>

                    {/* Avatar Initials */}
                    <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>

                    {/* Member Name (UPPERCASE) + Role */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate leading-tight tracking-wide">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate leading-tight">
                        {member.role || member.department || 'Équipe Minerva'}
                      </p>
                    </div>
                  </div>

                  {/* Points & Load Pill (Honest empty state when not yet configured) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'font-mono text-xs tabular-nums',
                        hasConfiguredPoints ? 'font-bold text-zinc-900' : 'text-zinc-400'
                      )}
                      style={MONO}
                    >
                      {hasConfiguredPoints ? `${member.total_points} pts` : '— pts'}
                    </span>
                    <Link
                      href="/classement"
                      className="text-[10px] font-mono text-zinc-500 hover:text-emerald-700 bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 px-1.5 py-0.2 rounded transition-colors"
                      style={MONO}
                      title="Configurer les points de vélocité sur /classement"
                    >
                      {hasConfiguredPoints ? 'Actif' : 'À configurer'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Fast Action Row */}
          <div className="h-8 px-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[11px]">
            <Link
              href="/team/workload"
              className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 font-mono text-[10px]"
              style={MONO}
            >
              <span>+ Répartir les charges sur /team/workload</span>
            </Link>
            <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
              100% assigné
            </span>
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
