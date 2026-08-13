import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, Project, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost, AuditLog, Lead, ClientInvite, ClientMessage, ClientPaymentLink, TeamInvite, Task, TaskComment, TaskSubitem, ChangelogEntry, IntakeLead, Audit, AuditWithFindings, AuditProcessStep, AuditCostItem, AuditToolFinding, AuditInitiative, AuditInitiativeReaction, AuditComment, RoleHourlyRate, ToolCompatibilityEntry, Proposal } from '@/lib/types';
import { INITIAL_LAUNCH_CHECKITEMS } from '@/lib/mock-data';

function getSupabase() {
  return createClient();
}

/**
 * Wraps any promise with a max timeout so that slow or blocked database
 * queries never hang the UI in an infinite loading state.
 */
function withTimeout<T>(promiseLike: PromiseLike<T>, fallback: T, ms = 4000): Promise<T> {
  const promise = Promise.resolve(promiseLike);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[Supabase] Query timed out after ${ms}ms — returning fallback.`);
      resolve(fallback);
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.warn('[Supabase] Query threw error:', err);
        resolve(fallback);
      });
  });
}

// ----------------------------------------------------
// 1. CLIENTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClients(): Promise<Client[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching clients:', error);
        return [];
      }
      return data as Client[];
    })(),
    []
  );
}

export async function addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> {
  const { data, error } = await getSupabase().from('clients').insert([client]).select().single();
  if (error) {
    console.error('[Supabase] Error adding client:', error);
    return null;
  }
  return data as Client;
}

// ----------------------------------------------------
// 2. CLIENT ROI METRICS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClientRoiMetrics(clientId: string): Promise<ClientRoiMetrics | null> {
  if (!clientId) return null;

  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_roi_metrics')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }
      return data as ClientRoiMetrics;
    })(),
    null
  );
}

// ----------------------------------------------------
// 3. PROJECTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchProjects(): Promise<Project[]> {
  return withTimeout(
    (async () => {
      // projects has no client_name column of its own -- the real name
      // lives on clients and must be joined, or every project silently
      // falls back to the generic "Client Minerva" placeholder forever.
      const { data, error } = await getSupabase()
        .from('projects')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching projects:', error);
        return [];
      }

      return data.map((p: Record<string, unknown>) => ({
        ...p,
        client_name: (p.client as { name?: string } | null)?.name || 'Client Minerva',
        assignees: p.assignees || [],
      })) as Project[];
    })(),
    []
  );
}

export async function addProject(project: {
  client_id: string;
  name: string;
  current_stage: Project['current_stage'];
  health: Project['health'];
  due_date: string;
}): Promise<Project | null> {
  const { data, error } = await getSupabase()
    .from('projects')
    .insert([{ ...project, progress_pct: 0 }])
    .select('*, client:clients(name)')
    .single();

  if (error || !data) {
    console.error('[Supabase] Error adding project:', error);
    return null;
  }
  const row = data as Record<string, unknown>;
  return {
    ...row,
    client_name: (row.client as { name?: string } | null)?.name || 'Client Minerva',
    assignees: [],
  } as unknown as Project;
}

export async function updateProjectStage(projectId: string, currentStage: Project['current_stage']): Promise<boolean> {
  const { error } = await getSupabase().from('projects').update({ current_stage: currentStage }).eq('id', projectId);
  if (error) {
    console.error('[Supabase] Error updating project stage:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 4. LAUNCH CHECKLIST 20-POINTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchLaunchChecklist(projectId: string): Promise<LaunchCheckItem[]> {
  if (!projectId) return INITIAL_LAUNCH_CHECKITEMS;

  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('project_launch_checks')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error || !data || !data.check_items) {
        return INITIAL_LAUNCH_CHECKITEMS;
      }

      return data.check_items as LaunchCheckItem[];
    })(),
    INITIAL_LAUNCH_CHECKITEMS
  );
}

export async function saveLaunchChecklist(projectId: string, items: LaunchCheckItem[]): Promise<boolean> {
  const checkedCount = items.filter((i) => i.checked).length;
  const scorePct = Math.round((checkedCount / items.length) * 100);

  const { error } = await getSupabase()
    .from('project_launch_checks')
    .upsert(
      {
        project_id: projectId,
        score_pct: scorePct,
        check_items: items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id' }
    );

  if (error) {
    console.error('[Supabase] Error saving checklist:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 5. TEAM & 1-ON-1s DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchTeamMemberPerformance(profileId: string): Promise<TeamMemberPerformance | null> {
  return withTimeout(
    (async () => {
      const supabase = getSupabase();
      const [{ data: profile }, { data: review }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role, avatar_url').eq('id', profileId).maybeSingle(),
        supabase.from('team_performance_reviews').select('*').eq('profile_id', profileId).maybeSingle(),
      ]);

      if (!profile) return null;

      return {
        id: review?.id ?? profile.id,
        profile_id: profile.id,
        full_name: profile.full_name || 'Membre Minerva',
        role: profile.role || 'member',
        avatar_url:
          profile.avatar_url ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.full_name || 'MV')}&backgroundColor=1c9a6f&fontColor=ffffff`,
        next_1on1_date: review?.next_1on1_date || '',
        okrs: review?.okrs || [],
        skills: review?.skills || [],
        feedbacks_count: review?.feedbacks_count || 0,
      };
    })(),
    null
  );
}

export async function updateNext1on1Date(profileId: string, date: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('team_performance_reviews')
    .upsert({ profile_id: profileId, next_1on1_date: date }, { onConflict: 'profile_id' });

  if (error) {
    console.error('[Supabase] Error updating next 1-on-1 date:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 6. ACADEMY SOPs DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchAcademySops(): Promise<AcademySOP[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('academy_sops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching SOPs:', error);
        return [];
      }

      return data as AcademySOP[];
    })(),
    []
  );
}

export async function fetchCompletedSopIds(userId: string): Promise<string[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('sop_completions').select('sop_id').eq('user_id', userId);
      if (error || !data) return [];
      return data.map((r) => r.sop_id as string);
    })(),
    []
  );
}

export async function markSopCompleted(userId: string, sopId: string): Promise<boolean> {
  const { error } = await getSupabase().from('sop_completions').insert([{ user_id: userId, sop_id: sopId }]);
  if (error) {
    console.error('[Supabase] Error marking SOP complete:', error);
    return false;
  }
  return true;
}

export async function unmarkSopCompleted(userId: string, sopId: string): Promise<boolean> {
  const { error } = await getSupabase().from('sop_completions').delete().eq('user_id', userId).eq('sop_id', sopId);
  if (error) {
    console.error('[Supabase] Error unmarking SOP complete:', error);
    return false;
  }
  return true;
}

export async function fetchAcademySop(id: string): Promise<AcademySOP | null> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('academy_sops').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as AcademySOP;
    })(),
    null
  );
}

export async function addAcademySop(sop: Omit<AcademySOP, 'id'>): Promise<AcademySOP | null> {
  const { data, error } = await getSupabase().from('academy_sops').insert([sop]).select().single();
  if (error) {
    console.error('[Supabase] Error adding SOP:', error);
    return null;
  }
  return data as AcademySOP;
}

// ----------------------------------------------------
// 7. AUDIT LOGS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) {
        console.warn('[Supabase] Could not fetch audit logs:', error);
        return [];
      }

      return data as AuditLog[];
    })(),
    []
  );
}

export async function logAuditEvent(
  action: string,
  tableName: string,
  recordId?: string,
  details: Record<string, unknown> = {},
  actorName = 'Utilisateur Minerva'
): Promise<AuditLog | null> {
  const { data, error } = await getSupabase()
    .from('audit_logs')
    .insert([
      {
        action,
        table_name: tableName,
        record_id: recordId,
        actor_name: actorName,
        details,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error writing audit log event:', error);
    return null;
  }

  return data as AuditLog;
}

// ----------------------------------------------------
// 8. LEADS CRM DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchLeads(clientId?: string): Promise<Lead[]> {
  return withTimeout(
    (async () => {
      let query = getSupabase().from('leads').select('*').order('created_at', { ascending: false });
      if (clientId && clientId !== 'all') {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('[Supabase] Could not fetch leads:', error);
        return [];
      }

      return data as Lead[];
    })(),
    []
  );
}

export async function addLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead | null> {
  const { data, error } = await getSupabase().from('leads').insert([lead]).select().single();
  if (error) {
    console.error('[Supabase] Error adding lead:', error);
    return null;
  }
  return data as Lead;
}

export async function updateLeadStatus(leadId: string, status: Lead['status'], stage?: string): Promise<boolean> {
  const payload: Record<string, unknown> = { status };
  if (stage) payload.stage = stage;
  const { error } = await getSupabase().from('leads').update(payload).eq('id', leadId);
  if (error) {
    console.error('[Supabase] Error updating lead status:', error);
    return false;
  }
  return true;
}

export async function updateLead(leadId: string, updates: Partial<Lead>): Promise<boolean> {
  const { error } = await getSupabase().from('leads').update(updates).eq('id', leadId);
  if (error) {
    console.error('[Supabase] Error updating lead:', error);
    return false;
  }
  return true;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const { error } = await getSupabase().from('leads').delete().eq('id', leadId);
  if (error) {
    console.error('[Supabase] Error deleting lead:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 9. CONTENT POSTS (REELS) DIRECT SUPABASE API
// ----------------------------------------------------
function mapContentPostRow(row: any): ContentPost {
  return {
    ...row,
    client_name: row.client?.name || 'Client',
    hashtags: row.hashtags || [],
    status_history: row.status_history || [],
  } as ContentPost;
}

export async function fetchContentPosts(): Promise<ContentPost[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('content_posts')
        .select('*, client:clients(name)')
        .order('scheduled_date', { ascending: true });

      if (error || !data) {
        console.warn('[Supabase] Error fetching content posts:', error);
        return [];
      }
      return data.map(mapContentPostRow);
    })(),
    []
  );
}

export async function fetchContentPost(id: string): Promise<ContentPost | null> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('content_posts')
        .select('*, client:clients(name)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return mapContentPostRow(data);
    })(),
    null
  );
}

export async function addContentPost(
  post: Omit<ContentPost, 'id' | 'client_name' | 'status_history' | 'created_at' | 'updated_at'>
): Promise<ContentPost | null> {
  const { data, error } = await getSupabase()
    .from('content_posts')
    .insert([post])
    .select('*, client:clients(name)')
    .single();

  if (error) {
    console.error('[Supabase] Error adding content post:', error);
    return null;
  }
  return mapContentPostRow(data);
}

export async function updateContentPost(id: string, updates: Partial<ContentPost>): Promise<boolean> {
  const { client_name: _client_name, status_history: _status_history, ...safeUpdates } = updates;
  const { error } = await getSupabase().from('content_posts').update(safeUpdates).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating content post:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 11. CLIENT PORTAL — INVITES DIRECT SUPABASE API
// ----------------------------------------------------
export async function createClientInvite(clientId: string, createdBy: string): Promise<ClientInvite | null> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await getSupabase()
    .from('client_invites')
    .insert([{ client_id: clientId, token, created_by: createdBy }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating client invite:', error);
    return null;
  }
  return data as ClientInvite;
}

export async function fetchInviteByToken(token: string): Promise<(ClientInvite & { client_name: string }) | null> {
  const { data, error } = await getSupabase()
    .from('client_invites')
    .select('*, client:clients(name)')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  return { ...data, client_name: (data as any).client?.name || 'Client' };
}

export async function redeemClientInvite(token: string, userId: string): Promise<string | null> {
  const invite = await fetchInviteByToken(token);
  if (!invite) return null;

  const supabase = getSupabase();
  const [{ error: profileError }, { error: inviteError }] = await Promise.all([
    supabase.from('profiles').update({ role: 'client', client_id: invite.client_id }).eq('id', userId),
    supabase.from('client_invites').update({ used_at: new Date().toISOString(), used_by: userId }).eq('token', token),
  ]);

  if (profileError || inviteError) {
    console.error('[Supabase] Error redeeming client invite:', profileError || inviteError);
    return null;
  }
  return invite.client_id;
}

// ----------------------------------------------------
// 12. CLIENT PORTAL — Q&A MESSAGES DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClientMessages(clientId: string): Promise<ClientMessage[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];
      return data as ClientMessage[];
    })(),
    []
  );
}

export async function sendClientMessage(
  clientId: string,
  senderId: string,
  senderRole: 'client' | 'team',
  body: string
): Promise<boolean> {
  const { error } = await getSupabase()
    .from('client_messages')
    .insert([{ client_id: clientId, sender_id: senderId, sender_role: senderRole, body }]);

  if (error) {
    console.error('[Supabase] Error sending client message:', error);
    return false;
  }
  return true;
}

export async function updateClientFocus(clientId: string, currentFocus: string): Promise<boolean> {
  const { error } = await getSupabase().from('clients').update({ current_focus: currentFocus }).eq('id', clientId);
  if (error) {
    console.error('[Supabase] Error updating client focus:', error);
    return false;
  }
  return true;
}

// ── 13. Push Notifications ─────────────────────────────────────────────────

export async function savePushSubscription(userId: string, sub: PushSubscriptionJSON): Promise<boolean> {
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  const { error } = await getSupabase().from('push_subscriptions').upsert(
    { user_id: userId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth_key: sub.keys.auth },
    { onConflict: 'endpoint' }
  );
  if (error) {
    console.warn('[Supabase] Error saving push subscription:', error);
    return false;
  }
  return true;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await getSupabase().from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) {
    console.warn('[Supabase] Error deleting push subscription:', error);
  }
}

// ── 14. Team Invites ─────────────────────────────────────────────────────────

export async function createTeamInvite(
  role: 'admin' | 'member',
  department: string | null,
  createdBy: string
): Promise<TeamInvite | null> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await getSupabase()
    .from('team_invites')
    .insert([{ token, role, department, created_by: createdBy }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating team invite:', error);
    return null;
  }
  return data as TeamInvite;
}

export async function fetchTeamInvites(): Promise<TeamInvite[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('team_invites')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) {
        console.warn('[Supabase] Error fetching team invites:', error);
        return [];
      }
      return data as TeamInvite[];
    })(),
    []
  );
}

export async function fetchTeamInviteByToken(token: string): Promise<TeamInvite | null> {
  const { data, error } = await getSupabase()
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data as TeamInvite;
}

export async function redeemTeamInvite(token: string, userId: string): Promise<boolean> {
  const invite = await fetchTeamInviteByToken(token);
  if (!invite) return false;

  const supabase = getSupabase();
  const profileUpdate: Record<string, unknown> = { role: invite.role };
  if (invite.department) profileUpdate.department = invite.department;

  const [{ error: profileError }, { error: inviteError }] = await Promise.all([
    supabase.from('profiles').update(profileUpdate).eq('id', userId),
    supabase.from('team_invites').update({ used_at: new Date().toISOString(), used_by: userId }).eq('token', token),
  ]);

  if (profileError || inviteError) {
    console.error('[Supabase] Error redeeming team invite:', profileError || inviteError);
    return false;
  }
  return true;
}

export async function revokeTeamInvite(inviteId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('team_invites')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', inviteId);
  if (error) {
    console.error('[Supabase] Error revoking team invite:', error);
    return false;
  }
  return true;
}

// ── 15. Stripe Payment Links ────────────────────────────────────────────────

export async function fetchClientPaymentLinks(): Promise<ClientPaymentLink[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_payment_links')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching client payment links:', error);
        return [];
      }
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        client_name: (row.client as { name?: string } | null)?.name,
      })) as ClientPaymentLink[];
    })(),
    []
  );
}

// ── 16. Task Delegation ─────────────────────────────────────────────────────

// tasks has two FKs into profiles (assignee_id, created_by), so the
// assignee embed must disambiguate which relationship to follow --
// PostgREST otherwise rejects the whole query as ambiguous.
const TASK_SELECT =
  '*, project:projects(name), client:clients(name), lead:leads(company_name, contact_name), assignee:profiles!tasks_assignee_id_fkey(full_name)';

function mapTaskRow(row: Record<string, unknown>): Task {
  const lead = row.lead as { company_name?: string; contact_name?: string } | null;
  return {
    ...row,
    project_name: (row.project as { name?: string } | null)?.name,
    client_name: (row.client as { name?: string } | null)?.name,
    lead_name: lead ? lead.company_name || lead.contact_name : undefined,
    assignee_name: (row.assignee as { full_name?: string } | null)?.full_name,
  } as Task;
}

export async function fetchTasks(): Promise<Task[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('tasks')
        .select(TASK_SELECT)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching tasks:', error);
        return [];
      }
      return data.map(mapTaskRow);
    })(),
    []
  );
}

export async function fetchTask(taskId: string): Promise<Task | null> {
  const { data, error } = await getSupabase().from('tasks').select(TASK_SELECT).eq('id', taskId).maybeSingle();
  if (error || !data) return null;
  return mapTaskRow(data);
}

export async function addTask(task: {
  title: string;
  description?: string | null;
  project_id?: string | null;
  client_id?: string | null;
  lead_id?: string | null;
  assignee_id?: string | null;
  created_by: string;
  due_date?: string | null;
}): Promise<Task | null> {
  const { data, error } = await getSupabase().from('tasks').insert([task]).select(TASK_SELECT).single();

  if (error) {
    console.error('[Supabase] Error adding task:', error);
    return null;
  }
  return mapTaskRow(data);
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<boolean> {
  const { error } = await getSupabase().from('tasks').update({ status }).eq('id', taskId);
  if (error) {
    console.error('[Supabase] Error updating task status:', error);
    return false;
  }
  return true;
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await getSupabase().from('tasks').delete().eq('id', taskId);
  if (error) {
    console.error('[Supabase] Error deleting task:', error);
    return false;
  }
  return true;
}

export async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('task_comments')
        .select('*, author:profiles(full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.warn('[Supabase] Error fetching task comments:', error);
        return [];
      }
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        author_name: (row.author as { full_name?: string } | null)?.full_name,
      })) as TaskComment[];
    })(),
    []
  );
}

export async function addTaskComment(taskId: string, authorId: string, body: string): Promise<boolean> {
  const { error } = await getSupabase().from('task_comments').insert([{ task_id: taskId, author_id: authorId, body }]);
  if (error) {
    console.error('[Supabase] Error adding task comment:', error);
    return false;
  }
  return true;
}

export async function fetchTaskSubitems(taskId: string): Promise<TaskSubitem[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('task_subitems')
        .select('*')
        .eq('task_id', taskId)
        .order('position', { ascending: true });
      if (error || !data) {
        console.warn('[Supabase] Error fetching task subitems:', error);
        return [];
      }
      return data as TaskSubitem[];
    })(),
    []
  );
}

export async function addTaskSubitem(taskId: string, title: string, position: number): Promise<boolean> {
  const { error } = await getSupabase().from('task_subitems').insert([{ task_id: taskId, title, position }]);
  if (error) {
    console.error('[Supabase] Error adding task subitem:', error);
    return false;
  }
  return true;
}

export async function toggleTaskSubitem(id: string, done: boolean): Promise<boolean> {
  const { error } = await getSupabase().from('task_subitems').update({ done }).eq('id', id);
  if (error) {
    console.error('[Supabase] Error toggling task subitem:', error);
    return false;
  }
  return true;
}

export async function deleteTaskSubitem(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('task_subitems').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting task subitem:', error);
    return false;
  }
  return true;
}

// ── 17. In-App Changelog ────────────────────────────────────────────────────

export async function fetchChangelogEntries(): Promise<ChangelogEntry[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('changelog_entries')
        .select('*, author:profiles(full_name)')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching changelog entries:', error);
        return [];
      }
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        author_name: (row.author as { full_name?: string } | null)?.full_name,
      })) as ChangelogEntry[];
    })(),
    []
  );
}

export async function addChangelogEntry(entry: {
  title: string;
  body: string;
  image_url?: string | null;
  created_by: string;
}): Promise<ChangelogEntry | null> {
  const { data, error } = await getSupabase().from('changelog_entries').insert([entry]).select().single();
  if (error) {
    console.error('[Supabase] Error adding changelog entry:', error);
    return null;
  }
  return data as ChangelogEntry;
}

// ── 18. Acquisition: Intake Leads ───────────────────────────────────────────

export async function fetchIntakeLeads(): Promise<IntakeLead[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('intake_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) {
        console.warn('[Supabase] Error fetching intake leads:', error);
        return [];
      }
      return data as IntakeLead[];
    })(),
    []
  );
}

export async function updateIntakeLead(id: string, updates: Partial<IntakeLead>): Promise<boolean> {
  const { error } = await getSupabase().from('intake_leads').update(updates).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating intake lead:', error);
    return false;
  }
  return true;
}

// ── 19. Acquisition: Audits ─────────────────────────────────────────────────

export async function fetchAudits(): Promise<Audit[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('audits')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) {
        console.warn('[Supabase] Error fetching audits:', error);
        return [];
      }
      return data as Audit[];
    })(),
    []
  );
}

export async function fetchAuditWithFindings(id: string): Promise<AuditWithFindings | null> {
  const supabase = getSupabase();
  const [
    { data: audit },
    { data: processSteps },
    { data: costItems },
    { data: toolFindings },
    { data: initiatives },
    { data: comments },
  ] = await Promise.all([
    supabase.from('audits').select('*').eq('id', id).maybeSingle(),
    supabase.from('audit_process_steps').select('*').eq('audit_id', id).order('sort_order'),
    supabase.from('audit_cost_items').select('*').eq('audit_id', id),
    supabase.from('audit_tool_findings').select('*').eq('audit_id', id),
    supabase.from('audit_initiatives').select('*').eq('audit_id', id).order('sort_order'),
    supabase.from('audit_comments').select('*').eq('audit_id', id).order('created_at'),
  ]);

  if (!audit) return null;

  const initiativeIds = (initiatives || []).map((i: { id: string }) => i.id);
  const { data: reactions } = initiativeIds.length
    ? await supabase.from('audit_initiative_reactions').select('*').in('initiative_id', initiativeIds)
    : { data: [] };

  return {
    ...(audit as Audit),
    process_steps: (processSteps || []) as AuditProcessStep[],
    cost_items: (costItems || []) as AuditCostItem[],
    tool_findings: (toolFindings || []) as AuditToolFinding[],
    initiatives: (initiatives || []) as AuditInitiative[],
    reactions: (reactions || []) as AuditInitiativeReaction[],
    comments: (comments || []) as AuditComment[],
  };
}

export async function createAudit(audit: {
  prospect_name: string;
  intake_lead_id?: string | null;
  client_id?: string | null;
  crm_lead_id?: string | null;
  created_by: string;
}): Promise<Audit | null> {
  const { data, error } = await getSupabase().from('audits').insert([audit]).select().single();
  if (error) {
    console.error('[Supabase] Error creating audit:', error);
    return null;
  }
  return data as Audit;
}

export async function updateAudit(id: string, updates: Partial<Audit>): Promise<boolean> {
  const { error } = await getSupabase().from('audits').update(updates).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating audit:', error);
    return false;
  }
  return true;
}

export async function updateAuditProcessStep(id: string, updates: Partial<AuditProcessStep>): Promise<boolean> {
  const { error } = await getSupabase().from('audit_process_steps').update(updates).eq('id', id);
  return !error;
}

export async function deleteAuditProcessStep(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('audit_process_steps').delete().eq('id', id);
  return !error;
}

export async function updateAuditCostItem(id: string, updates: Partial<AuditCostItem>): Promise<boolean> {
  const { error } = await getSupabase().from('audit_cost_items').update(updates).eq('id', id);
  return !error;
}

export async function deleteAuditCostItem(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('audit_cost_items').delete().eq('id', id);
  return !error;
}

export async function updateAuditToolFinding(id: string, updates: Partial<AuditToolFinding>): Promise<boolean> {
  const { error } = await getSupabase().from('audit_tool_findings').update(updates).eq('id', id);
  return !error;
}

export async function updateAuditInitiative(id: string, updates: Partial<AuditInitiative>): Promise<boolean> {
  const { error } = await getSupabase().from('audit_initiatives').update(updates).eq('id', id);
  return !error;
}

export async function deleteAuditInitiative(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('audit_initiatives').delete().eq('id', id);
  return !error;
}

// ── 20. Acquisition: Reference Data (rates & tool compatibility) ───────────

export async function fetchRoleHourlyRates(): Promise<RoleHourlyRate[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('role_hourly_rates').select('*').order('role_name');
      if (error || !data) return [];
      return data as RoleHourlyRate[];
    })(),
    []
  );
}

export async function upsertRoleHourlyRate(roleName: string, hourlyRateCad: number, updatedBy: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('role_hourly_rates')
    .upsert({ role_name: roleName, hourly_rate_cad: hourlyRateCad, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'role_name' });
  return !error;
}

export async function fetchToolCompatibilityDictionary(): Promise<ToolCompatibilityEntry[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('tool_compatibility_dictionary').select('*').order('tool_name');
      if (error || !data) return [];
      return data as ToolCompatibilityEntry[];
    })(),
    []
  );
}

export async function upsertToolCompatibilityEntry(entry: {
  tool_name: string;
  category?: string;
  has_rest_api?: boolean;
  has_graphql_api?: boolean;
  integration_feasibility?: ToolCompatibilityEntry['integration_feasibility'];
  api_notes?: string;
}): Promise<boolean> {
  const { error } = await getSupabase()
    .from('tool_compatibility_dictionary')
    .upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'tool_name' });
  return !error;
}

// ── 21. Acquisition: Proposals ──────────────────────────────────────────────

export async function fetchProposalsByAudit(auditId: string): Promise<Proposal[]> {
  const { data, error } = await getSupabase().from('proposals').select('*').eq('audit_id', auditId).order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Proposal[];
}

export async function fetchProposals(): Promise<Proposal[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('proposals').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as Proposal[];
    })(),
    []
  );
}

// ── 22. Acquisition: Telemetry ──────────────────────────────────────────────

export interface AcquisitionFunnelStats {
  totalIntakeLeads: number;
  step1Abandoned: number;
  qualified: number;
  smsSent: number;
  qualificationRatePct: number;
  totalAudits: number;
  auditsExtracted: number;
  totalProposals: number;
  proposalsSent: number;
  closeRatePct: number;
}

export async function fetchAcquisitionFunnelStats(): Promise<AcquisitionFunnelStats> {
  const [intakeLeads, audits, proposals] = await Promise.all([
    fetchIntakeLeads(),
    fetchAudits(),
    fetchProposals(),
  ]);

  const step1Abandoned = intakeLeads.filter((l) => l.status === 'step1_abandoned').length;
  const qualified = intakeLeads.filter((l) => l.status === 'qualified' || l.status === 'converted').length;
  const smsSent = intakeLeads.filter((l) => l.sms_follow_up_status === 'sent').length;
  const auditsExtracted = audits.filter((a) => a.status === 'extracted' || a.status === 'reviewed' || a.status === 'proposal_sent').length;
  const proposalsSent = proposals.filter((p) => p.status === 'sent').length;

  return {
    totalIntakeLeads: intakeLeads.length,
    step1Abandoned,
    qualified,
    smsSent,
    qualificationRatePct: intakeLeads.length > 0 ? Math.round((qualified / intakeLeads.length) * 100) : 0,
    totalAudits: audits.length,
    auditsExtracted,
    totalProposals: proposals.length,
    proposalsSent,
    closeRatePct: intakeLeads.length > 0 ? Math.round((proposalsSent / intakeLeads.length) * 100) : 0,
  };
}
