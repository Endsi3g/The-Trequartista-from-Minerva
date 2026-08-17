'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, PhoneCall, DollarSign, CheckCircle2, Calendar, Send } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { fetchClientRoiMetrics, fetchLeads, fetchClientMessages, sendClientMessage } from '@/lib/services/supabase-data';
import type { Client, ClientRoiMetrics, Lead, ClientMessage } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { UserAvatar } from '@/components/ui/user-avatar';

function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

export default function PortalOverviewPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Messages à l'équipe -- the same real client_messages channel as
  // /portal/questions, not a simulated AI assistant.
  const [clientId, setClientId] = useState('');
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
    if (!userInput.trim() || !clientId || !userId) return;
    setSending(true);
    const ok = await sendClientMessage(clientId, userId, 'client', userInput.trim());
    setSending(false);
    if (ok) {
      setUserInput('');
      setMessages(await fetchClientMessages(clientId));
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-mv-green border-t-transparent animate-spin mx-auto" />
        <p className="text-xs text-mv-ink-soft font-medium">Chargement de votre espace client…</p>
      </div>
    );
  }

  if (!client) {
    return (
      <Card className="py-16 text-center max-w-lg mx-auto">
        <p className="text-sm font-bold text-mv-ink">Aucun compte client actif associé.</p>
        <p className="text-xs text-mv-ink-soft mt-1">Contactez le support Minerva pour finaliser l&apos;affectation de votre espace.</p>
      </Card>
    );
  }

  return (
    <PageFadeIn className="space-y-6 max-w-[1600px] mx-auto pb-16">
      {/* ── Client Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserAvatar src={client.logo_url} name={client.name} size="lg" shape="rounded" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">
                {client.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-mv-green-tint border border-mv-green/30 text-mv-green text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
                Campagne Active
              </span>
            </div>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Portail Partenaire · Suivi de vos performances d&apos;acquisition
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-mv-border bg-mv-surface text-xs font-semibold text-mv-ink-soft shadow-mv-sm shrink-0">
          <Calendar className="w-3.5 h-3.5 text-mv-ink-faint" />
          <span>30 derniers jours</span>
        </div>
      </div>

      {/* ── Main 2-Column Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left Side: KPIs + Flow Chart + Recent Activity */}
        <div className="space-y-6 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Leads Qualifiés */}
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between space-y-4 hover:border-mv-ink-faint transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-mv-ink-soft">Leads Qualifiés (30j)</span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-mv-ink font-mono tabular-nums">
                    {metrics ? metrics.leads_sent_30d : leads.length}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs font-semibold text-mv-ink-soft pt-2 border-t border-mv-border-soft flex items-center justify-between">
                <span>Prospects vérifiés</span>
                {metrics && (
                  <span className={`font-bold font-mono ${metrics.leads_change_pct >= 0 ? 'text-mv-green' : 'text-mv-red'}`}>
                    {metrics.leads_change_pct >= 0 ? '+' : ''}{metrics.leads_change_pct}%
                  </span>
                )}
              </div>
            </div>

            {/* 2. Appels générés via GMB */}
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between space-y-4 hover:border-mv-ink-faint transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-mv-ink-soft">Appels Générés (GMB)</span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-mv-ink font-mono tabular-nums">
                    {metrics ? metrics.gmb_calls_count : '—'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs font-semibold text-mv-ink-soft pt-2 border-t border-mv-border-soft flex items-center justify-between">
                <span>Note Google Business</span>
                {metrics && <span className="text-mv-green font-bold font-mono">{metrics.gmb_rating}/5</span>}
              </div>
            </div>

            {/* 3. Pipeline */}
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between space-y-4 hover:border-mv-ink-faint transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-mv-ink-soft">Valeur Pipeline Estimée</span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-mv-ink font-mono tabular-nums">
                    {metrics ? moneyFmt(metrics.pipeline_value) : '—'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs font-semibold text-mv-ink-soft pt-2 border-t border-mv-border-soft flex items-center justify-between">
                <span>Multiplicateur ROI</span>
                {metrics && <span className="text-mv-green font-bold font-mono">{metrics.roi_multiplier}x</span>}
              </div>
            </div>

            {/* 4. Taux de Conversion */}
            <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between space-y-4 hover:border-mv-ink-faint transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-mv-ink-soft">Taux de Conversion</span>
                  <div className="text-2xl lg:text-3xl font-extrabold text-mv-ink font-mono tabular-nums">
                    {metrics ? `${metrics.conversion_rate_pct}%` : '—'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs font-semibold text-mv-ink-soft pt-2 border-t border-mv-border-soft flex items-center justify-between">
                <span>Ventes réalisées</span>
                {metrics && <span className="text-mv-green font-bold font-mono">{metrics.sales_completed}</span>}
              </div>
            </div>
          </div>

          {/* Flow Chart Card -- real weekly_leads_trend */}
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-mv-ink font-display">Évolution des Leads Qualifiés</h2>
              <p className="text-xs text-mv-ink-soft">Tendance de votre canal d&apos;acquisition, semaine par semaine</p>
            </div>

            {metrics && metrics.weekly_leads_trend?.length > 0 ? (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metrics.weekly_leads_trend.map((v, i) => ({ label: `S-${metrics.weekly_leads_trend.length - 1 - i}`, leads: v }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8a8d8b', fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: '#e5e5e0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8a8d8b', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e5e5e0', fontSize: 12, fontFamily: 'var(--font-mono)' }}
                      formatter={(value) => [value, 'Leads']}
                    />
                    <Area type="monotone" dataKey="leads" stroke="#059669" strokeWidth={2.5} fill="#059669" fillOpacity={0.12} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-mv-ink-soft py-12 text-center">Pas encore assez de données pour afficher une tendance.</p>
            )}
          </div>

          {/* Recent Qualified Leads List */}
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <h2 className="text-base font-extrabold text-mv-ink font-display">Derniers Prospects & Rendez-vous Pris</h2>

            <div className="divide-y divide-mv-border-soft">
              {leads.length === 0 ? (
                <p className="text-xs text-mv-ink-soft py-6 text-center">Aucun nouveau lead pour le moment.</p>
              ) : (
                leads.slice(0, 4).map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-sm font-bold text-mv-ink truncate">
                        {l.contact_name} {l.company_name && `(${l.company_name})`}
                      </div>
                      <div className="text-xs text-mv-ink-soft truncate">
                        {l.contact_email || l.contact_phone || 'Contact direct'} · Statut : <strong>{l.status}</strong>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-mv-green-tint border border-mv-green/30 text-mv-green text-[11px] font-bold shrink-0">
                      Qualifié
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right Column: Messages à l'équipe -- real channel, same one /portal/questions uses ── */}
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between h-[640px] xl:sticky xl:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-mv-border-soft">
            <h3 className="font-extrabold text-sm text-mv-ink font-display">Messages à l&apos;équipe</h3>
            <Link href="/portal/questions" className="text-[10px] font-semibold text-mv-green hover:underline">
              Voir tout
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-none text-xs">
            {messages.length === 0 ? (
              <p className="text-mv-ink-soft text-center py-6">
                Aucun message pour le moment. Écrivez à votre équipe Minerva ci-dessous.
              </p>
            ) : (
              messages.slice(-8).map((m, i, arr) => {
                const showHeader = i === 0 || arr[i - 1].sender_id !== m.sender_id;
                return (
                  <div key={m.id} className={`flex flex-col ${m.sender_role === 'client' ? 'items-end' : 'items-start'}`}>
                    {showHeader && (
                      <span className="text-[10px] font-bold text-mv-ink-faint mb-1 px-1">
                        {m.sender_id === userId ? 'Vous' : m.sender_name}
                      </span>
                    )}
                    <div
                      className={`max-w-[90%] p-3.5 rounded-2xl leading-relaxed ${
                        m.sender_role === 'client'
                          ? 'bg-mv-green text-white rounded-br-xs'
                          : 'bg-mv-cream-soft text-mv-ink rounded-bl-xs'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 border-t border-mv-border-soft">
            <div className="border border-mv-border rounded-2xl p-2.5 bg-mv-cream-soft/60 focus-within:border-mv-green focus-within:bg-mv-surface transition-all flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Écrivez à votre équipe Minerva..."
                disabled={sending}
                className="w-full bg-transparent text-xs text-mv-ink placeholder-mv-ink-mute focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || sending}
                className="w-7 h-7 rounded-full bg-mv-green hover:bg-mv-green-dark text-white flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageFadeIn>
  );
}
