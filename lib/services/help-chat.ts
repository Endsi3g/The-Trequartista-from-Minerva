import type { SupabaseClient } from '@supabase/supabase-js';
import { Type, type FunctionDeclaration } from '@google/genai';
import type { AcademySOP } from '@/lib/types';

// Lightweight RAG for the /help AI chatbot: no vector DB (the Academy
// corpus is small, ~30 SOPs after the chantier-3 rebuild) -- just keyword
// overlap against title/description/category/content_markdown, take the
// top few. Good enough to ground the model in real content instead of
// letting it improvise about the app.
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents so "activité"/"activite" match
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

const STOPWORDS = new Set([
  'les', 'des', 'une', 'est', 'sur', 'que', 'qui', 'pour', 'dans', 'avec', 'comment', 'quoi',
  'the', 'and', 'for', 'how', 'what', 'are', 'this', 'that',
]);

export function findRelevantSops(sops: AcademySOP[], question: string, limit = 3): AcademySOP[] {
  const queryTokens = tokenize(question).filter((t) => !STOPWORDS.has(t));
  if (queryTokens.length === 0) return [];

  const scored = sops.map((sop) => {
    const haystack = tokenize([sop.title, sop.description, sop.category, sop.content_markdown || ''].join(' '));
    const score = queryTokens.reduce((sum, token) => sum + haystack.filter((h) => h === token || h.startsWith(token)).length, 0);
    return { sop, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.sop);
}

// A short, honest summary of the app's real modules -- written from the
// actual navigation/feature set, not invented. Grounds answers about "how
// do I do X" even when no single Academy SOP covers it directly.
export const APP_FEATURES_SUMMARY = `Minerva Trequartista est l'outil interne de l'agence Minerva. Modules principaux : Clients (fiches client, suivi ROI, MRR), Leads/CRM (pipeline de vente), Projets (roadmap, jalons, launch check), Réels (calendrier éditorial, upload de contenu), Académie (SOP internes, parcours d'intégration, tutoriels GitHub/Framer/Composio), Équipe (membres, charge de travail /team/workload, invitations, commissions RevOps), Tâches (/tasks, sous-tâches, commentaires), Chat (/chat, canaux projet/client/DM/thématiques #général et #annonces, réactions, fils de discussion, mentions @all et @equipe), Documents (wiki collaboratif), Propositions & Devis (/proposals, signature électronique SVG, acompte 50%), Facturation (/invoices, calcul TPS/TVQ), Intégrations & Composio (/integrations, pont MCP universel https://connect.composio.dev/mcp connectant Gmail, Google Calendar, Notion, GitHub, Stripe, ElevenLabs, Apify). Écosystème d'applications : Minerva OS Lite pour la prospection quotidienne (https://minerva-os-lite-desktop.vercel.app/today) et Minerva Flow SaaS pour les clients restaurateurs (https://minerva-flow.vercel.app/login). Workspaces : Prospection, Managing, Tech.`;

export function buildHelpChatPrompt(
  question: string,
  relevantSops: AcademySOP[],
  history: { role: 'user' | 'assistant'; content: string }[]
): string {
  const sopContext = relevantSops.length
    ? relevantSops
        .map((s) => `### ${s.title}\n${(s.content_markdown || s.description || '').slice(0, 1500)}`)
        .join('\n\n')
    : "Aucune SOP de l'Académie ne correspond directement à cette question.";

  const historyText = history
    .slice(-6)
    .map((h) => `${h.role === 'user' ? 'Membre' : 'Toi'} : ${h.content}`)
    .join('\n');

  return `Tu es l'assistant IA interne de Minerva Trequartista, l'outil de l'agence Minerva. Un membre de l'équipe te pose une question sur comment utiliser l'application, pour éviter de devoir déranger Kael (le fondateur) pour des questions déjà documentées.

Contexte sur l'application :
${APP_FEATURES_SUMMARY}

Extraits pertinents de l'Académie interne (documentation SOP réelle) :
${sopContext}

Règles :
- Réponds en français, ton direct et concret, 2-5 phrases maximum.
- Base-toi UNIQUEMENT sur les extraits ci-dessus et le contexte de l'application -- n'invente jamais une fonctionnalité, une page ou un chiffre qui n'y figure pas.
- Si la réponse ne se trouve nulle part dans ces extraits, dis-le honnêtement et suggère de demander directement à l'équipe via /chat plutôt que d'improviser.
- Si la question porte sur un lead/client/projet précis (nom, statut...), utilise l'outil search_app_data plutôt que de deviner -- inclus le lien réel renvoyé (ex: [Nom du client](/clients/id/roi-tracker)) dans ta réponse.
- Si le membre demande de créer une tâche/un rappel, utilise l'outil create_task -- confirme ensuite en une phrase ce qui a été créé.
- N'utilise ces outils que si la question le demande vraiment ; ne les appelle pas pour une question purement documentaire.

${historyText ? `Historique récent de la conversation :\n${historyText}\n` : ''}
Question du membre : ${question}

Réponds directement à la question, sans préambule.`;
}

// ── Tool use (chantier: actions IA) ─────────────────────────────────────
// Two tools only, deliberately: a read (search) and a write (create task).
// Gemini decides on its own whether to call either -- most questions are
// pure documentation lookups and never trigger a tool, so this stays
// token-efficient (no second round-trip unless the model actually needs
// one). Navigation is folded into search results (each hit carries its
// real app URL) rather than a separate tool, to avoid an extra call.
export const HELP_CHAT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_app_data',
    description:
      "Recherche par mot-clé dans les vraies données de l'app (leads, clients, projets) par nom/entreprise/statut. Utilise ceci pour toute question sur un lead, client ou projet précis plutôt que de deviner.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Terme de recherche (nom de personne, entreprise, ou projet).' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_task',
    description: "Crée une vraie tâche dans /tasks, assignée au membre qui pose la question.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Titre court et clair de la tâche.' },
        due_date: { type: Type.STRING, description: "Date d'échéance au format YYYY-MM-DD, si mentionnée." },
        priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'], description: 'Priorité, par défaut medium.' },
      },
      required: ['title'],
    },
  },
];

interface AppSearchHit {
  type: 'lead' | 'client' | 'project';
  name: string;
  detail: string;
  url: string;
}

async function searchAppData(supabase: SupabaseClient, query: string): Promise<AppSearchHit[]> {
  const like = `%${query}%`;
  const [{ data: leads }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from('leads')
      .select('id, contact_name, company_name, client_name, status')
      .or(`contact_name.ilike.${like},company_name.ilike.${like},client_name.ilike.${like}`)
      .limit(5),
    supabase.from('clients').select('id, name, industry, status').ilike('name', like).limit(5),
    supabase.from('projects').select('id, name, client_name, current_stage').ilike('name', like).limit(5),
  ]);

  const hits: AppSearchHit[] = [];
  for (const l of leads || []) {
    hits.push({
      type: 'lead',
      name: l.company_name || l.contact_name || l.client_name || 'Lead',
      detail: `Statut : ${l.status}`,
      url: `/leads/${l.id}`,
    });
  }
  for (const c of clients || []) {
    hits.push({ type: 'client', name: c.name, detail: `${c.industry || ''} · ${c.status}`, url: `/clients/${c.id}/roi-tracker` });
  }
  for (const p of projects || []) {
    hits.push({ type: 'project', name: p.name, detail: `${p.client_name || ''} · ${p.current_stage}`, url: `/projects/${p.id}/roadmap` });
  }
  return hits;
}

async function createTaskViaTool(
  supabase: SupabaseClient,
  userId: string,
  args: { title?: string; due_date?: string; priority?: string }
): Promise<{ ok: boolean; title?: string; error?: string }> {
  const title = (args.title || '').trim();
  if (!title) return { ok: false, error: 'Titre manquant' };
  const priority = (['low', 'medium', 'high', 'urgent'] as const).includes(args.priority as never)
    ? (args.priority as 'low' | 'medium' | 'high' | 'urgent')
    : 'medium';
  const { error } = await supabase.from('tasks').insert([
    {
      title,
      status: 'todo',
      priority,
      due_date: args.due_date || null,
      assignee_id: userId,
      created_by: userId,
    },
  ]);
  if (error) return { ok: false, error: error.message };
  return { ok: true, title };
}

// Executes a single named tool call and returns a compact JSON-serializable
// result for the model's follow-up turn.
export async function executeHelpChatTool(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (name === 'search_app_data') {
    const hits = await searchAppData(supabase, String(args.query || ''));
    return { results: hits, count: hits.length };
  }
  if (name === 'create_task') {
    return await createTaskViaTool(supabase, userId, args as { title?: string; due_date?: string; priority?: string });
  }
  return { error: `Outil inconnu : ${name}` };
}
