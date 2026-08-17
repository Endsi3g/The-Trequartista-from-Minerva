'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { fetchDocuments, addDocument, deleteDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';

export default function DocumentsPage() {
  const router = useRouter();
  const { id: userId } = useCurrentUser();
  const confirmDialog = useConfirm();
  const { toastError } = useToast();

  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setDocuments(await fetchDocuments());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!userId) return;
    setCreating(true);
    const doc = await addDocument('Document sans titre', userId);
    setCreating(false);
    if (!doc) {
      toastError('Erreur', 'Impossible de créer le document.');
      return;
    }
    router.push(`/documents/${doc.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, doc: TeamDocument) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await confirmDialog({
      title: 'Supprimer ce document ?',
      message: `« ${doc.title} » sera retiré définitivement pour toute l'équipe.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    await deleteDocument(doc.id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Documents</h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Espace d&apos;équipe partagé — briefs, notes de réunion, tout ce qu&apos;on écrit ensemble en direct.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate} disabled={creating}>
          {creating ? 'Création…' : 'Nouveau document'}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-mv-ink-soft">Chargement…</div>
      ) : documents.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun document pour le moment" description="Crée le premier document partagé ci-dessus." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`}>
              <Card className="h-full hover:border-mv-green/40 transition-all group">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-9 h-9 rounded-lg bg-mv-green-tint text-mv-green flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc)}
                    className="p-1.5 rounded-lg text-mv-ink-faint hover:text-mv-red hover:bg-mv-red-bg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-bold text-sm text-mv-ink mt-3 truncate">{doc.title}</h3>
                <p className="text-[11px] text-mv-ink-faint mt-1">
                  Modifié le {new Date(doc.updated_at).toLocaleDateString('fr-CA')}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
