'use client';

import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Utensils,
  Building2,
  Target,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { useToast } from '@/components/providers/ToastProvider';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface PlatformCard {
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

const PLATFORMS: PlatformCard[] = [
  {
    id: 'flow-website',
    name: 'Minerva Flow',
    category: 'website',
    typeLabel: 'Site Web Produit (Framer)',
    tagline: 'Fidélisation & Marges pour Restaurants',
    url: 'https://minervaflow.framer.website/',
    description:
      'Vitrine officielle de notre système de commande directe et de fidélisation. Protège les marges en cuisine et fait revenir les clients sans commission intermédiaire. Inclut l\'offre d\'essai accompagné de 14 jours et installation sur place à Montréal.',
    badgeVariant: 'emerald',
    highlights: ['Essai accompagné 14 jours', '0% commission de livraison', 'QR Code tables & comptoir', 'Installation sur place Montréal'],
    teamRole: 'À envoyer aux prospects restaurateurs en amont de démo ou après qualification terrain.',
  },
  {
    id: 'studio-website',
    name: 'Minerva Studio',
    category: 'website',
    typeLabel: 'Site Web Agence (Framer)',
    tagline: 'L’Agence Montréalaise pour les Restaurants',
    url: 'https://minervastudio.framer.website/',
    description:
      'Site vitrine institutionnel de l\'agence Minerva. Présente notre accompagnement 360 pour restos et cafés : conception de sites Framer haute conversion, production de contenus vidéo Reels, identité visuelle et acquisition locale.',
    badgeVariant: 'purple',
    highlights: ['Sites Framer sur-mesure', 'Production Réels & Brand', 'SEO Local Google Maps', 'Retainer Agence Élite 360'],
    teamRole: 'À présenter aux clients souhaitant une refonte complète de marque ou des campagnes de contenu.',
  },
  {
    id: 'reach-app',
    name: 'Minerva Reach',
    category: 'app',
    typeLabel: 'Application Métier (Desktop / Mobile)',
    tagline: 'Prospection Terrain & Routine /today',
    url: 'https://minerva-os-lite-desktop.vercel.app/today',
    description:
      'Application ultra-rapide optimisée pour la prospection quotidienne. Permet aux commerciaux de traiter 30 à 50 fiches commerces montréalaises par jour, d\'identifier les signaux de fidélisation et de synchroniser les leads dans Trequartista.',
    badgeVariant: 'blue',
    highlights: ['Vue quotidienne /today', 'Qualification Google Maps', 'Synchronisation 1-clic Trequartista', 'Compteur de quota quotidien'],
    teamRole: 'Outil de travail quotidien de l\'équipe Ventes / SDR / Closers de 09h30 à 12h00.',
  },
  {
    id: 'flow-saas',
    name: 'Minerva Flow (SaaS)',
    category: 'app',
    typeLabel: 'Application Client & Gestion',
    tagline: 'Dashboard Restaurateur & Commande en Ligne',
    url: 'https://minerva-flow.vercel.app/login',
    description:
      'Portail d\'administration en ligne utilisé par nos clients restaurateurs pour piloter leur menu, réceptionner les commandes directes, imprimer les tickets en cuisine et exporter leur base de clients fidélisés.',
    badgeVariant: 'amber',
    highlights: ['Menu digital interactif', 'Impression thermique cuisine', 'Base de données clients fidèles', 'Passerelle Stripe Connect'],
    teamRole: 'Espace déployé lors de l\'onboarding client par les pôles Managing et Tech.',
  },
];

export default function EcosystemPage() {
  const { toastSuccess } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toastSuccess('Lien copié !', url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const websites = PLATFORMS.filter((p) => p.category === 'website');
  const apps = PLATFORMS.filter((p) => p.category === 'app');

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── 1. Header Banner ── */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-mv-green/10 border border-mv-green/20 flex items-center justify-center text-mv-green shrink-0 shadow-xs">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-mv-ink tracking-tight">
                Hub Écosystème Minerva
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-mv-green/15 text-mv-green border border-mv-green/30" style={MONO}>
                4 Plateformes Actives
              </span>
            </div>
            <p className="text-xs text-mv-ink-soft mt-0.5">
              Accès direct, ressources et cas d'usage des sites web officiels et applications de l'agence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center gap-2 text-xs font-semibold text-mv-ink">
            <span className="w-2 h-2 rounded-full bg-mv-green animate-pulse" />
            <span>Fidélisation &amp; Marges Montréal</span>
          </div>
        </div>
      </div>

      {/* ── 2. Sites Web Officiels (Framer) ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-mv-green" />
            <h2 className="text-sm font-bold text-mv-ink uppercase tracking-wider">
              Sites Web Officiels de la Compagnie (Vitrines &amp; Acquisition)
            </h2>
          </div>
          <span className="text-xs font-mono text-mv-ink-faint">Framer Hosting Live</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {websites.map((platform) => (
            <div
              key={platform.id}
              className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between hover:border-mv-green/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-mv-ink group-hover:text-mv-green transition-colors">
                        {platform.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                          platform.badgeVariant === 'emerald'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {platform.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-mv-ink-soft mt-0.5">
                      {platform.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(platform.id, platform.url)}
                      className="p-1.5 rounded-lg border border-mv-border text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
                      title="Copier l'URL"
                    >
                      {copiedId === platform.id ? (
                        <Check className="w-3.5 h-3.5 text-mv-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-mv-green text-white hover:bg-mv-green-dark transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                      title="Ouvrir le site"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <p className="text-xs text-mv-ink-soft leading-relaxed">
                  {platform.description}
                </p>

                {/* Highlights Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {platform.highlights.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-mv-cream-soft border border-mv-border/80 text-[11px] text-mv-ink font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Role Callout */}
              <div className="mt-4 pt-3.5 border-t border-mv-border/80 flex items-start gap-2 text-[11.5px] text-mv-ink-faint">
                <ShieldCheck className="w-3.5 h-3.5 text-mv-green mt-0.5 shrink-0" />
                <span>
                  <strong className="text-mv-ink">Usage Équipe :</strong> {platform.teamRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Applications & Portails Métier ── */}
      <div className="space-y-3.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-mv-ink uppercase tracking-wider">
              Applications &amp; Portails Métier (Opérations &amp; Terrain)
            </h2>
          </div>
          <span className="text-xs font-mono text-mv-ink-faint">Production Vercel Cloud</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((platform) => (
            <div
              key={platform.id}
              className="bg-mv-surface border border-mv-border rounded-2xl p-5 shadow-mv-sm flex flex-col justify-between hover:border-mv-green/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-mv-ink group-hover:text-mv-green transition-colors">
                        {platform.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${
                          platform.badgeVariant === 'blue'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {platform.typeLabel}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-mv-ink-soft mt-0.5">
                      {platform.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(platform.id, platform.url)}
                      className="p-1.5 rounded-lg border border-mv-border text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft transition-colors cursor-pointer"
                      title="Copier l'URL"
                    >
                      {copiedId === platform.id ? (
                        <Check className="w-3.5 h-3.5 text-mv-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-mv-green text-white hover:bg-mv-green-dark transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                      title="Ouvrir l'application"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <p className="text-xs text-mv-ink-soft leading-relaxed">
                  {platform.description}
                </p>

                {/* Highlights Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {platform.highlights.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-mv-cream-soft border border-mv-border/80 text-[11px] text-mv-ink font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Role Callout */}
              <div className="mt-4 pt-3.5 border-t border-mv-border/80 flex items-start gap-2 text-[11.5px] text-mv-ink-faint">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <span>
                  <strong className="text-mv-ink">Usage Équipe :</strong> {platform.teamRole}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Guide de Navigation Rapide pour l'Équipe ── */}
      <div className="bg-mv-cream-soft/70 border border-mv-border rounded-2xl p-5 shadow-mv-xs space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-mv-ink" />
          <h3 className="text-xs font-bold text-mv-ink uppercase tracking-wider">
            Règle d'Or de l'Écosystème Minerva (Montréal)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-mv-ink-soft">
          <div className="p-3 bg-white border border-mv-border rounded-xl space-y-1">
            <span className="font-bold text-mv-ink block">1. Pôle Ventes &amp; Prospection</span>
            <p className="leading-relaxed">
              Utiliser <strong>Minerva Reach</strong> (/today) le matin pour qualifier les restaurants. Présenter <strong>minervaflow.framer.website</strong> en démo avec l'offre d'essai accompagné de 14 jours.
            </p>
          </div>
          <div className="p-3 bg-white border border-mv-border rounded-xl space-y-1">
            <span className="font-bold text-mv-ink block">2. Pôle Managing &amp; Rétention</span>
            <p className="leading-relaxed">
              Activer le compte restaurateur sur <strong>Minerva Flow (SaaS)</strong> à J+2. Configurer le QR code comptoir et le programme de fidélité pour stimuler les commandes régulières.
            </p>
          </div>
          <div className="p-3 bg-white border border-mv-border rounded-xl space-y-1">
            <span className="font-bold text-mv-ink block">3. Pôle Tech &amp; Systèmes</span>
            <p className="leading-relaxed">
              Maintenir la synchronisation API entre Reach et Trequartista. Tester les imprimantes thermiques ESC/POS en cuisine et veiller à la disponibilité 99.9%.
            </p>
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
