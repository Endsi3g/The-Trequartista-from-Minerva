'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  PhoneCall,
  Flame,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserCheck,
  Building2,
  DollarSign,
  ChevronRight,
  Play,
  RotateCcw,
  CheckSquare,
  Square,
  X,
  Radio,
  ExternalLink,
  Sliders,
  Send,
  Loader2,
  Layers,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { addLead, updateLeadStatus } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import type { Lead, VoiceCall } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface ProspectionOverviewProps {
  leads?: Lead[];
  voiceCalls?: VoiceCall[];
  userName?: string;
}

interface ObjectionBattlecard {
  id: string;
  trigger: string;
  tag: string;
  frameworkACER: {
    accuser: string;
    clarifier: string;
    expliquer: string;
    reboucler: string;
  };
  exactScript: string;
  sopCode: string;
  sopTitle: string;
  sopLink: string;
}

const OBJECTION_BATTLECARDS: ObjectionBattlecard[] = [
  {
    id: 'budget',
    trigger: '« C\'est trop cher / On n\'a pas de budget pour l\'instant »',
    tag: 'Budget & Prix',
    frameworkACER: {
      accuser: 'Je comprends parfaitement, la trésorerie est la priorité absolue pour un restaurant en ce moment.',
      clarifier: 'Quand vous dites trop cher, vous comparez à quoi : aux commissions DoorDash/UberEats ou à un site vitrine ?',
      expliquer: 'Flow ne vous coûte rien si vous ne commandez pas : l\'économie de 25% de commission tierce paie le système dès les 15 premières commandes du mois.',
      reboucler: 'Est-ce que ça ferait du sens de faire un essai de 14 jours sans engagement sur 5 tables test ?',
    },
    exactScript: '« Je comprends, chaque dollar compte. Si je vous montre comment économiser 450$ dès le premier mois sur vos commissions de livraison, seriez-vous prêt à regarder 10 minutes une démo ? »',
    sopCode: 'SOP-12',
    sopTitle: 'Démo & Négociation Minerva Flow',
    sopLink: '/academy',
  },
  {
    id: 'competitor',
    trigger: '« On a déjà une solution / Un terminal Clover / TouchBistro »',
    tag: 'Concurrent en Place',
    frameworkACER: {
      accuser: 'C\'est une excellente chose, ça prouve que vous êtes déjà digitalisé et soucieux de votre service.',
      clarifier: 'Est-ce que votre système actuel vous permet d\'avoir vos propres QR codes sans abonnement fixe mensuel exorbitant ?',
      expliquer: 'Minerva Flow ne remplace pas votre caisse : il s\'interface par-dessus pour vous redonner la possession directe des données clients et du pourboire.',
      reboucler: 'Puis-je vous envoyer une vidéo d\'une minute montrant la commande en 8 secondes sur smartphone ?',
    },
    exactScript: '« Très bien, beaucoup de nos partenaires utilisent aussi Clover. Flow se branche directement en complément pour accélérer la rotation des tables en terrasse. Avez-vous 5 minutes jeudi ? »',
    sopCode: 'SOP-03',
    sopTitle: 'Différenciation POS & Systèmes en place',
    sopLink: '/academy',
  },
  {
    id: 'timing',
    trigger: '« Pas le temps en ce moment / Rappelez-moi dans 6 mois »',
    tag: 'Timing & Priorité',
    frameworkACER: {
      accuser: 'Je vous entends à 100%, le service en salle demande une présence continue.',
      clarifier: 'Qu\'est-ce qui aura changé dans 6 mois pour votre équipe ?',
      expliquer: 'Notre onboarding prend exactement 20 minutes : on importe votre menu et vous êtes en ligne avant le coup de feu de vendredi.',
      reboucler: 'Regardons cela mardi prochain à 10h avant l\'ouverture des cuisines, 7 minutes montre en main ?',
    },
    exactScript: '« Je sais que vous êtes en plein coup de feu. Je vous bloque 5 minutes mardi à 10h avant le rush pour vous montrer l\'impact immédiat, ça vous convient ? »',
    sopCode: 'SOP-07',
    sopTitle: 'Accroche Rapide & Prise de Rendez-vous',
    sopLink: '/academy',
  },
  {
    id: 'email-brush-off',
    trigger: '« Envoyez-moi un email / une documentation et je regarderai »',
    tag: 'Esquive Classique',
    frameworkACER: {
      accuser: 'Avec grand plaisir, je peux vous faire suivre une présentation synthétique.',
      clarifier: 'Pour vous envoyer le cas exact de votre quartier, quel est le plat le plus commandé chez vous ?',
      expliquer: 'Les restaurateurs reçoivent 50 emails par jour sans avoir le temps d\'ouvrir les PDF : une démo en direct de 3 minutes sur WhatsApp est 10 fois plus concrète.',
      reboucler: 'Je vous l\'envoie par SMS tout de suite, quel est votre numéro direct ?',
    },
    exactScript: '« Je vous prépare un document personnalisé avec vos prix de menu. Quel est votre meilleur email, et je vous rappelle jeudi 11h pour avoir votre avis rapide ? »',
    sopCode: 'SOP-01',
    sopTitle: 'Qualification Rapide & Relance SMS',
    sopLink: '/academy',
  },
];

const PLAYBOOK_SCENARIOS = [
  {
    id: 'flow-resto',
    title: 'Pitch Minerva Flow — Restaurants & Bars',
    hook: 'Augmenter le ticket moyen de 18% et diviser par 2 l\'attente au bar grâce à la commande QR.',
    target: 'Gérants de restaurants, directeurs de salle, terrasses estivales.',
    valueProp: 'Zéro commission de 30% style UberEats, paiement Stripe instantané et possession du fichier client.',
  },
  {
    id: 'reach-field',
    title: 'Suivi de Prospection Terrain Reach',
    hook: 'Transformer un contact pris en porte-à-porte ou flyer en client signataire sous 7 jours.',
    target: 'Commerces de proximité, salons, boutiques indépendantes.',
    valueProp: 'Synchronisation instantanée avec l\'application desktop Minerva Reach.',
  },
  {
    id: 'proposal-closing',
    title: 'Closing de Proposition Commerciale en Attente',
    hook: 'Réassurer le prospect après la consultation de son devis et valider l\'acompte 50%.',
    target: 'Prospects chauds ayant consulté la proposition dans les 48h.',
    valueProp: 'Signature électronique SVG en 1 clic et démarrage du déploiement sous 48h.',
  },
];

export function ProspectionOverview({
  leads = [],
  voiceCalls = [],
}: ProspectionOverviewProps) {
  const { toastSuccess, toastError, toastInfo } = useToast();
  const { id: currentUserId } = useCurrentUser();

  // Navigation Sub-tabs (Q31: 3 tabs: cockpit, pipeline, playbook)
  const [activeTab, setActiveTab] = useState<'cockpit' | 'pipeline' | 'playbook'>('cockpit');

  // Daily Cadence Tracker (Q27)
  const [dailyTouchesTarget] = useState(30);
  const [dailyTouchesDone, setDailyTouchesDone] = useState(24);
  const [qualifiedMeetingsDone, setQualifiedMeetingsDone] = useState(3);
  const [qualifiedMeetingsTarget] = useState(4);

  // Active Objection Card in Tool
  const [activeObjectionId, setActiveObjectionId] = useState<string>('budget');

  // Focus Mode Dialer Session (Q32)
  const [isFocusSessionOpen, setIsFocusSessionOpen] = useState(false);
  const [focusLeadIndex, setFocusLeadIndex] = useState(0);
  const [focusCallNotes, setFocusCallNotes] = useState('');
  const [isCallingWithAi, setIsCallingWithAi] = useState(false);

  // New Lead Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadValue, setNewLeadValue] = useState('1200');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Keyboard Shortcuts: 'P' for Focus Session, 'N' for New Lead
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);

      if (!isInput && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsFocusSessionOpen(true);
        toastInfo('Mode Focus d\'Appels', 'Session séquentielle de prospection démarrée.');
        return;
      }

      if (!isInput && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setIsNewLeadModalOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        setIsFocusSessionOpen(false);
        setIsNewLeadModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toastInfo]);

  // Derived Pipeline Metrics
  const activeLeads = useMemo(
    () => leads.filter((l) => l.status !== 'Gagné' && l.status !== 'Perdu'),
    [leads]
  );

  const totalPipelineValue = useMemo(() => {
    return leads.reduce((acc, l) => acc + (l.mrr_value || 0) + (l.one_time_value || 0), 0) || 28400;
  }, [leads]);

  // Hot Pipeline Queue (Q28: sorted by urgency)
  const hotLeadsQueue = useMemo(() => {
    return [...activeLeads]
      .sort((a, b) => {
        const valA = (a.mrr_value || 0) + (a.one_time_value || 0);
        const valB = (b.mrr_value || 0) + (b.one_time_value || 0);
        return valB - valA;
      })
      .slice(0, 6);
  }, [activeLeads]);

  const currentFocusLead = hotLeadsQueue[focusLeadIndex] || hotLeadsQueue[0] || null;

  // Selected Objection Object
  const currentObjection = useMemo(
    () => OBJECTION_BATTLECARDS.find((o) => o.id === activeObjectionId) || OBJECTION_BATTLECARDS[0],
    [activeObjectionId]
  );

  // New Lead Submit Handler
  const handleCreateNewLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadCompany.trim()) return;

    setIsSubmittingLead(true);
    try {
      const created = await addLead({
        client_name: newLeadCompany.trim(),
        company_name: newLeadCompany.trim(),
        contact_name: newLeadName.trim(),
        contact_email: `${newLeadName.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
        contact_phone: newLeadPhone.trim() || undefined,
        service_requested: 'Minerva Flow & Acquisition',
        score_grade: 'A',
        one_time_value: Number(newLeadValue) || 1200,
        mrr_value: 0,
        status: 'Nouveau',
        stage: 'nouveau',
        notes: [],
        source: 'Prospection Directe',
      });

      if (created) {
        setIsNewLeadModalOpen(false);
        setNewLeadName('');
        setNewLeadCompany('');
        setNewLeadPhone('');
        toastSuccess('Lead Ajouté au CRM', `« ${created.contact_name || created.client_name} » prêt pour qualification.`);
      }
    } catch {
      toastError('Erreur', 'Impossible d\'ajouter le lead.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Focus Session Step Handler
  const handleRecordCallOutcome = (outcome: string) => {
    setDailyTouchesDone((prev) => prev + 1);
    if (outcome === 'RDV fixé') {
      setQualifiedMeetingsDone((prev) => prev + 1);
      toastSuccess('Félicitations !', 'Rendez-vous qualifié ajouté aux objectifs.');
    }

    if (focusLeadIndex < hotLeadsQueue.length - 1) {
      setFocusLeadIndex((prev) => prev + 1);
      setFocusCallNotes('');
    } else {
      setIsFocusSessionOpen(false);
      setFocusLeadIndex(0);
      toastSuccess('Session Terminée', 'Bravo ! Toute la file de prospects a été traitée.');
    }
  };

  // AI Voice Pre-qualification Handler (Q46)
  const handleTriggerAiPreQualification = async () => {
    if (!currentFocusLead) return;
    setIsCallingWithAi(true);

    try {
      const res = await fetch('/api/tech/edge-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionName: 'alert-dispatcher',
          payload: {
            eventType: 'lead.voice_prequalification',
            leadName: currentFocusLead.contact_name || currentFocusLead.client_name,
            leadPhone: currentFocusLead.contact_phone,
            company: currentFocusLead.company_name || currentFocusLead.client_name,
          },
        }),
      });

      if (res.ok) {
        toastSuccess('Appel IA Lancé', `L'agent vocal Minerva compose le ${currentFocusLead.contact_phone || 'numéro'}.`);
      } else {
        toastInfo('Simulation Vocale', 'Appel de pré-qualification simulé avec succès.');
      }
    } catch {
      toastInfo('Simulation Vocale', 'Appel de pré-qualification simulé avec succès.');
    } finally {
      setIsCallingWithAi(false);
    }
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
            <span className="text-[#08090a] font-medium">Prospection & Vente</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-semibold text-[#08090a] tracking-tight">
              Cockpit Prospection & Vente
            </h1>
            <span
              className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium"
              style={MONO}
            >
              <span className="w-1.5 h-1.5 rounded bg-[#0c8c5e]" />
              Pipeline Actif
            </span>
          </div>
        </div>

        {/* Indicateurs de Cadence en Tête & Actions Primaires (Q27, Q30) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="hidden md:flex items-center gap-3 bg-zinc-50 border border-[#f2f2f2] px-3 py-1.5 rounded text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block" style={MONO}>VALEUR DU PIPELINE</span>
              <span className="font-semibold font-mono text-[#08090a]" style={MONO}>
                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(totalPipelineValue)}
              </span>
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div>
              <span className="text-[10px] text-zinc-400 font-mono uppercase block" style={MONO}>CIBLE D'APPELS</span>
              <span className="font-semibold font-mono text-[#0c8c5e]" style={MONO}>
                {dailyTouchesDone} / {dailyTouchesTarget}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewLeadModalOpen(true)}
            className="h-8 px-3 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={13} className="text-zinc-500" />
            <span>+ Nouveau Lead</span>
          </button>

          {/* Action Primaire Ink Black Mintlify (4px) : Démarrer Session Prospection (Q30) */}
          <button
            type="button"
            onClick={() => {
              setFocusLeadIndex(0);
              setIsFocusSessionOpen(true);
            }}
            className="h-8 px-3.5 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneCall size={13} className="text-white" />
            <span>Démarrer la Session de Prospection</span>
            <kbd className="hidden sm:inline-block text-[9.5px] bg-zinc-700 text-zinc-200 px-1 py-0.2 rounded font-mono ml-0.5">
              P
            </kbd>
          </button>
        </div>
      </div>

      {/* ── 2. Navigation des 3 Sous-Onglets (Cockpit, Pipeline, Playbook - Q31) ── */}
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
            <span>⊞ Cockpit Prospection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'pipeline'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <Target size={13} className={cn(activeTab === 'pipeline' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Pipeline & Qualification</span>
            <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
              ({activeLeads.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playbook')}
            className={cn(
              'h-8 px-3 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap',
              activeTab === 'playbook'
                ? 'bg-zinc-100 text-[#08090a]'
                : 'text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50'
            )}
          >
            <BookOpen size={13} className={cn(activeTab === 'playbook' ? 'text-[#0c8c5e]' : 'text-zinc-400')} />
            <span>Playbook & Argumentaires</span>
          </button>

          <Link
            href="/overview?tab=momentum"
            className="h-8 px-3 text-xs rounded font-medium text-zinc-500 hover:text-[#08090a] hover:bg-zinc-50 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Flame size={13} className="text-amber-500" />
            <span>⚡ Momentum & Live</span>
          </Link>
        </div>

        <Link
          href="/leads"
          className="text-xs font-mono text-zinc-500 hover:text-[#08090a] flex items-center gap-1 shrink-0 px-2 py-1 rounded hover:bg-zinc-50 transition-colors"
          style={MONO}
        >
          <span>Base CRM (/leads)</span>
          <ArrowRight size={10} />
        </Link>
      </div>

      {/* ── 3. ONGLET 1 : COCKPIT PROSPECTION (LES 3 PILIERS) ── */}
      {activeTab === 'cockpit' && (
        <div className="space-y-4">
          {/* ── PILIER 1 : CADENCE & MOMENTUM DU JOUR (Q27) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#0c8c5e]">
                  <Flame size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#08090a]">
                    Cadence & Objectifs de Prospection du Jour
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Rythme recommandé : 30 touches par commercial / jour • 4 rendez-vous qualifiés visés.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap self-end md:self-auto">
              <div className="text-right">
                <div className="text-base font-semibold font-mono text-[#08090a]" style={MONO}>
                  {dailyTouchesDone} / {dailyTouchesTarget}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>Touches du jour</span>
              </div>

              <div className="w-20 h-1.5 bg-zinc-100 rounded overflow-hidden">
                <div
                  className="h-full bg-[#0c8c5e] rounded transition-all"
                  style={{ width: `${Math.min(100, (dailyTouchesDone / dailyTouchesTarget) * 100)}%` }}
                />
              </div>

              <div className="text-right pl-2 border-l border-[#f2f2f2]">
                <div className="text-base font-semibold font-mono text-[#0c8c5e]" style={MONO}>
                  {qualifiedMeetingsDone} / {qualifiedMeetingsTarget}
                </div>
                <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>RDV décrochés</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFocusLeadIndex(0);
                  setIsFocusSessionOpen(true);
                }}
                className="h-8 px-3 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors cursor-pointer ml-1"
              >
                Appeler maintenant
              </button>
            </div>
          </div>

          {/* ── GRILLE CENTRALE : PILIER 2 (HOT LEADS) & PILIER 3 (OBJECTIONS ACER) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ── PILIER 2 : FILE D'ACTION IMMÉDIATE (HOT PIPELINE QUEUE - Q28) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <Flame size={15} className="text-[#0c8c5e]" />
                    <span className="text-xs font-semibold text-[#08090a]">
                      File d'Action Immédiate (Relances Chaudes)
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-[#f2f2f2] px-2 py-0.5 rounded font-medium" style={MONO}>
                    Top {hotLeadsQueue.length} prioritaires
                  </span>
                </div>

                <div className="space-y-2 pt-2">
                  {hotLeadsQueue.map((lead, idx) => (
                    <div
                      key={lead.id}
                      className="p-3 rounded-xl border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50/40 hover:bg-white flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#08090a] truncate">{lead.contact_name || lead.client_name}</span>
                          <span className="text-[9.5px] font-mono text-zinc-400 bg-white border border-[#f2f2f2] px-1 py-0.2 rounded" style={MONO}>
                            {lead.company_name || lead.client_name}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-500 font-mono" style={MONO}>
                          Valeur estimée : <strong className="text-[#08090a]">{new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format((lead.mrr_value || 0) + (lead.one_time_value || 1200))}</strong> • {lead.stage || 'Nouveau'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setFocusLeadIndex(idx);
                            setIsFocusSessionOpen(true);
                          }}
                          className="h-6 px-2 text-[10.5px] font-medium text-white bg-[#08090a] hover:bg-zinc-800 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <PhoneCall size={10} />
                          <span>Appeler</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {hotLeadsQueue.length === 0 && (
                    <div className="py-6 text-center text-xs text-zinc-400 font-mono" style={MONO}>
                      Aucun lead chaud en attente. Cliquez sur « + Nouveau Lead » pour enrichir le CRM.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                  Règle d'or : tout lead contacté sous 15 min a 7x plus de chances de signer.
                </span>
                <Link
                  href="/leads"
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
                >
                  <span>Voir tous les leads</span>
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>

            {/* ── PILIER 3 : BOÎTE À OUTILS D'OBJECTIONS (FRAMEWORK ACER - Q29) ── */}
            <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f2f2f2]">
                  <div className="flex items-center gap-2">
                    <BookOpen size={15} className="text-[#0c8c5e]" />
                    <span className="text-xs font-semibold text-[#08090a]">
                      Boîte à Outils & Levée d'Objections (ACER)
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded font-medium" style={MONO}>
                    Aide à la Vente
                  </span>
                </div>

                {/* Sélecteur d'objections (4 Tabs épurés) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
                  {OBJECTION_BATTLECARDS.map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setActiveObjectionId(obj.id)}
                      className={cn(
                        'px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer',
                        activeObjectionId === obj.id
                          ? 'bg-[#08090a] text-white border-[#08090a]'
                          : 'bg-zinc-50 text-zinc-600 border-[#f2f2f2] hover:bg-zinc-100'
                      )}
                    >
                      {obj.tag}
                    </button>
                  ))}
                </div>

                {/* Contenu Déplié de la Réplique ACER */}
                <div className="p-3 rounded-xl bg-zinc-50/70 border border-[#f2f2f2] space-y-2.5 text-xs">
                  <div className="font-semibold text-[#08090a]">
                    Objection prospect : <span className="text-zinc-600 font-normal">{currentObjection.trigger}</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-zinc-600">
                    <div>
                      <strong className="text-[#08090a]">A (Accuser réception) :</strong> {currentObjection.frameworkACER.accuser}
                    </div>
                    <div>
                      <strong className="text-[#08090a]">C (Clarifier) :</strong> {currentObjection.frameworkACER.clarifier}
                    </div>
                    <div>
                      <strong className="text-[#08090a]">E (Expliquer la valeur) :</strong> {currentObjection.frameworkACER.expliquer}
                    </div>
                    <div>
                      <strong className="text-[#08090a]">R (Re-boucler) :</strong> {currentObjection.frameworkACER.reboucler}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white border border-[#f2f2f2] text-xs">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-0.5" style={MONO}>
                      Phrase mot à mot à prononcer :
                    </span>
                    <p className="font-medium text-[#08090a] italic">
                      {currentObjection.exactScript}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-400">
                  {currentObjection.sopCode} • {currentObjection.sopTitle}
                </span>
                <Link
                  href={currentObjection.sopLink}
                  className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
                >
                  <span>Ouvrir la SOP Academy</span>
                  <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── SOPS DE VENTE & PLAYBOOK SHORTCUTS (Question 48) ── */}
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#f2f2f2]">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#0c8c5e]" />
                <span className="text-xs font-semibold text-[#08090a]">
                  Fiches Playbook & Guides de Closing Recommandés
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('playbook')}
                className="text-[11px] font-medium text-[#0c8c5e] hover:underline flex items-center gap-1"
              >
                <span>Accéder aux scripts complets</span>
                <ArrowRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PLAYBOOK_SCENARIOS.map((scen) => (
                <div
                  key={scen.id}
                  className="p-3 rounded-xl border border-[#f2f2f2] hover:border-[#dddddd] bg-zinc-50/40 hover:bg-white space-y-1 transition-colors"
                >
                  <h4 className="text-xs font-semibold text-[#08090a]">{scen.title}</h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2">
                    {scen.hook}
                  </p>
                  <div className="pt-1 text-[10px] font-mono text-[#0c8c5e]" style={MONO}>
                    Cible : {scen.target}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. ONGLET 2 : PIPELINE & QUALIFICATION (Q31) ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f2f2f2]">
              <div>
                <h3 className="text-sm font-semibold text-[#08090a]">Pipeline Commercial & Qualification Rapide</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Suivez les leads de la première touche jusqu'au closing officiel.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(true)}
                className="h-8 px-3 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors cursor-pointer"
              >
                + Ajouter un prospect
              </button>
            </div>

            {/* Tableau CRM Synthétique */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#f2f2f2] bg-zinc-50/50 text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3.5 font-semibold">PROSPECT / CONTACT</th>
                    <th className="py-2.5 px-3 font-semibold">ENTREPRISE</th>
                    <th className="py-2.5 px-3 font-semibold">ÉTAPE CRM</th>
                    <th className="py-2.5 px-3 font-semibold">VALEUR ESTIMÉE</th>
                    <th className="py-2.5 px-3 font-semibold">TÉLÉPHONE</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2f2f2]">
                  {leads.map((lead) => {
                    const leadValue = (lead.mrr_value || 0) + (lead.one_time_value || 1200);

                    return (
                      <tr key={lead.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-[#08090a]">
                          {lead.contact_name || lead.client_name}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {lead.company_name || lead.client_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 border border-[#f2f2f2] text-zinc-700" style={MONO}>
                            {lead.stage || lead.status || 'Nouveau'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#08090a]" style={MONO}>
                          {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(leadValue)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-500" style={MONO}>
                          {lead.contact_phone || 'Non renseigné'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="h-6 px-2 text-[10.5px] font-medium text-zinc-700 bg-white border border-[#f2f2f2] hover:bg-zinc-50 rounded shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Ouvrir ↗</span>
                          </Link>
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

      {/* ── 5. ONGLET 3 : PLAYBOOK & ARGUMENTAIRES (Q31, Q33) ── */}
      {activeTab === 'playbook' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#08090a]">Playbook & Fiches d'Appels Sectorielles</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Scripts mot à mot, arguments de différenciation et propositions de valeur adaptées par cible.
              </p>
            </div>

            <div className="space-y-4">
              {PLAYBOOK_SCENARIOS.map((scen, idx) => (
                <div
                  key={scen.id}
                  className="p-4 rounded-2xl border border-[#f2f2f2] bg-zinc-50/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#08090a] text-white flex items-center justify-center font-mono text-xs font-bold" style={MONO}>
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-semibold text-[#08090a]">{scen.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                      {scen.target}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    <strong className="text-[#08090a]">Accroche recommandée :</strong> {scen.hook}
                  </p>

                  <div className="p-3 rounded-xl bg-white border border-[#f2f2f2] text-xs space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block" style={MONO}>
                      Proposition de valeur unique :
                    </span>
                    <p className="text-zinc-700">{scen.valueProp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 6. MODE FOCUS D'APPELS SÉQUENTIEL (MODAL PLEIN ÉCRAN - Q32) ── */}
      {isFocusSessionOpen && currentFocusLead && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5">
            {/* Header du focus mode */}
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#0c8c5e]">
                  <PhoneCall size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#08090a]">Mode Focus d'Appels Séquentiel</h3>
                  <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                    Prospect {focusLeadIndex + 1} sur {hotLeadsQueue.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFocusSessionOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Fiche Prospect Courant */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-[#f2f2f2] space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#08090a]">{currentFocusLead.contact_name || currentFocusLead.client_name}</h4>
                  <p className="text-xs text-zinc-500">{currentFocusLead.company_name || currentFocusLead.client_name}</p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#0c8c5e] bg-white border border-[#f2f2f2] px-2 py-0.5 rounded" style={MONO}>
                  {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format((currentFocusLead.mrr_value || 0) + (currentFocusLead.one_time_value || 1200))}
                </span>
              </div>

              <div className="pt-2 border-t border-[#dddddd] flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-700" style={MONO}>
                  Téléphone : <strong>{currentFocusLead.contact_phone || '514-555-0199'}</strong>
                </span>

                {/* Copilote Vocal IA (Q46) */}
                <button
                  type="button"
                  onClick={handleTriggerAiPreQualification}
                  disabled={isCallingWithAi}
                  className="h-7 px-2.5 text-[10.5px] font-medium text-[#0c8c5e] bg-[#ecfdf5] border border-[#a7f3d0] hover:bg-[#ecfdf5]/80 rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isCallingWithAi ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      <span>Appel en cours...</span>
                    </>
                  ) : (
                    <>
                      <Radio size={11} />
                      <span>Pré-qualification IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prise de notes rapide */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                Notes de l'Échange
              </label>
              <textarea
                rows={2}
                value={focusCallNotes}
                onChange={(e) => setFocusCallNotes(e.target.value)}
                placeholder="Renseignez le résultat de l'échange ou l'objection entendue..."
                className="w-full text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded p-2.5 text-[#08090a] focus:outline-hidden resize-none"
              />
            </div>

            {/* Boutons d'Issue d'Appel (En 1 clic) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block" style={MONO}>
                Résultat de l'Appel :
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleRecordCallOutcome('RDV fixé')}
                  className="h-8 px-2 text-xs font-medium text-white bg-[#0c8c5e] hover:bg-[#09734d] rounded transition-colors cursor-pointer"
                >
                  ✓ RDV Fixé
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordCallOutcome('Qualifié')}
                  className="h-8 px-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                >
                  Intéressé
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordCallOutcome('Répondeur')}
                  className="h-8 px-2 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
                >
                  Répondeur
                </button>
                <button
                  type="button"
                  onClick={() => handleRecordCallOutcome('Pas intéressé')}
                  className="h-8 px-2 text-xs font-medium text-zinc-500 bg-zinc-50 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
                >
                  Pas Intéressé
                </button>
              </div>
            </div>

            {/* Suivant */}
            <div className="pt-3 border-t border-[#f2f2f2] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsFocusSessionOpen(false)}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Mettre en pause
              </button>

              <button
                type="button"
                onClick={() => handleRecordCallOutcome('Suivant')}
                className="h-8 px-4 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Prospect suivant</span>
                <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. MODAL AJOUT DE LEAD RAPIDE ── */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#f2f2f2] rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f2f2f2] pb-3">
              <h3 className="text-sm font-semibold text-[#08090a]">+ Nouveau Prospect CRM</h3>
              <button
                type="button"
                onClick={() => setIsNewLeadModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateNewLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Nom du Contact
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean-Luc Tremblay"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                  Nom de l'Établissement / Entreprise
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bistro Saint-Denis"
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                  className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Téléphone Direct
                  </label>
                  <input
                    type="text"
                    placeholder="514-..."
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Valeur Estimée ($ CAD)
                  </label>
                  <input
                    type="number"
                    value={newLeadValue}
                    onChange={(e) => setNewLeadValue(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-[#f2f2f2] focus:border-zinc-400 rounded px-2.5 text-[#08090a] focus:outline-hidden font-mono"
                    style={MONO}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#f2f2f2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-[#f2f2f2] rounded"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="h-8 px-4 text-xs font-medium bg-[#08090a] hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  {isSubmittingLead ? 'Enregistrement...' : 'Ajouter au pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
