'use client';

import React from 'react';

// Shared between client reels (content_posts) and Minerva team content
// (minerva_content_items) so both creation forms offer the same platform
// and format choices instead of drifting apart.
export const REEL_PLATFORM_OPTIONS = [
  { value: 'Instagram', label: 'Instagram Reels' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube Shorts' },
  { value: 'LinkedIn', label: 'LinkedIn Video' },
  { value: 'Facebook', label: 'Facebook Reels' },
] as const;

export const REEL_FORMAT_OPTIONS = [
  { value: 'Reel 30s', label: 'Reel 30s (Court)' },
  { value: 'Reel 60s', label: 'Reel 60s (Standard)' },
  { value: 'Reel 90s', label: 'Reel 90s (Détaillé)' },
  { value: 'Carrousel', label: 'Carrousel 5-10 slides' },
  { value: 'Story', label: 'Story interactive' },
] as const;

interface ReelDistributionFieldsProps {
  platform: string;
  format: string;
  onPlatformChange: (value: string) => void;
  onFormatChange: (value: string) => void;
}

export function ReelDistributionFields({ platform, format, onPlatformChange, onFormatChange }: ReelDistributionFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">Plateforme</label>
        <select
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value)}
          className="w-full h-9 px-2.5 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
        >
          {REEL_PLATFORM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-mv-ink-soft block">Format / Durée</label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full h-9 px-2.5 text-xs bg-mv-cream-soft border border-mv-border rounded-lg text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
        >
          {REEL_FORMAT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
