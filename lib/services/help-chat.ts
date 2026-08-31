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
export const APP_FEATURES_SUMMARY = `Minerva Trequartista est l'outil interne de l'agence Minerva. Modules principaux : Clients (fiches client, suivi ROI, MRR), Leads/CRM (pipeline de vente), Projets (roadmap, jalons, launch check), Réels (calendrier éditorial, upload de contenu), Académie (SOP internes, parcours d'intégration), Équipe (membres, charge de travail /team/workload, invitations), Tâches (/tasks, sous-tâches, commentaires), Chat (/chat, canaux projet/client/DM/thématiques, réactions, fils de discussion, mentions, Coach Minerva), Documents (wiki collaboratif à blocs), Portail client (/portal, séparé, pour les clients). Rôles réels : admin, member, client. Workspaces internes : Prospection, Managing, Tech.`;

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

${historyText ? `Historique récent de la conversation :\n${historyText}\n` : ''}
Question du membre : ${question}

Réponds directement à la question, sans préambule.`;
}
