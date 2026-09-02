'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  Target,
  Sparkles,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  Video,
  Code2,
  Building2,
  ShieldCheck,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  calculateHybridCommission,
  DEFAULT_SETUP_COMMISSION_RATE,
  DEFAULT_MRR_COMMISSION_RATE,
  DEFAULT_MONTHLY_QUOTA_CAD,
  QUOTA_BONUS_MULTIPLIER,
} from '@/lib/services/revops-team';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface RoleDepartmentInfo {
  key: 'sales' | 'video' | 'tech' | 'managing';
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  missions: string[];
  rituals_daily: string[];
  rituals_weekly: string[];
  kpis: string[];
  compensation: {
    base_description: string;
    commissions: string;
    quota_bonus: string;
    perks: string[];
  };
}

const DEPARTMENTS: RoleDepartmentInfo[] = [
  {
    key: 'sales',
    title: 'Ventes & Prospection (Closers / SDR)',
    badge: 'Acquisition',
    icon: Target,
    headline: 'Génération de pipeline, qualification terrain sur Minerva Reach et closing des contrats.',
    missions: [
      'Qualifier 30 à 50 leads ciblés par jour sur le marché de la restauration et du commerce local.',
      'Conduire 5 à 8 rendez-vous de démonstration de Minerva Flow et packs vidéo par semaine.',
      'Présenter des propositions commerciales et conclure les accords avec acompte Stripe 50%.',
      'Assurer un suivi CRM rigoureux avec relances automatisées sous 24 heures.',
    ],
    rituals_daily: [
      '09h00 : Standup d’équipe et revue des objectifs du jour.',
      '09h30 - 12h00 : Session de prospection active sur Minerva Reach (/today).',
      '14h00 - 17h00 : Appels de qualification, démos en visio et envoi des devis.',
    ],
    rituals_weekly: [
      'Lundi 10h00 : Revue du pipeline et arbitrage des opportunités chaudes.',
      'Vendredi 16h30 : Bilan hebdomadaire des closings et calcul des commissions.',
    ],
    kpis: [
      'Quota mensuel minimum : 10 000 $ CAD de valeur de deal.',
      'Taux de closing des démos : > 25%.',
      'Délai moyen de signature : < 7 jours.',
    ],
    compensation: {
      base_description: 'Fixe mensuel garanti selon palier d’expérience (2 500 $ - 3 500 $ CAD).',
      commissions: '10% sur les frais de setup initiaux encaissés + 5% récurrents sur le MRR du client.',
      quota_bonus: '+25% de bonus multiplicateur sur les commissions setup dès 10 000 $ de quota atteint.',
      perks: [
        'Accès illimité à l’Académie Minerva & scripts closers.',
        'Prise en charge des outils IA et téléphonie VoIP.',
        'Primes trimestrielles sur dépassement d’objectifs.',
      ],
    },
  },
  {
    key: 'video',
    title: 'Création & Vidéo (Creators / Monteurs)',
    badge: 'Production Créative',
    icon: Video,
    headline: 'Tournage cinéma sur place à Montréal et montage vertical dynamique 4K à haute viralité.',
    missions: [
      'Scénariser les hooks et les concepts visuels adaptés aux restaurants clients.',
      'Effectuer les tournages sur place avec équipement cinéma stabilisé et captation sonore 32-bit.',
      'Monter des vidéos verticales 9:16 percutantes avec sous-titres animés et sound design sous 72h.',
      'Collaborer avec l’équipe Ads pour décliner les vidéos organiques en publicités payantes.',
    ],
    rituals_daily: [
      'Matinée : Tournage sur site chez les clients (cuisine, plats vedettes, ambiance salle).',
      'Après-midi : Dérushage, étalonnage couleur et montage dynamique sur DaVinci/Premiere.',
      'Fin de journée : Exportation master 4K et soumission pour validation client.',
    ],
    rituals_weekly: [
      'Mardi : Cadrage des plannings de tournage de la semaine avec l’Account Manager.',
      'Jeudi : Analyse des métriques de rétention et vues organiques sur TikTok et Reels.',
    ],
    kpis: [
      'Délai de livraison du premier jet : < 72 heures ouvrées.',
      'Taux d’approbation sans modification majeure : > 80%.',
      'Objectif de viralité organique : > 15 000 vues moyennes par batch.',
    ],
    compensation: {
      base_description: 'Forfait fixe par pack produit (600 $ - 800 $ CAD par pack 8 vidéos) ou fixe mensuel.',
      commissions: 'Prime de performance virale (100 $ CAD par vidéo dépassant 25 000 vues organiques).',
      quota_bonus: 'Bonus volume (+15% dès 24 vidéos livrées et validées dans le mois).',
      perks: [
        'Défraiement des repas sur les tournages restaurants.',
        'Mise à disposition du matériel d’éclairage et stabilisation pro.',
      ],
    },
  },
  {
    key: 'tech',
    title: 'Tech & Systèmes (Développeurs / Intégrateurs)',
    badge: 'Ingénierie & QA',
    icon: Code2,
    headline: 'Développement de l’ERP Trequartista, intégration des POS Flow et maintien de la plateforme.',
    missions: [
      'Développer les nouvelles fonctionnalités Next.js 16 App Router, Supabase et Tailwind CSS.',
      'Assurer le déploiement et la configuration de Minerva Flow chez les restaurateurs.',
      'Maintenir le protocole QA 20-points d’assurance qualité avant toute mise en ligne.',
      'Surveiller la santé de l’infrastructure et garantir 99.9% de disponibilité.',
    ],
    rituals_daily: [
      '09h15 : Revue des issues GitHub, commits et tickets prioritaires.',
      'Journée : Sprints de développement TypeScript strict et tests d’intégration.',
      '17h00 : Validation des builds et vérification de la non-régression (tsc --noEmit).',
    ],
    rituals_weekly: [
      'Lundi : Définition des jalons du sprint technique.',
      'Vendredi : Déploiement des releases de production et mise à jour du CHANGELOG.',
    ],
    kpis: [
      'Zéro erreur TypeScript en production (mode strict absolu).',
      'Temps de réponse API moyen < 150ms.',
      'Passage 100% réussi du protocole QA 20-points.',
    ],
    compensation: {
      base_description: 'Rémunération d’ingénierie mensuelle fixe selon séniorité.',
      commissions: 'Prime de déploiement (100 $ CAD par établissement client Flow onboardé avec succès).',
      quota_bonus: 'Prime de stabilité infrastructure sans incident majeur.',
      perks: [
        'Budget matériel et abonnements IA (Copilot, Claude, Cursor).',
        'Horaires flexibles et travail asynchrone encouragé.',
      ],
    },
  },
  {
    key: 'managing',
    title: 'Opérations & Managing (Account Managers / Ops)',
    badge: 'Rétention & Succès',
    icon: Building2,
    headline: 'Accompagnement client d’excellence, équilibrage de charge d’équipe et rentabilité agence.',
    missions: [
      'Piloter l’onboarding des nouveaux clients dans les 48 heures suivant la signature du devis.',
      'Coordonner les équipes créatives et tech pour garantir le respect strict des échéances.',
      'Tenir les revues mensuelles de performance avec les propriétaires de restaurants.',
      'Assurer l’équilibrage de la charge de travail de l’équipe sur /team/workload.',
    ],
    rituals_daily: [
      '09h00 : Revue de l’équilibrage de charge et affectation des priorités d’équipe.',
      '11h00 : Check-in avec les clients en phase d’onboarding ou de cadrage.',
      '16h00 : Suivi de la facturation Stripe et gestion des demandes d’assistance.',
    ],
    rituals_weekly: [
      'Lundi : Planification hebdomadaire de la capacité de l’équipe.',
      'Mercredi : Point d’avancement des projets et résolution des goulets d’étranglement.',
    ],
    kpis: [
      'Taux de rétention client à 6 mois : > 90%.',
      'Net Promoter Score (NPS) client : > 65.',
      'Taux de charge d’équipe optimal : 75% - 85% de capacité.',
    ],
    compensation: {
      base_description: 'Fixe mensuel de gestion opérationnelle.',
      commissions: '5% sur les upsells de packs additionnels et contrats de maintenance.',
      quota_bonus: 'Bonus annuel de rétention client basé sur la valeur à vie (LTV).',
      perks: [
        'Participation aux décisions stratégiques et roadmap agence.',
        'Prise en charge des formations de management et leadership.',
      ],
    },
  },
];

export default function RolesAndCompensationPage() {
  const { workspace, role, fullName } = useCurrentUser();
  const [selectedDeptKey, setSelectedDeptKey] = useState<'sales' | 'video' | 'tech' | 'managing'>('sales');

  // Interactive Commission Calculator State
  const [dealAmount, setDealAmount] = useState<number>(3500);
  const [dealMrr, setDealMrr] = useState<number>(299);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(12000);

  const activeDepartment = DEPARTMENTS.find((d) => d.key === selectedDeptKey) || DEPARTMENTS[0];

  const calcResult = calculateHybridCommission(
    dealAmount,
    dealMrr,
    monthlyTotal,
    DEFAULT_MONTHLY_QUOTA_CAD,
    DEFAULT_SETUP_COMMISSION_RATE
  );

  return (
    <PageFadeIn className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── 1. Header Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-5 shadow-mv-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Gouvernance &amp; RH</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              4 Départements • Rémunération Hybride
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
            Fiches de Rôles, Rituels &amp; Modèle de Rémunération
          </h1>
          <p className="text-xs sm:text-sm text-mv-ink-soft max-w-2xl">
            Transparence intégrale sur les responsabilités quotidiennes, les critères de performance et la grille de commissions par département.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/team/workload"
            className="h-8 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Voir la Charge d'Équipe</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── 2. Department Selector Tabs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DEPARTMENTS.map((dept) => {
          const Icon = dept.icon;
          const isSelected = selectedDeptKey === dept.key;
          return (
            <button
              key={dept.key}
              onClick={() => setSelectedDeptKey(dept.key)}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2',
                isSelected
                  ? 'border-mv-green bg-emerald-50/40 shadow-xs ring-1 ring-mv-green/30'
                  : 'border-mv-border bg-mv-surface hover:border-zinc-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600')}>
                  <Icon className="w-4 h-4" />
                </div>
                <Badge variant={isSelected ? 'green' : 'neutral'}>{dept.badge}</Badge>
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 leading-tight">{dept.title}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 3. Active Department Full Dossier ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Responsabilités & Rituels (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="p-6 bg-mv-surface border-mv-border rounded-xl space-y-5 shadow-mv-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block mb-1">
                Mission Principale
              </span>
              <h2 className="text-base font-bold text-zinc-900 font-display">
                {activeDepartment.headline}
              </h2>
            </div>

            <div className="space-y-3 pt-3 border-t border-mv-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Livrables &amp; Tâches Obligatoires
              </h3>
              <ul className="space-y-2">
                {activeDepartment.missions.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-3 border-t border-mv-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Rituels d'Équipe Quotidiens &amp; Hebdomadaires
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-mv-cream-soft rounded-lg border border-mv-border space-y-1.5">
                  <span className="text-[10.5px] font-bold text-zinc-900 block flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>Rituels Quotidiens</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-zinc-600">
                    {activeDepartment.rituals_daily.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-mv-cream-soft rounded-lg border border-mv-border space-y-1.5">
                  <span className="text-[10.5px] font-bold text-zinc-900 block flex items-center gap-1.5">
                    <Award className="w-3 h-3 text-purple-600" />
                    <span>Points Hebdomadaires</span>
                  </span>
                  <ul className="space-y-1 text-[11px] text-zinc-600">
                    {activeDepartment.rituals_weekly.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-mv-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Indicateurs Clés de Performance (KPIs)
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeDepartment.kpis.map((kpi, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-800">
                    {kpi}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Grille de Rémunération & Simulateur (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Compensation Breakdown Card */}
          <Card className="p-6 bg-mv-surface border-mv-border rounded-xl space-y-4 shadow-mv-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Structure de Rémunération</span>
              </h3>
              <Badge variant="green">Transparence 100%</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-zinc-500 uppercase tracking-wider block">
                  1. Rémunération de Base
                </span>
                <p className="font-semibold text-zinc-900">{activeDepartment.compensation.base_description}</p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider block">
                  2. Commissions &amp; Variable
                </span>
                <p className="font-semibold text-emerald-950">{activeDepartment.compensation.commissions}</p>
              </div>

              <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200/80 space-y-1">
                <span className="text-[10.5px] font-bold text-purple-700 uppercase tracking-wider block">
                  3. Accélérateur de Quota
                </span>
                <p className="font-semibold text-purple-950">{activeDepartment.compensation.quota_bonus}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-mv-border space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Avantages &amp; Équipement</span>
              <ul className="space-y-1 text-[11px] text-zinc-600">
                {activeDepartment.compensation.perks.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Interactive Hybrid Commission Simulator */}
          <Card className="p-6 bg-zinc-900 text-white rounded-xl space-y-4 shadow-mv-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Simulateur de Commission RevOps
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                Moteur Officiel
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Montant du Setup Deal (CAD)</label>
                <input
                  type="number"
                  step="100"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  style={MONO}
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">MRR Mensuel Signé (CAD)</label>
                <input
                  type="number"
                  step="50"
                  value={dealMrr}
                  onChange={(e) => setDealMrr(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  style={MONO}
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Total Réalisé ce Mois (Pour quota 10k$)</label>
                <input
                  type="number"
                  step="500"
                  value={monthlyTotal}
                  onChange={(e) => setMonthlyTotal(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  style={MONO}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-300 font-mono" style={MONO}>
                <span>Commission Setup (10% {calcResult.isQuotaAchieved ? 'x1.25' : ''}) :</span>
                <span className="font-bold text-white">{calcResult.setupCommissionCad.toFixed(2)} $</span>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300 font-mono" style={MONO}>
                <span>Commission MRR Récurrente (5%) :</span>
                <span className="font-bold text-white">{calcResult.mrrCommissionCad.toFixed(2)} $ / mo</span>
              </div>
              <div className="pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
                <span className="text-xs font-bold text-emerald-400">Gain Total Estimé :</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono" style={MONO}>
                  {calcResult.totalCommissionCad.toFixed(2)} $ CAD
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageFadeIn>
  );
}
