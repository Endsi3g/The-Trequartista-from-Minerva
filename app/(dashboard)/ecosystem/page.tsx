'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Search,
  HelpCircle,
  X,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Laptop,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PlatformItem {
  id: string;
  name: string;
  category: 'website' | 'app';
  typeLabel: string;
  tagline: string;
  url: string;
  description: string;
  badgeVariant: 'emerald' | 'purple' | 'blue' | 'amber';
  highlights: string[];
  teamRole: string;
}

const PLATFORMS: PlatformItem[] = [
  {
    id: 'flow-website',
    name: 'Minerva Flow',
    category: 'website',
    typeLabel: 'Framer Hosting',
    tagline: 'Fidélisation & Marges pour Restaurants',
    url: 'https://minervaflow.framer.website/',
    description:
      'Vitrine officielle du système de commande directe et de fidélisation. Protège les marges en cuisine et fait revenir les clients sans commission intermédiaire.',
    badgeVariant: 'emerald',
    highlights: ['Essai 14j', '0% commission', 'QR Code Comptoir', 'Montréal'],
    teamRole: 'À envoyer aux prospects restaurateurs en amont de démo ou après qualification terrain.',
  },
  {
    id: 'studio-website',
    name: 'Minerva Studio',
    category: 'website',
    typeLabel: 'Framer Hosting',
    tagline: 'L’Agence Montréalaise pour les Restaurants',
    url: 'https://minervastudio.framer.website/',
    description:
      'Site vitrine institutionnel de l\'agence. Accompagnement 360 : conception Framer haute conversion, production vidéo cinéma Reels et identité de marque.',
    badgeVariant: 'purple',
    highlights: ['Framer Pro', 'Reels 4K', 'SEO Local G-Maps', 'Retainer 360'],
    teamRole: 'À présenter aux clients souhaitant une refonte complète de marque ou des campagnes de contenu.',
  },
  {
    id: 'reach-app',
    name: 'Minerva Reach',
    category: 'app',
    typeLabel: 'Vercel Cloud',
    tagline: 'Prospection Terrain & Routine /today',
    url: 'https://minerva-os-lite-desktop.vercel.app/today',
    description:
      'Application ultra-rapide optimisée pour la prospection quotidienne. Traitement de 30 à 50 fiches commerces montréalaises/jour avec synchronisation 1-clic.',
    badgeVariant: 'blue',
    highlights: ['Vue /today', 'Google Maps API', 'Sync Trequartista', 'Quota Quotidien'],
    teamRole: 'Outil de travail quotidien de l\'équipe Ventes / SDR de 09h30 à 12h00.',
  },
  {
    id: 'flow-saas',
    name: 'Minerva Flow (SaaS)',
    category: 'app',
    typeLabel: 'Vercel Cloud',
    tagline: 'Dashboard Restaurateur & Commande en Ligne',
    url: 'https://minerva-flow.vercel.app/login',
    description:
      'Portail de gestion utilisé par les restaurateurs : pilotage du menu, réception des commandes directes, impression thermique cuisine et base clients fidèles.',
    badgeVariant: 'amber',
    highlights: ['Menu Digital', 'ESC/POS Cuisine', 'Stripe Connect', 'Fidélité'],
    teamRole: 'Espace déployé lors de l\'onboarding client par les pôles Managing et Tech.',
  },
];

export default function EcosystemPage() {
  const { toastSuccess } = useToast();
  const [filterCategory, setFilterCategory] = useState<'all' | 'website' | 'app'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard ergonomics: '/' to search, '?' to open help drawer, 'Escape' to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsHelpDrawerOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isHelpDrawerOpen) {
          setIsHelpDrawerOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpDrawerOpen, searchQuery]);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toastSuccess('Lien copié !', url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPlatforms = useMemo(() => {
    return PLATFORMS.filter((p) => {
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.highlights.some((h) => h.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  const websites = filteredPlatforms.filter((p) => p.category === 'website');
  const apps = filteredPlatforms.filter((p) => p.category === 'app');

  return (
    <PageFadeIn className="space-y-3 pb-8">
      {/* ── 1. Linear-Style Header & Toolbar Strip (h-10 / 40px) ── */}
      <div className="h-10 bg-white border border-zinc-200 rounded-lg px-3.5 flex items-center justify-between shadow-2xs">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Minerva</span>
            <span>/</span>
            <span className="text-zinc-600 font-medium">Écosystème</span>
          </div>
          <span className="text-zinc-200">|</span>
          <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 tracking-tight truncate">
            Hub Écosystème
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded" style={MONO}>
            {PLATFORMS.length} Plateformes Actives
          </span>
        </div>

        {/* Controls: Search + Segmented Control + Help Drawer */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact Search Field */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-zinc-400 absolute left-2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrer plateforme..."
              className="h-7 w-36 sm:w-48 pl-7 pr-6 text-xs bg-zinc-50 border border-zinc-200 rounded-md placeholder-zinc-400 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 focus:outline-none transition-all"
            />
            <kbd className="hidden sm:inline-flex absolute right-1.5 top-1.5 px-1 py-0.2 text-[9px] font-mono text-zinc-400 bg-white border border-zinc-200 rounded shadow-2xs pointer-events-none" style={MONO}>
              /
            </kbd>
          </div>

          {/* Segmented Control */}
          <div className="h-7 bg-zinc-100 p-0.5 rounded-md flex items-center text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                filterCategory === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterCategory('website')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                filterCategory === 'website'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              Vitrines Framer
            </button>
            <button
              onClick={() => setFilterCategory('app')}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer',
                filterCategory === 'app'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              Apps Métier
            </button>
          </div>

          {/* Help Drawer Trigger Button */}
          <button
            onClick={() => setIsHelpDrawerOpen(true)}
            className="h-7 w-7 rounded-md border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 flex items-center justify-center transition-colors cursor-pointer"
            title="Règles d'or de l'écosystème (?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Monolithic Dense Registry Container ── */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-2xs overflow-hidden divide-y divide-zinc-200">
        {/* Section A: Sites Vitrines & Acquisition (Framer Hosting) */}
        {(filterCategory === 'all' || filterCategory === 'website') && (
          <div>
            {/* Section Header Strip */}
            <div className="h-8 px-3.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-semibold text-zinc-900">
                  Sites Vitrines &amp; Acquisition
                </span>
                <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                  (Framer Hosting Live)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                {websites.length} domaine{websites.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Column Labels */}
            <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
              <span className="col-span-3">Plateforme</span>
              <span className="col-span-4">Objectif Métier</span>
              <span className="col-span-3">Stack &amp; Points Clés</span>
              <span className="col-span-2 text-right">Commandes</span>
            </div>

            {/* Rows (h-12 / 48px) */}
            <div className="divide-y divide-zinc-100">
              {websites.length === 0 ? (
                <div className="h-12 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                  Aucune vitrine ne correspond aux critères
                </div>
              ) : (
                websites.map((platform) => (
                  <div
                    key={platform.id}
                    className="grid grid-cols-12 h-12 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                  >
                    {/* Col 1 (25% / 3 cols): Nom + Pill */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900 truncate">
                            {platform.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200" style={MONO}>
                            {platform.typeLabel.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-400 truncate" style={MONO}>
                          {platform.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </p>
                      </div>
                    </div>

                    {/* Col 2 (35% / 4 cols): Objectif Métier */}
                    <div className="col-span-4 min-w-0 pr-3">
                      <p className="text-xs text-zinc-700 truncate font-medium">
                        {platform.tagline}
                      </p>
                      <p className="text-[10.5px] text-zinc-400 truncate">
                        {platform.description}
                      </p>
                    </div>

                    {/* Col 3 (20% / 3 cols): Stack / Highlights */}
                    <div className="col-span-3 flex items-center gap-1 flex-wrap min-w-0 pr-2">
                      {platform.highlights.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 truncate"
                          style={MONO}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Col 4 (20% / 2 cols): Actions rapides inline */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(platform.id, platform.url)}
                        className="h-7 px-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copier l'URL"
                      >
                        {copiedId === platform.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-700 font-medium">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px]">Copier</span>
                          </>
                        )}
                      </button>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 px-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
                        title="Ouvrir le site"
                      >
                        <span className="text-[10px]">Visiter</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Section B: Portails & Outils Métier (Vercel Cloud) */}
        {(filterCategory === 'all' || filterCategory === 'app') && (
          <div>
            {/* Section Header Strip */}
            <div className="h-8 px-3.5 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-semibold text-zinc-900">
                  Portails &amp; Outils Métier
                </span>
                <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                  (Vercel Cloud Production)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                {apps.length} application{apps.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Column Labels */}
            <div className="grid grid-cols-12 h-7 px-3.5 border-b border-zinc-100 bg-zinc-50/30 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 items-center">
              <span className="col-span-3">Plateforme</span>
              <span className="col-span-4">Objectif Métier</span>
              <span className="col-span-3">Stack &amp; Points Clés</span>
              <span className="col-span-2 text-right">Commandes</span>
            </div>

            {/* Rows (h-12 / 48px) */}
            <div className="divide-y divide-zinc-100">
              {apps.length === 0 ? (
                <div className="h-12 flex items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
                  Aucune application ne correspond aux critères
                </div>
              ) : (
                apps.map((platform) => (
                  <div
                    key={platform.id}
                    className="grid grid-cols-12 h-12 px-3.5 items-center text-xs text-zinc-800 hover:bg-zinc-50/80 transition-colors group"
                  >
                    {/* Col 1 (25% / 3 cols): Nom + Pill */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-zinc-900 truncate">
                            {platform.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" style={MONO}>
                            {platform.typeLabel.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-400 truncate" style={MONO}>
                          {platform.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </p>
                      </div>
                    </div>

                    {/* Col 2 (35% / 4 cols): Objectif Métier */}
                    <div className="col-span-4 min-w-0 pr-3">
                      <p className="text-xs text-zinc-700 truncate font-medium">
                        {platform.tagline}
                      </p>
                      <p className="text-[10.5px] text-zinc-400 truncate">
                        {platform.description}
                      </p>
                    </div>

                    {/* Col 3 (20% / 3 cols): Stack / Highlights */}
                    <div className="col-span-3 flex items-center gap-1 flex-wrap min-w-0 pr-2">
                      {platform.highlights.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-600 truncate"
                          style={MONO}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Col 4 (20% / 2 cols): Actions rapides inline */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(platform.id, platform.url)}
                        className="h-7 px-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copier l'URL"
                      >
                        {copiedId === platform.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-700 font-medium">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span className="text-[10px]">Copier</span>
                          </>
                        )}
                      </button>

                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 px-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
                        title="Ouvrir l'application"
                      >
                        <span className="text-[10px]">Lancer</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Retractable Technical Rules Drawer (? shortcut) ── */}
      {isHelpDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl h-full flex flex-col justify-between">
            {/* Drawer Header */}
            <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Règles d'Or de l'Écosystème
                </h3>
              </div>
              <button
                onClick={() => setIsHelpDrawerOpen(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                title="Fermer (Échap)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4 overflow-y-auto text-xs flex-1">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">1. Pôle Ventes &amp; Prospection</span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200" style={MONO}>
                    09h30 - 12h00
                  </span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Utiliser <strong>Minerva Reach</strong> (/today) le matin pour qualifier les restaurants cibles. Présenter <strong>minervaflow.framer.website</strong> en démo avec l'offre d'essai accompagné de 14 jours.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">2. Pôle Managing &amp; Rétention</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200" style={MONO}>
                    J+2 Onboarding
                  </span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Activer le compte restaurateur sur <strong>Minerva Flow (SaaS)</strong> sous 48h. Configurer le menu digital, les chevalets QR tables/comptoir et le programme fidélité.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-900">3. Pôle Tech &amp; Systèmes</span>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200" style={MONO}>
                    99.9% SLA
                  </span>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">
                  Maintenir la synchronisation API entre Reach et Trequartista. Tester les imprimantes thermiques ESC/POS en cuisine et veiller au protocole QA 20-points.
                </p>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="h-10 px-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-400 font-mono" style={MONO}>
              <span>Raccourci clavier : Échap pour fermer</span>
              <span className="text-emerald-700 font-semibold">Minerva Montréal</span>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
