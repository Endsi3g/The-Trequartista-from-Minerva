'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Zap,
  Send,
  ExternalLink,
  Plug,
  Kanban,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Copy,
  Check,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchClients } from '@/lib/services/supabase-data';
import { PageFadeIn } from '@/components/ui/page-transition';
import { SkeletonRows } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const LOGO_SLUG: Record<string, string> = {
  slack: 'slack',
  discord: 'discord',
  microsoft_teams: 'microsoft-teams',
  google_drive: 'google-drive',
  googledrive: 'google-drive',
  googledocs: 'google-docs',
  dropbox: 'dropbox',
  onedrive: 'onedrive',
  github: 'github',
  gmail: 'gmail',
  googlecalendar: 'google-calendar',
  notion: 'notion',
  supabase: 'supabase',
  stripe: 'stripe',
  brevo: 'brevo',
  calendly: 'calendly',
  facebook: 'facebook',
  linkedin: 'linkedin',
  youtube: 'youtube',
  google_search_console: 'google-search-console',
  apify: 'apify',
  elevenlabs: 'elevenlabs',
  granola_mcp: 'granola',
};

function MicroAppLogo({ slug, name }: { slug: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const iconSlug = LOGO_SLUG[slug] || slug;

  if (failed) {
    return (
      <div className="w-6 h-6 rounded bg-mv-cream-soft border border-mv-border flex items-center justify-center shrink-0">
        <Zap className="w-3.5 h-3.5 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded bg-white border border-mv-border flex items-center justify-center overflow-hidden shrink-0 p-0.5 shadow-2xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/${iconSlug}/default.svg`}
        alt={name}
        className="w-full h-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

interface ComposioApp {
  slug: string;
  name: string;
  category: string;
  description: string;
}

interface ConnectionStatus {
  connected: boolean;
  connectedAccountId: string | null;
  status: string | null;
}

export default function IntegrationsPage() {
  const { toastSuccess, toastInfo, toastError } = useToast();
  const { role } = useCurrentUser();
  const isAdmin = role === 'admin';

  const [apps, setApps] = useState<ComposioApp[]>([]);
  const [statuses, setStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [composioError, setComposioError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All integrations');
  const [isEnvModalOpen, setIsEnvModalOpen] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/composio');
      const data = await res.json();
      setApps(data.apps || []);
      setStatuses(data.statuses || {});
      setComposioError(data.error || null);
    } catch {
      setComposioError('Impossible de contacter le serveur Composio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (!isInput && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of apps) counts[app.category] = (counts[app.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [apps]);

  const filteredApps = apps.filter((app) => {
    const matchesCategory = activeCategory === 'All integrations' || app.category === activeCategory;
    const matchesQuery =
      !query ||
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.description.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const handleConnect = async (slug: string) => {
    setConnectingSlug(slug);
    try {
      const res = await fetch('/api/integrations/composio/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkit: slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.redirectUrl) {
        toastError('Connexion refusée', data.error || 'Erreur inconnue.');
        return;
      }
      window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
      toastInfo('Fenêtre ouverte', 'Complétez la connexion OAuth dans le nouvel onglet.');
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setConnectingSlug(null);
    }
  };

  const handleDisconnect = async (slug: string, connectedAccountId: string) => {
    setConnectingSlug(slug);
    try {
      const res = await fetch('/api/integrations/composio/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectedAccountId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError('Déconnexion refusée', data.error || 'Erreur inconnue.');
        return;
      }
      toastSuccess('Déconnecté', 'L’intégration a été dissociée.');
      loadStatuses();
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setConnectingSlug(null);
    }
  };

  // Webhook tester state
  const [testWebhookUrl] = useState('http://localhost:3000/api/webhooks/roi-event');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testClientId, setTestClientId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTestClient() {
      const clients = await fetchClients();
      setTestClientId(clients[0]?.id || null);
    }
    loadTestClient();
  }, []);

  const handleTestWebhook = async () => {
    if (!testClientId) {
      toastError('Aucun client disponible', 'Créez au moins un client avant de tester ce webhook.');
      return;
    }
    setIsTestingWebhook(true);
    try {
      const res = await fetch('/api/webhooks/roi-event/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: testClientId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toastSuccess('Webhook ROI test réussi', `Métriques recalculées pour le client avec succès.`);
      } else {
        toastError('Le webhook a échoué', data.error || 'Réponse inattendue du serveur.');
      }
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText('COMPOSIO_API_KEY=votre_cle_api_ici');
    setCopiedEnv(true);
    toastSuccess('Copié !', 'Snippet copié dans le presse-papier.');
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const connectedCount = apps.filter((app) => statuses[app.slug]?.connected).length;

  return (
    <PageFadeIn className="space-y-3 max-w-6xl mx-auto pb-12 font-sans">
      {/* ── 1. En-tête Contextuel (Toolbar 40px) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-0.5">
        <div className="space-y-0.5">
          <div className="text-xs text-mv-ink-faint font-mono flex items-center gap-1.5">
            <span>Minerva</span>
            <span>/</span>
            <span>Tech & Ingénierie</span>
            <span>/</span>
            <span className="text-mv-ink-soft">Intégrations</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-semibold text-mv-ink tracking-tight">
              Intégrations & Écosystème API
            </h1>
            <span className="text-[10px] font-mono text-mv-ink-faint bg-mv-cream-soft border border-mv-border px-1.5 py-0.2 rounded font-medium">
              Composio + MCP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://connect.composio.dev/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md inline-flex items-center gap-1.5 transition-colors shadow-xs"
            title="Connexion directe au hub Composio MCP"
          >
            <Zap size={12} />
            <span>Composio Connect MCP</span>
            <ExternalLink size={10} />
          </a>
          <Link
            href="/tech"
            className="h-7 px-2.5 text-xs font-medium border border-mv-border hover:bg-mv-cream-soft text-mv-ink-soft rounded-md inline-flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>← Console Tech</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Ruban Métrique Connecté (Top Strip) ── */}
      <div className="bg-white border border-mv-border rounded-md px-3 py-1.5 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono shadow-xs text-mv-ink-soft">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-mv-ink" style={MONO}>
              {loading ? '17' : apps.length}
            </span>
            <span className="text-mv-ink-faint uppercase">DISPONIBLES</span>
          </div>
          <span className="text-mv-ink-faint">•</span>
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold', connectedCount > 0 ? 'text-emerald-600' : 'text-mv-ink')} style={MONO}>
              {loading ? '0' : connectedCount}
            </span>
            <span className="text-mv-ink-faint uppercase">CONNECTÉES</span>
          </div>
          <span className="text-mv-ink-faint">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-mv-ink" style={MONO}>
              {categories.length || 6}
            </span>
            <span className="text-mv-ink-faint uppercase">CATÉGORIES</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              composioError ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
            )}
          />
          <span className={composioError ? 'text-amber-700' : 'text-emerald-700 font-medium'}>
            {composioError ? 'COMPOSIO ENGINE EN ATTENTE' : 'COMPOSIO ENGINE CONNECTÉ'}
          </span>
        </div>
      </div>

      {/* ── 3. Bannière d'Alerte Actionable (Composio API Key) ── */}
      {composioError && (
        <div className="text-xs bg-mv-cream-soft border border-mv-border rounded-md px-3 py-1.5 flex items-center justify-between text-mv-ink-soft shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <span className="truncate">
              ⚠️ Clé <code className="font-mono bg-zinc-200/70 px-1 py-0.2 rounded text-[11px] text-zinc-800">COMPOSIO_API_KEY</code> manquante ou inactive.
            </span>
          </div>
          <button
            onClick={() => setIsEnvModalOpen(true)}
            className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer ml-2"
          >
            <span>Configurer dans les variables d'environnement →</span>
          </button>
        </div>
      )}

      {/* ── 4. Layout à 2 Colonnes (Sidebar Filtres + Grille Dense d'Apps) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-3.5 items-start">
        {/* Colonne Gauche (Filtres & Recherche) */}
        <div className="sticky top-4 border border-mv-border rounded-lg p-2.5 bg-white shadow-xs space-y-2">
          <div className="relative">
            <Search className="w-3 h-3 text-mv-ink-faint absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrer (/)..."
              className="w-full h-7 pl-6 pr-2 text-xs rounded-md bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-0.5 pt-1">
            <button
              onClick={() => setActiveCategory('All integrations')}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left',
                activeCategory === 'All integrations'
                  ? 'bg-mv-cream-soft text-mv-ink font-semibold'
                  : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft'
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                {activeCategory === 'All integrations' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                )}
                Toutes les intégrations
              </span>
              <span className="text-[10px] font-mono text-mv-ink-faint" style={MONO}>
                ({apps.length || 17})
              </span>
            </button>

            {categories.map(([cat, count]) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer text-left',
                    isActive
                      ? 'bg-mv-cream-soft text-mv-ink font-semibold'
                      : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft'
                  )}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    {cat}
                  </span>
                  <span className="text-[10px] font-mono text-mv-ink-faint" style={MONO}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colonne Droite (Featured Hub + Grille 2-Colonnes) */}
        <div className="space-y-3">
          {/* Featured Core Hub : GitHub & Framer Studio (52px) */}
          <div className="border border-mv-border rounded-lg p-2.5 bg-white shadow-xs flex items-center justify-between gap-3 h-[52px]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-mv-ink truncate">GitHub & Framer Studio</h2>
                  <span className="text-[9.5px] font-mono px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-medium">
                    Core Minerva
                  </span>
                </div>
                <p className="text-[11px] text-mv-ink-faint truncate max-w-md">
                  Déploiement continu, hébergement Framer, webhooks et automatisations d'acquisition.
                </p>
              </div>
            </div>

            <Link
              href="/tech"
              className="h-6 px-2.5 text-[11px] font-medium border border-mv-border bg-white hover:bg-mv-cream-soft text-mv-ink rounded-md inline-flex items-center gap-1 shrink-0 shadow-2xs transition-colors"
            >
              <span>Console Tech</span>
              <ArrowRight size={10} />
            </Link>
          </div>

          {/* Grille des Intégrations (2 Colonnes — Hauteur 48px) */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 border border-mv-border rounded-lg bg-white p-2.5 animate-pulse" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-10 text-center text-xs text-mv-ink-faint border border-mv-border rounded-lg bg-white">
              Aucune intégration trouvée pour cette recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredApps.map((app) => {
                const status = statuses[app.slug];
                const isConnected = status?.connected;
                const isBusy = connectingSlug === app.slug;

                return (
                  <div
                    key={app.slug}
                    className="border border-mv-border hover:border-mv-border rounded-lg p-2.5 bg-white flex items-center justify-between gap-2 shadow-xs transition-colors h-[48px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MicroAppLogo slug={app.slug} name={app.name} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-mv-ink truncate">
                          {app.name}
                        </div>
                        <div className="text-[10.5px] text-mv-ink-faint truncate max-w-[170px]" title={app.description}>
                          {app.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {app.slug === 'notion' && (
                        <Link
                          href="/integrations/notion"
                          className="h-6 px-1.5 text-[10.5px] font-mono text-mv-ink-soft hover:text-mv-ink border border-mv-border rounded hover:bg-mv-cream-soft inline-flex items-center"
                          title="Gérer les pages Notion"
                        >
                          <ExternalLink size={10} />
                        </Link>
                      )}

                      {isConnected ? (
                        <div className="flex items-center gap-1">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            <span>Connecté</span>
                          </span>
                          <button
                            onClick={() => status.connectedAccountId && handleDisconnect(app.slug, status.connectedAccountId)}
                            disabled={isBusy}
                            className="h-6 px-1.5 text-[10px] text-mv-ink-faint hover:text-rose-600 transition-colors cursor-pointer"
                            title="Déconnecter"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(app.slug)}
                          disabled={isBusy}
                          className="h-6 px-2.5 text-[11px] font-medium border border-mv-border bg-white hover:bg-mv-cream-soft text-mv-ink-soft rounded-md shadow-2xs inline-flex items-center transition-colors cursor-pointer"
                        >
                          <span>{isBusy ? '...' : 'Connecter'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Console de Test Webhook Compacte (Bottom Strip — 40px) ── */}
      {isAdmin && (
        <div className="bg-white border border-mv-border rounded-lg p-3 shadow-xs space-y-2 mt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-mv-ink-faint font-mono flex items-center justify-between">
            <span>⚡ TESTEUR WEBHOOK ROI LEADS (/api/webhooks/roi-event)</span>
            <span className="text-[10px] text-mv-ink-faint">Simulation d'attribution de lead</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              readOnly
              value={testWebhookUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="w-full sm:flex-1 h-7 text-xs font-mono bg-mv-cream-soft border border-mv-border rounded px-2.5 text-mv-ink-soft select-all focus:outline-hidden"
            />
            <Button
              size="sm"
              disabled={isTestingWebhook}
              onClick={handleTestWebhook}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Play size={11} />
              <span>{isTestingWebhook ? 'Envoi...' : 'Déclencher test'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Modale de Configuration Composio API Key ── */}
      {isEnvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-mv-border rounded-xl shadow-mv-lg max-w-md w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-mv-border">
              <span className="text-xs font-bold text-mv-ink flex items-center gap-1.5">
                <Plug className="w-3.5 h-3.5 text-emerald-600" />
                Configuration de Composio API Key
              </span>
              <button
                onClick={() => setIsEnvModalOpen(false)}
                className="text-mv-ink-faint hover:text-mv-ink-soft cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-mv-ink-soft leading-relaxed">
              Pour activer les connexions automatiques à Gmail, Google Drive, Stripe et GitHub, ajoutez votre clé dans votre fichier <code className="font-mono text-mv-ink bg-mv-cream-soft px-1 py-0.2 rounded">.env.local</code> ou les variables Vercel :
            </p>

            <div className="p-2.5 rounded bg-zinc-900 text-zinc-100 font-mono text-xs flex items-center justify-between">
              <span className="truncate">COMPOSIO_API_KEY=votre_cle_api</span>
              <button
                onClick={copyEnvSnippet}
                className="text-mv-ink-faint hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                title="Copier le snippet"
              >
                {copiedEnv ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <a
                  href="https://connect.composio.dev/mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Hub Composio MCP Connect</span>
                  <ExternalLink size={10} />
                </a>
                <a
                  href="https://app.composio.dev/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mv-ink-faint hover:underline inline-flex items-center gap-1 text-[11px]"
                >
                  <span>Clés API</span>
                  <ExternalLink size={10} />
                </a>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEnvModalOpen(false)}
                className="h-7 text-xs"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
