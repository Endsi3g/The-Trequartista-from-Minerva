'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { HeatmapScale } from '@/components/charts/HeatmapScale';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  PhoneCall,
  Star,
  Search,
  ExternalLink,
  Calendar,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { MOCK_ROI_METRICS, INITIAL_CLIENTS } from '@/lib/mock-data';

export default function RoiTrackerPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const client = INITIAL_CLIENTS[0]; // Apex Roofing
  const metrics = MOCK_ROI_METRICS['client-apex-roofing'];

  return (
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

        {/* Time Range Selector */}
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

          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
            Rapport Client
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

      {/* Main Impact Grid: Weekly Trend & ROI Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Lead Trend SVG Chart (2 cols) */}
        <Card
          className="lg:col-span-2"
          header={
            <div className="flex items-center justify-between w-full">
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Évolution Hebdomadaire des Leads
              </h3>
              <Badge variant="lime">
                <CheckCircle className="w-3 h-3 text-mv-lime" /> +34% Croissance
              </Badge>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Visual SVG Trend Bar Graph */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-mv-border">
              {metrics.weekly_leads_trend.map((val, idx) => {
                const heightPct = (val / 20) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-mono font-bold text-mv-lime opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </span>
                    <div
                      className="w-full bg-mv-green-tint border border-mv-green/40 group-hover:bg-mv-green rounded-t-md transition-all duration-300 relative"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-mv-lime rounded-t-md" />
                    </div>
                    <span className="text-[10px] font-semibold text-mv-ink-soft uppercase">
                      Sem {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-mv-ink-soft">
              <span>Moyenne hebdo : <strong className="text-mv-ink">11.8 leads / semaine</strong></span>
              <span>Source : Automatisations Webhooks & Formulairer Framer</span>
            </div>
          </div>
        </Card>

        {/* Highlight ROI Card (1 col) */}
        <Card className="bg-gradient-to-br from-mv-surface to-mv-green-tint/40 border-mv-green/40 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-mv-lime uppercase tracking-widest">
              RETURN ON INVESTMENT (ROI)
            </span>
            <div className="mt-4">
              <div className="text-5xl font-black text-mv-ink tracking-tight font-display">
                {metrics.roi_multiplier}x <span className="text-2xl font-bold text-mv-green">ROI</span>
              </div>
              <p className="text-xs text-mv-ink-soft mt-2">
                Pour chaque dollar investi dans les services Minerva, le client a généré <strong>{metrics.roi_multiplier} $</strong> de valeur.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-mv-border/60 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-mv-ink-soft">Investi par le client :</span>
              <span className="font-bold text-mv-ink">{metrics.total_invested.toLocaleString('fr-CA')} $</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mv-ink-soft">Valeur générée :</span>
              <span className="font-extrabold text-mv-lime">{metrics.total_generated.toLocaleString('fr-CA')} $</span>
            </div>
            <HeatmapScale level={5} label="Intensité Génération Revenus" />
          </div>
        </Card>
      </div>

      {/* Sub Grid: GMB & SEO + Google Ads Tracking */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Business & SEO Module */}
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

        {/* Google Ads & Campaigns Tracking */}
        <Card
          header={
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-mv-lime" />
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
              <span className="font-extrabold text-mv-lime text-sm">
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
    </div>
  );
}
