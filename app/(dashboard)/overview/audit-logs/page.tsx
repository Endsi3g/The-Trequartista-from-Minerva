'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Shield, Clock, Filter, ArrowLeft, CheckCircle2, User, Zap, AlertTriangle } from 'lucide-react';

export default function AuditLogsPage() {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'action' | 'alert' | 'system'>('all');

  const logs = [
    {
      id: 'log-1',
      author: 'Alex Tremblay',
      role: 'Dev Fullstack',
      action: 'Validation du point #13 (Visuels OpenGraph OG) sur la checklist Apex Roofing.',
      category: 'action',
      severity: 'green',
      timestamp: 'Il y a 12 min',
    },
    {
      id: 'log-2',
      author: 'Système Webhook',
      role: 'API Automation',
      action: 'Nouveau lead qualifié capturé depuis le formulaire Framer Apex Roofing (+1 lead).',
      category: 'system',
      severity: 'lime',
      timestamp: 'Il y a 34 min',
    },
    {
      id: 'log-3',
      author: 'Sarah Bouchard',
      role: 'Head of Success',
      action: 'Création de la fiche du nouveau client "Clinique Santé Moderne" (MRR 4,500 $).',
      category: 'action',
      severity: 'green',
      timestamp: 'Il y a 2h',
    },
    {
      id: 'log-4',
      author: 'Moteur d’Alertes',
      role: 'Alert Engine',
      action: 'Déclenchement d’une alerte ambre : le critère Loi 25 (#17) est en attente sur Apex Roofing.',
      category: 'alert',
      severity: 'amber',
      timestamp: 'Il y a 4h',
    },
    {
      id: 'log-5',
      author: 'Alex Tremblay',
      role: 'Dev Fullstack',
      action: 'Synchronisation du créneau 1-on-1 du 13 Août avec Google Calendar.',
      category: 'action',
      severity: 'green',
      timestamp: 'Hier à 16:30',
    },
  ];

  const filteredLogs = filterSeverity === 'all'
    ? logs
    : logs.filter((l) => l.category === filterSeverity);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/overview" className="text-mv-ink-soft hover:text-mv-green transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Journal d'Audit & Traçabilité Ops
            </h1>
            <Badge variant="green">Realtime Stream</Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Historique complet des actions d'équipe, validations de checklist et événements webhooks.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-xs font-semibold">
            {(['all', 'action', 'alert', 'system'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-md transition-all uppercase cursor-pointer ${
                  filterSeverity === sev
                    ? 'bg-mv-green text-mv-cream shadow-mv-sm font-bold'
                    : 'text-mv-ink-soft hover:text-mv-ink'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-mv-lime" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Flux d'Événements Récents ({filteredLogs.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-mv-ink-soft">Supabase Realtime Stream</span>
          </div>
        }
      >
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border hover:border-mv-green/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    log.category === 'alert'
                      ? 'bg-mv-amber-bg border-mv-amber/40 text-mv-amber'
                      : log.category === 'system'
                      ? 'bg-mv-lime-tint border-mv-lime/40 text-mv-lime'
                      : 'bg-mv-green-tint border-mv-green/40 text-mv-green'
                  }`}
                >
                  {log.category === 'alert' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : log.category === 'system' ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-mv-ink">{log.author}</span>
                    <span className="text-[10px] text-mv-ink-faint">({log.role})</span>
                    <Badge variant={log.severity === 'amber' ? 'amber' : 'green'}>
                      {log.category}
                    </Badge>
                  </div>
                  <p className="text-mv-ink-soft mt-1 leading-relaxed">{log.action}</p>
                </div>
              </div>

              <div className="text-[11px] font-mono text-mv-ink-faint shrink-0 text-right">
                {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
