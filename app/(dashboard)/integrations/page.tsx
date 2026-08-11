'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import type { IntegrationStatus } from '@/lib/types';

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  status: IntegrationStatus;
  href: string | null;
  docsUrl?: string;
}

const INTEGRATIONS: IntegrationCard[] = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Liez vos pages et bases de données Notion à Centurions pour centraliser vos SOPs, briefs clients et wikis d\'équipe.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
    status: 'disconnected',
    href: '/integrations/notion',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Synchronisez vos campagnes Google Ads pour suivre le ROAS et les coûts par lead directement dans le cockpit ROI.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Ads_logo.svg',
    status: 'connected',
    href: '/integrations/google-ads',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Synchro des événements, réunions clients et revues 1-on-1 directement dans votre agenda Centurions.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
    status: 'connected',
    href: '/integrations/google-calendar',
  },
  {
    id: 'nmotion',
    name: 'nMotion',
    description: 'Connectez nMotion pour synchroniser les données de performance sportive et les métriques d\'équipe avec Centurions.',
    logoUrl: null,
    status: 'coming_soon',
    href: null,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Recevez des alertes Centurions directement dans vos channels Slack. Notifications de ROI, checklist et performances.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
    status: 'coming_soon',
    href: null,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connectez votre API WhatsApp Business pour le suivi des messages automatisés et les stats d\'engagement client.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
    status: 'coming_soon',
    href: null,
  },
];

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-mv-green bg-mv-green-tint px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Connecté
    </span>
  );
  if (status === 'coming_soon') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-mv-ink-faint bg-mv-cream-soft px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Bientôt
    </span>
  );
  if (status === 'error') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-mv-red bg-mv-red-bg px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Erreur
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-mv-ink-soft bg-mv-border px-2 py-0.5 rounded-full">
      Non connecté
    </span>
  );
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  // Fetch real connection status from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { createBrowserClient } = await import('@supabase/ssr');
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from('integration_connections')
          .select('integration_id, status');
        if (data && data.length > 0) {
          setIntegrations((prev) =>
            prev.map((int) => {
              const found = data.find((d: { integration_id: string; status: IntegrationStatus }) => d.integration_id === int.id);
              return found ? { ...int, status: found.status } : int;
            })
          );
        }
      } catch {
        // Table not set up yet — use defaults
      }
    })();
  }, []);

  const connected = integrations.filter((i) => i.status === 'connected');
  const available = integrations.filter((i) => i.status === 'disconnected' || i.status === 'error');
  const soon = integrations.filter((i) => i.status === 'coming_soon');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-mv-green-tint flex items-center justify-center">
          <Zap className="w-5 h-5 text-mv-green" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-mv-ink">Intégrations</h1>
          <p className="text-sm text-mv-ink-soft">
            Connectez vos outils pour centraliser vos données dans Centurions.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-mv-ink-soft">
          <CheckCircle2 className="w-4 h-4 text-mv-green" />
          <span>{connected.length} connecté{connected.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Connected */}
      {connected.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-mv-ink-faint mb-3">Connectées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connected.map((int) => (
              <IntegrationCardComponent key={int.id} integration={int} />
            ))}
          </div>
        </section>
      )}

      {/* Available */}
      {available.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-mv-ink-faint mb-3">Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((int) => (
              <IntegrationCardComponent key={int.id} integration={int} />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {soon.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-mv-ink-faint mb-3">Bientôt disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {soon.map((int) => (
              <IntegrationCardComponent key={int.id} integration={int} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function IntegrationCardComponent({ integration: int }: { integration: IntegrationCard }) {
  const isComingSoon = int.status === 'coming_soon';
  const cardInner = (
    <div
      className={[
        'group p-5 rounded-2xl border bg-mv-surface flex flex-col gap-4 transition-all duration-200',
        isComingSoon
          ? 'border-mv-border opacity-60 cursor-default'
          : 'border-mv-border hover:border-mv-green/40 hover:shadow-mv-md cursor-pointer',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-center overflow-hidden shrink-0">
          {int.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={int.logoUrl} alt={int.name} className="w-7 h-7 object-contain" />
          ) : (
            <Zap className="w-5 h-5 text-mv-ink-faint" />
          )}
        </div>
        <StatusBadge status={int.status} />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-mv-ink">{int.name}</h3>
        <p className="text-xs text-mv-ink-soft leading-relaxed">{int.description}</p>
      </div>

      {!isComingSoon && (
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs font-semibold text-mv-green group-hover:underline">
            {int.status === 'connected' ? 'Gérer' : 'Connecter'} →
          </span>
          {int.docsUrl && (
            <a
              href={int.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-mv-ink-faint hover:text-mv-ink"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );

  if (isComingSoon || !int.href) return <div key={int.id}>{cardInner}</div>;
  return <Link key={int.id} href={int.href}>{cardInner}</Link>;
}
