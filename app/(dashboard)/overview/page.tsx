'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone,
  Clock,
  DollarSign,
  CheckCircle2,
  Calendar,
  Users,
  ArrowRight,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { PageFadeIn } from '@/components/ui/page-transition';
import { fetchClients, fetchLeads } from '@/lib/services/supabase-data';
import type { Client, Lead } from '@/lib/types';

interface CallItem {
  id: string;
  caller: string;
  phone: string;
  topic: string;
  duration: string;
  timeAgo: string;
  type: 'inbound' | 'outbound';
  status: 'resolved' | 'hungup' | 'in_progress';
  transcript: Array<{ sender: 'ai' | 'user'; text: string; time: string }>;
}

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

const SAMPLE_CALLS: CallItem[] = [
  {
    id: 'call-1',
    caller: 'Martin Tremblay',
    phone: '+1 (514) 555-0182',
    topic: 'Prise de rendez-vous audit IA & qualification',
    duration: '1:25',
    timeAgo: 'il y a 3 heures',
    type: 'inbound',
    status: 'resolved',
    transcript: [
      { sender: 'ai', text: "Bonjour, vous êtes bien chez Minerva. Comment puis-je vous aider aujourd'hui ?", time: '0:00' },
      { sender: 'user', text: "Bonjour, je voudrais en savoir plus sur votre service d'audit IA.", time: '0:06' },
      { sender: 'ai', text: "Très bien ! Notre audit IA analyse l'ensemble de votre processus d'acquisition pour identifier les opportunités d'automatisation. Puis-je avoir votre prénom ?", time: '0:12' },
      { sender: 'user', text: "Je suis Martin, Martin Tremblay.", time: '0:24' },
      { sender: 'ai', text: "Merci Martin. Je vous propose un appel stratégique de 20 minutes avec notre équipe. Êtes-vous disponible cette semaine ?", time: '0:30' },
      { sender: 'user', text: "Oui, jeudi en fin d'après-midi si possible.", time: '0:42' },
      { sender: 'ai', text: "Parfait, je réserve le jeudi 17h pour vous. Vous recevrez une confirmation par email. Merci pour votre appel Martin !", time: '0:52' },
    ],
  },
  {
    id: 'call-2',
    caller: 'Prospect Immobilier',
    phone: '+1 (450) 555-0247',
    topic: "Renseignement sur l'offre CRM & suivi leads",
    duration: '1:12',
    timeAgo: 'il y a 4 heures',
    type: 'inbound',
    status: 'resolved',
    transcript: [
      { sender: 'ai', text: "Bonjour, Minerva à votre service. Que puis-je faire pour vous ?", time: '0:00' },
      { sender: 'user', text: "J'ai un bureau immobilier et je cherche à mieux gérer mes leads entrants.", time: '0:08' },
      { sender: 'ai', text: "Excellent ! Nous avons une solution sur mesure pour les agences immobilières. Combien de leads recevez-vous par mois environ ?", time: '0:18' },
      { sender: 'user', text: "Entre 40 et 60 par mois.", time: '0:32' },
      { sender: 'ai', text: "Avec notre système, vous pourriez automatiser 80% de la qualification. Je vous propose un démo gratuit de 30 minutes. Ça vous intéresse ?", time: '0:38' },
      { sender: 'user', text: "Oui, absolument.", time: '0:56' },
    ],
  },
  {
    id: 'call-3',
    caller: 'Groupe Apex Montréal',
    phone: '+1 (514) 555-0391',
    topic: 'Confirmation créneau stratégie de croissance',
    duration: '2:20',
    timeAgo: 'il y a 5 heures',
    type: 'outbound',
    status: 'resolved',
    transcript: [
      { sender: 'ai', text: "Bonjour, j'appelle de la part de Minerva pour confirmer votre rendez-vous de demain à 14h.", time: '0:00' },
      { sender: 'user', text: "Oui, c'est confirmé. Merci de rappeler.", time: '0:12' },
      { sender: 'ai', text: "Parfait. Notre conseiller vous enverra le lien de la réunion dans quelques instants. À demain !", time: '0:20' },
    ],
  },
  {
    id: 'call-4',
    caller: 'Numéro inconnu',
    phone: '+1 (819) 555-0164',
    topic: "Message d'accueil & redirection",
    duration: '0:33',
    timeAgo: 'il y a 7 heures',
    type: 'inbound',
    status: 'hungup',
    transcript: [
      { sender: 'ai', text: "Bonjour, vous avez joint Minerva. Comment puis-je vous aider ?", time: '0:00' },
      { sender: 'user', text: "...", time: '0:08' },
      { sender: 'ai', text: "Je suis là pour vous aider. N'hésitez pas à parler.", time: '0:15' },
    ],
  },
];

export default function OverviewPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState('Last 7 Days');
  const [selectedAgent] = useState('All 2 Agents');

  // Selected call for transcript modal
  const [selectedCall, setSelectedCall] = useState<CallItem | null>(null);

  const recentCalls: CallItem[] = SAMPLE_CALLS.map((call, i) => ({
    ...call,
    caller: i === 0 ? (leads[0]?.contact_name || call.caller) : i === 2 ? (clients[0]?.name || call.caller) : call.caller,
  }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cData, lData] = await Promise.all([fetchClients(), fetchLeads()]);
        setClients(cData);
        setLeads(lData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <PageFadeIn className="space-y-6 max-w-[1400px] mx-auto pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Vue d&apos;ensemble
        </h1>

        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 transition-colors shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
            <span>{dateRange}</span>
            <span className="text-neutral-400">▾</span>
          </button>
          <button className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:border-neutral-300 transition-colors shadow-sm">
            <Users className="w-3.5 h-3.5 text-neutral-500" />
            <span>{selectedAgent}</span>
            <span className="text-neutral-400">▾</span>
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Calls Answered', value: loading ? '…' : '270', icon: Phone, link: '/voice-agent', linkText: 'View call history' },
          { label: 'Minutes', value: loading ? '…' : '562', icon: Clock, link: '/voice-agent', linkText: 'View analytics' },
          { label: 'Cost Saved', value: '$120', icon: DollarSign, link: '/settings/billing', linkText: 'View billing' },
          { label: 'Resolved', value: loading ? '…' : '127', icon: CheckCircle2, link: '/voice-agent', linkText: 'Edit outcomes' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-neutral-500">{card.label}</span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 tabular-nums">
                    {card.value}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-500">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <Link href={card.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors pt-2 border-t border-neutral-100">
                <span>{card.linkText}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* ── Call Volume Chart ── */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-neutral-900">Call Volume</h2>
          <Link href="/voice-agent" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors">
            View Analytics <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={CALL_VOLUME_DATA} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={{ stroke: '#f5f5f5' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e5e5e5', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              formatter={(value, name) => [String(value), name === 'inbound' ? 'Inbound' : 'Outbound'] as [string, string]}
                labelStyle={{ fontWeight: 700, color: '#171717', marginBottom: 4 }}
              />
              <Bar dataKey="total" barSize={10} fill="#f5f5f5" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="inbound" stroke="#171717" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#171717' }} />
              <Line type="monotone" dataKey="outbound" stroke="#d4d4d4" strokeWidth={2} dot={false} activeDot={{ r: 3, fill: '#d4d4d4' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 pt-1 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 rounded-full bg-neutral-900 inline-block" />
            Inbound
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 rounded-full bg-neutral-300 inline-block" />
            Outbound
          </div>
        </div>
      </div>

      {/* ── Recent Calls — clickable for transcript ── */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-neutral-900">Appels Récents</h2>
          <Link href="/voice-agent" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors">
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-neutral-100">
          {recentCalls.map((call) => (
            <button
              key={call.id}
              onClick={() => setSelectedCall(call)}
              className="w-full py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50 -mx-3 px-3 rounded-xl transition-colors text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  call.type === 'inbound'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}>
                  {call.type === 'inbound'
                    ? <PhoneIncoming className="w-4 h-4" />
                    : <PhoneOutgoing className="w-4 h-4" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 truncate">{call.caller}</div>
                  <div className="text-xs text-neutral-500 truncate">{call.topic}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  {call.duration}
                </div>
                <span className="text-[11px] text-neutral-400 hidden sm:block">{call.timeAgo}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Call Transcript Modal ── */}
      {selectedCall && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedCall(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedCall.type === 'inbound' ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-700'
                }`}>
                  {selectedCall.type === 'inbound' ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-900 truncate">{selectedCall.caller}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{selectedCall.phone} · {selectedCall.duration} · {selectedCall.timeAgo}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors cursor-pointer ml-2 shrink-0"
              >
                <X className="w-3.5 h-3.5 text-neutral-600" />
              </button>
            </div>

            {/* Transcript Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-4">
                Transcription complète — {selectedCall.duration}
              </div>
              {selectedCall.transcript.map((line, i) => (
                <div key={i} className={`flex flex-col ${line.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold text-neutral-400">
                      {line.sender === 'ai' ? '🤖 Agent Minerva' : '👤 Prospect'} · {line.time}
                    </span>
                  </div>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    line.sender === 'ai'
                      ? 'bg-neutral-100 text-neutral-800 rounded-tl-sm'
                      : 'bg-neutral-900 text-white rounded-tr-sm'
                  }`}>
                    {line.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                  selectedCall.status === 'resolved'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                }`}>
                  {selectedCall.status === 'resolved' ? '✓ Résolu' : 'Terminé'}
                </span>
                <Link
                  href="/voice-agent"
                  className="flex items-center gap-1 font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                  onClick={() => setSelectedCall(null)}
                >
                  Voir dans Voice Agent <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
