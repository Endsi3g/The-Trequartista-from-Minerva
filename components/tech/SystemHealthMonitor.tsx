'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  Globe,
  Radio,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/providers/ToastProvider';
import { checkSystemHealth } from '@/lib/services/tech';
import type { SystemServiceHealth } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function SystemHealthMonitor() {
  const { toastSuccess, toastError } = useToast();
  const [services, setServices] = useState<SystemServiceHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHealth = async () => {
    try {
      const data = await checkSystemHealth();
      setServices(data);
    } catch {
      toastError('Erreur de diagnostic', 'Impossible de sonder les services système.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHealth();
    toastSuccess('Monitoring actualisé', 'Sondes de latence et connectivité mises à jour.');
  };

  const avgLatency =
    services.length > 0
      ? Math.round(services.reduce((acc, s) => acc + s.latencyMs, 0) / services.length)
      : 0;

  const healthyCount = services.filter((s) => s.status === 'healthy').length;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-mv-surface border border-mv-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Card ── */}
      <Card className="p-5 bg-mv-surface border-mv-border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-mv-green" />
            <h3 className="text-base font-bold font-display text-mv-ink">
              Monitoring Infrastructure & Services
            </h3>
            <Badge variant={healthyCount === services.length ? 'green' : 'amber'} className="text-xs">
              {healthyCount} / {services.length} Opérationnels
            </Badge>
          </div>
          <p className="text-xs text-mv-ink-soft">
            Sondes de connectivité temps réel pour la base de données, les webhooks, les microservices et l’infrastructure Cloud.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold text-mv-ink" style={MONO}>
              {avgLatency} ms
            </div>
            <p className="text-[10.5px] text-mv-ink-faint">Latence moyenne</p>
          </div>

          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-mv-green hover:bg-mv-green/90 text-white text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={cn(refreshing && 'animate-spin')} />
            <span>Actualiser</span>
          </Button>
        </div>
      </Card>

      {/* ── Service Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const isHealthy = service.status === 'healthy';
          return (
            <Card
              key={service.name}
              className="p-4 bg-mv-surface border-mv-border rounded-xl shadow-xs space-y-3 hover:border-mv-green/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}
                  >
                    {service.key === 'supabase' && <Database size={16} />}
                    {service.key === 'edge_functions' && <Cpu size={16} />}
                    {service.key === 'vercel' && <Globe size={16} />}
                    {service.key === 'elevenlabs' && <Radio size={16} />}
                    {service.key === 'notion' && <Server size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-mv-ink line-clamp-1">{service.name}</h4>
                    <span className="text-[10.5px] text-mv-ink-faint font-mono truncate block max-w-[170px]">
                      {service.endpoint}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={isHealthy ? 'green' : 'amber'}
                  className="text-[10px] gap-1 font-medium shrink-0"
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    )}
                  />
                  {isHealthy ? 'En ligne' : 'Attention'}
                </Badge>
              </div>

              <p className="text-[11.5px] text-mv-ink-soft leading-relaxed min-h-[34px]">
                {service.description}
              </p>

              <div className="pt-2 border-t border-mv-border flex items-center justify-between text-[10.5px] text-mv-ink-faint">
                <span style={MONO}>Latence : <strong className="text-mv-ink font-semibold">{service.latencyMs} ms</strong></span>
                <span>Dernier ping : {service.lastChecked}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
