import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { AuditExtractionSchema, AUDIT_EXTRACTION_JSON_SCHEMA } from '@/lib/schemas/audit-extraction';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: auditId } = await params;
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: profile } = await authed.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "L'extraction IA n'est pas configurée sur cet environnement (ANTHROPIC_API_KEY manquante)." }, { status: 501 });
  }

  const { data: audit, error: auditError } = await authed.from('audits').select('id, transcript_raw, status').eq('id', auditId).maybeSingle();
  if (auditError || !audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 });
  }
  if (!audit.transcript_raw || !audit.transcript_raw.trim()) {
    return NextResponse.json({ error: 'Aucune transcription à analyser -- collez-la ou récupérez-la via Granola avant de lancer l\'extraction.' }, { status: 400 });
  }

  await authed.from('audits').update({ status: 'extracting', extraction_error: null }).eq('id', auditId);

  const [{ data: rates }, { data: tools }] = await Promise.all([
    authed.from('role_hourly_rates').select('role_name'),
    authed.from('tool_compatibility_dictionary').select('tool_name'),
  ]);

  const knownRoles = (rates || []).map((r: { role_name: string }) => r.role_name);
  const knownTools = (tools || []).map((t: { tool_name: string }) => t.tool_name);

  const prompt = `Tu analyses la transcription d'un appel de diagnostic entre un vendeur Minerva (agence d'automatisation IA) et un prospect PME. Extrais UNIQUEMENT ce qui est réellement dit -- n'invente rien. Si un aspect n'est pas abordé dans la transcription, omets-le simplement (tableau vide plutôt qu'un exemple fabriqué).

Rôles déjà connus (mappe vers ces noms exacts quand c'est pertinent, sinon utilise le nom mentionné dans l'appel) : ${knownRoles.join(', ') || 'aucun encore configuré'}.
Outils déjà connus dans notre dictionnaire de compatibilité : ${knownTools.join(', ') || 'aucun encore configuré'}.

Extrait :
1. process_steps -- les étapes/processus métier mentionnés, en signalant lesquels sont des goulots d'étranglement (bottleneck) ou de la saisie en double (duplicate_entry). Cite la phrase exacte quand possible (source_quote).
2. hidden_cost_items -- chaque fois qu'un temps perdu est mentionné (ex: "on passe 5h par semaine à..."), avec le rôle concerné et les heures par semaine. N'invente jamais un chiffre non mentionné.
3. tool_stack_findings -- les outils/logiciels nommés par le prospect (ex: Lightspeed, QuickBooks, Square).
4. ai_initiatives -- les pistes d'automatisation/IA pertinentes suggérées ou implicites dans l'appel, avec un score d'impact (1-10) et d'effort (1-10) basé sur ton jugement. Vise 3 à 10 initiatives selon ce que le contenu de l'appel supporte réellement -- n'en invente pas pour atteindre un quota.

Transcription :
"""
${audit.transcript_raw}
"""`;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      tools: [{ name: 'extract_audit_findings', description: 'Enregistre les éléments extraits de la transcription', input_schema: AUDIT_EXTRACTION_JSON_SCHEMA as unknown as Anthropic.Tool.InputSchema }],
      tool_choice: { type: 'tool', name: 'extract_audit_findings' },
      messages: [{ role: 'user', content: prompt }],
    });

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Claude n\'a retourné aucun appel d\'outil structuré.');
    }

    const parsed = AuditExtractionSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      const errorMsg = `Validation Zod échouée: ${JSON.stringify(parsed.error.flatten())}`;
      await authed.from('audits').update({ status: 'transcript_ready', extraction_error: errorMsg, extraction_raw: toolUse.input as never }).eq('id', auditId);
      return NextResponse.json({ error: 'Extraction invalide -- voir extraction_error sur l\'audit pour le détail.' }, { status: 422 });
    }

    const data = parsed.data;

    // Server computes cost figures by joining against role_hourly_rates --
    // Claude never asserts a dollar amount itself.
    const rateMap = new Map((await authed.from('role_hourly_rates').select('role_name, hourly_rate_cad')).data?.map((r: { role_name: string; hourly_rate_cad: number }) => [r.role_name, r.hourly_rate_cad]) || []);
    const toolMap = new Map((await authed.from('tool_compatibility_dictionary').select('tool_name, has_rest_api, has_graphql_api, integration_feasibility')).data?.map((t: { tool_name: string; has_rest_api: boolean; has_graphql_api: boolean; integration_feasibility: string }) => [t.tool_name, t]) || []);

    await Promise.all([
      authed.from('audit_process_steps').delete().eq('audit_id', auditId),
      authed.from('audit_cost_items').delete().eq('audit_id', auditId),
      authed.from('audit_tool_findings').delete().eq('audit_id', auditId),
      authed.from('audit_initiatives').delete().eq('audit_id', auditId),
    ]);

    const inserts: PromiseLike<unknown>[] = [];

    if (data.process_steps.length) {
      inserts.push(authed.from('audit_process_steps').insert(
        data.process_steps.map((s, i) => ({ audit_id: auditId, sort_order: i, ...s }))
      ));
    }

    if (data.hidden_cost_items.length) {
      inserts.push(authed.from('audit_cost_items').insert(
        data.hidden_cost_items.map((c) => {
          const rate = rateMap.get(c.role_name) as number | undefined;
          return {
            audit_id: auditId,
            ...c,
            hourly_rate_cad: rate ?? null,
            annual_cost_cad: rate ? Math.round(c.hours_wasted_per_week * 52 * rate * 100) / 100 : null,
          };
        })
      ));

      // Any role mentioned that isn't in the dictionary yet becomes a
      // visible gap instead of a silently-skipped cost calculation.
      for (const item of data.hidden_cost_items) {
        if (!rateMap.has(item.role_name)) {
          console.warn(`[audits/extract] Rôle "${item.role_name}" absent de role_hourly_rates -- coût non calculé pour cet item.`);
        }
      }
    }

    if (data.tool_stack_findings.length) {
      inserts.push(authed.from('audit_tool_findings').insert(
        data.tool_stack_findings.map((t) => {
          const known = toolMap.get(t.tool_name) as { has_rest_api?: boolean; has_graphql_api?: boolean; integration_feasibility?: string } | undefined;
          return {
            audit_id: auditId,
            tool_name: t.tool_name,
            category: t.category ?? null,
            notes: t.notes ?? null,
            has_rest_api: known?.has_rest_api ?? null,
            has_graphql_api: known?.has_graphql_api ?? null,
            integration_feasibility: known?.integration_feasibility ?? 'unknown',
          };
        })
      ));

      // Stub unknown tools into the dictionary so they show up as a gap to
      // fill in the settings screen instead of silently disappearing.
      const unknownTools = data.tool_stack_findings.filter((t) => !toolMap.has(t.tool_name));
      if (unknownTools.length) {
        inserts.push(authed.from('tool_compatibility_dictionary').upsert(
          unknownTools.map((t) => ({ tool_name: t.tool_name, category: t.category ?? null, integration_feasibility: 'unknown' })),
          { onConflict: 'tool_name', ignoreDuplicates: true }
        ));
      }
    }

    if (data.ai_initiatives.length) {
      inserts.push(authed.from('audit_initiatives').insert(
        data.ai_initiatives.map((init, i) => ({ audit_id: auditId, sort_order: i, ...init }))
      ));
    }

    await Promise.all(inserts);
    await authed.from('audits').update({ status: 'extracted', extraction_raw: toolUse.input as never, extraction_error: null }).eq('id', auditId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[audits/extract] Extraction error:', err);
    await authed.from('audits').update({ status: 'transcript_ready', extraction_error: message }).eq('id', auditId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
