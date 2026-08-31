import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import type { Task, PlaneIssue, PlaneCycle, PlaneModule, PlaneState, PlaneSyncStats } from '@/lib/types';
import { logPlaneSyncEvent, updateTaskPlaneMeta } from '@/lib/services/supabase-data';

// Lazily get Supabase admin client for server-side webhook/background sync
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface PlaneConfig {
  isConfigured: boolean;
  baseUrl: string;
  apiKey: string;
  workspaceSlug: string;
  projectId: string;
  webhookSecret: string;
}

export function getPlaneConfig(): PlaneConfig {
  const baseUrl = (process.env.PLANE_BASE_URL || 'https://plane.minerva.agency').replace(/\/+$/, '');
  const apiKey = process.env.PLANE_API_KEY || '';
  const workspaceSlug = process.env.PLANE_WORKSPACE_SLUG || 'minerva';
  const projectId = process.env.PLANE_PROJECT_ID || '';
  const webhookSecret = process.env.PLANE_WEBHOOK_SECRET || '';

  const isConfigured = Boolean(apiKey && workspaceSlug && projectId);

  return {
    isConfigured,
    baseUrl,
    apiKey,
    workspaceSlug,
    projectId,
    webhookSecret,
  };
}

/**
 * Perform an authenticated HTTP request to the Plane REST API.
 */
async function planeFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const config = getPlaneConfig();
  if (!config.isConfigured) {
    return { data: null, error: 'Plane API non configurée (.env.local)', status: 400 };
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${config.baseUrl}/api/v1/workspaces/${config.workspaceSlug}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch {
        const text = await res.text();
        if (text) errorDetail = text;
      }
      return { data: null, error: errorDetail, status: res.status };
    }

    if (res.status === 204) {
      return { data: null, error: null, status: 204 };
    }

    const data = await res.json();
    return { data, error: null, status: res.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réseau inconnue';
    return { data: null, error: msg, status: 500 };
  }
}

/**
 * Health check & status verification of the Plane instance.
 */
export async function checkPlaneHealth(): Promise<{
  ok: boolean;
  message: string;
  latencyMs: number;
  config: PlaneConfig;
  stats?: Partial<PlaneSyncStats>;
}> {
  const config = getPlaneConfig();
  if (!config.isConfigured) {
    return {
      ok: false,
      message: 'Plane non configuré dans les variables d’environnement (.env.local).',
      latencyMs: 0,
      config,
    };
  }

  const start = Date.now();
  const { data, error, status } = await planeFetch(`/projects/${config.projectId}/`);
  const latencyMs = Date.now() - start;

  if (error || !data) {
    return {
      ok: false,
      message: `Impossible de contacter le projet Plane (${error || `HTTP ${status}`}).`,
      latencyMs,
      config,
    };
  }

  return {
    ok: true,
    message: 'Connecté avec succès à l’instance Plane.',
    latencyMs,
    config,
  };
}

/**
 * Fetch available workflow states for the configured Plane project.
 */
export async function fetchPlaneStates(): Promise<PlaneState[]> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return [];

  const { data, error } = await planeFetch<PlaneState[] | { results?: PlaneState[] }>(
    `/projects/${config.projectId}/states/`
  );

  if (error || !data) {
    console.warn('[Plane] Error fetching states:', error);
    return [];
  }

  if (Array.isArray(data)) return data;
  if ('results' in data && Array.isArray(data.results)) return data.results;
  return [];
}

/**
 * Fetch issues from the master Plane project.
 */
export async function fetchPlaneIssues(options: {
  stateGroup?: string;
  priority?: string;
  limit?: number;
} = {}): Promise<PlaneIssue[]> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return [];

  const queryParams = new URLSearchParams();
  if (options.limit) queryParams.set('per_page', String(options.limit));
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const { data, error } = await planeFetch<PlaneIssue[] | { results?: PlaneIssue[] }>(
    `/projects/${config.projectId}/issues/${queryString}`
  );

  if (error || !data) {
    console.warn('[Plane] Error fetching issues:', error);
    return [];
  }

  const list = Array.isArray(data) ? data : (data.results || []);
  return list;
}

/**
 * Fetch active and upcoming sprint cycles from Plane.
 */
export async function fetchPlaneCycles(): Promise<PlaneCycle[]> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return [];

  const { data, error } = await planeFetch<PlaneCycle[] | { results?: PlaneCycle[] }>(
    `/projects/${config.projectId}/cycles/`
  );

  if (error || !data) {
    console.warn('[Plane] Error fetching cycles:', error);
    return [];
  }

  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Fetch modules (epics / feature roadmaps) from Plane.
 */
export async function fetchPlaneModules(): Promise<PlaneModule[]> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return [];

  const { data, error } = await planeFetch<PlaneModule[] | { results?: PlaneModule[] }>(
    `/projects/${config.projectId}/modules/`
  );

  if (error || !data) {
    console.warn('[Plane] Error fetching modules:', error);
    return [];
  }

  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Priority mapping helper between Minerva and Plane
 */
export function mapMinervaPriorityToPlane(priority: Task['priority']): 'urgent' | 'high' | 'medium' | 'low' | 'none' {
  switch (priority) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'none';
  }
}

export function mapPlanePriorityToMinerva(priority?: string): Task['priority'] {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 'urgent';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
    case 'none':
    default:
      return 'low';
  }
}

/**
 * Create a new Issue in the master Plane project.
 */
export async function createPlaneIssue(params: {
  name: string;
  description_html?: string;
  priority?: Task['priority'];
  state_id?: string;
  label_ids?: string[];
  target_date?: string | null;
}): Promise<PlaneIssue | null> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return null;

  const payload = {
    name: params.name,
    description_html: params.description_html || `<p>${params.name}</p>`,
    priority: mapMinervaPriorityToPlane(params.priority || 'medium'),
    state_id: params.state_id,
    label_ids: params.label_ids || [],
    target_date: params.target_date || undefined,
  };

  const { data, error } = await planeFetch<PlaneIssue>(`/projects/${config.projectId}/issues/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (error || !data) {
    console.error('[Plane] Failed to create issue:', error);
    await logPlaneSyncEvent({
      action: 'push_task',
      status: 'error',
      payload,
      error_message: error || 'Failed to create Plane issue',
    });
    return null;
  }

  return data;
}

/**
 * Update an existing Issue in Plane.
 */
export async function updatePlaneIssue(
  issueId: string,
  params: Partial<{
    name: string;
    description_html: string;
    priority: Task['priority'];
    state_id: string;
    target_date: string | null;
  }>
): Promise<PlaneIssue | null> {
  const config = getPlaneConfig();
  if (!config.isConfigured) return null;

  const payload: Record<string, unknown> = {};
  if (params.name !== undefined) payload.name = params.name;
  if (params.description_html !== undefined) payload.description_html = params.description_html;
  if (params.priority !== undefined) payload.priority = mapMinervaPriorityToPlane(params.priority);
  if (params.state_id !== undefined) payload.state_id = params.state_id;
  if (params.target_date !== undefined) payload.target_date = params.target_date;

  const { data, error } = await planeFetch<PlaneIssue>(`/projects/${config.projectId}/issues/${issueId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  if (error || !data) {
    console.error('[Plane] Failed to update issue:', error);
    await logPlaneSyncEvent({
      action: 'push_task',
      status: 'error',
      plane_issue_id: issueId,
      payload,
      error_message: error || 'Failed to update Plane issue',
    });
    return null;
  }

  return data;
}

/**
 * Synchronize a single Minerva Task to Plane.
 * If the task is already linked (plane_issue_id), updates it; otherwise creates a new issue.
 */
export async function syncTaskToPlane(task: Task): Promise<{
  success: boolean;
  plane_issue_id?: string;
  plane_sequence_id?: string;
  error?: string;
}> {
  const config = getPlaneConfig();
  if (!config.isConfigured) {
    return { success: false, error: 'Plane non configuré' };
  }

  try {
    const states = await fetchPlaneStates();
    // Resolve appropriate state ID according to task.status ('todo' | 'in_progress' | 'done')
    let stateId: string | undefined;
    if (task.status === 'done') {
      stateId = states.find((s) => s.group === 'completed')?.id;
    } else if (task.status === 'in_progress') {
      stateId = states.find((s) => s.group === 'started')?.id;
    } else {
      stateId = states.find((s) => s.group === 'unstarted' || s.group === 'backlog')?.id;
    }

    const descriptionHtml = task.description
      ? `<p>${task.description.replace(/\n/g, '<br/>')}</p>`
      : `<p>Tâche synchronisée depuis Minerva (${task.client_name || task.project_name || 'Général'})</p>`;

    if (task.plane_issue_id) {
      // Update existing issue
      const updated = await updatePlaneIssue(task.plane_issue_id, {
        name: task.title,
        description_html: descriptionHtml,
        priority: task.priority,
        state_id: stateId,
        target_date: task.due_date,
      });

      if (!updated) {
        return { success: false, error: 'Erreur lors de la mise à jour sur Plane' };
      }

      await updateTaskPlaneMeta(task.id, {
        plane_last_synced_at: new Date().toISOString(),
        plane_sync_status: 'synced',
        plane_state_id: stateId,
      });

      await logPlaneSyncEvent({
        action: 'push_task',
        status: 'success',
        task_id: task.id,
        plane_issue_id: task.plane_issue_id,
        payload: { title: task.title, status: task.status, priority: task.priority },
      });

      return {
        success: true,
        plane_issue_id: task.plane_issue_id,
        plane_sequence_id: task.plane_sequence_id || undefined,
      };
    } else {
      // Create new issue in Plane
      const created = await createPlaneIssue({
        name: task.title,
        description_html: descriptionHtml,
        priority: task.priority,
        state_id: stateId,
        target_date: task.due_date,
      });

      if (!created) {
        return { success: false, error: 'Erreur lors de la création du ticket sur Plane' };
      }

      const seqId = created.sequence_id ? `OPS-${created.sequence_id}` : undefined;

      await updateTaskPlaneMeta(task.id, {
        plane_issue_id: created.id,
        plane_sequence_id: seqId,
        plane_state_id: created.state_id,
        plane_last_synced_at: new Date().toISOString(),
        plane_sync_status: 'synced',
      });

      await logPlaneSyncEvent({
        action: 'push_task',
        status: 'success',
        task_id: task.id,
        plane_issue_id: created.id,
        payload: { title: task.title, sequence: seqId },
      });

      return {
        success: true,
        plane_issue_id: created.id,
        plane_sequence_id: seqId,
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur de synchronisation';
    await logPlaneSyncEvent({
      action: 'push_task',
      status: 'error',
      task_id: task.id,
      error_message: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
}

/**
 * Batch synchronize all Minerva tasks with Plane.
 */
export async function syncAllTasksWithPlane(tasks: Task[]): Promise<{
  total: number;
  synced: number;
  failed: number;
  results: Array<{ taskId: string; title: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ taskId: string; title: string; success: boolean; error?: string }> = [];
  let synced = 0;
  let failed = 0;

  for (const task of tasks) {
    const res = await syncTaskToPlane(task);
    if (res.success) {
      synced++;
      results.push({ taskId: task.id, title: task.title, success: true });
    } else {
      failed++;
      results.push({ taskId: task.id, title: task.title, success: false, error: res.error });
    }
  }

  await logPlaneSyncEvent({
    action: 'manual_sync',
    status: failed === 0 ? 'success' : 'error',
    payload: { total: tasks.length, synced, failed },
  });

  return {
    total: tasks.length,
    synced,
    failed,
    results,
  };
}

/**
 * Verifies Plane Webhook Signature in constant-time.
 */
export function verifyPlaneWebhookSignature(signatureHeader: string | null | undefined): boolean {
  const secret = process.env.PLANE_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signatureHeader) return false;

  const bufHeader = Buffer.from(signatureHeader);
  const bufSecret = Buffer.from(secret);

  if (bufHeader.length !== bufSecret.length) return false;
  return timingSafeEqual(bufHeader, bufSecret);
}

/**
 * Handle incoming Webhook events from Plane.
 */
export async function handlePlaneWebhookPayload(
  payload: Record<string, unknown>,
  signatureHeader?: string | null
): Promise<{ success: boolean; action: string; message: string }> {
  // Validate signature if secret is configured
  if (process.env.PLANE_WEBHOOK_SECRET) {
    const isValid = verifyPlaneWebhookSignature(signatureHeader);
    if (!isValid) {
      await logPlaneSyncEvent({
        action: 'pull_webhook',
        status: 'error',
        error_message: 'Signature webhook Plane invalide',
      });
      return { success: false, action: 'auth_failed', message: 'Signature invalide' };
    }
  }

  const eventType = (payload.event_type || payload.action || 'unknown') as string;
  const issueData = (payload.data || payload.issue || payload) as Record<string, unknown>;
  const planeIssueId = (issueData.id || payload.id) as string | undefined;

  if (!planeIssueId) {
    return { success: false, action: eventType, message: 'Identifiant d’issue Plane manquant' };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, action: eventType, message: 'Supabase admin non configuré' };
  }

  try {
    if (eventType.includes('issue.create') || eventType.includes('issue.update')) {
      const issueTitle = (issueData.name || issueData.title) as string | undefined;
      const issuePriority = issueData.priority as string | undefined;
      const stateGroup = ((issueData.state_detail as Record<string, unknown>)?.group || issueData.state_group) as string | undefined;

      let mappedStatus: Task['status'] = 'todo';
      if (stateGroup === 'completed') {
        mappedStatus = 'done';
      } else if (stateGroup === 'started') {
        mappedStatus = 'in_progress';
      }

      // Check if a task exists with this plane_issue_id
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('plane_issue_id', planeIssueId)
        .maybeSingle();

      if (existingTask) {
        // Update existing task
        await supabase
          .from('tasks')
          .update({
            title: issueTitle || existingTask.title,
            status: mappedStatus,
            priority: mapPlanePriorityToMinerva(issuePriority),
            plane_last_synced_at: new Date().toISOString(),
            plane_sync_status: 'synced',
          })
          .eq('id', existingTask.id);

        await logPlaneSyncEvent({
          action: 'pull_webhook',
          status: 'success',
          task_id: existingTask.id,
          plane_issue_id: planeIssueId,
          payload: { eventType, updatedStatus: mappedStatus },
        });

        return { success: true, action: 'task_updated', message: `Tâche #${existingTask.id} mise à jour depuis Plane` };
      } else {
        // Create new task in Minerva from Plane issue
        const { data: createdTask, error: insertError } = await supabase
          .from('tasks')
          .insert([
            {
              title: issueTitle || 'Nouvelle tâche Plane',
              status: mappedStatus,
              priority: mapPlanePriorityToMinerva(issuePriority),
              plane_issue_id: planeIssueId,
              plane_sequence_id: issueData.sequence_id ? `OPS-${issueData.sequence_id}` : undefined,
              plane_last_synced_at: new Date().toISOString(),
              plane_sync_status: 'synced',
            },
          ])
          .select('id')
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        await logPlaneSyncEvent({
          action: 'pull_webhook',
          status: 'success',
          task_id: createdTask?.id,
          plane_issue_id: planeIssueId,
          payload: { eventType, createdTitle: issueTitle },
        });

        return { success: true, action: 'task_created', message: `Tâche #${createdTask?.id} créée depuis Plane` };
      }
    } else if (eventType.includes('issue.delete')) {
      // Mark sync status as unlinked or remove
      await supabase
        .from('tasks')
        .update({
          plane_sync_status: 'unlinked',
          plane_last_synced_at: new Date().toISOString(),
        })
        .eq('plane_issue_id', planeIssueId);

      await logPlaneSyncEvent({
        action: 'pull_webhook',
        status: 'success',
        plane_issue_id: planeIssueId,
        payload: { eventType },
      });

      return { success: true, action: 'task_unlinked', message: 'Tâche déliée suite à suppression dans Plane' };
    }

    return { success: true, action: eventType, message: 'Événement Webhook traité sans modification' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur interne de webhook';
    await logPlaneSyncEvent({
      action: 'pull_webhook',
      status: 'error',
      plane_issue_id: planeIssueId,
      error_message: msg,
    });
    return { success: false, action: eventType, message: msg };
  }
}
