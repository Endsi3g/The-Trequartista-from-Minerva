import { NextResponse } from 'next/server';
import { withSupabaseRouteHandler } from '@/lib/supabase/server-auth';
import {
  fetchTeamWorkloads,
  fetchTeamCommissions,
  computeRevOpsSummary,
  reassignTaskAssignee,
} from '@/lib/services/revops-team';

export const dynamic = 'force-dynamic';

export const GET = withSupabaseRouteHandler(
  { auth: 'user', requiredRole: 'admin' },
  async () => {
    try {
      const [workloads, commissions] = await Promise.all([
        fetchTeamWorkloads(),
        fetchTeamCommissions(),
      ]);
      const summary = computeRevOpsSummary(workloads, commissions);

      return NextResponse.json({
        workloads,
        summary,
        commissions,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement RevOps workload';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
);

export const POST = withSupabaseRouteHandler(
  { auth: 'user', requiredRole: 'admin' },
  async (req) => {
    try {
      const body = await req.json();
      const { taskId, targetMemberId } = body;

      if (!taskId || !targetMemberId) {
        return NextResponse.json({ error: 'taskId et targetMemberId requis' }, { status: 400 });
      }

      const success = await reassignTaskAssignee(taskId, targetMemberId);
      return NextResponse.json({ success });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réattribution tâche';
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
);
