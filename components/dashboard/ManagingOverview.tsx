'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  UsersRound,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Gauge,
  Calendar,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  DollarSign,
  Trophy,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageFadeIn } from '@/components/ui/page-transition';
import { AnimatedNumber } from '@/components/ui/animated-number';
import type { Client, Project, Task } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface ManagingOverviewProps {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  userName: string;
}

export function ManagingOverview({ clients, projects, tasks, userName }: ManagingOverviewProps) {
  const activeClients = clients.filter((c) => c.status === 'Active');
  const totalMrr = activeClients.reduce((acc, c) => acc + (c.mrr || 0), 0);
  const activeProjects = projects.filter((p) => p.current_stage !== 'Live Production');
  const criticalProjects = projects.filter((p) => p.health === 'Needs Review');
  const activeTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'done' || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  });

  const firstName = userName ? userName.trim().split(' ')[0] : 'Direction';

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Top Executive Welcome ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <Building2 className="w-3.5 h-3.5" />
              <span>Workspace Managing</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Gouvernance • Équipes • Rentabilité
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
            Bonjour, {firstName} — Cockpit Exécutif de l’Agence
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft max-w-2xl">
            Vue d’ensemble sur la gestion des équipes, la rétention client, la capacité opérationnelle et la santé financière globale.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href="/team/workload"
            className="h-8 px-3 rounded-lg bg-mv-green hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Charge de Travail</span>
          </Link>
          <Link
            href="/booking"
            className="h-8 px-3 rounded-lg border border-mv-border bg-mv-cream-soft hover:border-mv-green text-xs font-semibold text-mv-ink flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Planning &amp; RDV</span>
          </Link>
          <Link
            href="/team/roles"
            className="h-8 px-3 rounded-lg border border-mv-border bg-mv-cream-soft hover:border-mv-green text-xs font-semibold text-mv-ink flex items-center gap-1.5 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Rôles &amp; Grilles</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Top Executive KPI Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Santé Globale Agence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600 font-mono" style={MONO}>
              96 %
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Optimal
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Zéro risque structurel détecté</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>MRR Sous Gestion</span>
            <DollarSign className="w-4 h-4 text-mv-blue" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-mv-ink font-mono" style={MONO}>
              <AnimatedNumber value={totalMrr} formatDecimals={0} /> $
            </span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded">
              {activeClients.length} clients
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Revenus récurrents prévisibles</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Capacité &amp; Équilibrage Équipe</span>
            <Gauge className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-900 font-mono" style={MONO}>
              78 %
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              Équilibré
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Pas de surcharge critique</p>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-xl p-4 shadow-mv-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-mv-ink-soft text-xs font-semibold">
            <span>Taux de Rétention LTV</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-purple-700 font-mono" style={MONO}>
              94.2 %
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded">
              Cohort 6M
            </span>
          </div>
          <p className="text-[10.5px] text-mv-ink-faint mt-1">Fidélité des comptes restaurants</p>
        </div>
      </div>

      {/* ── 3. Quick Action Hub for Managing ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-mv-ink">Équilibrage Équipe</h3>
            </div>
            <Link href="/team/workload" className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1">
              <span>Gérer</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-mv-ink-soft">
            Visualisez la charge de chaque membre en heures/semaine et réassignez les tâches en surcharge en 1 clic.
          </p>
          <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-xs text-zinc-500 font-mono" style={MONO}>
            <span>{activeTasks.length} tâches actives</span>
            <span className={overdueTasks.length > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
              {overdueTasks.length} en retard
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-mv-ink">Leaderboard d’Équipe</h3>
            </div>
            <Link href="/classement" className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1">
              <span>Voir</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-mv-ink-soft">
            Classement continu de tous les collaborateurs par points de productivité, même sans tâches assignées ce mois-ci.
          </p>
          <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-xs text-zinc-500 font-mono" style={MONO}>
            <span>Podium mensuel actif</span>
            <span className="text-emerald-600 font-bold">100% membres suivis</span>
          </div>
        </Card>

        <Card className="p-4 bg-mv-surface border-mv-border rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-mv-ink">Rôles &amp; Commissions</h3>
            </div>
            <Link href="/team/roles" className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1">
              <span>Consulter</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-mv-ink-soft">
            Fiches de postes des 4 départements, rituels obligatoires et simulateur de rémunération hybride (10% setup, 5% MRR).
          </p>
          <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-xs text-zinc-500 font-mono" style={MONO}>
            <span>4 départements</span>
            <span className="text-purple-600 font-bold">Grilles transparentes</span>
          </div>
        </Card>
      </div>

      {/* ── 4. Operational Projects & Delivery Pipeline ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-mv-ink flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Chantiers &amp; Projets d’Agence en Cours ({activeProjects.length})</span>
            </h2>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Suivi des jalons de production vidéo, déploiements Framer et intégrations Minerva Flow.
            </p>
          </div>
          <Link href="/projects" className="text-xs text-mv-green font-semibold hover:underline flex items-center gap-1">
            <span>Tous les projets</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {activeProjects.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400">
            Aucun projet actif pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeProjects.slice(0, 4).map((p) => (
              <div key={p.id} className="p-3.5 rounded-lg border border-mv-border bg-mv-cream-soft space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-900 truncate">{p.name}</h4>
                  <Badge variant={p.health === 'Needs Review' ? 'amber' : 'green'}>
                    {p.health || 'On Track'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono" style={MONO}>
                  <span>Client : {p.client_name || 'Interne'}</span>
                  <span>Échéance : {p.due_date ? new Date(p.due_date).toLocaleDateString('fr-CA') : 'Flexible'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFadeIn>
  );
}
