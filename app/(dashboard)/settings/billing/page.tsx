'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  UserCheck,
  X,
  Shield,
  Link2,
  Loader2,
} from 'lucide-react';
import { fetchClients } from '@/lib/services/supabase-data';
import { Client } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { Tooltip } from '@/components/ui/tooltip';


interface PendingMember {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

export default function BillingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [generatingLinkFor, setGeneratingLinkFor] = useState<string | null>(null);


  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchClients();
      setClients(data);
      setLoading(false);
    }
    loadData();

    async function loadPending() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .eq('approved', false)
          .order('created_at', { ascending: false });
        setPendingMembers(data || []);
      } catch {}
    }
    loadPending();
  }, []);


  const totalMrr = clients.reduce((acc, c) => acc + c.mrr, 0);
  const totalArr = totalMrr * 12;

  const handleGeneratePaymentLink = async (client: Client) => {
    setGeneratingLinkFor(client.id);
    try {
      const res = await fetch('/api/stripe/create-payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setToastMsg(data.error || "Impossible de générer le lien de paiement.");
      } else {
        await navigator.clipboard.writeText(data.url);
        setToastMsg(`Lien de paiement copié pour ${client.name}.`);
      }
    } catch {
      setToastMsg('Erreur lors de la génération du lien de paiement.');
    }
    setTimeout(() => setToastMsg(null), 4000);
    setGeneratingLinkFor(null);
  };

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
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
          Facturation Agence
        </h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Le MRR total et le détail par client se calculent automatiquement à partir des fiches clients. Générez un lien de paiement Stripe pour un client depuis le tableau ci-dessous.
        </p>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-mv-green-tint border border-mv-green/40 text-mv-green text-xs font-bold flex items-center gap-2 animate-mv-fade-up">
          <CheckCircle2 className="w-4 h-4 text-mv-green" /> {toastMsg}
        </div>
      )}

      {/* 3 Financial Stat Cards -- all derived from real client data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Revenu Mensuel (MRR)"
          value={`${totalMrr.toLocaleString('fr-CA')} $`}
          subtitle="Somme du MRR des clients actifs"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Revenu Annuel Projeté (ARR)"
          value={`${totalArr.toLocaleString('fr-CA')} $`}
          change="Projection à 12 mois"
          changeType="neutral"
          subtitle="MRR × 12"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Panier Moyen / Client"
          value={`${Math.round(totalMrr / (clients.length || 1)).toLocaleString('fr-CA')} $`}
          subtitle="MRR total ÷ nombre de clients"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Main Subscriptions Table */}
      <Card
        header={
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
            Clients & MRR ({clients.length})
          </h3>
        }
      >
        {clients.length === 0 ? (
          <div className="py-8 text-center text-xs text-mv-ink-faint">Aucun client pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">MRR Mensuel</th>
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
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'Active' ? 'green' : c.status === 'Paused' ? 'amber' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-mv-warm">
                      {c.mrr.toLocaleString('fr-CA')} $ / mois
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleGeneratePaymentLink(c)}
                          disabled={generatingLinkFor === c.id || !c.mrr}
                          title={!c.mrr ? "Aucun MRR défini pour ce client" : 'Générer et copier un lien de paiement Stripe'}
                          className="text-mv-green hover:underline font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                        >
                          {generatingLinkFor === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                          Lien Stripe
                        </button>
                        <Link
                          href={`/clients/${c.id}/roi-tracker`}
                          className="text-mv-green hover:underline font-bold inline-flex items-center gap-1"
                        >
                          Bilan ROI <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Admin: Gestion des Accès Membres ── */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-mv-green-tint border border-mv-green/30 flex items-center justify-center text-mv-green">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-mv-ink">Gestion des Accès — Nouveaux Membres</h2>
            <p className="text-xs text-mv-ink-soft">Approuver ou rejeter les demandes d&apos;accès en attente.</p>
          </div>
          <div className="ml-auto">
            {pendingMembers.length > 0 && (
              <span className="text-xs font-bold text-mv-amber bg-mv-amber/10 border border-mv-amber/30 px-2 py-0.5 rounded-full">
                {pendingMembers.length} en attente
              </span>
            )}
          </div>
        </div>

        {pendingMembers.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-mv-green-tint/40 border border-mv-green/20">
            <CheckCircle2 className="w-5 h-5 text-mv-green" />
            <p className="text-sm text-mv-ink-soft">Aucune demande d&apos;accès en attente. Tous les membres sont approuvés.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3.5 rounded-xl bg-mv-cream-soft border border-mv-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-mv-green text-white flex items-center justify-center font-bold text-sm">
                    {(member.full_name || member.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-mv-ink">{member.full_name || 'Nom inconnu'}</div>
                    <div className="text-xs text-mv-ink-soft font-mono">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip content="Approuver l'accès à l'application" position="top">
                    <button
                      disabled={approvingId === member.id}
                      onClick={async () => {
                        setApprovingId(member.id);
                        try {
                          const supabase = createClient();
                          await supabase.from('profiles').update({ approved: true }).eq('id', member.id);
                          setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
                          setToastMsg(`✓ ${member.full_name || member.email} approuvé(e).`);
                        } catch { setToastMsg('Erreur lors de l\'approbation.'); }
                        setApprovingId(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-green text-white text-xs font-bold hover:bg-mv-green/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approuver
                    </button>
                  </Tooltip>
                  <Tooltip content="Rejeter et supprimer ce compte" position="top">
                    <button
                      disabled={approvingId === member.id}
                      onClick={async () => {
                        if (!confirm(`Rejeter le compte de ${member.full_name || member.email} ?`)) return;
                        setApprovingId(member.id);
                        try {
                          const supabase = createClient();
                          await supabase.from('profiles').delete().eq('id', member.id);
                          setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
                          setToastMsg(`Compte de ${member.full_name || member.email} rejeté.`);
                        } catch { setToastMsg('Erreur lors du rejet.'); }
                        setApprovingId(null);
                      }}
                      className="p-1.5 rounded-lg bg-mv-red-bg border border-mv-red/20 text-mv-red hover:bg-mv-red/10 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
