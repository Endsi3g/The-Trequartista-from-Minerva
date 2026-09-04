// ============================================================================
// Minerva RevOps & Team Workload Balancing Engine
// Real-time capacity computation and task assignment based on Supabase data
// ============================================================================

import { getSupabase } from '@/lib/supabase/client';
import type {
  TeamMemberWorkload,
  TeamCommission,
  RevOpsSummary,
  TeamSpecialty,
  Task,
} from '@/lib/types';
import { fetchTasks } from '@/lib/services/supabase-data';

export const DEFAULT_WEEKLY_CAPACITY_HOURS = 35;
export const DEFAULT_TASK_ESTIMATED_HOURS = 4.0;
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

export const CORE_OFFICIAL_TEAM = [
  {
    email: 'kbelceus776@gmail.com',
    full_name: 'Kael Belceus',
    role: 'admin',
    department: 'Direction & Architecture',
    job_title: 'Fondateur & Lead Architect',
    specialty: 'web_framer' as TeamSpecialty,
  },
  {
    email: 'byeh50230@gmail.com',
    full_name: 'Manpreet Singh',
    role: 'member',
    department: 'Growth & Vidéo',
    job_title: 'Associé Growth & Studio',
    specialty: 'video_production' as TeamSpecialty,
  },
  {
    email: 'rayanmohellebi2009@gmail.com',
    full_name: 'Rayan',
    role: 'member',
    department: 'Ventes & Closing',
    job_title: 'Associé Ventes & Outbound',
    specialty: 'ads_acquisition' as TeamSpecialty,
  },
  {
    email: 'samade3434@gmail.com',
    full_name: 'Samuel Olamide Adeleke',
    role: 'member',
    department: 'Tech & Systèmes',
    job_title: 'Ingénieur Full-Stack',
    specialty: 'web_framer' as TeamSpecialty,
  },
  {
    email: 'karroubiamine@hotmail.com',
    full_name: 'Amine Yahya Karroubi',
    role: 'member',
    department: 'Opérations & Client Success',
    job_title: 'Account Manager Lead',
    specialty: 'pos_operations' as TeamSpecialty,
  },
];

export async function fetchTeamWorkloads(): Promise<TeamMemberWorkload[]> {
  try {
    const supabase = getSupabase();
    const [{ data: rawProfiles }, tasks] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url, approved')
        .order('full_name', { ascending: true }),
      fetchTasks(),
    ]);

    const todayStr = new Date().toISOString().slice(0, 10);
    const profiles = rawProfiles || [];

    // Map strictly to the 5 official core members
    const workloads: TeamMemberWorkload[] = CORE_OFFICIAL_TEAM.map((official, idx) => {
      // Find matching DB profile by email or full_name
      const matched = profiles.find((p) => {
        const pEmail = (p.email || '').toLowerCase().trim();
        const pName = (p.full_name || '').toLowerCase().trim();
        const oEmail = official.email.toLowerCase();
        const oName = official.full_name.toLowerCase();

        if (pEmail === oEmail) return true;
        if (oName === 'rayan' && (pName === 'rayan' || pName.startsWith('rayan '))) return true;
        if (pName.includes(oName) || oName.includes(pName)) {
          // Guard against Kael duplicate emails
          if (oEmail === 'kbelceus776@gmail.com' && pEmail && pEmail !== 'kbelceus776@gmail.com') return false;
          return true;
        }
        return false;
      });

      const memberId = matched?.id || `official-${idx + 1}`;
      const fullName = official.full_name;
      const email = matched?.email || official.email;
      const avatarUrl = matched?.avatar_url || null;

      const mine = tasks.filter(
        (t: Task) => t.assignee_id === memberId || (matched?.id && t.assignee_id === matched.id)
      );
      const todo = mine.filter((t: Task) => t.status === 'todo').length;
      const inProg = mine.filter((t: Task) => t.status === 'in_progress').length;
      const done = mine.filter((t: Task) => t.status === 'done').length;
      const activeTasksCount = todo + inProg;
      const overdue = mine.filter((t: Task) => t.status !== 'done' && t.due_date && t.due_date < todayStr).length;

      const assignedHours = activeTasksCount * DEFAULT_TASK_ESTIMATED_HOURS;
      const utilPct = Math.min(100, Math.round((assignedHours / DEFAULT_WEEKLY_CAPACITY_HOURS) * 100));

      return {
        member_id: memberId,
        full_name: fullName,
        email: email,
        specialty: official.specialty,
        total_tasks: mine.length,
        todo_tasks: todo,
        in_progress_tasks: inProg,
        done_tasks: done,
        overdue_tasks: overdue,
        assigned_hours: assignedHours,
        capacity_hours: DEFAULT_WEEKLY_CAPACITY_HOURS,
        utilization_pct: utilPct,
        on_time_delivery_rate_pct:
          mine.length === 0 ? 100 : overdue === 0 ? 100 : Math.max(0, Math.round(((mine.length - overdue) / mine.length) * 100)),
        total_commissions_earned_cad: 0.0,
        active_deliverables: mine
          .filter((t) => t.status !== 'done')
          .slice(0, 4)
          .map((t: Task) => ({
            id: t.id,
            title: t.title,
            client_name: 'Projet Assigné',
            due_date: t.due_date,
            status: t.status,
          })),
      };
    });

    return workloads;
  } catch (err) {
    console.warn('[RevOpsTeam] Error fetching real workloads:', err);
    return [];
  }
}

export function computeRevOpsSummary(workloads: TeamMemberWorkload[], commissions: TeamCommission[] = []): RevOpsSummary {
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
    average_deal_velocity_days: 4.8,
    global_on_time_delivery_pct: avgOnTime,
  };
}

export async function reassignTaskAssignee(taskId: string, targetMemberId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', targetMemberId)
      .maybeSingle();

    const { error } = await supabase
      .from('tasks')
      .update({
        assignee_id: targetMemberId,
        assignee_name: targetProfile?.full_name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    return !error;
  } catch {
    return false;
  }
}

export async function fetchTeamCommissions(): Promise<TeamCommission[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('team_commissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data as TeamCommission[];
    }
  } catch {}
  return [];
}
