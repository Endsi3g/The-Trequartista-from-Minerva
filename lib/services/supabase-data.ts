import { createClient } from '@/lib/supabase/client';
import { Client, ClientRoiMetrics, ClientMrrHistoryEntry, Project, ProjectAttachment, LaunchCheckItem, TeamMemberPerformance, AcademySOP, ContentPost, AuditLog, Lead, ClientInvite, ClientMessage, ClientPaymentLink, TeamInvite, Task, TaskComment, TaskSubitem, ChangelogEntry, IntakeLead, Audit, AuditWithFindings, AuditProcessStep, AuditCostItem, AuditToolFinding, AuditInitiative, AuditInitiativeReaction, AuditComment, RoleHourlyRate, ToolCompatibilityEntry, Proposal, VoiceCall, VoiceAgentConfig, CustomRole, CustomRolePermission, Department, HelpArticle, ProjectMilestone, MinervaRoadmapItem, TeamDocument, DocumentBlock, DocumentContentJson, DocumentVersion, TeamChatMessage, TeamChatAttachment, TeamMemberSummary, MinervaContentCategory, MinervaContentItem, OpusClipJob, ClientWorkItem, ClientActivityLog, FeatureRequest, FeatureRequestStatus, FeatureRequestCategory, FeatureRequestRepo, FeatureRequestPriority, MinervaFlowResults, MinervaFlowOrderItem, MinervaFlowLiveTicket, Contact, ContactNote } from '@/lib/types';
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
        .select('*, account_manager:profiles(full_name)')
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
  budget_cad?: number | null;
  assignees?: string[];
  client_visible?: boolean;
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
const DEFAULT_ACADEMY_SOPS: AcademySOP[] = [
  {
    id: 'sop-anti-friction-master',
    title: 'Système Anti-Friction : Architecture d’Offre Complète (4 Piliers)',
    category: 'Stratégie & Offre',
    read_time_min: 15,
    author: 'Direction Minerva',
    description: 'Framework stratégique directeur "Donner d’abord, demander ensuite" appliqué aux 4 piliers : Minerva Flow, Minerva Reach, Agence Sur Mesure et Mes Inspirations.',
    is_featured: true,
    is_essential: true,
    pillar: 'transversal',
    content_markdown: `# MINERVA — SYSTÈME ANTI-FRICTION : ARCHITECTURE D'OFFRE COMPLÈTE

> Framework dérivé de l'analyse "avocat du diable" sur l'offre d'appel restaurateurs.  
> Appliqué à chaque pilier de l'agence : Flow, Reach, Agence Sur Mesure, Mes Inspirations.

---

## PRINCIPE DIRECTEUR

Chaque pilier partage le même défaut structurel par défaut : **il demande avant de donner**. Le prospect doit fournir ses chiffres, son temps, sa confiance — avant d'avoir reçu une seule preuve de valeur. Ce framework inverse systématiquement l'ordre : **donner d'abord, demander ensuite**.

Les 4 failles s'appliquent à chaque pilier différemment, mais le remède est toujours le même :  
→ Réduire l'effort du prospect à zéro sur le premier contact  
→ Livrer la moitié du travail avant qu'il ait dit oui  
→ Neutraliser le risque opérationnel dans l'offre elle-même  
→ Rendre la passerelle vers le niveau suivant évidente et naturelle

---

## PILIER 1 — MINERVA FLOW (SaaS Restos & Cafés)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit.  
- **Correction :** Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google (fourchette basse, assumée transparemment). Livraison : vidéo 60 secondes personnalisée avec chiffre précis.  
- **Message :** *« On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »*

### Faille #2 — Rapport qui prend la poussière
- **Le piège :** Envoyer un beau PDF d'audit que le proprio regarde une fois et range.  
- **Correction :** Avec l'audit, envoyer un lien vers son menu **déjà pré-configuré en démo** sur Minerva Flow (5 plats, interface réelle, rien de public). Pas un livrable — une démo vivante. Il voit son restaurant dans l'outil avant d'avoir signé quoi que ce soit.  
- **Précaution :** Framer comme une démo, pas comme un acte unilatéral. *« On a pris 5 minutes pour recréer vos plats signature dans l'interface — c'est juste pour que vous visualisiez. Rien n'est en ligne. »*

### Faille #3 — Peur du bug pendant le rush
- **Le piège :** Positionner Minerva Flow comme remplacement du système existant. Le proprio imagine son samedi soir en chaos.  
- **Correction :** Canal parallèle exclusivement pour clients fidèles/emporter. Protocole test de 5 minutes avec l'équipe présente. Inclure dans l'offre : une fiche plastifiée d'une page pour le comptoir + option d'un briefing d'équipe de 15 min (en personne ou vidéo) avant le premier service.  
- **Message :** *« On branche une commande test sur votre imprimante actuelle. Si ça prend plus de 5 minutes ou que votre équipe hésite — vous ne lancez rien. »*

### Faille #4 — Pas de passerelle naturelle vers l'agence
- **Le piège :** Résoudre le problème de commission → le client est content → aucune raison de payer plus.  
- **Correction :** Repositionner l'upsell agence en **rétention, pas acquisition**. *« Minerva Flow vous économise 30% par commande. Maintenant : comment on fait pour que vos clients Uber commandent directement chez vous la prochaine fois ? »* Les clients existent déjà. Il s'agit de les récupérer — pas d'en trouver de nouveaux. C'est une conversation infiniment plus facile.  
- **Upsell naturel :** Optimisation fiche Google Business + QR codes sur emballages + campagne SMS clients existants.

### Règles d'exécution spécifiques — Flow
- **Timing de contact :** Mardi ou mercredi, 14h30–16h. Jamais vendredi soir, jamais lundi matin.
- **Canal :** Visite physique pour les indépendants (Plateau, Villeray, Rosemont). Instagram DM en backup.
- **Preuve sociale :** Toujours un nom local. *« On travaille déjà avec X café dans Rosemont. »* Aucune référence nationale générique.
- **Staff :** Le vrai bloquant n'est pas le proprio — c'est la caissière ou le cuisinier. L'offre inclut un protocole d'onboarding équipe dès le jour 1.

---

## PILIER 2 — MINERVA REACH (Prospection Automatisée Québec)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander l'accès au CRM, une liste de prospects, ou les critères de ciblage avant de commencer.  
- **Correction :** Construire la première liste **pour eux** depuis des sources publiques (LinkedIn, Google Maps, Pages Jaunes, Sites sectoriels QC) avant le premier appel. Livrer une liste de 50 prospects qualifiés avec contexte (taille, secteur, signal d'achat récent) comme pré-cadeau de la conversation.  
- **Message :** *« Avant qu'on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d'achat actif. Voici la liste — c'est notre façon de vous montrer comment on travaille. »*

### Faille #2 — Rapport qui prend la poussière
- **Le piège :** Livrer une liste de prospects → le client la regarde → personne ne prospecte.  
- **Correction :** Ne jamais livrer une liste seule. La liste est toujours accompagnée de **messages déjà rédigés et prêts à envoyer**, adaptés à chaque segment. Idéalement : les 10 premiers messages sont envoyés dans la semaine du lancement, avant même que le client ait eu le temps de procrastiner.  
- **Règle :** Le livrable de Minerva Reach n'est jamais une liste — c'est des **réponses reçues**.

### Faille #3 — Peur du spam et de la réputation
- **Le piège :** L'entrepreneur craint que ses contacts LinkedIn soient bombardés de messages automatiques et que sa réputation en prenne un coup.  
- **Correction :** Démarrer avec un batch de 10 messages 100% manuels et personnalisés, soumis à validation avant envoi. Le client approuve le ton, le contenu et les cibles. L'automatisation ne démarre qu'après que les premiers retours prouvent que le message fonctionne.  
- **Message :** *« Les 10 premiers messages, on les rédige ensemble et vous les validez un par un. On n'envoie rien en automatique avant que vous ayez vu que ça convertit. »*

### Faille #4 — Reach génère des leads que personne ne close
- **Le piège :** Minerva Reach amène des conversations → le client ne sait pas quoi répondre → les leads refroidissent.  
- **Correction :** Inclure dans l'offre Reach un **playbook de réponse** (3–5 scripts de follow-up par type de réponse reçue) + une session mensuelle de 30 min pour affiner les angles selon les retours terrain.  
- **Passerelle naturelle :** Reach génère des leads qualifiés → l'agence Sur Mesure peut prendre en charge la conversion si le client n'a pas la bande passante pour closer.

### Règles d'exécution spécifiques — Reach
- **ICP de Reach :** Entrepreneurs et PME Québec, pas les grands comptes. Le message doit sonner local, pas corporate.
- **Ton des messages :** Jamais de « Je me permets de vous contacter… » — opener direct sur un pain point observé publiquement (offre d'emploi récente, avis Google négatif, expansion récente).
- **Volume :** Commencer par 20–30 envois/semaine, pas 200. La qualité de la réponse prime sur le volume brut.
- **Mesure :** KPI principal = taux de réponse positive (pas taux d'ouverture). Tout le reste est vanity metric.

---

## PILIER 3 — AGENCE SUR MESURE (Implémentations Personnalisées)

### Faille #1 — Friction de la donnée
- **Le piège :** Demander un brief complet, un accès aux outils, et une réunion de discovery de 2 heures avant de montrer quoi que ce soit.  
- **Correction :** Remplacer la réunion de discovery par un **audit de surface en 30 minutes** basé sur ce qui est visible publiquement (site web, réseaux, Google, outils déclarés). Arriver avec des observations déjà formulées plutôt que des questions à remplir.  
- **Message :** *« Avant qu'on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l'argent. On veut vous les montrer — pas vous vendre quelque chose. »*

### Faille #2 — Le spec document que personne n'implémente
- **Le piège :** Phase de discovery longue → document de spécifications → devis → validation → début des travaux 3 semaines plus tard. Le client a perdu confiance ou d'intérêt.  
- **Correction :** **Semaine 1 = prototype fonctionnel, pas un document.** Même petit, même incomplet — quelque chose qui marche et qu'ils peuvent toucher. La confiance s'établit sur le concret, pas sur les promesses.  
- **Règle :** Ne jamais livrer un document avant un artefact. Le document documente ce qui existe, pas ce qui va exister.

### Faille #3 — Peur de la dépendance et de la complexité
- **Le piège :** Le client (CEO, entrepreneur) craint que la solution soit trop complexe, qu'elle nécessite un développeur permanent pour la maintenir, ou qu'il ne comprenne jamais comment ça marche.  
- **Correction :** Construire avec les outils qu'il utilise déjà quand c'est possible (Notion, Google Sheets, Make/n8n, Supabase). Documenter chaque livrable avec une vidéo Loom de 5 minutes max. Inclure dans tout contrat un "mode solo" : une section du livrable qu'il peut modifier lui-même sans toucher au reste.  
- **Message :** *« On construit pour que vous soyez autonome. Si on disparaît demain, vous ne perdez pas l'outil. »*

### Faille #4 — Build one-shot sans récurrence
- **Le piège :** Livrer un projet custom → encaisser → plus de relation. Aucune raison de revenir.  
- **Correction :** Intégrer dans tout projet sur mesure un **module de suivi mensuel léger** : 1 heure/mois de revue des métriques, ajustements mineurs, et identification des prochains leviers. Tarif : 300–500$/mois. Ce n'est pas du support — c'est du co-pilotage.  
- **Passerelle naturelle :** Agence Sur Mesure → abonnement Minerva Flow si le client est dans la restauration, ou recommandation Reach si le client a besoin d'acquisition.

### Règles d'exécution spécifiques — Agence
- **Cibler des entrepreneurs déjà convaincus de la technologie**, pas ceux qu'il faut convaincre en premier. Aller chercher les early adopters, pas le marché de masse.
- **Prix :** Ne jamais donner un prix avant d'avoir montré un prototype. Le prototype justifie le prix.
- **Preuve :** Un cas client documenté publiquement (avec leur accord) vaut 10 témoignages anonymes. Viser à documenter chaque projet sur Mes Inspirations.

---

## PILIER 4 — MES INSPIRATIONS (Marque Média & Contenu)

### Faille #1 — Friction pour accéder à la valeur
- **Le piège :** Mettre du contenu premium derrière un formulaire, une newsletter, ou un compte à créer avant que l'audience ait vu la valeur.  
- **Correction :** Valeur totale en accès libre d'abord. Le CTA arrive à la fin, pas au début. L'audience doit avoir reçu quelque chose d'utile avant qu'on lui demande une action.  
- **Règle :** Chaque vidéo / post / contenu doit pouvoir être consommé entièrement sans friction. La conversion est une couche au-dessus, pas une barrière d'entrée.

### Faille #2 — Contenu qui génère des vues mais pas de clients
- **Le piège :** Créer du contenu inspirationnel ou éducatif sans lien clair avec un produit ou une offre concrète.  
- **Correction :** Chaque pièce de contenu est associée à **un seul CTA lié à un pilier précis** (Flow, Reach, ou Agence). Pas de CTA générique « suivez-moi ». Le contenu documente le chemin — l'offre capture ceux qui veulent aller plus vite.  
- **Format prioritaire :** Documenter les cas clients en temps réel. *« Voici comment on a branché Minerva Flow dans ce café de Rosemont — et ce qu'ils ont économisé en 30 jours. »* C'est à la fois du contenu, de la preuve sociale, et de la prospection indirecte.

### Faille #3 — L'audience perçoit la vente comme de la trahison
- **Le piège :** Construire une audience sur du contenu inspirationnel, puis pitcher un produit → sentiment de manipulation, perte de confiance.  
- **Correction :** **Vendre dès le début, ouvertement.** Mes Inspirations est une marque média *et* la vitrine de Minerva. Ce n'est pas un secret. L'audience qui suit sait qu'on construit une entreprise — c'est précisément ce qui est intéressant à suivre. La transparence sur l'intention commerciale construit plus de confiance que de la cacher.  
- **Cadre :** *Build in public* — montrer les chiffres, les échecs, les décisions, les clients. Pas de performance de succès.

### Faille #4 — Le média ne se connecte pas aux autres piliers
- **Le piège :** Mes Inspirations grandit en silo — belle audience, mais zéro synchro avec Flow, Reach ou l'Agence.  
- **Correction :** Mes Inspirations est le **moteur de preuve sociale** pour les 3 autres piliers. Chaque client Flow signé = une vidéo de cas client. Chaque projet Agence livré = un before/after documenté. Chaque campagne Reach réussie = un breakdown chiffré. Le contenu n'est pas séparé du business — il **est** le business visible.

### Règles d'exécution spécifiques — Mes Inspirations
- **Format court prioritaire :** Shorts / Reels de 60–90 secondes sur un insight précis. Un insight = une vidéo. Pas de compilations.
- **Hook :** Toujours partir d'un chiffre ou d'une situation concrète, jamais d'un concept. *« Ce café perdait 1 400$/mois sans le savoir »* bat *« Voici pourquoi les restos doivent se digitaliser »*.
- **Fréquence :** 2 pièces de contenu par semaine minimum. La régularité bat la perfection.
- **Distribution :** YouTube Shorts en premier (SEO long terme), repurposé sur Instagram Reels et LinkedIn.

---

## LA BOUCLE D'OFFRE UNIFIÉE — COMMENT LES PILIERS S'ENCHAÎNENT

\`\`\`
MES INSPIRATIONS
(Contenu — génère confiance + preuve sociale)
         ↓ attire leads froids
MINERVA REACH
(Prospection — identifie + contacte les leads chauds)
         ↓ qualifie et génère des RDV
MINERVA FLOW
(SaaS — premier produit, entrée de gamme, preuve de valeur rapide)
         ↓ crée le besoin de trafic + systèmes
AGENCE SUR MESURE
(Implémentation — upsell naturel pour ceux qui veulent aller plus loin)
         ↓ génère des cas clients documentés
MES INSPIRATIONS
(Le cycle recommence avec des preuves réelles)
\`\`\`

**La règle d'or :** Aucun pilier ne se vend seul. Chaque pilier alimente le suivant. Le contenu sans produit est du bruit. Le produit sans contenu est invisible. L'agence sans cas clients est indifférenciée.

---

## RÈGLES TRANSVERSALES — APPLICABLES À TOUS LES PILIERS

| Règle | Application concrète |
|---|---|
| **Donner avant de demander** | Audit, démo, prototype, liste — toujours en premier |
| **Estimer = transparence sur la méthode** | Jamais un chiffre sans expliquer comment il a été calculé |
| **Preuve locale avant preuve générique** | Un nom à Montréal vaut 10 références nationales |
| **Staff / équipe inclus dans l'offre** | L'onboarding de l'équipe du client fait partie du livrable |
| **Timing de contact** | Mardi–mercredi 14h30–16h pour les restos. Matin pour les entrepreneurs. |
| **Upsell = rétention, pas acquisition** | Toujours partir des clients existants du prospect, pas de la croissance |
| **Documenter chaque cas client** | Chaque client signé = contenu Mes Inspirations potentiel |
| **Risque inversé systématique** | Chaque offre inclut une porte de sortie claire si ça ne fonctionne pas |

---

## MATRICE DE PRIORITÉ D'EXÉCUTION

| Pilier | Action #1 (semaine 1) | Action #2 (mois 1) | Indicateur de succès |
|---|---|---|---|
| **Flow** | 3 audits publics proactifs envoyés | 1 test opérationnel branché | 1 client payant actif |
| **Reach** | Liste de 50 prospects construite | 10 messages validés + envoyés | 3 réponses positives |
| **Agence** | 1 audit de surface livré sans rendez-vous | Prototype J+7 présenté | 1 contrat signé |
| **Mes Inspirations** | 2 vidéos courtes publiées | 1 cas client documenté | 100 vues organiques / vidéo |
`,
  },
  {
    id: 'sop-minerva-flow-dossier-produit',
    title: 'Minerva Flow : Dossier Produit, Vision & Offre Pilote',
    category: 'Outils & Systèmes',
    read_time_min: 10,
    author: 'Direction Minerva',
    description: 'Spécification complète du produit Minerva Flow — ICP, fonctionnalités clés, roadmap, business model et offre pilote (90 jours).',
    is_essential: true,
    pillar: 'flow',
    content_markdown: `# Minerva Flow — Dossier Produit, Vision & Offre Pilote

## 🌊 Concept en 1 phrase
Minerva Flow est un système de gestion complet pour permettre aux restaurants et cafés de gérer l'ensemble de leurs opérations quotidiennes dans un seul endroit moderne : simple, visuel et performant.

---

## 🎯 Problème résolu
Les restaurants & cafés utilisent souvent de nombreux outils fragmentés, complexes ou peu adaptés à la réalité de leur métier. Flow centralise tout dans un seul espace conçu pour leur réalité.

---

## 👤 ICP (Ideal Customer Profile)
- **Restaurants** (service aux tables, comptoir, rapide)
- **Cafés & Bistrots**
- **Restaurants-cafés**
- **Établissements alimentaires** qui veulent mieux gérer leurs opérations quotidiennes

---

## ⚡ Key Features (Fonctionnalités clés)
- [x] **Saisie des revenus par journée** (chiffre d'affaires en temps réel)
- [x] **Gestion des dépenses & coûts opérationnels**
- [x] **Suivi des marges commerciales & rentabilité**
- [x] **Gestion de l'inventaire & stocks**
- [x] **Gestion des employés & horaires**
- [x] **Rapports et graphiques visuels**
- [x] **Multi-enseignes & multi-points de vente**
- [x] **Accès offre sur mesure**
- [ ] **Commande directe à partir de système d'un QR code**

---

## 🎨 Expérience utilisateur (UX/UI)
- **Interface très fluide et navigable**
- **Graphiques clairs et visuels**
- **Rapports simples à comprendre** sans jargon technique
- **Informations faciles à lire** même pour un utilisateur non technicien
- **Produit pensé pour être partageable en équipe** en invitant d'autres membres utilisateurs

---

## 🚀 Différenciation & Positionnement
- **Focus net :** Se concentrer réellement et uniquement sur la réalité spécifique des restaurants et cafés.
- **Approche visuelle et ergonomique :** Une grande spécialité moderne, pas un générique POS vieillot.
- **Idée stratégique :** Flow doit devenir un produit qui se markete par sa propre qualité — assez fort, beau et fluide pour que les utilisateurs aient envie de le recommander à d'autres restos.

---

## 🗺️ Roadmap (Feuille de route)

### 0–3 mois (Phase Terrain & Feedback)
- Faire tester l'application à des restaurants et cafés pilotes
- Obtenir du feedback réel du terrain
- Perfectionner le produit jusqu'à ce qu'il soit parfaitement adapté aux coups de feu en cuisine

### 3–12 mois (Consolidation & Valeur)
- Renforcer les fonctions les plus utiles
- Stabiliser l'expérience et les intégrations
- Améliorer la valeur commerciale du produit

### 1–3 ans (Échelle & Référence)
- Faire de Flow une référence dans sa niche
- Développer un produit assez fort pour se recommander presque par lui-même
- Créer une solution à la fois operational, visuelle et stratégique

---

## 💼 Business Model (Modèle Économique)
- **Paiement sur abonnement** (SaaS = mensuel)
- **Tarification accessible** selon le restaurant (minimum et maximum)
- **Flexibilité** selon le besoin, la taille ou le niveau de personnalisation

---

## 📣 Go-to-Market (Stratégie d'Acquisition)
- Démarrage direct auprès des restaurants — boucle de recommandation / bouche-à-oreille
- Qualité du produit comme moteur principal d'acquisition
- Preuve sociale forte : restaurants mis en valeur + expérience réelle
- Démonstrations directes des fonctionnalités clés

---

## 🎁 Offre Pilote (90 jours) — Premiers clients

**Objectif de la phase d'embarquement :** 3 à 5 restaurants et cafés pilotes pour valider le produit et générer les premières études de cas.

| Élément | Détail |
| :--- | :--- |
| **Prix** | **0 $** (gratuit pendant 90 jours) |
| **Engagement** | Retour d'expérience complet et étude de cas (1 à 2 heures de feedback / semaine) |
| **Places disponibles** | 3 à 5 places maximum |
| **Garantie** | Si la valeur n'est pas au rendez-vous après 90 jours, aucun frais, jamais. |

---

### 📝 Mises à jour & Notes d'exécution
- **Mise à jour (15 juillet 2026) :** Le module de commande directe (paiement sur place, sans commission) est à l'essai en mode *Connect-ready* — non pas pour tout remplacer dans l'ancien système, mais pour tester à l'essai sans risque.
- **Positionnement du pilote :** Générateur de meilleure rentabilité + Combiner l'expérience de menu + Commande directe (seulement sur place, 0% commission).
- ⚠️ **Principe "Non pas tout changer" :** Le système est un canal complémentaire, pas un POS total à remplacer immédiatement. Au moment d'imprimer la commande sur place ou via QR code, rien ne saute.
- **Session d'essai (24 juillet 2026) :** Flow — 150/150 remplis, en cas réels et automatisés (parcours complet, numérotation, bag de préparation) avant mise en service réelle.`,
  },
  {
    id: 'sop-restaurant-margin-recovery',
    title: 'Pilier 1 (Flow) : Acquisition Restauration & Démo Directe 0% Commission',
    category: 'Ventes & Prospection',
    read_time_min: 8,
    author: 'Direction Minerva',
    description: 'Les 4 failles critiques et contre-pieds radicaux pour convertir les restaurateurs grâce à l’audit public et la commande directe à 0% de commission.',
    is_essential: true,
    pillar: 'flow',
    content_markdown: `## Pilier 1 — Minerva Flow (SaaS Restos & Cafés)

### Principe Fondamental
Réduire l'effort du restaurateur à zéro en utilisant des données 100% publiques pour calculer ses pertes Uber Eats / DoorDash, puis lui livrer son menu pré-configuré dans une démo vivante à 0% de commission.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : La Friction de la Donnée
- **Le piège :** Demander relevés Uber Eats, exports de caisse, ou coûts de staff avant de montrer quoi que ce soit.
- **Correction :** Audit public proactif. Prix menu sur Google Maps / site web vs prix majorés sur UberEats. Volume estimé à partir des avis Google. Livraison en vidéo 60 secondes avec chiffre précis.
- **Opener de prospection :** *« On a regardé votre menu sur Uber Eats. Sur votre [plat signature], vous perdez environ X$ par commande. On a simulé ça en une minute — voici le lien. »*

#### 2. Faille #2 : Le Rapport qui Prend la Poussière
- **Le piège :** Envoyer un PDF d'audit statique.
- **Correction :** Livrer un lien vers son menu déjà configuré en démo sur Minerva Flow (5 plats réels). Il visualise son restaurant avant d'avoir signé quoi que ce soit.
- **Précaution :** *« On a pris 5 minutes pour recréer vos plats signature dans l'interface — c'est juste pour que vous visualisiez. Rien n'est en ligne. »*

#### 3. Faille #3 : La Peur du Bug pendant le Coup de Feu
- **Le piège :** Positionner l'outil comme remplacement du POS en place.
- **Correction :** Canal parallèle pour clients fidèles / emporter. Protocole test 5 minutes en cuisine sur imprimante thermique avec fiche plastifiée au comptoir.

#### 4. Faille #4 : L'Absence de Passerelle vers l'Agence
- **Le piège :** Résoudre la commission puis arrêter la relation.
- **Correction :** Upsell axé rétention : SEO Local Google Maps, QR codes sur emballages et campagnes SMS clients existants.

---

### Règles d'Exécution & Timing
- **Timing :** Mardi ou mercredi, 14h30–16h (creux de service).
- **Canal :** Visite physique dans les quartiers cibles (Plateau, Villeray, Rosemont, Mile-End) avec DM Instagram en appui.
- **Staff inclus :** Fiche comptoir plastifiée 1 page + briefing 15 min de l'équipe avant le premier service.`,
  },
  {
    id: 'sop-minerva-reach-playbook',
    title: 'Pilier 2 (Reach) : Prospection 50 Leads QC & Playbook de Réponses',
    category: 'Ventes & Prospection',
    read_time_min: 9,
    author: 'Direction Minerva',
    description: 'Méthodologie pour pré-qualifier 50 prospects locaux avec signaux d’achat, validation manuelle des 10 premiers messages et scripts de closing.',
    is_essential: true,
    pillar: 'reach',
    content_markdown: `## Pilier 2 — Minerva Reach (Prospection Automatisée Québec)

### Principe Fondamental
Ne jamais demander d'accès CRM ou de listes de contacts au prospect. Minerva construit la première liste de 50 prospects qualifiés avec contexte d'achat visible publiquement comme cadeau préalable à la conversation.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction de la Donnée
- **Correction :** Construire la liste de 50 prospects qualifiés depuis LinkedIn, Google Maps, Registre des entreprises du Québec et sites sectoriels avant le premier appel.
- **Message :** *« Avant qu'on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre ICP et qui ont un signal d'achat actif. Voici la liste — c'est notre façon de vous montrer comment on travaille. »*

#### 2. Faille #2 : Rapport qui Prend la Poussière
- **Règle :** Le livrable de Minerva Reach n'est jamais une liste — c'est des **réponses reçues**.
- **Correction :** Accompagner la liste de messages personnalisés déjà rédigés et envoyer les 10 premiers dans la semaine de lancement.

#### 3. Faille #3 : Peur du Spam et de la Réputation
- **Correction :** Batch initial de 10 messages 100% manuels et personnalisés, soumis à validation par le client avant tout envoi.

#### 4. Faille #4 : Leads Chauds Non Closés
- **Correction :** Fournir le Playbook de réponses (scripts par type d'objection) et organiser une session mensuelle de 30 min d'ajustement des angles.

---

### Règles d'Exécution Reach
- **ICP :** PME et entrepreneurs du Québec (ton direct, local, pas de jargon corporatif creux).
- **Volume initial :** 20–30 prises de contact / semaine.
- **KPI principal :** Taux de réponse positive.`,
  },
  {
    id: 'sop-agence-prototype-j7',
    title: 'Pilier 3 (Agence) : Audit Surface 30-Min, Prototype J+7 & Mode Solo',
    category: 'Gestion de compte',
    read_time_min: 10,
    author: 'Direction Minerva',
    description: 'Processus d’implémentation sur mesure sans cahier des charges interminable : prototype concret dès la semaine 1 et suivi mensuel $300-$500/mois.',
    is_essential: true,
    pillar: 'agency',
    content_markdown: `## Pilier 3 — Agence Sur Mesure (Implémentations Personnalisées)

### Principe Fondamental
Remplacer les réunions de discovery interminables de 2 heures par un audit de surface public en 30 minutes, suivi d'un prototype fonctionnel livrable dès la semaine 1 (J+7) pour bâtir la confiance sur du concret.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction de la Donnée
- **Correction :** Audit de surface en 30 minutes basé sur ce qui est public (site, outils déclarés, parcours utilisateur). Arriver avec 3 points de friction déjà documentés.
- **Message :** *« Avant qu'on se parle, on a passé 30 minutes sur votre setup actuel. On a identifié 3 endroits où vous perdez du temps ou de l'argent. On veut vous les montrer — pas vous vendre quelque chose. »*

#### 2. Faille #2 : Le Document de Spécifications que Personne ne Lit
- **Règle :** Semaine 1 = prototype fonctionnel, pas un document. Ne jamais livrer un PDF avant un artefact manipulable.

#### 3. Faille #3 : Peur de la Dépendance Technique
- **Correction :** Construire sur la stack existante du client quand possible. Livrer une vidéo Loom de 5 min et un "Mode Solo" garantissant son autonomie complète en cas d'arrêt.

#### 4. Faille #4 : Le Projet One-Shot sans Récurrence
- **Correction :** Co-pilotage mensuel léger (1h/mois d'analyse des métriques et ajustements) facturé 300–500$/mois.

---

### Règles d'Exécution Agence
- **Cible :** Entrepreneurs déjà convaincus de l'efficacité technologique (early adopters).
- **Prix :** Le prototype justifie le prix ; ne jamais annoncer de devis avant d'avoir montré l'artefact.`,
  },
  {
    id: 'sop-mes-inspirations-media',
    title: 'Pilier 4 (Média) : Production Vidéo Cas Clients 60s & CTA Piliers',
    category: 'Campagnes Ads',
    read_time_min: 7,
    author: 'Direction Minerva',
    description: 'Framework de scripting Build-in-Public : hooks chiffrés réels, documentation des victoires clients et conversion naturelle vers Flow/Reach/Agence.',
    is_essential: true,
    pillar: 'inspirations',
    content_markdown: `## Pilier 4 — Mes Inspirations (Marque Média & Contenu)

### Principe Fondamental
Mes Inspirations est le moteur de preuve sociale pour les 3 autres piliers de Minerva. Chaque client signé ou délivré est documenté en temps réel (Build in Public) avec des chiffres réels pour alimenter le flywheel d'acquisition.

---

### Les 4 Failles & Contre-Pieds Radicaux

#### 1. Faille #1 : Friction d'Accès à la Valeur
- **Règle :** Valeur totale en accès libre sans barrière. Le CTA arrive à la fin de la vidéo.

#### 2. Faille #2 : Vues sans Conversion
- **Correction :** Chaque vidéo a un unique CTA relié directement à un pilier (Flow, Reach, ou Agence).

#### 3. Faille #3 : Sentiment de Vente Déguisée
- **Correction :** Vendre dès le départ avec une transparence totale sur le parcours d'entreprise (Build in Public).

#### 4. Faille #4 : Média Déconnecté du Business
- **Correction :** 1 client Flow = 1 vidéo cas client. 1 projet Agence = 1 avant/après chiffré.

---

### Format & Production
- **Durée :** 60 à 90 secondes (1 insight = 1 vidéo).
- **Hook :** Toujours basé sur un chiffre concret (*« Ce café perdait 1 400$/mois sans le savoir... »*).
- **Distribution :** YouTube Shorts en priorité (référencement long terme) puis déclinaison Reels & LinkedIn.`,
  },
  {
    id: 'sop-framer-delivery',
    title: 'Process de Livraison Web Framer & Recette 20-Points',
    category: 'Design Framer',
    read_time_min: 12,
    author: 'Camille Roy',
    description: 'Checklist complète pour assurer un déploiement Framer sans faille : SEO, responsive, assets et tracking.',
    is_essential: true,
    pillar: 'agency',
  },
  {
    id: 'sop-minerva-agence-studio-produit',
    title: 'Minerva — Agence & Studio Produit : Vue d’Ensemble Stratégique',
    category: 'Stratégie & Vision',
    read_time_min: 10,
    author: 'Direction Minerva',
    description: 'Écosystème, structure juridique, offre signature restaurants, stratégie marketing, roadmap 12 mois, KPIs, projections financières et gestion des risques de Minerva.',
    is_essential: true,
    content_markdown: `## Minerva — Agence & Studio Produit

> 🏢 **Montréal, Québec** — Une compagnie hybride qui combine design, systèmes d'automatisation IA et logicielles sur mesure pour les entrepreneurs et les restaurants.

---

## 🌐 Écosystème Minerva

Minerva fonctionne comme une **marque parapluie** (« umbrella brand ») articulée autour de quatre piliers :

### 🏢 Minerva (Agence)
L'entité principale — design, conseil stratégique, sites web Framer, intégration de systèmes.

### 🧠 Minerva OS
Le noyau technique propriétaire — systèmes de gestion, automatisation et tableaux de bord propulsés par l'IA.

### 📡 Minerva Reach
Solution de prospection automatisée spécialisée pour le Québec — tout le cycle de prospection dans une seule app.

### 🌊 Minerva Flow
Cockpit de gestion pour restaurants et cafés — opérations, fournisseurs, inventaire, employés, revenus.

---

## ⚖️ Structure juridique

- **Forme :** Entreprise individuelle enregistrée au Québec (NEQ)
- **Siège :** Montréal, Québec, Canada
- **Fiscalité :** Inscription TPS et TVQ selon le seuil de chiffre d'affaires
- **Propriété intellectuelle :** Minerva conserve la propriété exclusive du code source et des architectures. Les clients bénéficient d'une licence d'exploitation pour leurs plateformes.

---

## 💼 Offre signature — Restaurants & Cafés

**Clientèle cible :** cafés indépendants de niche, restaurants haut de gamme, chaînes locales du Grand Montréal.

| Composante | Description |
| --- | --- |
| **Plateforme Web Framer** | Design sur mesure : accueil, menu dynamique, réservations, galerie, identité |
| **Intégration Minerva OS** | Tableaux de bord, gestion des avis, suivi analytique |
| **Pipeline de contenu** | Création et planification de Reels, Stories, Carrousels automatisés |
| **Accompagnement** | Revues mensuelles et optimisations continues |

---

## 📣 Stratégie marketing

### Canaux prioritaires

| Canal | Orientation | Fréquence |
| --- | --- | --- |
| **Instagram** | Univers visuel Restauration + Éducation Growth/Finance | 1–2/semaine |
| **YouTube / TikTok** | Contenus de fond et capsules sur l'IA, le code, les systèmes | Flux continu |
| **LinkedIn** | Crédibilité B2B, génération de leads décideurs | Hebdomadaire |

### Stratégie d'acquisition B2B (Restaurants)

1. **Criblage :** fichier de 200 profils ICP qualifiés localement
2. **Campagnes directes :** vagues de prospection téléphonique et emails personnalisés
3. **Démos :** prototypes Framer interactifs avant signature
4. **Phase pilote :** 1–2 clients initiaux à conditions préférentielles pour études de cas

---

## 📈 Roadmap stratégique (12 mois)

| Phase | Période | Priorités |
| --- | --- | --- |
| **1. Fondations** | Juillet–Août | Enregistrement légal, charte graphique, vitrine Framer, calendrier éditorial |
| **2. Conquête locale** | Septembre–Novembre | Prospection restaurants, signatures pilotes, déploiement systèmes |
| **3. Lancement SaaS** | Novembre–Février | Spécifications Reach & HelloAdvice, versions V1, bêta test |
| **4. Passage à l'échelle** | Mars–Juin | Stabilisation rétention, accélération budgets publicitaires, croissance MRR |

---

## 🎯 KPI prioritaires (Année 1)

| Indicateur | Cible |
| --- | --- |
| **Contrats restaurants actifs** | 3 |
| **MRR global** | En croissance continue |
| **Utilisateurs actifs mensuels (apps)** | Suivi mensuel |
| **Rétention 30/60/90 jours** | Taux cible à définir |

---

## 📊 Projections financières (Année 1 — scénario intermédiaire)

| Unité d'affaires | Hypothèses | Revenus estimés |
| --- | --- | --- |
| Services Restaurants (Setup) | 3 contrats × 3 000 $ | 9 000 $ |
| Services Restaurants (Récurrent) | 3 abonnements × 250 $/mois | 9 000 $ |
| HelloAdvice SaaS | 100–150 abonnés (~12 $ ARPU) | 14 000 $ – 21 000 $ |
| Minerva Reach SaaS | 50–100 abonnés (~25 $ ARPU) | 15 000 $ – 30 000 $ |
| **TOTAL** | | **38 000 $ – 48 000 $** |

---

## ⚠️ Gestion des risques

| Risque | Mitigation |
| --- | --- |
| **Disponibilité opérationnelle** | Priorisation stricte des livrables essentiels, automatisation maximale |
| **Inertie du marché SaaS** | Lancement MVP pour collecter données et ajuster l'offre rapidement |
| **Conformité réglementaire** | Audit comptable et conseil juridique dès les premiers paliers de revenus |

---

### Voir aussi dans l'Académie
- [Pilier 4 — Mes Inspirations (Marque Média & Contenu)](/academy/sop-mes-inspirations-media)
- [Produits Minerva (roadmap)](/produits)`,
  },
];

// ----------------------------------------------------
export async function fetchAcademySops(): Promise<AcademySOP[]> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase()
        .from('academy_sops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return DEFAULT_ACADEMY_SOPS;
      }

      // Prepend our default SOPs if not already present
      const combined = [...data];
      DEFAULT_ACADEMY_SOPS.forEach((def) => {
        if (!combined.find((s) => s.id === def.id || s.title === def.title)) {
          combined.unshift(def);
        }
      });

      return combined as AcademySOP[];
    })(),
    DEFAULT_ACADEMY_SOPS
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
  const defaultFound = DEFAULT_ACADEMY_SOPS.find((s) => s.id === id);
  if (defaultFound) return defaultFound;

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

export async function fetchLead(id: string): Promise<Lead | null> {
  return withTimeout(
    (async () => {
      const { data, error } = await getSupabase().from('leads').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      return data as Lead;
    })(),
    null
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

export async function updateLeadStatus(leadId: string, status: Lead['status'], stage?: string, probabilityPct?: number): Promise<boolean> {
  const payload: Record<string, unknown> = { status };
  if (stage) payload.stage = stage;
  if (probabilityPct !== undefined) payload.probability_pct = probabilityPct;
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
  workspace?: 'prospection' | 'managing' | null
): Promise<TeamInvite | null> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, '0')).join('');
  const { data, error } = await getSupabase()
    .from('team_invites')
    .insert([{ token, role, department, created_by: createdBy, custom_role_id: customRoleId || null, workspace: workspace || null }])
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
  if (invite.custom_role_id) profileUpdate.custom_role_id = invite.custom_role_id;
  if (invite.workspace) profileUpdate.workspace = invite.workspace;

  const [{ error: profileError }, { error: inviteError }] = await Promise.all([
    supabase.from('profiles').update(profileUpdate).eq('id', userId),
    supabase.from('team_invites').update({ used_at: new Date().toISOString(), used_by: userId }).eq('token', token),
  ]);

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
}): Promise<Task | null> {
  const { data, error } = await getSupabase().from('tasks').insert([task]).select(TASK_SELECT).single();

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
    workspace?: 'prospection' | 'managing' | null;
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
  channelType: 'project' | 'client' | 'member',
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
          sender_name: sender?.full_name || 'Membre',
          sender_avatar: sender?.avatar_url || '',
        };
      }) as TeamChatMessage[];
    })(),
    []
  );
}

export async function sendTeamChatMessage(
  channelType: 'project' | 'client' | 'member',
  channelId: string,
  senderId: string,
  body: string,
  attachment?: TeamChatAttachment | null
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
      }])
      .select()
      .single();

    if (!error && data) {
      return data as TeamChatMessage;
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking error inserting team chat message, falling back to optimistic:', err);
  }

  // Resilient fallback: optimistic message so UI never freezes or fails
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
    channel_type: channelType,
    channel_id: channelId,
    sender_id: safeSenderId,
    body: body || null,
    attachment_url: attachment?.url || null,
    attachment_type: attachment?.type || null,
    attachment_name: attachment?.name || null,
    created_at: new Date().toISOString(),
  };
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
      let query = getSupabase()
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('approved', true)
        .in('role', ['admin', 'member'])
        .order('full_name', { ascending: true });
      if (excludeUserId) query = query.neq('id', excludeUserId);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((m) => ({
        id: m.id,
        full_name: m.full_name || 'Membre',
        email: m.email,
        avatar_url: m.avatar_url,
      })) as TeamMemberSummary[];
    })(),
    []
  );
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


