'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import {
  Calendar,
  Target,
  Award,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { fetchTeamMemberPerformance } from '@/lib/services/supabase-data';
import type { TeamMemberPerformance } from '@/lib/types';
import { PerformanceBarChart } from '@/components/charts/PerformanceBarChart';


export default function PerformancePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [activeTab, setActiveTab] = useState<'okrs' | 'skills' | 'feedbacks' | 'history'>('okrs');
  const [member, setMember] = useState<TeamMemberPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      setMember(await fetchTeamMemberPerformance(rawId));
      setLoading(false);
    })();
  }, [rawId]);

  if (loading) {
    return <div className="py-16 text-center text-sm text-mv-ink-soft">Chargement du profil…</div>;
  }

  if (!member) {
    return (
      <Card className="py-16 text-center">
        <p className="text-sm text-mv-ink-soft">Membre introuvable.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Profile Banner */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={member.avatar_url}
            alt={member.full_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-mv-green shadow-mv-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-extrabold text-mv-ink font-display">
                {member.full_name}
              </h1>
              <Badge variant="green">{member.role}</Badge>
            </div>
          </div>
        </div>

        {/* 1-on-1 Calendar Box */}
        <div className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center gap-4 shrink-0">
          <div className="p-3 rounded-lg bg-mv-green-tint text-mv-green">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-mv-ink">Prochain 1-on-1</div>
            <div className="text-[11px] text-mv-ink-soft">
              {member.next_1on1_date
                ? new Date(member.next_1on1_date).toLocaleDateString('fr-CA', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : 'Aucun rendez-vous planifié'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-mv-border gap-2 text-xs font-bold">
        {[
          { id: 'okrs', label: 'Objectifs OKR (Q3 2026)', icon: Target },
          { id: 'skills', label: 'Matrice de Compétences', icon: Award },
          { id: 'feedbacks', label: `Feedbacks 360° (${member.feedbacks_count})`, icon: MessageSquare },
          { id: 'history', label: 'Historique 1-on-1s', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-mv-warm text-mv-warm bg-mv-surface/60'
                  : 'border-transparent text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: OKRs */}
      {activeTab === 'okrs' && (
        <div className="space-y-6">
          <Card
            header={
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Objectifs Trimestriels Q3 (Juillet - Septembre 2026)
              </h3>
            }
          >
            {member.okrs.length === 0 ? (
              <p className="text-xs text-mv-ink-soft py-8 text-center">Aucun OKR défini pour le moment.</p>
            ) : (
              <div className="space-y-5">
                {member.okrs.map((okr) => (
                  <div key={okr.id} className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-mv-ink">{okr.title}</span>
                      <span className="text-xs font-mono font-bold text-mv-green">{okr.current_pct}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-mv-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-mv-green rounded-full transition-all duration-500"
                        style={{ width: `${okr.current_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab Content 2: Skills Matrix */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {member.skills.length === 0 ? (
            <Card className="text-center py-16">
              <p className="text-sm text-mv-ink-soft">Aucune compétence évaluée pour le moment.</p>
            </Card>
          ) : (
            <PerformanceBarChart
              title="Niveau de Maîtrise & Vélocité Équipe"
              subtitle="Évaluation continue des compétences techniques et opérationnelles"
              skills={member.skills.map((s) => ({
                skill: s.skill,
                score: { Expert: 95, 'Avancé': 75, 'En apprentissage': 45, Fondation: 25 }[s.level] ?? 0,
              }))}
            />
          )}
        </div>
      )}

      {/* Tab Content 3: Feedbacks 360 */}
      {activeTab === 'feedbacks' && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Feedbacks Récents</h3>}>
          {member.feedbacks_count === 0 ? (
            <p className="text-xs text-mv-ink-soft py-8 text-center">Aucun feedback pour le moment.</p>
          ) : (
            <p className="text-xs text-mv-ink-soft py-8 text-center">
              {member.feedbacks_count} feedback(s) enregistré(s) — détail à venir.
            </p>
          )}
        </Card>
      )}

      {/* Tab Content 4: History */}
      {activeTab === 'history' && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Historique des Rencontres 1-on-1</h3>}>
          <p className="text-xs text-mv-ink-soft py-8 text-center">Aucune rencontre enregistrée pour le moment.</p>
        </Card>
      )}

      {/* HR Documents */}
      <StorageBrowser defaultBucket="team-documents" title="Documents & Fiches RH" />
    </div>
  );
}
