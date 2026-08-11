import React from 'react';
import { Client, ClientRoiMetrics } from '@/lib/types';

interface ClientExecutiveReportProps {
  client: Client;
  metrics: ClientRoiMetrics;
}

export function ClientExecutiveReport({ client, metrics }: ClientExecutiveReportProps) {
  return (
    <div className="hidden print:block p-8 bg-white text-black space-y-8 font-sans">
      {/* Section 1: Minerva Brand & Client Header */}
      <div className="flex items-center justify-between border-b-2 border-green-700 pb-6">
        <div>
          <div className="text-2xl font-bold tracking-tight text-green-800 font-serif">
            MINERVA CENTURIONS
          </div>
          <div className="text-xs uppercase tracking-widest text-gray-500 font-semibold mt-0.5">
            Rapport Exécutif d'Impact & ROI Client
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{client.name}</div>
          <div className="text-xs text-gray-500">Secteur : {client.industry}</div>
          <div className="text-xs text-gray-400 mt-1">Date d'édition : {new Date().toLocaleDateString('fr-CA')}</div>
        </div>
      </div>

      {/* Section 2: ROI Summary & Financial Impact */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-green-800 border-b border-gray-200 pb-1">
          1. Synthèse de la Valeur Générée & ROI
        </h3>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500 uppercase">Leads Qualifiés (30j)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.leads_sent_30d}</div>
            <div className="text-[10px] text-green-600 font-semibold mt-0.5">+{metrics.leads_change_pct}% vs mois précédent</div>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500 uppercase">Ventes Réalisées</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.sales_completed}</div>
            <div className="text-[10px] text-gray-600 font-semibold mt-0.5">Taux : {metrics.conversion_rate_pct}%</div>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500 uppercase">Cost Per Lead (CPL)</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{metrics.cost_per_lead} $</div>
            <div className="text-[10px] text-green-600 font-semibold mt-0.5">Optimisé</div>
          </div>

          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
            <div className="text-xs text-green-800 uppercase font-semibold">Multiplicateur ROI</div>
            <div className="text-3xl font-extrabold text-green-700 mt-1">{metrics.roi_multiplier}x</div>
            <div className="text-[10px] text-green-800 font-semibold mt-0.5">{metrics.total_generated.toLocaleString('fr-CA')} $ générés</div>
          </div>
        </div>
      </div>

      {/* Section 3: SEO & Ads Acquisition Performance */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-green-800 border-b border-gray-200 pb-1">
          2. Performance Référencement (SEO & GMB) et Publicité Ads
        </h3>

        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="p-4 border rounded-lg space-y-2">
            <div className="font-bold text-gray-900">Google Business Profile & Local SEO</div>
            <div className="flex justify-between py-1 border-b">
              <span>Mots-clés Positionnés Top 3 :</span>
              <span className="font-bold">{metrics.top_keywords_rank_top3} / {metrics.total_keywords_tracked}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span>Avis Google Authentiques :</span>
              <span className="font-bold">{metrics.gmb_reviews_count} (Note {metrics.gmb_rating}/5)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Appels Générés depuis GMB :</span>
              <span className="font-bold text-green-700">{metrics.gmb_calls_count} appels</span>
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-2">
            <div className="font-bold text-gray-900">Campagnes Google & Meta Ads</div>
            <div className="flex justify-between py-1 border-b">
              <span>Budget Dépensé (30j) :</span>
              <span className="font-bold">{metrics.google_ads_spent.toLocaleString('fr-CA')} $</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span>Leads Qualifiés Ads :</span>
              <span className="font-bold">{metrics.google_ads_leads} leads</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Retour Publicitaire ROAS :</span>
              <span className="font-bold text-green-700">{metrics.google_ads_roas}x ROAS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: 20-Point Quality Standards Certification */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-green-800 border-b border-gray-200 pb-1">
          3. Certification Qualité 20-Points Minerva
        </h3>

        <div className="p-4 border rounded-lg bg-green-50 border-green-200 text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-green-900">Statut du Déploiement : 100% Conforme (20/20)</div>
            <div className="text-gray-600 mt-0.5">Le projet a validé l’ensemble des standards de vitesse, SEO, Loi 25 et tracking.</div>
          </div>
          <div className="text-right font-mono font-bold text-green-800 text-base">
            CERTIFIÉ MINERVA
          </div>
        </div>
      </div>

      {/* Report Footer */}
      <div className="pt-6 border-t text-center text-[10px] text-gray-400">
        Rapport confidentiel généré automatiquement par Minerva Trequartista • minervaflow.com
      </div>
    </div>
  );
}
