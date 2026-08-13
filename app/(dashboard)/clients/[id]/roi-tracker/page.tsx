'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { ClientExecutiveReport } from '@/components/reports/ClientExecutiveReport';
import { InviteClientButton } from '@/components/clients/InviteClientButton';

import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  PhoneCall,
  Star,
  Search,
  Printer,
  Film,
} from 'lucide-react';

import { fetchClients, fetchClientRoiMetrics, fetchContentPosts, logAuditEvent } from '@/lib/services/supabase-data';
import { invokeRoiAggregator } from '@/lib/services/edge-functions';
import { Client, ClientRoiMetrics, ContentPost } from '@/lib/types';

export default function RoiTrackerPage() {
  const params = useParams();
  const clientId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [topPosts, setTopPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        // No real metrics for this client yet -- show an honest empty
        // state rather than fabricating a "great performance" dashboard.
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
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Client introuvable.</p>
        <p className="text-xs text-mv-ink-soft">Ce client n'existe pas ou a été retiré.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="bg-mv-surface border border-mv-border rounded-xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={client.logo_url}
              alt={client.name}
              className="w-14 h-14 rounded-xl object-cover border border-mv-border shadow-mv-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display">
                  {client.name}
                </h1>
                <Badge variant="green">● Suivi en direct</Badge>
              </div>
              <p className="text-xs text-mv-ink-soft mt-1">
                Mesure en temps réel du Chiffre d'Affaires & Leads générés par Minerva.
              </p>
            </div>
          </div>

          {/* Time Range Selector & Print Button */}
          <div className="flex items-center gap-2">
            <InviteClientButton clientId={client.id} />
            <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-xs font-semibold">
              {(['7d', '30d', '90d', 'ytd'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md transition-all uppercase cursor-pointer ${
                    timeRange === range
                      ? 'bg-mv-green text-mv-cream shadow-mv-sm font-bold'
                      : 'text-mv-ink-soft hover:text-mv-ink'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrintPdf}
              title="Imprimer / Exporter PDF"
              className="p-2 rounded-lg bg-mv-surface border border-mv-border text-mv-ink-soft hover:text-mv-ink transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {metrics ? (
          <>
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Leads Envoyés (30j)"
                value={metrics.leads_sent_30d}
                change={`+${metrics.leads_change_pct}% vs mois dernier`}
                changeType="positive"
                subtitle="Formulaires & WhatsApp"
                icon={<Users className="w-5 h-5" />}
              />
              <StatCard
                title="Ventes Réalisées"
                value={metrics.sales_completed}
                change={`Taux de ferm. : ${metrics.conversion_rate_pct}%`}
                changeType="positive"
                subtitle="Signées par le client"
                icon={<Target className="w-5 h-5" />}
              />
              <StatCard
                title="Cost Per Lead (CPL)"
                value={`${metrics.cost_per_lead} $`}
                subtitle="Moyenne Meta + Ads"
                icon={<DollarSign className="w-5 h-5" />}
              />
              <StatCard
                title="Valeur Pipeline Générée"
                value={`${metrics.pipeline_value.toLocaleString('fr-CA')} $`}
                change="Revenus bruts client"
                changeType="positive"
                subtitle="Projets signés"
                icon={<TrendingUp className="w-5 h-5" />}
              />
            </div>

            {/* Main Impact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AreaChart
                  title="Tendance des Leads Générés"
                  subtitle={`Performance des ${metrics.weekly_leads_trend.length} dernières semaines`}
                  data={metrics.weekly_leads_trend.map((value, i) => ({
                    label: `Sem ${i + 1}`,
                    value,
                  }))}
                  valueSuffix=" leads"
                />
              </div>

              {metrics.total_invested > 0 && (
                <DonutChart
                  title="Répartition du Budget Investi"
                  subtitle="Google Ads vs Autres Canaux ($)"
                  data={
                    metrics.total_invested > metrics.google_ads_spent
                      ? [
                          { label: 'Google Ads', value: metrics.google_ads_spent, color: '#167f5b' },
                          {
                            label: 'Autres canaux',
                            value: metrics.total_invested - metrics.google_ads_spent,
                            color: '#dfff5f',
                          },
                        ]
                      : [{ label: 'Google Ads', value: metrics.google_ads_spent, color: '#167f5b' }]
                  }
                />
              )}
            </div>

            {/* Sub Grid: GMB & SEO + Google Ads Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-mv-green" />
                    <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                      Module Google Business & SEO
                    </h3>
                  </div>
                }
              >
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <span className="text-mv-ink-soft">Mots-clés Top 3 Google :</span>
                    <span className="font-extrabold text-mv-ink text-sm">
                      {metrics.top_keywords_rank_top3} / {metrics.total_keywords_tracked} positionnés
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-mv-amber fill-mv-amber" />
                      <span className="text-mv-ink-soft">Avis Google Récoltés :</span>
                    </div>
                    <span className="font-extrabold text-mv-ink text-sm">
                      {metrics.gmb_reviews_count} (Note {metrics.gmb_rating}/5.0)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="w-4 h-4 text-mv-green" />
                      <span className="text-mv-ink-soft">Appels depuis Fiche GMB :</span>
                    </div>
                    <span className="font-extrabold text-mv-green text-sm">
                      {metrics.gmb_calls_count} appels directs
                    </span>
                  </div>
                </div>
              </Card>

              <Card
                header={
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-mv-warm" />
                    <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                      Suivi des Campagnes Google Ads
                    </h3>
                  </div>
                }
              >
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <span className="text-mv-ink-soft">Budget Dépensé (30j) :</span>
                    <span className="font-extrabold text-mv-ink text-sm">
                      {metrics.google_ads_spent.toLocaleString('fr-CA')} $
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <span className="text-mv-ink-soft">Leads Qualifiés Ads :</span>
                    <span className="font-extrabold text-mv-warm text-sm">
                      {metrics.google_ads_leads} Clics convertis
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
                    <span className="text-mv-ink-soft">ROI Publicitaire ROAS :</span>
                    <span className="font-extrabold text-mv-green text-sm">
                      {metrics.google_ads_roas}x ROAS
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <div className="py-10 text-center space-y-1">
              <p className="text-sm font-bold text-mv-ink">Aucune donnée de performance disponible.</p>
              <p className="text-xs text-mv-ink-soft">
                Les métriques ROI apparaîtront ici dès qu'elles seront saisies pour ce client.
              </p>
            </div>
          </Card>
        )}

        {/* Top Video Creatives -- pulled from this client's real published content */}
        {topPosts.length > 0 && (
          <Card
            header={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-mv-green" />
                  <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                    Contenus Vidéo les Plus Performants
                  </h3>
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topPosts.map((post) => (
                <div key={post.id} className="space-y-3">
                  <VideoAssetPlayer
                    src={post.video_url!}
                    title={post.title}
                    initialAspectRatio="16:9"
                    showDownloadButton={true}
                  />
                  <div className="flex items-center justify-between text-xs font-semibold px-1">
                    <span className="text-mv-ink-soft">
                      Vues : <strong className="text-mv-green">{(post.metrics_views || 0).toLocaleString('fr-CA')}</strong>
                    </span>
                    <span className="text-mv-ink-soft">
                      J'aime : <strong className="text-mv-warm">{(post.metrics_likes || 0).toLocaleString('fr-CA')}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Storage Files Manager */}
        <StorageBrowser defaultBucket="client-assets" title="Ressources & Actifs (Client Assets)" />

      </div>

      {/* Printable Executive Summary Report for PDF Export */}
      {metrics && <ClientExecutiveReport client={client} metrics={metrics} />}
    </>
  );
}
