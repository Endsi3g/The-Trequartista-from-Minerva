'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Compass,
  Layers,
  MapPin,
  Shield,
  Target,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
  Utensils,
  Radio,
  FileText,
  HelpCircle,
  Clock,
  Briefcase,
  Globe,
  Share2,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState<'vision' | 'ecosystem' | 'roadmap' | 'legal'>('vision');

  return (
    <PageFadeIn className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* ── 1. Header Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                <Building2 className="w-3 h-3 text-emerald-700" />
                <span>Minerva Studio & Agence</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500" style={MONO}>
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span>Montréal, Québec</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-mv-ink tracking-tight">
              Compagnie, Vision & Identité de Marque
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-3xl leading-relaxed">
              Une compagnie hybride qui combine design, systèmes d’automatisation IA et solutions logicielles sur mesure pour les entrepreneurs, restaurants et cafés locaux.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/academy"
              className="px-3 py-1.5 rounded-[4px] bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-mv-border"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-500" />
              <span>Voir l’Académie</span>
            </Link>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className="flex items-center gap-2 border-t border-mv-border/60 pt-4 overflow-x-auto no-scrollbar">
          {[
            { key: 'vision', label: 'Vision & Mission', icon: Compass },
            { key: 'ecosystem', label: 'Écosystème & Offres', icon: Layers },
            { key: 'roadmap', label: 'Roadmap & Stratégie', icon: TrendingUp },
            { key: 'legal', label: 'Légal & Gouvernance', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  'px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer shrink-0',
                  isCurrent
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-600 border border-mv-border/60'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', isCurrent ? 'text-emerald-400' : 'text-zinc-500')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1 : Vision & Mission ── */}
      {activeTab === 'vision' && (
        <div className="space-y-6">
          {/* One-Liner & Mission Hero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-[8px] p-5 sm:p-6 text-white space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Notre One-Liner</span>
              </div>
              <p className="text-base sm:text-lg font-display font-medium text-zinc-100 leading-snug">
                « Minerva permet aux entrepreneurs et aux compagnies d’obtenir des solutions logicielles créées pour eux — un outil unique conçu pour leurs vrais problèmes, sans fragmentation. »
              </p>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                <span>Notre Mission</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
                Aider les entrepreneurs, individus à haut potentiel, restaurants et cafés à <strong>augmenter leur taux de performance</strong> en remplaçant tous leurs outils dispersés par un seul cockpit intégré, pensé pour leur réalité terrain.
              </p>
            </div>
          </div>

          {/* Vision 3 ans vs 10 ans */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Vision à Long Terme</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-[6px] bg-zinc-50 border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-mv-ink">Vision à 3 ans</span>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold" style={MONO}>2026–2029</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Être reconnue sur l’île de Montréal et au Québec comme la référence semi-agence / semi-SaaS, avec une base de clients solide, des partenariats durables et des relations d’affaires pérennes.
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-zinc-50 border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-mv-ink">Vision à 10 ans</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold" style={MONO}>2029–2036</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Système 100% autonome et auto-gouverné : acquisition automatisée (mix organique + payant rodé), processus d’onboarding standardisés en 30 minutes, et boucle de feedback produit continue.
                </p>
              </div>
            </div>
          </div>

          {/* Transformation promise & Pourquoi Minerva */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>La Transformation Promise</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-[6px] border border-rose-200 bg-rose-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-rose-700">Avant Minerva</span>
                <p className="text-xs font-semibold text-zinc-800">Plusieurs apps / services / aucun système</p>
                <p className="text-[11px] text-zinc-500">Travail dispersé, inefficace, outils fragmentés.</p>
              </div>
              <div className="p-3.5 rounded-[6px] border border-emerald-200 bg-emerald-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Après Minerva</span>
                <p className="text-xs font-semibold text-zinc-800">Un cockpit unifié & clair</p>
                <p className="text-[11px] text-zinc-500">Travailler 3× moins, obtenir 3× plus de résultats.</p>
              </div>
              <div className="p-3.5 rounded-[6px] border border-blue-200 bg-blue-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-700">Différenciation Clé</span>
                <p className="text-xs font-semibold text-zinc-800">Semi-Agence / Semi-SaaS</p>
                <p className="text-[11px] text-zinc-500">Logiciels sur mesure + services d’accompagnement intégrés.</p>
              </div>
            </div>
          </div>

          {/* Personnalité & Valeurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Personnalité & Voix</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-800">🫱 Approchable</p>
                  <p className="text-[11px] text-zinc-500">Humaine, accessible, pas intimidante.</p>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-800">🧘 Calme & Posé</p>
                  <p className="text-[11px] text-zinc-500">Sans hype vide, sans jargon startup.</p>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-800">📐 Structurée</p>
                  <p className="text-[11px] text-zinc-500">Claire, organisée, processée et fiable.</p>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-800">💎 Valeur Réelle</p>
                  <p className="text-[11px] text-zinc-500">Orientée résultat mesurable et ROI.</p>
                </div>
              </div>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Valeurs Non Négociables</h3>
              <ul className="space-y-2 text-xs text-zinc-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Relations à long terme</strong> : Privilégier des relations durables et saines plutôt que de simples transactions ponctuelles.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Adaptabilité</strong> : Nous nous adaptons aux besoins concrets des entrepreneurs, pas l’inverse.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Vitesse d’exécution sans compromis</strong> : Vitesse d’implémentation maximale avec nos systèmes rodés (ex-Uprising Studio, 2+ ans d'expérience).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 : Écosystème & Offres ── */}
      {activeTab === 'ecosystem' && (
        <div className="space-y-6">
          {/* Les 4 Piliers */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Les 4 Piliers de l’Écosystème Minerva</span>
              </h2>
              <p className="text-xs text-zinc-500">
                Minerva opère comme une marque ombrelle (« umbrella brand ») articulée en 4 entités complémentaires :
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-[6px] bg-white border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">1</div>
                    <h3 className="text-sm font-bold text-zinc-900">Minerva (Agence)</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">Sur-Mesure</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  L'entité principale de conseil stratégique, conception de sites web Framer haute conversion, et intégration de systèmes sur mesure.
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-white border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <h3 className="text-sm font-bold text-zinc-900">Minerva OS</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Noyau Technique</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Le moteur technique propriétaire — systèmes de gestion, flux d’automatisation IA et tableaux de bord connectés en temps réel.
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-white border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-800 text-white flex items-center justify-center text-xs font-bold">3</div>
                    <h3 className="text-sm font-bold text-zinc-900">Minerva Reach</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Prospection B2B</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Solution logicielle de prospection automatisée dédiée au Québec : recherche Google Maps, séquences d'emails et CRM intégré.
                </p>
              </div>

              <div className="p-4 rounded-[6px] bg-white border border-mv-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-amber-800 text-white flex items-center justify-center text-xs font-bold">4</div>
                    <h3 className="text-sm font-bold text-zinc-900">Minerva Flow</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">SaaS Restos</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Cockpit de gestion complet pour restaurants et cafés — opérations de salle, inventaire, employés, fournisseurs et revenus.
                </p>
              </div>
            </div>
          </div>

          {/* Offre Signature Restaurants & Cafés */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
              <Utensils className="w-4 h-4 text-emerald-700" />
              <span>Offre Signature — Restaurants & Cafés de Montréal</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="text-xs font-bold text-zinc-800">1. Site Web Framer</p>
                <p className="text-[11px] text-zinc-500">Design sur mesure, menu dynamique, module réservation, galerie et SEO local.</p>
              </div>
              <div className="p-3.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="text-xs font-bold text-zinc-800">2. Intégration Minerva OS</p>
                <p className="text-[11px] text-zinc-500">Tableaux de bord des ventes, centralisation des avis Google, alertes automatiques.</p>
              </div>
              <div className="p-3.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="text-xs font-bold text-zinc-800">3. Pipeline de Contenu</p>
                <p className="text-[11px] text-zinc-500">Production et planification de Réels, Stories et carrousels engageants.</p>
              </div>
              <div className="p-3.5 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="text-xs font-bold text-zinc-800">4. Accompagnement</p>
                <p className="text-[11px] text-zinc-500">Revues mensuelles de performance, ajustements continus et support réactif.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3 : Roadmap & Stratégie ── */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          {/* Roadmap 12 Mois en 4 Phases */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Roadmap Stratégique 12 Mois</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded bg-zinc-50 border border-mv-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" style={MONO}>
                  Phase 1 • Juil–Août
                </span>
                <h3 className="text-xs font-bold text-zinc-900">Fondations</h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Enregistrement légal, charte graphique officielle, vitrine Framer et calendrier éditorial.
                </p>
              </div>

              <div className="p-4 rounded bg-zinc-50 border border-mv-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200" style={MONO}>
                  Phase 2 • Sept–Nov
                </span>
                <h3 className="text-xs font-bold text-zinc-900">Conquête Locale</h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Prospection ciblée restaurants à Montréal, signatures pilotes et déploiement systèmes.
                </p>
              </div>

              <div className="p-4 rounded bg-zinc-50 border border-mv-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200" style={MONO}>
                  Phase 3 • Nov–Fév
                </span>
                <h3 className="text-xs font-bold text-zinc-900">Lancement SaaS</h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Spécifications Reach & HelloAdvice, versions v1 et ouverture des bêta-tests.
                </p>
              </div>

              <div className="p-4 rounded bg-zinc-50 border border-mv-border space-y-2">
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" style={MONO}>
                  Phase 4 • Mars–Juin
                </span>
                <h3 className="text-xs font-bold text-zinc-900">Passage à l'Échelle</h3>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Stabilisation de la rétention, accélération des budgets publicitaires et croissance du MRR.
                </p>
              </div>
            </div>
          </div>

          {/* Stratégie Marketing & Canaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Canaux Marketing Prioritaires</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-800">📸 Instagram</p>
                    <p className="text-[11px] text-zinc-500">Visuels Restauration + Éducation Growth/Finance</p>
                  </div>
                  <span className="font-mono text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded" style={MONO}>1–2 / sem</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-800">🎥 YouTube & TikTok</p>
                    <p className="text-[11px] text-zinc-500">Capsules de fond sur le code, l'IA et les systèmes</p>
                  </div>
                  <span className="font-mono text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded" style={MONO}>Flux continu</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-800">💼 LinkedIn</p>
                    <p className="text-[11px] text-zinc-500">Crédibilité B2B, génération de leads décideurs</p>
                  </div>
                  <span className="font-mono text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded" style={MONO}>Hebdomadaire</span>
                </div>
              </div>
            </div>

            {/* Projections Financières */}
            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Projections Financières Année 1 (CAD)</h3>
              <div className="space-y-1.5 text-xs font-mono" style={MONO}>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <span className="text-zinc-600">Services Restos (Setup) — 3 contrats</span>
                  <span className="font-bold text-zinc-900">9 000 $</span>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <span className="text-zinc-600">Services Restos (Récurrent) — 3 abonnements</span>
                  <span className="font-bold text-zinc-900">9 000 $</span>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <span className="text-zinc-600">HelloAdvice SaaS — 100-150 abonnés</span>
                  <span className="font-bold text-zinc-900">14 000 $ – 21 000 $</span>
                </div>
                <div className="p-2 rounded bg-zinc-50 border border-mv-border flex items-center justify-between">
                  <span className="text-zinc-600">Minerva Reach SaaS — 50-100 abonnés</span>
                  <span className="font-bold text-zinc-900">15 000 $ – 30 000 $</span>
                </div>
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-between font-bold text-emerald-900">
                  <span>TOTAL ESTIMÉ (Année 1)</span>
                  <span>38 000 $ – 48 000 $ CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4 : Légal & Structure ── */}
      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Structure Juridique & Fiscale</h3>
              <div className="space-y-2 text-xs text-zinc-700">
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-900">Forme Juridique</p>
                  <p className="text-zinc-600">Entreprise individuelle enregistrée au Québec (NEQ).</p>
                </div>
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-900">Siège Social</p>
                  <p className="text-zinc-600">Montréal, Québec, Canada (Devise officielle : CAD $).</p>
                </div>
                <div className="p-2.5 rounded bg-zinc-50 border border-mv-border">
                  <p className="font-bold text-zinc-900">Fiscalité Québec</p>
                  <p className="text-zinc-600">Inscription TPS (5%) et TVQ (9.975%) selon les seuils provinciaux.</p>
                </div>
              </div>
            </div>

            <div className="bg-mv-surface border border-mv-border rounded-[8px] p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Propriété Intellectuelle (IP)</h3>
              <div className="p-3.5 rounded bg-zinc-50 border border-mv-border text-xs text-zinc-700 space-y-2">
                <p className="font-bold text-zinc-900">Propriété Exclusive du Code</p>
                <p className="text-zinc-600 leading-relaxed">
                  Minerva conserve la propriété intellectuelle exclusive du code source, des modules IA et des architectures logicielles propriétaires.
                </p>
                <p className="text-zinc-600 leading-relaxed">
                  Les clients finaux bénéficient d’une <strong>licence d’exploitation</strong> commerciale complète pour leur plateforme et leurs données.
                </p>
              </div>
            </div>
          </div>

          {/* Gestion des Risques */}
          <div className="bg-mv-surface border border-mv-border rounded-[8px] p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-mv-ink tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>Matrice de Gestion des Risques</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="font-bold text-zinc-900">Disponibilité Opérationnelle</p>
                <p className="text-[11px] text-zinc-500">Priorisation stricte des livrables essentiels, automatisation maximale via IA et scripts.</p>
              </div>
              <div className="p-3 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="font-bold text-zinc-900">Inertie du Marché SaaS</p>
                <p className="text-[11px] text-zinc-500">Lancement MVP rapide en 7 jours pour tester l'offre sur le terrain et itérer.</p>
              </div>
              <div className="p-3 rounded bg-zinc-50 border border-mv-border space-y-1">
                <p className="font-bold text-zinc-900">Conformité Loi 25 (Québec)</p>
                <p className="text-[11px] text-zinc-500">Protection stricte des renseignements personnels et respect de la conformité provinciale.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
