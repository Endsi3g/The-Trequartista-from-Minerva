'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Hammer,
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
  Layers,
  ChevronDown,
  Building,
  FileCheck,
  Star,
} from 'lucide-react';
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
    title: 'Digitalisation du Menu & Photos Culinaires HD',
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

const ROOFING_DEPLOYMENT_STEPS: GuideStep[] = [
  {
    id: 'step-roof-1',
    phase: 'Étape 01',
    title: 'Simulateur d’Estimation Toiture & Démonstration Live',
    duration: 'Jours 1 – 3',
    description:
      'Démontrer au couvreur l’impact d’un tunnel d’estimation instantané 24/7 face aux formulaires de contact passifs qui perdent 60% des prospects qualifiés.',
    checklist: [
      {
        id: 'cr-1-1',
        label: 'Configurer les fourchettes au pied carré (Bardeau d’asphalte, Tôle pincée, Membrane élastomère)',
        details: 'Ex. Bardeau 4,50 $ à 7,50 $/pi², Membrane 8,00 $ à 14,00 $/pi².',
      },
      {
        id: 'cr-1-2',
        label: 'Paramétrer l’outil de calcul de pente, superficie approximative et accès au toit',
      },
      {
        id: 'cr-1-3',
        label: 'Faire tester le tunnel de devis instantané au dirigeant sur smartphone',
      },
    ],
    proTip:
      'Un simulateur de toiture avec fourchette de prix immédiate triple le taux de conversion des propriétaires fonciers pressés.',
  },
  {
    id: 'step-roof-2',
    phase: 'Étape 02',
    title: 'Grille Tarifaire, Matériaux & Garanties Certifiées',
    duration: 'Jours 3 – 6',
    description:
      'Intégrer les fiches techniques des matériaux, certifications fabricant (BP, GAF, IKO) et assurances responsabilité professionnelle.',
    checklist: [
      {
        id: 'cr-2-1',
        label: 'Numériser la grille des garanties (Garantie main-d’œuvre 10 ans, garantie fabricant 50 ans)',
      },
      {
        id: 'cr-2-2',
        label: 'Intégrer la galerie des chantiers récents avant/après en haute définition',
      },
      {
        id: 'cr-2-3',
        label: 'Configurer les options complémentaires (Ventilation Entretoit, Pontage contreplaqué, Gouttières)',
      },
    ],
    proTip:
      'Mettez en avant le badge RBQ et l’assurance responsabilité 2 000 000 $ dès la 1ère étape pour lever tous les freins de confiance.',
  },
  {
    id: 'step-roof-3',
    phase: 'Étape 03',
    title: 'Devis Interactif, Signature Électronique & Acompte 50%',
    duration: 'Jours 7 – 9',
    description:
      'Automatiser la génération de la proposition commerciale avec signature sur écran tactile et encaissement de l’acompte d’engagement via Stripe.',
    checklist: [
      {
        id: 'cr-3-1',
        label: 'Lier le compte bancaire Stripe de l’entreprise pour les acomptes directs',
      },
      {
        id: 'cr-3-2',
        label: 'Tester le module de signature électronique légale (Canvas tactile)',
      },
      {
        id: 'cr-3-3',
        label: 'Paramétrer le contrat type avec clauses météo et échéancier de paiement (50% / 50%)',
      },
    ],
    proTip:
      'Recevoir un acompte de réservation de 50% en ligne bloque le chantier dans le calendrier et élimine les désistements.',
  },
  {
    id: 'step-roof-4',
    phase: 'Étape 04',
    title: 'Protocole Test d’Alerte Équipe & Attribution Chantier',
    duration: 'Jour 10',
    description:
      'Tester la notification instantanée par SMS/Courriel lors d’une demande d’estimation pour un rappel du contremaître en moins de 15 minutes.',
    checklist: [
      {
        id: 'cr-4-1',
        label: 'Soumettre une demande test d’estimation toiture depuis un mobile',
      },
      {
        id: 'cr-4-2',
        label: 'Vérifier la réception immédiate de la notification SMS avec dimensions et photos du toit',
      },
      {
        id: 'cr-4-3',
        label: 'Valider l’insertion automatique dans le pipeline CRM des chantiers en attente',
      },
    ],
    proTip:
      'Un rappel téléphonique en moins de 15 minutes multiplie par 4 la probabilité de signer le devis de toiture face aux concurrents.',
  },
  {
    id: 'step-roof-5',
    phase: 'Étape 05',
    title: 'Lancement Officiel, Fiche GMB & Campagne Avis 5★',
    duration: 'Jours 11 – 14',
    description:
      'Déployer le tunnel sur le domaine officiel, synchroniser la fiche Google Business locale et automatiser la demande d’avis post-chantier.',
    checklist: [
      {
        id: 'cr-5-1',
        label: 'Mettre en production sur le nom de domaine principal de l’entreprise de toiture',
      },
      {
        id: 'cr-5-2',
        label: 'Lier la fiche Google Business (GMB) avec bouton direct « Obtenir un devis en ligne »',
      },
      {
        id: 'cr-5-3',
        label: 'Activer le déclencheur SMS de collecte d’avis Google 48h après la livraison du chantier',
      },
    ],
    proTip:
      'Chaque avis 5 étoiles géolocalisé renforce le référencement local et amène de nouveaux chantiers organiques sans dépenser en publicité.',
  },
];

interface MinervaFlowProjectGuideProps {
  restaurantName?: string;
  projectId?: string;
  sector?: string;
  className?: string;
}

export function MinervaFlowProjectGuide({
  restaurantName = 'Client Partenaire',
  projectId,
  sector,
  className,
}: MinervaFlowProjectGuideProps) {
  // Sector autodetection
  const isRoofingClient = useMemo(() => {
    const s = (sector || '').toLowerCase();
    const n = (restaurantName || '').toLowerCase();
    return (
      s.includes('toiture') ||
      s.includes('batiment') ||
      s.includes('construction') ||
      n.includes('toiture') ||
      n.includes('beauchemin') ||
      n.includes('couvreur')
    );
  }, [sector, restaurantName]);

  const [activeSector, setActiveSector] = useState<'restaurant' | 'roofing'>(
    isRoofingClient ? 'roofing' : 'restaurant'
  );

  const steps = activeSector === 'roofing' ? ROOFING_DEPLOYMENT_STEPS : MINERVA_FLOW_STEPS;

  const [completedItems, setCompletedItems] = useState<Set<string>>(
    new Set(activeSector === 'roofing' ? ['cr-1-1', 'cr-1-2'] : ['c1-1', 'c1-2'])
  );
  const [expandedStep, setExpandedStep] = useState<string>(
    activeSector === 'roofing' ? 'step-roof-1' : 'step-1'
  );
  const [copiedPitch, setCopiedPitch] = useState(false);

  const toggleCheck = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalCheckItems = steps.reduce((acc, s) => acc + s.checklist.length, 0);
  const completedCount = steps.reduce(
    (acc, s) => acc + s.checklist.filter((c) => completedItems.has(c.id)).length,
    0
  );
  const progressPct = Math.round((completedCount / (totalCheckItems || 1)) * 100);

  const handleCopyPitch = () => {
    let pitch = '';
    if (activeSector === 'roofing') {
      pitch = `Bonjour,\n\nSaviez-vous que 60% des propriétaires qui cherchent un couvreur abandonnent les formulaires classiques pour appeler un concurrent qui donne un estimé rapide ?\n\nAvec notre simulateur de toiture en ligne, les clients configurent leur toit, obtiennent une fourchette instantanée et peuvent même signer leur devis et verser un acompte 50% en ligne.\n\nDécouvrez la démo interactive personnalisée pour ${restaurantName} : https://minerva-trequartista.vercel.app/projects/${
        projectId || 'demo'
      }`;
    } else {
      pitch = `Bonjour,\n\nSaviez-vous que 30% du prix de chaque commande sur Uber Eats ou DoorDash part en commissions de plateforme ?\n\nAvec Minerva-Flow, vos clients commandent directement sur votre carte digitale 0% commission. Vous conservez 100% de vos marges, recevez les paiements instantanément et les bons s'impriment directement en cuisine.\n\nDécouvrez la démo interactive personnalisée pour ${restaurantName} : https://minerva-flow.vercel.app`;
    }
    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* ── 1. Linear/Raycast Toolbar Strip (40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            {activeSector === 'roofing' ? (
              <Hammer className="w-3 h-3" />
            ) : (
              <Utensils className="w-3 h-3" />
            )}
          </div>
          <span className="font-semibold text-zinc-900 truncate">
            Guide Déploiement • {restaurantName}
          </span>
          <span className="text-zinc-300">|</span>
          <span className="font-mono text-[10.5px] text-zinc-500 uppercase tracking-wider hidden sm:inline" style={MONO}>
            MDS-01 SOP
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sector Segmented Switcher */}
          <div className="h-7 bg-zinc-100 p-0.5 rounded-md flex items-center text-[11px] font-medium text-zinc-600">
            <button
              type="button"
              onClick={() => {
                setActiveSector('roofing');
                setExpandedStep('step-roof-1');
              }}
              className={cn(
                'px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer',
                activeSector === 'roofing'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Hammer className="w-3 h-3 text-emerald-600" />
              <span>Toiture / Bâtiment</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSector('restaurant');
                setExpandedStep('step-1');
              }}
              className={cn(
                'px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer',
                activeSector === 'restaurant'
                  ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              )}
            >
              <Utensils className="w-3 h-3 text-emerald-600" />
              <span>Restauration 0%</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyPitch}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copiedPitch ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span>{copiedPitch ? 'Copié !' : 'Copier pitch'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Metric Ribbon (4-Columns, Height ≤ 64px) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-x divide-zinc-100 shadow-xs">
        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Secteur & Package
          </div>
          <div className="text-sm font-bold text-zinc-900 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{activeSector === 'roofing' ? 'Toiture Bâtiment Pro' : 'Minerva Flow 0%'}</span>
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Complétion Protocole
          </div>
          <div className="text-sm font-bold font-mono text-emerald-700 flex items-center gap-2 mt-0.5" style={MONO}>
            <span>{progressPct}%</span>
            <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Actions Validées
          </div>
          <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5" style={MONO}>
            {completedCount} / {totalCheckItems} items
          </div>
        </div>

        <div className="px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Délai Recommandé
          </div>
          <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5" style={MONO}>
            14 jours ouvrés
          </div>
        </div>
      </div>

      {/* ── 3. Monolithic Split-View Layout (65% Checklist / 35% Live Technical Sheet) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Column (65% -> 8 cols) : Steps Checklist Matrix */}
        <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-xs divide-y divide-zinc-100">
          {steps.map((step, idx) => {
            const isExpanded = expandedStep === step.id;
            const stepDone = step.checklist.every((c) => completedItems.has(c.id));
            const stepCountDone = step.checklist.filter((c) => completedItems.has(c.id)).length;

            return (
              <div key={step.id} className="transition-colors">
                {/* Step Row (36px compact header) */}
                <button
                  type="button"
                  onClick={() => setExpandedStep(isExpanded ? '' : step.id)}
                  className={cn(
                    'w-full h-10 px-3.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer hover:bg-zinc-50',
                    isExpanded && 'bg-zinc-50/70 border-b border-zinc-100'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center font-bold text-[10.5px] font-mono shrink-0',
                        stepDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 border border-zinc-200 text-zinc-700'
                      )}
                      style={MONO}
                    >
                      {stepDone ? <Check className="w-3 h-3" /> : idx + 1}
                    </div>

                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 font-mono" style={MONO}>
                      {step.phase}
                    </span>

                    <span className="text-xs font-semibold text-zinc-900 truncate">
                      {step.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
                      {step.duration}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold',
                        stepDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-600'
                      )}
                      style={MONO}
                    >
                      {stepCountDone}/{step.checklist.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-zinc-400 transition-transform duration-200',
                        isExpanded && 'transform rotate-180'
                      )}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3.5 space-y-3 bg-white">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Dense Checklist Rows (32px) */}
                    <div className="border border-zinc-200 rounded-md overflow-hidden divide-y divide-zinc-100">
                      {step.checklist.map((item) => {
                        const isChecked = completedItems.has(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleCheck(item.id)}
                            className={cn(
                              'px-3 py-2 flex items-start gap-2.5 text-xs transition-colors cursor-pointer hover:bg-zinc-50',
                              isChecked && 'bg-emerald-50/30'
                            )}
                          >
                            <div className="pt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-zinc-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={cn(
                                  'font-medium text-xs',
                                  isChecked ? 'line-through text-zinc-400' : 'text-zinc-800'
                                )}
                              >
                                {item.label}
                              </div>
                              {item.details && (
                                <div className="text-[11px] text-zinc-500 font-mono mt-0.5" style={MONO}>
                                  {item.details}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Inline Agency Pro Tip */}
                    <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2 text-emerald-950 text-[11px] leading-relaxed">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold text-emerald-900">Conseil Minerva : </strong>
                        <span>{step.proTip}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column (35% -> 4 cols) : Sticky Technical Parameters Sheet */}
        <div className="lg:col-span-4 sticky top-4 space-y-3">
          <div className="bg-white border border-zinc-200 rounded-lg p-3.5 space-y-3 shadow-xs">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 flex items-center justify-between">
              <span>Paramètres Techniques</span>
              <span className="font-mono text-emerald-700" style={MONO}>v2.25.0</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Client :</span>
                <span className="font-semibold text-zinc-900 truncate max-w-[150px]">{restaurantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Secteur :</span>
                <span className="font-mono text-zinc-800" style={MONO}>
                  {activeSector === 'roofing' ? 'Bâtiment / Toiture' : 'Restauration'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Modèle de revenus :</span>
                <span className="font-mono text-emerald-700 font-bold" style={MONO}>
                  {activeSector === 'roofing' ? 'Devis + 50% Acompte' : '0% Com / Direct'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Plateforme live :</span>
                <span className="font-mono text-zinc-700" style={MONO}>
                  {activeSector === 'roofing' ? 'minerva-trequartista' : 'minerva-flow'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Raccourcis & Actions
              </div>

              {activeSector === 'roofing' ? (
                <Link
                  href={projectId ? `/projects/${projectId}/roadmap` : '/projects'}
                  className="w-full h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Voir la Roadmap Projet</span>
                </Link>
              ) : (
                <a
                  href="https://minerva-flow.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ouvrir Minerva Flow</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyPitch}
                className="w-full h-8 px-3 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>{copiedPitch ? 'Pitch copié au presse-papier' : 'Copier pitch commercial'}</span>
              </button>
            </div>
          </div>

          {/* Quick Keybinding Help Card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[11px] text-zinc-600 space-y-1 font-mono" style={MONO}>
            <div className="font-semibold text-zinc-800 text-[10px] uppercase">Raccourcis Clavier</div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Nouveau jalon</span>
              <kbd className="bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-[10px]">C / N</kbd>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Valider saisie</span>
              <kbd className="bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-[10px]">⌘ + Entrée</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
