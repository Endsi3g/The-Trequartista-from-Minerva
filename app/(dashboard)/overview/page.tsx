'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DollarSign,
  FolderKanban,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Plus,
  Calendar,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { fetchProjects, fetchClients } from '@/lib/services/supabase-data';
import { Project, Client } from '@/lib/types';
import { AreaChart } from '@/components/charts/AreaChart';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { ChartBarInteractive } from '@/components/charts/ChartBarInteractive';



export default function OverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [projData, clientData] = await Promise.all([fetchProjects(), fetchClients()]);
      setProjects(projData);
      setClients(clientData);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalMrr = clients.reduce((acc, c) => acc + c.mrr, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Vue d’ensemble des Opérations
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Pilotage en direct depuis la base de données Supabase Minerva.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/projects/proj-apex-launch/launch-check">
            <Button variant="lime" icon={<CheckCircle2 className="w-4 h-4" />}>
              Checklist Qualité 20-Pts
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MRR Total Agence + SaaS"
          value={loading ? '...' : `${totalMrr.toLocaleString('fr-CA')} $`}
          change="+14% ce mois"
          changeType="positive"
          subtitle={`${clients.length} clients sous contrat`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Projets en Production"
          value={loading ? '...' : `${projects.length} Actifs`}
          change="Synchro Supabase Live"
          changeType="positive"
          subtitle="Délai moyen : 6 jours"
          icon={<FolderKanban className="w-5 h-5" />}
        />
        <StatCard
          title="Moyenne ROI Client"
          value="8.7x"
          change="+1.2x vs Q2"
          changeType="positive"
          subtitle="48 200 $ générés"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="NPS Équipe & Climat"
          value="4.9 / 5.0"
          change="100% 1-on-1s tenus"
          changeType="positive"
          subtitle="Prochain : Jeudi 14h"
          icon={<Award className="w-5 h-5" />}
        />
      </div>

      {/* Main Revenue Trend Interactive Chart */}
      <AreaChart
        title="Tendance Mensuelle du MRR & Revenus Agence ($)"
        subtitle="Historique des 6 derniers mois (Supabase live metrics)"
        data={[
          { label: 'Jan', value: 18500 },
          { label: 'Fév', value: 21200 },
          { label: 'Mar', value: 24800 },
          { label: 'Avr', value: 29100 },
          { label: 'Mai', value: 33400 },
          { label: 'Juin', value: totalMrr > 0 ? totalMrr : 38500 },
        ]}
        valuePrefix="$"
      />


      {/* Main Grid: Priority Projects + Operations Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projets Prioritaires Table (2 cols) */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-mv-warm" />
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                  Projets Prioritaires & Santé (Supabase Real-Time)
                </h3>
              </div>
              <Link href="/projects" className="text-xs text-mv-green hover:underline flex items-center gap-1 font-semibold">
                Voir tous les projets <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          }
        >
          {loading ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-4 shimmer-bg rounded w-3/4 mx-auto animate-mv-shimmer" />
              <div className="h-4 shimmer-bg rounded w-1/2 mx-auto animate-mv-shimmer" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-semibold">Client & Projet</th>
                    <th className="pb-3 font-semibold">Étape Actuelle</th>
                    <th className="pb-3 font-semibold">Avancement</th>
                    <th className="pb-3 font-semibold">Santé</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mv-border/40">
                  {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-mv-cream-soft/40 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-bold text-mv-ink">{project.client_name}</div>
                        <div className="text-[11px] text-mv-ink-soft truncate max-w-[200px]">{project.name}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <Badge variant="neutral">{project.current_stage}</Badge>
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-mv-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-mv-green rounded-full"
                              style={{ width: `${project.progress_pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-mv-ink-soft">{project.progress_pct}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <Badge variant={project.health === 'Ready' ? 'green' : 'lime'}>
                          ● {project.health}
                        </Badge>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link href={`/projects/${project.id}/launch-check`}>
                          <Button variant="outline" size="sm">
                            Checklist
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick Operations Panel & Alerts */}
        <div className="space-y-6">
          <Card
            header={
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Raccourcis Opérations
              </h3>
            }
          >
            <div className="space-y-2.5">
              <Link href="/clients" className="block">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border hover:border-mv-green/40 transition-all text-xs font-bold text-mv-ink cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-mv-green" /> Nouveau Client
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-mv-ink-soft" />
                </button>
              </Link>

              <Link href="/projects/proj-apex-launch/launch-check" className="block">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border hover:border-mv-green/40 transition-all text-xs font-bold text-mv-ink cursor-pointer">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-mv-warm" /> Lancer Checklist 20-Pts
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-mv-ink-soft" />
                </button>
              </Link>

              <Link href="/team/team-alex/performance" className="block">
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft hover:bg-mv-green-tint border border-mv-border hover:border-mv-green/40 transition-all text-xs font-bold text-mv-ink cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-mv-amber" /> Session 1-on-1 Équipe
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-mv-ink-soft" />
                </button>
              </Link>
            </div>
          </Card>

          <Card
            header={
              <div className="flex items-center gap-2 text-mv-amber">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                  Alertes Qualité & Sync
                </h3>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-mv-amber-bg border border-mv-amber/30 text-mv-amber flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-mv-amber mt-1.5 shrink-0" />
                <div>
                  <div className="font-bold">Loi 25 non validée sur Apex Roofing</div>
                  <div className="text-[11px] opacity-90 mt-0.5">Le point #17 de la checklist demande confirmation du consentement cookie.</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* ── Graphique Barres Interactif ── */}
      <div className="mt-6">
        <ChartBarInteractive />
      </div>
    </div>
  );
}
