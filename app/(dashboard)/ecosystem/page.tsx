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
  RefreshCw,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PlatformItem {
  id: string;
  name: string;
  category: 'website' | 'app';
  categoryLabel: string;
  tagline: string;
  url: string;
  description: string;
  teamRole: string;
  fallbackImage: string;
}

const PLATFORMS: PlatformItem[] = [
  {
    id: 'flow-website',
    name: 'Minerva Flow',
    category: 'website',
    categoryLabel: 'Vitrine Framer',
    tagline: 'Fidélisation & Marges pour Restaurants',
    url: 'https://minervaflow.framer.website/',
    description:
      'Vitrine officielle du système de commande directe et de fidélisation. Protège les marges en cuisine et fait revenir les clients sans commission intermédiaire.',
    teamRole: 'À envoyer aux prospects restaurateurs en amont de démo ou après qualification terrain.',
    fallbackImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'studio-website',
    name: 'Minerva Studio',
    category: 'website',
    categoryLabel: 'Vitrine Framer',
    tagline: 'L’Agence Montréalaise pour les Restaurants',
    url: 'https://minervastudio.framer.website/',
    description:
      'Site vitrine institutionnel de l’agence. Accompagnement 360 : conception Framer haute conversion, production vidéo cinéma Reels et identité de marque.',
    teamRole: 'À présenter aux clients souhaitant une refonte complète de marque ou des campagnes de contenu.',
    fallbackImage: 'https://framerusercontent.com/images/6dnUuLzGHTg2RCQMFvKwx2QgO6k.jpg',
  },
  {
    id: 'reach-app',
    name: 'Minerva Reach',
    category: 'app',
    categoryLabel: 'Application Métier',
    tagline: 'Prospection Terrain & Routine /today',
    url: 'https://minerva-os-lite-desktop.vercel.app/today',
    description:
      'Application ultra-rapide optimisée pour la prospection quotidienne. Traitement de 30 à 50 fiches commerces montréalaises/jour avec synchronisation 1-clic.',
    teamRole: 'Outil de travail quotidien de l’équipe Ventes / SDR de 09h30 à 12h00.',
    fallbackImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    id: 'flow-saas',
    name: 'Minerva Flow (SaaS)',
    category: 'app',
    categoryLabel: 'Application Métier',
    tagline: 'Dashboard Restaurateur & Commande en Ligne',
    url: 'https://minerva-flow.vercel.app/login',
    description:
      'Portail de gestion utilisé par les restaurateurs : pilotage du menu, réception des commandes directes, impression thermique cuisine et base clients fidèles.',
    teamRole: 'Espace déployé lors de l’onboarding client par les pôles Managing et Tech.',
    fallbackImage: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=1200&auto=format&fit=crop&q=80',
  },
];

export default function EcosystemPage() {
  const { toastSuccess } = useToast();
  const [filterCategory, setFilterCategory] = useState<'all' | 'website' | 'app'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic OpenGraph metadata store per platform ID
  const [ogMetadata, setOgMetadata] = useState<
    Record<string, { image?: string; title?: string; description?: string; loading: boolean }>
  >({});

  // Fetch live OpenGraph metadata on mount for each platform
  useEffect(() => {
    PLATFORMS.forEach((platform) => {
      setOgMetadata((prev) => ({
        ...prev,
        [platform.id]: { loading: true },
      }));

      fetch(`/api/link-preview?url=${encodeURIComponent(platform.url)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && (data.thumbnailUrl || data.title || data.description)) {
            setOgMetadata((prev) => ({
              ...prev,
              [platform.id]: {
                image: data.thumbnailUrl || undefined,
                title: data.title || undefined,
                description: data.description || undefined,
                loading: false,
              },
            }));
          } else {
            setOgMetadata((prev) => ({
              ...prev,
              [platform.id]: { loading: false },
            }));
          }
        })
        .catch(() => {
          setOgMetadata((prev) => ({
            ...prev,
            [platform.id]: { loading: false },
          }));
        });
    });
  }, []);

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
        p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [filterCategory, searchQuery]);

  return (
    <PageFadeIn className="space-y-4 pb-12 max-w-7xl mx-auto">
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
              placeholder="Filtrer plateforme... (/)"
              className="h-7 pl-7 pr-6 text-xs bg-zinc-50/80 border border-zinc-200 rounded-md text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all w-36 sm:w-48"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Segmented Category Filter Pill */}
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/80">
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
              Vitrines
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
              Portails &amp; Apps
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

      {/* ── 2. Visual OpenGraph Card Grid (Raycast / Linear Aesthetic) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlatforms.length === 0 ? (
          <div className="col-span-2 h-40 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-400 font-mono" style={MONO}>
            <span>Aucune plateforme ne correspond à votre recherche.</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
              }}
              className="mt-2 text-emerald-600 font-semibold hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          filteredPlatforms.map((platform) => {
            const og = ogMetadata[platform.id];
            const displayImage = og?.image || platform.fallbackImage;
            const displayTitle = og?.title || platform.tagline;
            const displayDesc = og?.description || platform.description;

            return (
              <div
                key={platform.id}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Visual Banner Preview with OpenGraph Thumbnail */}
                <div className="relative h-48 w-full bg-zinc-950 overflow-hidden border-b border-zinc-100">
                  <img
                    src={displayImage}
                    alt={platform.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Top Status & Type Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{platform.categoryLabel}</span>
                    </span>

                    <span className="text-[10px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10" style={MONO}>
                      {platform.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                  </div>

                  {/* Bottom Title on Image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="text-base font-bold text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                      <span>{platform.name}</span>
                    </h2>
                    <p className="text-xs text-zinc-200 truncate font-medium drop-shadow-sm">
                      {displayTitle}
                    </p>
                  </div>
                </div>

                {/* Card Body (Clean description & role note, no clutter tags) */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs text-zinc-600 leading-relaxed line-clamp-2">
                      {displayDesc}
                    </p>

                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{platform.teamRole}</span>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleCopy(platform.id, platform.url)}
                      className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Copier le lien direct"
                    >
                      {copiedId === platform.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Lien copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Copier l'URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3.5 rounded-lg bg-zinc-900 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>{platform.category === 'website' ? 'Visiter le site' : 'Lancer l’application'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── 3. Quick Help Slide-Over Drawer ── */}
      {isHelpDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setIsHelpDrawerOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white shadow-xl flex flex-col z-10 border-l border-zinc-200 animate-in slide-in-from-right duration-200">
            <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Règles d’Or — Écosystème Minerva
                </h3>
              </div>
              <button
                onClick={() => setIsHelpDrawerOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs text-zinc-700 overflow-y-auto flex-1 leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-zinc-900">1. Déploiement Minerva Flow</p>
                <p className="text-zinc-600">
                  Ne jamais envoyer les identifiants restaurateur par SMS. Toujours utiliser le portail client sécurisé généré dans Trequartista.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-zinc-900">2. Routine Minerva Reach</p>
                <p className="text-zinc-600">
                  L’application Reach est réservée à la session matinale 09h30–12h00 pour la prospection active terrain et Google Maps.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-zinc-900">3. Sites Vitrines Framer</p>
                <p className="text-zinc-600">
                  Les vitrines sont optimisées pour la conversion mobile. Tous les formulaires sont connectés aux webhooks de devis Trequartista.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 text-[11px] font-mono text-zinc-400" style={MONO}>
                Raccourci : Appuyez sur Échap pour fermer.
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
