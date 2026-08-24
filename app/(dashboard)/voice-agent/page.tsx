'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight,
  Settings,
  PhoneIncoming,
  Mic,
  Volume2,
  Radio,
  X,
  Save,
  Sparkles,
  AlertTriangle,
  Wand2,
  Loader2,
  Download,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchVoiceCalls, fetchVoiceAgentConfig, saveVoiceAgentConfig } from '@/lib/services/supabase-data';
import type { VoiceCall, VoiceAgentConfig } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { MinervaVoiceAgent } from '@/components/voice/MinervaVoiceAgent';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
}

const VOICES: VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'Femme', accent: 'Neutre & professionnelle' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'Femme', accent: 'Dynamique & commerciale' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'Femme', accent: 'Douce & empathique' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'Homme', accent: 'Expert & confiant' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'Homme', accent: 'Autorité & confiance' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'Homme', accent: 'Chaleureux & direct' },
];

const CALL_STATUS_LABEL: Record<VoiceCall['status'], string> = {
  completed: 'Terminé',
  abandoned: 'Abandonné',
  failed: 'Échec',
};

const DEFAULT_SYSTEM_PROMPT =
  "Tu es l'assistant vocal intelligent de Minerva. Tu réponds de manière courtoise, concise et professionnelle. Ton objectif est de qualifier les besoins du client (type de projet, budget, échéancier) et de convenir d'un rappel ou d'un devis.";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function VoiceAgentPage() {
  const { toastSuccess, toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'tts'>('dashboard');
  const [rangeDays, setRangeDays] = useState<1 | 7 | 30>(7);
  const [testConsoleOpen, setTestConsoleOpen] = useState(false);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);

  const [status, setStatus] = useState<{ configured: boolean; outboundConfigured: boolean } | null>(null);

  const [config, setConfig] = useState<VoiceAgentConfig | null>(null);
  const [voiceId, setVoiceId] = useState<string>(VOICES[0].id);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(false);
  const [autoTriggerDelay, setAutoTriggerDelay] = useState(300);
  const [saving, setSaving] = useState(false);

  const [ttsText, setTtsText] = useState('');
  const [ttsVoiceId, setTtsVoiceId] = useState<string>(VOICES[0].id);
  const [ttsGenerating, setTtsGenerating] = useState(false);
  const [ttsResultUrl, setTtsResultUrl] = useState<string | null>(null);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchVoiceCalls();
      setCalls(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
    fetch('/api/voice/status')
      .then((r) => r.json())
      .then((d) => setStatus({ configured: Boolean(d.configured), outboundConfigured: Boolean(d.outboundConfigured) }))
      .catch(() => setStatus({ configured: false, outboundConfigured: false }));
    fetchVoiceAgentConfig().then((c) => {
      if (c) {
        setConfig(c);
        setVoiceId(c.voice_id || VOICES[0].id);
        setSystemPrompt(c.system_prompt || DEFAULT_SYSTEM_PROMPT);
        setAutoTriggerEnabled(c.auto_trigger_enabled);
        setAutoTriggerDelay(c.auto_trigger_delay_seconds);
      }
    });
  }, [loadCalls]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ok = await saveVoiceAgentConfig(
        { voice_id: voiceId, system_prompt: systemPrompt, auto_trigger_enabled: autoTriggerEnabled, auto_trigger_delay_seconds: autoTriggerDelay },
        config?.id ?? null,
        user.id
      );
      if (ok) {
        toastSuccess('Configuration enregistrée');
        const fresh = await fetchVoiceAgentConfig();
        setConfig(fresh);
      } else {
        toastError('Erreur', "Impossible d'enregistrer la configuration.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSpeech = async () => {
    if (!ttsText.trim()) return;
    setTtsGenerating(true);
    setTtsResultUrl(null);
    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ttsText, voiceId: ttsVoiceId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        toastError('Génération impossible', data.error || 'Erreur inconnue.');
        return;
      }
      setTtsResultUrl(data.url);
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setTtsGenerating(false);
    }
  };

  const filteredCalls = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return calls.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }, [calls, rangeDays]);

  const totalMinutes = Math.round(filteredCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);
  const resolvedCount = filteredCalls.filter((c) => c.status === 'completed').length;
  const resolutionRate = filteredCalls.length > 0 ? Math.round((resolvedCount / filteredCalls.length) * 100) : 0;

  const histogramData = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = [];
    const numBars = rangeDays === 1 ? 12 : 7;
    for (let i = numBars - 1; i >= 0; i--) {
      const d = new Date();
      if (rangeDays === 1) {
        d.setHours(d.getHours() - i * 2);
        const label = `${d.getHours()}h`;
        const count = filteredCalls.filter((c) => {
          const cDate = new Date(c.created_at);
          return Math.abs(cDate.getTime() - d.getTime()) < 2 * 60 * 60 * 1000;
        }).length;
        days.push({ dateStr: label, label, count });
      } else {
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
        const count = filteredCalls.filter((c) => c.created_at.split('T')[0] === dateStr).length;
        days.push({ dateStr, label, count });
      }
    }
    return days;
  }, [filteredCalls, rangeDays]);

  const maxCallCount = Math.max(...histogramData.map((d) => d.count), 5);

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── 1. Unified Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-mv-green shrink-0">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Agent Vocal IA
            </h1>
            {status === null ? (
              <span className="inline-block h-5 w-32 rounded-[4px] bg-mv-cream-soft border border-mv-border/60" />
            ) : status.configured ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50/60 border border-emerald-200/60 text-[10.5px] font-medium text-emerald-800" style={MONO}>
                <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                Agent configuré
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-amber-50 border border-amber-200/60 text-[10.5px] font-medium text-amber-800" style={MONO}>
                <AlertTriangle className="w-3 h-3" />
                Agent non configuré
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            {([
              { key: 1, label: '24h' },
              { key: 7, label: '7j' },
              { key: 30, label: '30j' },
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeDays(r.key)}
                className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer ${
                  rangeDays === r.key
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                style={MONO}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTestConsoleOpen((v) => !v)}
            className={`h-7 px-3 rounded-[4px] text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              testConsoleOpen
                ? 'bg-zinc-900 text-white'
                : 'bg-mv-green hover:bg-emerald-700 text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{testConsoleOpen ? 'Fermer la console' : 'Tester l’agent vocal'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Underline Navigation Tabs ── */}
      <div className="flex items-center gap-6 border-b border-mv-border px-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`text-[12.5px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dashboard'
              ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Tableau de bord</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`text-[12.5px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'config'
              ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configuration</span>
        </button>
        <button
          onClick={() => setActiveTab('tts')}
          className={`text-[12.5px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tts'
              ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Génération vocale</span>
        </button>
      </div>

      {/* ── Inline WebRTC Live Test Console (No Modal) ── */}
      {testConsoleOpen && (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs">
          {status?.configured ? (
            <MinervaVoiceAgent />
          ) : (
            <div className="flex items-start gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/60 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Agent non configuré — ajoutez <code className="font-mono">ELEVENLABS_API_KEY</code> et{' '}
                <code className="font-mono">ELEVENLABS_AGENT_ID</code> pour activer la console de test.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' ? (
        <div className="space-y-4">
          {/* ── 3. Continuous 4-KPI Telemetry Ribbon ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Volume Reçu
                  </span>
                  <PhoneIncoming className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none mt-0.5" style={MONO}>
                  <AnimatedNumber value={filteredCalls.length} />
                </div>
              </div>

              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Temps d&apos;antenne
                  </span>
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    <AnimatedNumber value={totalMinutes} /> min
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    {filteredCalls.length > 0 ? (totalMinutes / filteredCalls.length).toFixed(1) : '0.0'} min / appel
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Résolution IA
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    <AnimatedNumber value={resolvedCount} />
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    Sans humain
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Taux de Succès
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    {filteredCalls.length > 0 ? `${resolutionRate}%` : '—'}
                  </div>
                  <div className="text-[11px] text-mv-green truncate ml-2 font-medium" style={MONO}>
                    Qualifié
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Volume Histogram ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-mv-border">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Distribution des Appels ({rangeDays === 1 ? '24h' : `${rangeDays} jours`})
                </span>
                <p className="text-[10.5px] text-mv-ink-faint">Activité horaire et journalière de l&apos;agent</p>
              </div>
            </div>

            <div className="h-32 flex items-end justify-between gap-3 pt-2 px-2">
              {histogramData.map((bar, i) => {
                const fillPct = bar.count > 0 ? (bar.count / maxCallCount) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" style={MONO}>
                      {bar.count}
                    </span>
                    <div className="w-full max-w-[28px] h-20 bg-zinc-100 rounded-[3px] overflow-hidden flex items-end">
                      <div
                        className="w-full bg-mv-green rounded-t-[3px] transition-all duration-300"
                        style={{ height: `${Math.max(fillPct, 4)}%`, opacity: bar.count > 0 ? 1 : 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 capitalize" style={MONO}>
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5. Call Logs DataTable ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Journal des Appels & Transcriptions
                </span>
                <span className="text-[10px] text-mv-ink-faint font-mono" style={MONO}>
                  ({filteredCalls.length})
                </span>
              </div>
            </div>

            {loading ? (
              <p className="text-xs text-mv-ink-faint py-6 text-center">Chargement des appels…</p>
            ) : filteredCalls.length === 0 ? (
              <div className="py-8 px-4 text-center space-y-1">
                <p className="text-xs text-mv-ink-soft font-medium">En attente du premier appel entrant ou sortant.</p>
                <p className="text-[11px] text-zinc-400">Les appels reçus s’afficheront automatiquement ici avec transcriptions et enregistrements.</p>
              </div>
            ) : (
              <table className="w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="h-7 bg-black/[0.02] border-b border-mv-border text-[10.5px] font-medium uppercase tracking-wider text-zinc-400">
                    <th className="pl-3.5 pr-2 text-left font-medium">Statut</th>
                    <th className="px-2 text-left font-medium">Numéro / Contact</th>
                    <th className="px-2 text-left font-medium">Résultat / Intention</th>
                    <th className="px-2 text-right font-medium">Durée</th>
                    <th className="px-2 text-left font-medium">Transcription</th>
                    <th className="pr-3.5 pl-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCalls.map((call) => (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCall(call)}
                      className="h-9 border-b border-mv-border last:border-0 hover:bg-black/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="pl-3.5 pr-2 py-1.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                            call.status === 'completed'
                              ? 'text-emerald-800 bg-emerald-50'
                              : call.status === 'abandoned'
                              ? 'text-amber-800 bg-amber-50'
                              : 'text-red-800 bg-red-50'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              call.status === 'completed' ? 'bg-mv-green' : call.status === 'abandoned' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          />
                          {CALL_STATUS_LABEL[call.status]}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-medium text-mv-ink font-mono text-[12px]" style={MONO}>
                        {call.caller_phone || call.caller_name || 'Numéro inconnu'}
                      </td>
                      <td className="px-2 py-1.5 text-mv-ink-soft text-[12px] truncate max-w-[200px]">
                        {call.outcome || '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11.5px] text-mv-ink-faint" style={MONO}>
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-2 py-1.5 text-[11.5px] text-mv-green font-medium">
                        {Array.isArray(call.transcript) && call.transcript.length > 0 ? 'Voir texte' : '—'}
                      </td>
                      <td className="pr-3.5 pl-2 py-1.5 text-right text-[11px] text-mv-ink-faint font-mono" style={MONO}>
                        {new Date(call.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : activeTab === 'config' ? (
        /* ── Configuration Tab ── */
        <div className="space-y-4">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                1. Choix de la Voix IA ElevenLabs
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Sélectionnez la personnalité vocale de l&apos;agent</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceId(v.id)}
                  className={`border rounded-[4px] p-2.5 transition-colors flex items-center justify-between text-left cursor-pointer ${
                    voiceId === v.id ? 'border-mv-green bg-emerald-50/50' : 'border-mv-border bg-black/[0.01] hover:bg-black/[0.02]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-[12.5px] text-mv-ink">{v.name}</div>
                    <div className="text-[10.5px] text-mv-ink-faint">{v.gender} · {v.accent}</div>
                  </div>
                  {voiceId === v.id ? (
                    <CheckCircle2 className="w-4 h-4 text-mv-green shrink-0" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                2. Directives & Prompt Système
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Comportement, qualification et collecte des coordonnées</p>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="w-full text-xs font-mono p-2.5 rounded-[4px] border border-mv-border bg-black/[0.01] text-zinc-900 focus:outline-none focus:border-mv-green resize-y"
            />
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                3. Appel Sortant Automatique
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Déclenche un appel de qualification dès qu&apos;un lead complète le formulaire</p>
            </div>
            {!status?.outboundConfigured && (
              <div className="flex items-start gap-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/60 rounded p-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <code className="font-mono">ELEVENLABS_AGENT_PHONE_NUMBER_ID</code> non configuré — l&apos;interrupteur peut être activé
                  mais aucun appel ne partira tant que ce n&apos;est pas branché.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[12.5px] font-semibold text-mv-ink">Activer le déclenchement automatique</div>
                <p className="text-[10.5px] text-mv-ink-faint">Désactivé par défaut, même une fois ElevenLabs branché.</p>
              </div>
              <button
                onClick={() => setAutoTriggerEnabled((v) => !v)}
                role="switch"
                aria-checked={autoTriggerEnabled}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  autoTriggerEnabled ? 'bg-mv-green' : 'bg-mv-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-mv-sm transition-transform ${
                    autoTriggerEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-mv-ink-soft">Délai avant l&apos;appel (secondes)</label>
              <input
                type="number"
                min={30}
                max={3600}
                value={autoTriggerDelay}
                onChange={(e) => setAutoTriggerDelay(Number(e.target.value) || 300)}
                className="w-24 text-xs font-mono px-2 py-1 rounded-[4px] border border-mv-border bg-black/[0.01] focus:outline-none focus:border-mv-green"
                style={MONO}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="h-7 px-3 rounded-[4px] bg-mv-green text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Text-to-Speech Tab ── */
        <div className="space-y-4">
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                Génération de voix pour le contenu
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Voix off pour un script de Réel ou tout autre contenu écrit</p>
            </div>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder="Collez le script à convertir en voix…"
              className="w-full text-xs p-2.5 rounded-[4px] border border-mv-border bg-black/[0.01] text-zinc-900 focus:outline-none focus:border-mv-green resize-y"
            />
            <div className="flex items-center justify-between gap-3">
              <select
                value={ttsVoiceId}
                onChange={(e) => setTtsVoiceId(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-[4px] border border-mv-border bg-black/[0.01] focus:outline-none focus:border-mv-green"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} — {v.accent}</option>
                ))}
              </select>
              <button
                onClick={handleGenerateSpeech}
                disabled={ttsGenerating || !ttsText.trim() || !status?.configured}
                className="h-7 px-3 rounded-[4px] bg-mv-green text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {ttsGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                <span>{ttsGenerating ? 'Génération…' : 'Générer la voix'}</span>
              </button>
            </div>
            {!status?.configured && (
              <p className="text-[11px] text-amber-800">Agent non configuré — la génération vocale nécessite ELEVENLABS_API_KEY.</p>
            )}
            {ttsResultUrl && (
              <div className="border border-mv-border rounded-[4px] p-3 bg-black/[0.01] space-y-2">
                <audio controls src={ttsResultUrl} className="w-full" />
                <a
                  href={ttsResultUrl}
                  download
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-mv-green hover:underline"
                >
                  <Download className="w-3.5 h-3.5" /> Télécharger le fichier audio
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Side Drawer for Call Audio & Transcript ── */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs">
          <div className="w-full max-w-[380px] bg-white h-full shadow-2xl border-l border-mv-border flex flex-col justify-between p-4 space-y-4 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-mv-border">
                <div>
                  <h3 className="font-semibold text-sm text-mv-ink">{selectedCall.caller_phone || selectedCall.caller_name || 'Appel'}</h3>
                  <span className="text-[10.5px] text-zinc-400 font-mono" style={MONO}>
                    {new Date(selectedCall.created_at).toLocaleDateString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCall(null)}
                  className="h-6 w-6 rounded border border-mv-border flex items-center justify-center text-zinc-400 hover:text-zinc-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="border border-mv-border rounded-[4px] p-2.5 bg-black/[0.01] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-mv-ink">Durée de l&apos;appel</span>
                  <span className="font-mono text-zinc-500" style={MONO}>{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
                {selectedCall.recording_url ? (
                  <audio controls src={selectedCall.recording_url} className="w-full h-8" />
                ) : (
                  <p className="text-[10.5px] text-zinc-400 italic">Aucun enregistrement disponible pour cet appel.</p>
                )}
              </div>

              {selectedCall.outcome && (
                <div className="border border-emerald-200/60 rounded-[4px] p-2 bg-emerald-50/40 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-mv-green" />
                    <span>Résultat IA</span>
                  </div>
                  <p className="text-zinc-600">{selectedCall.outcome}</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Transcription</span>
                <div className="space-y-2 text-[11.5px]">
                  {Array.isArray(selectedCall.transcript) && selectedCall.transcript.length > 0 ? (
                    selectedCall.transcript.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-[4px] border ${
                          t.sender === 'agent' || t.source === 'agent'
                            ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-950'
                            : 'bg-zinc-50 border-mv-border text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9.5px] font-mono text-zinc-400 mb-0.5" style={MONO}>
                          <span className="font-semibold uppercase">{t.sender || t.source || 'Interlocuteur'}</span>
                        </div>
                        <p>{t.message || t.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-400 text-xs italic">Aucune transcription disponible.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
