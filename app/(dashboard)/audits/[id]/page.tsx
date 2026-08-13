'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Sparkles,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import {
  fetchAuditWithFindings,
  updateAudit,
  updateAuditProcessStep,
  deleteAuditProcessStep,
  updateAuditCostItem,
  deleteAuditCostItem,
  updateAuditInitiative,
  deleteAuditInitiative,
} from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { AuditWithFindings } from '@/lib/types';

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastSuccess, toastError } = useToast();

  const [audit, setAudit] = useState<AuditWithFindings | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fetchingGranola, setFetchingGranola] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const load = useCallback(async () => {
    if (!auditId) return;
    const data = await fetchAuditWithFindings(auditId);
    setAudit(data);
    setTranscript(data?.transcript_raw || '');
    setLoading(false);
  }, [auditId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  if (!audit) return <Card className="py-16 text-center"><p className="text-sm text-mv-ink-soft">Audit introuvable.</p></Card>;

  const handleSaveTranscript = async () => {
    setSavingTranscript(true);
    const success = await updateAudit(audit.id, { transcript_raw: transcript, transcript_source: 'manual_paste', status: 'transcript_ready' });
    setSavingTranscript(false);
    if (!success) {
      toastError('Erreur', "Impossible d'enregistrer la transcription.");
      return;
    }
    toastSuccess('Transcription enregistrée');
    await load();
  };

  const handleFetchGranola = async () => {
    setFetchingGranola(true);
    const res = await fetch(`/api/audits/${audit.id}/fetch-transcript-granola`, { method: 'POST' });
    const data = await res.json();
    setFetchingGranola(false);
    if (!res.ok) {
      toastError('Granola non disponible', data.error || 'Erreur inconnue.');
      return;
    }
    await load();
  };

  const handleExtract = async () => {
    setExtracting(true);
    const res = await fetch(`/api/audits/${audit.id}/extract`, { method: 'POST' });
    const data = await res.json();
    setExtracting(false);
    if (!res.ok) {
      toastError('Extraction échouée', data.error || 'Erreur inconnue.');
      await load();
      return;
    }
    toastSuccess('Extraction terminée');
    await load();
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    const token = crypto.randomUUID();
    const success = await updateAudit(audit.id, {
      view_token: token,
      view_token_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setGeneratingLink(false);
    if (!success) {
      toastError('Erreur', 'Impossible de générer le lien.');
      return;
    }
    await load();
  };

  const totalAnnualCost = audit.cost_items.reduce((acc, c) => acc + (c.annual_cost_cad || 0), 0);
  const viewUrl = audit.view_token ? `${window.location.origin}/audit/view?token=${audit.view_token}` : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/audits" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux audits
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-mv-ink font-display">{audit.prospect_name}</h1>
          <Badge variant="lime" className="mt-1">{audit.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {audit.view_token ? (
            <Button
              variant="outline"
              size="sm"
              icon={copiedLink ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={() => {
                if (viewUrl) navigator.clipboard.writeText(viewUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
            >
              {copiedLink ? 'Lien copié' : 'Copier le lien client'}
            </Button>
          ) : (
            <Button variant="outline" size="sm" icon={<LinkIcon className="w-3.5 h-3.5" />} onClick={handleGenerateLink} disabled={generatingLink}>
              {generatingLink ? 'Génération…' : 'Générer le lien client'}
            </Button>
          )}
        </div>
      </div>

      {audit.extraction_error && (
        <Card className="border-mv-red/40 bg-mv-red-bg/40">
          <div className="flex items-start gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-mv-red shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-mv-red">Dernière extraction échouée</div>
              <p className="text-mv-ink-soft mt-1">{audit.extraction_error}</p>
            </div>
          </div>
        </Card>
      )}

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Transcription de l'appel</h3>}>
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFetchGranola} disabled={fetchingGranola}>
              {fetchingGranola ? 'Récupération…' : 'Récupérer via Granola'}
            </Button>
            {audit.transcript_source && <Badge variant="neutral">Source : {audit.transcript_source}</Badge>}
          </div>
          <textarea
            rows={10}
            placeholder="Collez la transcription complète de l'appel de diagnostic ici…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink font-mono text-[11px] focus:outline-none focus:border-mv-green"
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleSaveTranscript} disabled={savingTranscript}>
              {savingTranscript ? 'Enregistrement…' : 'Enregistrer la transcription'}
            </Button>
            <Button variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />} onClick={handleExtract} disabled={extracting || !audit.transcript_raw}>
              {extracting ? 'Extraction en cours…' : "Lancer l'extraction IA"}
            </Button>
          </div>
        </div>
      </Card>

      {audit.process_steps.length > 0 && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Grille des Processus</h3>}>
          <div className="space-y-2">
            {audit.process_steps.map((step) => (
              <div key={step.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-mv-ink">{step.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {step.is_bottleneck && <Badge variant="amber">Goulot</Badge>}
                    {step.is_duplicate_entry && <Badge variant="red">Saisie double</Badge>}
                    <button onClick={async () => { await deleteAuditProcessStep(step.id); load(); }} className="p-1 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {step.description && <p className="text-mv-ink-soft">{step.description}</p>}
                {step.source_quote && <p className="text-mv-ink-faint italic">"{step.source_quote}"</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {audit.cost_items.length > 0 && (
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Calculateur de Coûts Cachés</h3>
              <span className="font-mono font-extrabold text-mv-green text-sm">{totalAnnualCost.toLocaleString('fr-CA')} $ / an</span>
            </div>
          }
        >
          <div className="space-y-2">
            {audit.cost_items.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-mv-ink truncate">{item.task_description}</div>
                  <div className="text-mv-ink-soft mt-0.5">
                    {item.role_name} — {item.hours_wasted_per_week}h/sem
                    {item.hourly_rate_cad ? (
                      <span> — {item.annual_cost_cad?.toLocaleString('fr-CA')} $/an</span>
                    ) : (
                      <span className="text-mv-amber"> — taux horaire non configuré</span>
                    )}
                  </div>
                </div>
                <button onClick={async () => { await deleteAuditCostItem(item.id); load(); }} className="p-1 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {audit.cost_items.some((c) => !c.hourly_rate_cad) && (
            <p className="text-[11px] text-mv-amber mt-3">
              Certains rôles n'ont pas de taux horaire configuré. <Link href="/settings/audit-reference" className="underline">Configurer les taux</Link>.
            </p>
          )}
        </Card>
      )}

      {audit.tool_findings.length > 0 && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Évaluation du Stack Technologique</h3>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {audit.tool_findings.map((tool) => (
              <div key={tool.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-mv-ink">{tool.tool_name}</span>
                  <Badge variant={tool.integration_feasibility === 'high' ? 'green' : tool.integration_feasibility === 'medium' ? 'amber' : tool.integration_feasibility === 'low' ? 'red' : 'neutral'}>
                    {tool.integration_feasibility === 'unknown' ? 'À évaluer' : tool.integration_feasibility}
                  </Badge>
                </div>
                {tool.notes && <p className="text-mv-ink-soft mt-1">{tool.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {audit.initiatives.length > 0 && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Initiatives IA Proposées</h3>}>
          <div className="space-y-2">
            {[...audit.initiatives].sort((a, b) => (b.impact_score - b.effort_score) - (a.impact_score - a.effort_score)).map((init) => (
              <div key={init.id} className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border text-xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-mv-ink">{init.title}</div>
                  {init.description && <p className="text-mv-ink-soft mt-0.5 truncate">{init.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="lime">Impact {init.impact_score}</Badge>
                  <Badge variant="neutral">Effort {init.effort_score}</Badge>
                  <button onClick={async () => { await deleteAuditInitiative(init.id); load(); }} className="p-1 text-mv-ink-faint hover:text-mv-red transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
