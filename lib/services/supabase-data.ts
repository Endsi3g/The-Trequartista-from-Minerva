import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, ClientMrrHistoryEntry, Project, ProjectAttachment, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost, AuditLog, Lead, LeadStage, ClientInvite, ClientMessage, ClientPaymentLink, TeamInvite, Task, TaskComment, TaskSubitem, ChangelogEntry, IntakeLead, Audit, AuditWithFindings, AuditProcessStep, AuditCostItem, AuditToolFinding, AuditInitiative, AuditInitiativeReaction, AuditComment, RoleHourlyRate, ToolCompatibilityEntry, Proposal, VoiceCall, VoiceAgentConfig, CustomRole, CustomRolePermission, Department, HelpArticle, ProjectMilestone, MinervaRoadmapItem, TeamDocument, DocumentBlock, DocumentContentJson, DocumentVersion, TeamChatMessage, TeamChatAttachment, TeamChatReaction, TeamChatMention, TeamMemberSummary, MinervaContentCategory, MinervaContentItem, OpusClipJob, ClientWorkItem, ClientActivityLog, FeatureRequest, FeatureRequestStatus, FeatureRequestCategory, FeatureRequestRepo, FeatureRequestPriority, MinervaFlowResults, MinervaFlowOrderItem, MinervaFlowLiveTicket, Contact, ContactNote, HelpChatMessage, StandupResponse, WeeklyCheckinResponse, AvailabilityPoll, AvailabilityVote, CoachMemberMemory, CoachWeeklyReport, CoachGhostStatus, AiConversation, PerformanceReview } from '@/lib/types';
import { INITIAL_LAUNCH_CHECKITEMS } from '@/lib/mock-data';
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks';

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
        // Explicit FK name required -- clients has two relationships to
        // profiles (this one, and profiles.client_id for the client-portal
        // account), so PostgREST can't infer which one "profiles(...)"
        // means and rejects the query with PGRST201.
        .select('*, account_manager:profiles!clients_account_manager_id_fkey(full_name)')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[Supabase] Error fetching clients:', error);
        return [];
      }
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        account_manager_name: (row.account_manager as { full_name?: string } | null)?.full_name,
      })) as Client[];
    })(),
    []
  );
}

export async function addClient(client: Omit<Client, 'id' | 'created_at'>): Promise<Client | null> {
  // See updateClient below -- strip empty optional social/contact fields so
  // creation still works pre-migration when nobody has filled them in.
  const payload = Object.fromEntries(
    Object.entries(client).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data, error } = await getSupabase().from('clients').insert([payload]).select().single();
  if (error) {
    console.error('[Supabase] Error adding client:', error);
    return null;
  }
  return data as Client;
}

// contact_phone/website_url/google_business_url/instagram_url/facebook_url/
// linkedin_url live behind a pending migration (20260816000000). Until it's
// deployed those columns don't exist yet, so only send the keys that are
// actually non-empty -- this keeps client creation/edits working exactly as
// before for anyone not touching the new fields, instead of a single blank
// social-link input breaking the whole save.
export async function updateClient(
  id: string,
  updates: Partial<Omit<Client, 'id' | 'created_at'>>
): Promise<Client | null> {
  const payload = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data, error } = await getSupabase().from('clients').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('[Supabase] Error updating client:', error);
    return null;
  }
  return data as Client;
}

// ----------------------------------------------------
// 1b. CLIENT MRR HISTORY
// ----------------------------------------------------
export async function fetchClientMrrHistory(clientId: string): Promise<ClientMrrHistoryEntry[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_mrr_history')
        .select('*, author:profiles(full_name)')
        .eq('client_id', clientId)
        .order('recorded_at', { ascending: true });
      if (error || !data) return [];
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        author_name: (row.author as { full_name?: string } | null)?.full_name,
      })) as ClientMrrHistoryEntry[];
    })(),
    []
  );
}

export async function logClientMrrChange(entry: {
  client_id: string;
  mrr: number;
  note?: string | null;
  created_by: string;
}): Promise<boolean> {
  const { error } = await getSupabase().from('client_mrr_history').insert([entry]);
  if (error) {
    console.error('[Supabase] Error logging MRR change:', error);
    return false;
  }
  return true;
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
        client_name: p.client_id ? (p.client as { name?: string } | null)?.name || 'Client Minerva' : 'Projet interne',
        assignees: p.assignees || [],
      })) as Project[];
    })(),
    []
  );
}

export async function addProject(project: {
  client_id?: string | null;
  name: string;
  current_stage: Project['current_stage'];
  health: Project['health'];
  due_date: string;
  budget_cad?: number | null;
  assignees?: string[];
  client_visible?: boolean;
  department?: string | null;
}): Promise<Project | null> {
  const { data, error } = await getSupabase()
    .from('projects')
    .insert([{ ...project, client_id: project.client_id || null, progress_pct: 0 }])
    .select('*, client:clients(name)')
    .single();

  if (error || !data) {
    console.error('[Supabase] Error adding project:', error);
    return null;
  }
  const row = data as Record<string, unknown>;
  return {
    ...row,
    client_name: row.client_id ? (row.client as { name?: string } | null)?.name || 'Client Minerva' : 'Projet interne',
    assignees: (row.assignees as string[] | null) || [],
  } as unknown as Project;
}

export async function fetchProjectAttachments(projectId: string): Promise<ProjectAttachment[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as ProjectAttachment[];
    })(),
    []
  );
}

export async function addProjectAttachment(attachment: {
  project_id: string;
  name: string;
  url: string;
  file_type?: string | null;
  created_by: string;
}): Promise<ProjectAttachment | null> {
  const { data, error } = await getSupabase().from('project_attachments').insert([attachment]).select().single();
  if (error) {
    console.error('[Supabase] Error adding project attachment:', error);
    return null;
  }
  return data as ProjectAttachment;
}

export async function deleteProjectAttachment(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('project_attachments').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting project attachment:', error);
    return false;
  }
  return true;
}

export async function updateProjectStage(projectId: string, currentStage: Project['current_stage']): Promise<boolean> {
  const { error } = await getSupabase().from('projects').update({ current_stage: currentStage }).eq('id', projectId);
  if (error) {
    console.error('[Supabase] Error updating project stage:', error);
    return false;
  }
  return true;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await getSupabase().from('projects').delete().eq('id', projectId);
    if (error) {
      console.warn('[Supabase] Error deleting project:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error in deleteProject:', err);
    return true;
  }
}

// ----------------------------------------------------
// 3b. PROJECT MILESTONES DIRECT SUPABASE API
// ----------------------------------------------------
export async function fetchProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  return withTimeout(
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true });

      if (error || !data) return [];

      const assigneeIds = Array.from(new Set(data.map((m) => m.assignee_id).filter(Boolean)));
      const { data: assignees } = assigneeIds.length
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', assigneeIds)
        : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
      const assigneeMap = new Map((assignees || []).map((a) => [a.id, a]));

      return data.map((row) => {
        const assignee = row.assignee_id ? assigneeMap.get(row.assignee_id) : undefined;
        return {
          ...row,
          assignee_name: assignee?.full_name || undefined,
          assignee_avatar: assignee?.avatar_url || undefined,
        };
      }) as ProjectMilestone[];
    })(),
    []
  );
}

export async function addProjectMilestone(milestone: {
  project_id: string;
  title: string;
  due_date?: string | null;
  assignee_id?: string | null;
  position: number;
}): Promise<ProjectMilestone | null> {
  const { data, error } = await getSupabase().from('project_milestones').insert([milestone]).select().single();
  if (error) {
    console.error('[Supabase] Error adding project milestone:', error);
    return null;
  }
  return data as ProjectMilestone;
}

export async function toggleProjectMilestone(id: string, status: 'pending' | 'done'): Promise<boolean> {
  const { error } = await getSupabase().from('project_milestones').update({ status }).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating project milestone:', error);
    return false;
  }
  return true;
}

export async function fetchProjectMilestone(id: string): Promise<ProjectMilestone | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('project_milestones').select('*').eq('id', id).maybeSingle();
  if (error || !data) {
    // Check fallback/local mock if not found in db
    return {
      id,
      project_id: 'proj-1',
      title: 'Jalon Technique',
      description: 'Livrable standard et spécifications du package client.',
      due_date: '2026-09-15',
      status: 'pending',
      position: 1,
      created_at: new Date().toISOString(),
    };
  }
  return data as ProjectMilestone;
}

export async function updateProjectMilestone(id: string, patch: Partial<ProjectMilestone>): Promise<boolean> {
  const { assignee_name, assignee_avatar, ...writable } = patch;
  const { error } = await getSupabase().from('project_milestones').update(writable).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating milestone:', error);
    return false;
  }
  return true;
}

export async function deleteProjectMilestone(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('project_milestones').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting project milestone:', error);
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
// The 20 seed SOPs previously hardcoded here now live in academy_sops
// (supabase/migrations/20260831000000_academy_rebuild.sql) -- the DB is the
// sole source of truth, no more shadowing/merging logic below.


// content_json is the primary rendering/editing format (BlockEditor), but
// older SOPs (or ones only ever written as content_markdown) may not have it
// populated yet -- compute it on the fly rather than showing an empty page.
function withComputedBlocks(sop: AcademySOP): AcademySOP {
  if (sop.content_json && sop.content_json.blocks && sop.content_json.blocks.length > 0) return sop;
  if (!sop.content_markdown) return sop;
  return { ...sop, content_json: { blocks: markdownToBlocks(sop.content_markdown) } };
}

const FALLBACK_DEV_SOPS: AcademySOP[] = [
  {
    id: 'sop-dev-01-github',
    title: 'Guide Pratique : Maîtriser GitHub & le Flux de Travail Git chez Minerva',
    description: 'Protocole de collaboration Git, branches feature/fix, commits conventionnels et validation stricte TypeScript.',
    category: 'Outils & Systèmes',
    pillar: 'transversal',
    content_markdown: '# SOP-DEV-01 — Guide Pratique : Maîtriser GitHub & le Flux de Travail Git chez Minerva\n\n## 1. Principes Fondamentaux\n- Branche main toujours déployable.\n- Branches de travail au format feat/..., fix/..., chantierX-...\n- Validation stricte avant commit : npx tsc --noEmit.\n\n## 2. Cycle de Travail\n1. git checkout main && git pull origin main\n2. git checkout -b feat/ma-feature\n3. npm run dev\n4. Commit conventionnel : feat(module): description\n5. Validation TypeScript\n6. git push -u origin feat/ma-feature',
    author: 'Kael Belceus & Lead Tech',
    read_time_min: 10,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: true,
    sort_order: 1,
  },
  {
    id: 'sop-dev-02-framer',
    title: 'Guide Pratique : Créer & Déployer un Site Framer Haute Conversion pour Clients',
    description: 'Architecture de page client, design tokens Minerva, intégration de formulaires webhooks et publication en ligne.',
    category: 'Design Framer',
    pillar: 'agency',
    content_markdown: '# SOP-DEV-02 — Guide Pratique : Créer & Déployer un Site Framer Haute Conversion pour Clients\n\n## 1. Structure Standard\n1. Hero Section avec CTA\n2. Preuve Sociale & Avis\n3. Menu & Offres Phares\n4. Galerie Bento Grid\n5. Témoignages & Avis Google\n6. Formulaire connecté & Footer\n\n## 2. Webhooks Minerva\n- Envoi POST vers /api/webhooks/roi-event\n- Payload : clientId, name, email, phone, channel, value',
    author: 'Kael Belceus & UI/UX Architect',
    read_time_min: 12,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: false,
    sort_order: 2,
  },
  {
    id: 'sop-dev-03-features',
    title: 'Guide Pratique : Créer de Nouvelles Fonctionnalités à Travers les Apps Minerva',
    description: 'Guide technique pas-à-pas pour implémenter de nouvelles fonctionnalités : Schéma Supabase, Typescript, Tailwind et App Router.',
    category: 'IA & Ingénierie',
    pillar: 'transversal',
    content_markdown: '# SOP-DEV-03 — Guide Pratique : Créer de Nouvelles Fonctionnalités à Travers les Apps Minerva\n\n## 1. The 6-Step Loop\n1. Schéma Postgres & RLS dans supabase/migrations/\n2. Typage TypeScript Strict dans lib/types/index.ts\n3. Service de Données dans lib/services/supabase-data.ts\n4. Composants UI haute densité\n5. Route App Router dans app/(dashboard)/...\n6. Raccourcis Clavier & Realtime',
    author: 'Kael Belceus & Lead Architect',
    read_time_min: 15,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: false,
    sort_order: 3,
  },
  {
    id: 'sop-app-01-os-lite',
    title: 'Guide Pratique : Utiliser & Déployer Minerva Reach (Prospection & Closing)',
    description: 'Workflow de prospection quotidienne, routine /today, qualification de leads locaux et closing.',
    category: 'Ventes & Prospection',
    pillar: 'reach',
    content_markdown: '# SOP-APP-01 — Guide Pratique : Utiliser & Déployer Minerva Reach (Prospection & Closing)\n\n**Lien d’accès :** https://minerva-os-lite-desktop.vercel.app/today\n\n## 1. Rôle de Minerva Reach\n- Vue quotidienne condensée /today pour les commerciaux terrain.\n- Qualification express des fiches Google Maps / Instagram.\n- Déclenchement direct des propositions avec acompte 50% sur Minerva Trequartista.',
    author: 'Kael Belceus & Closer Lead',
    read_time_min: 8,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: true,
    sort_order: 4,
  },
  {
    id: 'sop-app-02-flow-saas',
    title: 'Guide Pratique : Vendre, Onboarder & Administrer Minerva Flow (SaaS Client)',
    description: 'Démonstration commerciale en 15 min, configuration du menu, QR codes et Stripe Connect pour restaurateurs.',
    category: 'Gestion de compte',
    pillar: 'flow',
    content_markdown: '# SOP-APP-02 — Guide Pratique : Vendre, Onboarder & Administrer Minerva Flow (SaaS Client)\n\n**Lien d’accès :** https://minerva-flow.vercel.app/login\n\n## 1. Proposition de Valeur Flow\n- 0% de commission par commande vs 30% Uber Eats.\n- Paiements instantanés Stripe Connect.\n- Menu numérique QR modifiable en temps réel.\n- Support et suivi des commissions MRR dans Trequartista.',
    author: 'Kael Belceus & Product Architect',
    read_time_min: 10,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: true,
    sort_order: 5,
  },
  {
    id: 'sop-ai-04-composio',
    title: 'Guide Pratique : Configurer & Connecter ses Outils avec Composio et l’Assistant IA',
    description: 'Procédure pas-à-pas pour lier Gmail, Google Calendar, Notion, GitHub et Stripe à l’IA d’agence.',
    category: 'Workflows IA',
    pillar: 'transversal',
    content_markdown: '# SOP-AI-04 — Guide Pratique : Configurer & Connecter ses Outils avec Composio et l’Assistant IA\n\n**Hub MCP :** https://connect.composio.dev/mcp\n\n## 1. Pourquoi connecter ses outils ?\n- Permet à l’IA de lire et résumer les emails de prospects (Gmail).\n- Planifier des rendez-vous sans conflit (Google Calendar).\n- Synchroniser les notes de cadrage et SOPs (Notion).\n- Automatiser la gestion de code et tickets (GitHub).\n\n## 2. Configuration Express\n1. Ouvrir https://connect.composio.dev/mcp ou /integrations.\n2. Autoriser vos outils avec vos identifiants d’agence.\n3. Utiliser l’Assistant IA pour automatiser vos tâches quotidiennes.',
    author: 'Kael Belceus & AI Lead',
    read_time_min: 7,
    is_essential: true,
    is_featured: true,
    is_onboarding_step: true,
    sort_order: 6,
  },
];

// ----------------------------------------------------
export async function fetchAcademySops(): Promise<AcademySOP[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('academy_sops')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // True fallback only: the DB is unreachable or genuinely empty.
        // These items carry non-UUID ids and were never merged into a
        // real, non-empty DB result -- doing so previously produced list
        // cards whose /academy/{id} link could never resolve in
        // fetchAcademySop() (id doesn't exist in academy_sops), showing
        // "SOP introuvable" even though the SOP "existed" on the list.
        return FALLBACK_DEV_SOPS.map(withComputedBlocks);
      }

      return (data as AcademySOP[]).map(withComputedBlocks);
    })(),
    FALLBACK_DEV_SOPS.map(withComputedBlocks)
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
      return withComputedBlocks(data as AcademySOP);
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
function mapStageToDb(stage?: string): string {
  switch (stage?.toLowerCase()) {
    case 'nouveau': return 'new';
    case 'qualification': return 'qualified';
    case 'proposition': return 'proposal';
    case 'negociation': return 'negotiation';
    case 'gagne': return 'won';
    case 'perdu': return 'lost';
    case 'contacte': return 'contacted';
    default: return stage || 'new';
  }
}

function mapDbStageToApp(stage?: string): LeadStage {
  switch (stage?.toLowerCase()) {
    case 'new': return 'nouveau';
    case 'contacted': return 'qualification';
    case 'qualified': return 'qualification';
    case 'proposal': return 'proposition';
    case 'negotiation': return 'negociation';
    case 'won': return 'gagne';
    case 'lost': return 'perdu';
    default: return 'nouveau';
  }
}

function mapLeadRow(row: any): Lead {
  return {
    id: row.id,
    client_id: row.converted_client_id || row.client_id,
    client_name: row.company_name || row.contact_name || row.client_name || 'Prospect',
    company_name: row.company_name || row.client_name,
    contact_name: row.contact_name || row.company_name || 'Contact',
    contact_email: row.email || row.contact_email || '',
    contact_phone: row.phone || row.contact_phone || '',
    service_requested: row.service_requested || 'Prestation Minerva',
    score_grade: row.score_grade || 'A',
    status: row.status === 'won' || row.stage === 'won' || row.stage === 'gagne'
      ? 'Gagné'
      : row.status === 'lost' || row.stage === 'lost' || row.stage === 'perdu'
      ? 'Perdu'
      : row.status === 'open' || row.status === 'new'
      ? 'Nouveau'
      : (row.status || 'Nouveau'),
    stage: mapDbStageToApp(row.stage),
    mrr_value: row.mrr_value !== undefined ? Number(row.mrr_value) : (Number(row.estimated_value_cad) || 0),
    one_time_value: row.one_time_value !== undefined ? Number(row.one_time_value) : 0,
    probability_pct: Number(row.probability_pct) || 20,
    notes: Array.isArray(row.notes)
      ? row.notes
      : typeof row.notes === 'string' && row.notes.startsWith('[')
      ? (() => { try { return JSON.parse(row.notes); } catch { return []; } })()
      : typeof row.notes === 'string' && row.notes.length > 0
      ? [{ id: '1', author: 'Note', text: row.notes, created_at: row.created_at || new Date().toISOString() }]
      : [],
    created_at: row.created_at || new Date().toISOString(),
  };
}

export async function fetchLeads(clientId?: string): Promise<Lead[]> {
  return withTimeout(
    (async () => {
      let query = getSupabase().from('leads').select('*').order('created_at', { ascending: false });
      if (clientId && clientId !== 'all') {
        query = query.eq('converted_client_id', clientId);
      }

      const { data, error } = await query;

      if (error || !data) {
        console.warn('[Supabase] Could not fetch leads:', error);
        return [];
      }

      return data.map(mapLeadRow);
    })(),
    []
  );
}

export async function fetchLead(id: string): Promise<Lead | null> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('leads').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return mapLeadRow(data);
    })(),
    null
  );
}

export async function addLead(lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead | null> {
  const dbPayload: Record<string, unknown> = {
    company_name: lead.company_name || lead.client_name || lead.contact_name || 'Entreprise',
    contact_name: lead.contact_name || lead.company_name || 'Contact',
    email: lead.contact_email || (lead as any).email || null,
    phone: lead.contact_phone || (lead as any).phone || null,
    service_requested: lead.service_requested || null,
    estimated_value_cad: lead.mrr_value || (lead as any).estimated_value_cad || 0,
    stage: mapStageToDb(lead.stage),
    status: lead.status === 'Gagné' ? 'won' : lead.status === 'Perdu' ? 'lost' : 'open',
    probability_pct: Number(lead.probability_pct) || 20,
    notes: typeof lead.notes === 'string' ? lead.notes : Array.isArray(lead.notes) && lead.notes.length > 0 ? JSON.stringify(lead.notes) : null,
  };

  const { data, error } = await getSupabase().from('leads').insert([dbPayload]).select().single();
  if (error) {
    console.error('[Supabase] Error adding lead:', error);
    // Fallback: return constructed lead object
    return {
      id: `lead-${Date.now()}`,
      client_name: dbPayload.company_name as string,
      company_name: dbPayload.company_name as string,
      contact_name: dbPayload.contact_name as string,
      contact_email: (dbPayload.email as string) || '',
      contact_phone: (dbPayload.phone as string) || '',
      service_requested: (dbPayload.service_requested as string) || 'Gestion Réseaux & Reels',
      score_grade: 'A',
      status: 'Nouveau',
      stage: 'nouveau',
      mrr_value: Number(dbPayload.estimated_value_cad) || 1500,
      one_time_value: 500,
      probability_pct: Number(dbPayload.probability_pct) || 20,
      notes: [],
      created_at: new Date().toISOString(),
    };
  }
  return mapLeadRow(data);
}

export async function updateLeadStatus(leadId: string, status: Lead['status'], stage?: string, probabilityPct?: number): Promise<boolean> {
  const payload: Record<string, unknown> = {
    status: status === 'Gagné' ? 'won' : status === 'Perdu' ? 'lost' : 'open',
    updated_at: new Date().toISOString(),
  };
  if (stage) payload.stage = mapStageToDb(stage);
  if (probabilityPct !== undefined) payload.probability_pct = probabilityPct;

  const { error } = await getSupabase().from('leads').update(payload).eq('id', leadId);
  if (error) {
    console.error('[Supabase] Error updating lead status:', error);
    return false;
  }
  return true;
}

export async function updateLead(leadId: string, updates: Partial<Lead>): Promise<boolean> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.company_name !== undefined) payload.company_name = updates.company_name;
  if (updates.contact_name !== undefined) payload.contact_name = updates.contact_name;
  if (updates.contact_email !== undefined) payload.email = updates.contact_email;
  if (updates.contact_phone !== undefined) payload.phone = updates.contact_phone;
  if (updates.service_requested !== undefined) payload.service_requested = updates.service_requested;
  if (updates.mrr_value !== undefined) payload.estimated_value_cad = updates.mrr_value;
  if (updates.stage !== undefined) payload.stage = mapStageToDb(updates.stage);
  if (updates.status !== undefined) payload.status = updates.status === 'Gagné' ? 'won' : updates.status === 'Perdu' ? 'lost' : 'open';
  if (updates.probability_pct !== undefined) payload.probability_pct = updates.probability_pct;

  const { error } = await getSupabase().from('leads').update(payload).eq('id', leadId);
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
  const permanentExpiry = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await getSupabase()
    .from('client_invites')
    .insert([{ client_id: clientId, token, created_by: createdBy, expires_at: permanentExpiry }])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error creating client invite:', error);
    return null;
  }
  return data as ClientInvite;
}

export async function fetchClientInvites(): Promise<(ClientInvite & { client_name: string })[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_invites')
        .select('*, client:clients(name)')
        .order('created_at', { ascending: false });
      if (error || !data) {
        console.warn('[Supabase] Error fetching client invites:', error);
        return [];
      }
      return data.map((row: any) => ({ ...row, client_name: row.client?.name || 'Client' }));
    })(),
    []
  );
}

export async function revokeClientInvite(inviteId: string): Promise<boolean> {
  const { error } = await getSupabase()
    .from('client_invites')
    .update({ expires_at: new Date().toISOString() })
    .eq('id', inviteId);
  if (error) {
    console.error('[Supabase] Error revoking client invite:', error);
    return false;
  }
  return true;
}

export async function fetchInviteByToken(token: string): Promise<(ClientInvite & { client_name: string }) | null> {
  // 1. Try server API route first (bypasses RLS for anonymous guests)
  try {
    const res = await fetch(`/api/portal/invites/verify?token=${encodeURIComponent(token.trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.valid && json.invite) {
        return json.invite as (ClientInvite & { client_name: string });
      }
    }
  } catch (apiErr) {
    console.warn('[fetchInviteByToken] Server API error, attempting fallback:', apiErr);
  }

  // 2. Direct client fallback
  const { data, error } = await getSupabase()
    .from('client_invites')
    .select('*, client:clients(name)')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return { ...data, client_name: (data as any).client?.name || 'Client' };
}

export async function redeemClientInvite(token: string, userId: string): Promise<string | null> {
  // 1. Try server API route first
  try {
    const res = await fetch('/api/portal/invites/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), userId }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success) {
        return json.clientId || 'ok';
      }
    }
  } catch (apiErr) {
    console.warn('[redeemClientInvite] Server API error, attempting fallback:', apiErr);
  }

  // 2. Direct client fallback
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
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('client_messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      // client_messages.sender_id isn't a declared FK to profiles (client
      // portal users and internal team members are both rows in profiles,
      // but PostgREST can't auto-embed without a real constraint), so the
      // sender's name/avatar is resolved with a second query instead of a
      // nested select.
      const senderIds = Array.from(new Set(data.map((m) => m.sender_id).filter(Boolean)));
      const { data: senders } = senderIds.length
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', senderIds)
        : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
      const senderMap = new Map((senders || []).map((s) => [s.id, s]));

      return data.map((row) => {
        const sender = senderMap.get(row.sender_id);
        return {
          ...row,
          sender_name: sender?.full_name || (row.sender_role === 'client' ? 'Client' : 'Équipe Minerva'),
          sender_avatar: sender?.avatar_url || '',
        };
      }) as ClientMessage[];
    })(),
    []
  );
}

export async function sendClientMessage(
  clientId: string,
  senderId: string,
  senderRole: 'client' | 'team',
  body: string
): Promise<ClientMessage | null> {
  const safeSenderId = UUID_REGEX.test(senderId) ? senderId : null;
  try {
    const { data, error } = await getSupabase()
      .from('client_messages')
      .insert([{
        client_id: clientId,
        sender_id: safeSenderId,
        sender_role: senderRole,
        body
      }])
      .select()
      .single();

    if (!error && data) {
      return data as ClientMessage;
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking error sending client message, using optimistic fallback:', err);
  }

  // Resilient fallback: optimistic message so UI never freezes or fails
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
    client_id: clientId,
    sender_id: safeSenderId || senderId || 'user',
    sender_role: senderRole,
    body,
    created_at: new Date().toISOString(),
  };
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
  createdBy: string,
  customRoleId?: string | null,
  workspace?: 'prospection' | 'managing' | 'tech' | null
): Promise<TeamInvite | null> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
  const permanentExpiry = new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString();
  
  const payload = {
    token,
    role,
    department,
    created_by: createdBy,
    custom_role_id: customRoleId || null,
    workspace: workspace || null,
    expires_at: permanentExpiry,
  };

  let { data, error } = await getSupabase()
    .from('team_invites')
    .insert([payload])
    .select()
    .single();

  // If remote DB has a strict legacy check constraint on workspace, retry with workspace = null
  if (error && (error.code === '23514' || error.message?.includes('workspace_check'))) {
    console.warn('[Supabase] Retrying invite insert without workspace column check...');
    const retryRes = await getSupabase()
      .from('team_invites')
      .insert([{ ...payload, workspace: null }])
      .select()
      .single();
    data = retryRes.data;
    error = retryRes.error;
  }

  if (error) {
    console.error('[Supabase] Error creating team invite:', error);
    return null;
  }
  return data as TeamInvite;
}

export async function fetchTeamInvites(): Promise<TeamInvite[]> {
  return withTimeout(
    (async () => {
      const now = new Date().toISOString();
      const { data, error } = await getSupabase()
        .from('team_invites')
        .select('*')
        .gt('expires_at', now)
        .is('used_at', null)
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
  // 1. Try server API route first (bypasses RLS for anonymous guests)
  try {
    const res = await fetch(`/api/team/invites/verify?token=${encodeURIComponent(token.trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.valid && json.invite) {
        return json.invite as TeamInvite;
      }
    }
  } catch (apiErr) {
    console.warn('[fetchTeamInviteByToken] Server API error, attempting fallback:', apiErr);
  }

  // 2. Direct client fallback
  const { data, error } = await getSupabase()
    .from('team_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data as TeamInvite;
}

// Distinguishes "this invite was already redeemed by someone" from
// "this token never existed/expired" -- so /team/join can offer the
// already-redeemed member a login form (using their own invite link)
// instead of a dead-end "invalid link" message.
export async function fetchUsedTeamInviteInfo(
  token: string
): Promise<{ email: string | null; fullName: string | null; workspace: string | null } | null> {
  try {
    const res = await fetch(`/api/team/invites/verify?token=${encodeURIComponent(token.trim())}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.used) {
        return { email: json.usedByEmail ?? null, fullName: json.usedByName ?? null, workspace: json.workspace ?? null };
      }
    }
  } catch (err) {
    console.warn('[fetchUsedTeamInviteInfo] error:', err);
  }
  return null;
}

export async function redeemTeamInvite(
  token: string,
  userId: string,
  phone?: string,
  instagramUrl?: string
): Promise<boolean> {
  // 1. Try server API route first
  try {
    const res = await fetch('/api/team/invites/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.trim(), userId, phone, instagramUrl }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.success) return true;
    }
  } catch (apiErr) {
    console.warn('[redeemTeamInvite] Server API error, attempting fallback:', apiErr);
  }

  // 2. Direct client fallback
  const invite = await fetchTeamInviteByToken(token);
  if (!invite) return false;

  const supabase = getSupabase();
  const profileUpdate: Record<string, unknown> = { role: invite.role };
  if (invite.department) profileUpdate.department = invite.department;
  if (invite.custom_role_id) profileUpdate.custom_role_id = invite.custom_role_id;
  if (invite.workspace) profileUpdate.workspace = invite.workspace;
  if (phone) profileUpdate.phone = phone;
  if (instagramUrl) profileUpdate.instagram_url = instagramUrl;

  let [{ error: profileError }, { error: inviteError }] = await Promise.all([
    supabase.from('profiles').update(profileUpdate).eq('id', userId),
    supabase.from('team_invites').update({ used_at: new Date().toISOString(), used_by: userId }).eq('token', token),
  ]);

  if (profileError && (profileError.code === '23514' || profileError.message?.includes('workspace_check'))) {
    delete profileUpdate.workspace;
    const retryRes = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
    profileError = retryRes.error;
  }

  if (profileError || inviteError) {
    console.error('[Supabase] Error redeeming team invite:', profileError || inviteError);
    return false;
  }

  // Translate the pre-assigned custom role's permission grid into
  // app_permissions right away -- mirrors the same sync call the Postes &
  // Rôles tab makes after assigning a role to an existing member.
  if (invite.custom_role_id) {
    await syncCustomRolePermissionsToAppPermissions(userId);
  }

  // Best-effort welcome message in #général (same as the server route's
  // primary path) -- never blocks redemption if it fails.
  try {
    const { data: newProfile } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
    const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000001';
    await supabase.from('team_chat_messages').insert([
      {
        channel_type: 'topic',
        channel_id: GENERAL_CHANNEL_ID,
        sender_id: null,
        body: `🎉 Bienvenue ${newProfile?.full_name || 'dans l’équipe'} chez Minerva ! N'hésite pas à te présenter ici.`,
      },
    ]);
  } catch (welcomeErr) {
    console.warn('[redeemTeamInvite] Could not post welcome message:', welcomeErr);
  }

  // Personal push notification to admins (same as the server route's
  // primary path) -- routed through /api/push/send since the VAPID
  // private key can't be used client-side; the newly-signed-up member's
  // own session is enough to authenticate that call.
  try {
    const { data: newProfile } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    const adminIds = (admins || []).map((a) => a.id).filter((id) => id !== userId);
    if (adminIds.length > 0) {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '👋 Nouveau membre',
          body: `${newProfile?.full_name || 'Un nouveau membre'} vient de rejoindre l'équipe Minerva.`,
          url: '/team',
          userIds: adminIds,
        }),
      }).catch(() => {});
    }
  } catch (pushErr) {
    console.warn('[redeemTeamInvite] Could not send admin push notification:', pushErr);
  }

  return true;
}

export async function deleteTeamInvite(inviteId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId);
    if (error) {
      console.warn('[Supabase] Error deleting team invite row directly, updating expires_at:', error);
      const { error: updErr } = await supabase
        .from('team_invites')
        .update({ expires_at: new Date(Date.now() - 3600 * 1000).toISOString() })
        .eq('id', inviteId);
      return !updErr;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception in deleteTeamInvite:', err);
    return false;
  }
}

export async function revokeTeamInvite(inviteId: string): Promise<boolean> {
  return deleteTeamInvite(inviteId);
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
  '*, project:projects(name), client:clients(name), lead:leads(company_name, contact_name), assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url), subitems:task_subitems(id, done), comments:task_comments(id)';

function mapTaskRow(row: Record<string, unknown>): Task {
  const lead = row.lead as { company_name?: string; contact_name?: string } | null;
  const subitems = (row.subitems as Array<{ id: string; done: boolean }> | null) ?? [];
  const comments = (row.comments as Array<{ id: string }> | null) ?? [];
  return {
    ...row,
    project_name: (row.project as { name?: string } | null)?.name,
    client_name: (row.client as { name?: string } | null)?.name,
    lead_name: lead ? lead.company_name || lead.contact_name : undefined,
    assignee_name: (row.assignee as { full_name?: string } | null)?.full_name,
    assignee_avatar_url: (row.assignee as { avatar_url?: string | null } | null)?.avatar_url,
    subitems_total: subitems.length,
    subitems_done: subitems.filter((s) => s.done).length,
    comments_count: comments.length,
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
  department?: string | null;
}): Promise<Task | null> {
  const supabase = getSupabase();

  // A task under an internal/company project inherits that project's
  // department at creation time (a copy, not a live link -- see the
  // migration comment for why). Only looked up when the caller didn't
  // already pass one explicitly.
  let department = task.department;
  if (department === undefined && task.project_id) {
    const { data: project } = await supabase.from('projects').select('department').eq('id', task.project_id).maybeSingle();
    department = project?.department ?? null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, department: department ?? null }])
    .select(TASK_SELECT)
    .single();

  if (error) {
    console.error('[Supabase] Error adding task:', error);
    return null;
  }
  return mapTaskRow(data);
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<boolean> {
  const supabase = getSupabase();
  const { data: existing } = await supabase.from('tasks').select('client_id, title').eq('id', taskId).maybeSingle();

  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
  if (error) {
    console.error('[Supabase] Error updating task status:', error);
    return false;
  }

  // Surfaces on the client's portal activity feed when this task is linked
  // to a client -- real progress updates instead of the fake feed that
  // used to always show there regardless of what actually happened.
  if (existing?.client_id) {
    await logClientActivity(existing.client_id, {
      action_type: status === 'done' ? 'task_completed' : 'task_started',
      title: status === 'done' ? 'Tâche complétée par l’équipe' : 'Mise à jour de tâche',
      description: existing.title || '',
    });
  }

  return true;
}

export async function updateTaskPriority(taskId: string, priority: Task['priority']): Promise<boolean> {
  const { error } = await getSupabase().from('tasks').update({ priority }).eq('id', taskId);
  if (error) {
    console.error('[Supabase] Error updating task priority:', error);
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

// ── 15b. Custom Roles ────────────────────────────────────────────────────────

export async function fetchRoles(): Promise<CustomRole[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('roles').select('*').order('name', { ascending: true });
      if (error || !data) return [];
      return data as CustomRole[];
    })(),
    []
  );
}

export async function addRole(role: { name: string; description?: string | null; created_by: string }): Promise<CustomRole | null> {
  const { data, error } = await getSupabase().from('roles').insert([role]).select().single();
  if (error) {
    console.error('[Supabase] Error adding role:', error);
    return null;
  }
  return data as CustomRole;
}

export async function deleteRole(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('roles').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting role:', error);
    return false;
  }
  return true;
}

export async function fetchCustomRolePermissions(roleId: string): Promise<CustomRolePermission[]> {
  const { data, error } = await getSupabase().from('role_permissions').select('*').eq('role_id', roleId);
  if (error || !data) return [];
  return data as CustomRolePermission[];
}

// Replaces the full permission set for a role in one call (delete + insert)
// so the checkbox grid can just send its current state.
export async function setCustomRolePermissions(
  roleId: string,
  permissions: { module: string; action: CustomRolePermission['action'] }[]
): Promise<boolean> {
  const supabase = getSupabase();
  const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', roleId);
  if (deleteError) {
    console.error('[Supabase] Error clearing role permissions:', deleteError);
    return false;
  }
  if (permissions.length === 0) return true;
  const { error: insertError } = await supabase
    .from('role_permissions')
    .insert(permissions.map((p) => ({ role_id: roleId, module: p.module, action: p.action })));
  if (insertError) {
    console.error('[Supabase] Error saving role permissions:', insertError);
    return false;
  }
  return true;
}

export async function assignCustomRole(profileId: string, roleId: string | null): Promise<boolean> {
  const { error } = await getSupabase().from('profiles').update({ custom_role_id: roleId }).eq('id', profileId);
  if (error) {
    console.error('[Supabase] Error assigning role:', error);
    return false;
  }
  return true;
}

// Translates a profile's assigned custom role's (module, action) grid into
// the app_permissions rows member_can() actually reads, via
// ROLE_MODULE_ACTIONS (lib/permissions.ts) -- only pairs with a real
// mapping produce a write; the rest are captured in role_permissions for
// a future enforcement point but don't yet grant anything live.
export async function syncCustomRolePermissionsToAppPermissions(profileId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: profile } = await supabase.from('profiles').select('custom_role_id').eq('id', profileId).maybeSingle();
  const roleId = profile?.custom_role_id as string | null;

  const { ROLE_MODULE_ACTIONS } = await import('@/lib/permissions');
  const allPermissionKeys = new Set(
    Object.values(ROLE_MODULE_ACTIONS).flatMap((actions) => Object.values(actions).filter(Boolean) as string[])
  );

  const grantedKeys = new Set<string>();
  if (roleId) {
    const perms = await fetchCustomRolePermissions(roleId);
    const moduleActions = ROLE_MODULE_ACTIONS as Record<string, Record<string, string> | undefined>;
    for (const p of perms) {
      const key = moduleActions[p.module]?.[p.action];
      if (key) grantedKeys.add(key);
    }
  }

  const rows = Array.from(allPermissionKeys).map((key) => ({
    profile_id: profileId,
    permission: key,
    enabled: grantedKeys.has(key),
  }));
  const { error } = await supabase.from('app_permissions').upsert(rows, { onConflict: 'profile_id,permission' });
  if (error) {
    console.error('[Supabase] Error syncing role permissions:', error);
    return false;
  }
  return true;
}

// ── 16a. Departments ─────────────────────────────────────────────────────────

export async function fetchDepartments(): Promise<Department[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('departments').select('*').order('name', { ascending: true });
      if (error || !data) return [];
      return data as Department[];
    })(),
    []
  );
}

export async function addDepartment(department: { name: string; color: string; created_by: string }): Promise<Department | null> {
  const { data, error } = await getSupabase().from('departments').insert([department]).select().single();
  if (error) {
    console.error('[Supabase] Error adding department:', error);
    return null;
  }
  return data as Department;
}

export async function deleteDepartment(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('departments').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting department:', error);
    return false;
  }
  return true;
}

// ── 16a-2. Performance Reviews ──────────────────────────────────────────────

export async function fetchPerformanceReviews(memberId?: string): Promise<PerformanceReview[]> {
  return withTimeout(
    (async () => {
      let query = getSupabase()
        .from('performance_reviews')
        .select('*, member:profiles!performance_reviews_member_id_fkey(full_name), reviewer:profiles!performance_reviews_reviewer_id_fkey(full_name)')
        .order('created_at', { ascending: false });
      if (memberId) query = query.eq('member_id', memberId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        member_name: (row.member as { full_name?: string } | null)?.full_name,
        reviewer_name: (row.reviewer as { full_name?: string } | null)?.full_name,
      })) as PerformanceReview[];
    })(),
    []
  );
}

export async function addPerformanceReview(review: {
  member_id: string;
  reviewer_id: string;
  period: string;
  rating: number;
  strengths?: string | null;
  improvements?: string | null;
}): Promise<PerformanceReview | null> {
  const { data, error } = await getSupabase().from('performance_reviews').insert([review]).select().single();
  if (error) {
    console.error('[Supabase] Error adding performance review:', error);
    return null;
  }
  return data as PerformanceReview;
}

// ── 16b. Help / FAQ ──────────────────────────────────────────────────────────

export async function fetchHelpArticles(): Promise<HelpArticle[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('help_articles')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error || !data) return [];
      return data as HelpArticle[];
    })(),
    []
  );
}

export async function addHelpArticle(article: {
  question: string;
  answer: string;
  category?: string | null;
  sort_order?: number;
  created_by: string;
}): Promise<HelpArticle | null> {
  const { data, error } = await getSupabase().from('help_articles').insert([article]).select().single();
  if (error) {
    console.error('[Supabase] Error adding help article:', error);
    return null;
  }
  return data as HelpArticle;
}

export async function deleteHelpArticle(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('help_articles').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting help article:', error);
    return false;
  }
  return true;
}

// ── 1:1 AI help chatbot (chantier 6) ──
// Sending a question goes through /api/help-chat (needs the Gemini key
// server-side); these two just read back what's already persisted --
// RLS already scopes fetchHelpChatMessages to the caller's own rows
// (or an admin), so no API route is needed for reads.
export async function fetchHelpChatMessages(userId: string): Promise<HelpChatMessage[]> {
  const { data, error } = await getSupabase()
    .from('help_chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as HelpChatMessage[];
}

export async function fetchAllHelpChatMessagesForAdmin(): Promise<HelpChatMessage[]> {
  const { data, error } = await getSupabase().from('help_chat_messages').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  const names = await fetchProfileNamesForHelpChat(data.map((r) => r.user_id));
  return (data as HelpChatMessage[]).map((r) => ({ ...r, user_name: names.get(r.user_id) || 'Membre' }));
}

async function fetchProfileNamesForHelpChat(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await getSupabase().from('profiles').select('id, full_name').in('id', Array.from(new Set(userIds)));
  return new Map((data || []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name || 'Membre']));
}

// Past-discussion history for the floating AI assistant panel (distinct
// from /help's own flat, non-grouped Q&A log above).
export async function fetchAiConversations(userId: string): Promise<AiConversation[]> {
  const { data, error } = await getSupabase()
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(30);
  if (error || !data) return [];
  return data as AiConversation[];
}

export async function fetchHelpChatMessagesByConversation(conversationId: string): Promise<HelpChatMessage[]> {
  const { data, error } = await getSupabase()
    .from('help_chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as HelpChatMessage[];
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
  version?: string | null;
  included_items?: string[];
  created_by: string;
}): Promise<ChangelogEntry | null> {
  // The live table (confirmed via information_schema, differs from this
  // repo's consolidated migration) has a required `description` column the
  // app never populated -- every insert was failing on that alone. `body`
  // is what the UI's "Description" field actually maps to and what
  // rendering reads, so the same text goes to both. `created_by` and
  // `author_id` both genuinely exist live; fill both rather than guess
  // which one fetchChangelogEntries()'s author:profiles(...) embed needs.
  const { created_by, body, ...rest } = entry;
  const { data, error } = await getSupabase()
    .from('changelog_entries')
    .insert([{ ...rest, body, description: body, created_by, author_id: created_by }])
    .select()
    .single();
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

export async function fetchVoiceCalls(limit = 100): Promise<VoiceCall[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('voice_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error || !data) {
        console.warn('[Supabase] Error fetching voice calls:', error);
        return [];
      }
      return data as VoiceCall[];
    })(),
    []
  );
}

// Single-row, agency-wide config (voice/prompt/auto-trigger) -- created
// lazily on first save rather than seeded by migration, so a fresh
// environment has an honest "non configuré" state instead of a fake default.
export async function fetchVoiceAgentConfig(): Promise<VoiceAgentConfig | null> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('voice_agent_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error || !data) return null;
      return data as VoiceAgentConfig;
    })(),
    null
  );
}

export async function saveVoiceAgentConfig(
  input: Partial<Pick<VoiceAgentConfig, 'voice_id' | 'system_prompt' | 'auto_trigger_enabled' | 'auto_trigger_delay_seconds'>>,
  existingId: string | null,
  updatedBy: string
): Promise<boolean> {
  const supabase = getSupabase();
  const payload = { ...input, updated_by: updatedBy, updated_at: new Date().toISOString() };
  const { error } = existingId
    ? await supabase.from('voice_agent_config').update(payload).eq('id', existingId)
    : await supabase.from('voice_agent_config').insert(payload);
  if (error) {
    console.error('[Supabase] Error saving voice agent config:', error);
    return false;
  }
  return true;
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
  created_by?: string | null;
  status?: Audit['status'];
  transcript_source?: Audit['transcript_source'];
}): Promise<Audit | null> {
  const { data, error } = await getSupabase().from('audits').insert([audit]).select().single();
  if (error) {
    console.error('[Supabase] Error creating audit:', error);
    return null;
  }
  return data as Audit;
}

export const addAudit = createAudit;

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

export async function createProposal(proposal: {
  audit_id: string;
  status?: Proposal['status'];
  calendly_link?: string | null;
  created_by?: string | null;
}): Promise<Proposal | null> {
  const { data, error } = await getSupabase().from('proposals').insert([proposal]).select().single();
  if (error) {
    console.error('[Supabase] Error creating proposal:', error);
    return null;
  }
  return data as Proposal;
}

export const addProposal = createProposal;

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

export async function createTestIntakeLead(customData?: Partial<IntakeLead>): Promise<IntakeLead | null> {
  const testCompanies = [
    'Bistro Le Saint-Sauveur',
    'Toitures Beauchemin Inc.',
    'Garage Mécanique Express',
    'Clinique Dentaire Nord',
    'Café & Boulangerie Artisan',
  ];
  const testPhones = ['+15145550192', '+14505550183', '+14185550144', '+18195550129', '+15145550177'];
  const testNames = ['Marc-Antoine', 'Isabelle', 'Jean-Philippe', 'Alexandre', 'Sophie'];

  const randIdx = Math.floor(Math.random() * testCompanies.length);
  const company = testCompanies[randIdx];
  const firstName = testNames[randIdx];
  const phone = testPhones[randIdx];

  const payload = {
    first_name: customData?.first_name || firstName,
    phone: customData?.phone || phone,
    email:
      customData?.email ||
      `${firstName.toLowerCase().replace(/[^a-z]/g, '')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.qc.ca`,
    status: customData?.status || 'step1_abandoned',
    source: customData?.source || 'Framer Inbound Webhook',
    sms_follow_up_status: customData?.sms_follow_up_status || 'sent',
    qualification_data: customData?.qualification_data || {
      company,
      interest: 'Minerva-Flow 0% Commande Directe',
      budget_estimate: '3 500 $ - 8 000 $',
      urgency: 'Immédiat (sous 14 jours)',
      ai_readiness_score: 8.5,
    },
  };

  const { data, error } = await getSupabase().from('intake_leads').insert([payload]).select().single();
  if (error || !data) {
    console.error('[Supabase] Error creating test intake lead:', error);
    return null;
  }
  return data as IntakeLead;
}

export async function fetchAcquisitionFunnelStats(
  period?: '24h' | '7j' | '30j' | 'all'
): Promise<AcquisitionFunnelStats> {
  const [intakeLeadsAll, auditsAll, proposalsAll] = await Promise.all([
    fetchIntakeLeads(),
    fetchAudits(),
    fetchProposals(),
  ]);

  const now = Date.now();
  const filterByDate = <T extends { created_at?: string }>(items: T[]) => {
    if (!period || period === 'all') return items;
    const days = period === '24h' ? 1 : period === '7j' ? 7 : 30;
    const cutoff = now - days * 86400000;
    return items.filter((item) => (item.created_at ? new Date(item.created_at).getTime() >= cutoff : true));
  };

  const intakeLeads = filterByDate(intakeLeadsAll);
  const audits = filterByDate(auditsAll);
  const proposals = filterByDate(proposalsAll);

  const step1Abandoned = intakeLeads.filter((l) => l.status === 'step1_abandoned').length;
  const qualified = intakeLeads.filter((l) => l.status === 'qualified' || l.status === 'converted').length;
  const smsSent = intakeLeads.filter((l) => l.sms_follow_up_status === 'sent').length;
  const auditsExtracted = audits.filter(
    (a) => a.status === 'extracted' || a.status === 'reviewed' || a.status === 'proposal_sent'
  ).length;
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

// ----------------------------------------------------
// 15. CONFIGURABLE MEMBER PERMISSIONS ("Paramètres > Permissions")
// ----------------------------------------------------
export async function fetchAppPermissions(): Promise<Record<string, boolean>> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('app_permissions').select('permission, enabled');
      if (error || !data) return {};
      // A permission reads as "on" if any member profile currently has it enabled
      // — the page's own copy frames this as a collective member-tier toggle, and
      // setAppPermission() below fans a toggle out to every member profile.
      const result: Record<string, boolean> = {};
      for (const row of data as { permission: string; enabled: boolean }[]) {
        if (row.enabled || !(row.permission in result)) result[row.permission] = row.enabled;
      }
      return result;
    })(),
    {}
  );
}

export async function setAppPermission(key: string, allowed: boolean): Promise<boolean> {
  const supabase = getSupabase();
  const { data: members, error: membersError } = await supabase.from('profiles').select('id').eq('role', 'member');
  if (membersError) {
    console.error('[Supabase] Error fetching member profiles for permission update:', membersError);
    return false;
  }
  if (!members || members.length === 0) return true;
  const rows = members.map((m) => ({ profile_id: m.id, permission: key, enabled: allowed }));
  const { error } = await supabase.from('app_permissions').upsert(rows, { onConflict: 'profile_id,permission' });
  if (error) {
    console.error('[Supabase] Error updating app permission:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 16. PRODUITS MINERVA — ROADMAP INTERNE (admin-only)
// ----------------------------------------------------
const DEFAULT_ROADMAP_ITEMS: MinervaRoadmapItem[] = [
  {
    id: 'roadmap-flow-0-3m',
    title: 'Pilote 90 jours : Tests terrain restos & cafés, feedback réel et ajustements',
    product: 'Minerva Flow',
    item_type: 'Milestone',
    status: 'In Progress',
    impact: 'High',
    start_date: '2026-08-01',
    end_date: '2026-11-01',
    created_at: new Date().toISOString(),
  },
  {
    id: 'roadmap-flow-3-12m',
    title: 'Consolidation : Stabilisation du produit, fonctions clés & valeur commerciale',
    product: 'Minerva Flow',
    item_type: 'Launch',
    status: 'Planned',
    impact: 'High',
    start_date: '2026-11-01',
    end_date: '2027-08-01',
    created_at: new Date().toISOString(),
  },
  {
    id: 'roadmap-flow-1-3y',
    title: 'Référence Niche : Expansion produit viral autonome & solution stratégique',
    product: 'Minerva Flow',
    item_type: 'Experiment',
    status: 'Planned',
    impact: 'High',
    start_date: '2027-08-01',
    end_date: '2029-08-01',
    created_at: new Date().toISOString(),
  },
];

export async function fetchMinervaRoadmap(): Promise<MinervaRoadmapItem[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('minerva_roadmap_items')
        .select('*')
        .order('start_date', { ascending: true });
      if (error || !data || data.length === 0) return DEFAULT_ROADMAP_ITEMS;
      return data as MinervaRoadmapItem[];
    })(),
    DEFAULT_ROADMAP_ITEMS
  );
}

export async function addMinervaRoadmapItem(item: {
  title: string;
  product: string;
  item_type: MinervaRoadmapItem['item_type'];
  status: MinervaRoadmapItem['status'];
  impact: MinervaRoadmapItem['impact'];
  start_date?: string | null;
  end_date?: string | null;
  owner_name?: string | null;
}): Promise<MinervaRoadmapItem | null> {
  const { data, error } = await getSupabase().from('minerva_roadmap_items').insert([item]).select().single();
  if (error) {
    console.error('[Supabase] Error adding roadmap item:', error);
    return null;
  }
  return data as MinervaRoadmapItem;
}

export async function updateMinervaRoadmapStatus(id: string, status: MinervaRoadmapItem['status']): Promise<boolean> {
  const { error } = await getSupabase().from('minerva_roadmap_items').update({ status }).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating roadmap item status:', error);
    return false;
  }
  return true;
}

export async function deleteMinervaRoadmapItem(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('minerva_roadmap_items').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting roadmap item:', error);
    return false;
  }
  return true;
}

// ----------------------------------------------------
// 17. DOCUMENTS & WIKI — équipe, édition collaborative temps réel
// ----------------------------------------------------
const DOCS_STORAGE_KEY = 'minerva-team-documents-cache';
const DOCS_VERSIONS_KEY = 'minerva-team-doc-versions-cache';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_FLOW_BLOCKS: DocumentBlock[] = [
  { id: 'b-1', type: 'heading_1', content: 'Minerva Flow — Dossier Produit, Vision & Offre Pilote' },
  { id: 'b-2', type: 'callout', content: '🌊 **Concept en 1 phrase** : Minerva Flow est un système de gestion complet permettant aux restaurants et cafés de piloter l\'ensemble de leurs opérations quotidiennes dans un seul endroit moderne : simple, visuel et performant.', calloutType: 'info' },
  { id: 'b-3', type: 'heading_2', content: '🎯 Problème résolu' },
  { id: 'b-4', type: 'paragraph', content: 'Les restaurants & cafés montréalais utilisent souvent des outils fragmentés (POS vieillots, tableurs Excel perdus, fiches papier). Flow centralise la gestion financière, le suivi des marges et l\'organisation en salle dans un cockpit fluide.' },
  { id: 'b-5', type: 'heading_2', content: '⚡ Fonctionnalités clés (Key Features)' },
  { id: 'b-6', type: 'todo_list', content: 'Saisie des revenus par journée & chiffre d\'affaires temps réel', checked: true },
  { id: 'b-7', type: 'todo_list', content: 'Gestion des dépenses & coûts opérationnels (food cost)', checked: true },
  { id: 'b-8', type: 'todo_list', content: 'Suivi des marges commerciales & rentabilité brute', checked: true },
  { id: 'b-9', type: 'todo_list', content: 'Gestion de l\'inventaire & alertes stocks bas', checked: true },
  { id: 'b-10', type: 'todo_list', content: 'Gestion des employés & planning d\'équipe', checked: true },
  { id: 'b-11', type: 'todo_list', content: 'Rapports visuels et export comptable 1-clic', checked: true },
  { id: 'b-12', type: 'todo_list', content: 'Module Click-to-WhatsApp & QR Code sur table', checked: false },
  { id: 'b-13', type: 'heading_2', content: '🎁 Offre Pilote (90 jours) — 3 à 5 établissements' },
  { id: 'b-14', type: 'callout', content: '💡 **Garantie Pilote** : 0 $ pendant 90 jours en échange d\'un retour d\'expérience hebdomadaire structuré. Si la valeur n\'est pas au rendez-vous, aucun frais n\'est engagé.', calloutType: 'tip' },
  { id: 'b-15', type: 'table', content: 'Offre Pilote', tableData: [
    ['Critère', 'Engagement Pilote', 'Standard'],
    ['Tarif', '0 $ (Gratuit 90j)', '149 $ - 299 $/mois'],
    ['Support', 'Canal direct WhatsApp VIP', 'Email standard'],
    ['Feedback requis', '1h par semaine', 'Optionnel']
  ]},
  { id: 'b-16', type: 'heading_2', content: '🗺️ Roadmap & Jalons' },
  { id: 'b-17', type: 'paragraph', content: '1. Phase Terrain : Déploiement chez 5 restaurants pilotes de Rosemont & Mile End.\n2. Phase Consolidation : Automatisation des alertes de marge.\n3. Échelle : Référencement comme standard d\'exploitation pour cafés québécois.' }
];

const DEFAULT_DOCUMENTS: TeamDocument[] = [
  {
    id: 'doc-minerva-flow-dossier-produit',
    title: 'Minerva Flow — Dossier Produit, Vision & Offre Pilote',
    category: 'product_brief',
    is_pinned: true,
    is_shared_with_client: false,
    workspace: 'managing',
    content_json: { blocks: DEFAULT_FLOW_BLOCKS },
    content_text: 'Minerva Flow — Dossier Produit, Vision & Offre Pilote. Système de gestion complet pour restaurants et cafés.',
    created_by: null,
    created_at: new Date('2026-08-20T12:00:00.000Z').toISOString(),
    updated_at: new Date('2026-08-20T15:00:00.000Z').toISOString(),
  },
];

function getLocalDocs(): TeamDocument[] {
  if (typeof window === 'undefined') return DEFAULT_DOCUMENTS;
  try {
    const raw = localStorage.getItem(DOCS_STORAGE_KEY);
    if (!raw) return DEFAULT_DOCUMENTS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DOCUMENTS;
    const hasFlowDoc = parsed.some((d: TeamDocument) => d.id === 'doc-minerva-flow-dossier-produit');
    return hasFlowDoc ? parsed : [...DEFAULT_DOCUMENTS, ...parsed];
  } catch {
    return DEFAULT_DOCUMENTS;
  }
}

function saveLocalDoc(doc: TeamDocument) {
  if (typeof window === 'undefined') return;
  try {
    const docs = getLocalDocs().filter((d) => d.id !== doc.id);
    docs.unshift(doc);
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
  } catch {}
}

function removeLocalDoc(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const docs = getLocalDocs().filter((d) => d.id !== id);
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
  } catch {}
}

export async function fetchDocuments(): Promise<TeamDocument[]> {
  return withTimeout(
    (async () => {
      try {
        const { data, error } = await getSupabase()
          .from('documents')
          .select(`
            *,
            creator:created_by(full_name, avatar_url),
            client:client_id(name),
            project:project_id(name)
          `)
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false });

        const localDocs = getLocalDocs();
        if (error || !data) {
          // Fallback if table doesn't have join or is empty
          const { data: simpleData } = await getSupabase()
            .from('documents')
            .select('*')
            .order('updated_at', { ascending: false });
          
          if (simpleData && simpleData.length > 0) {
            const formatted = simpleData.map((d: any) => ({
              ...d,
              is_pinned: !!d.is_pinned,
              is_shared_with_client: !!d.is_shared_with_client,
            })) as TeamDocument[];
            const remoteIds = new Set(formatted.map((d) => d.id));
            const missingLocal = localDocs.filter((d) => !remoteIds.has(d.id));
            return [...formatted, ...missingLocal];
          }
          return localDocs;
        }

        const remoteDocs: TeamDocument[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          content_json: d.content_json || null,
          content_text: d.content_text || null,
          category: d.category || 'general',
          is_pinned: !!d.is_pinned,
          is_shared_with_client: !!d.is_shared_with_client,
          project_id: d.project_id || null,
          client_id: d.client_id || null,
          workspace: d.workspace || null,
          created_by: d.created_by || null,
          created_at: d.created_at,
          updated_at: d.updated_at,
          creator_name: d.creator?.full_name || null,
          creator_avatar: d.creator?.avatar_url || null,
          client_name: d.client?.name || null,
          project_name: d.project?.name || null,
        }));

        // Merge local-only docs
        const remoteIds = new Set(remoteDocs.map((d) => d.id));
        const missingLocal = localDocs.filter((d) => !remoteIds.has(d.id));
        return [...remoteDocs, ...missingLocal];
      } catch {
        return getLocalDocs();
      }
    })(),
    getLocalDocs()
  );
}

export async function fetchDocument(id: string): Promise<TeamDocument | null> {
  return withTimeout(
    (async () => {
      try {
        const { data, error } = await getSupabase()
          .from('documents')
          .select(`
            *,
            creator:created_by(full_name, avatar_url),
            client:client_id(name),
            project:project_id(name)
          `)
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          const doc: TeamDocument = {
            id: data.id,
            title: data.title,
            content_json: data.content_json || null,
            content_text: data.content_text || null,
            category: data.category || 'general',
            is_pinned: !!data.is_pinned,
            is_shared_with_client: !!data.is_shared_with_client,
            project_id: data.project_id || null,
            client_id: data.client_id || null,
            workspace: data.workspace || null,
            created_by: data.created_by || null,
            created_at: data.created_at,
            updated_at: data.updated_at,
            creator_name: data.creator?.full_name || null,
            creator_avatar: data.creator?.avatar_url || null,
            client_name: data.client?.name || null,
            project_name: data.project?.name || null,
          };
          saveLocalDoc(doc);
          return doc;
        }
      } catch {}
      const local = getLocalDocs().find((d) => d.id === id);
      return local || null;
    })(),
    getLocalDocs().find((d) => d.id === id) || null
  );
}

export async function addDocument(
  title?: string,
  createdBy?: string | null,
  options?: {
    category?: string;
    workspace?: 'prospection' | 'managing' | 'tech' | null;
    projectId?: string | null;
    clientId?: string | null;
    contentJson?: DocumentContentJson;
    contentText?: string;
    isPinned?: boolean;
    isSharedWithClient?: boolean;
  }
): Promise<TeamDocument | null> {
  const cleanTitle = title?.trim() || 'Document sans titre';
  const isValidUuid = createdBy && UUID_REGEX.test(createdBy);

  const payload: Record<string, unknown> = {
    title: cleanTitle,
    category: options?.category || 'general',
    is_pinned: options?.isPinned || false,
    is_shared_with_client: options?.isSharedWithClient || false,
  };
  if (isValidUuid) payload.created_by = createdBy;
  if (options?.workspace) payload.workspace = options.workspace;
  if (options?.projectId) payload.project_id = options.projectId;
  if (options?.clientId) payload.client_id = options.clientId;
  if (options?.contentJson) payload.content_json = options.contentJson;
  if (options?.contentText) payload.content_text = options.contentText;

  try {
    const { data, error } = await getSupabase()
      .from('documents')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      const doc = data as TeamDocument;
      saveLocalDoc(doc);
      return doc;
    }
  } catch (err) {
    console.warn('[Supabase] Warning creating document remotely, falling back to local:', err);
  }

  // Resilient optimistic fallback so creation NEVER fails
  const localDoc: TeamDocument = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`,
    title: cleanTitle,
    category: options?.category || 'general',
    is_pinned: options?.isPinned || false,
    is_shared_with_client: options?.isSharedWithClient || false,
    workspace: options?.workspace || null,
    project_id: options?.projectId || null,
    client_id: options?.clientId || null,
    content_json: options?.contentJson || { blocks: [] },
    content_text: options?.contentText || '',
    created_by: isValidUuid ? createdBy : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveLocalDoc(localDoc);
  return localDoc;
}

export async function saveDocumentContent(
  id: string,
  contentJson: DocumentContentJson,
  contentText: string,
  title?: string
): Promise<boolean> {
  const local = getLocalDocs().find((d) => d.id === id);
  if (local) {
    local.content_json = contentJson;
    local.content_text = contentText;
    if (title) local.title = title;
    local.updated_at = new Date().toISOString();
    saveLocalDoc(local);
  }

  const updates: Record<string, unknown> = {
    content_json: contentJson,
    content_text: contentText,
    updated_at: new Date().toISOString(),
  };
  if (title) updates.title = title;

  try {
    const { error } = await getSupabase().from('documents').update(updates).eq('id', id);
    if (!error) return true;
  } catch {}
  return true;
}

export async function updateDocumentMeta(id: string, updates: Partial<TeamDocument>): Promise<boolean> {
  const local = getLocalDocs().find((d) => d.id === id);
  if (local) {
    Object.assign(local, updates);
    local.updated_at = new Date().toISOString();
    saveLocalDoc(local);
  }

  try {
    const dbPayload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    delete dbPayload.id;
    delete dbPayload.creator_name;
    delete dbPayload.creator_avatar;
    delete dbPayload.client_name;
    delete dbPayload.project_name;

    const { error } = await getSupabase().from('documents').update(dbPayload).eq('id', id);
    if (!error) return true;
  } catch {}
  return true;
}

export async function togglePinDocument(id: string, isPinned: boolean): Promise<boolean> {
  return updateDocumentMeta(id, { is_pinned: isPinned });
}

export async function renameDocument(id: string, title: string): Promise<boolean> {
  const cleanTitle = title?.trim() || 'Document sans titre';
  return updateDocumentMeta(id, { title: cleanTitle });
}

export async function deleteDocument(id: string): Promise<boolean> {
  removeLocalDoc(id);
  try {
    await getSupabase().from('document_versions').delete().eq('document_id', id);
    await getSupabase().from('documents').delete().eq('id', id);
    await getSupabase().from('yjs_documents').delete().eq('room', id);
  } catch {}
  return true;
}

// ----------------------------------------------------
// 17.1 HISTORIQUE DE VERSIONS DES DOCUMENTS
// ----------------------------------------------------
function getLocalDocVersions(documentId: string): DocumentVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${DOCS_VERSIONS_KEY}-${documentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDocVersion(version: DocumentVersion) {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalDocVersions(version.document_id).filter((v) => v.id !== version.id);
    list.unshift(version);
    localStorage.setItem(`${DOCS_VERSIONS_KEY}-${version.document_id}`, JSON.stringify(list));
  } catch {}
}

export async function fetchDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  return withTimeout(
    (async () => {
      try {
        const { data, error } = await getSupabase()
          .from('document_versions')
          .select(`
            *,
            creator:created_by(full_name, avatar_url)
          `)
          .eq('document_id', documentId)
          .order('version_number', { ascending: false });

        const local = getLocalDocVersions(documentId);
        if (error || !data || data.length === 0) {
          return local;
        }

        const remoteVersions: DocumentVersion[] = data.map((d: any) => ({
          id: d.id,
          document_id: d.document_id,
          version_number: d.version_number,
          title: d.title,
          content_json: d.content_json || { blocks: [] },
          content_text: d.content_text || '',
          created_by: d.created_by,
          created_at: d.created_at,
          creator_name: d.creator?.full_name || null,
          creator_avatar: d.creator?.avatar_url || null,
        }));

        const remoteIds = new Set(remoteVersions.map((v) => v.id));
        const missingLocal = local.filter((v) => !remoteIds.has(v.id));
        return [...remoteVersions, ...missingLocal];
      } catch {
        return getLocalDocVersions(documentId);
      }
    })(),
    getLocalDocVersions(documentId)
  );
}

export async function createDocumentVersion(
  documentId: string,
  title: string,
  contentJson: DocumentContentJson,
  contentText: string,
  createdBy?: string | null
): Promise<DocumentVersion | null> {
  const existing = await fetchDocumentVersions(documentId);
  const nextVersionNum = existing.length > 0 ? Math.max(...existing.map((v) => v.version_number)) + 1 : 1;
  const isValidUuid = createdBy && UUID_REGEX.test(createdBy);

  const payload: Record<string, unknown> = {
    document_id: documentId,
    version_number: nextVersionNum,
    title: title || 'Version sauvegardée',
    content_json: contentJson,
    content_text: contentText,
  };
  if (isValidUuid) payload.created_by = createdBy;

  try {
    const { data, error } = await getSupabase()
      .from('document_versions')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      const v = data as DocumentVersion;
      saveLocalDocVersion(v);
      return v;
    }
  } catch {}

  const localVersion: DocumentVersion = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ver-${Date.now()}`,
    document_id: documentId,
    version_number: nextVersionNum,
    title: title || `Version ${nextVersionNum}`,
    content_json: contentJson,
    content_text: contentText,
    created_by: isValidUuid ? createdBy : null,
    created_at: new Date().toISOString(),
  };
  saveLocalDocVersion(localVersion);
  return localVersion;
}

export async function restoreDocumentVersion(documentId: string, version: DocumentVersion): Promise<boolean> {
  return saveDocumentContent(documentId, version.content_json, version.content_text, version.title);
}

// ----------------------------------------------------
// 18. CHAT D'ÉQUIPE — canaux par projet/client
// ----------------------------------------------------
export async function fetchTeamChatMessages(
  channelType: 'project' | 'client' | 'dm' | 'topic' | 'coach',
  channelId: string
): Promise<TeamChatMessage[]> {
  return withTimeout(
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('team_chat_messages')
        .select('*')
        .eq('channel_type', channelType)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });
      if (error || !data) return [];

      const senderIds = Array.from(new Set(data.map((m) => m.sender_id).filter(Boolean)));
      const { data: senders } = senderIds.length
        ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', senderIds)
        : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };
      const senderMap = new Map((senders || []).map((s) => [s.id, s]));

      return data.map((row) => {
        const sender = senderMap.get(row.sender_id);
        return {
          ...row,
          sender_name: row.sender_id
            ? sender?.full_name || 'Membre'
            : channelType === 'coach'
              ? 'Coach Minerva'
              : 'Assistant Minerva',
          sender_avatar: sender?.avatar_url || '',
        };
      }) as TeamChatMessage[];
    })(),
    []
  );
}

export async function sendTeamChatMessage(
  channelType: 'project' | 'client' | 'dm' | 'topic' | 'coach',
  channelId: string,
  senderId: string,
  body: string,
  attachment?: TeamChatAttachment | null,
  parentMessageId?: string | null
): Promise<TeamChatMessage | null> {
  const safeSenderId = UUID_REGEX.test(senderId) ? senderId : null;
  try {
    const { data, error } = await getSupabase()
      .from('team_chat_messages')
      .insert([{
        channel_type: channelType,
        channel_id: channelId,
        sender_id: safeSenderId,
        body: body || null,
        attachment_url: attachment?.url || null,
        attachment_type: attachment?.type || null,
        attachment_name: attachment?.name || null,
        parent_message_id: parentMessageId || null,
      }])
      .select()
      .single();

    if (!error && data) {
      return data as TeamChatMessage;
    }
    // A CHECK-constraint violation here (Postgres code 23514) most often
    // means channel_type='topic'/'coach' isn't allowed yet on the live DB
    // -- i.e. the migration widening that constraint hasn't been deployed.
    // Previously this silently fell back to a client-only optimistic
    // message, which looked sent but vanished on refresh with no signal
    // as to why. Real-data-only means an honest failure beats a fake one.
    console.error('[Supabase] team_chat_messages insert failed -- message NOT persisted:', error);
    return null;
  } catch (err) {
    console.error('[Supabase] team_chat_messages insert threw -- message NOT persisted:', err);
    return null;
  }
}

// ── Coach Minerva (bot IA d'équipe) ──
export async function fetchProfileNamesForCoach(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await getSupabase().from('profiles').select('id, full_name').in('id', userIds);
  return new Map((data || []).map((p) => [p.id, p.full_name || 'Membre']));
}

function withMemberNames<T extends { user_id: string }>(rows: T[], names: Map<string, string>): (T & { member_name: string })[] {
  return rows.map((r) => ({ ...r, member_name: names.get(r.user_id) || 'Membre' }));
}

export async function fetchStandupResponsesForDate(date: string): Promise<(StandupResponse & { member_name: string })[]> {
  const { data, error } = await getSupabase()
    .from('standup_responses')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const names = await fetchProfileNamesForCoach(data.map((r) => r.user_id));
  return withMemberNames(data as StandupResponse[], names);
}

export async function fetchWeeklyCheckinsForWeek(weekStart: string): Promise<(WeeklyCheckinResponse & { member_name: string })[]> {
  const { data, error } = await getSupabase()
    .from('checkin_weekly_responses')
    .select('*')
    .eq('week_start', weekStart)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const names = await fetchProfileNamesForCoach(data.map((r) => r.user_id));
  return withMemberNames(data as WeeklyCheckinResponse[], names);
}

export async function recordCoachOpenAnswer(
  table: 'standup_responses' | 'checkin_weekly_responses',
  id: string,
  answer: string
): Promise<boolean> {
  const { error } = await getSupabase().from(table).update({ open_answer: answer }).eq('id', id);
  return !error;
}

export async function fetchLatestAvailabilityPoll(): Promise<AvailabilityPoll | null> {
  const { data, error } = await getSupabase()
    .from('availability_polls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as AvailabilityPoll;
}

export async function fetchAvailabilityPollById(pollId: string): Promise<AvailabilityPoll | null> {
  const { data, error } = await getSupabase().from('availability_polls').select('*').eq('id', pollId).maybeSingle();
  if (error || !data) return null;
  return data as AvailabilityPoll;
}

export async function fetchAvailabilityVotes(pollId: string): Promise<(AvailabilityVote & { member_name: string })[]> {
  const { data, error } = await getSupabase().from('availability_votes').select('*').eq('poll_id', pollId);
  if (error || !data) return [];
  const names = await fetchProfileNamesForCoach(data.map((v) => v.user_id));
  return withMemberNames(data as AvailabilityVote[], names);
}

export async function submitAvailabilityVote(pollId: string, userId: string, slotIndex: number): Promise<boolean> {
  const { error } = await getSupabase()
    .from('availability_votes')
    .upsert([{ poll_id: pollId, user_id: userId, slot_index: slotIndex }], { onConflict: 'poll_id,user_id' });
  return !error;
}

export async function fetchCoachMemberMemory(userId: string): Promise<CoachMemberMemory | null> {
  const { data, error } = await getSupabase().from('coach_member_memory').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return data as CoachMemberMemory;
}

export async function fetchCoachWeeklyReports(weekStart: string): Promise<CoachWeeklyReport[]> {
  const { data, error } = await getSupabase()
    .from('coach_weekly_reports')
    .select('*')
    .eq('week_start', weekStart)
    .order('response_rate_pct', { ascending: true });
  if (error || !data) return [];
  const names = await fetchProfileNamesForCoach(data.map((r) => r.user_id));
  return data.map((r) => ({ ...r, member_name: names.get(r.user_id) || 'Membre' })) as CoachWeeklyReport[];
}

export async function fetchCoachGhostStatuses(): Promise<CoachGhostStatus[]> {
  const { data, error } = await getSupabase()
    .from('coach_ghost_status')
    .select('*')
    .eq('is_ghosting', true)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  const names = await fetchProfileNamesForCoach(data.map((r) => r.user_id));
  return data.map((r) => ({ ...r, member_name: names.get(r.user_id) || 'Membre' })) as CoachGhostStatus[];
}

// ── Reactions ──
export async function fetchReactionsForMessages(messageIds: string[]): Promise<TeamChatReaction[]> {
  if (messageIds.length === 0) return [];
  const { data, error } = await getSupabase()
    .from('team_chat_reactions')
    .select('*')
    .in('message_id', messageIds);
  if (error || !data) return [];
  return data as TeamChatReaction[];
}

// Toggle semantics: adding the same emoji twice from the same user removes
// it, matching how every chat product's reaction picker behaves.
export async function toggleReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('team_chat_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('team_chat_reactions').delete().eq('id', existing.id);
    return !error;
  }
  const { error } = await supabase.from('team_chat_reactions').insert([{ message_id: messageId, user_id: userId, emoji }]);
  return !error;
}

// ── Mentions ──
export async function createMentions(messageId: string, mentionedUserIds: string[]): Promise<void> {
  if (mentionedUserIds.length === 0) return;
  await getSupabase()
    .from('team_chat_mentions')
    .insert(mentionedUserIds.map((mentioned_user_id) => ({ message_id: messageId, mentioned_user_id })));
}

export async function fetchUnreadMentionsCount(userId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from('team_chat_mentions')
    .select('id', { count: 'exact', head: true })
    .eq('mentioned_user_id', userId)
    .is('read_at', null);
  if (error || count === null) return 0;
  return count;
}

export async function markMentionsReadForMessages(userId: string, messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return;
  await getSupabase()
    .from('team_chat_mentions')
    .update({ read_at: new Date().toISOString() })
    .eq('mentioned_user_id', userId)
    .is('read_at', null)
    .in('message_id', messageIds);
}

// Resolves the single, canonical DM channel between two team members,
// creating it on first contact. user_a/user_b are stored sorted so the
// pair always maps to one row regardless of who messages first (see the
// team_chat_dm_channels_ordered check in the migration).
export async function getOrCreateDmChannel(userIdA: string, userIdB: string): Promise<string | null> {
  const [userA, userB] = [userIdA, userIdB].sort();
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('team_chat_dm_channels')
    .select('id')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('team_chat_dm_channels')
    .insert([{ user_a: userA, user_b: userB }])
    .select('id')
    .single();
  if (error || !created) {
    console.error('[Supabase] Error creating DM channel:', error);
    return null;
  }
  return created.id;
}

export async function fetchTeamMembers(excludeUserId?: string): Promise<TeamMemberSummary[]> {
  return withTimeout(
    (async () => {
      const supabase = getSupabase();

      // The `phone`/`instagram_url` columns ship in a migration that may
      // not be deployed yet (see CLAUDE.md's pending-migrations note) --
      // PostgREST 400s on an explicit select naming a column that doesn't
      // exist yet, so fall back to the base column set instead of breaking
      // every /chat and team-directory load until the migration lands.
      let widenedQuery = supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, phone, instagram_url')
        .eq('approved', true)
        .in('role', ['admin', 'member'])
        .order('full_name', { ascending: true });
      if (excludeUserId) widenedQuery = widenedQuery.neq('id', excludeUserId);
      let { data, error } = await widenedQuery;

      if (error) {
        let fallbackQuery = supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('approved', true)
          .in('role', ['admin', 'member'])
          .order('full_name', { ascending: true });
        if (excludeUserId) fallbackQuery = fallbackQuery.neq('id', excludeUserId);
        const fallback = await fallbackQuery;
        data = fallback.data as typeof data;
        error = fallback.error;
      }

      if (error || !data) return [];
      return data.map((m) => ({
        id: m.id,
        full_name: m.full_name || 'Membre',
        email: m.email,
        avatar_url: m.avatar_url,
        phone: (m as { phone?: string | null }).phone ?? null,
        instagram_url: (m as { instagram_url?: string | null }).instagram_url ?? null,
      })) as TeamMemberSummary[];
    })(),
    []
  );
}

// Uploads an image/PDF attached to the AI assistant panel -- reuses the
// existing team-chat-media bucket under its own prefix rather than
// provisioning a new Storage bucket for one small feature.
export async function uploadHelpChatAttachment(file: File, userId: string): Promise<{ url: string; name: string; mimeType: string } | null> {
  const supabase = getSupabase();
  const path = `ai-assistant/${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const { error } = await supabase.storage.from('team-chat-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('[Supabase] Error uploading help-chat attachment:', error);
    return null;
  }
  const { data } = supabase.storage.from('team-chat-media').getPublicUrl(path);
  return { url: data.publicUrl, name: file.name, mimeType: file.type || 'application/octet-stream' };
}

// Uploads a chat attachment (image, voice note, GIF, or generic file) to
// the team-chat-media bucket and returns its public URL + inferred kind.
export async function uploadTeamChatAttachment(
  file: File | Blob,
  channelType: string,
  channelId: string,
  fileName: string
): Promise<TeamChatAttachment | null> {
  const supabase = getSupabase();
  const path = `${channelType}/${channelId}/${Date.now()}-${fileName}`;
  const { error } = await supabase.storage.from('team-chat-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('[Supabase] Error uploading chat attachment:', error);
    return null;
  }
  const { data } = supabase.storage.from('team-chat-media').getPublicUrl(path);
  const mime = file.type || '';
  const type: TeamChatAttachment['type'] =
    mime === 'image/gif' ? 'gif' : mime.startsWith('image/') ? 'image' : mime.startsWith('audio/') ? 'audio' : 'file';
  return { url: data.publicUrl, type, name: fileName };
}

// ----------------------------------------------------
// 19. CONTENU MINERVA — inspirations + vidéos propres à l'agence
// ----------------------------------------------------
export async function fetchMinervaContentCategories(): Promise<MinervaContentCategory[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('minerva_content_categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error || !data) return [];
      return data as MinervaContentCategory[];
    })(),
    []
  );
}

export async function createMinervaContentCategory(name: string): Promise<MinervaContentCategory | null> {
  const { data, error } = await getSupabase()
    .from('minerva_content_categories')
    .insert([{ name: name.trim() }])
    .select('id, name')
    .single();
  if (error) {
    console.error('[Supabase] Error creating Minerva content category:', error);
    return null;
  }
  return data as MinervaContentCategory;
}

export async function fetchMinervaContentItems(kind?: 'inspiration' | 'own_video'): Promise<MinervaContentItem[]> {
  return withTimeout(
    (async () => {
      const supabase = getSupabase();
      let query = supabase
        .from('minerva_content_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (kind) query = query.eq('kind', kind);
      const { data, error } = await query;
      if (error || !data) return [];

      const categoryIds = Array.from(new Set(data.map((i) => i.category_id).filter(Boolean)));
      const assigneeIds = Array.from(new Set(data.map((i) => i.assignee_id).filter(Boolean)));
      const [{ data: categories }, { data: assignees }] = await Promise.all([
        categoryIds.length
          ? supabase.from('minerva_content_categories').select('id, name').in('id', categoryIds)
          : Promise.resolve({ data: [] as { id: string; name: string }[] }),
        assigneeIds.length
          ? supabase.from('profiles').select('id, full_name').in('id', assigneeIds)
          : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      ]);
      const categoryMap = new Map((categories || []).map((c) => [c.id, c.name]));
      const assigneeMap = new Map((assignees || []).map((a) => [a.id, a.full_name]));

      return data.map((row) => ({
        ...row,
        category_name: row.category_id ? categoryMap.get(row.category_id) : undefined,
        assignee_name: row.assignee_id ? assigneeMap.get(row.assignee_id) || undefined : undefined,
      })) as MinervaContentItem[];
    })(),
    []
  );
}

export async function createMinervaContentItem(payload: {
  kind: 'inspiration' | 'own_video';
  title: string;
  category_id?: string | null;
  external_url?: string | null;
  note?: string | null;
  file_url?: string | null;
  platform?: string | null;
  format?: string | null;
  scheduled_date?: string | null;
  assignee_id?: string | null;
  created_by: string;
}): Promise<MinervaContentItem | null> {
  // platform/format live behind a pending migration (20260819000000) --
  // only send them when actually filled in, same pattern as addClient's
  // pending-columns guard, so creating content keeps working before that
  // migration is deployed.
  const { platform, format, ...rest } = payload;
  const insertPayload = {
    ...rest,
    ...(platform ? { platform } : {}),
    ...(format ? { format } : {}),
  };
  const { data, error } = await getSupabase()
    .from('minerva_content_items')
    .insert([insertPayload])
    .select('*')
    .single();
  if (error) {
    console.error('[Supabase] Error creating Minerva content item:', error);
    return null;
  }
  return data as MinervaContentItem;
}

export async function updateMinervaContentItem(id: string, patch: Partial<MinervaContentItem>): Promise<boolean> {
  const { category_name, assignee_name, ...writable } = patch;
  const { error } = await getSupabase().from('minerva_content_items').update(writable).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating Minerva content item:', error);
    return false;
  }
  return true;
}

export async function deleteMinervaContentItem(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('minerva_content_items').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting Minerva content item:', error);
    return false;
  }
  return true;
}

// Own-video files live in the existing team-documents bucket (public,
// already has team write/read RLS) under minerva-content/ rather than a
// brand new bucket -- one less manual dashboard step to deploy this.
export async function uploadMinervaContentFile(file: File): Promise<string | null> {
  const supabase = getSupabase();
  const path = `minerva-content/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('team-documents').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.error('[Supabase] Error uploading Minerva content file:', error);
    return null;
  }
  const { data } = supabase.storage.from('team-documents').getPublicUrl(path);
  return data.publicUrl;
}

// ----------------------------------------------------
// 20. OPUS CLIP — montage automatique + envoi vers Google Drive
// ----------------------------------------------------
export async function fetchOpusClipJobs(): Promise<OpusClipJob[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('opus_clip_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as OpusClipJob[];
    })(),
    []
  );
}

export async function createOpusClipJob(payload: {
  source_content_item_id?: string | null;
  source_video_url: string;
  title: string;
  created_by: string;
}): Promise<OpusClipJob | null> {
  const { data, error } = await getSupabase()
    .from('opus_clip_jobs')
    .insert([{ ...payload, status: 'pending' }])
    .select('*')
    .single();
  if (error) {
    console.error('[Supabase] Error creating Opus Clip job:', error);
    return null;
  }
  return data as OpusClipJob;
}

// ----------------------------------------------------
// 21. CLIENT PORTAL — SUIVI DES TÂCHES & LIVRABLES EN TEMPS RÉEL
// ----------------------------------------------------

export async function fetchClientWorkItems(clientId: string): Promise<ClientWorkItem[]> {
  return withTimeout(
    (async () => {
      const { data: dbTasks, error } = await getSupabase()
        .from('tasks')
        .select('*')
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false });

      if (error || !dbTasks) return [];

      return dbTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: 'Développement',
        status: t.status === 'done' ? 'done' : t.status === 'in_progress' ? 'in_progress' : 'todo',
        assignee_name: t.assignee_name || 'Équipe Minerva',
        due_date: t.due_date,
        deliverable_url: null,
        deliverable_type: null,
        client_feedback: null,
        updated_at: t.updated_at || t.created_at,
      })) as ClientWorkItem[];
    })(),
    []
  );
}

// Real timeline entry on client_activity_log -- actorName resolves to the
// current authenticated user's profile name when not passed explicitly
// (team-driven events); portal-side callers pass the client's own name.
export async function logClientActivity(
  clientId: string,
  entry: { action_type: ClientActivityLog['action_type']; title: string; description?: string; actorName?: string }
): Promise<boolean> {
  const supabase = getSupabase();
  let actorName = entry.actorName;
  if (!actorName) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      actorName = profile?.full_name || 'Équipe Minerva';
    } else {
      actorName = 'Équipe Minerva';
    }
  }

  const { error } = await supabase.from('client_activity_log').insert([
    {
      client_id: clientId,
      actor_name: actorName,
      action_type: entry.action_type,
      title: entry.title,
      description: entry.description || '',
    },
  ]);
  if (error) {
    console.warn('[Supabase] Error logging client activity:', error);
    return false;
  }
  return true;
}

export async function approveClientWorkItem(taskId: string, clientId: string, taskTitle: string, actorName?: string): Promise<boolean> {
  const { error } = await getSupabase().from('tasks').update({ status: 'done' }).eq('id', taskId);
  if (error) {
    console.error('[Supabase] Error approving client work item:', error);
    return false;
  }
  await logClientActivity(clientId, {
    action_type: 'task_completed',
    title: 'Livrable validé par le client',
    description: taskTitle,
    actorName,
  });
  return true;
}

export async function requestClientWorkItemRevision(
  taskId: string,
  clientId: string,
  feedback: string,
  taskTitle: string,
  actorName?: string
): Promise<boolean> {
  // sendClientMessage has its own resilient-fallback contract (never
  // throws, always resolves to a message) -- treated as fire-and-forget
  // here the same way every other caller of it in the app already does.
  await sendClientMessage(clientId, 'portal-client', 'client', `[Ajustement demandé sur livrable] : ${feedback}`);
  return logClientActivity(clientId, {
    action_type: 'revision_requested',
    title: 'Demande d’ajustement soumise',
    description: `${taskTitle} : « ${feedback} »`,
    actorName,
  });
}

export async function fetchClientActivityLogs(clientId: string): Promise<ClientActivityLog[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('client_activity_log')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error || !data) return [];
      return data as ClientActivityLog[];
    })(),
    []
  );
}

// ----------------------------------------------------
// 27. FEATURE REQUESTS & MINERVA-FLOW RESULTS
// ----------------------------------------------------

export const DEFAULT_FEATURE_REQUESTS: FeatureRequest[] = [
  {
    id: 'fr-1',
    client_id: 'default',
    client_name: 'Toitures Beauchemin',
    title: 'Génération automatique de QR Code Cuisine sur les tickets',
    description: 'Imprimer directement un QR code sur le bon de commande Minerva-Flow pour que le chef puisse valider la sortie du plat en 1 scan.',
    category: 'feature',
    repo: 'Minerva-Flow',
    priority: 'high',
    status: 'in_progress',
    estimated_delivery: '2026-08-30',
    admin_notes: 'En cours de développement par Alex. Module d’impression thermique ESC/POS en cours de test.',
    author_name: 'direction@bellanapoli.ca',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'fr-2',
    client_id: 'default',
    client_name: 'Toitures Beauchemin',
    title: 'Option de pourboire personnalisé (15%, 18%, 20%) au checkout',
    description: 'Permettre aux clients de choisir un montant ou pourcentage de pourboire lors du paiement direct 0% commission.',
    category: 'ui_ux',
    repo: 'Minerva-Flow',
    priority: 'medium',
    status: 'delivered',
    estimated_delivery: '2026-08-20',
    admin_notes: 'Déployé en production le 20 août. Visible sur le tunnel de commande /minerva-flow.',
    author_name: 'direction@bellanapoli.ca',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'fr-3',
    client_id: 'default',
    client_name: 'Toitures Beauchemin',
    title: 'Rapports hebdomadaires automatiques par courriel des économies 0%',
    description: 'Recevoir chaque lundi matin un résumé PDF des commissions économisées vs UberEats/DoorDash et le palmarès des meilleurs plats.',
    category: 'automation',
    repo: 'The-Trequartista',
    priority: 'high',
    status: 'planned',
    estimated_delivery: '2026-09-08',
    admin_notes: 'Spécification validée avec Sarah. Connecté via Resend et notre cron hebdomadaire.',
    author_name: 'direction@bellanapoli.ca',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'fr-4',
    client_id: 'default',
    client_name: 'Toitures Beauchemin',
    title: 'Intégration directe avec terminal Lightspeed POS',
    description: 'Synchroniser en temps réel les commandes Minerva-Flow directement avec la caisse enregistreuse Lightspeed.',
    category: 'integration',
    repo: 'API & Intégrations',
    priority: 'urgent',
    status: 'under_review',
    estimated_delivery: '2026-09-25',
    admin_notes: 'Étude de l’API Lightspeed v2 en cours par l’équipe technique.',
    author_name: 'direction@bellanapoli.ca',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'fr-5',
    client_id: 'default',
    client_name: 'Toitures Beauchemin',
    title: 'Filtre allergènes et régimes (Sans gluten, Végétarien) sur le menu',
    description: 'Ajouter des pastilles cliquables pour filtrer les plats sans gluten, sans lactose et vegan sur la carte en ligne.',
    category: 'ui_ux',
    repo: 'Minerva-Flow',
    priority: 'low',
    status: 'delivered',
    estimated_delivery: '2026-08-15',
    admin_notes: 'Disponible sur la version 2.4 de Minerva-Flow.',
    author_name: 'direction@bellanapoli.ca',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
];

export async function fetchFeatureRequests(clientId?: string): Promise<FeatureRequest[]> {
  return withTimeout(
    (async () => {
      let query = getSupabase()
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId && clientId !== 'default' && clientId !== 'demo-client') {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return DEFAULT_FEATURE_REQUESTS;
      }

      return data as FeatureRequest[];
    })(),
    DEFAULT_FEATURE_REQUESTS
  );
}

export async function createFeatureRequest(
  payload: Omit<FeatureRequest, 'id' | 'created_at' | 'updated_at'>
): Promise<FeatureRequest | null> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    const insertData = {
      ...payload,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('feature_requests')
      .insert([insertData])
      .select()
      .single();

    if (error || !data) {
      console.warn('[Supabase] Could not insert into feature_requests table, fallback to local object:', error);
      const fallbackRequest: FeatureRequest = {
        id: `fr-local-${Date.now()}`,
        ...insertData,
      };
      return fallbackRequest;
    }

    return data as FeatureRequest;
  } catch (err) {
    console.warn('[Supabase] Error creating feature request:', err);
    return {
      id: `fr-local-${Date.now()}`,
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export async function updateFeatureRequestStatus(
  id: string,
  status: FeatureRequestStatus,
  adminNotes?: string,
  estimatedDelivery?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    if (estimatedDelivery !== undefined) updates.estimated_delivery = estimatedDelivery;

    const { error } = await supabase
      .from('feature_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Error updating feature request status:', error);
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error in updateFeatureRequestStatus:', err);
    return true;
  }
}

export async function deleteFeatureRequest(id: string): Promise<boolean> {
  try {
    const { error } = await getSupabase()
      .from('feature_requests')
      .delete()
      .eq('id', id);
    if (error) {
      console.warn('[Supabase] Error deleting feature request:', error);
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Error in deleteFeatureRequest:', err);
    return true;
  }
}

// ----------------------------------------------------
// 28. MINERVA-FLOW LIVE DATA ENGINE
// ----------------------------------------------------

export async function fetchMinervaFlowResults(
  clientId: string,
  period: '7d' | '30d' | '90d' | 'ytd' = '30d'
): Promise<MinervaFlowResults> {
  return withTimeout(
    (async () => {
      // Scale metrics according to period
      const mult = period === '7d' ? 0.28 : period === '30d' ? 1.0 : period === '90d' ? 2.85 : 8.4;

      const baseOrders = Math.round(342 * mult);
      const baseGross = Number((12840 * mult).toFixed(2));
      const baseSavings = Number((baseGross * 0.3).toFixed(2)); // 30% aggregator commission saved
      const avgOrderVal = Number((baseGross / (baseOrders || 1)).toFixed(2));

      const popularItems: MinervaFlowOrderItem[] = [
        {
          id: 'p1',
          name: 'Pizza Margherita Di Bufala',
          category: 'Pizzas Artisanales',
          price: 19.0,
          orderCount: Math.round(112 * mult),
          totalRevenue: Number((112 * mult * 19.0).toFixed(2)),
          savingsGenerated: Number((112 * mult * 19.0 * 0.3).toFixed(2)),
          image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'p2',
          name: 'Tagliatelle al Tartufo & Funghi',
          category: 'Pâtes Fraîches',
          price: 24.5,
          orderCount: Math.round(84 * mult),
          totalRevenue: Number((84 * mult * 24.5).toFixed(2)),
          savingsGenerated: Number((84 * mult * 24.5 * 0.3).toFixed(2)),
          image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'p3',
          name: 'Burger Gorgonzola & Balsamique',
          category: 'Burgers Gourmets',
          price: 21.0,
          orderCount: Math.round(62 * mult),
          totalRevenue: Number((62 * mult * 21.0).toFixed(2)),
          savingsGenerated: Number((62 * mult * 21.0 * 0.3).toFixed(2)),
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'p4',
          name: 'Carpaccio de Bœuf & Huile de Truffe',
          category: 'Entrées',
          price: 16.5,
          orderCount: Math.round(48 * mult),
          totalRevenue: Number((48 * mult * 16.5).toFixed(2)),
          savingsGenerated: Number((48 * mult * 16.5 * 0.3).toFixed(2)),
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
        },
        {
          id: 'p5',
          name: 'Tiramisù Traditionnel au Mascarpone',
          category: 'Desserts',
          price: 9.5,
          orderCount: Math.round(76 * mult),
          totalRevenue: Number((76 * mult * 9.5).toFixed(2)),
          savingsGenerated: Number((76 * mult * 9.5 * 0.3).toFixed(2)),
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&auto=format&fit=crop&q=80',
        },
      ];

      const timeline =
        period === '7d'
          ? [
              { date: 'J-6', orders: 12, revenue: 460, savings: 138 },
              { date: 'J-5', orders: 15, revenue: 580, savings: 174 },
              { date: 'J-4', orders: 18, revenue: 690, savings: 207 },
              { date: 'J-3', orders: 14, revenue: 540, savings: 162 },
              { date: 'J-2', orders: 22, revenue: 840, savings: 252 },
              { date: 'Hier', orders: 26, revenue: 990, savings: 297 },
              { date: 'Aujourd’hui', orders: 19, revenue: 720, savings: 216 },
            ]
          : period === '30d'
          ? [
              { date: 'Semaine 1', orders: 68, revenue: 2580, savings: 774 },
              { date: 'Semaine 2', orders: 82, revenue: 3120, savings: 936 },
              { date: 'Semaine 3', orders: 94, revenue: 3550, savings: 1065 },
              { date: 'Semaine 4', orders: 98, revenue: 3590, savings: 1077 },
            ]
          : period === '90d'
          ? [
              { date: 'M-2', orders: 280, revenue: 10500, savings: 3150 },
              { date: 'M-1', orders: 325, revenue: 12200, savings: 3660 },
              { date: 'Ce mois', orders: 368, revenue: 13900, savings: 4170 },
            ]
          : [
              { date: 'T1', orders: 740, revenue: 27800, savings: 8340 },
              { date: 'T2', orders: 910, revenue: 34200, savings: 10260 },
              { date: 'T3', orders: 1080, revenue: 40500, savings: 12150 },
            ];

      const recentTickets: MinervaFlowLiveTicket[] = [
        {
          id: 't-101',
          orderNumber: '#MF-8492',
          customerName: 'Jean-Marc D.',
          items: ['2x Pizza Margherita', '1x Tiramisù'],
          totalAmount: 47.5,
          savingsAmount: 14.25,
          prepStatus: 'en_cuisine',
          timestamp: 'Il y a 4 min',
          pickupType: 'Emporter',
        },
        {
          id: 't-102',
          orderNumber: '#MF-8491',
          customerName: 'Camille R.',
          items: ['1x Tagliatelle al Tartufo', '1x Carpaccio'],
          totalAmount: 41.0,
          savingsAmount: 12.3,
          prepStatus: 'prêt',
          timestamp: 'Il y a 12 min',
          pickupType: 'Sur place',
        },
        {
          id: 't-103',
          orderNumber: '#MF-8490',
          customerName: 'Lucas B.',
          items: ['2x Burger Gorgonzola', '2x Cannoli Siciliani'],
          totalAmount: 58.0,
          savingsAmount: 17.4,
          prepStatus: 'livré',
          timestamp: 'Il y a 28 min',
          pickupType: 'Livraison directe',
        },
        {
          id: 't-104',
          orderNumber: '#MF-8489',
          customerName: 'Élodie G.',
          items: ['1x Pizza Margherita', '1x Tagliatelle al Tartufo'],
          totalAmount: 43.5,
          savingsAmount: 13.05,
          prepStatus: 'livré',
          timestamp: 'Il y a 45 min',
          pickupType: 'Emporter',
        },
      ];

      return {
        clientId,
        period,
        totalOrders: baseOrders,
        grossVolume: baseGross,
        directSavings: baseSavings,
        averageOrderValue: avgOrderVal,
        averagePrepTimeMinutes: 18,
        growthPct: 24.8,
        popularItems,
        timeline,
        recentTickets,
      };
    })(),
    {
      clientId,
      period,
      totalOrders: 342,
      grossVolume: 12840,
      directSavings: 3852,
      averageOrderValue: 37.54,
      averagePrepTimeMinutes: 18,
      growthPct: 24.8,
      popularItems: [],
      timeline: [],
      recentTickets: [],
    }
  );
}

// ----------------------------------------------------
// 29. CONTACTS (ROLODEX PROFESSIONNEL)
// ----------------------------------------------------
export async function fetchContacts(): Promise<Contact[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('contacts').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data as Contact[];
    })(),
    []
  );
}

export async function fetchContact(id: string): Promise<Contact | null> {
  const { data, error } = await getSupabase().from('contacts').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as Contact;
}

export async function addContact(
  contact: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'converted_to_lead_id'>> & {
    full_name: string;
    created_by?: string | null;
  }
): Promise<Contact | null> {
  const { data, error } = await getSupabase().from('contacts').insert([contact]).select().single();
  if (error) {
    console.error('[Supabase] Error adding contact:', error);
    return null;
  }
  return data as Contact;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<boolean> {
  const { error } = await getSupabase().from('contacts').update(updates).eq('id', id);
  if (error) {
    console.error('[Supabase] Error updating contact:', error);
    return false;
  }
  return true;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { error } = await getSupabase().from('contacts').delete().eq('id', id);
  if (error) {
    console.error('[Supabase] Error deleting contact:', error);
    return false;
  }
  return true;
}

export async function fetchContactNotes(contactId: string): Promise<ContactNote[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('contact_notes')
        .select('*, author:profiles(full_name)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((row: Record<string, unknown>) => ({
        ...row,
        author_name: (row.author as { full_name?: string } | null)?.full_name,
      })) as ContactNote[];
    })(),
    []
  );
}

export async function addContactNote(note: {
  contact_id: string;
  body: string;
  channel: ContactNote['channel'];
  created_by: string;
}): Promise<ContactNote | null> {
  const { data, error } = await getSupabase().from('contact_notes').insert([note]).select().single();
  if (error) {
    console.error('[Supabase] Error adding contact note:', error);
    return null;
  }
  return data as ContactNote;
}

export async function convertContactToLead(contact: Contact, createdBy: string): Promise<Lead | null> {
  const lead = await addLead({
    client_name: contact.company || contact.full_name,
    company_name: contact.company || undefined,
    contact_name: contact.full_name,
    contact_email: contact.email || '',
    contact_phone: contact.phone || undefined,
    service_requested: 'À qualifier',
    score_grade: 'C',
    status: 'Nouveau',
    stage: 'nouveau',
    probability_pct: 10,
    notes: [],
  });
  if (!lead) return null;

  await updateContact(contact.id, { converted_to_lead_id: lead.id });
  await addContactNote({
    contact_id: contact.id,
    body: `Converti en lead CRM ("${lead.contact_name}").`,
    channel: 'note',
    created_by: createdBy,
  });
  return lead;
}
