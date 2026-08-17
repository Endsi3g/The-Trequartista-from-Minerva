'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface LatestChangelogEntry {
  id: string;
  title: string;
  version: string | null;
}

const DEFAULT_LATEST_ENTRY: LatestChangelogEntry = {
  id: 'release-v2-2-0',
  title: 'Refonte Haute Densité Linear & Superhuman (v2.2.0)',
  version: '2.2.0',
};

// Powers the auto changelog banner -- the single most recent published entry
export function useLatestChangelogEntry(): LatestChangelogEntry | null {
  const [entry, setEntry] = useState<LatestChangelogEntry | null>(DEFAULT_LATEST_ENTRY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('changelog_entries')
          .select('id, title, version')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && data) setEntry(data);
      } catch {
        // Fallback to default v2.2.0 release
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return entry;
}
