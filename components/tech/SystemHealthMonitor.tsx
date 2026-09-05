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
} from 'lucide-react';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-white border border-[#f2f2f2] animate-pulse p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-zinc-100" />
              <div className="space-y-1 flex-1">
                <div className="h-3.5 bg-zinc-100 rounded w-28" />
                <div className="h-2.5 bg-zinc-50 rounded w-20" />
              </div>
            </div>
            <div className="h-8 bg-zinc-50 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* ── Summary Card (Mintlify 16px) ── */}
      <div className="p-5 bg-white border border-[#f2f2f2] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-[#0c8c5e]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#08090a] tracking-tight">
                Monitoring Infrastructure & Microservices
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Sondes de latence et connectivité temps réel sur les services Cloud, webhooks et base de données.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-base font-semibold font-mono text-[#08090a]" style={MONO}>
              {avgLatency} ms
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">Latence moyenne</p>
          </div>

          <span
            className={cn(
              'text-[10px] font-mono px-2 py-1 rounded border font-medium inline-flex items-center gap-1.5',
              healthyCount === services.length
                ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            )}
            style={MONO}
          >
            <span className={cn('w-1.5 h-1.5 rounded', healthyCount === services.length ? 'bg-[#0c8c5e]' : 'bg-amber-500')} />
            {healthyCount} / {services.length} En ligne
          </span>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 px-3 text-xs text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#f2f2f2] hover:border-[#dddddd] rounded shadow-2xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={cn(refreshing && 'animate-spin text-[#0c8c5e]')} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ── Services Grid (Mintlify 16px cards) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {services.map((service) => {
          const isHealthy = service.status === 'healthy';
          return (
            <div
              key={service.name}
              className="p-4 bg-white border border-[#f2f2f2] hover:border-[#dddddd] rounded-2xl shadow-2xs space-y-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded flex items-center justify-center shrink-0 border',
                      isHealthy
                        ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#0c8c5e]'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    )}
                  >
                    {service.key === 'supabase' && <Database size={16} />}
                    {service.key === 'edge_functions' && <Cpu size={16} />}
                    {service.key === 'vercel' && <Globe size={16} />}
                    {service.key === 'elevenlabs' && <Radio size={16} />}
                    {service.key === 'notion' && <Server size={16} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-[#08090a] truncate">{service.name}</h4>
                    <span className="text-[10px] text-zinc-400 font-mono truncate block" style={MONO}>
                      {service.endpoint}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    'text-[9.5px] font-mono px-1.5 py-0.5 rounded border shrink-0 font-medium inline-flex items-center gap-1',
                    isHealthy
                      ? 'text-[#0c8c5e] bg-[#ecfdf5] border-[#a7f3d0]'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  )}
                  style={MONO}
                >
                  <span className={cn('w-1 h-1 rounded', isHealthy ? 'bg-[#0c8c5e]' : 'bg-amber-500')} />
                  {isHealthy ? 'Opérationnel' : 'Dégradé'}
                </span>
              </div>

              <p className="text-[11.5px] text-zinc-500 leading-relaxed min-h-[34px]">
                {service.description}
              </p>

              <div className="pt-2.5 border-t border-[#f2f2f2] flex items-center justify-between text-[10.5px] text-zinc-400 font-mono" style={MONO}>
                <span>Latence : <strong className="text-[#08090a] font-semibold">{service.latencyMs} ms</strong></span>
                <span>Ping : {service.lastChecked}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
