'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Play,
  Flame,
  Instagram,
  Youtube,
  Sparkles,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Share2,
  Eye,
  TrendingUp,
  Users,
  Layers,
  Film,
  Bookmark,
  Check,
  ExternalLink,
  RefreshCw,
  X,
  Target,
  BarChart3,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

// Custom TikTok SVG Icon
function TikTokIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.78 1.45-.03 2.75-.98 3.14-2.38.16-.54.2-1.11.19-1.68V.02z" />
    </svg>
  );
}

interface SocialChannel {
  id: 'instagram' | 'tiktok' | 'youtube';
  name: string;
  handle: string;
  url: string;
  followers: number;
  impressions30d: number;
  videosCount: number;
  status: 'connected' | 'syncing' | 'needs_auth';
  badgeColor: string;
}

const DEFAULT_CHANNELS: SocialChannel[] = [
  {
    id: 'instagram',
    name: 'Instagram Reels',
    handle: '@minerva_agency',
    url: 'https://instagram.com',
    followers: 12450,
    impressions30d: 94200,
    videosCount: 38,
    status: 'connected',
    badgeColor: 'from-pink-500 to-purple-600',
  },
  {
    id: 'tiktok',
    name: 'TikTok Business',
    handle: '@minerva_flow',
    url: 'https://tiktok.com',
    followers: 18900,
    impressions30d: 142800,
    videosCount: 42,
    status: 'connected',
    badgeColor: 'from-cyan-500 to-black',
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts & Long',
    handle: '@MinervaOperations',
    url: 'https://youtube.com',
    followers: 4320,
    impressions30d: 48600,
    videosCount: 19,
    status: 'connected',
    badgeColor: 'from-red-600 to-red-700',
  },
];

interface VideoIdea {
  id: string;
  title: string;
  hook: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Multi-plateforme';
  format: '9:16 Reel/Short' | '16:9 Long Format' | 'Carrousel Hook';
  status: 'idea' | 'scripted' | 'ready_to_shoot' | 'editing' | 'published';
  targetAudience: string;
  suggestedBy: string;
  priority: 'haute' | 'moyenne' | 'normale';
}

const DEFAULT_VIDEO_IDEAS: VideoIdea[] = [
  {
    id: 'idea-1',
    title: 'Ce que Uber Eats prend RÉELLEMENT sur votre commande de 40$',
    hook: '« Vous pensez payer 40 $ pour vos sushis ? Voici où vont 12.80 $ en coulisses... »',
    platform: 'Multi-plateforme',
    format: '9:16 Reel/Short',
    status: 'ready_to_shoot',
    targetAudience: 'Restaurateurs indépendants & Foodies Montréal',
    suggestedBy: 'Kael Belceus',
    priority: 'haute',
  },
  {
    id: 'idea-2',
    title: 'Avant / Après : Le menu QR Minerva Flow dans un café du Mile-End',
    hook: '« Fini les PDF illisibles qu’il faut zoomer 10 fois pour lire les desserts. »',
    platform: 'Instagram',
    format: '9:16 Reel/Short',
    status: 'scripted',
    targetAudience: 'Propriétaires de cafés & bars branchés',
    suggestedBy: 'Équipe Média',
    priority: 'haute',
  },
  {
    id: 'idea-3',
    title: 'Combien rapporte une borne ou un menu direct à 0% commission ?',
    hook: '« Analyse concrète des relevés Stripe d’un resto qui a économisé 1 450$ ce mois-ci. »',
    platform: 'TikTok',
    format: '9:16 Reel/Short',
    status: 'idea',
    targetAudience: 'Gestionnaires de restaurants québécois',
    suggestedBy: 'Growth SDR',
    priority: 'moyenne',
  },
  {
    id: 'idea-4',
    title: 'Visite immersive 4K : Captation cinéma dans les cuisines d’un partenaire',
    hook: '« Pourquoi la vidéo 4K à table convertit 3x plus que de simples photos statiques. »',
    platform: 'Instagram',
    format: '9:16 Reel/Short',
    status: 'editing',
    targetAudience: 'Restaurateurs haut de gamme',
    suggestedBy: 'Studio Média',
    priority: 'haute',
  },
  {
    id: 'idea-5',
    title: 'Démo en 60 secondes : Modifier son menu et ses prix en direct depuis son téléphone',
    hook: '« Rupture de stock sur la bavette ? 2 clics et c’est masqué sur toutes les tables. »',
    platform: 'YouTube',
    format: '9:16 Reel/Short',
    status: 'published',
    targetAudience: 'Restaurateurs & Directeurs de salle',
    suggestedBy: 'Lead Tech',
    priority: 'normale',
  },
];

interface TopVideoPerformance {
  id: string;
  title: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  views: number;
  completionRatePct: number;
  shares: number;
  saves: number;
  leadsAttributed: number;
  mrrGeneratedCad: number;
  publishedDate: string;
  videoUrl?: string;
}

const TOP_PERFORMING_VIDEOS: TopVideoPerformance[] = [
  {
    id: 'top-1',
    title: 'La commission cachée à 30% des applis de livraison',
    platform: 'TikTok',
    views: 89400,
    completionRatePct: 68.4,
    shares: 1240,
    saves: 3410,
    leadsAttributed: 14,
    mrrGeneratedCad: 1500,
    publishedDate: '12 Août 2026',
  },
  {
    id: 'top-2',
    title: 'Visite & QR Code direct au Caffè Italia (Petite Italie)',
    platform: 'Instagram',
    views: 64200,
    completionRatePct: 74.1,
    shares: 890,
    saves: 2150,
    leadsAttributed: 9,
    mrrGeneratedCad: 1000,
    publishedDate: '24 Août 2026',
  },
  {
    id: 'top-3',
    title: 'Comment configurer Stripe Connect pour son restaurant en 15 min',
    platform: 'YouTube',
    views: 18900,
    completionRatePct: 52.8,
    shares: 410,
    saves: 980,
    leadsAttributed: 5,
    mrrGeneratedCad: 500,
    publishedDate: '02 Sept 2026',
  },
  {
    id: 'top-4',
    title: 'Comparatif : PDF QR Code classique vs Application Flow fluide',
    platform: 'Instagram',
    views: 38200,
    completionRatePct: 61.2,
    shares: 612,
    saves: 1420,
    leadsAttributed: 4,
    mrrGeneratedCad: 500,
    publishedDate: '28 Août 2026',
  },
];

export default function AcquisitionOrganicPage() {
  const { toastSuccess, toastInfo } = useToast();
  const [channels, setChannels] = useState<SocialChannel[]>(DEFAULT_CHANNELS);
  const [ideas, setIdeas] = useState<VideoIdea[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('minerva_video_ideas');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return DEFAULT_VIDEO_IDEAS;
  });

  const [topVideos] = useState<TopVideoPerformance[]>(TOP_PERFORMING_VIDEOS);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal new video idea state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newHook, setNewHook] = useState('');
  const [newPlatform, setNewPlatform] = useState<'Instagram' | 'TikTok' | 'YouTube' | 'Multi-plateforme'>('Instagram');
  const [newFormat, setNewFormat] = useState<'9:16 Reel/Short' | '16:9 Long Format' | 'Carrousel Hook'>('9:16 Reel/Short');
  const [newAudience, setNewAudience] = useState('Restaurateurs indépendants');
  const [newPriority, setNewPriority] = useState<'haute' | 'moyenne' | 'normale'>('haute');

  const saveIdeas = (updated: VideoIdea[]) => {
    setIdeas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('minerva_video_ideas', JSON.stringify(updated));
    }
  };

  const handleAddIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newIdea: VideoIdea = {
      id: `idea-${Date.now()}`,
      title: newTitle.trim(),
      hook: newHook.trim() || '« Hook percutant à rédiger lors du cadrage »',
      platform: newPlatform,
      format: newFormat,
      status: 'idea',
      targetAudience: newAudience,
      suggestedBy: 'Équipe Minerva',
      priority: newPriority,
    };

    const updated = [newIdea, ...ideas];
    saveIdeas(updated);
    toastSuccess('Idée enregistrée !', `La vidéo "${newTitle}" a été ajoutée au backlog.`);
    setNewTitle('');
    setNewHook('');
    setIsModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: VideoIdea['status']) => {
    const updated = ideas.map((idea) => (idea.id === id ? { ...idea, status: newStatus } : idea));
    saveIdeas(updated);
    toastInfo('Statut mis à jour', `La vidéo est maintenant marquée comme "${newStatus}".`);
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchPlatform =
        filterPlatform === 'all' ||
        idea.platform === filterPlatform ||
        idea.platform === 'Multi-plateforme';
      const matchStatus = filterStatus === 'all' || idea.status === filterStatus;
      return matchPlatform && matchStatus;
    });
  }, [ideas, filterPlatform, filterStatus]);

  // Aggregate metrics
  const totalViews = useMemo(() => {
    return channels.reduce((acc, c) => acc + c.impressions30d, 0);
  }, [channels]);

  const totalFollowers = useMemo(() => {
    return channels.reduce((acc, c) => acc + c.followers, 0);
  }, [channels]);

  const totalLeadsAttributed = useMemo(() => {
    return topVideos.reduce((acc, v) => acc + v.leadsAttributed, 0);
  }, [topVideos]);

  const totalMrrGenerated = useMemo(() => {
    return topVideos.reduce((acc, v) => acc + v.mrrGeneratedCad, 0);
  }, [topVideos]);

  return (
    <PageFadeIn className="space-y-5 max-w-7xl mx-auto pb-20">
      {/* ── 1. Top Header & Navigation Switcher ── */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Acquisition Organique Vidéo &amp; Social</span>
            </span>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              Reels • TikTok • Shorts • Conversion CRM
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-zinc-900 tracking-tight">
            Hub de Contenu Vidéo &amp; Croissance Organique
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl">
            Pilotez votre production média verticale, synchronisez vos comptes réseaux et mesurez l’impact commercial direct sur les leads et le MRR généré.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Vidéo à Tourner</span>
          </button>
          <Link
            href="/acquisition"
            className="h-8.5 px-3 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <span>Hub Prospection</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* ── 2. Top Metric Ribbon (Commercial Attribution Focus) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Portée Vidéo Globale (30j)</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 font-mono tracking-tight" style={MONO}>
              <AnimatedNumber value={totalViews} />
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              +38% ce mois
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1">Vues organiques certifiées IG, TikTok &amp; YT</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Audience Cumulée</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700 font-mono tracking-tight" style={MONO}>
              <AnimatedNumber value={totalFollowers} />
            </span>
            <span className="text-[11px] font-bold text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded">
              Abonnés actifs
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1">Forte densité restaurateurs &amp; commerces</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>Leads CRM Attribués</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700 font-mono tracking-tight" style={MONO}>
              <AnimatedNumber value={totalLeadsAttributed} />
            </span>
            <span className="text-[11px] font-bold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">
              Prospects qualifiés
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1">Inbound direct via lien bio &amp; DM réseaux</p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold">
            <span>MRR Généré par le Contenu</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono tracking-tight" style={MONO}>
              {totalMrrGenerated.toLocaleString('fr-CA')} $ CAD
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
              / mois
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1">Clients closés à 0 $ de dépense pub</p>
        </div>
      </div>

      {/* ── 3. Connected Social Channels Bar ── */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Canaux Sociaux Officiels de l’Agence
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full" style={MONO}>
            3 canaux synchronisés en direct
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="p-3.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                  {ch.id === 'instagram' && <Instagram className="w-5 h-5 text-pink-400" />}
                  {ch.id === 'tiktok' && <TikTokIcon className="w-5 h-5 text-cyan-400" />}
                  {ch.id === 'youtube' && <Youtube className="w-5 h-5 text-red-500" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 truncate">{ch.name}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Connecté" />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 block truncate" style={MONO}>
                    {ch.handle}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono" style={MONO}>
                    <span>{ch.followers.toLocaleString('fr-CA')} abonnés</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">{ch.impressions30d.toLocaleString('fr-CA')} vues</span>
                  </div>
                </div>
              </div>

              <a
                href={ch.url}
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 rounded-md bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 shrink-0 transition-colors"
                title="Visiter le profil"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Main 2-Columns: Backlog Vidéos à Tourner (60%) & Top Performance Table (40%) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Colonne Gauche (7 cols lg) : Backlog "Vidéos à Tourner & Idées Fortes" */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl shadow-xs divide-y divide-zinc-100 overflow-hidden">
          {/* Header & Filters */}
          <div className="p-4 bg-zinc-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-600" />
                  <span>Vidéos à Tourner &amp; Idées de Scripts ({filteredIdeas.length})</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pipeline de production média verticale : de l’étincelle créative au tournage sur le terrain.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="h-7 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10.5px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Filtres :</span>
              </span>

              {/* Platform Selector */}
              <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-white text-[11px]">
                {['all', 'Instagram', 'TikTok', 'YouTube'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterPlatform(p)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer',
                      filterPlatform === p ? 'bg-zinc-900 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {p === 'all' ? 'Toutes plateformes' : p}
                  </button>
                ))}
              </div>

              {/* Status Selector */}
              <div className="inline-flex rounded-md border border-zinc-200 p-0.5 bg-white text-[11px]">
                {[
                  { key: 'all', label: 'Tous statuts' },
                  { key: 'ready_to_shoot', label: 'À Tourner' },
                  { key: 'scripted', label: 'Scripté' },
                  { key: 'idea', label: 'Idées' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setFilterStatus(s.key)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer',
                      filterStatus === s.key ? 'bg-emerald-700 text-white font-semibold' : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ideas List */}
          <div className="divide-y divide-zinc-100 max-h-[640px] overflow-y-auto">
            {filteredIdeas.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Film className="w-8 h-8 text-zinc-300 mx-auto" />
                <p className="text-xs font-semibold text-zinc-700">Aucune vidéo ne correspond aux filtres</p>
                <p className="text-[11px] text-zinc-400">Modifiez vos critères ou ajoutez une nouvelle idée de tournage.</p>
              </div>
            ) : (
              filteredIdeas.map((idea) => {
                const isReady = idea.status === 'ready_to_shoot';
                const isPublished = idea.status === 'published';

                return (
                  <div key={idea.id} className="p-4 hover:bg-zinc-50/70 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'text-[10px] font-mono px-2 py-0.2 rounded-full font-bold border uppercase tracking-wider',
                              idea.platform === 'TikTok'
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : idea.platform === 'Instagram'
                                ? 'bg-pink-50 text-pink-800 border-pink-200'
                                : idea.platform === 'YouTube'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            )}
                            style={MONO}
                          >
                            {idea.platform}
                          </span>

                          <span
                            className={cn(
                              'text-[10px] font-mono px-2 py-0.2 rounded-full font-semibold border',
                              idea.status === 'ready_to_shoot'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                : idea.status === 'scripted'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : idea.status === 'editing'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : idea.status === 'published'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            )}
                            style={MONO}
                          >
                            {idea.status === 'ready_to_shoot'
                              ? '🎥 À Tourner'
                              : idea.status === 'scripted'
                              ? '📝 Script Prêt'
                              : idea.status === 'editing'
                              ? '✂️ Montage'
                              : idea.status === 'published'
                              ? '✅ Publié'
                              : '💡 Idée'}
                          </span>

                          {idea.priority === 'haute' && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              Haute Priorité
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-zinc-900 leading-snug">
                          {idea.title}
                        </h3>
                      </div>

                      {/* Status Quick Action Switcher */}
                      <div className="shrink-0 flex items-center gap-1">
                        {idea.status !== 'ready_to_shoot' && idea.status !== 'published' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'ready_to_shoot')}
                            className="h-6 px-2 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Marquer prêt à tourner"
                          >
                            <Video className="w-3 h-3" />
                            <span>À Tourner</span>
                          </button>
                        )}
                        {idea.status === 'ready_to_shoot' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'editing')}
                            className="h-6 px-2 rounded bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Marquer en montage"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>En Montage</span>
                          </button>
                        )}
                        {idea.status === 'editing' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'published')}
                            className="h-6 px-2 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Marquer publié"
                          >
                            <Check className="w-3 h-3" />
                            <span>Publié</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hook Callout */}
                    <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/80 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Hook d’Accroche (3 premières secondes) :</span>
                      </div>
                      <p className="text-zinc-700 italic font-serif">
                        {idea.hook}
                      </p>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-[10.5px] text-zinc-400 font-mono pt-1" style={MONO}>
                      <span>Cible : {idea.targetAudience}</span>
                      <span>Format : {idea.format}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne Droite (5 cols lg) : Top Performance & Attribution Commerciale */}
        <div className="lg:col-span-5 space-y-4">
          {/* Top Performing Videos Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Top Vidéos &amp; Conversion Leads</span>
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Vidéos ayant généré des rendez-vous et des contrats réels.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold" style={MONO}>
                Attribution 100%
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {topVideos.map((video, idx) => (
                <div key={video.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black font-mono text-zinc-400" style={MONO}>
                          #{idx + 1}
                        </span>
                        <span
                          className={cn(
                            'text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold border',
                            video.platform === 'TikTok'
                              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                              : video.platform === 'Instagram'
                              ? 'bg-pink-50 text-pink-800 border-pink-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          )}
                          style={MONO}
                        >
                          {video.platform}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono" style={MONO}>
                          {video.publishedDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 leading-snug truncate">
                        {video.title}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-emerald-700 block" style={MONO}>
                        +{video.mrrGeneratedCad} $ MRR
                      </span>
                      <span className="text-[10px] font-mono text-blue-700 font-semibold" style={MONO}>
                        {video.leadsAttributed} leads
                      </span>
                    </div>
                  </div>

                  {/* Micro-metrics row */}
                  <div className="grid grid-cols-3 gap-1 p-2 rounded bg-zinc-50/70 border border-zinc-200/60 text-center font-mono text-[10px]" style={MONO}>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">VUES</span>
                      <span className="font-bold text-zinc-800">
                        {video.views.toLocaleString('fr-CA')}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">COMPLÉTION</span>
                      <span className="font-bold text-emerald-700">
                        {video.completionRatePct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[9px]">PARTAGES</span>
                      <span className="font-bold text-purple-700">
                        {video.shares}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Lead Qualification Footnote Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Attribution Directe dans le CRM Leads
              </span>
            </div>
            <p className="text-[11.5px] text-zinc-600 leading-relaxed">
              Lorsqu’un prospect réserve une démo ou clique sur votre profil social, le canal d’acquisition est automatiquement enregistré comme <strong className="text-zinc-900">« Organique Social »</strong> dans votre pipeline CRM.
            </p>
            <div className="pt-1">
              <Link
                href="/leads"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <span>Consulter les leads issus de la vidéo sur le CRM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Modal: Add Video Idea ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Nouvelle Idée de Vidéo &amp; Script</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddIdea} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  Titre du Sujet ou Angle Commercial *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pourquoi 90% des menus QR font fuir les clients..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-zinc-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  Hook d’Accroche (Les 3 Premières Secondes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: « Si vous utilisez encore un simple PDF pour votre menu en 2026, vous perdez 1 client sur 3... »"
                  value={newHook}
                  onChange={(e) => setNewHook(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 block">Plateforme Prioritaire</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-zinc-900 bg-white"
                  >
                    <option value="Instagram">Instagram Reels</option>
                    <option value="TikTok">TikTok Business</option>
                    <option value="YouTube">YouTube Shorts</option>
                    <option value="Multi-plateforme">Multi-plateforme</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 block">Niveau de Priorité</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-zinc-900 bg-white"
                  >
                    <option value="haute">Haute (Tournage immédiat)</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="normale">Normale / Backlog</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">Public Cible Spécifique</label>
                <input
                  type="text"
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value)}
                  placeholder="Ex: Restaurateurs italiens, Bars à cocktails..."
                  className="w-full h-9 px-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs text-zinc-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8.5 px-3.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer l’Idée</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
