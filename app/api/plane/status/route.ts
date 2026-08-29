import { NextResponse } from 'next/server';
import { checkPlaneHealth, fetchPlaneIssues, fetchPlaneCycles, fetchPlaneModules, getPlaneConfig } from '@/lib/services/plane';
import { fetchPlaneSyncLogs, fetchTasks } from '@/lib/services/supabase-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getPlaneConfig();

  if (!config.isConfigured) {
    const logs = await fetchPlaneSyncLogs(10);
    return NextResponse.json({
      configured: false,
      baseUrl: config.baseUrl,
      workspaceSlug: config.workspaceSlug,
      projectId: config.projectId,
      message: 'Plane non configuré dans les variables d’environnement (.env.local).',
      totalIssues: 0,
      syncedTasksCount: 0,
      activeCyclesCount: 0,
      activeModulesCount: 0,
      latencyMs: 0,
      logs,
    });
  }

  const [health, issues, cycles, modules, tasks, logs] = await Promise.all([
    checkPlaneHealth(),
    fetchPlaneIssues({ limit: 100 }),
    fetchPlaneCycles(),
    fetchPlaneModules(),
    fetchTasks(),
    fetchPlaneSyncLogs(15),
  ]);

  const syncedCount = tasks.filter((t) => t.plane_issue_id).length;

  return NextResponse.json({
    configured: true,
    ok: health.ok,
    message: health.message,
    baseUrl: config.baseUrl,
    workspaceSlug: config.workspaceSlug,
    projectId: config.projectId,
    totalIssues: issues.length,
    syncedTasksCount: syncedCount,
    totalTasksCount: tasks.length,
    activeCyclesCount: cycles.length,
    activeModulesCount: modules.length,
    latencyMs: health.latencyMs,
    issues: issues.slice(0, 30),
    cycles,
    modules,
    logs,
  });
}
