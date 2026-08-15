'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Zap, ArrowRight, Send, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchClients } from '@/lib/services/supabase-data';

// Real SVG brand logos from https://github.com/GLINCKER/thesvg via jsDelivr
// -- no local asset management, and it degrades gracefully (Zap fallback)
// if a slug doesn't exist there.
const LOGO_SLUG: Record<string, string> = {
  gmail: 'gmail',
  googlecalendar: 'google-calendar',
  granola_mcp: 'granola',
  googledrive: 'google-drive',
  googledocs: 'google-docs',
  notion: 'notion',
  github: 'github',
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
};

function AppLogo({ slug, name }: { slug: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const iconSlug = LOGO_SLUG[slug] || slug;
  if (failed) {
    return (
      <div className="w-10 h-10 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-center shrink-0">
        <Zap className="w-5 h-5 text-mv-green" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-mv-surface border border-mv-border flex items-center justify-center overflow-hidden shrink-0 p-2">
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
  const [activeCategory, setActiveCategory] = useState<string>('Toutes');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
  }, [query, activeCategory]);

  const loadStatuses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations/composio');
      const data = await res.json();
      setApps(data.apps || []);
      setStatuses(data.statuses || {});
      setComposioError(data.error || null);
    } catch {
      setComposioError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of apps) counts[app.category] = (counts[app.category] || 0) + 1;
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [apps]);

  const filteredApps = apps.filter((app) => {
    const matchesCategory = activeCategory === 'Toutes' || app.category === activeCategory;
    const matchesQuery = !query || app.name.toLowerCase().includes(query.toLowerCase());
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
      toastInfo('Fenêtre ouverte', 'Complète la connexion dans le nouvel onglet, puis reviens ici.');
    } catch {
      toastError('Erreur réseau', "Impossible de contacter le serveur.");
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
      toastSuccess('Déconnecté');
      loadStatuses();
    } catch {
      toastError('Erreur réseau', "Impossible de contacter le serveur.");
    } finally {
      setConnectingSlug(null);
    }
  };

  // -- Webhook tester (existing, real functionality, kept below the app grid) --
  const [testWebhookUrl] = useState('http://localhost:3000/api/webhooks/roi-event');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testClientId, setTestClientId] = useState<string | null>(null);
  const [loadingTestClient, setLoadingTestClient] = useState(true);

  useEffect(() => {
    async function loadTestClient() {
      const clients = await fetchClients();
      setTestClientId(clients[0]?.id || null);
      setLoadingTestClient(false);
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
        toastSuccess('Webhook ROI test réussi', `client_roi_metrics mis à jour pour le client (leads_sent_30d: ${data.updatedMetrics?.leads_sent_30d}).`);
      } else {
        toastError('Le webhook a échoué', data.error || 'Réponse inattendue du serveur.');
      }
    } catch {
      toastError('Erreur réseau', "Impossible de contacter le serveur.");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
          Intégrations
        </h1>
        <p className="text-sm text-mv-ink-soft mt-1">
          Parcours et connecte les outils de l&apos;agence, via Composio.
        </p>
      </div>

      {composioError && (
        <Card className="border-mv-amber/40 bg-mv-amber-bg">
          <div className="flex items-start gap-3 text-xs">
            <Zap className="w-4 h-4 text-mv-amber shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-mv-ink">Composio non disponible</div>
              <div className="text-mv-ink-soft mt-0.5">{composioError}</div>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {/* Search + horizontal category filter chips */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-mv-surface border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory('Toutes')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                activeCategory === 'Toutes'
                  ? 'bg-mv-green text-white border-mv-green'
                  : 'bg-mv-surface text-mv-ink-soft border-mv-border hover:border-mv-green/40'
              }`}
            >
              Toutes <span className="opacity-70">{apps.length}</span>
            </button>
            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  activeCategory === cat
                    ? 'bg-mv-green text-white border-mv-green'
                    : 'bg-mv-surface text-mv-ink-soft border-mv-border hover:border-mv-green/40'
                }`}
              >
                {cat} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* App grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-mv-surface border border-mv-border rounded-xl p-6 shimmer-bg animate-mv-shimmer h-[120px]" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-mv-ink-faint text-sm">Aucune intégration trouvée.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredApps.slice(0, visibleCount).map((app) => {
                const status = statuses[app.slug];
                const isConnected = status?.connected;
                const isBusy = connectingSlug === app.slug;
                return (
                  <Card key={app.slug} className="hover:border-mv-green/40 transition-colors flex flex-col">
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <AppLogo slug={app.slug} name={app.name} />
                        {isConnected && (
                          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mv-green opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mv-green border border-mv-surface" />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-mv-ink">{app.name}</span>
                          {isConnected && <Badge variant="green">Connecté</Badge>}
                        </div>
                        <p className="text-xs text-mv-ink-soft mt-0.5 leading-relaxed">{app.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-mv-border flex justify-end">
                      {isAdmin ? (
                        isConnected && status?.connectedAccountId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleDisconnect(app.slug, status.connectedAccountId!)}
                          >
                            {isBusy ? 'Déconnexion…' : 'Déconnecter'}
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => handleConnect(app.slug)}>
                            {isBusy ? 'Connexion…' : 'Connecter'}
                          </Button>
                        )
                      ) : (
                        <span className="text-[11px] text-mv-ink-faint">Admin uniquement</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredApps.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setVisibleCount(filteredApps.length)}>
                  Voir les {filteredApps.length - visibleCount} autres intégrations
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notion SOPs import + webhook tester -- real existing internal integrations, kept below the Composio grid */}
      <Card
        header={
          <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">Base de connaissances Notion</h3>
        }
      >
        <div className="flex items-center justify-between gap-4 text-xs">
          <p className="text-mv-ink-soft">
            Importer les SOPs et documents Notion dans l&apos;Académie interne.
          </p>
          <Link href="/integrations/notion" className="text-mv-green hover:underline flex items-center gap-1 font-bold shrink-0">
            Gérer la synchro Notion <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </Card>

      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              Webhook ROI Leads (/api/webhooks/roi-event)
            </h3>
            <Badge variant="lime">Live Endpoint</Badge>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-mv-ink-soft">
            Envoie un événement HTTP POST pour simuler la capture d&apos;un lead depuis vos formulaires web.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 p-3 rounded-xl bg-mv-cream-soft border border-mv-border font-mono text-mv-ink font-bold overflow-x-auto">
              POST {testWebhookUrl}
            </code>
            {isAdmin ? (
              <Button
                variant="primary"
                size="sm"
                disabled={isTestingWebhook || loadingTestClient || !testClientId}
                icon={<Send className="w-4 h-4" />}
                onClick={handleTestWebhook}
              >
                {isTestingWebhook ? 'Envoi…' : loadingTestClient ? 'Chargement…' : !testClientId ? 'Aucun client' : 'Tester le webhook'}
              </Button>
            ) : (
              <span className="text-[11px] text-mv-ink-faint self-center">Admin uniquement</span>
            )}
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-mv-ink-faint flex items-center gap-1.5">
        <ExternalLink className="w-3 h-3" /> Logos fournis par{' '}
        <a href="https://github.com/GLINCKER/thesvg" target="_blank" rel="noreferrer" className="underline">
          GLINCKER/thesvg
        </a>
      </p>
    </div>
  );
}
