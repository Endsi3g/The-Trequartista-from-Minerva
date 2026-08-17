'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight,
  Settings,
  PhoneIncoming,
  PhoneOutgoing,
  Mic,
  MicOff,
  Volume2,
  Radio,
  X,
  Save,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchVoiceCalls } from '@/lib/services/supabase-data';
import type { VoiceCall } from '@/lib/types';

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

const RANGE_OPTIONS = [
  { key: 7, label: '7 derniers jours' },
  { key: 30, label: '30 derniers jours' },
  { key: 90, label: '90 derniers jours' },
] as const;

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-mv-surface border border-mv-border rounded-xl px-3.5 py-2.5 shadow-mv-md text-xs">
      <p className="font-bold text-mv-ink mb-1">{label}</p>
      <p className="text-mv-ink-soft">
        <span className="font-bold text-mv-green">{payload[0].value}</span> appel{payload[0].value > 1 ? 's' : ''}
      </p>
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab() {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(7);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setCalls(await fetchVoiceCalls());
      setLoading(false);
    })();
  }, []);

  const filteredCalls = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return calls.filter((c) => new Date(c.created_at).getTime() >= cutoff);
  }, [calls, rangeDays]);

  const totalMinutes = Math.round(filteredCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / 60);
  const resolvedCount = filteredCalls.filter((c) => c.status === 'completed').length;
  const resolutionRate = filteredCalls.length > 0 ? Math.round((resolvedCount / filteredCalls.length) * 100) : 0;

  const chartData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
      const count = filteredCalls.filter((c) => c.created_at.split('T')[0] === dateStr).length;
      days.push({ label, count });
    }
    return days;
  }, [filteredCalls, rangeDays]);

  const hasAnyCalls = calls.length > 0;

  return (
    <div className="space-y-5">
      {/* ── Real date-range filter ── */}
      <div className="flex items-center justify-end gap-2.5">
        <div className="relative">
          <button
            onClick={() => setRangeOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-mv-border bg-mv-surface text-xs font-medium text-mv-ink-soft hover:border-mv-ink-faint transition-colors cursor-pointer"
          >
            {RANGE_OPTIONS.find((r) => r.key === rangeDays)?.label}
            <span className="text-mv-ink-faint text-[10px]">▾</span>
          </button>
          {rangeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRangeOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-mv-surface border border-mv-border rounded-xl shadow-mv-lg py-1 z-50">
                {RANGE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => {
                      setRangeDays(r.key);
                      setRangeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-mv-cream-soft transition-colors ${
                      rangeDays === r.key ? 'text-mv-green' : 'text-mv-ink'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 4 Stat Cards -- real data from voice_calls ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-mv-ink-soft">Appels reçus</span>
            <div className="w-7 h-7 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center">
              <Phone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-mv-ink font-mono leading-none tracking-tight">
            {loading ? '…' : filteredCalls.length}
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-mv-ink-soft">Minutes</span>
            <div className="w-7 h-7 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-mv-ink font-mono leading-none tracking-tight">
            {loading ? '…' : totalMinutes}
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-mv-ink-soft">Résolus</span>
            <div className="w-7 h-7 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-mv-ink font-mono leading-none tracking-tight">
            {loading ? '…' : resolvedCount}
          </div>
        </div>

        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-mv-ink-soft">Taux de résolution</span>
            <div className="w-7 h-7 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-mv-ink font-mono leading-none tracking-tight">
            {loading ? '…' : `${resolutionRate}%`}
          </div>
        </div>
      </div>

      {/* ── Call Volume Chart -- real data, honest empty state ── */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-mv-ink">Volume d&apos;appels</h2>

        {loading ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : !hasAnyCalls ? (
          <div className="h-[220px] flex flex-col items-center justify-center gap-2 text-center">
            <Phone className="w-6 h-6 text-mv-ink-faint" />
            <p className="text-xs text-mv-ink-soft">Aucun appel enregistré pour le moment.</p>
            <p className="text-[11px] text-mv-ink-faint max-w-xs">
              Les appels traités par l&apos;agent vocal apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#8a8d8b', fontFamily: 'var(--font-mono)' }}
                  axisLine={{ stroke: '#e5e5e0' }}
                  tickLine={false}
                  interval={rangeDays > 14 ? Math.floor(rangeDays / 10) : 0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#8a8d8b', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#059669" strokeWidth={2} fill="#059669" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Recent Calls -- real data ── */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 space-y-1">
        <h2 className="text-sm font-bold text-mv-ink pb-4">Appels récents</h2>

        {loading ? (
          <p className="text-xs text-mv-ink-soft text-center py-8">Chargement…</p>
        ) : filteredCalls.length === 0 ? (
          <p className="text-xs text-mv-ink-soft text-center py-8">Aucun appel dans cette période.</p>
        ) : (
          <div className="divide-y divide-mv-border-soft">
            {filteredCalls.slice(0, 10).map((call) => (
              <button
                key={call.id}
                onClick={() => setSelectedCall(call)}
                disabled={!call.transcript}
                className="w-full py-3 flex items-center gap-4 hover:bg-mv-cream-soft -mx-3 px-3 rounded-xl transition-colors text-left group cursor-pointer disabled:cursor-default"
              >
                <div className="w-8 h-8 rounded-lg bg-mv-cream-soft border border-mv-border flex items-center justify-center shrink-0 text-mv-ink-soft">
                  {call.direction === 'outbound' ? <PhoneOutgoing className="w-3.5 h-3.5" /> : <PhoneIncoming className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-mv-ink">{call.caller_name || call.caller_phone || 'Appelant inconnu'}</div>
                  <div className="text-[11px] text-mv-ink-faint truncate">{call.outcome || (call.status === 'completed' ? 'Résolu' : call.status === 'failed' ? 'Échec' : 'Abandonné')}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="flex items-center gap-1 text-[11px] text-mv-ink-soft font-mono">
                    <Clock className="w-3 h-3 text-mv-ink-faint" />
                    {formatDuration(call.duration_seconds)}
                  </div>
                  <div className="text-[11px] text-mv-ink-faint hidden sm:block w-20 text-right">{relativeTime(call.created_at)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Transcript Modal ── */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 bg-mv-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="bg-mv-surface rounded-3xl shadow-mv-lg w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-mv-border-soft">
              <div>
                <div className="text-sm font-bold text-mv-ink">{selectedCall.caller_name || selectedCall.caller_phone || 'Appelant inconnu'}</div>
                <div className="text-[11px] text-mv-ink-faint">{formatDuration(selectedCall.duration_seconds)} · {relativeTime(selectedCall.created_at)}</div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="w-7 h-7 rounded-full bg-mv-cream-soft hover:bg-mv-border flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-mv-ink-soft" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {(selectedCall.transcript || []).map((line, i) => {
                const isAgent = (line.sender || line.source) === 'ai' || (line.sender || line.source) === 'agent';
                const text = line.message || line.text || '';
                return (
                  <div key={i} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isAgent ? 'bg-mv-cream-soft text-mv-ink' : 'bg-mv-green text-white'
                    }`}>
                      {text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Configuration Tab (uses ElevenLabs hooks) ─── */
function ConfigTab() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [agentName, setAgentName] = useState('Minerva Call Qualifier');
  const [systemPrompt, setSystemPrompt] = useState(
    "Tu es l'agent vocal IA de Minerva. Accueille chaleureusement l'appelant, comprends son besoin (audit IA, génération de leads ou création de contenu), et planifie un appel stratégique de 20 minutes avec un conseiller."
  );
  const [transcript, setTranscript] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([]);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      toastInfo('Agent connecté', 'Conversation en direct active.');
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    },
    onDisconnect: () => {
      toastSuccess('Appel terminé', `Durée : ${formatTime(callSeconds)}`);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onError: (msg: string) => {
      toastError('Erreur ElevenLabs', msg);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onMessage: (payload) => {
      setTranscript((prev) => [
        ...prev,
        { sender: payload.source === 'ai' ? 'ai' : 'user', text: payload.message },
      ]);
    },
  });

  const isConnected = conversation.status === 'connected';

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const startCall = useCallback(async () => {
    setTranscript([]);
    setCallSeconds(0);
    try {
      const res = await fetch('/api/elevenlabs/token');
      const data = await res.json();
      if (!res.ok || !data.token) { toastError('ElevenLabs', data.error || 'Token indisponible'); return; }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({ conversationToken: data.token });
    } catch (err: unknown) {
      toastError('Microphone', err instanceof Error ? err.message : 'Permission refusée');
    }
  }, [conversation, toastError]);

  const endCall = useCallback(() => {
    conversation.endSession();
    if (timerRef.current) clearInterval(timerRef.current);
  }, [conversation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
      {/* Left: Settings */}
      <div className="space-y-5">
        <Card className="space-y-4">
          <h2 className="text-xs font-bold text-mv-ink-faint uppercase tracking-widest">Identité de l&apos;agent</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-mv-ink">Nom de l&apos;agent</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-mv-border rounded-xl text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-mv-ink-faint uppercase tracking-widest">Voix ElevenLabs</h2>
            <span className="text-[10px] font-semibold text-mv-ink-faint bg-mv-cream-soft px-2 py-0.5 rounded-full">HD · temps réel</span>
          </div>
          <div className="space-y-1.5">
            {VOICES.map((v) => {
              const sel = selectedVoice === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    sel ? 'border-mv-green bg-mv-green-tint' : 'border-mv-border bg-mv-surface hover:border-mv-ink-faint'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    sel ? 'bg-mv-green text-white' : 'bg-mv-cream-soft text-mv-ink-soft'
                  }`}>
                    {v.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-mv-ink">{v.name}</div>
                    <div className="text-[10px] text-mv-ink-faint">{v.gender} · {v.accent}</div>
                  </div>
                  {sel && <div className="w-1.5 h-1.5 rounded-full bg-mv-green shrink-0" />}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-xs font-bold text-mv-ink-faint uppercase tracking-widest">Prompt système</h2>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            className="w-full p-3.5 border border-mv-border rounded-xl text-xs leading-relaxed text-mv-ink focus:outline-none focus:border-mv-green resize-none transition-colors"
          />
          <button
            onClick={() => toastSuccess('Enregistré', "Configuration de l'agent mise à jour.")}
            className="flex items-center gap-2 px-4 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer la configuration
          </button>
        </Card>
      </div>

      {/* Right: Live Simulator */}
      <div className="space-y-5">
        <div className="bg-mv-green-darker rounded-2xl p-5 shadow-mv-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isConnected ? 'text-mv-red' : 'text-white/40'}`} />
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                {isConnected ? 'Appel en direct' : 'Simulateur'}
              </span>
            </div>
            {isConnected && <span className="text-xs font-mono text-mv-red">● {formatTime(callSeconds)}</span>}
          </div>

          <div className="h-20 bg-black/20 rounded-xl border border-white/10 flex items-center justify-center px-4">
            {isConnected ? (
              <div className="flex items-end gap-0.5 h-12 w-full">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm animate-pulse ${conversation.isSpeaking ? 'bg-white' : 'bg-white/30'}`}
                    style={{
                      height: `${Math.max(12, Math.abs(Math.sin(i * 0.6)) * 100)}%`,
                      animationDuration: `${0.3 + (i % 5) * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-white/40">
                <Volume2 className="w-5 h-5 mx-auto opacity-60 mb-1" />
                <p className="text-[11px]">Démarrez un appel pour tester en direct</p>
              </div>
            )}
          </div>

          <div className="bg-black/20 border border-white/10 rounded-xl p-3.5 min-h-[100px] max-h-[180px] overflow-y-auto space-y-2.5">
            {transcript.length === 0 ? (
              <p className="text-white/40 text-[11px] text-center py-3">Aucune transcription pour le moment.</p>
            ) : (
              transcript.map((t, i) => (
                <div key={i} className={`flex flex-col ${t.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                  <span className="text-[9px] text-white/50 mb-0.5">{t.sender === 'ai' ? agentName : 'Vous'}</span>
                  <div className={`px-3 py-2 rounded-xl text-[11px] max-w-[85%] ${t.sender === 'ai' ? 'bg-white/10 text-white' : 'bg-white/25 text-white'}`}>
                    {t.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            {isConnected && (
              <button
                onClick={() => conversation.setMuted(!conversation.isMuted)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  conversation.isMuted ? 'bg-mv-red/20 border-mv-red/40 text-mv-red' : 'bg-white/10 border-white/20 text-white hover:border-white/40'
                }`}
              >
                {conversation.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {conversation.isMuted ? 'Micro coupé — cliquez pour réactiver' : 'Micro actif — cliquez pour couper'}
              </button>
            )}
            <button
              onClick={isConnected ? endCall : startCall}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isConnected ? 'bg-mv-red hover:bg-mv-red/90 text-white' : 'bg-white hover:bg-mv-cream text-mv-green-darker'
              }`}
            >
              {isConnected ? "Terminer l'appel test" : 'Démarrer un appel test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page shell ─── */
export default function VoiceAgentPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'configuration'>('dashboard');

  return (
    <ConversationProvider>
      <PageFadeIn className="space-y-5 max-w-[1400px] mx-auto pb-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Agent Vocal IA
          </h1>
          <div className="flex items-center bg-mv-cream-soft rounded-xl p-1 gap-0.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('configuration')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'configuration' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Settings className="w-3 h-3" />
              Configuration
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' ? <DashboardTab /> : <ConfigTab />}
      </PageFadeIn>
    </ConversationProvider>
  );
}
