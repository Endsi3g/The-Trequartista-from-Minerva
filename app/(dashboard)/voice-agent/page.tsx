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
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchVoiceCalls } from '@/lib/services/supabase-data';
import type { VoiceCall } from '@/lib/types';
import { AnimatedNumber } from '@/components/ui/animated-number';

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

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function VoiceAgentPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config'>('dashboard');
  const [rangeDays, setRangeDays] = useState<1 | 7 | 30>(7);
  const [testConsoleOpen, setTestConsoleOpen] = useState(false);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);

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
  }, [loadCalls]);

  const filteredCalls = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return calls.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }, [calls, rangeDays]);

  const totalMinutes = Math.round(filteredCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);
  const resolvedCount = filteredCalls.filter((c) => c.status === 'completed').length;
  const resolutionRate = filteredCalls.length > 0 ? Math.round((resolvedCount / filteredCalls.length) * 100) : 0;

  // Generate histogram data with ghost bars
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
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50/60 border border-emerald-200/60 text-[10.5px] font-medium text-emerald-800" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green animate-pulse" />
              Agent en ligne
            </span>
          </div>
        </div>

        {/* Right Controls: Period Selector & Inline Test Console Toggle */}
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
      </div>

      {/* ── Optional Inline WebRTC Live Test Console (No Modal) ── */}
      {testConsoleOpen && (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3 bg-black/[0.01]">
          <div className="flex items-center justify-between border-b border-mv-border pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mv-green animate-ping" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-mv-ink">
                Console de Test WebRTC en Direct
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-zinc-500" style={MONO}>
              <span>Latence : 420 ms</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold">24 kHz HD</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 py-2 px-3 bg-white border border-mv-border rounded-[4px]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-mv-green flex items-center justify-center text-mv-green">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">Microphone actif · Prêt pour test vocal</p>
                <p className="text-[11px] text-zinc-500">Parlez pour tester la compréhension et le flux de qualification</p>
              </div>
            </div>
            <div className="flex items-center gap-1 h-5">
              {[10, 40, 70, 30, 90, 50, 80, 20, 60, 40, 80, 30].map((h, i) => (
                <div key={i} className="w-1 bg-mv-green rounded-full animate-bounce" style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'dashboard' ? (
        <div className="space-y-4">
          {/* ── 3. Continuous 4-KPI Telemetry Ribbon ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
              {/* Volume Reçu */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Volume Reçu
                  </span>
                  <PhoneIncoming className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    <AnimatedNumber value={filteredCalls.length} />
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    Capacité : {filteredCalls.length} / 500
                  </div>
                </div>
              </div>

              {/* Temps d'antenne */}
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

              {/* Résolution IA */}
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

              {/* Taux de Succès */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Taux de Succès
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    {resolutionRate}.0%
                  </div>
                  <div className="text-[11px] text-mv-green truncate ml-2 font-medium" style={MONO}>
                    Qualifié
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Volume Histogram (Dense Ghost Bar Chart) ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-mv-border">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                  Distribution des Appels ({rangeDays === 1 ? '24h' : `${rangeDays} jours`})
                </span>
                <p className="text-[10.5px] text-mv-ink-faint">Activité horaire et journalière de l&apos;agent</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-mono text-zinc-500 border border-mv-border rounded px-1.5 py-0.5 bg-black/[0.01]" style={MONO}>
                  Pic : {filteredCalls.length > 0 ? '14h - 16h' : '--'}
                </span>
                <span className="text-[10.5px] font-mono text-zinc-500 border border-mv-border rounded px-1.5 py-0.5 bg-black/[0.01]" style={MONO}>
                  Latence : &lt; 650 ms
                </span>
                <span className="text-[10.5px] font-mono text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 bg-emerald-50/50" style={MONO}>
                  24 kHz HD
                </span>
              </div>
            </div>

            {/* Dense 7-column Bar Graph */}
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
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                          Terminé
                        </span>
                      </td>
                      <td className="px-2 py-1.5 font-medium text-mv-ink font-mono text-[12px]" style={MONO}>
                        {call.caller_phone || call.caller_name || '+1 (514) •••-••••'}
                      </td>
                      <td className="px-2 py-1.5 text-mv-ink-soft text-[12px] truncate max-w-[200px]">
                        {call.outcome || 'Qualification générale'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[11.5px] text-mv-ink-faint" style={MONO}>
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-2 py-1.5 text-[11.5px] text-mv-green font-medium">
                        [ ▶ ılılıl ] Voir texte
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
      ) : (
        /* ── Configuration Tab (Full width stacked cards) ── */
        <div className="space-y-4">
          {/* Voice Selection */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                1. Choix de la Voix IA ElevenLabs
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Sélectionnez la personnalité vocale de l&apos;agent</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className="border border-mv-border rounded-[4px] p-2.5 bg-black/[0.01] hover:bg-black/[0.02] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-[12.5px] text-mv-ink">{v.name}</div>
                    <div className="text-[10.5px] text-mv-ink-faint">{v.gender} · {v.accent}</div>
                  </div>
                  <button className="h-6 w-6 rounded-full border border-mv-border flex items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer">
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
            <div className="border-b border-mv-border pb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                2. Directives & Prompt Système
              </span>
              <p className="text-[10.5px] text-mv-ink-faint">Comportement, qualification et collecte des coordonnées</p>
            </div>
            <textarea
              defaultValue="Tu es l'assistant vocal intelligent de Minerva. Tu réponds de manière courtoise, concise et professionnelle. Ton objectif est de qualifier les besoins du client (type de projet, budget, échéancier) et de convenir d'un rappel ou d'un devis."
              rows={4}
              className="w-full text-xs font-mono p-2.5 rounded-[4px] border border-mv-border bg-black/[0.01] text-zinc-900 focus:outline-none focus:border-mv-green resize-y"
            />
            <div className="flex justify-end">
              <button className="h-7 px-3 rounded-[4px] bg-mv-green text-white text-xs font-medium hover:bg-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer les paramètres</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Side Drawer for Call Audio & Transcript (Inline right panel) ── */}
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

              {/* Minimalist Waveform Player */}
              <div className="border border-mv-border rounded-[4px] p-2.5 bg-black/[0.01] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-mv-ink">Enregistrement audio</span>
                  <span className="font-mono text-zinc-500" style={MONO}>{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
                <div className="h-6 flex items-center gap-1">
                  {[40, 60, 20, 90, 75, 45, 85, 30, 50, 100, 70, 40, 60, 80, 20, 90].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full ${i < 6 ? 'bg-mv-green' : 'bg-zinc-200'}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Outcome / Summary */}
              {selectedCall.outcome && (
                <div className="border border-emerald-200/60 rounded-[4px] p-2 bg-emerald-50/40 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-mv-green" />
                    <span>Résultat IA</span>
                  </div>
                  <p className="text-zinc-600">{selectedCall.outcome}</p>
                </div>
              )}

              {/* Transcript */}
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
