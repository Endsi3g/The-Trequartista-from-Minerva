'use client';

import React, { useEffect, useState } from 'react';
import { Search, Star, PhoneCall, Target, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { AreaChart } from '@/components/charts/AreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { createClient } from '@/lib/supabase/client';
import { fetchClientRoiMetrics } from '@/lib/services/supabase-data';
import type { ClientRoiMetrics } from '@/lib/types';

// Deeper performance view for the client portal -- reuses the real
// ClientRoiMetrics fields already collected for the internal ROI tracker
// (SEO/GMB, Google Ads) that the portal's main dashboard never surfaced.
export default function PortalPerformancePage() {
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (profile?.client_id) {
        setMetrics(await fetchClientRoiMetrics(profile.client_id));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="py-20 text-center text-xs text-mv-ink-soft">Chargement…</div>;
  }

  if (!metrics) {
    return (
      <Card className="py-16 text-center max-w-lg mx-auto">
        <p className="text-sm font-bold text-mv-ink">Aucune donnée de performance pour le moment.</p>
        <p className="text-xs text-mv-ink-soft mt-1">Votre équipe Minerva mettra ces chiffres à jour au fil de votre campagne.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-mv-ink font-display">Performance détaillée</h1>
        <p className="text-xs text-mv-ink-faint mt-1">
          Le détail complet de vos indicateurs SEO, Google Business et publicité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AreaChart
            title="Tendance des Leads Générés"
            subtitle={`Performance des ${metrics.weekly_leads_trend.length} dernières semaines`}
            data={metrics.weekly_leads_trend.map((value, i) => ({ label: `Sem ${i + 1}`, value }))}
            valueSuffix=" leads"
          />
        </div>

        {metrics.total_invested > 0 && (
          <DonutChart
            title="Répartition du Budget Investi"
            subtitle="Google Ads vs autres canaux ($)"
            data={
              metrics.total_invested > metrics.google_ads_spent
                ? [
                    { label: 'Google Ads', value: metrics.google_ads_spent, color: '#059669' },
                    { label: 'Autres canaux', value: metrics.total_invested - metrics.google_ads_spent, color: '#a8c9b8' },
                  ]
                : [{ label: 'Google Ads', value: metrics.google_ads_spent, color: '#059669' }]
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          header={
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Google Business & SEO</h3>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <span className="text-mv-ink-soft">Mots-clés Top 3 Google :</span>
              <span className="font-extrabold text-mv-ink text-sm">
                {metrics.top_keywords_rank_top3} / {metrics.total_keywords_tracked}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-mv-green fill-mv-green" />
                <span className="text-mv-ink-soft">Avis Google :</span>
              </div>
              <span className="font-extrabold text-mv-ink text-sm">{metrics.gmb_reviews_count} (Note {metrics.gmb_rating}/5)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-mv-green" />
                <span className="text-mv-ink-soft">Appels depuis GMB :</span>
              </div>
              <span className="font-extrabold text-mv-green text-sm">{metrics.gmb_calls_count} appels</span>
            </div>
          </div>
        </Card>

        <Card
          header={
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Campagnes Google Ads</h3>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-mv-ink-soft" />
                <span className="text-mv-ink-soft">Budget dépensé :</span>
              </div>
              <span className="font-extrabold text-mv-ink text-sm">{metrics.google_ads_spent.toLocaleString('fr-CA')} $</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <span className="text-mv-ink-soft">Leads via Ads :</span>
              <span className="font-extrabold text-mv-ink text-sm">{metrics.google_ads_leads}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-cream-soft border border-mv-border">
              <span className="text-mv-ink-soft">Coût par lead moyen :</span>
              <span className="font-extrabold text-mv-ink text-sm">{metrics.cost_per_lead} $</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-mv-green-tint border border-mv-green/30">
              <span className="text-mv-green font-semibold">Retour publicitaire (ROAS) :</span>
              <span className="font-extrabold text-mv-green text-sm">{metrics.google_ads_roas}x</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
