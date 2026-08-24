'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone, CheckCircle2, MessageSquareWarning, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { LinkPreviewCard } from '@/components/content/LinkPreviewCard';
import { fetchContentPost, updateContentPost } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import type { ContentPost } from '@/lib/types';

const APPROVAL_LABEL: Record<string, string> = {
  pending: 'En attente de votre avis',
  approved: 'Approuvé',
  changes_requested: 'Modification demandée',
};

const APPROVAL_VARIANT: Record<string, 'neutral' | 'green' | 'amber'> = {
  pending: 'neutral',
  approved: 'green',
  changes_requested: 'amber',
};

export default function PortalContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastSuccess, toastError } = useToast();

  const [post, setPost] = useState<ContentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const data = await fetchContentPost(id);
      setPost(data);
      setFeedback(data?.client_feedback || '');
      setLoading(false);
    })();
  }, [id]);

  const handleApprove = async () => {
    if (!post) return;
    setSaving(true);
    const ok = await updateContentPost(post.id, { client_approval: 'approved', client_feedback: null });
    setSaving(false);
    if (ok) {
      setPost({ ...post, client_approval: 'approved', client_feedback: undefined });
      setShowFeedbackForm(false);
      toastSuccess('Reel approuvé', 'Votre équipe Minerva a été notifiée.');
    } else {
      toastError('Erreur', "Impossible d'enregistrer votre approbation pour le moment.");
    }
  };

  const handleRequestChanges = async () => {
    if (!post || !feedback.trim()) return;
    setSaving(true);
    const ok = await updateContentPost(post.id, { client_approval: 'changes_requested', client_feedback: feedback.trim() });
    setSaving(false);
    if (ok) {
      setPost({ ...post, client_approval: 'changes_requested', client_feedback: feedback.trim() });
      setShowFeedbackForm(false);
      toastSuccess('Modification demandée', 'Votre commentaire a été transmis à l\'équipe.');
    } else {
      toastError('Erreur', "Impossible d'enregistrer votre commentaire pour le moment.");
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="h-6 shimmer-bg rounded w-1/3 mx-auto animate-mv-shimmer" />
        <div className="h-48 shimmer-bg rounded w-full animate-mv-shimmer" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-12 text-center space-y-2">
        <p className="text-sm font-bold text-mv-ink">Contenu introuvable.</p>
        <Link href="/portal/calendar" className="text-xs text-mv-green hover:underline">Retour au calendrier</Link>
      </div>
    );
  }

  const approval = post.client_approval || 'pending';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <button onClick={() => router.push('/portal/calendar')} className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour au calendrier
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-mv-ink font-display">{post.title}</h1>
          <p className="text-xs text-mv-ink-soft mt-1 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {new Date(post.scheduled_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
            {post.platform && ` · ${post.platform}`}
          </p>
        </div>
        <Badge variant={APPROVAL_VARIANT[approval]}>{APPROVAL_LABEL[approval]}</Badge>
      </div>

      <Card header={<h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2"><Smartphone className="w-4 h-4 text-mv-green" /> Aperçu</h3>}>
        {post.video_url ? (
          <VideoAssetPlayer src={post.video_url} poster={post.thumbnail_url} title={post.title} initialAspectRatio="9:16" />
        ) : (
          <div className="p-8 text-center border border-dashed border-mv-border rounded-2xl bg-mv-cream-soft text-xs text-mv-ink-soft">
            Aucune vidéo disponible pour le moment.
          </div>
        )}
        {post.caption && (
          <p className="mt-4 text-sm text-mv-ink leading-relaxed whitespace-pre-wrap">{post.caption}</p>
        )}
        {post.native_url && (
          <div className="mt-4">
            <LinkPreviewCard url={post.native_url} />
          </div>
        )}
      </Card>

      {approval === 'changes_requested' && post.client_feedback && (
        <div className="p-4 rounded-xl bg-mv-amber-bg border border-mv-amber/30 text-sm text-mv-ink">
          <p className="font-bold text-mv-amber mb-1">Votre commentaire</p>
          <p>{post.client_feedback}</p>
        </div>
      )}

      <Card>
        {showFeedbackForm ? (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-mv-ink">Qu'aimeriez-vous voir changer ?</label>
            <textarea
              rows={4}
              autoFocus
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: Le hook ne reflète pas bien notre offre, pouvez-vous l'ajuster ?"
              className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3.5 text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors resize-y"
            />
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setShowFeedbackForm(false)} disabled={saving}>Annuler</Button>
              <Button variant="primary" size="sm" onClick={handleRequestChanges} disabled={saving || !feedback.trim()}>
                {saving ? 'Envoi…' : 'Envoyer le commentaire'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleApprove}
              disabled={saving || approval === 'approved'}
            >
              {approval === 'approved' ? 'Déjà approuvé' : 'Approuver ce reel'}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              icon={<MessageSquareWarning className="w-4 h-4" />}
              onClick={() => setShowFeedbackForm(true)}
              disabled={saving}
            >
              Demander une modification
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
