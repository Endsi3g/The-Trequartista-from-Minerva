'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Shield, Clock, ArrowLeft, User, Zap, AlertTriangle } from 'lucide-react';
import { fetchAuditLogs } from '@/lib/services/supabase-data';
import { useSupabaseRealtime } from '@/components/providers/SupabaseRealtimeProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuditLog } from '@/lib/types';

export default function AuditLogsPage() {
  const [filterCategory, setFilterCategory] = useState<'all' | 'action' | 'alert' | 'system'>('all');
  const [dbLogs, setDbLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isConnected, lastUpdateTimestamp, latestAuditLog } = useSupabaseRealtime();

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      const data = await fetchAuditLogs(50);
      setDbLogs(data);
      setIsLoading(false);
    }
    loadLogs();
  }, [lastUpdateTimestamp]);

  const displayLogs = dbLogs;


  const filteredLogs = displayLogs.filter((log) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'alert') return log.action.includes('alert') || log.table_name === 'alerts';
    if (filterCategory === 'system') return log.actor_name.includes('Système') || log.actor_name.includes('Trigger') || log.table_name === 'leads';
    return !log.actor_name.includes('Système') && !log.action.includes('alert');
  });

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
            <Badge variant={isConnected ? 'green' : 'amber'}>
              {isConnected ? 'Realtime Connected' : 'Supabase Live'}
            </Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Historique complet des actions d'équipe, validations de checklist et événements webhooks en direct de Supabase Postgres.
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-xs font-semibold">
            {(['all', 'action', 'alert', 'system'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-md transition-all uppercase cursor-pointer ${
                  filterCategory === cat
                    ? 'bg-mv-green text-mv-cream shadow-mv-sm font-bold'
                    : 'text-mv-ink-soft hover:text-mv-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Realtime Alert Callout when new log arrives */}
      {latestAuditLog && (
        <div className="p-4 rounded-xl bg-mv-green-tint border border-mv-green/40 flex items-center justify-between text-xs animate-mv-fade-up">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-mv-green" />
            <span className="font-bold text-mv-green">Dernier événement Supabase Realtime :</span>
            <span className="text-mv-ink font-semibold">{latestAuditLog.action}</span>
          </div>
          <span className="text-[10px] font-mono text-mv-ink-faint">
            {new Date(latestAuditLog.created_at).toLocaleTimeString('fr-CA')}
          </span>
        </div>
      )}

      {/* Logs Feed */}
      <Card
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-mv-warm" />
              <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
                Flux d'Événements Récents ({filteredLogs.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-mv-ink-soft">
              {isLoading ? 'Chargement...' : 'Supabase Postgres Channel'}
            </span>
          </div>
        }
      >
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isAlert = log.action.includes('alert') || log.table_name === 'alerts';
            const isSystem = log.actor_name.includes('Système') || log.actor_name.includes('Trigger') || log.table_name === 'leads';
            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-mv-cream-soft border border-mv-border hover:border-mv-green/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAlert
                        ? 'bg-mv-amber-bg border-mv-amber/40 text-mv-amber'
                        : isSystem
                        ? 'bg-mv-warm-tint border-mv-warm/40 text-mv-warm'
                        : 'bg-mv-green-tint border-mv-green/40 text-mv-green'
                    }`}
                  >
                    {isAlert ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isSystem ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-mv-ink">{log.actor_name}</span>
                      <span className="text-[10px] text-mv-ink-faint">({log.table_name})</span>
                      <Badge variant={isAlert ? 'amber' : isSystem ? 'lime' : 'green'}>
                        {isAlert ? 'alert' : isSystem ? 'system' : 'action'}
                      </Badge>
                    </div>
                    <p className="text-mv-ink-soft mt-1 leading-relaxed">{log.action}</p>
                  </div>
                </div>

                  <div className="text-[11px] font-mono text-mv-ink-faint shrink-0 text-right">
                    {new Date(log.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}

          {filteredLogs.length === 0 && (
            <EmptyState
              icon={Shield}
              title="Aucun Journal d'Audit"
              description="Aucun événement d'audit n'a encore été enregistré dans la base de données Supabase public.audit_logs."
            />
          )}
        </div>
      </Card>
    </div>
  );
}


