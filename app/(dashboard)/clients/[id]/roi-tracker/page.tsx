'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Search,
  Star,
  PhoneCall,
  Printer,
  Film,
  Upload,
  FileText,
  Download,
  Trash2,
} from 'lucide-react';

import { PageFadeIn } from '@/components/ui/page-transition';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { ClientExecutiveReport } from '@/components/reports/ClientExecutiveReport';
import { InviteClientButton } from '@/components/clients/InviteClientButton';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { AnimatedNumber } from '@/components/ui/animated-number';

import { fetchClients, fetchClientRoiMetrics, fetchContentPosts, logAuditEvent } from '@/lib/services/supabase-data';
import { invokeRoiAggregator } from '@/lib/services/edge-functions';
import type { Client, ClientRoiMetrics, ContentPost } from '@/lib/types';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function RoiTrackerPage() {
  const params = useParams();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [topPosts, setTopPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeStorageTab, setActiveStorageTab] = useState<'client-assets' | 'team-documents'>('client-assets');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const clients = await fetchClients();
      const targetClient = clients.find((c) => c.id === clientId) || null;

      if (!targetClient) {
        setClient(null);
        setMetrics(null);
        setNotFound(true);
        setLoading(false);
        return;
      }
      setNotFound(false);
      setClient(targetClient);

      const allPosts = await fetchContentPosts();
      const clientPosts = allPosts
        .filter((p) => p.client_id === targetClient.id && p.video_url)
        .sort((a, b) => (b.metrics_views || 0) - (a.metrics_views || 0))
        .slice(0, 2);
      setTopPosts(clientPosts);

      const roiData = await fetchClientRoiMetrics(targetClient.id);

      if (!roiData) {
        setMetrics(null);
        setLoading(false);
        return;
      }

      // Invoke Supabase Edge Function to recalculate aggregations
      const edgeAgg = await invokeRoiAggregator(
        targetClient.id,
        roiData.total_invested,
        roiData.leads_sent_30d,
        roiData.cost_per_lead
      );

      setMetrics({
        ...roiData,
        roi_multiplier: edgeAgg.roiMultiplier || roiData.roi_multiplier,
        total_generated: edgeAgg.totalGenerated || roiData.total_generated,
      });
      setLoading(false);

      await logAuditEvent(
        `Consultation du Dashboard ROI pour client "${targetClient.name}" (${timeRange})`,
        'client_roi_metrics',
        targetClient.id,
        { roiMultiplier: edgeAgg.roiMultiplier }
      );
    }
    loadData();
  }, [clientId, timeRange]);

  const handlePrintPdf = () => {
    logAuditEvent(`Génération du Rapport Exécutif PDF client "${client?.name}"`, 'client_roi_metrics', client?.id);
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto py-6">
        <div className="h-14 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
        <div className="h-16 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
        <div className="h-64 bg-mv-surface border border-mv-border rounded-[6px] animate-pulse" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="p-12 text-center space-y-2 bg-mv-surface border border-mv-border rounded-[6px]">
        <p className="text-sm font-semibold text-mv-ink">Client introuvable.</p>
        <p className="text-xs text-mv-ink-faint">Ce client n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* ── 1. Compact Header Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-[11px] font-semibold text-zinc-900 shrink-0">
            {getInitials(client.name)}
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              {client.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-emerald-50/60 border border-emerald-200/60 text-[10.5px] font-medium text-emerald-800" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green" />
              Live tracking
            </span>
          </div>
        </div>

        {/* Right Controls: Segmented Control & Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            {(['7d', '30d', '90d', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-[4px] uppercase transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
                style={MONO}
              >
                {range}
              </button>
            ))}
          </div>

          <InviteClientButton clientId={client.id} />

          <button
            onClick={handlePrintPdf}
            title="Exporter PDF"
            className="h-7 px-2.5 rounded-[4px] bg-white border border-mv-border text-[11.5px] font-medium text-mv-ink hover:bg-zinc-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {metrics ? (
        <>
          {/* ── 2. Unified 4-KPI Continuous Ribbon ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-mv-border">
              {/* Cell 1: Leads Envoyés */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Leads envoyés
                  </span>
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    <AnimatedNumber value={metrics.leads_sent_30d} />
                  </div>
                  <div className="text-[11px] font-medium text-mv-green truncate ml-2" style={MONO}>
                    +{metrics.leads_change_pct}% ↗
                  </div>
                </div>
              </div>

              {/* Cell 2: Ventes Réalisées */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Ventes réalisées
                  </span>
                  <Target className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    <AnimatedNumber value={metrics.sales_completed} />
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    Taux : {metrics.conversion_rate_pct}%
                  </div>
                </div>
              </div>

              {/* Cell 3: CPL Moyen */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    CPL Moyen
                  </span>
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    {metrics.cost_per_lead.toFixed(2)} $
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    Meta + Ads
                  </div>
                </div>
              </div>

              {/* Cell 4: Valeur Pipeline */}
              <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Valeur Pipeline
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
                    {metrics.pipeline_value.toLocaleString('fr-CA')} $
                  </div>
                  <div className="text-[11px] text-mv-ink-faint truncate ml-2" style={MONO}>
                    Revenu brut
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Charts Grid (Performance Trend & Budget Donut) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <AreaChart
                title="Performance des Leads"
                subtitle={`Tendance des ${metrics.weekly_leads_trend.length} dernières semaines`}
                data={metrics.weekly_leads_trend.map((value, i) => ({
                  label: `Sem ${i + 1}`,
                  value,
                }))}
                valueSuffix=" leads"
              />
            </div>

            {metrics.total_invested > 0 && (
              <div className="h-full">
                <DonutChart
                  title="Répartition du Budget"
                  subtitle="Google Ads vs Autres Canaux ($)"
                  data={
                    metrics.total_invested > metrics.google_ads_spent
                      ? [
                          { label: 'Google Ads', value: metrics.google_ads_spent, color: '#059669' },
                          {
                            label: 'Autres canaux',
                            value: metrics.total_invested - metrics.google_ads_spent,
                            color: '#E4E4E7',
                          },
                        ]
                      : [{ label: 'Google Ads', value: metrics.google_ads_spent, color: '#059669' }]
                  }
                />
              </div>
            )}
          </div>

          {/* ── 4. 2-Column Comparative Table (Google Business & SEO vs Google Ads) ── */}
          <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-mv-border">
              {/* Column 1: Google Business & SEO */}
              <div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
                  <Search className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Module Google Business & SEO
                  </span>
                </div>
                <table className="w-full text-[12.5px] border-collapse">
                  <tbody>
                    <tr className="h-8 border-b border-mv-border/60 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">Mots-clés Top 3 Google</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-ink" style={MONO}>
                        {metrics.top_keywords_rank_top3} / {metrics.total_keywords_tracked}{' '}
                        <span className="text-[10px] text-mv-ink-faint">
                          ({metrics.total_keywords_tracked > 0 ? Math.round((metrics.top_keywords_rank_top3 / metrics.total_keywords_tracked) * 100) : 0}%)
                        </span>
                      </td>
                    </tr>
                    <tr className="h-8 border-b border-mv-border/60 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">Avis Google (Note moyenne)</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-ink flex items-center justify-end gap-1" style={MONO}>
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{metrics.gmb_reviews_count}</span>
                        <span className="text-[10px] text-mv-ink-faint">({metrics.gmb_rating} / 5.0)</span>
                      </td>
                    </tr>
                    <tr className="h-8 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">Appels directs Fiche GMB</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-green" style={MONO}>
                        {metrics.gmb_calls_count} appels
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Column 2: Suivi Campagnes Google Ads */}
              <div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-mv-border bg-black/[0.01]">
                  <Target className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
                    Suivi des Campagnes Google Ads
                  </span>
                </div>
                <table className="w-full text-[12.5px] border-collapse">
                  <tbody>
                    <tr className="h-8 border-b border-mv-border/60 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">Budget Dépensé (30j)</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-ink" style={MONO}>
                        {metrics.google_ads_spent.toLocaleString('fr-CA')} $
                      </td>
                    </tr>
                    <tr className="h-8 border-b border-mv-border/60 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">Leads Qualifiés (Ads)</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-medium text-mv-green" style={MONO}>
                        {metrics.google_ads_leads} clics convertis
                      </td>
                    </tr>
                    <tr className="h-8 hover:bg-black/[0.015] transition-colors">
                      <td className="pl-3.5 pr-2 py-1 text-mv-ink-soft">ROAS Publicitaire</td>
                      <td className="pr-3.5 pl-2 py-1 text-right font-semibold text-mv-green" style={MONO}>
                        {metrics.google_ads_roas}x ROAS
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-8 text-center space-y-1">
          <p className="text-xs font-semibold text-mv-ink">Aucune donnée de performance disponible.</p>
          <p className="text-[11px] text-mv-ink-faint">
            Les métriques ROI apparaîtront ici dès qu'elles seront enregistrées pour ce client.
          </p>
        </div>
      )}

      {/* ── 5. Top Video Creatives (Conditionally rendered if videos exist) ── */}
      {topPosts.length > 0 && (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-mv-border">
            <Film className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">
              Contenus Vidéo les Plus Performants
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topPosts.map((post) => (
              <div key={post.id} className="space-y-2 border border-mv-border rounded-[4px] p-2 bg-black/[0.01]">
                <VideoAssetPlayer
                  src={post.video_url!}
                  title={post.title}
                  initialAspectRatio="16:9"
                  showDownloadButton={true}
                />
                <div className="flex items-center justify-between text-[11.5px] px-1" style={MONO}>
                  <span className="text-mv-ink-soft">
                    Vues : <strong className="text-mv-green">{(post.metrics_views || 0).toLocaleString('fr-CA')}</strong>
                  </span>
                  <span className="text-mv-ink-soft">
                    J'aime : <strong className="text-amber-600">{(post.metrics_likes || 0).toLocaleString('fr-CA')}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Client Assets & Storage Manager ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-mv-border pb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveStorageTab('client-assets')}
              className={`text-[11.5px] font-medium pb-2 -mb-2 transition-colors cursor-pointer ${
                activeStorageTab === 'client-assets'
                  ? 'text-zinc-900 border-b-2 border-mv-green'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Actifs Client
            </button>
            <button
              onClick={() => setActiveStorageTab('team-documents')}
              className={`text-[11.5px] font-medium pb-2 -mb-2 transition-colors cursor-pointer ${
                activeStorageTab === 'team-documents'
                  ? 'text-zinc-900 border-b-2 border-mv-green'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Documents Équipe
            </button>
          </div>
          <span className="text-[10.5px] text-zinc-400 font-mono" style={MONO}>
            Stockage Cloud
          </span>
        </div>

        {/* Compact 44px dashed upload strip */}
        <div className="h-11 border border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 rounded-[4px] flex items-center justify-center gap-2 text-[11.5px] text-zinc-500 transition-colors cursor-pointer">
          <Upload className="w-3.5 h-3.5 text-zinc-400" />
          <span>Glisser des fichiers ou <strong className="font-medium text-mv-green underline">Parcourir</strong> (Max 50 Mo)</span>
        </div>
      </div>

      {/* Printable Executive Summary Report for PDF Export */}
      {metrics && <ClientExecutiveReport client={client} metrics={metrics} />}
    </PageFadeIn>
  );
}
