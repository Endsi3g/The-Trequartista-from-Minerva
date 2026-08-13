'use client';

import React, { useState } from 'react';
import { UploadCloud, Check, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const filePath = `changelog/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('team-documents').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (!error) {
        const { data } = supabase.storage.from('team-documents').getPublicUrl(filePath);
        onChange(data.publicUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  if (value) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden border border-mv-border">
        <img src={value} alt="Aperçu" className="w-full max-h-64 object-cover" />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-mv-ink/70 text-white hover:bg-mv-ink cursor-pointer"
          title="Retirer l'image"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
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
        'border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer',
        dragOver ? 'border-mv-green bg-mv-green-tint' : 'border-mv-border hover:border-mv-green/50 bg-mv-cream-soft/40'
      )}
    >
      {uploading ? (
        <Loader2 className="w-6 h-6 text-mv-green animate-spin" />
      ) : (
        <UploadCloud className="w-6 h-6 text-mv-green" />
      )}
      <div className="text-xs font-bold text-mv-ink text-center">
        {uploading ? 'Envoi en cours…' : 'Glissez-déposez une image ou parcourez vos fichiers (optionnel)'}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />
    </label>
  );
}
