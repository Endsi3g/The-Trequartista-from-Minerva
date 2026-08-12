'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatCard } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeatmapScale } from '@/components/charts/HeatmapScale';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { ClientExecutiveReport } from '@/components/reports/ClientExecutiveReport';

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
  ExternalLink,
  Printer,
  CheckCircle,
  Zap,
  Film,
} from 'lucide-react';

import { fetchClients, fetchClientRoiMetrics, logAuditEvent } from '@/lib/services/supabase-data';
import { invokeRoiAggregator } from '@/lib/services/edge-functions';
import { Client, ClientRoiMetrics } from '@/lib/types';

export default function RoiTrackerPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const clientId = rawId || 'client-apex-roofing';

  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const clients = await fetchClients();
      const targetClient = clients.find((c) => c.id === clientId) || clients[0] || {
        id: clientId,
        name: 'Apex Roofing Inc.',
        logo_url: '',
        industry: 'Construction & Toiture',
        status: 'Active',
        mrr: 4500,
        health_status: 'Ready',
        contact_name: 'Guillaume Tremblay',
        contact_email: 'g.tremblay@toitures-apex.ca',
        created_at: new Date().toISOString(),
      };
      const roiData = await fetchClientRoiMetrics(targetClient.id) || {
        id: `roi-${targetClient.id}`,
        client_id: targetClient.id,
        leads_sent_30d: 48,
        leads_change_pct: 18.5,
        sales_completed: 12,
        conversion_rate_pct: 25.0,
        cost_per_lead: 42.5,
        pipeline_value: 85000,
        roi_multiplier: 8.7,
        total_invested: 4500,
        total_generated: 39150,
        top_keywords_rank_top3: 8,
        total_keywords_tracked: 12,
        gmb_reviews_count: 34,
        gmb_rating: 4.9,
        gmb_calls_count: 62,
        google_ads_spent: 2040,
        google_ads_leads: 48,
        google_ads_roas: 4.8,
        weekly_leads_trend: [8, 12, 14, 14],
      };

      // Invoke Supabase Edge Function to recalculate aggregations
      const edgeAgg = await invokeRoiAggregator(
        targetClient.id,
        roiData.total_invested,
        roiData.leads_sent_30d,
        roiData.cost_per_lead
      );

      setClient(targetClient);
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


  if (loading || !client || !metrics) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
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
                <Badge variant="green">● All Systems Live</Badge>
              </div>
              <p className="text-xs text-mv-ink-soft mt-1">
                Mesure en temps réel du Chiffre d'Affaires & Leads générés par Minerva.
              </p>
            </div>
          </div>

          {/* Time Range Selector & Print Button */}
          <div className="flex items-center gap-2">
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

            <Button
              variant="lime"
              size="sm"
              onClick={handlePrintPdf}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Imprimer / Exporter PDF
            </Button>
          </div>
        </div>

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
            change="-4$ d'optimisation"
            changeType="positive"
            subtitle="Moyenne Meta + Ads"
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Valeur Pipeline Générée"
            value={`${metrics.pipeline_value.toLocaleString('fr-CA')} $`}
            change="Revenus bruts client"
            changeType="positive"
            subtitle="Projets Apex signés"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Main Impact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BarChart
              title="Comparatif Hebdomadaire : Budget Investi vs Leads Générés"
              subtitle="Performance des 4 dernières semaines"
              data={[
                { label: 'Sem 1', value: 8, secondaryValue: 1125 },
                { label: 'Sem 2', value: 12, secondaryValue: 1125 },
                { label: 'Sem 3', value: 14, secondaryValue: 1125 },
                { label: 'Sem 4', value: 14, secondaryValue: 1125 },
              ]}
              valuePrefix=""
              valueSuffix=" leads"
            />
          </div>

          <DonutChart
            title="Répartition du Budget Publicitaire par Canal"
            subtitle="Allocation Mensuelle ($)"
            data={[
              { label: 'Google Ads Search', value: 2040, color: '#167f5b' },
              { label: 'Meta Reels & Ads', value: 1460, color: '#dfff5f' },
              { label: 'SEO & Fiche GMB', value: 1000, color: '#ab7d1f' },
            ]}
          />
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

        {/* Top Video Ad Creatives Showcase */}
        <Card
          header={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-mv-green" />
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                  Créatifs Vidéo & Reels Top Performance (Taux de conversion élevé)
                </h3>
              </div>
              <Badge variant="green">Live Ad Assets</Badge>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <VideoAssetPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                title="Reel 60s : Réfection Toiture Commerciale"
                initialAspectRatio="16:9"
                showDownloadButton={true}
              />
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <span className="text-mv-ink-soft">Performance : <strong className="text-mv-green">14 200 Vues</strong></span>
                <span className="text-mv-ink-soft">CPL Vidéo : <strong className="text-mv-warm">24.50 $ / lead</strong></span>
              </div>
            </div>

            <div className="space-y-3">
              <VideoAssetPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                title="Publicité Instagram : Témoignage Client Satisfait"
                initialAspectRatio="16:9"
                showDownloadButton={true}
              />
              <div className="flex items-center justify-between text-xs font-semibold px-1">
                <span className="text-mv-ink-soft">Performance : <strong className="text-mv-green">9 800 Vues</strong></span>
                <span className="text-mv-ink-soft">CPL Vidéo : <strong className="text-mv-warm">28.10 $ / lead</strong></span>
              </div>
            </div>
          </div>
        </Card>

        {/* Storage Files Manager */}
        <StorageBrowser defaultBucket="client-assets" title="Ressources & Actifs (Client Assets)" />

      </div>

      {/* Printable 4-Section Executive Summary Report for PDF Export */}
      <ClientExecutiveReport client={client} metrics={metrics} />
    </>
  );
}
