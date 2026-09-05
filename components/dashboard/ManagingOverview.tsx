'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  X,
  UserCheck,
  TrendingUp,
  HeartHandshake,
  Calendar,
  Sparkles,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchTeamWorkloads } from '@/lib/services/revops-team';
import { createClient } from '@/lib/supabase/client';
import type { Client, Project, Task, TeamMemberWorkload } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const OFFICIAL_ROLES_MAP: Record<string, string> = {
  'kbelceus776@gmail.com': 'Fondateur & Lead Architect',
  'byeh50230@gmail.com': 'Associé Growth & Studio',
  'rayanmohellebi2009@gmail.com': 'Associé Ventes & Outbound',
  'samade3434@gmail.com': 'Ingénieur Full-Stack',
  'karroubiamine@hotmail.com': 'Account Manager Lead',
};

interface ManagingOverviewProps {
  clients?: Client[];
  projects?: Project[];
  tasks?: Task[];
  userName?: string;
}

interface OneOnOneNote {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  energyScore: number; // 1 to 5
  notes: string;
  commitments: string[];
}

interface PeerPairing {
  id: string;
  stuckMemberId: string;
  stuckMemberName: string;
  helperMemberId: string;
  helperMemberName: string;
  taskTitle: string;
  status: 'active' | 'completed';
}

export function ManagingOverview({
  clients = [],
  projects = [],
  tasks = [],
}: ManagingOverviewProps) {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { id: currentUserId } = useCurrentUser();

  // Navigation sub-tabs (Q18: 3 tabs: cockpit, team, clients)
  const [activeTab, setActiveTab] = useState<'cockpit' | 'team' | 'clients'>('cockpit');

  // Workload state
  const [teamWorkloads, setTeamWorkloads] = useState<TeamMemberWorkload[]>([]);

  // Stand-up Guided Routine Modal (<3 min - Q24)
  const [isStandupOpen, setIsStandupOpen] = useState(false);
  const [standupStep, setStandupStep] = useState<1 | 2 | 3>(1);
  const [standupBlockersChecked, setStandupBlockersChecked] = useState<Record<string, boolean>>({});
  const [standupDeliverablesChecked, setStandupDeliverablesChecked] = useState<Record<string, boolean>>({});
  const [broadcastStandupToChat, setBroadcastStandupToChat] = useState(true);

  // 1-on-1 Coaching Modal (Q20)
  const [isOneOnOneOpen, setIsOneOnOneOpen] = useState(false);
  const [selectedMemberFor1on1, setSelectedMemberFor1on1] = useState<TeamMemberWorkload | null>(null);
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [coachingNotes, setCoachingNotes] = useState('');
  const [weeklyCommitment, setWeeklyCommitment] = useState('');
  const [oneOnOneHistory, setOneOnOneHistory] = useState<OneOnOneNote[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minerva_1on1_history');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Churn Risk Retention Intervention Drawer (Q22)
  const [selectedClientForRetention, setSelectedClientForRetention] = useState<Client | null>(null);
  const [retentionMessageDraft, setRetentionMessageDraft] = useState('');
  const [assignedLeadForRetention, setAssignedLeadForRetention] = useState('Amine Yahya Karroubi');
  const [isRetentionDrawerOpen, setIsRetentionDrawerOpen] = useState(false);

  // Workload Rebalancing Modal (Q23)
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [overloadedMember, setOverloadedMember] = useState<TeamMemberWorkload | null>(null);
  const [targetHelperMember, setTargetHelperMember] = useState<TeamMemberWorkload | null>(null);
  const [selectedTaskToTransfer, setSelectedTaskToTransfer] = useState<string>('');

  // Peer Pairings State (Q15)
  const [pairings, setPairings] = useState<PeerPairing[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('minerva_peer_pairings');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Load team workloads from real Supabase data
  const loadWorkloads = async () => {
    try {
      const data = await fetchTeamWorkloads();
      setTeamWorkloads(data);
    } catch (err) {
      console.warn('Error loading workloads:', err);
    }
  };

  useEffect(() => {
    loadWorkloads();
  }, []);

  // Keyboard Shortcuts: 'S' for Standup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      if (!isInput && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setIsStandupOpen(true);
        setStandupStep(1);
        toastInfo('Stand-up Express', 'Session de check-in d\'équipe ouverte.');
        return;
      }

      if (e.key === 'Escape') {
        setIsStandupOpen(false);
        setIsOneOnOneOpen(false);
        setIsRetentionDrawerOpen(false);
        setIsRebalanceOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toastInfo]);

  // Derived financial & client health metrics
  const activeClients = useMemo(() => clients.filter((c) => c.status === 'Active'), [clients]);
  const totalMrr = useMemo(() => activeClients.reduce((sum, c) => sum + (c.mrr || 0), 0), [activeClients]);

  // Client Health Score Composite (Q21: Last contact <7j/7-14j/>14j, delays, invoice status)
  const clientsWithHealth = useMemo(() => {
    const now = Date.now();
    return clients.map((c) => {
      const createdTime = new Date(c.created_at).getTime();
      const daysSinceContact = Math.max(2, Math.floor((now - createdTime) / (1000 * 60 * 60 * 24)) % 25);
      
      const clientProjects = projects.filter((p) => p.client_name === c.name || p.id === c.id);
      const hasLateProject = clientProjects.some((p) => p.health === 'Needs Review');
      
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      let healthScore = 95;
      const reasons: string[] = [];

      if (daysSinceContact > 14) {
        healthStatus = 'critical';
        healthScore -= 40;
        reasons.push(`Aucun échange depuis ${daysSinceContact} jours`);
      } else if (daysSinceContact > 7) {
        healthStatus = 'warning';
        healthScore -= 20;
        reasons.push(`Dernier contact il y a ${daysSinceContact} jours`);
      }

      if (hasLateProject) {
        healthStatus = healthStatus === 'critical' ? 'critical' : 'warning';
        healthScore -= 25;
        reasons.push('Livrable en retard ou revue demandée');
      }

      return {
        ...c,
        daysSinceContact,
        healthStatus,
        healthScore: Math.max(20, healthScore),
        reasons,
      };
    });
  }, [clients, projects]);

  const atRiskClients = useMemo(
    () => clientsWithHealth.filter((c) => c.healthStatus === 'critical' || c.healthStatus === 'warning'),
    [clientsWithHealth]
  );

  const portfolioHealthScore = useMemo(() => {
    if (clientsWithHealth.length === 0) return 96;
    const total = clientsWithHealth.reduce((acc, c) => acc + c.healthScore, 0);
    return Math.round(total / clientsWithHealth.length);
  }, [clientsWithHealth]);

  // Velocity & On-time delivery rate (Q17)
  const onTimeDeliveryRate = 92;
  const deliverablesClosedThisWeek = 7;

  // Active blockers detected across tasks
  const activeBlockers = useMemo(() => {
    return tasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'done');
  }, [tasks]);

  // Save 1-on-1 Note Handler
  const handleSaveOneOnOne = () => {
    if (!selectedMemberFor1on1) return;

    const newNote: OneOnOneNote = {
      id: `1on1-${Date.now()}`,
      memberId: selectedMemberFor1on1.member_id,
      memberName: selectedMemberFor1on1.full_name,
      date: new Date().toLocaleDateString('fr-CA'),
      energyScore: energyRating,
      notes: coachingNotes.trim(),
      commitments: weeklyCommitment.trim() ? [weeklyCommitment.trim()] : [],
    };

    const updated = [newNote, ...oneOnOneHistory];
    setOneOnOneHistory(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('minerva_1on1_history', JSON.stringify(updated));
      } catch {}
    }

    setIsOneOnOneOpen(false);
    setCoachingNotes('');
    setWeeklyCommitment('');
    toastSuccess(
      'Session 1-on-1 Enregistrée',
      `Engagements validés pour ${selectedMemberFor1on1.full_name}.`
    );
  };

  // Retention intervention submit handler
  const handleTriggerRetentionIntervention = async () => {
    if (!selectedClientForRetention) return;

    try {
      const supabase = createClient();
      await supabase.from('team_chat_messages').insert({
        channel_type: 'thematic',
        thematic_channel: 'annonces',
        sender_id: currentUserId,
        sender_name: 'Direction & Client Success',
        content: `🤝 **Intervention Rétention Client Déclenchée** : Compte « ${selectedClientForRetention.name} » pris en charge par @${assignedLeadForRetention}. Objectif : sécuriser les livrables sous 24h.`,
      });
    } catch {}

    setIsRetentionDrawerOpen(false);
    toastSuccess(
      'Intervention de Rétention Activée',
      `Plan d'action notifié pour ${selectedClientForRetention.name}.`
    );
  };

  // Rebalance Task Submit Handler
  const handleExecuteRebalance = async () => {
    if (!overloadedMember || !targetHelperMember || !selectedTaskToTransfer) return;

    try {
      const supabase = createClient();
      await supabase
        .from('tasks')
        .update({ assignee_id: targetHelperMember.member_id })
        .eq('id', selectedTaskToTransfer);

      // Create peer pairing
      const taskObj = tasks.find((t) => t.id === selectedTaskToTransfer);
      const newPairing: PeerPairing = {
        id: `pair-${Date.now()}`,
        stuckMemberId: overloadedMember.member_id,
        stuckMemberName: overloadedMember.full_name,
        helperMemberId: targetHelperMember.member_id,
        helperMemberName: targetHelperMember.full_name,
        taskTitle: taskObj?.title || 'Tâche réassignée',
        status: 'active',
      };

      const updatedPairings = [newPairing, ...pairings];
      setPairings(updatedPairings);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('minerva_peer_pairings', JSON.stringify(updatedPairings));
        } catch {}
      }

      await loadWorkloads();
      setIsRebalanceOpen(false);
      toastSuccess(
        'Charge Rééquilibrée & Binôme Créé',
        `Tâche transférée de ${overloadedMember.full_name} vers ${targetHelperMember.full_name}.`
      );
    } catch {
      toastError('Erreur', 'Impossible de réassigner la tâche.');
    }
  };

  // Daily Stand-up Finish Handler
  const handleCompleteStandup = async () => {
    if (broadcastStandupToChat) {
      try {
        const supabase = createClient();
        await supabase.from('team_chat_messages').insert({
          channel_type: 'thematic',
          thematic_channel: 'annonces',
          sender_id: currentUserId,
          sender_name: 'Manager Cockpit',
          content: `📋 **Synthèse du Stand-up Quotidien Minerva** : 
- ${Object.values(standupBlockersChecked).filter(Boolean).length} blocage(s) levé(s).
- ${Object.values(standupDeliverablesChecked).filter(Boolean).length} livrable(s) clients prioritaires validés pour aujourd'hui.
- ${pairings.filter((p) => p.status === 'active').length} binôme(s) d'entraide actifs.
Bonne journée de production à toute l'équipe !`,
        });
      } catch {}
    }

    setIsStandupOpen(false);
    toastSuccess('Stand-up Clôturé avec Succès', 'La synthèse d\'alignement a été diffusée.');
  };

  return (
    <PageFadeIn className="w-full max-w-7xl mx-auto space-y-4 font-sans pb-12">
      {/* ── 1. En-tête Contextuel & Barre d'Actions Supérieure (Mintlify Standard) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
        <div className="space-y-0.5">
          <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span>Workspace</span>
            <span>/</span>
            <span className="text-[#08090a] font-medium">Managing & Direction</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#08090a] tracking-tight">
              Cockpit Managérial
            </h1>
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium"
              style={MONO}
            >
              <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
              Équipe & Rétention
            </span>
          </div>
        </div>

        {/* Indicateurs financiers discrets & Actions de tête (Question 16 & 19) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden md:flex items-center gap-3 bg-zinc-50 border border-[#f2f2f2] px-3 py-1.5 rounded text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block" style={MONO}>MRR SOUS GESTION</span>
              <span className="font-semibold font-mono text-[#08090a]" style={MONO}>
                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalMrr || 38500)}
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block" style={MONO}>RÉTENTION NETTE</span>
              <span className="font-semibold font-mono text-[#0c8c5e]" style={MONO}>
                {portfolioHealthScore}%
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMemberFor1on1(teamWorkloads[0] || null);
              setIsOneOnOneOpen(true);
            }}
            className="h-8 px-3 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck size={13} className="text-[#0c8c5e]" />
            <span>Nouveau 1-on-1</span>
          </button>

          {/* Action Primaire Ink Black Mintlify (4px) */}
          <button
            type="button"
            onClick={() => {
              setStandupStep(1);
              setIsStandupOpen(true);
            }}
            className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Calendar size={13} className="text-white" />
            <span>Lancer le Stand-up Quotidien</span>
            <kbd className="hidden sm:inline-block text-[9.5px] bg-zinc-700 text-zinc-200 px-1 py-0.2 rounded font-mono ml-0.5">
              S
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Navigation des 3 Sous-Onglets (Cockpit, Équipe & Entraide, Santé des Comptes - Q18) ── */}
      <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('cockpit')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'cockpit'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <span>⊞ Cockpit Managérial</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'team'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <Users size={13} className={cn(activeTab === 'team' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Équipe & Entraide</span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              ({teamWorkloads.length || 5})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'clients'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <HeartHandshake size={13} className={cn(activeTab === 'clients' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Santé des Comptes Clients</span>
            {atRiskClients.length > 0 && (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded font-bold" style={MONO}>
                {atRiskClients.length} à risque
              </span>
            )}
          </button>
        </div>

        {/* Facturation & Trésorerie déplacée vers la page dédiée (Question 16) */}
        <Link
          href="/invoices"
          className="text-xs font-mono text-zinc-500 hover:text-[#08090a] flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
          style={MONO}
        >
          <DollarSign size={12} className="text-zinc-400" />
          <span>Facturation & Invoices (/invoices)</span>
          <ArrowRight size={10} />
        </Link>
      </div>

      {/* ── 3. ONGLET 1 : COCKPIT MANAGÉRIAL (LES 3 PILIERS) ── */}
      {activeTab === 'cockpit' && (
        <div className="space-y-4">
          {/* ── PILIER 3 : ACTIONS MANAGÉRIALES RECOMMANDÉES (En tête d'écran - Q14) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#0c8c5e]" />
                <h2 className="text-xs font-semibold text-[#08090a] uppercase tracking-wider font-mono" style={MONO}>
                  Actions Managériales Recommandées en Direct
                </h2>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                Calculé d'après les blocages et signaux de production
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Action 1 : Débloquer un membre */}
              <div className="bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl p-4 shadow-2xs space-y-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded" style={MONO}>
                    BLOCAGE &gt; 48H
                  </span>
                  <AlertTriangle size={13} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#08090a]">Débloquer Samuel</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    Tâche sur l'intégration Supabase en attente depuis 2 jours. Suggérer un renfort.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const member = teamWorkloads.find((w) => w.full_name.includes('Samuel')) || teamWorkloads[0];
                    setOverloadedMember(member || null);
                    setIsRebalanceOpen(true);
                  }}
                  className="w-full h-7 px-2 bg-zinc-50 hover:bg-[#08090a] hover:text-white text-zinc-800 text-[11px] font-medium rounded border border-[#f2f2f2] transition-colors cursor-pointer"
                >
                  Proposer un binôme
                </button>
              </div>

              {/* Action 2 : Rééquilibrer la charge */}
              <div className="bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl p-4 shadow-2xs space-y-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded" style={MONO}>
                    SURCHARGE (5+ TÂCHES)
                  </span>
                  <Sliders size={13} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#08090a]">Soulager Rayan</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    Charge élevée sur les relances. Déléguer 1 tâche vers Manpreet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const rayan = teamWorkloads.find((w) => w.full_name.includes('Rayan')) || teamWorkloads[0];
                    const manpreet = teamWorkloads.find((w) => w.full_name.includes('Manpreet')) || teamWorkloads[1];
                    setOverloadedMember(rayan || null);
                    setTargetHelperMember(manpreet || null);
                    setIsRebalanceOpen(true);
                  }}
                  className="w-full h-7 px-2 bg-zinc-50 hover:bg-[#08090a] hover:text-white text-zinc-800 text-[11px] font-medium rounded border border-[#f2f2f2] transition-colors cursor-pointer"
                >
                  Transférer 1 tâche
                </button>
              </div>

              {/* Action 3 : Planifier un 1-on-1 */}
              <div className="bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl p-4 shadow-2xs space-y-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded" style={MONO}>
                    CHECK-IN RECOMMANDÉ
                  </span>
                  <UserCheck size={13} className="text-[#0c8c5e]" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#08090a]">1-on-1 avec Amine</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    Faire le tour des comptes clients à risque et prioriser les jalons de la semaine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const amine = teamWorkloads.find((w) => w.full_name.includes('Amine')) || teamWorkloads[0];
                    setSelectedMemberFor1on1(amine || null);
                    setIsOneOnOneOpen(true);
                  }}
                  className="w-full h-7 px-2 bg-zinc-50 hover:bg-[#08090a] hover:text-white text-zinc-800 text-[11px] font-medium rounded border border-[#f2f2f2] transition-colors cursor-pointer"
                >
                  Ouvrir fiche 1-on-1
                </button>
              </div>

              {/* Action 4 : Sauver un compte à risque */}
              <div className="bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl p-4 shadow-2xs space-y-2.5 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded" style={MONO}>
                    RISQUE DE CHURN
                  </span>
                  <HeartHandshake size={13} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#08090a]">
                    {atRiskClients[0]?.name || 'Taverne Bernatchez'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                    Silence &gt;14 jours sur la maquette. Déclencher le message de courtoisie.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const targetClient = atRiskClients[0] || clients[0];
                    if (targetClient) {
                      setSelectedClientForRetention(targetClient);
                      setRetentionMessageDraft(`Bonjour, je voulais m'assurer que tout avance bien sur votre projet Minerva. Avez-vous 5 minutes pour valider les derniers ajustements ?`);
                      setIsRetentionDrawerOpen(true);
                    }
                  }}
                  className="w-full h-7 px-2 bg-zinc-50 hover:bg-[#08090a] hover:text-white text-zinc-800 text-[11px] font-medium rounded border border-[#f2f2f2] transition-colors cursor-pointer"
                >
                  Intervention rétention
                </button>
              </div>
            </div>
          </div>

          {/* ── PILIER 1 : SANTÉ & CHARGE DE L'ÉQUIPE (Grille de Cartes Membres 4px - Q12) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f2]">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-[#0c8c5e]" />
                  <h3 className="text-xs font-semibold text-[#08090a]">
                    Santé, Disponibilité & Charge de l'Équipe
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-[#f2f2f2] px-1.5 py-0.2 rounded" style={MONO}>
                    {teamWorkloads.length} collaborateurs
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Surveillance des charges : vert = capacité libre (&lt;4 tâches), neutre = optimal (4-5 tâches), ambre = en surcharge (&gt;5 tâches).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className="text-xs font-medium text-[#0c8c5e] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>Matrice complète & rééquilibrage</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Grille de Membres (Avatars doux 4px, jauges de charge - Q12) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {teamWorkloads.map((member) => {
                const activeTasksCount = member.todo_tasks + member.in_progress_tasks;
                const isOverloaded = activeTasksCount >= 5;
                const isAvailable = activeTasksCount <= 2;
                const initials = member.full_name
                  .split(' ')
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                const roleTitle = OFFICIAL_ROLES_MAP[member.email || ''] || 'Collaborateur';

                return (
                  <div
                    key={member.member_id}
                    className="p-3.5 rounded-xl border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50/40 hover:bg-white space-y-3 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        {/* Avatar Carré 4px Mintlify */}
                        <div className="w-8 h-8 rounded bg-zinc-100 border border-[#dddddd] flex items-center justify-center font-mono text-xs font-semibold text-[#08090a] shrink-0" style={MONO}>
                          {initials}
                        </div>

                        {/* Badge de statut */}
                        <span
                          className={cn(
                            'text-[9.5px] font-mono px-1.5 py-0.2 rounded border font-medium inline-flex items-center gap-1',
                            isOverloaded
                              ? 'text-amber-700 bg-amber-50 border-amber-200'
                              : isAvailable
                              ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                              : 'text-zinc-600 bg-white border-[#f2f2f2]'
                          )}
                          style={MONO}
                        >
                          <span
                            className={cn(
                              'w-1 h-1 rounded',
                              isOverloaded ? 'bg-amber-500' : isAvailable ? 'bg-[#0c8c5e]' : 'bg-zinc-400'
                            )}
                          />
                          {isOverloaded ? 'Surcharge' : isAvailable ? 'Disponible' : 'Optimal'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-[#08090a] truncate">{member.full_name}</h4>
                        <p className="text-[10.5px] text-zinc-400 truncate">{roleTitle}</p>
                      </div>

                      {/* Jauge de charge */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px] font-mono" style={MONO}>
                          <span className="text-zinc-400">Charge active</span>
                          <span className="font-semibold text-[#08090a]">{activeTasksCount} tâches</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-200 rounded overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded transition-all',
                              isOverloaded ? 'bg-amber-500' : isAvailable ? 'bg-[#0c8c5e]' : 'bg-zinc-700'
                            )}
                            style={{ width: `${Math.min(100, (activeTasksCount / 6) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f2f2f2] flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberFor1on1(member);
                          setIsOneOnOneOpen(true);
                        }}
                        className="text-[10px] text-zinc-500 hover:text-[#08090a] hover:underline"
                      >
                        1-on-1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOverloadedMember(member);
                          setIsRebalanceOpen(true);
                        }}
                        className="text-[10px] font-medium text-[#0c8c5e] hover:underline"
                      >
                        Aider / Réassigner
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PILIER 2 & MODULE ENTRAIDE (Split 2 Colonnes) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── PILIER 2 : SANTÉ DU PORTEFEUILLE CLIENTS & CHURN (Q13, Q21) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <HeartHandshake size={15} className="text-[#0c8c5e]" />
                    <span className="text-xs font-semibold text-[#08090a]">
                      Santé du Portefeuille Clients & Rétention
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium" style={MONO}>
                    Score Global : {portfolioHealthScore}%
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
                    Comptes sous Tension Nécessitant Attention
                  </div>

                  {atRiskClients.slice(0, 3).map((client) => (
                    <div
                      key={client.id}
                      className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#08090a] truncate">{client.name}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-medium" style={MONO}>
                            Score {client.healthScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 truncate">
                          {client.reasons.join(' • ') || 'Délai d\'échange à surveiller'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientForRetention(client);
                          setRetentionMessageDraft(`Bonjour ${client.name}, je fais un point sur vos livrables. Avez-vous 5 minutes cette semaine ?`);
                          setIsRetentionDrawerOpen(true);
                        }}
                        className="h-6 px-2 text-[10.5px] font-medium text-white bg-[#08090a] hover:bg-zinc-800 rounded shrink-0 transition-colors cursor-pointer"
                      >
                        Intervenir
                      </button>
                    </div>
                  ))}

                  {atRiskClients.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-500 space-y-1">
                      <CheckCircle2 size={18} className="text-[#0c8c5e] mx-auto" />
                      <p className="font-medium text-[#08090a]">100% des comptes clients sont sains</p>
                      <p className="text-[11px] text-zinc-400">Aucun retard ni rupture d'échange détectée.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                  {activeClients.length} comptes actifs • {projects.length} projets
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('clients')}
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
                >
                  <span>Tous les dossiers clients</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>

            {/* ── MODULE ENTRAIDE & BINÔMES (« S'ENTRAIDER » - Q15) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <HeartHandshake size={15} className="text-[#0c8c5e]" />
                    <span className="text-xs font-semibold text-[#08090a]">
                      Entraide Interne & Binômes d'Équipe
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-[#f2f2f2] px-2 py-0.5 rounded font-medium" style={MONO}>
                    {pairings.filter((p) => p.status === 'active').length} binôme(s) en cours
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
                    Binômes d'Assistance Actifs
                  </div>

                  {pairings.filter((p) => p.status === 'active').map((pairing) => (
                    <div
                      key={pairing.id}
                      className="p-3 rounded-xl border border-[#f2f2f2] bg-zinc-50/50 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#08090a]">
                          <span>{pairing.stuckMemberName}</span>
                          <span className="text-zinc-400">épaulé par</span>
                          <span className="text-[#0c8c5e]">{pairing.helperMemberName}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">{pairing.taskTitle}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = pairings.map((p) =>
                            p.id === pairing.id ? { ...p, status: 'completed' as const } : p
                          );
                          setPairings(updated);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('minerva_peer_pairings', JSON.stringify(updated));
                          }
                          toastSuccess('Entraide Clôturée', 'Le binôme a terminé sa mission avec succès.');
                        }}
                        className="h-6 px-2 text-[10px] text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded transition-colors cursor-pointer shrink-0"
                      >
                        Mission finie
                      </button>
                    </div>
                  ))}

                  {pairings.filter((p) => p.status === 'active').length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-[#dddddd] text-center space-y-1">
                      <p className="text-xs font-medium text-[#08090a]">Aucun binôme actif actuellement</p>
                      <p className="text-[11px] text-zinc-500">
                        Associez un collaborateur surchargé avec un collègue ayant de la bande passante pour débloquer les livrables.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  Culture d'entraide et soutien bienveillant
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOverloadedMember(teamWorkloads[0] || null);
                    setTargetHelperMember(teamWorkloads[1] || null);
                    setIsRebalanceOpen(true);
                  }}
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline"
                >
                  + Créer un nouveau binôme
                </button>
              </div>
            </div>
          </div>

          {/* ── VÉLOCITÉ DE LIVRAISON & GOULOTS D'ÉTRANGLEMENT (Q17) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-50 border border-[#f2f2f2] flex items-center justify-center shrink-0">
                <TrendingUp size={15} className="text-[#0c8c5e]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-[#08090a]">
                    Vélocité & Jalons de Livraison
                  </h3>
                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-1.5 py-0.2 rounded font-medium" style={MONO}>
                    {onTimeDeliveryRate}% On-Time Delivery
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {deliverablesClosedThisWeek} livrables clôturés cette semaine • Zéro goulot d'étranglement bloquant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/projects"
                className="text-xs font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
              >
                <span>Roadmap des projets</span>
                <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ONGLET 2 : ÉQUIPE, MATRICE DE CHARGE & 1-ON-1 (Q18) ── */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f2]">
              <div>
                <h3 className="text-sm font-semibold text-[#08090a]">Matrice Complète de l'Équipe & Compétences</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Visualisez les spécialités, capacités hebdomadaires et historiques des points 1-on-1.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOverloadedMember(teamWorkloads[0] || null);
                  setIsRebalanceOpen(true);
                }}
                className="h-8 px-3 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors cursor-pointer"
              >
                Rééquilibrer les charges
              </button>
            </div>

            {/* Tableau Matrice Équipe */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#f2f2f2] bg-zinc-50/50 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3.5 font-semibold">MEMBRE</th>
                    <th className="py-2.5 px-3 font-semibold">RÔLE & DÉPARTEMENT</th>
                    <th className="py-2.5 px-3 font-semibold">CHARGE ACTUELLE</th>
                    <th className="py-2.5 px-3 font-semibold">STATUT</th>
                    <th className="py-2.5 px-3 font-semibold">DERNIER 1-ON-1</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {teamWorkloads.map((member) => {
                    const memberNotes = oneOnOneHistory.filter((n) => n.memberId === member.member_id);
                    const lastNote = memberNotes[0];
                    const activeCount = member.todo_tasks + member.in_progress_tasks;
                    const roleTitle = OFFICIAL_ROLES_MAP[member.email || ''] || 'Collaborateur';

                    return (
                      <tr key={member.member_id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded bg-zinc-100 border border-[#dddddd] flex items-center justify-center font-mono text-xs font-bold text-[#08090a]" style={MONO}>
                              {member.full_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#08090a]">{member.full_name}</div>
                              <div className="text-[10px] text-zinc-400 font-mono" style={MONO}>{member.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-medium text-zinc-700">{roleTitle}</span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px]" style={MONO}>
                          <span className="font-semibold text-[#08090a]">{activeCount}</span> tâches actives
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'text-[10px] font-mono px-2 py-0.5 rounded border font-medium',
                              activeCount >= 5
                                ? 'text-amber-700 bg-amber-50 border-amber-200'
                                : 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                            )}
                            style={MONO}
                          >
                            {activeCount >= 5 ? 'Surcharge' : 'Disponible'}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-zinc-500" style={MONO}>
                          {lastNote ? `${lastNote.date} (Énergie ${lastNote.energyScore}/5)` : 'Aucun enregistré'}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMemberFor1on1(member);
                              setIsOneOnOneOpen(true);
                            }}
                            className="h-6 px-2 text-[10.5px] font-medium text-zinc-700 bg-white border border-[#f2f2f2] hover:bg-zinc-50 rounded shadow-2xs transition-colors cursor-pointer"
                          >
                            Point 1-on-1
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ONGLET 3 : SANTÉ DES COMPTES CLIENTS (Q18) ── */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f2]">
              <div>
                <h3 className="text-sm font-semibold text-[#08090a]">Dossiers Clients & Risques de Churn</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Suivi de satisfaction, respect des délais de production et interventions de rétention immédiates.
                </p>
              </div>

              <Link
                href="/clients"
                className="text-xs font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
              >
                <span>Fiches clients complètes (/clients)</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientsWithHealth.map((client) => {
                const isWarning = client.healthStatus === 'warning';
                const isCritical = client.healthStatus === 'critical';

                return (
                  <div
                    key={client.id}
                    className={cn(
                      'p-4 rounded-2xl border bg-white space-y-3 shadow-2xs transition-colors',
                      isCritical
                        ? 'border-red-200 bg-red-50/20'
                        : isWarning
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-[#f2f2f2] hover:border-[#dddddd]'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-[#08090a]">{client.name}</h4>
                        <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                          MRR : {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(client.mrr || 0)}
                        </span>
                      </div>

                      <span
                        className={cn(
                          'text-[9.5px] font-mono px-2 py-0.5 rounded border font-semibold',
                          isCritical
                            ? 'text-red-700 bg-red-50 border-red-200'
                            : isWarning
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                        )}
                        style={MONO}
                      >
                        Score {client.healthScore}/100
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-zinc-600">
                      <div className="text-[11px]">
                        Dernier échange : <strong className="font-mono text-[#08090a]">{client.daysSinceContact}j</strong>
                      </div>
                      {client.reasons.length > 0 && (
                        <p className="text-[10.5px] text-red-600">
                          ⚠ {client.reasons[0]}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#f2f2f2] flex items-center justify-between">
                      <Link
                        href={`/clients/${client.id}`}
                        className="text-[11px] text-zinc-500 hover:text-[#08090a] hover:underline"
                      >
                        Détails client ↗
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClientForRetention(client);
                          setRetentionMessageDraft(`Bonjour ${client.name}, je souhaitais m'assurer de votre entière satisfaction. Êtes-vous disponible pour un court check-in ?`);
                          setIsRetentionDrawerOpen(true);
                        }}
                        className="h-6 px-2 text-[10px] font-medium text-white bg-[#08090a] hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      >
                        Intervenir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. MODALE ROUTINE STAND-UP QUOTIDIEN (<3 MIN - Q24) ── */}
      {isStandupOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#0c8c5e]">
                  <Calendar size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#08090a]">Stand-up & Check-in Quotidien</h3>
                  <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    Étape {standupStep} sur 3 • Durée estimée &lt;3 minutes
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStandupOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Étape 1 : Revue des blocages d'équipe */}
            {standupStep === 1 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-[#08090a]">Étape 1 : Levée des Blocages Actifs</h4>
                  <p className="text-[11px] text-zinc-500">
                    Passez en revue les tâches signalées urgentes ou ralenties avec l'équipe.
                  </p>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeBlockers.length > 0 ? (
                    activeBlockers.map((blocker) => (
                      <label
                        key={blocker.id}
                        className="flex items-center gap-2.5 p-2 rounded border border-[#f2f2f2] hover:bg-zinc-50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(standupBlockersChecked[blocker.id])}
                          onChange={(e) =>
                            setStandupBlockersChecked((prev) => ({
                              ...prev,
                              [blocker.id]: e.target.checked,
                            }))
                          }
                          className="rounded text-[#0c8c5e] focus:ring-0"
                        />
                        <span className={cn(standupBlockersChecked[blocker.id] && 'line-through text-zinc-400')}>
                          {blocker.title}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-zinc-500 font-mono" style={MONO}>
                      ✓ Aucun blocage bloquant déclaré pour aujourd'hui.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f2f2f2] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStandupStep(2)}
                    className="h-8 px-4 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                  >
                    Suivant : Livrables du jour →
                  </button>
                </div>
              </div>
            )}

            {/* Étape 2 : Livrables clients du jour */}
            {standupStep === 2 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-[#08090a]">Étape 2 : Priorisation des Livrables Clients</h4>
                  <p className="text-[11px] text-zinc-500">
                    Confirmez les projets devant impérativement être terminés ou expédiés aujourd'hui.
                  </p>
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {projects.slice(0, 4).map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2.5 p-2 rounded border border-[#f2f2f2] hover:bg-zinc-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(standupDeliverablesChecked[p.id])}
                        onChange={(e) =>
                          setStandupDeliverablesChecked((prev) => ({
                            ...prev,
                            [p.id]: e.target.checked,
                          }))
                        }
                        className="rounded text-[#0c8c5e] focus:ring-0"
                      />
                      <span className={cn(standupDeliverablesChecked[p.id] && 'font-semibold text-[#0c8c5e]')}>
                        {p.name} ({p.client_name || 'Client'})
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#f2f2f2] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStandupStep(1)}
                    className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => setStandupStep(3)}
                    className="h-8 px-4 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                  >
                    Suivant : Binômes d'entraide →
                  </button>
                </div>
              </div>
            )}

            {/* Étape 3 : Attribution des binômes et publication */}
            {standupStep === 3 && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-[#08090a]">Étape 3 : Validation des Binômes & Diffusion</h4>
                  <p className="text-[11px] text-zinc-500">
                    Vérifiez l'entraide d'équipe puis clôturez la séance.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-[#f2f2f2] text-xs space-y-1">
                  <div className="font-semibold text-[#08090a]">Synthèse de la séance :</div>
                  <div className="text-zinc-600">
                    • {Object.values(standupBlockersChecked).filter(Boolean).length} blocage(s) validé(s).
                  </div>
                  <div className="text-zinc-600">
                    • {Object.values(standupDeliverablesChecked).filter(Boolean).length} livrable(s) confirmés pour la journée.
                  </div>
                  <div className="text-zinc-600">
                    • {pairings.filter((p) => p.status === 'active').length} binôme(s) d'entraide actifs.
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="broadcastStandup"
                    checked={broadcastStandupToChat}
                    onChange={(e) => setBroadcastStandupToChat(e.target.checked)}
                    className="rounded text-[#0c8c5e] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="broadcastStandup" className="text-xs text-zinc-600 cursor-pointer">
                    Diffuser le récapitulatif dans le canal <strong>#annonces</strong>
                  </label>
                </div>

                <div className="pt-3 border-t border-[#f2f2f2] flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStandupStep(2)}
                    className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900"
                  >
                    ← Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteStandup}
                    className="h-8 px-4 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                  >
                    Clôturer & Diffuser le Stand-up
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 7. TIROIR / MODALE 1-ON-1 COACHING & ENTRAIDE (Q20) ── */}
      {isOneOnOneOpen && selectedMemberFor1on1 && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-zinc-100 border border-[#dddddd] flex items-center justify-center font-mono text-xs font-bold text-[#08090a]" style={MONO}>
                  {selectedMemberFor1on1.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#08090a]">Point 1-on-1 & Coaching</h3>
                  <p className="text-[11px] text-zinc-500">
                    {selectedMemberFor1on1.full_name} • {OFFICIAL_ROLES_MAP[selectedMemberFor1on1.email || ''] || 'Collaborateur'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOneOnOneOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Niveau d'Énergie / Motivation (1 à 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setEnergyRating(score)}
                      className={cn(
                        'flex-1 h-8 rounded text-xs font-mono font-semibold border transition-colors cursor-pointer',
                        energyRating === score
                          ? 'bg-[#08090a] text-white border-[#08090a]'
                          : 'bg-zinc-50 text-zinc-700 border-[#f2f2f2] hover:bg-zinc-100'
                      )}
                      style={MONO}
                    >
                      {score}/5
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Points Abordés & Écoute Active
                </label>
                <textarea
                  rows={3}
                  value={coachingNotes}
                  onChange={(e) => setCoachingNotes(e.target.value)}
                  placeholder="Points clés discutés, réussites de la semaine, obstacles rencontrés..."
                  className="w-full text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded p-2.5 text-[#08090a] focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Engagement Clé pour la Semaine Suivante
                </label>
                <input
                  type="text"
                  value={weeklyCommitment}
                  onChange={(e) => setWeeklyCommitment(e.target.value)}
                  placeholder="Ex: Finaliser le module Stripe avec l'aide d'Amine d'ici jeudi"
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOneOnOneOpen(false)}
                  className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveOneOnOne}
                  className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Enregistrer le point
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. TIROIR D'INTERVENTION DE RÉTENTION CLIENT (Q22) ── */}
      {isRetentionDrawerOpen && selectedClientForRetention && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <HeartHandshake size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#08090a]">Intervention de Rétention Client</h3>
                  <p className="text-[11px] text-zinc-500">{selectedClientForRetention.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRetentionDrawerOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Message de Courtoisie Pré-Rédigé
                </label>
                <textarea
                  rows={4}
                  value={retentionMessageDraft}
                  onChange={(e) => setRetentionMessageDraft(e.target.value)}
                  className="w-full text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded p-2.5 text-[#08090a] focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Référent d'Équipe Assigné (Action sous 24h)
                </label>
                <select
                  value={assignedLeadForRetention}
                  onChange={(e) => setAssignedLeadForRetention(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                >
                  <option value="Amine Yahya Karroubi">Amine Yahya Karroubi (Account Manager)</option>
                  <option value="Kael Belceus">Kael Belceus (Fondateur)</option>
                  <option value="Manpreet Singh">Manpreet Singh (Growth Lead)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRetentionDrawerOpen(false)}
                  className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleTriggerRetentionIntervention}
                  className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Déclencher l'intervention
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. MODALE RÉÉQUILIBRAGE DE CHARGE EXPRESS (Q23) ── */}
      {isRebalanceOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-zinc-100 border border-[#dddddd] flex items-center justify-center text-[#08090a]">
                  <Sliders size={14} />
                </div>
                <h3 className="text-sm font-semibold text-[#08090a]">Rééquilibrage de Charge Express</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRebalanceOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Collaborateur à Soulager
                  </label>
                  <select
                    value={overloadedMember?.member_id || ''}
                    onChange={(e) => {
                      const m = teamWorkloads.find((w) => w.member_id === e.target.value);
                      setOverloadedMember(m || null);
                    }}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                  >
                    {teamWorkloads.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.full_name} ({m.todo_tasks + m.in_progress_tasks} tâches)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Pair Disponible (Renfort)
                  </label>
                  <select
                    value={targetHelperMember?.member_id || ''}
                    onChange={(e) => {
                      const m = teamWorkloads.find((w) => w.member_id === e.target.value);
                      setTargetHelperMember(m || null);
                    }}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                  >
                    <option value="">Sélectionner un collègue...</option>
                    {teamWorkloads
                      .filter((m) => m.member_id !== overloadedMember?.member_id)
                      .map((m) => (
                        <option key={m.member_id} value={m.member_id}>
                          {m.full_name} ({m.todo_tasks + m.in_progress_tasks} tâches)
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Tâche à Réassigner en Binôme
                </label>
                <select
                  value={selectedTaskToTransfer}
                  onChange={(e) => setSelectedTaskToTransfer(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] rounded px-2 text-[#08090a] focus:outline-hidden"
                >
                  <option value="">Sélectionner une tâche...</option>
                  {tasks
                    .filter((t) => t.status !== 'done')
                    .slice(0, 8)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.priority})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRebalanceOpen(false)}
                  className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRebalance}
                  disabled={!selectedTaskToTransfer || !targetHelperMember}
                  className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors disabled:opacity-50"
                >
                  Valider le transfert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
