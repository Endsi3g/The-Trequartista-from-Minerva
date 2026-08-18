'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  PhoneCall,
  DollarSign,
  TrendingUp,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import {
  fetchClientRoiMetrics,
  fetchLeads,
  fetchClientMessages,
  sendClientMessage,
} from '@/lib/services/supabase-data';
import type { Client, ClientRoiMetrics, Lead, ClientMessage } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const SAMPLE_WEEKLY_CHART = [
  { name: 'S1', leads: 8, calls: 12 },
  { name: 'S2', leads: 11, calls: 15 },
  { name: 'S3', leads: 14, calls: 21 },
  { name: 'S4', leads: 19, calls: 24 },
];

const DEFAULT_PORTAL_LEADS = [
  { id: '1', name: 'Marc Tremblay', time: 'Aujourd’hui 14:15', channel: 'Formulaire Web', status: 'Qualifié', phone: '450-892-1102' },
  { id: '2', name: 'Sophie Roy', time: 'Hier à 11:30', channel: 'Appel GMB', status: 'RDV Planifié', phone: '514-998-3341' },
  { id: '3', name: 'Alexandre Gagnon', time: '14 Août 09:45', channel: 'Meta Ads', status: 'Devis Envoyé', phone: '418-670-8890' },
  { id: '4', name: 'Émilie Bouchard', time: '12 Août 16:20', channel: 'Formulaire Web', status: 'Qualifié', phone: '450-432-5567' },
];

export default function PortalOverviewPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Direct Team Chat Thread
  const [clientId, setClientId] = useState('');
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase.from('profiles').select('client_id, full_name').eq('id', user.id).maybeSingle();
      if (profile?.client_id) {
        setClientId(profile.client_id);
        const { data: clientData } = await supabase.from('clients').select('*').eq('id', profile.client_id).maybeSingle();
        setClient(clientData as Client);
        const [roi, leadList, msgs] = await Promise.all([
          fetchClientRoiMetrics(profile.client_id),
          fetchLeads(profile.client_id),
          fetchClientMessages(profile.client_id),
        ]);
        setMetrics(roi);
        setLeads(leadList);
        setMessages(msgs);
      }
      setLoading(false);
    })();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || sending) return;
    const body = userInput.trim();
    setUserInput('');
    setSending(true);

    const targetClientId = clientId || client?.id || 'demo-client';
    const targetUserId = userId || 'portal-client';

    const sent = await sendClientMessage(targetClientId, targetUserId, 'client', body);
    if (sent) {
      setMessages((prev) => [...prev, sent]);
    }
    setSending(false);
  };

  return (
    <PageFadeIn className="space-y-4 pb-16">
      {/* ── 1. Compact Client Context Header ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 font-bold text-xs shrink-0">
            TB
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[16px] font-semibold text-zinc-900 tracking-tight truncate">
              {client?.name || 'Toitures Beauchemin'}
            </h1>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Campagne Active</span>
            </span>
          </div>
        </div>

        {/* Right Period Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="h-7 px-2.5 text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>30 derniers jours</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* ── 2. Monolith 4-KPIs Connected Ribbon ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-y lg:divide-y-0 divide-zinc-100 shadow-sm overflow-hidden">
        {/* KPI 1: Leads Qualifiés */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Leads Qualifiés (30j)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            {metrics?.leads_sent_30d || 42}
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium" style={MONO}>
            +18.5% vs m-1
          </div>
        </div>

        {/* KPI 2: Appels GMB */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-zinc-600" />
            <span>Appels Générés (GMB)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            63
          </div>
          <div className="text-[11px] font-mono text-zinc-500" style={MONO}>
            Note GMB : 4.8 / 5.0
          </div>
        </div>

        {/* KPI 3: Valeur Pipeline */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
            <span>Valeur Pipeline Estimée</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            58 000 $
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium" style={MONO}>
            Multiplicateur ROI : 4.2x
          </div>
        </div>

        {/* KPI 4: Taux de Conversion */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Taux de Conversion</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            21.4%
          </div>
          <div className="text-[11px] font-mono text-zinc-500" style={MONO}>
            9 contrats signés
          </div>
        </div>
      </div>

      {/* ── 3. Monolith 2-Column Split View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column (2/3): Mini-Chart & Leads DataTable */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini-Chart Leads Hebdo (140px Height) */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold text-zinc-900">
                Volume des Leads Hebdomadaires
              </div>
              <div className="flex items-center gap-3 text-[10.5px] font-mono text-zinc-400" style={MONO}>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Leads Formulaire
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-zinc-400" /> Appels Entrants
                </span>
              </div>
            </div>

            <div className="h-[140px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SAMPLE_WEEKLY_CHART} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portalEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <YAxis stroke="#A1A1AA" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181B',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#FFF',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#portalEmeraldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Preconfigured Leads DataTable */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div className="text-[13px] font-semibold text-zinc-900">
                Derniers Prospects & Demandes Entrantes
              </div>
              <Link
                href="/portal/performance"
                className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                <span>Voir tout</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-[12px] border-collapse min-w-[580px]">
                <thead>
                  <tr className="h-7 bg-zinc-50 border-b border-zinc-200/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="pl-4 pr-2 text-left font-medium">Nom du contact</th>
                    <th className="px-2 text-left font-medium">Date / Heure</th>
                    <th className="px-2 text-left font-medium">Canal</th>
                    <th className="px-2 text-left font-medium">Statut</th>
                    <th className="pr-4 pl-2 text-right font-medium">Téléphone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {DEFAULT_PORTAL_LEADS.map((lead) => (
                    <tr key={lead.id} className="h-9 hover:bg-zinc-50/80 transition-colors">
                      <td className="pl-4 pr-2 py-1 font-semibold text-zinc-900">
                        {lead.name}
                      </td>
                      <td className="px-2 py-1 font-mono text-[11px] text-zinc-500" style={MONO}>
                        {lead.time}
                      </td>
                      <td className="px-2 py-1 text-zinc-600 text-[11px]">
                        <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-zinc-200/60">
                          {lead.channel}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            lead.status === 'Qualifié'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              lead.status === 'Qualifié' ? 'bg-emerald-500' : 'bg-zinc-400'
                            )}
                          />
                          <span>{lead.status}</span>
                        </span>
                      </td>
                      <td className="pr-4 pl-2 py-1 text-right font-mono text-[11px] text-zinc-500" style={MONO}>
                        {lead.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Direct Team Thread */}
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-3 flex flex-col h-[480px]">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 shrink-0">
            <div>
              <div className="text-[13px] font-semibold text-zinc-900">
                Équipe Dédiée Minerva
              </div>
              <div className="text-[11px] text-zinc-400">
                Temps de réponse moyen : 15 min
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="En ligne" />
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
            {messages.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-700">Aucun message pour l’instant</p>
                <p className="text-[11px]">Posez vos questions ou soumettez une demande à votre chargé de compte.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isClient = msg.sender_role === 'client';
                return (
                  <div
                    key={msg.id}
                    className={cn('flex flex-col', isClient ? 'items-end' : 'items-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                        isClient
                          ? 'bg-zinc-900 text-white rounded-br-none'
                          : 'bg-zinc-100 text-zinc-900 rounded-bl-none'
                      )}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[9.5px] font-mono text-zinc-400 mt-0.5 px-1" style={MONO}>
                      {new Date(msg.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 pt-2 border-t border-zinc-100 shrink-0">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Écrivez à votre équipe..."
              className="flex-1 h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={sending || !userInput.trim()}
              className="h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </PageFadeIn>
  );
}
