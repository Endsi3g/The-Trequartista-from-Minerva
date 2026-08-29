import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import type { AuthInfo } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  fetchPlaneIssues,
  createPlaneIssue,
  updatePlaneIssue,
  fetchPlaneCycles,
  syncTaskToPlane,
  getPlaneConfig,
} from '@/lib/services/plane';
import { fetchTask } from '@/lib/services/supabase-data';

export const runtime = 'nodejs';

// Lazily instantiated -- same reasoning as app/api/webhooks/roi-event/route.ts:
// a module-scope `!` assertion throws during `next build`'s page-data
// collection when the service-role key isn't present in the build env.
function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Different lengths must fail before timingSafeEqual (it throws on
  // mismatched buffer lengths rather than returning false).
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function logMcpEvent(actorName: string, details: Record<string, unknown>) {
  try {
    await getSupabaseAdmin()
      .from('audit_logs')
      .insert([{ action: 'mcp_tool_call', table_name: 'mcp', actor_name: actorName, details }]);
  } catch (err) {
    // Audit logging must never break a tool response.
    console.warn('[mcp] audit log write failed:', err);
  }
}

// No hardcoded fallback: if neither token is configured, every request is
// rejected instead of silently trusting a value that ships in .env.example.
const verifyToken = async (_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;
  const claudeToken = process.env.MCP_SERVER_TOKEN;
  const hermesToken = process.env.MCP_HERMES_TOKEN;

  if (claudeToken && safeEqual(bearerToken, claudeToken)) {
    return { token: bearerToken, scopes: ['read:minerva'], clientId: 'claude' };
  }
  if (hermesToken && safeEqual(bearerToken, hermesToken)) {
    return { token: bearerToken, scopes: ['read:minerva'], clientId: 'hermes-agent' };
  }
  return undefined;
};

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'minerva_get_leads',
      {
        title: 'Leads Minerva',
        description: 'Récupère les leads du CRM Minerva (table `leads`), filtrables par statut réel.',
        inputSchema: z
          .object({
            status: z
              .enum(['Nouveau', 'Contacté', 'RDV Fixé', 'Gagné', 'Perdu'])
              .optional()
              .describe('Filtrer par statut réel du lead'),
            limit: z.number().int().min(1).max(100).default(20).describe('Nombre maximum de leads à retourner'),
          })
          .strict(),
      },
      async ({ status, limit }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_get_leads', status, limit });

        let query = getSupabaseAdmin()
          .from('leads')
          .select(
            'id, company_name, contact_name, contact_email, service_requested, status, stage, mrr_value, one_time_value, probability_pct, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(limit);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) {
          return { content: [{ type: 'text' as const, text: `Erreur Supabase: ${error.message}` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_get_kpi',
      {
        title: 'KPIs financiers Minerva',
        description:
          "KPIs financiers réels de l'agence : MRR total (clients au statut Active), valeur totale du pipeline (leads), nombre de clients actifs. N'inclut PAS de ROAS/CPL — aucune source de données publicitaires réelle n'existe encore dans Minerva, et ce serveur ne retourne jamais de valeurs inventées.",
        inputSchema: z
          .object({
            metric: z.enum(['mrr_total', 'pipeline_value_total', 'active_clients_count', 'all']).default('all'),
          })
          .strict(),
      },
      async ({ metric }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_get_kpi', metric });

        const supabase = getSupabaseAdmin();
        const [{ data: clients, error: clientsError }, { data: leads, error: leadsError }] = await Promise.all([
          supabase.from('clients').select('mrr, status'),
          supabase.from('leads').select('mrr_value, one_time_value'),
        ]);
        if (clientsError || leadsError) {
          return {
            content: [{ type: 'text' as const, text: `Erreur Supabase: ${(clientsError || leadsError)?.message}` }],
            isError: true,
          };
        }

        const activeClients = (clients ?? []).filter((c) => c.status === 'Active');
        const all = {
          mrr_total: activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0),
          pipeline_value_total: (leads ?? []).reduce((sum, l) => sum + (l.mrr_value || 0) + (l.one_time_value || 0), 0),
          active_clients_count: activeClients.length,
        };
        const result = metric === 'all' ? all : { [metric]: all[metric] };

        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_list_sops',
      {
        title: 'SOPs Académie Minerva',
        description: 'Liste les procédures opérationnelles (SOP) de l’Académie Minerva (table `academy_sops`).',
        inputSchema: z
          .object({
            search: z.string().optional().describe('Mot-clé filtrant le titre (recherche partielle, insensible à la casse)'),
            category: z.string().optional().describe('Filtrer par catégorie exacte (ex: Onboarding, Ventes & Prospection)'),
            limit: z.number().int().min(1).max(100).default(30),
          })
          .strict(),
      },
      async ({ search, category, limit }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_list_sops', search, category, limit });

        let query = getSupabaseAdmin()
          .from('academy_sops')
          .select('id, title, category, read_time_min, author, pillar')
          .order('title', { ascending: true })
          .limit(limit);
        if (category) query = query.eq('category', category);
        if (search) query = query.ilike('title', `%${search}%`);

        const { data, error } = await query;
        if (error) {
          return { content: [{ type: 'text' as const, text: `Erreur Supabase: ${error.message}` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_get_clients',
      {
        title: 'Clients Minerva',
        description:
          'Récupère les fiches clients de Minerva (table `clients`) — inclut des données potentiellement sensibles (MRR, forfait, gestionnaire de compte).',
        inputSchema: z
          .object({
            status: z.enum(['Active', 'Onboarding', 'Paused', 'Archived']).optional().describe('Filtrer par statut réel du client'),
            limit: z.number().int().min(1).max(100).default(20),
          })
          .strict(),
      },
      async ({ status, limit }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_get_clients', status, limit });

        let query = getSupabaseAdmin()
          .from('clients')
          .select('id, name, status, mrr, health_status, industry, contract_start_date, service_package, account_manager_name')
          .order('name', { ascending: true })
          .limit(limit);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) {
          return { content: [{ type: 'text' as const, text: `Erreur Supabase: ${error.message}` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_get_projects',
      {
        title: 'Projets Minerva',
        description: 'Récupère les projets Minerva (table `projects`) — statut, étape, progression, budget, échéance.',
        inputSchema: z
          .object({
            stage: z
              .enum(['Onboarding', 'Design Framer', 'Launch Check', 'Live Production'])
              .optional()
              .describe('Filtrer par étape réelle du projet'),
            clientId: z.string().uuid().optional().describe('Filtrer par identifiant client'),
            limit: z.number().int().min(1).max(100).default(20),
          })
          .strict(),
      },
      async ({ stage, clientId: filterClientId, limit }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_get_projects', stage, filterClientId, limit });

        let query = getSupabaseAdmin()
          .from('projects')
          .select('id, client_id, client_name, name, current_stage, health, progress_pct, due_date, budget_cad, client_visible')
          .order('due_date', { ascending: true })
          .limit(limit);
        if (stage) query = query.eq('current_stage', stage);
        if (filterClientId) query = query.eq('client_id', filterClientId);

        const { data, error } = await query;
        if (error) {
          return { content: [{ type: 'text' as const, text: `Erreur Supabase: ${error.message}` }], isError: true };
        }
        return { content: [{ type: 'text' as const, text: JSON.stringify(data ?? [], null, 2) }] };
      }
    );

    // ── Outils Plane (Gestion de tickets, cycles, synchronisation) ──────────

    server.registerTool(
      'minerva_plane_list_issues',
      {
        title: 'Issues Plane Workspace',
        description: 'Liste les tickets et issues de l’espace de gestion de projet Plane (Self-Hosted / Cloud).',
        inputSchema: z
          .object({
            priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional().describe('Filtrer par niveau de priorité'),
            limit: z.number().int().min(1).max(50).default(20).describe('Nombre maximum d’issues à retourner'),
          })
          .strict(),
      },
      async ({ priority, limit }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_plane_list_issues', priority, limit });

        const config = getPlaneConfig();
        if (!config.isConfigured) {
          return {
            content: [{ type: 'text' as const, text: 'Plane n’est pas configuré sur ce déploiement Minerva.' }],
            isError: true,
          };
        }

        const issues = await fetchPlaneIssues({ priority, limit });
        return { content: [{ type: 'text' as const, text: JSON.stringify(issues, null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_plane_create_issue',
      {
        title: 'Créer une issue Plane',
        description: 'Crée un nouveau ticket/issue dans le projet maître Plane avec priorité et date cible.',
        inputSchema: z
          .object({
            name: z.string().min(1).describe('Titre de la tâche ou de l’issue'),
            description: z.string().optional().describe('Description détaillée de l’issue'),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
            targetDate: z.string().optional().describe('Date cible d’échéance (YYYY-MM-DD)'),
          })
          .strict(),
      },
      async ({ name, description, priority, targetDate }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_plane_create_issue', name, priority });

        const config = getPlaneConfig();
        if (!config.isConfigured) {
          return {
            content: [{ type: 'text' as const, text: 'Plane n’est pas configuré sur ce serveur.' }],
            isError: true,
          };
        }

        const created = await createPlaneIssue({
          name,
          description_html: description ? `<p>${description}</p>` : undefined,
          priority,
          target_date: targetDate,
        });

        if (!created) {
          return {
            content: [{ type: 'text' as const, text: 'Échec de création du ticket sur Plane.' }],
            isError: true,
          };
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(created, null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_plane_update_issue',
      {
        title: 'Mettre à jour une issue Plane',
        description: 'Modifie le titre, la description, la priorité ou le statut d’un ticket Plane existant.',
        inputSchema: z
          .object({
            issueId: z.string().describe('Identifiant UUID de l’issue Plane'),
            name: z.string().optional().describe('Nouveau titre'),
            description: z.string().optional().describe('Nouvelle description'),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
            stateId: z.string().optional().describe('Identifiant de l’état cible (State ID)'),
          })
          .strict(),
      },
      async ({ issueId, name, description, priority, stateId }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_plane_update_issue', issueId, priority });

        const updated = await updatePlaneIssue(issueId, {
          name,
          description_html: description ? `<p>${description}</p>` : undefined,
          priority,
          state_id: stateId,
        });

        if (!updated) {
          return {
            content: [{ type: 'text' as const, text: `Impossible de mettre à jour l’issue #${issueId}.` }],
            isError: true,
          };
        }

        return { content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_plane_list_cycles',
      {
        title: 'Cycles et Sprints Plane',
        description: 'Récupère la liste des cycles (sprints d’ingénierie) avec leur état d’avancement et dates.',
        inputSchema: z.object({}).strict(),
      },
      async (_params, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_plane_list_cycles' });

        const cycles = await fetchPlaneCycles();
        return { content: [{ type: 'text' as const, text: JSON.stringify(cycles, null, 2) }] };
      }
    );

    server.registerTool(
      'minerva_plane_sync_task',
      {
        title: 'Synchroniser une tâche Minerva avec Plane',
        description: 'Pousse une tâche existante de la base Minerva vers Plane (création ou mise à jour de l’issue correspondante).',
        inputSchema: z
          .object({
            taskId: z.string().uuid().describe('Identifiant UUID de la tâche Minerva'),
          })
          .strict(),
      },
      async ({ taskId }, extra) => {
        const clientId = extra.http?.authInfo?.clientId ?? 'unknown';
        await logMcpEvent(clientId, { tool: 'minerva_plane_sync_task', taskId });

        const task = await fetchTask(taskId);
        if (!task) {
          return {
            content: [{ type: 'text' as const, text: `Tâche Minerva #${taskId} introuvable.` }],
            isError: true,
          };
        }

        const syncResult = await syncTaskToPlane(task);
        if (!syncResult.success) {
          return {
            content: [{ type: 'text' as const, text: `Échec de la synchronisation: ${syncResult.error}` }],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ message: 'Tâche synchronisée avec succès', ...syncResult }, null, 2),
            },
          ],
        };
      }
    );
  },
  { serverInfo: { name: 'minerva-trequartista', version: '1.0.0' } }
);

const authHandler = withMcpAuth(handler, verifyToken, { required: true });

// Shared secret bearer auth (verifyToken above) protects the data; this is
// a coarse per-IP abuse dampener on top, same pattern/limits as the public
// Framer-webhook routes in lib/rate-limit.ts.
async function rateLimitedHandler(req: Request): Promise<Response> {
  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'mcp', 60, 60_000);
  if (limited) {
    return new Response(JSON.stringify({ error: 'Trop de requêtes MCP. Réessayez plus tard.' }), {
      status: 429,
      headers: { 'content-type': 'application/json', 'retry-after': String(retryAfterSeconds) },
    });
  }
  return authHandler(req);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
