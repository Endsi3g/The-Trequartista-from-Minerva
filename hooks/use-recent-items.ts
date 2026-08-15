'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface RecentItem {
  id: string;
  name: string;
  href: string;
  createdAt: string;
}

// Powers the sidebar's "Aujourd'hui" section -- most recently created
// clients and projects, merged and sorted, so the list reflects real
// activity instead of a fixed/fictional recent-items list.
export function useRecentItems(limit = 4): RecentItem[] {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const [clients, projects] = await Promise.all([
        supabase.from('clients').select('id, name, created_at').order('created_at', { ascending: false }).limit(limit),
        supabase.from('projects').select('id, name, created_at').order('created_at', { ascending: false }).limit(limit),
      ]);
      if (cancelled) return;

      // No generic /clients/[id] or /projects/[id] detail page exists yet --
      // point at the real routed sub-pages that do (ROI tracker, roadmap)
      // rather than link to something that would 404.
      const merged: RecentItem[] = [
        ...(clients.data || []).map((c: { id: string; name: string; created_at: string }) => ({
          id: `client-${c.id}`,
          name: c.name,
          href: `/clients/${c.id}/roi-tracker`,
          createdAt: c.created_at,
        })),
        ...(projects.data || []).map((p: { id: string; name: string; created_at: string }) => ({
          id: `project-${p.id}`,
          name: p.name,
          href: `/projects/${p.id}/roadmap`,
          createdAt: p.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      setItems(merged);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return items;
}
