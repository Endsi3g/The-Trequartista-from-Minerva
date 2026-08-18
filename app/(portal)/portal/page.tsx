'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Search,
  Filter,
  Check,
  X,
  Zap,
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

type PeriodKey = '7d' | '30d' | '90d' | 'ytd';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  '90d': '90 derniers jours',
  'ytd': 'Cette année (YTD)',
};

const CHART_DATA_BY_PERIOD: Record<PeriodKey, Array<{ name: string; leads: number; calls: number }>> = {
  '7d': [
    { name: 'Lun', leads: 2, calls: 3 },
    { name: 'Mar', leads: 1, calls: 2 },
    { name: 'Mer', leads: 3, calls: 4 },
    { name: 'Jeu', leads: 2, calls: 3 },
    { name: 'Ven', leads: 4, calls: 5 },
    { name: 'Sam', leads: 1, calls: 1 },
    { name: 'Dim', leads: 1, calls: 1 },
  ],
  '30d': [
    { name: 'S1', leads: 8, calls: 12 },
    { name: 'S2', leads: 11, calls: 15 },
    { name: 'S3', leads: 14, calls: 21 },
    { name: 'S4', leads: 19, calls: 24 },
  ],
  '90d': [
    { name: 'M-2', leads: 32, calls: 48 },
    { name: 'M-1', leads: 39, calls: 58 },
    { name: 'Ce mois', leads: 47, calls: 68 },
  ],
  'ytd': [
    { name: 'Jan', leads: 24, calls: 38 },
    { name: 'Fév', leads: 29, calls: 44 },
    { name: 'Mar', leads: 35, calls: 52 },
    { name: 'Avr', leads: 41, calls: 60 },
    { name: 'Mai', leads: 48, calls: 71 },
    { name: 'Juin', leads: 52, calls: 75 },
    { name: 'Juil', leads: 49, calls: 70 },
    { name: 'Août', leads: 62, calls: 88 },
  ],
};

const DEFAULT_PORTAL_LEADS = [
  { id: '1', name: 'Marc Tremblay', time: 'Aujourd’hui 14:15', channel: 'Formulaire Web', status: 'Qualifié', phone: '450-892-1102', dateObj: new Date() },
  { id: '2', name: 'Sophie Roy', time: 'Hier à 11:30', channel: 'Appel GMB', status: 'RDV Planifié', phone: '514-998-3341', dateObj: new Date(Date.now() - 86400000) },
  { id: '3', name: 'Alexandre Gagnon', time: '14 Août 09:45', channel: 'Meta Ads', status: 'Devis Envoyé', phone: '418-670-8890', dateObj: new Date(Date.now() - 86400000 * 3) },
  { id: '4', name: 'Émilie Bouchard', time: '12 Août 16:20', channel: 'Formulaire Web', status: 'Qualifié', phone: '450-432-5567', dateObj: new Date(Date.now() - 86400000 * 5) },
  { id: '5', name: 'Jean-François Morin', time: '8 Août 10:10', channel: 'Appel GMB', status: 'RDV Planifié', phone: '450-331-8902', dateObj: new Date(Date.now() - 86400000 * 9) },
  { id: '6', name: 'Nathalie Lavoie', time: '1er Août 15:40', channel: 'Meta Ads', status: 'Qualifié', phone: '514-772-4419', dateObj: new Date(Date.now() - 86400000 * 16) },
  { id: '7', name: 'Guillaume Côté', time: '22 Juil 11:05', channel: 'Formulaire Web', status: 'Devis Envoyé', phone: '418-550-9921', dateObj: new Date(Date.now() - 86400000 * 26) },
];

export default function PortalOverviewPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Period state & filter menu
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('30d');
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Lead filters & Search state
  const [leadChannelFilter, setLeadChannelFilter] = useState<'all' | 'Formulaire Web' | 'Appel GMB' | 'Meta Ads' | 'RDV Planifié' | 'Qualifié'>('all');
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

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

  // Close period dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  // Period-dependent KPI calculations
  const periodKpis = useMemo(() => {
    switch (selectedPeriod) {
      case '7d':
        return {
          leads: 14,
          leadsChange: '+22.4% vs s-1',
          calls: 19,
          callsSub: 'Note GMB : 4.9 / 5.0',
          pipeline: '18 500 $',
          pipelineSub: 'Multiplicateur ROI : 4.5x',
          conversion: '26.2%',
          conversionSub: '4 contrats signés',
        };
      case '30d':
        return {
          leads: metrics?.leads_sent_30d || 42,
          leadsChange: '+18.5% vs m-1',
          calls: metrics?.gmb_calls_count || 63,
          callsSub: 'Note GMB : 4.8 / 5.0',
          pipeline: `${(metrics?.pipeline_value || 58000).toLocaleString('fr-CA')} $`,
          pipelineSub: `Multiplicateur ROI : ${metrics?.roi_multiplier || 4.2}x`,
          conversion: `${metrics?.conversion_rate_pct || 21.4}%`,
          conversionSub: `${metrics?.sales_completed || 9} contrats signés`,
        };
      case '90d':
        return {
          leads: 118,
          leadsChange: '+29.8% vs trim. précédent',
          calls: 182,
          callsSub: 'Note GMB : 4.8 / 5.0',
          pipeline: '164 000 $',
          pipelineSub: 'Multiplicateur ROI : 4.6x',
          conversion: '22.8%',
          conversionSub: '27 contrats signés',
        };
      case 'ytd':
        return {
          leads: 340,
          leadsChange: '+44.0% depuis janvier',
          calls: 490,
          callsSub: 'Note GMB : 4.8 / 5.0',
          pipeline: '470 000 $',
          pipelineSub: 'Multiplicateur ROI : 4.8x',
          conversion: '23.5%',
          conversionSub: '80 contrats signés',
        };
    }
  }, [selectedPeriod, metrics]);

  // Combined Leads List (Real Leads or Preconfigured)
  const baseLeadsList = useMemo(() => {
    if (leads && leads.length > 0) {
      return leads.map((l) => ({
        id: l.id,
        name: l.contact_name || l.company_name || 'Prospect',
        time: new Date(l.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        channel: l.service_requested || 'Formulaire Web',
        status: l.status === 'Gagné' ? 'Qualifié' : l.status === 'RDV Fixé' ? 'RDV Planifié' : 'Devis Envoyé',
        phone: l.contact_phone || 'Non renseigné',
        dateObj: new Date(l.created_at),
      }));
    }
    return DEFAULT_PORTAL_LEADS;
  }, [leads]);

  // Filtered Leads according to Period, Channel Pill, and Search Query
  const filteredLeads = useMemo(() => {
    const now = Date.now();
    const daysLimit = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    const minTimestamp = now - daysLimit * 86400000;

    return baseLeadsList.filter((item) => {
      // Date filter
      if (item.dateObj.getTime() < minTimestamp) return false;

      // Channel / Status filter
      if (leadChannelFilter !== 'all') {
        if (leadChannelFilter === 'Qualifié' || leadChannelFilter === 'RDV Planifié') {
          if (item.status !== leadChannelFilter) return false;
        } else {
          if (item.channel !== leadChannelFilter) return false;
        }
      }

      // Search Query filter
      if (leadSearchQuery.trim()) {
        const q = leadSearchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesPhone = item.phone.toLowerCase().includes(q);
        const matchesChannel = item.channel.toLowerCase().includes(q);
        const matchesStatus = item.status.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesChannel && !matchesStatus) return false;
      }

      return true;
    });
  }, [baseLeadsList, selectedPeriod, leadChannelFilter, leadSearchQuery]);

  const currentChartData = CHART_DATA_BY_PERIOD[selectedPeriod];

  return (
    <PageFadeIn className="space-y-4 pb-16">
      {/* ── 1. Compact Client Context Header with Interactive Period Filter ── */}
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

        {/* Right Interactive Period Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0 relative" ref={dropdownRef}>
          {/* Segmented Quick Switcher for Desktop */}
          <div className="hidden md:flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-[11px] font-medium">
            {(['7d', '30d', '90d', 'ytd'] as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={cn(
                  'px-2 py-0.5 rounded transition-all cursor-pointer font-mono',
                  selectedPeriod === p
                    ? 'bg-white text-zinc-900 shadow-2xs font-bold text-emerald-700'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
                style={MONO}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Dropdown Button for Mobile / Small Screens */}
          <button
            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-800 hover:bg-zinc-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">{PERIOD_LABELS[selectedPeriod]}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {/* Interactive Dropdown Menu */}
          {periodDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-zinc-200 rounded-md shadow-lg py-1 z-50 text-left">
              <div className="px-3 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                Période d'analyse
              </div>
              {(['7d', '30d', '90d', 'ytd'] as PeriodKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPeriod(p);
                    setPeriodDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-xs text-left flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer',
                    selectedPeriod === p ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-zinc-700'
                  )}
                >
                  <span>{PERIOD_LABELS[p]}</span>
                  {selectedPeriod === p && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Monolith 4-KPIs Connected Ribbon (Reactive to Period Filter) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-y lg:divide-y-0 divide-zinc-100 shadow-sm overflow-hidden">
        {/* KPI 1: Leads Qualifiés */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-600" />
            <span>Leads Qualifiés ({selectedPeriod.toUpperCase()})</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            {periodKpis.leads}
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium" style={MONO}>
            {periodKpis.leadsChange}
          </div>
        </div>

        {/* KPI 2: Appels GMB */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-zinc-600" />
            <span>Appels Générés (GMB)</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            {periodKpis.calls}
          </div>
          <div className="text-[11px] font-mono text-zinc-500" style={MONO}>
            {periodKpis.callsSub}
          </div>
        </div>

        {/* KPI 3: Valeur Pipeline */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
            <span>Valeur Pipeline Estimée</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            {periodKpis.pipeline}
          </div>
          <div className="text-[11px] font-mono text-emerald-600 font-medium" style={MONO}>
            {periodKpis.pipelineSub}
          </div>
        </div>

        {/* KPI 4: Taux de Conversion */}
        <div className="p-3.5 sm:p-4 space-y-1">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Taux de Conversion</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 tracking-tight" style={MONO}>
            {periodKpis.conversion}
          </div>
          <div className="text-[11px] font-mono text-zinc-500" style={MONO}>
            {periodKpis.conversionSub}
          </div>
        </div>
      </div>

      {/* ── 2.5 Live Work & Deliverables Ribbon ── */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-white">Production & Livrables en Cours</span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30 font-semibold" style={MONO}>
                2 livrables à valider
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-400">
              Tâche active : <span className="text-zinc-200 font-medium">Développement du Formulaire Multi-Étapes d’Estimation</span> (par Thomas Renaud)
            </p>
          </div>
        </div>

        <Link
          href="/portal/tasks"
          className="h-7 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
        >
          <span>Voir le tableau en direct</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── 3. Monolith 2-Column Split View ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left Column (2/3): Reactive Chart & Filterable Leads DataTable */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini-Chart Leads (140px Height - Dynamically updated by selected period) */}
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-[13px] font-semibold text-zinc-900">
                  Volume des Leads & Appels — {PERIOD_LABELS[selectedPeriod]}
                </div>
                <div className="text-[11px] text-zinc-400">
                  Données consolidées des formulaires et fiches Google
                </div>
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
                <AreaChart data={currentChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
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
                    name="Leads"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#portalEmeraldGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    name="Appels"
                    stroke="#71717A"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filterable Leads DataTable with Chips & Search */}
          <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden space-y-0">
            {/* Header with Title & Search */}
            <div className="px-4 py-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-semibold text-zinc-900">
                  Derniers Prospects & Demandes Entrantes
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.2 rounded" style={MONO}>
                  {filteredLeads.length} résultat{filteredLeads.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search box */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3 h-3 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
                  <input
                    type="text"
                    value={leadSearchQuery}
                    onChange={(e) => setLeadSearchQuery(e.target.value)}
                    placeholder="Filtrer contact ou tél..."
                    className="w-full h-7 pl-7 pr-6 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                  {leadSearchQuery && (
                    <button
                      onClick={() => setLeadSearchQuery('')}
                      className="absolute right-1.5 top-1.5 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <Link
                  href="/portal/performance"
                  className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-0.5 shrink-0"
                >
                  <span>Détail</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Filter Pills Strip */}
            <div className="px-4 py-2 bg-zinc-50/70 border-b border-zinc-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filtre :
              </span>
              {[
                { id: 'all', label: 'Tous' },
                { id: 'Formulaire Web', label: '🌐 Formulaire' },
                { id: 'Appel GMB', label: '📞 GMB' },
                { id: 'Meta Ads', label: '📣 Meta Ads' },
                { id: 'Qualifié', label: '✓ Qualifiés' },
                { id: 'RDV Planifié', label: '📅 RDV' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setLeadChannelFilter(pill.id as any)}
                  className={cn(
                    'h-6 px-2 text-[11px] rounded transition-all cursor-pointer whitespace-nowrap font-medium',
                    leadChannelFilter === pill.id
                      ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Leads Table */}
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
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-zinc-400 font-mono">
                        Aucun prospect ne correspond à ce filtre pour la période sélectionnée ({PERIOD_LABELS[selectedPeriod]}).
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
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
                                : lead.status === 'RDV Planifié'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            )}
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                lead.status === 'Qualifié' ? 'bg-emerald-500' : lead.status === 'RDV Planifié' ? 'bg-blue-500' : 'bg-zinc-400'
                              )}
                            />
                            <span>{lead.status}</span>
                          </span>
                        </td>
                        <td className="pr-4 pl-2 py-1 text-right font-mono text-[11px] text-zinc-500" style={MONO}>
                          {lead.phone}
                        </td>
                      </tr>
                    ))
                  )}
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
