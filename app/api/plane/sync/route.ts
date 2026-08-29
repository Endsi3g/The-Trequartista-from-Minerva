import { NextResponse } from 'next/server';
import { syncAllTasksWithPlane, syncTaskToPlane, getPlaneConfig } from '@/lib/services/plane';
import { fetchTasks, fetchTask } from '@/lib/services/supabase-data';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const config = getPlaneConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: 'Plane n’est pas configuré sur ce serveur (clés d’environnement manquantes).' },
      { status: 400 }
    );
  }

  try {
    let body: { taskId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed for full sync
    }

    if (body.taskId) {
      // Sync single task
      const task = await fetchTask(body.taskId);
      if (!task) {
        return NextResponse.json({ error: `Tâche #${body.taskId} introuvable.` }, { status: 404 });
      }
      const res = await syncTaskToPlane(task);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Échec de synchronisation.' }, { status: 500 });
      }
      return NextResponse.json(res);
    }

    // Full sync of all tasks
    const tasks = await fetchTasks();
    const result = await syncAllTasksWithPlane(tasks);

    return NextResponse.json({
      success: true,
      message: `${result.synced} tâches synchronisées sur ${result.total}.`,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne de synchronisation';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
