'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Eye, Clock } from 'lucide-react';
import type { LinkPreview } from '@/lib/services/link-preview';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';

const PLATFORM_LABEL: Record<LinkPreview['platform'], string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  other: 'Lien externe',
};

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatViews(count: number | null): string | null {
  if (count === null) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M vues`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k vues`;
  return `${count} vues`;
}

// Shared preview card for editorial-calendar link fields (Reels, Minerva
// content) -- fetches title/thumbnail/view-count/duration server-side via
// /api/link-preview, always with a real "Ouvrir" link to the native URL.
// Never fabricates a thumbnail/title when the platform doesn't provide one
// (e.g. Instagram) -- shows a plain open-link card instead.
export function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPreview(null);
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="border border-mv-border rounded-xl p-3 flex items-center gap-3">
        <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonText className="w-3/4" />
          <SkeletonText className="w-1/2 h-2.5" />
        </div>
      </div>
    );
  }

  const platformLabel = PLATFORM_LABEL[preview?.platform ?? 'other'];

  if (!preview?.available) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 border border-mv-border rounded-xl p-3 hover:border-mv-green/50 transition-colors group"
      >
        <div className="min-w-0">
          <div className="text-xs font-bold text-mv-ink truncate group-hover:text-mv-green transition-colors">
            Ouvrir sur {platformLabel}
          </div>
          <div className="text-[11px] text-mv-ink-faint truncate">{url}</div>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-mv-ink-faint shrink-0" />
      </a>
    );
  }

  const duration = formatDuration(preview.durationSeconds);
  const views = formatViews(preview.viewCount);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 border border-mv-border rounded-xl p-3 hover:border-mv-green/50 transition-colors group"
    >
      {preview.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.thumbnailUrl} alt={preview.title || platformLabel} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-mv-cream-soft" />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-mv-cream-soft border border-mv-border flex items-center justify-center shrink-0 text-[10px] font-bold text-mv-ink-faint">
          {platformLabel}
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="text-xs font-bold text-mv-ink line-clamp-2 group-hover:text-mv-green transition-colors">
          {preview.title || `Ouvrir sur ${platformLabel}`}
        </div>
        {preview.authorName && <div className="text-[11px] text-mv-ink-soft truncate">{preview.authorName}</div>}
        {(views || duration) && (
          <div className="flex items-center gap-2.5 text-[10.5px] text-mv-ink-faint pt-0.5">
            {views && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" /> {views}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {duration}
              </span>
            )}
          </div>
        )}
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-mv-ink-faint shrink-0" />
    </a>
  );
}
