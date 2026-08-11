'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Clock,
  Download,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { fetchClients } from '@/lib/services/supabase-data';
import { Client } from '@/lib/types';

export default function BillingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalMrr = clients.reduce((acc, c) => acc + c.mrr, 0);
  const totalArr = totalMrr * 12;

  const handleSimulateStripeWebhook = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/webhooks/roi-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'sale.completed',
          clientId: 'client-apex-roofing',
          data: {
            saleAmount: 3800,
            saleId: `inv_${Date.now()}`,
          },
        }),
      });
      await res.json();
      setToastMsg('Événement Webhook Stripe traité : Vente de 3,800 $ comptabilisée !');
      setTimeout(() => setToastMsg(null), 4000);
    } catch {
      // Fallback
    }
    setSimulating(false);
  };

  const invoices = [
    { id: 'INV-2026-081', client: 'Apex Roofing & Renovation', amount: 3800, date: '2026-08-01', status: 'Payé' },
    { id: 'INV-2026-082', client: 'Clinique Dentaire Élite', amount: 4500, date: '2026-08-01', status: 'Payé' },
    { id: 'INV-2026-083', client: 'Studio Design Lumina', amount: 2900, date: '2026-08-02', status: 'En attente' },
    { id: 'INV-2026-084', client: 'Groupe Immobilier Horizon', amount: 5200, date: '2026-08-05', status: 'Payé' },
  ];

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-24 shimmer-bg rounded w-full animate-mv-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Facturation Agence & Abonnements Stripe
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Gestion du Chiffre d'Affaires Récurrent (MRR), suivi des contrats et récapitulatif des paiements clients.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="lime"
            size="sm"
            onClick={handleSimulateStripeWebhook}
            disabled={simulating}
            icon={<Zap className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : ''}`} />}
          >
            {simulating ? 'Traitement Webhook...' : 'Simuler un Paiement Stripe'}
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-mv-green-tint border border-mv-green/40 text-mv-green text-xs font-bold flex items-center gap-2 animate-mv-fade-up">
          <CheckCircle2 className="w-4 h-4 text-mv-lime" /> {toastMsg}
        </div>
      )}

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenu Mensuel (MRR)"
          value={`${totalMrr.toLocaleString('fr-CA')} $`}
          change="+12.4% ce mois"
          changeType="positive"
          subtitle="Contrats actifs récurrents"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Revenu Annuel Projeté (ARR)"
          value={`${totalArr.toLocaleString('fr-CA')} $`}
          change="Projection à 12 mois"
          changeType="positive"
          subtitle="Base clients Centurions"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Taux de Recouvrement"
          value="98.4 %"
          change="Paiements à jour"
          changeType="positive"
          subtitle="Stripe Direct Debit"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          title="Panier Moyen / Client"
          value={`${Math.round(totalMrr / (clients.length || 1)).toLocaleString('fr-CA')} $`}
          change="Abonnement mensuel moyen"
          changeType="positive"
          subtitle="Accompagnement hybride"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Main Subscriptions Table */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Abonnements Clients Actifs ({clients.length})
            </h3>
            <span className="text-[11px] font-mono text-mv-ink-soft">Stripe Billing API</span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-mv-border text-mv-ink-soft uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Formule Centurion</th>
                <th className="py-3 px-4">MRR Mensuel</th>
                <th className="py-3 px-4">Statut Stripe</th>
                <th className="py-3 px-4">Renouvellement</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mv-border">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-mv-surface/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-mv-ink flex items-center gap-3">
                    <img src={c.logo_url} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-mv-border" />
                    <span>{c.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-mv-ink-soft">
                    Pack Centurion High-Growth
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-mv-lime">
                    {c.mrr.toLocaleString('fr-CA')} $ / mois
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="green">● Stripe Connected</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-mv-ink-soft font-mono">
                    1er Septembre 2026
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/clients/${c.id}/roi-tracker`}
                      className="text-mv-green hover:underline font-bold inline-flex items-center gap-1"
                    >
                      Bilan ROI <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoices History Table */}
      <Card
        header={
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
            Historique des Factures Générées
          </h3>
        }
      >
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-mv-surface border border-mv-border font-mono font-bold text-mv-lime">
                  {inv.id}
                </div>
                <div>
                  <div className="font-bold text-mv-ink">{inv.client}</div>
                  <div className="text-[11px] text-mv-ink-soft">Édition du {inv.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-mono font-extrabold text-mv-ink text-sm">
                    {inv.amount.toLocaleString('fr-CA')} $
                  </div>
                  <Badge variant={inv.status === 'Payé' ? 'green' : 'amber'}>
                    {inv.status}
                  </Badge>
                </div>

                <button
                  onClick={() => alert(`Téléchargement de la facture PDF ${inv.id}...`)}
                  className="p-2 rounded-lg bg-mv-surface hover:bg-mv-green-tint border border-mv-border text-mv-green hover:text-mv-lime transition-all cursor-pointer"
                  title="Télécharger la Facture PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
