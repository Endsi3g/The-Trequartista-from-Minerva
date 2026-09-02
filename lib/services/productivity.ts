import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductivityScore } from '@/lib/types';

// Accountability & healthy-competition leaderboard scoring.
//
// Universal signal (every role, weight carries the baseline): real task
// completion from public.tasks, since /tasks is used company-wide
// regardless of workspace.
//
// Role-specific bonus, computed only where a genuinely attributable
// real-data signal exists -- no fabricated metric for a role just to make
// every workspace "feel" equally covered:
//   - Prospection: leads.assigned_to closed to stage='won' this period
//   - Tech: tech_qa_audits.audited_by with status in ('passed','warning')
//   - Managing / unassigned: no clean per-user attribution exists in
//     invoices/proposals (no created_by/sent_by column on either table),
//     so these members are scored on the universal tasks signal only --
//     same baseline as everyone else, not a penalty.
const TASK_POINTS_ON_TIME = 15;
const TASK_POINTS_OTHER = 8;
const TASK_POINTS_OVERDUE_PENALTY = 5;
const LEAD_WON_POINTS = 20;
const QA_PASSED_POINTS = 12;
const QA_WARNING_POINTS = 6;

export function currentPeriodMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function monthBounds(periodMonth: Date): { start: string; end: string; periodMonthStr: string } {
  const start = new Date(Date.UTC(periodMonth.getUTCFullYear(), periodMonth.getUTCMonth(), 1));
  const end = new Date(Date.UTC(periodMonth.getUTCFullYear(), periodMonth.getUTCMonth() + 1, 1));
  return { start: start.toISOString(), end: end.toISOString(), periodMonthStr: start.toISOString().slice(0, 10) };
}

interface ComputedScore {
  user_id: string;
  tasks_points: number;
  role_bonus_points: number;
  total_points: number;
  breakdown: ProductivityScore['breakdown'];
}

export interface RankChange {
  user_id: string;
  previous_rank: number | null;
  current_rank: number;
}

export interface NewMilestone {
  user_id: string;
  milestone_key: ProductivityMilestoneKey;
  details: Record<string, unknown>;
}

export type ProductivityMilestoneKey = 'rank_1' | 'top_3' | 'personal_best';

export async function computeProductivityScores(
  supabase: SupabaseClient,
  periodMonth: Date = currentPeriodMonth()
): Promise<{ scores: ComputedScore[]; rankChanges: RankChange[]; newMilestones: NewMilestone[] }> {
  const { start, end, periodMonthStr } = monthBounds(periodMonth);
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: members },
    { data: doneTasks },
    { data: overdueTasks },
    { data: wonLeads },
    { data: qaAudits },
    { data: existingScores },
  ] = await Promise.all([
    supabase.from('profiles').select('id').in('role', ['admin', 'member']),
    supabase
      .from('tasks')
      .select('assignee_id, due_date, updated_at')
      .eq('status', 'done')
      .gte('updated_at', start)
      .lt('updated_at', end)
      .not('assignee_id', 'is', null),
    supabase
      .from('tasks')
      .select('assignee_id')
      .neq('status', 'done')
      .lt('due_date', today)
      .not('assignee_id', 'is', null),
    supabase
      .from('leads')
      .select('assigned_to')
      .eq('stage', 'won')
      .gte('updated_at', start)
      .lt('updated_at', end)
      .not('assigned_to', 'is', null),
    supabase
      .from('tech_qa_audits')
      .select('audited_by, status')
      .in('status', ['passed', 'warning'])
      .gte('created_at', start)
      .lt('created_at', end)
      .not('audited_by', 'is', null),
    supabase.from('productivity_scores').select('user_id, current_rank').eq('period_month', periodMonthStr),
  ]);

  const memberIds = (members || []).map((m) => m.id as string);
  const perUser = new Map<string, ComputedScore>();
  for (const id of memberIds) {
    perUser.set(id, { user_id: id, tasks_points: 0, role_bonus_points: 0, total_points: 0, breakdown: {} });
  }

  for (const t of doneTasks || []) {
    const entry = perUser.get(t.assignee_id as string);
    if (!entry) continue;
    const onTime = !!t.due_date && new Date(t.updated_at as string) <= new Date(`${t.due_date}T23:59:59`);
    if (onTime) {
      entry.breakdown.tasks_completed_on_time = (entry.breakdown.tasks_completed_on_time || 0) + 1;
      entry.tasks_points += TASK_POINTS_ON_TIME;
    } else {
      entry.breakdown.tasks_completed_other = (entry.breakdown.tasks_completed_other || 0) + 1;
      entry.tasks_points += TASK_POINTS_OTHER;
    }
  }

  for (const t of overdueTasks || []) {
    const entry = perUser.get(t.assignee_id as string);
    if (!entry) continue;
    entry.breakdown.tasks_overdue_now = (entry.breakdown.tasks_overdue_now || 0) + 1;
    entry.tasks_points -= TASK_POINTS_OVERDUE_PENALTY;
  }

  for (const l of wonLeads || []) {
    const entry = perUser.get(l.assigned_to as string);
    if (!entry) continue;
    entry.breakdown.leads_won = (entry.breakdown.leads_won || 0) + 1;
    entry.role_bonus_points += LEAD_WON_POINTS;
  }

  for (const a of qaAudits || []) {
    const entry = perUser.get(a.audited_by as string);
    if (!entry) continue;
    if (a.status === 'passed') {
      entry.breakdown.qa_audits_passed = (entry.breakdown.qa_audits_passed || 0) + 1;
      entry.role_bonus_points += QA_PASSED_POINTS;
    } else {
      entry.breakdown.qa_audits_warning = (entry.breakdown.qa_audits_warning || 0) + 1;
      entry.role_bonus_points += QA_WARNING_POINTS;
    }
  }

  const scores = Array.from(perUser.values()).map((s) => ({
    ...s,
    total_points: Math.max(0, s.tasks_points + s.role_bonus_points),
  }));

  const prevRankMap = new Map<string, number | null>();
  for (const row of existingScores || []) prevRankMap.set(row.user_id as string, (row.current_rank as number | null) ?? null);

  const sorted = [...scores].sort((a, b) => b.total_points - a.total_points);
  const rankChanges: RankChange[] = [];
  const upserts = sorted.map((s, idx) => {
    const current_rank = idx + 1;
    const previous_rank = prevRankMap.get(s.user_id) ?? null;
    if (previous_rank !== current_rank) {
      rankChanges.push({ user_id: s.user_id, previous_rank, current_rank });
    }
    return {
      user_id: s.user_id,
      period_month: periodMonthStr,
      tasks_points: s.tasks_points,
      role_bonus_points: s.role_bonus_points,
      total_points: s.total_points,
      current_rank,
      previous_rank,
      breakdown: s.breakdown,
      computed_at: new Date().toISOString(),
    };
  });

  if (upserts.length) {
    await supabase.from('productivity_scores').upsert(upserts, { onConflict: 'user_id,period_month' });
  }

  // Milestones: rank #1, entering the top 3, or beating one's own best
  // total from an earlier (non-current) period.
  const newMilestones: NewMilestone[] = [];
  const { data: history } = await supabase
    .from('productivity_scores')
    .select('user_id, total_points, period_month')
    .neq('period_month', periodMonthStr);
  const bestByUser = new Map<string, number>();
  for (const row of history || []) {
    const uid = row.user_id as string;
    bestByUser.set(uid, Math.max(bestByUser.get(uid) || 0, row.total_points as number));
  }

  for (const u of upserts) {
    if (u.total_points <= 0) continue;
    if (u.current_rank === 1 && u.previous_rank !== 1) {
      newMilestones.push({ user_id: u.user_id, milestone_key: 'rank_1', details: { total_points: u.total_points } });
    } else if (u.current_rank <= 3 && (u.previous_rank === null || u.previous_rank > 3)) {
      newMilestones.push({ user_id: u.user_id, milestone_key: 'top_3', details: { current_rank: u.current_rank } });
    }
    const best = bestByUser.get(u.user_id) ?? 0;
    if (best > 0 && u.total_points > best) {
      newMilestones.push({ user_id: u.user_id, milestone_key: 'personal_best', details: { total_points: u.total_points, previous_best: best } });
    }
  }

  if (newMilestones.length) {
    await supabase.from('productivity_milestones').upsert(
      newMilestones.map((m) => ({
        user_id: m.user_id,
        milestone_key: m.milestone_key,
        period_month: periodMonthStr,
        details: m.details,
      })),
      { onConflict: 'user_id,milestone_key,period_month', ignoreDuplicates: true }
    );
  }

  return { scores: upserts, rankChanges, newMilestones };
}
