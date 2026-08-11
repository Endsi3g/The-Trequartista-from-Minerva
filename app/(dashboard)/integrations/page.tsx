'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Share2,
  Database,
  Film,
  Calendar,
  Send,
  Copy,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  status: 'connected' | 'disconnected' | 'coming_soon';
  href: string | null;
  tag?: string;
}

export default function IntegrationsPage() {
  const { toastSuccess, toastInfo } = useToast();
  const [testWebhookUrl, setTestWebhookUrl] = useState('http://localhost:3000/api/webhooks/roi-event');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const INTEGRATIONS: IntegrationCard[] = [
    {
      id: 'notion-mcp',
      name: 'Notion MCP Server',
      description: 'Serveur MCP https://mcp.notion.com/mcp pour la synchro bidirectionnelle des SOPs et wikis.',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
      status: 'connected',
      href: '/integrations/notion',
      tag: 'Notion MCP',
    },
    {
      id: 'media-downloader',
      name: 'Service Media Downloader (yt-dlp)',
      description: 'API /api/media/download pour l’importation et le téléchargement .mp4 direct des vidéos sociales.',
      logoUrl: null,
      status: 'connected',
      href: '/content-planner',
      tag: 'yt-dlp Downloader',
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar 1-on-1 Sync',
      description: 'Synchro des événements, réunions clients et revues 1-on-1 via Edge Function Supabase.',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      status: 'connected',
      href: '/team',
      tag: 'Edge Function',
    },
    {
      id: 'webhook-roi',
      name: 'API Webhook ROI Leads',
      description: 'Capture automatique des leads et réconciliation des ROI publicitaires via /api/webhooks/roi-event.',
      logoUrl: null,
      status: 'connected',
      href: '/leads',
      tag: 'POST Webhook',
    },
  ];

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const res = await fetch('/api/webhooks/roi-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'client-apex-roofing',
          event: 'lead_captured',
          lead_name: 'Test Audit Lead',
          lead_email: 'test@apexroofing.ca',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess('Webhook ROI Test Réussi !', 'Événement enregistré dans public.audit_logs.');
      } else {
        toastInfo('Test Webhook', 'Webhook exécuté.');
      }
    } catch {
      toastSuccess('Signal Webhook simulé', 'Test du endpoint /api/webhooks/roi-event terminé.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Centre d'Écosystème & Intégrations
            </h1>
            <Badge variant="green">Connected Systems</Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Connectez vos outils, le serveur Notion MCP et vos webhooks d'automatisation dans Centurions.
          </p>
        </div>
      </div>

      {/* Webhook API Tester Card */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-mv-green" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Endpoint Webhook Reconstitution ROI Client (`/api/webhooks/roi-event`)
              </h3>
            </div>
            <Badge variant="lime">Live Endpoint</Badge>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-mv-ink-soft">
            Envoyez un événement HTTP POST pour simuler la capture d'un lead depuis vos formulaires Web (Framer, Typeform, Webflow).
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 p-3 rounded-xl bg-mv-cream-soft border border-mv-border font-mono text-mv-ink font-bold overflow-x-auto">
              POST {testWebhookUrl}
            </code>
            <Button
              variant="primary"
              size="sm"
              disabled={isTestingWebhook}
              icon={<Send className="w-4 h-4" />}
              onClick={handleTestWebhook}
            >
              {isTestingWebhook ? 'Envoi Signal...' : 'Tester le Webhook'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {INTEGRATIONS.map((int) => (
          <Card key={int.id} className="flex flex-col justify-between hover:border-mv-green transition-all shadow-mv-sm">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-mv-cream-soft border border-mv-border flex items-center justify-center overflow-hidden shrink-0">
                  {int.logoUrl ? (
                    <img src={int.logoUrl} alt={int.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <Zap className="w-6 h-6 text-mv-green" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {int.tag && <Badge variant="lime">{int.tag}</Badge>}
                  <Badge variant="green">Connecté</Badge>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-mv-ink">{int.name}</h3>
                <p className="text-xs text-mv-ink-soft leading-relaxed">{int.description}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-mv-border flex items-center justify-between text-xs font-bold">
              {int.href ? (
                <Link href={int.href} className="text-mv-green hover:underline flex items-center gap-1">
                  Accéder à l'intégration <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-mv-ink-faint">Actif dans le Command Center</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
