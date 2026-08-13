'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Eye, Target, Download, Smartphone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { fetchClientRoiMetrics } from '@/lib/services/supabase-data';
import type { Client, ClientRoiMetrics } from '@/lib/types';

function moneyFmt(n: number) {
  return `${Math.round(n).toLocaleString('fr-CA')} $`;
}

export default function PortalOverviewPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<ClientRoiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (profile?.client_id) {
        const { data: clientData } = await supabase.from('clients').select('*').eq('id', profile.client_id).maybeSingle();
        setClient(clientData as Client);
        setMetrics(await fetchClientRoiMetrics(profile.client_id));
      }
      setLoading(false);
    })();

    const handler = () => setInstallable(true);
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (loading) {
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement…</div>;
  }

  if (!client) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-mv-ink-soft">Aucun compte client associé à ce profil.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <p className="text-sm font-semibold text-mv-ink-soft">Bienvenue,</p>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink font-display">{client.name}</h1>
      </div>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-4 h-4 text-mv-green" /> Ce que Minerva fait pour vous en ce moment</h3>}>
        <p className="text-sm text-mv-ink leading-relaxed">
          {client.current_focus || "Rien de spécifique n'a été partagé pour le moment — votre équipe Minerva mettra cette section à jour bientôt."}
        </p>
      </Card>

      {metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">ROI</span>
              <TrendingUp className="w-4 h-4 text-mv-green" />
            </div>
            <div className="text-2xl font-extrabold text-mv-ink font-display">{metrics.roi_multiplier}x</div>
            <div className="text-xs text-mv-ink-faint mt-1">{moneyFmt(metrics.total_generated)} générés</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Leads (30j)</span>
              <Target className="w-4 h-4 text-mv-green" />
            </div>
            <div className="text-2xl font-extrabold text-mv-ink font-display">{metrics.leads_sent_30d}</div>
            <div className="text-xs text-mv-ink-faint mt-1">{metrics.conversion_rate_pct}% conversion</div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider">Visibilité</span>
              <Eye className="w-4 h-4 text-mv-green" />
            </div>
            <div className="text-2xl font-extrabold text-mv-ink font-display">{metrics.gmb_reviews_count}</div>
            <div className="text-xs text-mv-ink-faint mt-1">avis Google · {metrics.gmb_rating}★</div>
          </Card>
        </div>
      ) : (
        <Card className="py-10 text-center">
          <p className="text-sm text-mv-ink-soft">Aucune donnée de performance disponible pour le moment.</p>
        </Card>
      )}

      <Card className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-mv-ink">Installer l'application</div>
            <div className="text-xs text-mv-ink-soft">
              {installable
                ? "Ajoutez ce portail à votre écran d'accueil pour un accès rapide."
                : "Sur mobile : menu du navigateur → « Ajouter à l'écran d'accueil ». Sur ordinateur : icône d'installation dans la barre d'adresse."}
            </div>
          </div>
        </div>
        <Download className="w-4 h-4 text-mv-ink-faint shrink-0" />
      </Card>
    </div>
  );
}
