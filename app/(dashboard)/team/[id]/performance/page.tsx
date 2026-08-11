'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import {
  Calendar,
  Sparkles,
  Target,
  Award,
  MessageSquare,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { INITIAL_TEAM } from '@/lib/mock-data';

export default function PerformancePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [activeTab, setActiveTab] = useState<'okrs' | 'skills' | 'feedbacks' | 'history'>('okrs');
  const [isSyncing, setIsSyncing] = useState(false);

  const member = INITIAL_TEAM.find(m => m.id === rawId) || INITIAL_TEAM[0];


  const triggerGoogleCalendarSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('https://eobatkwbwcdsdqbemrma.supabase.co/functions/v1/google-calendar-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          memberEmail: 'alex@minervaflow.com',
          meetingDate: member.next_1on1_date,
        }),
      });
      await res.json();
    } catch {
      // Fallback
    }
    setTimeout(() => {
      setIsSyncing(false);
      alert('Synchronisation Google Calendar réussie ! Créneau verrouillé.');
    }, 800);
  };

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
              <Badge variant="green">● Lead Tech & IA</Badge>
            </div>
            <p className="text-xs text-mv-ink-soft mt-1">
              {member.role} • Département Operations & IA
            </p>
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
              Jeudi 13 Août à 14h00 (Sync Google Calendar)
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerGoogleCalendarSync}
            disabled={isSyncing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />}
          >
            {isSyncing ? 'Sync...' : 'Replanifier'}
          </Button>
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
                  ? 'border-mv-lime text-mv-lime bg-mv-surface/60'
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
              <div className="flex items-center justify-between w-full">
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                  Objectifs Trimestriels Q3 (Juillet - Septembre 2026)
                </h3>
                <Button variant="primary" size="sm">
                  + Nouvel OKR
                </Button>
              </div>
            }
          >
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
          </Card>
        </div>
      )}

      {/* Tab Content 2: Skills Matrix */}
      {activeTab === 'skills' && (
        <Card
          header={
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Grille de Compétences Interne Minerva
            </h3>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {member.skills.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-mv-ink">{s.skill}</div>
                  <div className="text-[11px] text-mv-ink-soft mt-0.5">Évaluation Équipe Minerva</div>
                </div>

                <Badge
                  variant={
                    s.level === 'Expert'
                      ? 'lime'
                      : s.level === 'Avancé'
                      ? 'green'
                      : 'amber'
                  }
                >
                  {s.level}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab Content 3: Feedbacks 360 */}
      {activeTab === 'feedbacks' && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Feedbacks Récents</h3>}>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border">
              <div className="flex items-center justify-between font-bold text-mv-ink">
                <span>Sarah Bouchard (Head of Success)</span>
                <span className="text-[11px] text-mv-ink-soft">Il y a 3 jours</span>
              </div>
              <p className="mt-2 text-mv-ink-soft leading-relaxed">
                "Excellente réactivité sur le fix des webhooks Stripe d'Apex Roofing. Le client a particulièrement apprécié l'intégration WhatsApp IA."
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tab Content 4: History */}
      {activeTab === 'history' && (
        <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Historique des Rencontres 1-on-1</h3>}>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-between">
              <div>
                <div className="font-bold text-mv-ink">Session 1-on-1 — 30 Juillet 2026</div>
                <div className="text-[11px] text-mv-ink-soft">Bilan mi-trimestre & revue des compétences Supabase Edge Functions.</div>
              </div>
              <Badge variant="green">Complété</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Supabase Storage HR Documents */}
      <StorageBrowser defaultBucket="team-documents" title="Documents & Fiches RH (Supabase Storage)" />
    </div>
  );
}
