'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Utensils,
  CheckCircle2,
  Circle,
  ExternalLink,
  Sparkles,
  Printer,
  QrCode,
  DollarSign,
  Clock,
  ChefHat,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Percent,
  Copy,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface GuideStep {
  id: string;
  phase: string;
  title: string;
  duration: string;
  description: string;
  checklist: { id: string; label: string; details?: string }[];
  proTip: string;
}

const MINERVA_FLOW_STEPS: GuideStep[] = [
  {
    id: 'step-1',
    phase: 'Étape 01',
    title: 'Audit des Marges & Démonstration Live',
    duration: 'Jours 1 – 3',
    description:
      'Démontrer au restaurateur l’impact financier immédiat du 0% de commission en comparant ses ventes actuelles avec les 30% prélevés par les agrégateurs (UberEats, DoorDash).',
    checklist: [
      {
        id: 'c1-1',
        label: 'Calculer la perte mensuelle estimée avec l’outil d’audit de marge (/audits)',
        details: 'Ex. Pour 220 commandes à 24,50 $, cela représente ~1 600 $ de commissions perdues chaque mois.',
      },
      {
        id: 'c1-2',
        label: 'Générer et envoyer le pitch personnalisé avec lien de démo directe',
        details: 'Lien dynamique incluant le nom du restaurant et son plat signature.',
      },
      {
        id: 'c1-3',
        label: 'Faire tester la commande mobile en direct au propriétaire sur /minerva-flow',
      },
    ],
    proTip:
      'Montrez l’indicateur d’économies directes en haut du panier : le restaurateur réalise instantanément que chaque commande lui rapporte 100% de sa marge.',
  },
  {
    id: 'step-2',
    phase: 'Étape 02',
    title: 'Digitalisation du Menu & Photos Culinaire HD',
    duration: 'Jours 3 – 7',
    description:
      'Intégrer l’ensemble de la carte avec photos haute résolution, descriptions alléchantes, allergènes et suppléments personnalisables.',
    checklist: [
      {
        id: 'c2-1',
        label: 'Numériser au minimum 10 à 20 plats phares répartis par catégories',
        details: 'Pizzas artisanales, pâtes fraîches, entrées, desserts, boissons.',
      },
      {
        id: 'c2-2',
        label: 'Optimiser les photos en WebP / compression rapide (< 150 Ko par plat)',
      },
      {
        id: 'c2-3',
        label: 'Configurer les badges de mise en avant (« Populaire », « Recette du Chef »)',
      },
      {
        id: 'c2-4',
        label: 'Définir les délais moyens de préparation (ex. 15 à 25 minutes)',
      },
    ],
    proTip:
      'Une carte claire avec de belles photos augmente le panier moyen de 22% par rapport à un menu PDF statique.',
  },
  {
    id: 'step-3',
    phase: 'Étape 03',
    title: 'Passerelle de Paiement & QR Codes Cuisine',
    duration: 'Jours 7 – 10',
    description:
      'Mettre en place l’encaissement direct 100% sans commission (Stripe) et imprimer les supports QR Codes pour les tables et le comptoir.',
    checklist: [
      {
        id: 'c3-1',
        label: 'Lier le compte Stripe du restaurateur pour virement bancaire direct',
      },
      {
        id: 'c3-2',
        label: 'Générer les QR Codes haute définition pour les tables, chevalets et vitrine',
      },
      {
        id: 'c3-3',
        label: 'Configurer le module d’impression thermique de bons cuisine (ESC/POS)',
      },
    ],
    proTip:
      'Placez un QR code sur l’emballage à emporter : « Commandez directement la prochaine fois et économisez 10% avec le code DIRECT10 ».',
  },
  {
    id: 'step-4',
    phase: 'Étape 04',
    title: 'Protocole Test 5-Min en Cuisine Réelle',
    duration: 'Jour 11',
    description:
      'Effectuer un test en direct avec l’équipe de cuisine pendant un service à blanc pour valider la fluidité du bon de commande.',
    checklist: [
      {
        id: 'c4-1',
        label: 'Passer une commande test depuis un smartphone en salle',
      },
      {
        id: 'c4-2',
        label: 'Vérifier la réception immédiate du ticket en cuisine avec le numéro de bon',
      },
      {
        id: 'c4-3',
        label: 'Valider la lisibilité des suppléments et des instructions spéciales pour le chef',
      },
      {
        id: 'c4-4',
        label: 'Tester la notification de commande prête pour le retrait client',
      },
    ],
    proTip:
      'Le bouton « Protocole Test 5-Min » disponible sur la démo permet de simuler un flux de cuisine complet sans débit bancaire réel.',
  },
  {
    id: 'step-5',
    phase: 'Étape 05',
    title: 'Lancement Officiel & Suivi en Temps Réel',
    duration: 'Jours 12 – 14',
    description:
      'Ouvrir la plateforme aux clients, former le personnel de salle et activer le tableau de bord des résultats dans le portail client.',
    checklist: [
      {
        id: 'c5-1',
        label: 'Mettre en ligne sur le sous-domaine direct du restaurant (ex. commande.restaurant.com)',
      },
      {
        id: 'c5-2',
        label: 'Former l’équipe de salle à inviter les clients à scanner le QR code',
      },
      {
        id: 'c5-3',
        label: 'Accorder l’accès au portail client pour suivre les économies 0% en direct',
      },
      {
        id: 'c5-4',
        label: 'Activer le rapport hebdomadaire par courriel des commissions préservées',
      },
    ],
    proTip:
      'Après 30 jours, organisez un point avec le restaurateur en lui montrant le montant exact économisé sur son portail.',
  },
];

interface MinervaFlowProjectGuideProps {
  restaurantName?: string;
  className?: string;
}

export function MinervaFlowProjectGuide({
  restaurantName = 'Votre Restaurant Partenaire',
  className,
}: MinervaFlowProjectGuideProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set(['c1-1', 'c1-2']));
  const [expandedStep, setExpandedStep] = useState<string>('step-1');
  const [copiedPitch, setCopiedPitch] = useState(false);

  const toggleCheck = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalCheckItems = MINERVA_FLOW_STEPS.reduce((acc, s) => acc + s.checklist.length, 0);
  const progressPct = Math.round((completedItems.size / totalCheckItems) * 100);

  const handleCopyPitch = () => {
    const pitch = `Bonjour,\n\nSaviez-vous que 30% du prix de chaque commande sur Uber Eats ou DoorDash part en commissions de plateforme ?\n\nAvec Minerva-Flow, vos clients commandent directement sur votre carte digitale 0% commission. Vous conservez 100% de vos marges, recevez les paiements instantanément et les bons s'impriment directement en cuisine.\n\nDécouvrez la démo interactive personnalisée ici : https://minerva-trequista.vercel.app/minerva-flow?resto=${encodeURIComponent(
      restaurantName
    )}`;
    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* ── 1. Hero Guide Header ── */}
      <Card className="overflow-hidden border-emerald-800/30 bg-gradient-to-br from-emerald-950/90 via-zinc-900 to-zinc-950 text-white p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Utensils className="w-3.5 h-3.5" />
              <span>SOP & Protocole Officiel • Minerva-Flow</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
              Guide de Déploiement Commande Directe & 0 % Commission
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Suivez ce guide étape par étape pour numériser le menu de <strong>{restaurantName}</strong>, configurer l’impression cuisine et lancer la commande sans commission en moins de 14 jours.
            </p>
          </div>

          {/* Quick Actions & Progress */}
          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1 text-right min-w-[180px]">
              <div className="text-[10.5px] uppercase font-bold text-zinc-400 font-mono" style={MONO}>
                Progression du déploiement
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono" style={MONO}>
                {progressPct} % complété
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/minerva-flow?resto=${encodeURIComponent(restaurantName)}`}
                target="_blank"
                className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Ouvrir la démo live</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>

              <button
                type="button"
                onClick={handleCopyPitch}
                className="h-8 px-3 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPitch ? 'Copié !' : 'Copier pitch'}</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. Steps Accordion & Checklists ── */}
      <div className="space-y-3.5">
        {MINERVA_FLOW_STEPS.map((step, idx) => {
          const isExpanded = expandedStep === step.id;
          const stepDone = step.checklist.every((c) => completedItems.has(c.id));

          return (
            <Card
              key={step.id}
              className={cn(
                'overflow-hidden border transition-all',
                stepDone
                  ? 'border-emerald-200/80 bg-emerald-50/20'
                  : isExpanded
                  ? 'border-zinc-300 shadow-sm bg-white'
                  : 'border-zinc-200/80 bg-white hover:border-zinc-300'
              )}
            >
              {/* Step Header */}
              <button
                type="button"
                onClick={() => setExpandedStep(isExpanded ? '' : step.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-colors',
                      stepDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
                    )}
                    style={MONO}
                  >
                    {stepDone ? <CheckCircle2 className="w-4 h-4" /> : `0${idx + 1}`}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10.5px] font-bold text-emerald-700 uppercase tracking-wider">
                        {step.phase}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
                        • {step.duration}
                      </span>
                      {stepDone && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Validé
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate mt-0.5">
                      {step.title}
                    </h3>
                  </div>
                </div>

                <div className="text-zinc-400 shrink-0">
                  <span className="text-xs font-mono mr-2 hidden sm:inline" style={MONO}>
                    {step.checklist.filter((c) => completedItems.has(c.id)).length} / {step.checklist.length}
                  </span>
                </div>
              </button>

              {/* Step Details & Checklist */}
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-zinc-100 space-y-4 text-xs">
                  <p className="text-zinc-600 leading-relaxed text-xs sm:text-sm">
                    {step.description}
                  </p>

                  {/* Checklist items */}
                  <div className="space-y-2 bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-200/60">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                      Actions à valider :
                    </div>
                    {step.checklist.map((item) => {
                      const isChecked = completedItems.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className={cn(
                            'p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-3',
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-800'
                          )}
                        >
                          <div className="pt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-zinc-300" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className={cn('font-semibold text-xs', isChecked && 'line-through opacity-80')}>
                              {item.label}
                            </div>
                            {item.details && (
                              <div className="text-[11px] text-zinc-500">
                                {item.details}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pro Tip Box */}
                  <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-[11.5px]">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Conseil Agence Minerva : </span>
                      <span>{step.proTip}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
