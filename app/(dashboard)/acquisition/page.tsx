'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Users, MessageSquare, Target, FileSearch, Send, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchAcquisitionFunnelStats, fetchIntakeLeads, type AcquisitionFunnelStats } from '@/lib/services/supabase-data';
import type { IntakeLead } from '@/lib/types';
import { MinervaVoiceAgent } from '@/components/voice/MinervaVoiceAgent';

const STATUS_BADGE: Record<IntakeLead['status'], { variant: 'neutral' | 'amber' | 'green'; label: string }> = {
  step1_abandoned: { variant: 'amber', label: 'Étape 1 seulement' },
  qualified: { variant: 'green', label: 'Qualifié' },
  converted: { variant: 'green', label: 'Converti' },
  discarded: { variant: 'neutral', label: 'Écarté' },
};

const SMS_STATUS_LABEL: Record<IntakeLead['sms_follow_up_status'], string> = {
  pending: 'En attente',
  sent: 'Envoyé',
  failed: 'Échoué',
  skipped_qualified: 'Ignoré (déjà qualifié)',
  skipped_no_config: 'Ignoré (non configuré)',
};

export default function AcquisitionDashboardPage() {
  const { role, loading: userLoading } = useCurrentUser();
  const [stats, setStats] = useState<AcquisitionFunnelStats | null>(null);
  const [leads, setLeads] = useState<IntakeLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, l] = await Promise.all([fetchAcquisitionFunnelStats(), fetchIntakeLeads()]);
      setStats(s);
      setLeads(l);
      setLoading(false);
    })();
  }, []);

  if (!userLoading && role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 text-mv-amber mx-auto" />
        <p className="text-sm font-bold text-mv-ink">Réservé aux administrateurs.</p>
        <Link href="/overview" className="text-xs text-mv-green hover:underline">Retour à l'aperçu</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
          Tableau de Bord Acquisition
        </h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Funnel complet : capture de leads, relance SMS, qualification, audits et propositions envoyées.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Leads Captés (Étape 1)"
          value={loading ? '...' : stats?.totalIntakeLeads ?? 0}
          subtitle="Total depuis le formulaire"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="SMS de Relance Envoyés"
          value={loading ? '...' : stats?.smsSent ?? 0}
          subtitle="Suite à un abandon Étape 1"
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatCard
          title="Taux de Qualification"
          value={loading ? '...' : `${stats?.qualificationRatePct ?? 0}%`}
          subtitle={`${stats?.qualified ?? 0} lead(s) qualifié(s)`}
          icon={<Target className="w-5 h-5" />}
        />
        <StatCard
          title="Audits Complétés"
          value={loading ? '...' : stats?.auditsExtracted ?? 0}
          subtitle={`${stats?.totalAudits ?? 0} audit(s) créé(s)`}
          icon={<FileSearch className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Propositions Envoyées"
          value={loading ? '...' : stats?.proposalsSent ?? 0}
          subtitle={`${stats?.totalProposals ?? 0} proposition(s) générée(s)`}
          icon={<Send className="w-5 h-5" />}
        />
        <StatCard
          title="Taux de Closing (estimé)"
          value={loading ? '...' : `${stats?.closeRatePct ?? 0}%`}
          subtitle="Propositions envoyées / leads captés"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <MinervaVoiceAgent />

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Leads Captés (Étape 1 & 2)</h3>}>
        {loading ? (
          <div className="p-8 text-center text-xs text-mv-ink-soft">Chargement…</div>
        ) : leads.length === 0 ? (
          <EmptyState icon={Users} title="Aucun lead capté" description="Les leads apparaîtront ici dès la première soumission du formulaire Framer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-mv-border text-mv-ink-soft uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Prénom</th>
                  <th className="pb-3 font-semibold">Téléphone</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold">Relance SMS</th>
                  <th className="pb-3 font-semibold">Reçu le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mv-border/40">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-mv-cream-soft/40 transition-colors">
                    <td className="py-3 pr-4 font-bold text-mv-ink">{lead.first_name}</td>
                    <td className="py-3 px-2 font-mono text-mv-ink-soft">{lead.phone}</td>
                    <td className="py-3 px-2"><Badge variant={STATUS_BADGE[lead.status].variant}>{STATUS_BADGE[lead.status].label}</Badge></td>
                    <td className="py-3 px-2 text-mv-ink-soft">{SMS_STATUS_LABEL[lead.sms_follow_up_status]}</td>
                    <td className="py-3 px-2 text-mv-ink-faint">{new Date(lead.created_at).toLocaleDateString('fr-CA')}</td>
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
