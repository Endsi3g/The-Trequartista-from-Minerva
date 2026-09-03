'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Target,
  Video,
  Code2,
  Building2,
  ChevronRight,
  Calculator,
  CheckCircle2,
  Sparkles,
  Gauge,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
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
  shortLabel: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  missions: string[];
  rituals_daily: { time: string; activity: string }[];
  rituals_weekly: { time: string; activity: string }[];
  kpis: { label: string; target: string }[];
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
    shortLabel: 'Acquisition',
    title: 'Ventes & Prospection (Closers / SDR)',
    badge: 'Acquisition',
    icon: Target,
    headline: 'Génération de pipeline, qualification terrain sur Minerva Reach et closing des contrats.',
    missions: [
      'Qualifier 30 à 50 leads ciblés par jour sur le marché de la restauration et du commerce local montréalais.',
      'Conduire 5 à 8 rendez-vous de démonstration de Minerva Flow et packs vidéo par semaine.',
      'Présenter des propositions commerciales et conclure les accords avec acompte Stripe 50%.',
      'Assurer un suivi CRM rigoureux avec relances automatisées sous 24 heures.',
    ],
    rituals_daily: [
      { time: '09h00', activity: 'Standup d’équipe et revue des objectifs du jour' },
      { time: '09h30 - 12h00', activity: 'Session de prospection active sur Minerva Reach (/today)' },
      { time: '14h00 - 17h00', activity: 'Appels de qualification, démos en visio et envoi des devis' },
    ],
    rituals_weekly: [
      { time: 'Lundi 10h00', activity: 'Revue du pipeline et arbitrage des opportunités chaudes' },
      { time: 'Vendredi 16h30', activity: 'Bilan hebdomadaire des closings et calcul des commissions' },
    ],
    kpis: [
      { label: 'Quota mensuel minimum', target: '10 000 $ CAD' },
      { label: 'Taux closing des démos', target: '> 25%' },
      { label: 'Délai moyen signature', target: '< 7 jours' },
    ],
    compensation: {
      base_description: 'Fixe garanti selon expérience (2 500 $ - 3 500 $ CAD/mois).',
      commissions: '10% sur les frais de setup initiaux + 5% récurrents sur le MRR du client.',
      quota_bonus: '+25% de bonus multiplicateur sur commissions setup dès 10 000 $ de quota.',
      perks: [
        'Accès illimité à l’Académie Minerva & scripts closers',
        'Prise en charge des outils IA et téléphonie VoIP',
        'Primes trimestrielles sur dépassement d’objectifs',
      ],
    },
  },
  {
    key: 'video',
    shortLabel: 'Création',
    title: 'Création & Vidéo (Creators / Monteurs)',
    badge: 'Production Créative',
    icon: Video,
    headline: 'Tournage cinéma sur place à Montréal et montage vertical dynamique 4K à haute viralité.',
    missions: [
      'Scénariser les hooks et les concepts visuels adaptés aux restaurants clients.',
      'Effectuer les tournages sur place avec équipement cinéma stabilisé et captation 32-bit.',
      'Monter des vidéos 9:16 percutantes avec sous-titres animés et sound design sous 72h.',
      'Collaborer avec l’équipe Ads pour décliner les vidéos organiques en publicités payantes.',
    ],
    rituals_daily: [
      { time: 'Matinée', activity: 'Tournage sur site chez les clients (cuisine, plats vedettes, salle)' },
      { time: 'Après-midi', activity: 'Dérushage, étalonnage couleur et montage dynamique sur DaVinci/Premiere' },
      { time: 'Fin de journée', activity: 'Exportation master 4K et soumission pour validation client' },
    ],
    rituals_weekly: [
      { time: 'Mardi 11h00', activity: 'Cadrage des plannings de tournage de la semaine avec l’Account Manager' },
      { time: 'Jeudi 15h00', activity: 'Analyse des métriques de rétention et vues organiques sur TikTok et Reels' },
    ],
    kpis: [
      { label: 'Délai livraison 1er jet', target: '< 72h ouvrées' },
      { label: 'Taux approbation direct', target: '> 80%' },
      { label: 'Objectif viralité', target: '> 15 000 vues' },
    ],
    compensation: {
      base_description: 'Forfait fixe par pack produit (600 $ - 800 $ CAD / pack 8 vidéos) ou fixe mensuel.',
      commissions: 'Prime de performance virale (100 $ CAD par vidéo dépassant 25 000 vues).',
      quota_bonus: 'Bonus volume (+15% dès 24 vidéos livrées et validées dans le mois).',
      perks: [
        'Défraiement des repas sur les tournages restaurants',
        'Mise à disposition du matériel d’éclairage et stabilisation pro',
      ],
    },
  },
  {
    key: 'tech',
    shortLabel: 'Tech & QA',
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
      { time: '09h15', activity: 'Revue des issues GitHub, commits et tickets prioritaires' },
      { time: 'Journée', activity: 'Sprints de développement TypeScript strict et tests d’intégration' },
      { time: '17h00', activity: 'Validation des builds et vérification de la non-régression (tsc --noEmit)' },
    ],
    rituals_weekly: [
      { time: 'Lundi 09h30', activity: 'Définition des jalons du sprint technique' },
      { time: 'Vendredi 16h00', activity: 'Déploiement des releases de production et mise à jour CHANGELOG' },
    ],
    kpis: [
      { label: 'Erreurs TypeScript', target: '0 en production' },
      { label: 'Temps réponse API', target: '< 150ms' },
      { label: 'Passage protocole QA', target: '100% 20-points' },
    ],
    compensation: {
      base_description: 'Rémunération d’ingénierie mensuelle fixe selon séniorité.',
      commissions: 'Prime de déploiement (100 $ CAD par établissement client Flow onboardé).',
      quota_bonus: 'Prime de stabilité infrastructure sans incident majeur.',
      perks: [
        'Budget matériel et abonnements IA (Copilot, Claude, Cursor)',
        'Horaires flexibles et travail asynchrone encouragé',
      ],
    },
  },
  {
    key: 'managing',
    shortLabel: 'Rétention / Ops',
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
      { time: '09h00', activity: 'Revue de l’équilibrage de charge et affectation des priorités d’équipe' },
      { time: '11h00', activity: 'Check-in avec les clients en phase d’onboarding ou de cadrage' },
      { time: '16h00', activity: 'Suivi de la facturation Stripe et gestion des demandes d’assistance' },
    ],
    rituals_weekly: [
      { time: 'Lundi 14h00', activity: 'Planification hebdomadaire de la capacité de l’équipe' },
      { time: 'Mercredi 10h00', activity: 'Point d’avancement des projets et résolution des goulets d’étranglement' },
    ],
    kpis: [
      { label: 'Taux rétention client 6M', target: '> 90%' },
      { label: 'Net Promoter Score (NPS)', target: '> 65' },
      { label: 'Taux de charge optimal', target: '75% - 85%' },
    ],
    compensation: {
      base_description: 'Fixe mensuel de gestion opérationnelle.',
      commissions: '5% sur les upsells de packs additionnels et contrats de maintenance.',
      quota_bonus: 'Bonus annuel de rétention client basé sur la valeur à vie (LTV).',
      perks: [
        'Participation aux décisions stratégiques et roadmap agence',
        'Prise en charge des formations de management et leadership',
      ],
    },
  },
];

export default function RolesAndCompensationPage() {
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
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Équipe</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Rôles</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Fiches de Rôles &amp; Rémunération
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Control for Pôles */}
          <div className="h-7 bg-zinc-100 p-0.5 rounded-md flex items-center text-xs">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.key}
                onClick={() => setSelectedDeptKey(dept.key)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                  selectedDeptKey === dept.key
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                {dept.shortLabel}
              </button>
            ))}
          </div>

          <Link
            href="/team/workload"
            className="h-7 px-2.5 text-xs font-medium rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 flex items-center gap-1 transition-colors"
          >
            <Gauge className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Voir Charge d'Équipe</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Monolithic 2-Column Architecture (65% / 35%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column (65% - 8 cols on lg): Role & Rituals Monolithic Container */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden divide-y divide-zinc-100">
          {/* Section 1: Mission Principale & Objectifs Mensuels (h-12) */}
          <div className="p-3.5 bg-zinc-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <activeDepartment.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-zinc-900 truncate">
                    {activeDepartment.title}
                  </h2>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold" style={MONO}>
                    {activeDepartment.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {activeDepartment.headline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono text-zinc-500 bg-white border border-zinc-200 px-2 py-1 rounded shadow-2xs" style={MONO}>
                Quota : {activeDepartment.kpis[0]?.target}
              </span>
            </div>
          </div>

          {/* Section 2: Livrables & Responsabilités Obligatoires (Checklist 28px) */}
          <div className="p-3.5 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Missions &amp; Responsabilités Clés
            </span>
            <div className="space-y-1">
              {activeDepartment.missions.map((mission, idx) => (
                <div
                  key={idx}
                  className="h-7 px-2.5 rounded border border-zinc-100 bg-zinc-50/40 flex items-center gap-2 text-xs text-zinc-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{mission}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Rituels Quotidiens & Hebdomadaires (Tableau 2 Colonnes avec Horaires Monospace) */}
          <div className="p-3.5 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Rituels &amp; Cadence d'Exécution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Daily Rituals */}
              <div className="border border-zinc-200 rounded-md overflow-hidden">
                <div className="h-6 px-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-[10px] font-semibold text-zinc-600">
                  <span>Rituels Quotidiens</span>
                  <span className="font-mono text-zinc-400" style={MONO}>Quotidien</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {activeDepartment.rituals_daily.map((r, idx) => (
                    <div key={idx} className="h-8 px-2.5 flex items-center gap-2 text-[11px] text-zinc-700">
                      <span className="font-mono font-semibold text-zinc-900 text-[10px] w-20 shrink-0" style={MONO}>
                        {r.time}
                      </span>
                      <span className="truncate text-zinc-600">{r.activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Rituals */}
              <div className="border border-zinc-200 rounded-md overflow-hidden">
                <div className="h-6 px-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between text-[10px] font-semibold text-zinc-600">
                  <span>Rituels Hebdomadaires</span>
                  <span className="font-mono text-zinc-400" style={MONO}>Hebdo</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {activeDepartment.rituals_weekly.map((r, idx) => (
                    <div key={idx} className="h-8 px-2.5 flex items-center gap-2 text-[11px] text-zinc-700">
                      <span className="font-mono font-semibold text-zinc-900 text-[10px] w-20 shrink-0" style={MONO}>
                        {r.time}
                      </span>
                      <span className="truncate text-zinc-600">{r.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Métriques de Performance & KPIs */}
          <div className="p-3.5 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Seuils de Performance Exigés
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {activeDepartment.kpis.map((kpi, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between"
                >
                  <span className="text-[10px] text-zinc-500 font-medium truncate">
                    {kpi.label}
                  </span>
                  <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums mt-1" style={MONO}>
                    {kpi.target}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (35% - 4 cols on lg): Harmonized White/Zinc Commission Simulator */}
        <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs space-y-3 sticky top-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="text-xs font-semibold text-zinc-900 tracking-tight">
                Moteur de Rétribution RevOps
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold" style={MONO}>
              Actif
            </span>
          </div>

          {/* Base Compensation info */}
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Rémunération de Base
            </span>
            <p className="font-medium text-zinc-800 text-[11px]">
              {activeDepartment.compensation.base_description}
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Montant Setup Deal (CAD)
                </label>
                <span className="font-mono text-zinc-700 font-bold" style={MONO}>
                  {dealAmount} $
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="250"
                value={dealAmount}
                onChange={(e) => setDealAmount(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  MRR Mensuel Signé (CAD)
                </label>
                <span className="font-mono text-zinc-700 font-bold" style={MONO}>
                  {dealMrr} $
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="50"
                value={dealMrr}
                onChange={(e) => setDealMrr(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Volume Mensuel Réalisé
                </label>
                <span className="font-mono text-zinc-700 font-bold" style={MONO}>
                  {monthlyTotal} $
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25000"
                step="1000"
                value={monthlyTotal}
                onChange={(e) => setMonthlyTotal(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mt-0.5" style={MONO}>
                <span>Palier quota : 10 000 $</span>
                <span className={calcResult.isQuotaAchieved ? 'text-emerald-700 font-bold' : 'text-zinc-500'}>
                  {calcResult.isQuotaAchieved ? 'Bonus 1.25x Actif' : 'Palier standard'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Financial Summary Card */}
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-md font-mono text-xs space-y-1.5" style={MONO}>
            <div className="flex items-center justify-between text-zinc-600 text-[11px]">
              <span>Commission Setup ({DEFAULT_SETUP_COMMISSION_RATE}%) :</span>
              <span>{calcResult.setupCommissionCad} $</span>
            </div>
            <div className="flex items-center justify-between text-zinc-600 text-[11px]">
              <span>Récurrent MRR ({DEFAULT_MRR_COMMISSION_RATE}%) :</span>
              <span>{calcResult.mrrCommissionCad} $ / mois</span>
            </div>
            {calcResult.isQuotaAchieved && (
              <div className="flex items-center justify-between text-emerald-700 text-[11px] font-semibold">
                <span>Accélérateur Quota ({QUOTA_BONUS_MULTIPLIER}x) :</span>
                <span>Inclus</span>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between">
              <span className="font-bold text-zinc-900 text-xs">Total Gagné Estimé :</span>
              <span className="text-base font-bold text-emerald-700 tabular-nums">
                {calcResult.totalCommissionCad.toFixed(2)} $ CAD
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
