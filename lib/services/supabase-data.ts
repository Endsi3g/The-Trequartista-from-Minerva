import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, Project, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost, AuditLog, Lead, TimeEntry } from '@/lib/types';
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
      const { data, error } = await getSupabase()
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching projects:', error);
        return [];
      }

      return data.map((p) => ({
        ...p,
        client_name: p.client_name || 'Client Minerva',
        assignees: p.assignees || ['Alex Tremblay', 'Sarah Bouchard'],
      })) as Project[];
    })(),
    []
  );
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
// 9. TIME TRACKING DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchOpenTimeEntry(userId: string): Promise<TimeEntry | null> {
  const { data, error } = await getSupabase()
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle();

  if (error || !data) return null;
  return data as TimeEntry;
}

export async function startTimeEntry(userId: string, projectId: string): Promise<TimeEntry | null> {
  const { data, error } = await getSupabase()
    .from('time_entries')
    .insert([{ user_id: userId, project_id: projectId, started_at: new Date().toISOString() }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error starting time entry:', error);
    return null;
  }
  return data as TimeEntry;
}

export async function stopTimeEntry(entryId: string, startedAt: string): Promise<boolean> {
  const durationSeconds = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  const { error } = await getSupabase()
    .from('time_entries')
    .update({ ended_at: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', entryId);

  if (error) {
    console.error('[Supabase] Error stopping time entry:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 10. USER FEEDBACK DIRECT SUPABASE API
// ----------------------------------------------------
export async function submitUserFeedback(feedback: {
  rating: number;
  category: string;
  message: string;
  user_name?: string;
  user_email?: string;
}): Promise<boolean> {
  const { error } = await getSupabase().from('user_feedbacks').insert([feedback]);
  if (error) {
    console.error('[Supabase] Error submitting user feedback:', error);
    return false;
  }
  return true;
}
