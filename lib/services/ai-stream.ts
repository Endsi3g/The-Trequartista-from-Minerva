import { getGeminiClient, GEMINI_MODEL } from '@/lib/services/gemini';
import { createClient as createServerClient } from '@/lib/supabase/server';

export type NotionAiAction =
  | 'generate'
  | 'rewrite'
  | 'summarize'
  | 'extract_todos'
  | 'translate';

export type NotionAiTone = 'professional' | 'concise' | 'persuasive' | 'educational' | 'casual';
export type NotionAiLength = 'shorter' | 'longer' | 'standard';

export interface NotionAiStreamRequest {
  action: NotionAiAction;
  prompt?: string;
  selectedText?: string;
  contextText?: string;
  tone?: NotionAiTone;
  length?: NotionAiLength;
  targetLanguage?: 'fr' | 'en' | 'es';
  customInstruction?: string;
  workspace?: string;
}

const SYSTEM_PROMPTS: Record<NotionAiAction, (req: NotionAiStreamRequest) => string> = {
  generate: (req) => `Tu es l'assistant IA de Minerva Trequartista (Notion-like AI pour agence d'ingénierie, automatisation et SaaS).
Règles strictes :
- Rédige un contenu d'excellence en Markdown propre, structuré et directement exploitable.
- Utilise des titres (# Titre 1, ## Titre 2, ### Titre 3), des listes à puces, des cases à cocher (- [ ] ou - [x]), des encadrés/callouts (ex: > [!NOTE], > [!TIP], > [!WARNING]) et des tableaux si pertinent.
- Ton adapté : ${req.tone || 'professionnel, tranchant et orienté action'}.
- Longueur : ${req.length === 'shorter' ? 'très synthétique et droit au but' : req.length === 'longer' ? 'très complet et détaillé avec exemples concrets' : 'équilibré et actionnable'}.
- Ne donne JAMAIS de bavardage d'introduction ou de conclusion (pas de "Voici le texte :", pas de "J'espère que cela vous aide"). Démarre immédiatement le contenu.`,

  rewrite: (req) => `Tu es l'assistant de réécriture Notion AI de Minerva Trequartista.
Mission : Transformer et sublimer le texte sélectionné selon l'instruction fournie.
${req.customInstruction ? `Instruction spécifique : ${req.customInstruction}` : ''}
${req.tone ? `Ton souhaité : ${req.tone}` : ''}
${req.length === 'shorter' ? 'Consigne de longueur : Rendre le texte beaucoup plus court, dense et percutant.' : ''}
${req.length === 'longer' ? 'Consigne de longueur : Développer le propos avec plus de détails, d\'arguments et d\'exemples.' : ''}
Règles strictes :
- Conserve le sens exact tout en améliorant radicalement le style, la clarté et l'impact.
- Retourne UNIQUEMENT le texte réécrit, sans aucune phrase d'accompagnement ou balisage superflu.`,

  summarize: () => `Tu es l'assistant de synthèse de Minerva Trequartista.
Mission : Résumer le texte ou document fourni sous forme de synthèse exécutive de haut niveau.
Format obligatoire :
- 1 phrase d'accroche résumant l'enjeu principal en gras.
- 5 à 7 points clés concis sous forme de bullet points.
- 1 section finale "## Décisions & Prochaines étapes" avec 2 à 3 points clés.
- Zéro bavardage inutile.`,

  extract_todos: () => `Tu es l'assistant d'extraction de tâches de Minerva Trequartista.
Mission : Identifier et extraire toutes les actions concrètes, livrables et responsabilités mentionnées dans le texte.
Format obligatoire :
- Liste de cases à cocher Markdown strictes : "- [ ] [Tâche actionnable avec verbe à l'infinitif]".
- Regroupe si nécessaire par responsable ou priorité avec des sous-titres simples (###).
- Zéro texte hors de la liste de tâches.`,

  translate: (req) => `Tu es le traducteur professionnel de Minerva Trequartista.
Langue cible : ${req.targetLanguage === 'en' ? 'Anglais (EN-US)' : req.targetLanguage === 'es' ? 'Espagnol (ES)' : 'Français (FR)'}.
Règles strictes :
- Traduis fidèlement avec le vocabulaire professionnel d'agence web/SaaS.
- Préserve méticuleusement toute la mise en page Markdown (titres, listes, code blocks, gras, liens).
- Retourne uniquement le texte traduit sans aucune note du traducteur.`,
};

export function buildAiPrompt(req: NotionAiStreamRequest): string {
  const system = SYSTEM_PROMPTS[req.action](req);
  const parts: string[] = [system];

  if (req.contextText) {
    parts.push(`\n--- Contexte du document existant ---\n${req.contextText.slice(0, 4000)}`);
  }

  if (req.selectedText) {
    parts.push(`\n--- Texte sélectionné à traiter ---\n${req.selectedText}`);
  }

  if (req.prompt) {
    parts.push(`\n--- Demande utilisateur / Prompt ---\n${req.prompt}`);
  }

  return parts.join('\n\n');
}

export async function logAiGeneration(params: {
  userId?: string | null;
  workspace?: string;
  action: NotionAiAction;
  promptPreview: string;
  inputLength: number;
  outputLength: number;
  durationMs: number;
  status: 'success' | 'error' | 'cancelled';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createServerClient();
    await supabase.from('ai_generation_logs').insert([
      {
        user_id: params.userId || null,
        workspace: params.workspace || 'general',
        action: params.action,
        model: GEMINI_MODEL,
        prompt_preview: params.promptPreview.slice(0, 200),
        input_length: params.inputLength,
        output_length: params.outputLength,
        duration_ms: params.durationMs,
        status: params.status,
        error_message: params.errorMessage || null,
        metadata: params.metadata || {},
      },
    ]);
  } catch (err) {
    console.warn('[AI Logger] Failed to persist log:', err);
  }
}
