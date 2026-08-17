'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Zap, ArrowRight, Send, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { fetchClients } from '@/lib/services/supabase-data';
import { PageFadeIn } from '@/components/ui/page-transition';

const LOGO_SLUG: Record<string, string> = {
  slack: 'slack',
  discord: 'discord',
  microsoft_teams: 'microsoft-teams',
  google_drive: 'google-drive',
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
};

function AppLogo({ slug, name }: { slug: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const iconSlug = LOGO_SLUG[slug] || slug;
  if (failed) {
    return (
      <div className="w-11 h-11 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-center shrink-0">
        <Zap className="w-5 h-5 text-mv-green" />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-xl bg-mv-surface border border-mv-border flex items-center justify-center overflow-hidden shrink-0 p-2 shadow-mv-sm">
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
    const matchesCategory = activeCategory === 'All integrations' || app.category === activeCategory;
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
      toastInfo('Fenêtre ouverte', 'Complétez la connexion dans le nouvel onglet.');
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

  // Webhook tester
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
        toastSuccess('Webhook ROI test réussi', `Métriques mises à jour avec succès.`);
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
    <PageFadeIn className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header (Shadcnblocks inspiration) */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
          Intégrations
        </h1>
        <p className="text-xs sm:text-sm text-mv-ink-soft mt-1">
          Parcourez et connectez vos applications et services favoris.
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

      {/* 2-Column Layout (Shadcnblocks inspiration) */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Left Sidebar: Search & Categories */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-mv-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-mv-surface border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green shadow-mv-sm"
            />
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-2 shadow-mv-sm space-y-0.5">
            <button
              onClick={() => setActiveCategory('All integrations')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === 'All integrations'
                  ? 'bg-mv-cream-soft text-mv-ink font-bold shadow-mv-sm border border-mv-border/80'
                  : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/50'
              }`}
            >
              <span>Toutes les intégrations</span>
              <span className="text-[10px] text-mv-ink-faint">{apps.length}</span>
            </button>

            {categories.map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-mv-cream-soft text-mv-ink font-bold shadow-mv-sm border border-mv-border/80'
                    : 'text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream-soft/50'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] text-mv-ink-faint">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Cards List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-mv-surface border border-mv-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <Card className="py-12 text-center text-xs text-mv-ink-soft">
              Aucune intégration trouvée pour cette recherche.
            </Card>
          ) : (
            filteredApps.map((app) => {
              const status = statuses[app.slug];
              const isConnected = status?.connected;
              const isBusy = connectingSlug === app.slug;

              return (
                <div
                  key={app.slug}
                  className="bg-mv-surface border border-mv-border rounded-2xl p-4 sm:p-5 shadow-mv-sm hover:border-mv-green/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <AppLogo slug={app.slug} name={app.name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-mv-ink font-display">{app.name}</span>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Connecté
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mv-ink-soft mt-0.5 line-clamp-1">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {app.slug === 'notion' && (
                      <Link href="/integrations/notion">
                        <Button variant="outline" size="sm" icon={<ExternalLink className="w-3 h-3" />}>
                          Pages
                        </Button>
                      </Link>
                    )}

                    {isConnected ? (
                      <button
                        onClick={() => status.connectedAccountId && handleDisconnect(app.slug, status.connectedAccountId)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-xl border border-mv-border bg-mv-cream-soft text-mv-ink-soft hover:text-mv-red hover:border-mv-red/40 text-xs font-bold transition-all cursor-pointer"
                      >
                        {isBusy ? '...' : 'Déconnecter'}
                      </button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleConnect(app.slug)}
                        className="bg-mv-ink hover:bg-black text-white"
                      >
                        {isBusy ? 'Connexion...' : 'Connecter'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Webhook Test Section (Admin) */}
      {isAdmin && (
        <Card
          header={
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Testeur Webhook ROI Leads (/api/webhooks/roi-event)
              </h3>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-mv-ink-soft">
              Simule un événement d&apos;attribution de lead entrant pour recalculer automatiquement les métriques ROI du client.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={testWebhookUrl}
                className="flex-1 p-2.5 rounded-xl bg-mv-cream-soft border border-mv-border font-mono text-mv-ink text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={isTestingWebhook}
                onClick={handleTestWebhook}
                icon={<Zap className="w-3.5 h-3.5 text-mv-green" />}
              >
                {isTestingWebhook ? 'Envoi...' : 'Déclencher test'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </PageFadeIn>
  );
}
