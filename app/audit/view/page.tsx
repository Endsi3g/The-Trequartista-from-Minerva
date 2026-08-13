'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThumbsUp, ThumbsDown, Calendar, MessageSquare, AlertTriangle, DollarSign, Wrench } from 'lucide-react';
import { ImpactEffortMatrix } from '@/components/charts/ImpactEffortMatrix';
import { ProcessFlowDiagram } from '@/components/audit/ProcessFlowDiagram';
import type { AuditProcessStep, AuditCostItem, AuditToolFinding, AuditInitiative, AuditInitiativeReaction, AuditComment } from '@/lib/types';

interface AuditViewData {
  audit: { id: string; prospect_name: string; status: string; created_at: string };
  process_steps: AuditProcessStep[];
  cost_items: AuditCostItem[];
  tool_findings: AuditToolFinding[];
  initiatives: AuditInitiative[];
  reactions: AuditInitiativeReaction[];
  comments: AuditComment[];
  calendly_link: string | null;
}

function AuditViewContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState<AuditViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError('Lien invalide -- aucun token fourni.');
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/audit-view/${token}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || 'Erreur inconnue.');
      setLoading(false);
      return;
    }
    setData(body);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleReact = async (initiativeId: string, reaction: 'interested' | 'not_priority') => {
    if (!token) return;
    await fetch(`/api/audit-view/${token}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initiativeId, reaction }),
    });
    await load();
  };

  const handleSubmitComment = async () => {
    if (!token || !commentDraft.trim()) return;
    setSubmittingComment(true);
    await fetch(`/api/audit-view/${token}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType: 'general', body: commentDraft.trim() }),
    });
    setCommentDraft('');
    setSubmittingComment(false);
    await load();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-mv-ink-soft bg-mv-cream">Chargement de votre audit…</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mv-cream p-6">
        <div className="text-center space-y-2">
          <AlertTriangle className="w-8 h-8 text-mv-amber mx-auto" />
          <p className="text-sm font-bold text-mv-ink">{error || 'Audit introuvable.'}</p>
        </div>
      </div>
    );
  }

  const totalAnnualCost = data.cost_items.reduce((acc, c) => acc + (c.annual_cost_cad || 0), 0);
  const reactionFor = (initiativeId: string) => data.reactions.find((r) => r.initiative_id === initiativeId)?.reaction;

  return (
    <div className="min-h-screen bg-mv-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <span className="text-xs font-bold text-mv-green uppercase tracking-wider">Diagnostic Minerva</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mv-ink font-display mt-1">{data.audit.prospect_name}</h1>
          <p className="text-xs text-mv-ink-soft mt-1">
            Préparé le {new Date(data.audit.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {data.process_steps.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-mv-ink uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-mv-green" /> Votre processus, avant / après
            </h2>
            <ProcessFlowDiagram steps={data.process_steps} />
          </section>
        )}

        {data.cost_items.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-mv-ink uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-mv-green" /> Coûts cachés estimés
            </h2>
            <div className="bg-mv-surface border border-mv-border rounded-xl p-5 space-y-2">
              {data.cost_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-mv-border/50 last:border-0">
                  <span className="text-mv-ink-soft">{item.task_description}</span>
                  <span className="font-mono font-bold text-mv-ink">{item.annual_cost_cad ? `${item.annual_cost_cad.toLocaleString('fr-CA')} $/an` : 'N/D'}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-extrabold text-mv-ink">Total estimé</span>
                <span className="text-lg font-extrabold text-mv-green font-mono">{totalAnnualCost.toLocaleString('fr-CA')} $/an</span>
              </div>
            </div>
          </section>
        )}

        {data.tool_findings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-mv-ink uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4 text-mv-green" /> Compatibilité de vos outils
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.tool_findings.map((tool) => (
                <div key={tool.id} className="bg-mv-surface border border-mv-border rounded-xl p-3 text-xs">
                  <span className="font-bold text-mv-ink">{tool.tool_name}</span>
                  <span className="ml-2 text-mv-ink-soft">
                    {tool.integration_feasibility === 'high' ? 'Facilement intégrable' : tool.integration_feasibility === 'medium' ? 'Intégration modérée' : tool.integration_feasibility === 'low' ? 'Intégration complexe' : 'À évaluer'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.initiatives.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-extrabold text-mv-ink uppercase tracking-wider">Opportunités d'automatisation IA</h2>
            <ImpactEffortMatrix points={data.initiatives} />
            <div className="space-y-2">
              {data.initiatives.map((init) => {
                const reaction = reactionFor(init.id);
                return (
                  <div key={init.id} className="bg-mv-surface border border-mv-border rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-mv-ink">{init.title}</div>
                      {init.description && <p className="text-xs text-mv-ink-soft mt-1">{init.description}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleReact(init.id, 'interested')}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${reaction === 'interested' ? 'bg-mv-green text-white border-mv-green' : 'border-mv-border text-mv-ink-soft hover:border-mv-green'}`}
                        title="Intéressé"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleReact(init.id, 'not_priority')}
                        className={`p-2 rounded-lg border transition-colors cursor-pointer ${reaction === 'not_priority' ? 'bg-mv-ink-soft text-white border-mv-ink-soft' : 'border-mv-border text-mv-ink-soft hover:border-mv-ink'}`}
                        title="Pas prioritaire"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {data.calendly_link && (
          <section className="bg-mv-green text-white rounded-2xl p-6 text-center space-y-3">
            <Calendar className="w-6 h-6 mx-auto" />
            <p className="font-extrabold text-base">Prêt à passer à l'étape suivante ?</p>
            <a
              href={data.calendly_link}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-5 py-2.5 bg-white text-mv-green font-bold text-sm rounded-xl hover:bg-mv-cream transition-colors"
            >
              Réserver mon 2e appel
            </a>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-extrabold text-mv-ink uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-mv-green" /> Une question ?
          </h2>
          <div className="bg-mv-surface border border-mv-border rounded-xl p-4 space-y-3">
            {data.comments.length > 0 && (
              <div className="space-y-2">
                {data.comments.map((c) => (
                  <div key={c.id} className="text-xs p-2.5 rounded-lg bg-mv-cream-soft">
                    <div className="font-bold text-mv-ink">{c.author}</div>
                    <p className="text-mv-ink-soft mt-0.5">{c.body}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Laissez un commentaire ou une question…"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                className="flex-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-mv-green"
              />
              <button
                onClick={handleSubmitComment}
                disabled={submittingComment || !commentDraft.trim()}
                className="px-4 py-2 bg-mv-green text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Envoyer
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function AuditViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-mv-ink-soft bg-mv-cream">Chargement…</div>}>
      <AuditViewContent />
    </Suspense>
  );
}
