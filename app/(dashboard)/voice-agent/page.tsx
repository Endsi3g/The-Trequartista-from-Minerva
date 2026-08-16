'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Phone,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Users,
  ArrowRight,
  Settings,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mic,
  MicOff,
  Volume2,
  Radio,
  X,
  ChevronRight,
  Save,
  Play,
  Pause,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/providers/ToastProvider';

/* ─── Types ─── */
interface CallItem {
  id: string;
  caller: string;
  topic: string;
  duration: string;
  timeAgo: string;
  type: 'inbound' | 'outbound' | 'missed';
  status: 'resolved' | 'hangup' | 'end';
  transcript: Array<{ sender: 'ai' | 'user'; text: string; time: string }>;
}

interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  accent: string;
}

/* ─── Constants ─── */
const CALL_VOLUME_DATA = [
  { day: 'Jan 10', inbound: 1.8, outbound: 0.6, total: 32 },
  { day: 'Jan 11', inbound: 2.1, outbound: 0.8, total: 40 },
  { day: 'Jan 12', inbound: 1.5, outbound: 1.1, total: 35 },
  { day: 'Jan 13', inbound: 2.0, outbound: 0.5, total: 38 },
  { day: 'Jan 14', inbound: 1.2, outbound: 0.9, total: 28 },
  { day: 'Jan 15', inbound: 1.9, outbound: 0.7, total: 36 },
  { day: 'Jan 16', inbound: 2.25, outbound: 1.0, total: 48 },
  { day: 'Jan 17', inbound: 1.4, outbound: 0.8, total: 30 },
  { day: 'Jan 18', inbound: 2.3, outbound: 0.6, total: 42 },
  { day: 'Jan 19', inbound: 1.7, outbound: 1.2, total: 39 },
  { day: 'Jan 20', inbound: 2.4, outbound: 0.9, total: 45 },
  { day: 'Jan 21', inbound: 2.6, outbound: 1.1, total: 50 },
  { day: 'Jan 22', inbound: 2.2, outbound: 0.7, total: 41 },
];

const RECENT_CALLS: CallItem[] = [
  {
    id: 'c1',
    caller: 'Unknown Caller',
    topic: 'Answer business questions',
    duration: '1:35',
    timeAgo: 'about 3 hours ago',
    type: 'inbound',
    status: 'resolved',
    transcript: [
      { sender: 'ai', text: "Hello! Thanks for calling. How can I help you today?", time: '0:00' },
      { sender: 'user', text: "Hi, I have a question about your services.", time: '0:06' },
      { sender: 'ai', text: "Of course! I'd be happy to answer your business questions. What would you like to know?", time: '0:12' },
      { sender: 'user', text: "What's the pricing for your AI agent solution?", time: '0:24' },
      { sender: 'ai', text: "We offer flexible plans starting from $299/month. I'll connect you with a specialist who can provide a custom quote.", time: '0:32' },
    ],
  },
  {
    id: 'c2',
    caller: 'Unknown Caller',
    topic: 'Greeting Hangup',
    duration: '1:12',
    timeAgo: 'about 4 hours ago',
    type: 'inbound',
    status: 'hangup',
    transcript: [
      { sender: 'ai', text: "Hello! Welcome to Minerva. How may I assist you today?", time: '0:00' },
      { sender: 'user', text: "...", time: '0:10' },
      { sender: 'ai', text: "I'm here to help. Please feel free to speak.", time: '0:18' },
    ],
  },
  {
    id: 'c3',
    caller: 'Unknown Caller',
    topic: 'End Call',
    duration: '2:20',
    timeAgo: 'about 5 hours ago',
    type: 'outbound',
    status: 'end',
    transcript: [
      { sender: 'ai', text: "Hello! I'm calling to confirm your appointment tomorrow at 2pm.", time: '0:00' },
      { sender: 'user', text: "Yes, confirmed. Thank you for calling.", time: '0:12' },
      { sender: 'ai', text: "Perfect! We'll see you tomorrow. Have a great day!", time: '0:20' },
    ],
  },
  {
    id: 'c4',
    caller: 'Unknown Caller',
    topic: 'Greeting Hangup',
    duration: '1:33',
    timeAgo: 'about 7 hours ago',
    type: 'inbound',
    status: 'hangup',
    transcript: [
      { sender: 'ai', text: "Hello! Minerva speaking. How can I help you today?", time: '0:00' },
      { sender: 'user', text: "Wrong number, sorry.", time: '0:08' },
      { sender: 'ai', text: "No problem at all! Have a great day.", time: '0:14' },
    ],
  },
];

const VOICES: VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'Female', accent: 'Neutral & Professional' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'Female', accent: 'Dynamic & Commercial' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'Female', accent: 'Soft & Empathetic' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'Male', accent: 'Expert & Confident' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'Male', accent: 'Authority & Trust' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'Male', accent: 'Warm & Direct' },
];

/* ─── Custom Tooltip for Chart ─── */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 shadow-md text-xs">
      <p className="font-bold text-neutral-900 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-neutral-600">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="font-bold text-neutral-900 ml-auto pl-4">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab() {
  const [selectedCall, setSelectedCall] = useState<CallItem | null>(null);
  const [dateRange] = useState('Last 7 Days');
  const [agentFilter] = useState('All 2 Agents');

  const callIcon = (type: CallItem['type']) => {
    if (type === 'outbound') return <PhoneOutgoing className="w-3.5 h-3.5" />;
    if (type === 'missed') return <PhoneMissed className="w-3.5 h-3.5" />;
    return <PhoneIncoming className="w-3.5 h-3.5" />;
  };

  return (
    <div className="space-y-5">
      {/* ── Filters ── */}
      <div className="flex items-center justify-end gap-2.5">
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          {dateRange}
          <span className="text-neutral-400 text-[10px]">▾</span>
        </button>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-300 transition-colors">
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          {agentFilter}
          <span className="text-neutral-400 text-[10px]">▾</span>
        </button>
      </div>

      {/* ── 4 Stat Cards — pixel-perfect matching maquette ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Calls Answered */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-neutral-500">Calls Answered</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-neutral-950 leading-none tracking-tight">
            270
          </div>
          <button className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pt-1 border-t border-neutral-100 w-full">
            View call history <ArrowRight className="w-3 h-3 ml-auto" />
          </button>
        </div>

        {/* 2. Minutes */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-neutral-500">Minutes</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-neutral-950 leading-none tracking-tight">
            562
          </div>
          <button className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pt-1 border-t border-neutral-100 w-full">
            View analytics <ArrowRight className="w-3 h-3 ml-auto" />
          </button>
        </div>

        {/* 3. Cost Saved */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-neutral-500">Cost Saved</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-neutral-950 leading-none tracking-tight">
            $120
          </div>
          <button className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pt-1 border-t border-neutral-100 w-full">
            View billing <ArrowRight className="w-3 h-3 ml-auto" />
          </button>
        </div>

        {/* 4. Resolved */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-neutral-500">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>
          <div className="text-[32px] font-extrabold text-neutral-950 leading-none tracking-tight">
            127
          </div>
          <button className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pt-1 border-t border-neutral-100 w-full">
            Edit outcomes <ArrowRight className="w-3 h-3 ml-auto" />
          </button>
        </div>
      </div>

      {/* ── Call Volume Chart — pixel-perfect matching maquette ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900">Call Volume</h2>
          <button className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
            View Analytics <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={CALL_VOLUME_DATA}
              margin={{ top: 12, right: 4, left: -28, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#a3a3a3', fontFamily: 'Inter, sans-serif' }}
                axisLine={{ stroke: '#f0f0f0' }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#a3a3a3', fontFamily: 'Inter, sans-serif' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 3]}
                ticks={[0, 0.75, 1.5, 2.25, 3]}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Jan 16 reference line like in maquette */}
              <ReferenceLine
                x="Jan 16"
                stroke="#d4d4d4"
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{ value: 'Jan 16', position: 'top', fontSize: 9, fill: '#737373' }}
              />
              {/* Volume bars — very light */}
              <Bar dataKey="total" barSize={8} fill="#f5f5f5" radius={[3, 3, 0, 0]} yAxisId={0} hide />
              {/* Inbound — dark line */}
              <Line
                type="monotone"
                dataKey="inbound"
                stroke="#171717"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#171717', strokeWidth: 0 }}
              />
              {/* Outbound — light line */}
              <Line
                type="monotone"
                dataKey="outbound"
                stroke="#d4d4d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#d4d4d4', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-2 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="block w-5 h-0.5 bg-neutral-900 rounded-full" />
            <span className="text-xs font-medium text-neutral-600">● Inbound</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block w-5 h-0.5 bg-neutral-300 rounded-full" />
            <span className="text-xs font-medium text-neutral-400">● Outbound</span>
          </div>
        </div>
      </div>

      {/* ── Recent Calls — pixel-perfect matching maquette ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-1">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-sm font-bold text-neutral-900">Recent Calls</h2>
          <button className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors">
            View All <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-neutral-100">
          {RECENT_CALLS.map((call) => (
            <button
              key={call.id}
              onClick={() => setSelectedCall(call)}
              className="w-full py-3 flex items-center gap-4 hover:bg-neutral-50 -mx-3 px-3 rounded-xl transition-colors text-left group cursor-pointer"
            >
              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-500">
                {callIcon(call.type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-neutral-800">{call.caller}</div>
                <div className="text-[11px] text-neutral-400 truncate">{call.topic}</div>
              </div>

              {/* Duration & time */}
              <div className="flex items-center gap-4 shrink-0 text-right">
                <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Clock className="w-3 h-3 text-neutral-300" />
                  {call.duration}
                </div>
                <div className="text-[11px] text-neutral-400 hidden sm:block w-28 text-right">{call.timeAgo}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Transcript Modal ── */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-500">
                  {callIcon(selectedCall.type)}
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">{selectedCall.caller}</div>
                  <div className="text-[11px] text-neutral-400">{selectedCall.topic} · {selectedCall.duration} · {selectedCall.timeAgo}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-neutral-600" />
              </button>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">
                Full Transcript
              </p>
              {selectedCall.transcript.map((line, i) => (
                <div key={i} className={`flex flex-col ${line.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-neutral-400 mb-1 font-medium">
                    {line.sender === 'ai' ? '🤖 AI Agent' : '👤 Caller'} · {line.time}
                  </span>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    line.sender === 'ai'
                      ? 'bg-neutral-100 text-neutral-700 rounded-tl-sm'
                      : 'bg-neutral-900 text-white rounded-tr-sm'
                  }`}>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-neutral-100 flex items-center justify-between">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                selectedCall.status === 'resolved'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}>
                {selectedCall.status === 'resolved' ? '✓ Resolved' : selectedCall.status === 'hangup' ? '↩ Hangup' : '✓ End Call'}
              </span>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Configuration Tab (inner, uses ElevenLabs hooks) ─── */
function ConfigTab() {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [agentName, setAgentName] = useState('Minerva Call Qualifier');
  const [systemPrompt, setSystemPrompt] = useState(
    "You are Minerva's AI phone agent. Greet the caller warmly, understand their need (AI audit, lead generation, or content creation), and schedule a 20-minute strategic call with an advisor."
  );
  const [transcript, setTranscript] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([]);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      toastInfo('Agent connected', 'Live conversation active.');
      timerRef.current = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    },
    onDisconnect: () => {
      toastSuccess('Call ended', `Duration: ${formatTime(callSeconds)}`);
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onError: (msg: string) => {
      toastError('ElevenLabs error', msg);
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
      if (!res.ok || !data.token) { toastError('ElevenLabs', data.error || 'Token unavailable'); return; }
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({ conversationToken: data.token });
    } catch (err: unknown) {
      toastError('Microphone', err instanceof Error ? err.message : 'Permission denied');
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
        {/* Agent Identity */}
        <Card className="space-y-4">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Agent Identity</h2>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Agent name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-0.5">Phone line</span>
              <span className="text-xs font-mono font-bold text-neutral-800">+1 (514) 800-MINE</span>
            </div>
            <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50">
              <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-0.5">Latency</span>
              <span className="text-xs font-mono font-bold text-neutral-800">&lt; 450 ms</span>
            </div>
          </div>
        </Card>

        {/* Voice selection */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">ElevenLabs Voice</h2>
            <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">HD · Real-time</span>
          </div>
          <div className="space-y-1.5">
            {VOICES.map((v) => {
              const sel = selectedVoice === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    sel ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    sel ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    {v.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-900">{v.name}</div>
                    <div className="text-[10px] text-neutral-400">{v.gender} · {v.accent}</div>
                  </div>
                  {sel && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* System Prompt */}
        <Card className="space-y-3">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">System Prompt</h2>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={5}
            className="w-full p-3.5 border border-neutral-200 rounded-xl text-xs leading-relaxed text-neutral-800 focus:outline-none focus:border-neutral-900 resize-none transition-colors"
          />
          <p className="text-[10px] text-neutral-400">
            Variables: <code className="bg-neutral-100 px-1 rounded font-mono">{'{{client_name}}'}</code> · <code className="bg-neutral-100 px-1 rounded font-mono">{'{{calendar_link}}'}</code>
          </p>
          <button
            onClick={() => toastSuccess('Saved', 'Agent configuration updated.')}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save configuration
          </button>
        </Card>
      </div>

      {/* Right: Live Simulator */}
      <div className="space-y-5">
        <div className="bg-neutral-950 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className={`w-4 h-4 ${isConnected ? 'text-red-400' : 'text-neutral-500'}`} />
              <span className="text-sm font-bold text-neutral-200 uppercase tracking-wide">
                {isConnected ? 'Live Call' : 'Call Simulator'}
              </span>
            </div>
            {isConnected && (
              <span className="text-xs font-mono text-red-400">● {formatTime(callSeconds)}</span>
            )}
          </div>

          {/* Waveform */}
          <div className="h-20 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center px-4">
            {isConnected ? (
              <div className="flex items-end gap-0.5 h-12 w-full">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm animate-pulse ${conversation.isSpeaking ? 'bg-red-400' : 'bg-neutral-600'}`}
                    style={{
                      height: `${Math.max(12, Math.abs(Math.sin(i * 0.6)) * 100)}%`,
                      animationDuration: `${0.3 + (i % 5) * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-600">
                <Volume2 className="w-5 h-5 mx-auto opacity-40 mb-1" />
                <p className="text-[11px]">Start a call to test in real-time</p>
              </div>
            )}
          </div>

          {/* Transcript stream */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3.5 min-h-[100px] max-h-[180px] overflow-y-auto space-y-2.5">
            {transcript.length === 0 ? (
              <p className="text-neutral-600 text-[11px] text-center py-3">No transcript yet.</p>
            ) : (
              transcript.map((t, i) => (
                <div key={i} className={`flex flex-col ${t.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                  <span className="text-[9px] text-neutral-500 mb-0.5">{t.sender === 'ai' ? `🤖 ${agentName}` : '👤 You'}</span>
                  <div className={`px-3 py-2 rounded-xl text-[11px] max-w-[85%] ${t.sender === 'ai' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-700 text-white'}`}>
                    {t.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Controls */}
          <div className="space-y-2">
            {isConnected && (
              <button
                onClick={() => conversation.setMuted(!conversation.isMuted)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                  conversation.isMuted
                    ? 'bg-red-900/30 border-red-700/40 text-red-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                {conversation.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {conversation.isMuted ? 'Mic Off — Click to unmute' : 'Mic On — Click to mute'}
              </button>
            )}
            <button
              onClick={isConnected ? endCall : startCall}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isConnected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-white hover:bg-neutral-100 text-neutral-900'
              }`}
            >
              {isConnected ? 'End test call' : 'Start voice test'}
            </button>
          </div>

          {isConnected && (
            <div className="text-center text-[10px] text-neutral-600">
              Mode: <span className={`font-semibold ${conversation.mode === 'speaking' ? 'text-red-400' : 'text-neutral-400'}`}>
                {conversation.mode === 'speaking' ? '🔊 Agent speaking…' : '🎙 Listening'}
              </span>
            </div>
          )}
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

        {/* ── Page Header — matches maquette ── */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {/* Tab switcher */}
            <div className="flex items-center bg-neutral-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('configuration')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'configuration'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Settings className="w-3 h-3" />
                Configuration
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'dashboard' ? <DashboardTab /> : <ConfigTab />}

      </PageFadeIn>
    </ConversationProvider>
  );
}
