import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, Project, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost, AuditLog, Lead, LeadNote } from '@/lib/types';
import { INITIAL_LAUNCH_CHECKITEMS } from '@/lib/mock-data';

const supabase = createClient();

// ----------------------------------------------------
// 1. CLIENTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[Supabase] Error fetching clients:', error);
    return [];
  }

  return data as Client[];
}

export async function addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> {
  const { data, error } = await supabase.from('clients').insert([client]).select().single();
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

  const { data, error } = await supabase
    .from('client_roi_metrics')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    console.log('[Supabase] No ROI metrics found for client:', clientId);
    return null;
  }

  return data as ClientRoiMetrics;
}

// ----------------------------------------------------
// 3. PROJECTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[Supabase] Error fetching projects:', error);
    return [];
  }

  return data.map(p => ({
    ...p,
    client_name: p.client_name || 'Client Minerva',
    assignees: p.assignees || ['Alex Tremblay', 'Sarah Bouchard'],
  })) as Project[];
}

// ----------------------------------------------------
// 4. LAUNCH CHECKLIST 20-POINTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchLaunchChecklist(projectId: string): Promise<LaunchCheckItem[]> {
  if (!projectId) return INITIAL_LAUNCH_CHECKITEMS;

  const { data, error } = await supabase
    .from('project_launch_checks')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error || !data || !data.check_items) {
    console.log('[Supabase] Checklist not found for project:', projectId);
    return INITIAL_LAUNCH_CHECKITEMS;
  }

  return data.check_items as LaunchCheckItem[];
}

export async function saveLaunchChecklist(projectId: string, items: LaunchCheckItem[]): Promise<boolean> {
  const checkedCount = items.filter(i => i.checked).length;
  const scorePct = Math.round((checkedCount / items.length) * 100);

  const { error } = await supabase
    .from('project_launch_checks')
    .upsert({
      project_id: projectId,
      score_pct: scorePct,
      check_items: items,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id' });

  if (error) {
    console.error('[Supabase] Error saving checklist:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 5. TEAM & 1-ON-1s DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchTeamPerformance(): Promise<TeamMemberPerformance[]> {
  const { data, error } = await supabase.from('team_performance_reviews').select('*');

  if (error || !data) {
    console.warn('[Supabase] Could not fetch team performance:', error);
    return [];
  }

  return data as TeamMemberPerformance[];
}

// ----------------------------------------------------
// 6. ACADEMY SOPs DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchAcademySops(): Promise<AcademySOP[]> {
  const { data, error } = await supabase.from('academy_sops').select('*').order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('[Supabase] Error fetching SOPs:', error);
    return [];
  }

  return data as AcademySOP[];
}

// ----------------------------------------------------
// 7. AUDIT LOGS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.warn('[Supabase] Could not fetch audit logs:', error);
    return [];
  }

  return data as AuditLog[];
}

export async function logAuditEvent(
  action: string,
  tableName: string,
  recordId?: string,
  details: Record<string, unknown> = {},
  actorName: string = 'Utilisateur Minerva'
): Promise<AuditLog | null> {
  const { data, error } = await supabase
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
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (clientId && clientId !== 'all') {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.warn('[Supabase] Could not fetch leads:', error);
    return [];
  }

  return data as Lead[];
}

export async function addLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead | null> {
  const { data, error } = await supabase.from('leads').insert([lead]).select().single();
  if (error) {
    console.error('[Supabase] Error adding lead:', error);
    return null;
  }
  return data as Lead;
}

export async function updateLeadStatus(leadId: string, status: Lead['status']): Promise<boolean> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
  if (error) {
    console.error('[Supabase] Error updating lead status:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 9. USER FEEDBACK DIRECT SUPABASE API
// ----------------------------------------------------
export async function submitUserFeedback(feedback: {
  rating: number;
  category: string;
  message: string;
  user_name?: string;
  user_email?: string;
}): Promise<boolean> {
  const { error } = await supabase.from('user_feedbacks').insert([feedback]);
  if (error) {
    console.error('[Supabase] Error submitting user feedback:', error);
    return false;
  }
  return true;
}

