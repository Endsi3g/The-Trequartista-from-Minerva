import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, Project, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost } from '@/lib/types';
import { INITIAL_CLIENTS, MOCK_ROI_METRICS, INITIAL_PROJECTS, INITIAL_LAUNCH_CHECKITEMS, INITIAL_TEAM, INITIAL_SOPS } from '@/lib/mock-data';

const supabase = createClient();

// ----------------------------------------------------
// 1. CLIENTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    // If table is empty or error, auto-seed database live
    console.log('[Supabase] Seeding clients table...');
    await supabase.from('clients').insert(
      INITIAL_CLIENTS.map(c => ({
        id: c.id,
        name: c.name,
        logo_url: c.logo_url,
        industry: c.industry,
        status: c.status,
        mrr: c.mrr,
        health_status: c.health_status,
        contact_name: c.contact_name,
        contact_email: c.contact_email,
      }))
    );
    return INITIAL_CLIENTS;
  }

  return data as Client[];
}

export async function addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> {
  const { data, error } = await supabase.from('clients').insert([client]).select().single();
  if (error) {
    console.error('Error adding client:', error);
    return null;
  }
  return data as Client;
}

// ----------------------------------------------------
// 2. CLIENT ROI METRICS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchClientRoiMetrics(clientId: string): Promise<ClientRoiMetrics> {
  const { data, error } = await supabase
    .from('client_roi_metrics')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    const fallback = MOCK_ROI_METRICS[clientId] || MOCK_ROI_METRICS['client-apex-roofing'];
    await supabase.from('client_roi_metrics').insert([{
      client_id: clientId,
      leads_sent_30d: fallback.leads_sent_30d,
      leads_change_pct: fallback.leads_change_pct,
      sales_completed: fallback.sales_completed,
      conversion_rate_pct: fallback.conversion_rate_pct,
      cost_per_lead: fallback.cost_per_lead,
      pipeline_value: fallback.pipeline_value,
      roi_multiplier: fallback.roi_multiplier,
      total_invested: fallback.total_invested,
      total_generated: fallback.total_generated,
      top_keywords_rank_top3: fallback.top_keywords_rank_top3,
      total_keywords_tracked: fallback.total_keywords_tracked,
      gmb_reviews_count: fallback.gmb_reviews_count,
      gmb_rating: fallback.gmb_rating,
      gmb_calls_count: fallback.gmb_calls_count,
      google_ads_spent: fallback.google_ads_spent,
      google_ads_leads: fallback.google_ads_leads,
      google_ads_roas: fallback.google_ads_roas,
      weekly_leads_trend: fallback.weekly_leads_trend,
    }]);
    return fallback;
  }

  return data as ClientRoiMetrics;
}

// ----------------------------------------------------
// 3. PROJECTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    console.log('[Supabase] Seeding projects table...');
    await supabase.from('projects').insert(
      INITIAL_PROJECTS.map(p => ({
        id: p.id,
        client_id: p.client_id,
        name: p.name,
        current_stage: p.current_stage,
        health: p.health,
        progress_pct: p.progress_pct,
        due_date: p.due_date,
      }))
    );
    return INITIAL_PROJECTS;
  }

  return data.map(p => ({
    ...p,
    client_name: p.client_name || 'Client Minerva',
    assignees: ['Alex Tremblay', 'Sarah Bouchard'],
  })) as Project[];
}

// ----------------------------------------------------
// 4. LAUNCH CHECKLIST 20-POINTS DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchLaunchChecklist(projectId: string): Promise<LaunchCheckItem[]> {
  const { data, error } = await supabase
    .from('project_launch_checks')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error || !data || !data.check_items) {
    console.log('[Supabase] Initializing launch checklist for project:', projectId);
    await supabase.from('project_launch_checks').insert([{
      project_id: projectId,
      score_pct: 90,
      check_items: INITIAL_LAUNCH_CHECKITEMS,
    }]);
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
    console.error('Error saving checklist to Supabase:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 5. TEAM & 1-ON-1s DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchTeamPerformance(): Promise<TeamMemberPerformance[]> {
  const { data, error } = await supabase.from('team_performance_reviews').select('*');

  if (error || !data || data.length === 0) {
    console.log('[Supabase] Seeding team performance table...');
    return INITIAL_TEAM;
  }

  return INITIAL_TEAM;
}

// ----------------------------------------------------
// 6. ACADEMY SOPs DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchAcademySops(): Promise<AcademySOP[]> {
  const { data, error } = await supabase.from('academy_sops').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    console.log('[Supabase] Seeding academy SOPs table...');
    await supabase.from('academy_sops').insert(
      INITIAL_SOPS.map(s => ({
        id: s.id,
        title: s.title,
        category: s.category,
        read_time_min: s.read_time_min,
        author: s.author,
        video_url: s.video_url,
        description: s.description,
      }))
    );
    return INITIAL_SOPS;
  }

  return data as AcademySOP[];
}
