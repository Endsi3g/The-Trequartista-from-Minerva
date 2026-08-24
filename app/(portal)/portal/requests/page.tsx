'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Utensils,
  Layers,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Radio,
  Sliders,
  TrendingUp,
  Flame,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useFeatureRequests } from '@/hooks/use-feature-requests';
import { MinervaFlowResultsCard } from '@/components/portal/MinervaFlowResultsCard';
import { FeatureRequestForm } from '@/components/portal/FeatureRequestForm';
import { FeatureRequestStatusCard } from '@/components/portal/FeatureRequestStatusCard';
import { FeatureRequestHistory } from '@/components/portal/FeatureRequestHistory';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

type SectionTab = 'all' | 'results' | 'status' | 'form' | 'history';

export default function PortalRequestsPage() {
  const [clientId, setClientId] = useState<string>('default');
  const [clientName, setClientName] = useState<string>('Toitures Beauchemin');
  const { id: userId, fullName, email } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<SectionTab>('all');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.client_id) {
        setClientId(profile.client_id);
        const { data: c } = await supabase
          .from('clients')
          .select('name')
          .eq('id', profile.client_id)
          .maybeSingle();
        if (c?.name) setClientName(c.name);
      }
    })();
  }, []);

  const {
    requests,
    loading,
    isRealtimeConnected,
    submitRequest,
    updateStatus,
  } = useFeatureRequests(clientId);

  return (
    <PageFadeIn className="space-y-6 pb-16">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight font-display">
              Résultats & Demandes de Fonctionnalités
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Minerva-Flow & Supabase Realtime
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            Consultez les résultats de vos commandes en direct, soumettez de nouveaux besoins et suivez l&apos;avancement en temps réel.
          </p>
        </div>

        {/* Quick action button to switch to form tab */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle demande</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Section Switcher Navigation ── */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/80 overflow-x-auto no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer',
            activeTab === 'all'
              ? 'bg-white text-zinc-900 shadow-2xs font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          🌟 Vue d&apos;ensemble complète
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'results'
              ? 'bg-white text-zinc-900 shadow-2xs font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mes résultats (Minerva-Flow)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'status'
              ? 'bg-white text-zinc-900 shadow-2xs font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Statut en direct ({requests.filter((r) => r.status !== 'declined').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'form'
              ? 'bg-white text-zinc-900 shadow-2xs font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>Demander une fonctionnalité</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'history'
              ? 'bg-white text-zinc-900 shadow-2xs font-bold'
              : 'text-zinc-500 hover:text-zinc-900'
          )}
        >
          <Layers className="w-3.5 h-3.5 text-zinc-600" />
          <span>Historique filtrable ({requests.length})</span>
        </button>
      </div>

      {/* ── 3. Rendered Content Sections ── */}

      {/* Section 1: Mes résultats Minerva-Flow */}
      {(activeTab === 'all' || activeTab === 'results') && (
        <section className="space-y-3">
          <MinervaFlowResultsCard clientId={clientId} />
        </section>
      )}

      {/* Section 2: Statut de mes demandes */}
      {(activeTab === 'all' || activeTab === 'status') && (
        <section className="space-y-3">
          <FeatureRequestStatusCard
            requests={requests}
            isRealtimeConnected={isRealtimeConnected}
            onStatusChange={(id, nextStatus) => updateStatus(id, nextStatus)}
          />
        </section>
      )}

      {/* Section 3: Demander une fonctionnalité */}
      {(activeTab === 'all' || activeTab === 'form') && (
        <section className="space-y-3">
          <FeatureRequestForm
            clientId={clientId}
            clientName={clientName}
            authorName={fullName || email || 'Client'}
            onSubmit={submitRequest}
            onSuccess={() => setActiveTab('status')}
          />
        </section>
      )}

      {/* Section 4: Historique des demandes avec filtres */}
      {(activeTab === 'all' || activeTab === 'history') && (
        <section className="space-y-3">
          <FeatureRequestHistory
            requests={requests}
            onStatusChange={(id, nextStatus) => updateStatus(id, nextStatus)}
          />
        </section>
      )}
    </PageFadeIn>
  );
}
