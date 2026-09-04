import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { AuditExtractionSchema } from '@/lib/schemas/audit-extraction';
import { requireAdmin } from '@/lib/server/permissions';
import { getGeminiClient, GEMINI_MODEL, GEMINI_NOT_CONFIGURED_ERROR } from '@/lib/services/gemini';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: auditId } = await params;
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;

  const client = getGeminiClient();
  if (!client) {
    return NextResponse.json({ error: GEMINI_NOT_CONFIGURED_ERROR }, { status: 501 });
  }

  const { data: audit, error: auditError } = await authed
    .from('audits')
    .select('id, transcript_raw, status')
    .eq('id', auditId)
    .maybeSingle();

  if (auditError || !audit) {
    return NextResponse.json({ error: 'Audit introuvable.' }, { status: 404 });
  }
  if (!audit.transcript_raw || !audit.transcript_raw.trim()) {
    return NextResponse.json(
      { error: "Aucune transcription à analyser -- collez-la ou récupérez-la avant de lancer l'extraction." },
      { status: 400 }
    );
  }

  await authed.from('audits').update({ status: 'extracting', extraction_error: null }).eq('id', auditId);

  const [{ data: rates }, { data: tools }] = await Promise.all([
    authed.from('role_hourly_rates').select('role_name'),
    authed.from('tool_compatibility_dictionary').select('tool_name'),
  ]);

  const knownRoles = (rates || []).map((r: { role_name: string }) => r.role_name);
  const knownTools = (tools || []).map((t: { tool_name: string }) => t.tool_name);

  const prompt = `Tu analyses la transcription d'un appel de diagnostic entre un consultant Minerva (agence d'automatisation et IA) et un prospect.
Extrais UNIQUEMENT ce qui est réellement dit -- n'invente rien. Si un aspect n'est pas abordé dans la transcription, laisse le tableau vide ([]).

Rôles connus : ${knownRoles.join(', ') || 'aucun encore configuré'}.
Outils connus : ${knownTools.join(', ') || 'aucun encore configuré'}.

Tu DOIS retourner un objet JSON strictement conforme à cette structure exacte :
{
  "process_steps": [
    {
      "title": "Titre du processus",
      "description": "Description succincte",
      "role_involved": "Rôle concerné",
      "is_bottleneck": true,
      "is_duplicate_entry": false,
      "source_quote": "Citation exacte de l'appel"
    }
  ],
  "hidden_cost_items": [
    {
      "task_description": "Tâche manuelle répétitive",
      "role_name": "Rôle exact mentionné",
      "hours_wasted_per_week": 5,
      "source_quote": "Citation exacte"
    }
  ],
  "tool_stack_findings": [
    {
      "tool_name": "Nom de l'outil",
      "category": "Catégorie",
      "notes": "Remarques sur l'usage"
    }
  ],
  "ai_initiatives": [
    {
      "title": "Titre de l'initiative",
      "description": "Description concrète",
      "impact_score": 8,
      "effort_score": 3
    }
  ]
}

Transcription :
"""
${audit.transcript_raw}
"""`;

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawText);
    } catch {
      throw new Error("Gemini n'a pas retourné un JSON valide.");
    }

    const parsed = AuditExtractionSchema.safeParse(rawJson);
    if (!parsed.success) {
      const errorMsg = `Validation Zod échouée: ${JSON.stringify(parsed.error.flatten())}`;
      await authed
        .from('audits')
        .update({ status: 'transcript_ready', extraction_error: errorMsg, extraction_raw: rawJson as never })
        .eq('id', auditId);
      return NextResponse.json(
        { error: "Extraction invalide -- voir extraction_error sur l'audit pour le détail." },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // Server computes cost figures by joining against role_hourly_rates
    const rateMap = new Map(
      (await authed.from('role_hourly_rates').select('role_name, hourly_rate_cad')).data?.map(
        (r: { role_name: string; hourly_rate_cad: number }) => [r.role_name, r.hourly_rate_cad]
      ) || []
    );
    const toolMap = new Map(
      (
        await authed
          .from('tool_compatibility_dictionary')
          .select('tool_name, has_rest_api, has_graphql_api, integration_feasibility')
      ).data?.map(
        (t: {
          tool_name: string;
          has_rest_api: boolean;
          has_graphql_api: boolean;
          integration_feasibility: string;
        }) => [t.tool_name, t]
      ) || []
    );

    await Promise.all([
      authed.from('audit_process_steps').delete().eq('audit_id', auditId),
      authed.from('audit_cost_items').delete().eq('audit_id', auditId),
      authed.from('audit_tool_findings').delete().eq('audit_id', auditId),
      authed.from('audit_initiatives').delete().eq('audit_id', auditId),
    ]);

    const inserts: PromiseLike<unknown>[] = [];

    if (data.process_steps.length) {
      inserts.push(
        authed.from('audit_process_steps').insert(
          data.process_steps.map((s, i) => ({ audit_id: auditId, sort_order: i, ...s }))
        )
      );
    }

    if (data.hidden_cost_items.length) {
      inserts.push(
        authed.from('audit_cost_items').insert(
          data.hidden_cost_items.map((c) => {
            const rate = rateMap.get(c.role_name) as number | undefined;
            return {
              audit_id: auditId,
              ...c,
              hourly_rate_cad: rate ?? null,
              annual_cost_cad: rate ? Math.round(c.hours_wasted_per_week * 52 * rate * 100) / 100 : null,
            };
          })
        )
      );

      for (const item of data.hidden_cost_items) {
        if (!rateMap.has(item.role_name)) {
          console.warn(`[audits/extract] Rôle "${item.role_name}" absent de role_hourly_rates -- coût non calculé pour cet item.`);
        }
      }
    }

    if (data.tool_stack_findings.length) {
      inserts.push(
        authed.from('audit_tool_findings').insert(
          data.tool_stack_findings.map((t) => {
            const known = toolMap.get(t.tool_name) as
              | { has_rest_api?: boolean; has_graphql_api?: boolean; integration_feasibility?: string }
              | undefined;
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
        )
      );

      const unknownTools = data.tool_stack_findings.filter((t) => !toolMap.has(t.tool_name));
      if (unknownTools.length) {
        inserts.push(
          authed.from('tool_compatibility_dictionary').upsert(
            unknownTools.map((t) => ({ tool_name: t.tool_name, category: t.category ?? null, integration_feasibility: 'unknown' })),
            { onConflict: 'tool_name', ignoreDuplicates: true }
          )
        );
      }
    }

    if (data.ai_initiatives.length) {
      inserts.push(
        authed.from('audit_initiatives').insert(
          data.ai_initiatives.map((init, i) => ({ audit_id: auditId, sort_order: i, ...init }))
        )
      );
    }

    await Promise.all(inserts);
    await authed
      .from('audits')
      .update({ status: 'extracted', extraction_raw: rawJson as never, extraction_error: null })
      .eq('id', auditId);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[audits/extract] Extraction error:', err);
    await authed.from('audits').update({ status: 'transcript_ready', extraction_error: message }).eq('id', auditId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
