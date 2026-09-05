'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ShieldAlert,
  Webhook,
  Rocket,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchTechEdgeInvocations, invokeEdgeFunctionTest } from '@/lib/services/tech';
import type { TechEdgeInvocation, EdgeFunctionId } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface FunctionConfig {
  id: EdgeFunctionId;
  name: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultPayload: Record<string, unknown>;
}

const EDGE_FUNCTIONS: FunctionConfig[] = [
  {
    id: 'alert-dispatcher',
    name: 'Alert Dispatcher',
    badge: 'Critique & Incidents',
    icon: ShieldAlert,
    description: 'Diffuse les alertes opérationnelles dans le chat d’équipe (#annonces), notifie les membres et journalise l’incident.',
    defaultPayload: {
      id: 'alert-crit-001',
      severity: 'critical',
      title: 'Latence anormale détectée sur Supabase DB',
      message: 'Le pool de connexions PostgreSQL a dépassé 85% de saturation pendant plus de 2 minutes consécutives.',
      source: 'tech_system_health_probe',
    },
  },
  {
    id: 'webhook-validator',
    name: 'Webhook Validator',
    badge: 'Sécurité & HMAC',
    icon: Webhook,
    description: 'Valide la signature cryptographique, la conformité du payload et le typage des webhooks entrants (Stripe, Twilio, OpusClip).',
    defaultPayload: {
      eventType: 'payment.succeeded',
      clientId: 'client_resto_lapiazza',
      amount: 45000,
      currency: 'cad',
      signature: 'hmac_sha256_mock_valid_signature_883921',
    },
  },
  {
    id: 'launch-check-validator',
    name: 'Launch Check Validator',
    badge: 'Protocole QA',
    icon: Rocket,
    description: 'Exécute l’audit automatisé des 20 points de contrôle pré-déploiement avant la mise en ligne d’un projet client.',
    defaultPayload: {
      projectId: 'proj_flow_01',
      environment: 'production',
      checklist: [
        { id: 'dns_records', passed: true },
        { id: 'ssl_certificate', passed: true },
        { id: 'rls_enabled', passed: true },
        { id: 'stripe_live_keys', passed: true },
      ],
    },
  },
  {
    id: 'roi-aggregator',
    name: 'ROI Aggregator',
    badge: 'RevOps & Données',
    icon: TrendingUp,
    description: 'Agrège en temps réel le chiffre d’affaires généré, les commandes QR et l’impact mesurable pour chaque commerçant Minerva Flow.',
    defaultPayload: {
      clientId: 'client_resto_lapiazza',
      period: '30d',
      ordersCount: 1420,
      totalRevenue: 74500,
      qrScans: 3890,
    },
  },
];

export function EdgeFunctionConsole() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [selectedFunc, setSelectedFunc] = useState<FunctionConfig>(EDGE_FUNCTIONS[0]);
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(EDGE_FUNCTIONS[0].defaultPayload, null, 2)
  );
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'preview'>('production');
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    httpStatus: number;
    latencyMs: number;
    data: Record<string, unknown> | null;
    error: string | null;
    invocationId: string;
  } | null>(null);

  const [history, setHistory] = useState<TechEdgeInvocation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load invocation history
  const loadHistory = async () => {
    try {
      const data = await fetchTechEdgeInvocations(15);
      setHistory(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectFunction = (fn: FunctionConfig) => {
    setSelectedFunc(fn);
    setPayloadText(JSON.stringify(fn.defaultPayload, null, 2));
    setLastResult(null);
  };

  const handleResetPayload = () => {
    setPayloadText(JSON.stringify(selectedFunc.defaultPayload, null, 2));
    toastInfo('Payload réinitialisé', 'Le payload modèle a été restauré.');
  };

  const handleCopyResponse = () => {
    if (!lastResult?.data) return;
    navigator.clipboard.writeText(JSON.stringify(lastResult.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toastSuccess('Copié !', 'Réponse JSON copiée dans le presse-papier.');
  };

  const handleExecute = async () => {
    let parsedPayload: Record<string, unknown> = {};
    try {
      parsedPayload = JSON.parse(payloadText);
    } catch (parseErr) {
      toastError('JSON Invalide', 'Veuillez corriger la syntaxe JSON avant de déclencher le test.');
      return;
    }

    setExecuting(true);
    const startTime = performance.now();

    try {
      const result = await invokeEdgeFunctionTest(selectedFunc.id, parsedPayload, environment);
      setLastResult(result);

      if (result.success) {
        toastSuccess(
          `200 OK (${result.latencyMs}ms)`,
          `Edge Function "${selectedFunc.name}" exécutée avec succès.`
        );
      } else {
        toastError(
          `Erreur HTTP ${result.httpStatus}`,
          result.error || 'Échec de l’exécution de l’Edge Function.'
        );
      }

      // Refresh invocation history
      loadHistory();
    } catch (err: unknown) {
      const elapsed = Math.round(performance.now() - startTime);
      setLastResult({
        success: false,
        httpStatus: 500,
        latencyMs: elapsed,
        data: null,
        error: err instanceof Error ? err.message : 'Erreur réseau inattendue',
        invocationId: `err-${Date.now()}`,
      });
      toastError('Erreur d’exécution', 'Impossible de joindre le service Edge.');
    } finally {
      setExecuting(false);
    }
  };

  const IconComp = selectedFunc.icon;

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <Card className="p-5 bg-[#ffffff] border border-[#f2f2f2] rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#ecfdf5] border border-[#a7f3d0] text-[#0c8c5e]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#000000] tracking-tight">
                Console Edge Functions & Automatismes
              </h2>
              <p className="text-xs text-[#71717a]">
                Testeur de charge et de conformité temps réel pour les microservices sans serveur Deno / Supabase.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 rounded border border-[#dddddd] bg-[#ffffff] text-xs">
            {(['production', 'staging', 'preview'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                  environment === env
                    ? 'bg-[#08090a] text-white shadow-xs'
                    : 'text-[#71717a] hover:text-[#000000] hover:bg-[#f2f2f2]'
                )}
              >
                {env === 'production' ? 'Prod' : env === 'staging' ? 'Staging' : 'Preview'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            className="h-9 px-3 gap-1.5 text-xs text-[#000000] border-[#dddddd] hover:bg-[#f2f2f2]"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingHistory && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>
        </div>
      </Card>

      {/* ── Function Selector Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {EDGE_FUNCTIONS.map((fn) => {
          const isSelected = selectedFunc.id === fn.id;
          const FnIcon = fn.icon;
          return (
            <button
              key={fn.id}
              type="button"
              onClick={() => handleSelectFunction(fn)}
              className={cn(
                'flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden',
                isSelected
                  ? 'bg-[#ffffff] border-[#0c8c5e] shadow-[0_2px_8px_rgba(12,140,94,0.1)] ring-1 ring-[#0c8c5e]'
                  : 'bg-[#ffffff] border-[#f2f2f2] hover:border-[#dddddd] shadow-[0_2px_4px_rgba(0,0,0,0.02)]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={cn(
                    'p-2 rounded',
                    isSelected ? 'bg-[#ecfdf5] text-[#0c8c5e]' : 'bg-[#f2f2f2] text-[#71717a]'
                  )}
                >
                  <FnIcon className="w-4 h-4" />
                </div>
                <Badge
                  variant={isSelected ? 'green' : 'neutral'}
                  className="text-[10.5px] px-2 py-0.5 rounded"
                >
                  {fn.badge}
                </Badge>
              </div>
              <h3 className="text-sm font-semibold text-[#000000] tracking-tight">{fn.name}</h3>
              <p className="text-xs text-[#71717a] line-clamp-2 mt-1 leading-relaxed">
                {fn.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Split Work Area: Payload Editor vs. Live Response ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Request Payload (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <Card className="p-5 bg-[#ffffff] border border-[#f2f2f2] rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <IconComp className="w-4 h-4 text-[#0c8c5e]" />
                <span className="text-xs font-semibold text-[#000000]">
                  Payload de Requête JSON
                </span>
                <span className="text-[11px] font-mono text-[#71717a]" style={MONO}>
                  POST /functions/v1/{selectedFunc.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetPayload}
                  className="inline-flex items-center gap-1 text-xs text-[#71717a] hover:text-[#000000] transition-colors cursor-pointer"
                  title="Réinitialiser avec le payload type"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Modèle</span>
                </button>
              </div>
            </div>

            <div className="relative rounded border border-[#dddddd] bg-[#ffffff] focus-within:border-[#0c8c5e] transition-colors">
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={13}
                spellCheck={false}
                className="w-full p-3.5 text-xs font-mono bg-transparent text-[#000000] focus:outline-none resize-none leading-relaxed"
                style={MONO}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11.5px] text-[#71717a] flex items-center gap-1.5">
                <span className="size-1.5 rounded-[1px] bg-[#0c8c5e]" />
                <span>Format JSON strict avec clés entre guillemets</span>
              </div>

              {/* Action Button Ink Black 4px */}
              <Button
                onClick={handleExecute}
                disabled={executing}
                className="h-10 px-5 gap-2 text-xs font-medium bg-[#08090a] hover:bg-black/85 text-white rounded cursor-pointer shadow-mv-sm disabled:opacity-50"
              >
                {executing ? (
                  <>
                    <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Exécution en cours...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Tester l&apos;Edge Function</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Response Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="p-5 bg-[#ffffff] border border-[#f2f2f2] rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.03)] h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#71717a]" />
                  <span className="text-xs font-semibold text-[#000000]">
                    Réponse du Microservice
                  </span>
                </div>

                {lastResult && (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-semibold font-mono border',
                        lastResult.success
                          ? 'bg-[#ecfdf5] text-[#0c8c5e] border-[#a7f3d0]'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                      style={MONO}
                    >
                      {lastResult.httpStatus} {lastResult.success ? 'OK' : 'ERR'}
                    </span>
                    <span className="text-[11px] font-mono text-[#71717a]" style={MONO}>
                      {lastResult.latencyMs} ms
                    </span>
                  </div>
                )}
              </div>

              {lastResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#71717a]">
                      ID de trace : <span className="font-mono text-[#000000]" style={MONO}>{lastResult.invocationId}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyResponse}
                      className="inline-flex items-center gap-1 text-[11px] text-[#71717a] hover:text-[#000000] cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#0c8c5e]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>

                  <div className="rounded border border-[#f2f2f2] bg-[#fafafa] p-3.5 max-h-[300px] overflow-y-auto">
                    <pre className="text-xs font-mono text-[#000000] whitespace-pre-wrap leading-relaxed" style={MONO}>
                      {JSON.stringify(lastResult.data || { error: lastResult.error }, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center space-y-2">
                  <div className="size-10 rounded bg-[#f2f2f2] text-[#71717a] flex items-center justify-center mx-auto">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#000000]">En attente de déclenchement</p>
                  <p className="text-xs text-[#71717a] max-w-xs mx-auto">
                    Cliquez sur &quot;Tester l&apos;Edge Function&quot; pour envoyer le payload et sonder la réponse en direct.
                  </p>
                </div>
              )}
            </div>

            {/* Quick alert indicator */}
            {selectedFunc.id === 'alert-dispatcher' && (
              <div className="mt-4 p-3 rounded border border-[#a7f3d0] bg-[#ecfdf5] text-xs text-[#075037] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#0c8c5e] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Diffusion en direct :</strong> Le succès de ce test insère automatiquement une alerte système dans le chat d’équipe (canal <code>#annonces</code>).
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Bottom Section: Invocation History Table ── */}
      <Card className="p-5 bg-[#ffffff] border border-[#f2f2f2] rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#0c8c5e]" />
            <h3 className="text-sm font-semibold text-[#000000]">
              Journal des Invocations Récentes (tech_edge_invocations)
            </h3>
            <Badge variant="neutral" className="text-xs font-mono" style={MONO}>
              {history.length} enregistrements
            </Badge>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-10 text-center space-y-1">
            <p className="text-xs font-semibold text-[#000000]">Aucune invocation journalisée pour le moment</p>
            <p className="text-xs text-[#71717a]">
              Les exécutions de tests et alertes automatisées apparaîtront ici avec leur temps de réponse.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#f2f2f2] text-[11px] font-medium text-[#71717a]">
                  <th className="py-2.5 px-3">Fonction Edge</th>
                  <th className="py-2.5 px-3">Statut HTTP</th>
                  <th className="py-2.5 px-3">Latence</th>
                  <th className="py-2.5 px-3">Environnement</th>
                  <th className="py-2.5 px-3">Déclenché par</th>
                  <th className="py-2.5 px-3">Horodatage</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f2] text-[#000000]">
                {history.map((inv) => {
                  const isOk = inv.http_status >= 200 && inv.http_status < 400;
                  return (
                    <tr key={inv.id} className="hover:bg-[#f2f2f2]/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold font-mono text-xs" style={MONO}>
                        {inv.function_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold font-mono border',
                            isOk
                              ? 'bg-[#ecfdf5] text-[#0c8c5e] border-[#a7f3d0]'
                              : 'bg-red-50 text-red-700 border-red-200'
                          )}
                          style={MONO}
                        >
                          {isOk ? (
                            <CheckCircle2 className="w-3 h-3 text-[#0c8c5e]" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                          )}
                          <span>{inv.http_status}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#71717a]" style={MONO}>
                        {inv.latency_ms} ms
                      </td>
                      <td className="py-2.5 px-3 capitalize text-xs text-[#71717a]">
                        {inv.environment}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[#71717a] truncate max-w-[140px]">
                        {inv.triggered_by_name || 'Système'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[#71717a] font-mono" style={MONO}>
                        {new Date(inv.created_at).toLocaleTimeString('fr-CA', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const found = EDGE_FUNCTIONS.find((f) => f.id === inv.function_name);
                            if (found) {
                              setSelectedFunc(found);
                              setPayloadText(JSON.stringify(inv.payload || found.defaultPayload, null, 2));
                              toastInfo('Chargé', `Configuration de ${inv.function_name} prête à être re-testée.`);
                            }
                          }}
                          className="text-[11px] font-medium text-[#0c8c5e] hover:underline cursor-pointer"
                        >
                          Re-tester
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
