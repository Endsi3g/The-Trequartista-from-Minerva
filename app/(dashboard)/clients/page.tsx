'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Users, Plus, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';
import { fetchClients } from '@/lib/services/supabase-data';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (err) {
        console.warn('[Clients] Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalMrr = clients.reduce((acc, c) => acc + c.mrr, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Répertoire Clients & Suivi MRR
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Cliquez sur un client pour voir sa fiche complète ; utilisez « Suivi ROI » pour consulter ses performances ou l'inviter sur son portail.
          </p>
        </div>

        <Link href="/clients/new">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Nouveau Client
          </Button>
        </Link>
      </div>

      {/* 3 Summary StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Clients Actifs"
          value={loading ? '...' : clients.length}
          change="Synchro en direct"
          changeType="positive"
          subtitle="Abonnements actifs"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="MRR Total Sous Gestion"
          value={loading ? '...' : `${totalMrr.toLocaleString('fr-CA')} $`}
          change="+2 400 $ ce trimestre"
          changeType="positive"
          subtitle="Revenu récurrent mensuel"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Moyenne MRR / Client"
          value={loading || clients.length === 0 ? '...' : `${Math.round(totalMrr / clients.length).toLocaleString('fr-CA')} $`}
          change="+12% retention"
          changeType="positive"
          subtitle="Valeur moyenne de contrat"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Client List Table */}
      <Card
        header={
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
            Portefeuille Clients Minerva (Base de Données Realtime)
          </h3>
        }
      >
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="h-4 shimmer-bg rounded w-3/4 mx-auto animate-mv-shimmer" />
            <div className="h-4 shimmer-bg rounded w-1/2 mx-auto animate-mv-shimmer" />
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-xs text-mv-ink-soft">
            Aucun client enregistré. Cliquez sur "Nouveau Client" pour ajouter votre premier contrat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Entreprise</th>
                  <th className="pb-3 font-semibold">Secteur d'Activité</th>
                  <th className="pb-3 font-semibold">MRR Mensuel</th>
                  <th className="pb-3 font-semibold">Statut & Santé</th>
                  <th className="pb-3 font-semibold">Contact Principal</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border/40">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-mv-cream-soft/40 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.logo_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=150&auto=format&fit=crop&q=80'}
                          alt={client.name}
                          className="w-9 h-9 rounded-lg object-cover border border-mv-border shrink-0"
                        />
                        <div>
                          <div className="font-bold text-mv-ink text-sm">{client.name}</div>
                          <div className="text-[11px] text-mv-ink-soft">Réf: {client.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-semibold text-mv-ink">{client.industry}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-mono font-bold text-mv-green text-sm">{client.mrr.toLocaleString('fr-CA')} $</span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={client.status === 'Active' ? 'green' : 'amber'}>
                          {client.status}
                        </Badge>
                        <Badge variant={client.health_status === 'Ready' ? 'lime' : 'neutral'}>
                          ● {client.health_status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className="text-mv-ink font-semibold">{client.contact_name}</div>
                      <div className="text-[11px] text-mv-ink-soft">{client.contact_email}</div>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <Link href={`/clients/${client.id}/roi-tracker`}>
                        <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Suivi ROI
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
