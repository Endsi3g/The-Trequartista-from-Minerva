'use client';

import React, { useState } from 'react';
import { UploadCloud, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface VideoUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  compact?: boolean;
}

export function VideoUploadField({ value, onChange, bucket = 'client-assets', folder = 'reels', compact = false }: VideoUploadFieldProps) {
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const filePath = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        onChange(data.publicUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-[11px] font-bold w-fit">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'px-2.5 py-1 rounded-md transition-all cursor-pointer',
            mode === 'upload' ? 'bg-mv-green text-white' : 'text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          Téléverser
        </button>
        <button
          type="button"
          onClick={() => setMode('link')}
          className={cn(
            'px-2.5 py-1 rounded-md transition-all cursor-pointer',
            mode === 'link' ? 'bg-mv-green text-white' : 'text-mv-ink-soft hover:text-mv-ink'
          )}
        >
          Lien externe
        </button>
      </div>

      {mode === 'upload' ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) uploadFile(file);
          }}
          className={cn(
            'border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer',
            compact ? 'py-2.5 flex-row gap-2' : 'p-6 flex-col',
            dragOver ? 'border-mv-green bg-mv-green-tint' : 'border-mv-border hover:border-mv-green/50 bg-mv-cream-soft/40'
          )}
        >
          {uploading ? (
            <Loader2 className={cn('text-mv-green animate-spin', compact ? 'w-4 h-4' : 'w-6 h-6')} />
          ) : value ? (
            <Check className={cn('text-mv-green', compact ? 'w-4 h-4' : 'w-6 h-6')} />
          ) : (
            <UploadCloud className={cn('text-mv-green', compact ? 'w-4 h-4' : 'w-6 h-6')} />
          )}
          <div className={cn('font-bold text-mv-ink text-center', compact ? 'text-[11px]' : 'text-xs')}>
            {uploading ? 'Envoi en cours…' : value ? 'Vidéo prête — glissez-en une autre pour remplacer' : 'Glissez-déposez une vidéo ou parcourez vos fichiers'}
          </div>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>
      ) : (
        <div className="relative">
          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mv-ink-soft" />
          <input
            type="url"
            placeholder="https://…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-mv-cream-soft border border-mv-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-mv-ink font-mono focus:outline-none focus:border-mv-green"
          />
        </div>
      )}
    </div>
  );
}
