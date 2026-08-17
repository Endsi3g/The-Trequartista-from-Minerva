'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/providers/ToastProvider';
import { UploadCloud, FileText, Image as ImageIcon, Video, Trash2, ExternalLink, Copy, Check, HardDrive, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

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
  title = 'Gestionnaire de Stockage',
}: StorageBrowserProps) {
  const [bucket, setBucket] = useState(defaultBucket);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [page, setPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const supabase = createClient();
  const { toastError, toastSuccess } = useToast();

  const loadFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (!error && data) {
        setFiles(data as unknown as StorageFile[]);
        // If we got a full page, there may be more
        setTotalFiles(page * PAGE_SIZE + data.length + (data.length === PAGE_SIZE ? 1 : 0));
      }
    } catch (err) {
      console.error('Error listing files from Supabase Storage:', err);
    }
  }, [bucket, folderPath, page, supabase.storage]);

  useEffect(() => { setPage(0); }, [bucket, folderPath]);
  useEffect(() => { loadFiles(); }, [loadFiles]);

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
      toastError("Erreur d'upload", error.message);
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
      toastSuccess('Fichier supprimé', fileName);
      setFiles(files.filter((f) => f.name !== fileName));
    } else {
      toastError('Erreur de suppression', error.message);
    }
    setConfirmDelete(null);
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
            <HardDrive className="w-4 h-4 text-mv-green" />
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
                <span>Envoi en cours...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-mv-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-mv-warm rounded-full transition-all duration-300"
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
            <span className="text-[11px] font-normal text-mv-ink-faint">Stockage cloud</span>
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
                          <Video className="w-4 h-4 text-mv-green" />
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
                            <Check className="w-3 h-3 text-mv-green" /> Copié
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
                          onClick={() => setConfirmDelete(file.name)}
                          className="p-1 text-mv-ink-soft hover:text-mv-red transition-colors cursor-pointer"
                          title="Supprimer le fichier"
                          aria-label={`Supprimer ${file.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {(page > 0 || files.length === PAGE_SIZE) && (
            <div className="flex items-center justify-between pt-3 border-t border-mv-border text-xs text-mv-ink-soft">
              <span>
                Page {page + 1} &mdash; {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + files.length} fichiers
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Page précédente"
                  className="p-1 rounded-md border border-mv-border hover:bg-mv-cream disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={files.length < PAGE_SIZE}
                  aria-label="Page suivante"
                  className="p-1 rounded-md border border-mv-border hover:bg-mv-cream disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Supprimer le fichier"
        description={`Voulez-vous vraiment supprimer « ${confirmDelete} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        isDangerous
        onConfirm={() => confirmDelete && handleDeleteFile(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </Card>
  );
}
