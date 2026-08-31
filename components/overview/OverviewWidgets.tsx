'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckSquare } from 'lucide-react';
import type { Project, Task } from '@/lib/types';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

export function getDueDateLabel(dueDateStr: string | null) {
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
export function MrrSparkline({ data }: { data: number[] }) {
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

export function ProjectsTable({ projects, loading }: { projects: Project[]; loading: boolean }) {
  const router = useRouter();
  const now = new Date();
  return (
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
      ) : projects.length === 0 ? (
        <p className="text-xs text-mv-ink-faint py-6 text-center">Aucun projet actif pour le moment.</p>
      ) : (
        <table className="w-full text-[12.5px] border-collapse">
          <tbody>
            {projects.map((p) => {
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
  );
}

export function MrrBreakdownTable({
  topClientsByMrr,
  totalMrr,
  maxClientMrr,
  mrrTrendData,
  loading,
}: {
  topClientsByMrr: { id: string; name: string; mrr: number }[];
  totalMrr: number;
  maxClientMrr: number;
  mrrTrendData: number[];
  loading: boolean;
}) {
  const router = useRouter();
  return (
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
  );
}

export function LeadFunnelCard({
  leadFunnelStages,
  activeLeadsCount,
  totalPipelineValue,
  totalMrr,
  maxStageCount,
  leadsCount,
  loading,
}: {
  leadFunnelStages: { key: string; label: string; count: number; pct: number }[];
  activeLeadsCount: number;
  totalPipelineValue: number;
  totalMrr: number;
  maxStageCount: number;
  leadsCount: number;
  loading: boolean;
}) {
  return (
    <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
          Pipeline des leads
        </span>
        <span className="text-[11px] font-semibold text-mv-ink" style={MONO}>
          {activeLeadsCount} leads
        </span>
      </div>
      <p className="text-[10.5px] text-mv-ink-faint mb-3">Répartition par étape de conversion</p>

      {loading ? (
        <p className="text-xs text-mv-ink-faint py-4 text-center">Chargement…</p>
      ) : leadsCount === 0 ? (
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
  );
}

export function PendingTasksCard({ pendingTasks, loading }: { pendingTasks: Task[]; loading: boolean }) {
  return (
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
  );
}

export interface OverviewMetricsData {
  projects: Project[];
  topClientsByMrr: { id: string; name: string; mrr: number }[];
  totalMrr: number;
  maxClientMrr: number;
  mrrTrendData: number[];
  leadFunnelStages: { key: string; label: string; count: number; pct: number }[];
  activeLeadsCount: number;
  totalPipelineValue: number;
  leadsCount: number;
  maxStageCount: number;
  pendingTasks: Task[];
  loading: boolean;
}
