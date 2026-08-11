'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuditLog } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SupabaseRealtimeContextType {
  isConnected: boolean;
  latestAuditLog: AuditLog | null;
  recentAuditLogs: AuditLog[];
  lastUpdateTimestamp: number;
}

const SupabaseRealtimeContext = createContext<SupabaseRealtimeContextType>({
  isConnected: false,
  latestAuditLog: null,
  recentAuditLogs: [],
  lastUpdateTimestamp: Date.now(),
});

export function SupabaseRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestAuditLog, setLatestAuditLog] = useState<AuditLog | null>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    try {
      channel = supabase
        .channel('centurions-realtime-global')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'audit_logs' },
          (payload) => {
            const newLog = payload.new as AuditLog;
            console.log('[Supabase Realtime] New audit log:', newLog);
            setLatestAuditLog(newLog);
            setRecentAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
            setLastUpdateTimestamp(Date.now());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'project_launch_checks' },
          (payload) => {
            console.log('[Supabase Realtime] Launch checks change:', payload);
            setLastUpdateTimestamp(Date.now());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          (payload) => {
            console.log('[Supabase Realtime] Clients table change:', payload);
            setLastUpdateTimestamp(Date.now());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'projects' },
          (payload) => {
            console.log('[Supabase Realtime] Projects table change:', payload);
            setLastUpdateTimestamp(Date.now());
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Supabase Realtime] Successfully subscribed to postgres_changes.');
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        });
    } catch (err) {
      console.warn('[Supabase Realtime] Subscription error:', err);
      setIsConnected(false);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return (
    <SupabaseRealtimeContext.Provider
      value={{
        isConnected,
        latestAuditLog,
        recentAuditLogs,
        lastUpdateTimestamp,
      }}
    >
      {children}
    </SupabaseRealtimeContext.Provider>
  );
}

export function useSupabaseRealtime() {
  return useContext(SupabaseRealtimeContext);
}
