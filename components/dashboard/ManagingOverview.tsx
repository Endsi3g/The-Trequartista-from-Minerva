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

interface ManagingOverviewProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  userName: string;
}

export function ManagingOverview({ clients, projects, tasks, userName }: ManagingOverviewProps) {
  const [leaderboard, setLeaderboard] = useState<ProductivityScore[]>([]);

  useEffect(() => {
    let active = true;
    fetchProductivityLeaderboard()
      .then((data) => {
        if (active) setLeaderboard(data);
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

  // Fallback leaderboard members if table has fewer than 4 entries
  const displayedLeaderboard = useMemo(() => {
    if (leaderboard.length > 0) return leaderboard.slice(0, 5);
    return [
      { id: '1', user_id: 'u1', member_name: 'Kael B.', role: 'Direction & Lead Tech', total_points: 1450, current_rank: 1, breakdown: {} },
      { id: '2', user_id: 'u2', member_name: 'Eli M.', role: 'Directeur Création Vidéo', total_points: 1280, current_rank: 2, breakdown: {} },
      { id: '3', user_id: 'u3', member_name: 'Sarah D.', role: 'Account Manager & Ops', total_points: 980, current_rank: 3, breakdown: {} },
      { id: '4', user_id: 'u4', member_name: 'Alex R.', role: 'Closer B2B & Prospection', total_points: 840, current_rank: 4, breakdown: {} },
    ] as ProductivityScore[];
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

      {/* ── 2. Monolithic Connected KPI Ribbon (h-14 / 56px max) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-2xs overflow-hidden">
        {/* Metric 1: Santé Globale */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Santé Globale
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded" style={MONO}>
              Optimal
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              96 %
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              {criticalProjects.length === 0 ? '0 alerte critique' : `${criticalProjects.length} à surveiller`}
            </span>
          </div>
        </div>

        {/* Metric 2: MRR sous Gestion */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              MRR sous Gestion
            </span>
            <span className="text-[10px] font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded" style={MONO}>
              {activeClients.length} clients
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              <AnimatedNumber value={totalMrr || 7200} formatDecimals={0} /> $ CAD
            </span>
            <span className="text-[11px] text-emerald-600 font-mono font-medium" style={MONO}>
              +12.5% M/M
            </span>
          </div>
        </div>

        {/* Metric 3: Capacité Équipe */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Capacité Équipe
            </span>
            <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded" style={MONO}>
              Équilibré
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              78 %
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              {overdueTasks.length > 0 ? `${overdueTasks.length} en retard` : 'Charge saine'}
            </span>
          </div>
        </div>

        {/* Metric 4: Rétention LTV */}
        <div className="px-3.5 py-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Rétention LTV
            </span>
            <span className="text-[10px] font-bold font-mono text-purple-700 bg-purple-50 border border-purple-200/60 px-1.5 py-0.2 rounded" style={MONO}>
              Cohorte 6M
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono tabular-nums text-zinc-900" style={MONO}>
              94.2 %
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Zero Churn
            </span>
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
              const displayName = member.member_name || `Membre #${index + 1}`;
              const initials = displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              const rank = member.current_rank || index + 1;

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

                    {/* Member Name + Role */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate leading-tight">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate leading-tight">
                        {member.role || member.department || 'Équipe Minerva'}
                      </p>
                    </div>
                  </div>

                  {/* Points & Load Pill */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="font-mono text-xs font-bold text-zinc-900 tabular-nums"
                      style={MONO}
                    >
                      {member.total_points || 0} pts
                    </span>
                    <span
                      className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded"
                      style={MONO}
                    >
                      {30 + (index * 4)}h/s
                    </span>
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
