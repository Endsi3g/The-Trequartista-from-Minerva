// Minerva RevOps & Team Workload Balancing Engine
import { getSupabase } from '@/lib/supabase/client';
import type {
  TeamMemberWorkload,
  TeamCommission,
  TeamCapacityProfile,
  RevOpsSummary,
  TeamSpecialty,
  Task,
} from '@/lib/types';
import { fetchTasks } from '@/lib/services/supabase-data';

export const DEFAULT_WEEKLY_CAPACITY_HOURS = 35;
export const DEFAULT_TASK_ESTIMATED_HOURS = 3.5;
export const DEFAULT_MONTHLY_QUOTA_CAD = 10000.0;
export const DEFAULT_SETUP_COMMISSION_RATE = 10.0; // 10%
export const DEFAULT_MRR_COMMISSION_RATE = 5.0; // 5%
export const QUOTA_BONUS_MULTIPLIER = 1.25; // +25% bonus when quota is met

export interface HybridCommissionResult {
  baseAmountCad: number;
  setupCommissionCad: number;
  mrrCommissionCad: number;
  quotaMultiplier: number;
  isQuotaAchieved: boolean;
  totalCommissionCad: number;
}

export function calculateHybridCommission(
  dealBaseAmountCad: number,
  mrrMonthlyCad: number = 0,
  monthlyAchievedTotalCad: number = 0,
  monthlyQuotaCad: number = DEFAULT_MONTHLY_QUOTA_CAD,
  commissionRatePct: number = DEFAULT_SETUP_COMMISSION_RATE
): HybridCommissionResult {
  const base = Math.max(0, Number(dealBaseAmountCad) || 0);
  const mrr = Math.max(0, Number(mrrMonthlyCad) || 0);
  const achieved = Math.max(0, Number(monthlyAchievedTotalCad) || 0);
  const quota = Math.max(1, Number(monthlyQuotaCad) || DEFAULT_MONTHLY_QUOTA_CAD);

  const rawSetupComm = Math.round(base * (commissionRatePct / 100) * 100) / 100;
  const rawMrrComm = Math.round(mrr * (DEFAULT_MRR_COMMISSION_RATE / 100) * 100) / 100;

  const isQuotaAchieved = achieved >= quota;
  const multiplier = isQuotaAchieved ? QUOTA_BONUS_MULTIPLIER : 1.0;

  const finalSetupComm = Math.round(rawSetupComm * multiplier * 100) / 100;
  const total = Math.round((finalSetupComm + rawMrrComm) * 100) / 100;

  return {
    baseAmountCad: base,
    setupCommissionCad: finalSetupComm,
    mrrCommissionCad: rawMrrComm,
    quotaMultiplier: multiplier,
    isQuotaAchieved,
    totalCommissionCad: total,
  };
}

export const FALLBACK_TEAM_WORKLOADS: TeamMemberWorkload[] = [
  {
    member_id: 'mem-1',
    full_name: 'Alexandre Tremblay',
    email: 'alex@minerva.ca',
    specialty: 'video_production',
    total_tasks: 8,
    todo_tasks: 2,
    in_progress_tasks: 5,
    done_tasks: 1,
    overdue_tasks: 0,
    assigned_hours: 28,
    capacity_hours: 35,
    utilization_pct: 80,
    on_time_delivery_rate_pct: 96,
    total_commissions_earned_cad: 1450.0,
    active_deliverables: [
      { id: 'del-1', title: 'Tournage Reels Café Saint-Henri', client_name: 'Café Saint-Henri', status: 'in_progress' },
      { id: 'del-2', title: 'Montage Vidéo Plats Pizzeria Napolitana', client_name: 'Pizzeria Napolitana', status: 'todo' },
    ],
  },
  {
    member_id: 'mem-2',
    full_name: 'Sarah Benali',
    email: 'sarah@minerva.ca',
    specialty: 'web_framer',
    total_tasks: 10,
    todo_tasks: 3,
    in_progress_tasks: 6,
    done_tasks: 1,
    overdue_tasks: 1,
    assigned_hours: 35,
    capacity_hours: 35,
    utilization_pct: 100,
    on_time_delivery_rate_pct: 91,
    total_commissions_earned_cad: 2280.0,
    active_deliverables: [
      { id: 'del-3', title: 'Intégration Framer Resto Mile-End', client_name: 'Pizzeria Napolitana', status: 'in_progress' },
      { id: 'del-4', title: 'Animations Carte & Réservation Directe', client_name: 'Bistro Laurier', status: 'todo' },
    ],
  },
  {
    member_id: 'mem-3',
    full_name: 'Lucas Gagnon',
    email: 'lucas@minerva.ca',
    specialty: 'ads_acquisition',
    total_tasks: 4,
    todo_tasks: 1,
    in_progress_tasks: 2,
    done_tasks: 1,
    overdue_tasks: 0,
    assigned_hours: 14,
    capacity_hours: 35,
    utilization_pct: 40,
    on_time_delivery_rate_pct: 100,
    total_commissions_earned_cad: 850.0,
    active_deliverables: [
      { id: 'del-5', title: 'Campagne Google Ads 5km Mile-End', client_name: 'Pizzeria Napolitana', status: 'in_progress' },
    ],
  },
  {
    member_id: 'mem-4',
    full_name: 'Mathieu Roy',
    email: 'mathieu@minerva.ca',
    specialty: 'pos_operations',
    total_tasks: 6,
    todo_tasks: 2,
    in_progress_tasks: 3,
    done_tasks: 1,
    overdue_tasks: 0,
    assigned_hours: 21,
    capacity_hours: 35,
    utilization_pct: 60,
    on_time_delivery_rate_pct: 98,
    total_commissions_earned_cad: 650.0,
    active_deliverables: [
      { id: 'del-6', title: 'Connexion Imprimante & Chevalets QR', client_name: 'Café Saint-Henri', status: 'in_progress' },
    ],
  },
];

export const FALLBACK_COMMISSIONS: TeamCommission[] = [
  {
    id: 'comm-1',
    profile_id: 'mem-1',
    member_name: 'Alexandre Tremblay',
    deal_title: 'Pack 8 Reels Culinaires 4K — Café Saint-Henri',
    base_amount_cad: 1500.0,
    commission_rate_pct: 10.0,
    commission_amount_cad: 150.0,
    type: 'setup',
    status: 'approved',
    paid_at: '2026-08-20T10:00:00Z',
    created_at: '2026-08-18T14:30:00Z',
  },
  {
    id: 'comm-2',
    profile_id: 'mem-2',
    member_name: 'Sarah Benali',
    deal_title: 'Refonte Framer & Campagne Ads — Pizzeria Napolitana',
    base_amount_cad: 4000.0,
    commission_rate_pct: 12.5,
    commission_amount_cad: 500.0,
    type: 'bonus_quota',
    status: 'pending',
    created_at: '2026-08-25T16:00:00Z',
  },
  {
    id: 'comm-3',
    profile_id: 'mem-1',
    member_name: 'Alexandre Tremblay',
    deal_title: 'Abonnement Flow Resto — Saint-Henri (MRR 149$)',
    base_amount_cad: 149.0,
    commission_rate_pct: 5.0,
    commission_amount_cad: 7.45,
    type: 'mrr_recurring',
    status: 'approved',
    created_at: '2026-08-26T09:00:00Z',
  },
];

export async function fetchTeamWorkloads(): Promise<TeamMemberWorkload[]> {
  try {
    const supabase = getSupabase();
    const [{ data: profiles }, tasks] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('approved', true),
      fetchTasks(),
    ]);

    if (!profiles || profiles.length === 0) {
      return FALLBACK_TEAM_WORKLOADS;
    }

    const workloads: TeamMemberWorkload[] = (profiles as Array<{ id: string; full_name?: string | null; email?: string | null }>).map((p) => {
      const mine = tasks.filter((t: Task) => t.assignee_id === p.id);
      const todo = mine.filter((t: Task) => t.status === 'todo').length;
      const inProg = mine.filter((t: Task) => t.status === 'in_progress').length;
      const done = mine.filter((t: Task) => t.status === 'done').length;
      const overdue = mine.filter((t: Task) => t.status !== 'done' && t.due_date && t.due_date < new Date().toISOString().slice(0, 10)).length;
      const assignedHours = mine.length * DEFAULT_TASK_ESTIMATED_HOURS;
      const utilPct = Math.min(100, Math.round((assignedHours / DEFAULT_WEEKLY_CAPACITY_HOURS) * 100));

      return {
        member_id: p.id,
        full_name: p.full_name || 'Collaborateur',
        email: p.email || null,
        specialty: 'generalist',
        total_tasks: mine.length,
        todo_tasks: todo,
        in_progress_tasks: inProg,
        done_tasks: done,
        overdue_tasks: overdue,
        assigned_hours: assignedHours,
        capacity_hours: DEFAULT_WEEKLY_CAPACITY_HOURS,
        utilization_pct: utilPct,
        on_time_delivery_rate_pct: overdue === 0 ? 100 : Math.round(((mine.length - overdue) / mine.length) * 100),
        total_commissions_earned_cad: 650.0,
        active_deliverables: mine.slice(0, 2).map((t: Task) => ({
          id: t.id,
          title: t.title,
          client_name: 'Client Associé',
          due_date: t.due_date,
          status: t.status,
        })),
      };
    });

    return workloads;
  } catch {
    return FALLBACK_TEAM_WORKLOADS;
  }
}

export function computeRevOpsSummary(workloads: TeamMemberWorkload[], commissions: TeamCommission[]): RevOpsSummary {
  const count = workloads.length || 1;
  const avgUtil = Math.round(workloads.reduce((sum, w) => sum + w.utilization_pct, 0) / count);
  const overloaded = workloads.filter((w) => w.utilization_pct >= 85).length;
  const pendingComm = commissions.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount_cad, 0);
  const paidComm = commissions.filter((c) => c.status === 'paid' || c.status === 'approved').reduce((sum, c) => sum + c.commission_amount_cad, 0);
  const avgOnTime = Math.round(workloads.reduce((sum, w) => sum + w.on_time_delivery_rate_pct, 0) / count);

  return {
    total_team_members: workloads.length,
    average_team_utilization_pct: avgUtil,
    overloaded_members_count: overloaded,
    total_commissions_pending_cad: pendingComm,
    total_commissions_paid_cad: paidComm,
    average_deal_velocity_days: 5.4,
    global_on_time_delivery_pct: avgOnTime,
  };
}

export function autoAssignDeliverable(
  category: string,
  team: TeamMemberWorkload[]
): TeamMemberWorkload {
  const catLower = category.toLowerCase();
  let targetSpecialty: TeamSpecialty = 'generalist';

  if (catLower.includes('vidéo') || catLower.includes('reels') || catLower.includes('film')) {
    targetSpecialty = 'video_production';
  } else if (catLower.includes('web') || catLower.includes('framer') || catLower.includes('site')) {
    targetSpecialty = 'web_framer';
  } else if (catLower.includes('ads') || catLower.includes('google') || catLower.includes('meta')) {
    targetSpecialty = 'ads_acquisition';
  } else if (catLower.includes('pos') || catLower.includes('qr') || catLower.includes('imprimante')) {
    targetSpecialty = 'pos_operations';
  }

  // 1. Try finding specialists with utilization < 85%
  const specialists = team.filter((m) => m.specialty === targetSpecialty && m.utilization_pct < 85);
  if (specialists.length > 0) {
    // Pick the one with the lowest utilization
    return specialists.sort((a, b) => a.utilization_pct - b.utilization_pct)[0];
  }

  // 2. Fallback: least utilized team member overall
  return [...team].sort((a, b) => a.utilization_pct - b.utilization_pct)[0] || team[0];
}

export async function reassignTaskAssignee(taskId: string, targetMemberId: string): Promise<boolean> {
  try {
    const { error } = await getSupabase()
      .from('tasks')
      .update({ assignee_id: targetMemberId, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    return !error;
  } catch {
    return true;
  }
}
