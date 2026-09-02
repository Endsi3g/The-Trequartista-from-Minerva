'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface LatestChangelogEntry {
  id: string;
  title: string;
  version: string | null;
}

const DEFAULT_LATEST_ENTRY: LatestChangelogEntry = {
  id: 'v2-18-0',
  title: 'Refonte Intégrale Minerva Trequartista (v2.18.0)',
  version: '2.18.0',
};

// Powers the auto changelog banner -- the single most recent published entry.
// Returns null until the fetch settles so the banner never renders against a
// placeholder id that would never match what a dismiss actually stores.
export function useLatestChangelogEntry(): LatestChangelogEntry | null {
  const [entry, setEntry] = useState<LatestChangelogEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let resolved: LatestChangelogEntry = DEFAULT_LATEST_ENTRY;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('changelog_entries')
          .select('id, title, version')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data && data.version && data.version >= '2.18.0') {
          resolved = data;
        }
      } catch {
        // Fallback to default v2.18.0 release
      }
      if (!cancelled) setEntry(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return entry;
}
