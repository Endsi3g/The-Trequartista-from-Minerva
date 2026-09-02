'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { UserAvatar } from '@/components/ui/user-avatar';
import { fetchProductivityLeaderboard, fetchProductivityMilestones } from '@/lib/services/supabase-data';
import type { ProductivityScore, ProductivityMilestone } from '@/lib/types';
import { cn } from '@/lib/utils';

const WORKSPACE_LABELS: Record<string, string> = { prospection: 'Prospection', managing: 'Managing', tech: 'Tech & Ingénierie' };

const MILESTONE_LABELS: Record<ProductivityMilestone['milestone_key'], string> = {
  rank_1: '🏆 a pris la tête du classement',
  top_3: '🥉 est entré dans le top 3',
  personal_best: '📈 a battu son record personnel',
};

function periodOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    options.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    });
  }
  return options;
}

export default function ClassementPage() {
  const [period, setPeriod] = useState(() => periodOptions()[0].value);
  const [scores, setScores] = useState<ProductivityScore[]>([]);
  const [milestones, setMilestones] = useState<ProductivityMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([fetchProductivityLeaderboard(period), fetchProductivityMilestones(period, 15)]).then(([s, m]) => {
      if (!active) return;
      setScores(s);
      setMilestones(m);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [period]);

  const podium = useMemo(() => scores.slice(0, 3), [scores]);
  const rest = useMemo(() => scores.slice(3), [scores]);
  const options = useMemo(() => periodOptions(), []);

  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-mv-amber" />
          <h1 className="text-lg font-bold text-mv-ink font-display tracking-tight">Classement — Productivité de l'équipe</h1>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-8 px-3 text-xs font-medium border border-mv-border rounded-lg bg-mv-surface text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer capitalize"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="capitalize">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-mv-ink-soft max-w-2xl">
        Score basé sur les tâches complétées à temps (tout le monde), avec un bonus réel selon le poste : leads gagnés en Prospection,
        audits QA réussis en Tech. Classement remis à zéro chaque mois — l'historique reste consultable.
      </p>

      {loading ? (
        <div className="text-sm text-mv-ink-soft">Chargement…</div>
      ) : scores.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Aucun score pour ce mois"
          description="Le calcul quotidien du classement n'a pas encore tourné pour cette période, ou personne n'a encore de tâche complétée ce mois-ci."
        />
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {podium.map((s, idx) => (
                <Card
                  key={s.id}
                  className={cn(
                    'text-center',
                    idx === 0 && 'border-mv-amber/50 shadow-mv-md sm:order-2 sm:-translate-y-2',
                    idx === 1 && 'sm:order-1',
                    idx === 2 && 'sm:order-3'
                  )}
                  contentClassName="p-5"
                >
                  <div className="text-2xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <UserAvatar src={s.member_avatar_url} name={s.member_name} size="lg" className="mx-auto mb-2" />
                  <div className="font-bold text-sm text-mv-ink truncate">{s.member_name}</div>
                  {s.workspace && (
                    <div className="text-[10.5px] text-mv-ink-faint mt-0.5">{WORKSPACE_LABELS[s.workspace] || s.workspace}</div>
                  )}
                  <div className="text-xl font-bold text-mv-ink mt-2 font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {s.total_points}
                  </div>
                  <div className="text-[10px] text-mv-ink-faint uppercase tracking-wide">points</div>
                </Card>
              ))}
            </div>
          )}

          {/* Full ranking */}
          <Card contentClassName="p-0">
            <div className="divide-y divide-mv-border">
              {rest.map((s) => (
                <RankRow key={s.id} score={s} />
              ))}
            </div>
          </Card>

          {/* Milestones feed */}
          {milestones.length > 0 && (
            <Card header={<div className="flex items-center gap-2 text-sm font-bold text-mv-ink"><Sparkles className="w-4 h-4 text-mv-purple" /> Derniers jalons</div>}>
              <ul className="space-y-2">
                {milestones.map((m) => (
                  <li key={m.id} className="text-xs text-mv-ink-soft flex items-center gap-2">
                    <Badge variant="purple">{MILESTONE_LABELS[m.milestone_key]}</Badge>
                    <span className="font-semibold text-mv-ink">{m.member_name}</span>
                    <span className="text-mv-ink-faint">
                      {new Date(m.achieved_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function RankRow({ score }: { score: ProductivityScore }) {
  const rank = score.current_rank ?? 0;
  const movement =
    score.previous_rank === null || score.current_rank === null
      ? null
      : score.current_rank < score.previous_rank
        ? 'up'
        : score.current_rank > score.previous_rank
          ? 'down'
          : 'same';

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-mv-cream-soft/60 transition-colors">
      <div className="w-6 text-center text-sm font-bold text-mv-ink-soft font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {rank}
      </div>
      <UserAvatar src={score.member_avatar_url} name={score.member_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-mv-ink truncate">{score.member_name}</div>
        <div className="text-[10.5px] text-mv-ink-faint">
          {score.breakdown.tasks_completed_on_time || 0} tâches à temps
          {(score.breakdown.leads_won || 0) > 0 && ` · ${score.breakdown.leads_won} lead(s) gagné(s)`}
          {(score.breakdown.qa_audits_passed || 0) > 0 && ` · ${score.breakdown.qa_audits_passed} audit(s) QA`}
        </div>
      </div>
      {movement === 'up' && <TrendingUp className="w-3.5 h-3.5 text-mv-green" />}
      {movement === 'down' && <TrendingDown className="w-3.5 h-3.5 text-mv-red" />}
      {movement === 'same' && <Minus className="w-3.5 h-3.5 text-mv-ink-faint" />}
      <div className="text-sm font-bold text-mv-ink font-mono w-14 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {score.total_points}
      </div>
    </div>
  );
}
