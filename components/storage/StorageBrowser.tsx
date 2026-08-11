'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UploadCloud, FileText, Image as ImageIcon, Video, Trash2, ExternalLink, Copy, Check, HardDrive } from 'lucide-react';

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: {
    size: number;
    mimetype: string;
  };
}

interface StorageBrowserProps {
  defaultBucket?: 'client-assets' | 'team-documents' | 'academy-media';
  folderPath?: string;
  title?: string;
}

export function StorageBrowser({
  defaultBucket = 'client-assets',
  folderPath = '',
  title = 'Gestionnaire Supabase Storage',
}: StorageBrowserProps) {
  const [bucket, setBucket] = useState(defaultBucket);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [videoImportUrl, setVideoImportUrl] = useState('');
  const [isImportingVideo, setIsImportingVideo] = useState(false);

  const supabase = createClient();

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
        limit: 20,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (!error && data) {
        setFiles(data as unknown as StorageFile[]);
      }
    } catch (err) {
      console.error('Error listing files from Supabase Storage:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [bucket, folderPath]);

  const handleImportVideoUrl = async () => {
    if (!videoImportUrl.trim()) return;
    setIsImportingVideo(true);
    try {
      const res = await fetch('/api/media/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoImportUrl, bucket }),
      });
      const data = await res.json();
      if (data.success) {
        setVideoImportUrl('');
        await loadFiles();
      }
    } catch (err) {
      console.error('Error importing video link:', err);
    } finally {
      setIsImportingVideo(false);
    }
  };


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    const filePath = folderPath ? `${folderPath}/${file.name}` : file.name;

    setUploading(true);
    setUploadProgress(30);

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    setUploadProgress(100);

    if (error) {
      alert(`Erreur d'upload: ${error.message}`);
    } else {
      await loadFiles();
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 400);
  };

  const handleDeleteFile = async (fileName: string) => {
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (!error) {
      setFiles(files.filter((f) => f.name !== fileName));
    }
  };

  const getPublicUrl = (fileName: string) => {
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const copyUrlToClipboard = (fileName: string) => {
    const url = getPublicUrl(fileName);
    navigator.clipboard.writeText(url);
    setCopiedName(fileName);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card
      header={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-mv-lime" />
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider">
              {title}
            </h3>
          </div>

          {/* Bucket Selector */}
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-lg p-1 text-xs font-semibold">
            {(['client-assets', 'team-documents', 'academy-media'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className={`px-2.5 py-1 rounded-md transition-all text-[11px] cursor-pointer ${
                  bucket === b ? 'bg-mv-green text-mv-cream font-bold' : 'text-mv-ink-soft hover:text-mv-ink'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Upload Drag & Drop Zone */}
        <label className="border-2 border-dashed border-mv-border hover:border-mv-green/50 bg-mv-cream-soft/40 hover:bg-mv-green-tint/20 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group">
          <UploadCloud className="w-8 h-8 text-mv-green group-hover:scale-110 transition-transform" />
          <div className="text-xs font-bold text-mv-ink">
            Glissez-déposez un fichier ou <span className="text-mv-green underline">parcourez vos documents</span>
          </div>
          <p className="text-[11px] text-mv-ink-soft">
            Bucket sélectionné : <strong>{bucket}</strong> (Images, PDFs, Vidéos jusqu'à 50 MB)
          </p>
          <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full max-w-xs mt-2 space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-mv-green">
                <span>Upload vers Supabase...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-mv-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-mv-lime rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </label>

        {/* Files Grid */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-mv-ink-soft uppercase tracking-wider flex items-center justify-between">
            <span>Fichiers en Stockage ({files.length})</span>
            <span className="text-[11px] font-normal text-mv-ink-faint">Supabase Storage API</span>
          </div>

          {files.length === 0 ? (
            <div className="p-6 text-center text-xs text-mv-ink-soft bg-mv-cream-soft/30 rounded-lg border border-mv-border">
              Aucun fichier déposé dans ce bucket ({bucket}). Uploadez votre premier document ci-dessus.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => {
                const isImage = file.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
                const isVideo = file.name.match(/\.(mp4|webm|mov)$/i);
                const publicUrl = getPublicUrl(file.name);

                return (
                  <div
                    key={file.name}
                    className="p-3 rounded-lg bg-mv-cream-soft border border-mv-border hover:border-mv-green/40 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-mv-surface border border-mv-border text-mv-green shrink-0">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : isVideo ? (
                          <Video className="w-4 h-4 text-mv-lime" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-mv-ink truncate group-hover:text-mv-green transition-colors">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-mv-ink-soft font-mono mt-0.5">
                          {formatBytes(file.metadata?.size || 1024 * 120)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-mv-border/60 text-xs">
                      <button
                        onClick={() => copyUrlToClipboard(file.name)}
                        className="text-[11px] text-mv-ink-soft hover:text-mv-green flex items-center gap-1 font-semibold cursor-pointer"
                        title="Copier l'URL Publique"
                      >
                        {copiedName === file.name ? (
                          <>
                            <Check className="w-3 h-3 text-mv-lime" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> URL Publique
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-mv-ink-soft hover:text-mv-green transition-colors"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(file.name)}
                          className="p-1 text-mv-ink-soft hover:text-mv-red transition-colors cursor-pointer"
                          title="Supprimer le fichier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
