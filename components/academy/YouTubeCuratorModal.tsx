'use client';

import React, { useState } from 'react';
import {
  Youtube,
  Search,
  ExternalLink,
  Sparkles,
  X,
  Play,
  Copy,
  Check,
  BookOpen,
  Filter,
  Layers,
  Flame,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoAssetPlayer, extractYouTubeVideoId } from '@/components/media/VideoAssetPlayer';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

interface YouTubeCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'prospection' | 'managing' | 'tech' | 'reach';
}

interface CuratedSearchTemplate {
  title: string;
  category: 'prospection' | 'managing' | 'tech' | 'reach';
  query: string;
  description: string;
  suggestedChannels: string[];
}

const CURATED_TEMPLATES: CuratedSearchTemplate[] = [
  {
    title: 'Prospection B2B & Cold Calling Restauration',
    category: 'prospection',
    query: 'cold calling restaurant b2b sales live sales call pitch',
    description: 'Vrais appels à froid de vente avec gestion des objections des gérants de restaurant.',
    suggestedChannels: ['Trent Dressel', 'Alex Hormozi', 'Josh Braun'],
  },
  {
    title: 'Closing & Négociation Démo sans Friction',
    category: 'prospection',
    query: 'b2b software demo script SaaS closing techniques sales framework',
    description: 'Structures de démonstration produit haute conversion et passage à la signature.',
    suggestedChannels: ['Chris Do', 'Patrick Dang', 'Jeremy Miner'],
  },
  {
    title: 'Minerva Reach & Prospection Locale Google Maps',
    category: 'reach',
    query: 'google maps b2b lead generation local business outreach workflow',
    description: 'Stratégies d’extraction de commerces locaux et qualification sans friction.',
    suggestedChannels: ['Jordan Welch', 'Liam Ottley', 'Brett Malinowski'],
  },
  {
    title: 'Account Management & Rétention Agence (90%+)',
    category: 'managing',
    query: 'agency client onboarding client retention frameworks customer success SaaS',
    description: 'Protocoles d’accueil client J+2, prévention du churn et pilotage de charge d’équipe.',
    suggestedChannels: ['Nick Saraev', 'Agency Velocity', 'Goran de Silva'],
  },
  {
    title: 'Next.js 16 App Router & Supabase RLS Haute Performance',
    category: 'tech',
    query: 'Next.js 16 App Router Supabase PostgreSQL RLS architecture tutorial',
    description: 'Tutoriels avancés sur l’architecture moderne Next.js et la sécurité de base de données.',
    suggestedChannels: ['Jack Herrington', 'Theo - t3.gg', 'Supabase Official'],
  },
  {
    title: 'Intégration Systèmes POS & Imprimantes Thermiques ESC/POS',
    category: 'tech',
    query: 'ESC POS thermal printer web bluetooth receipt printing kitchen display system',
    description: 'Guides d’ingénierie pour les protocoles d’impression en cuisine et caisses directes.',
    suggestedChannels: ['Web Dev Simplified', 'Dave Gray', 'Fireship'],
  },
];

export function YouTubeCuratorModal({
  isOpen,
  onClose,
  defaultCategory = 'prospection',
}: YouTubeCuratorModalProps) {
  const { toastSuccess, toastError } = useToast();
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [customSearch, setCustomSearch] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  if (!isOpen) return null;

  const filteredTemplates = activeCategory === 'all'
    ? CURATED_TEMPLATES
    : CURATED_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleOpenYouTubeSearch = (query: string) => {
    const encoded = encodeURIComponent(query);
    window.open(`https://www.youtube.com/results?search_query=${encoded}`, '_blank');
  };

  const handleCopySearchUrl = (query: string, idx: number) => {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://www.youtube.com/results?search_query=${encoded}`;
    navigator.clipboard.writeText(searchUrl);
    setCopiedIndex(idx);
    toastSuccess('Lien de recherche copié', 'Collez-le dans un nouvel onglet ou dans une SOP.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const testVideoId = extractYouTubeVideoId(testUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-mv-surface border border-mv-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-mv-border flex items-center justify-between bg-gradient-to-r from-red-500/5 via-transparent to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold font-display text-mv-ink">
                  Explorateur & Curation Vidéos YouTube
                </h2>
                <Badge variant="neutral" className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border-red-200">
                  Académie Minerva
                </Badge>
              </div>
              <p className="text-xs text-mv-ink-soft">
                Dénichez des vidéos de formation haute valeur pour votre workspace ou intégrez une démonstration.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-black/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Workspace Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-mv-ink-soft mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Domaine :
            </span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'prospection', label: 'Prospection & Vente' },
              { id: 'reach', label: 'Minerva Reach' },
              { id: 'managing', label: 'Managing & Ops' },
              { id: 'tech', label: 'Tech & Systèmes' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs',
                  activeCategory === cat.id
                    ? 'bg-mv-green text-white shadow-xs'
                    : 'bg-mv-cream border border-mv-border text-mv-ink-soft hover:text-mv-ink'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Custom Search Input */}
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-3.5 flex items-center gap-2">
            <Search className="w-4 h-4 text-mv-ink-faint shrink-0" />
            <input
              type="text"
              placeholder="Rechercher une compétence ou sujet spécifique sur YouTube (ex: qualification de restaurants, scripts closers)..."
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customSearch.trim()) {
                  handleOpenYouTubeSearch(customSearch.trim());
                }
              }}
              className="bg-transparent border-none text-xs text-mv-ink placeholder:text-mv-ink-faint focus:outline-none flex-1 font-medium"
            />
            {customSearch.trim() && (
              <Button
                size="sm"
                onClick={() => handleOpenYouTubeSearch(customSearch.trim())}
                className="bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir sur YouTube</span>
              </Button>
            )}
          </div>

          {/* Curated Search Query Templates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Requêtes Expertes de Formation & Playbooks</span>
              </h3>
              <span className="text-[11px] text-mv-ink-faint font-mono">
                {filteredTemplates.length} templates
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTemplates.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-mv-surface border border-mv-border rounded-xl p-4 space-y-3 hover:border-mv-green/40 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-mv-ink text-xs line-clamp-1">{item.title}</span>
                      <Badge variant="neutral" className="text-[10px] uppercase font-bold shrink-0">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="text-mv-ink-soft text-[11px] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 pt-1 flex-wrap text-[10px] text-mv-ink-faint">
                      <span className="font-semibold text-mv-ink-soft">Chaînes phares :</span>
                      {item.suggestedChannels.map((c, ci) => (
                        <span key={ci} className="bg-black/[0.04] px-1.5 py-0.5 rounded text-mv-ink font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-mv-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopySearchUrl(item.query, idx)}
                      className="text-[11px] h-7 px-2.5 bg-mv-cream border-mv-border text-mv-ink-soft hover:text-mv-ink gap-1 cursor-pointer flex-1"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-mv-green" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === idx ? 'Copié' : 'Copier lien'}</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleOpenYouTubeSearch(item.query)}
                      className="text-[11px] h-7 px-3 bg-red-600 hover:bg-red-700 text-white gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Explorer</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direct URL Tester & Previewer */}
          <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600" />
                <h4 className="font-bold text-xs text-mv-ink">Tester & Prévisualiser une Vidéo (YouTube / Shorts)</h4>
              </div>
              {testVideoId && (
                <Badge variant="green" className="text-[10px] font-bold">
                  URL YouTube valide
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Collez une URL YouTube ou Shorts (ex: https://youtu.be/... ou https://youtube.com/shorts/...)"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="bg-mv-surface border border-mv-border rounded-lg px-3 py-2 text-xs text-mv-ink placeholder:text-mv-ink-faint focus:outline-none flex-1 font-mono"
              />
              {testUrl && (
                <button
                  onClick={() => setTestUrl('')}
                  className="px-2 py-1 text-xs text-mv-ink-faint hover:text-mv-ink cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>

            {testVideoId ? (
              <div className="pt-2">
                <VideoAssetPlayer src={testUrl} title="Aperçu YouTube" initialAspectRatio="16:9" />
              </div>
            ) : testUrl.trim() ? (
              <p className="text-[11px] text-amber-600">
                Format d’URL YouTube non reconnu. Utilisez un lien du type youtube.com/watch?v=..., youtu.be/..., ou youtube.com/shorts/...
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-mv-border flex items-center justify-between bg-mv-cream-soft">
          <div className="text-[11px] text-mv-ink-faint">
            💡 Astuce : Vous pouvez coller n’importe quel lien YouTube directement dans le champ vidéo lors de la création d’une SOP.
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer bg-mv-surface"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
