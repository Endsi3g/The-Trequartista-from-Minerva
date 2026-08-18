'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  BookOpen,
  Copy,
  Check,
  FileText,
  Sparkles,
  Share2,
  ListChecks,
  AlertTriangle,
  Lightbulb,
  Info,
  ChevronRight,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAcademySop,
  fetchCompletedSopIds,
  markSopCompleted,
  unmarkSopCompleted,
  addDocument,
} from '@/lib/services/supabase-data';
import type { AcademySOP } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function SopDetailPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [sop, setSop] = useState<AcademySOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Interactive Checklist steps
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const [sopData, completedIds] = await Promise.all([
        fetchAcademySop(rawId),
        user ? fetchCompletedSopIds(user.id) : Promise.resolve([]),
      ]);
      setSop(sopData);
      if (user) {
        setUserId(user.id);
        setCompleted(completedIds.includes(rawId));
      }
      setLoading(false);
    })();
  }, [rawId]);

  const toggleCompleted = async () => {
    if (!userId || !rawId) return;
    setSaving(true);
    const ok = completed ? await unmarkSopCompleted(userId, rawId) : await markSopCompleted(userId, rawId);
    setSaving(false);
    if (ok) {
      setCompleted(!completed);
      toastSuccess(completed ? 'SOP réouverte' : 'SOP complétée !', completed ? 'La SOP est marquée à faire.' : 'Bravo pour votre progression.');
    }
  };

  const handleCopyOutreachScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    toastSuccess('Script copié', 'Le script de prospection est dans votre presse-papiers.');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCreateProspectDoc = async () => {
    setCreatingDoc(true);
    try {
      const defaultTitle = `Prospection & Découverte — ${sop?.title || 'Nouveau Prospect'}`;
      const doc = await addDocument(defaultTitle, userId || null);
      if (doc) {
        toastSuccess('Document créé', 'Ouverture de votre fiche prospect...');
        router.push(`/documents/${doc.id}`);
      } else {
        toastError('Erreur', 'Impossible d’initialiser le document.');
      }
    } catch {
      toastError('Erreur', 'Une anomalie est survenue.');
    } finally {
      setCreatingDoc(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-zinc-400 font-mono">Chargement du guide…</div>;
  }

  if (!sop) {
    return (
      <PageFadeIn className="max-w-4xl mx-auto py-12 space-y-4">
        <Link href="/academy" className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l’académie
        </Link>
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">SOP introuvable</p>
          <p className="text-xs text-zinc-400">Ce guide a peut-être été déplacé ou archivé.</p>
        </div>
      </PageFadeIn>
    );
  }

  const sampleOutreachScript = `Bonjour [Prénom],\n\nJ’ai analysé le site web de [Entreprise] et votre tunnel d'acquisition actuel. J'ai remarqué 3 leviers majeurs pour doubler vos demandes de devis qualifiées sans augmenter votre budget pub :\n\n1. Optimisation du temps de chargement et passage en architecture Framer native\n2. Système de rappel instantané sur appel manqué (Missed-Call Text-Back)\n3. Automatisation des formulaires de capture avec routage direct vers votre agenda\n\nSeriez-vous ouvert à un audit vidéo de 3 minutes sans engagement cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`;

  return (
    <PageFadeIn className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* ── 1. Top Contextual Breadcrumb & Actions Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate min-w-0">
          <Link href="/academy" className="hover:text-zinc-900 transition-colors">
            Académie
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="text-zinc-600 truncate">{sop.category}</span>
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="text-zinc-900 font-semibold truncate">{sop.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCreateProspectDoc}
            disabled={creatingDoc}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Créer un document vierge dans /documents"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Créer doc prospect</span>
          </button>

          <button
            onClick={toggleCompleted}
            disabled={saving}
            className={cn(
              'h-7 px-3 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50',
              completed
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
            <span>{completed ? 'SOP Complétée' : 'Marquer comme lu'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Visual Header Card ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-100 text-zinc-700 text-[10.5px] font-semibold px-2.5 py-0.5 rounded border border-zinc-200/60">
              {sop.category}
            </span>
            <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1" style={MONO}>
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{sop.read_time_min || 5} min de lecture</span>
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <span className="text-zinc-400">Rédigé par :</span>
            <strong className="text-zinc-800">{sop.author || 'Équipe Minerva'}</strong>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight leading-tight">
          {sop.title}
        </h1>

        {sop.description && (
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed border-l-2 border-emerald-600 pl-3 py-0.5 bg-emerald-50/30 rounded-r">
            {sop.description}
          </p>
        )}
      </div>

      {/* ── 3. Embedded Video Player (if present) ── */}
      {sop.video_url && (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Démonstration Vidéo & Walkthrough</span>
          </div>
          <VideoAssetPlayer src={sop.video_url} title={sop.title} />
        </div>
      )}

      {/* ── 4. Main Markdown Content & Visual Callouts ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-6 shadow-2xs space-y-6">
        <div className="prose prose-zinc prose-sm max-w-none text-xs sm:text-[13px] leading-relaxed text-zinc-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {`## Guide Opératoire & Méthodologie\n\n${sop.description || 'Consultez les étapes ci-dessous pour exécuter ce processus avec l’équipe.'}\n\n### 1. Analyse Préliminaire\n- Évaluer la maturité digitale du prospect et identifier les points de friction.\n- Vérifier la configuration des outils internes avant toute prise de contact.\n\n### 2. Exécution & Personnalisation\n- Utiliser le script de prospection ci-dessous en adaptant les 3 points clés.\n- Documenter chaque interaction dans l'espace client pour un suivi fluide.`}
          </ReactMarkdown>
        </div>

        {/* Actionable Outreach Script Callout */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Modèle de Script de Prospection / Outreach</span>
            </div>
            <button
              onClick={() => handleCopyOutreachScript(sampleOutreachScript)}
              className="h-6 px-2 text-[11px] font-medium border border-zinc-300 bg-white hover:bg-zinc-100 rounded text-zinc-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedScript ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-500" />}
              <span>{copiedScript ? 'Copié !' : 'Copier le script'}</span>
            </button>
          </div>

          <pre className="p-3 bg-white border border-zinc-200 rounded text-[11px] font-mono text-zinc-700 whitespace-pre-wrap leading-relaxed">
            {sampleOutreachScript}
          </pre>
        </div>

        {/* Step-by-step Interactive Action Checklist */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-[6px] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <ListChecks className="w-4 h-4 text-emerald-700" />
            <span>Checklist d’Exécution & Contrôle Qualité</span>
          </div>

          <div className="space-y-2 text-xs text-zinc-700">
            {[
              'Vérifier les prérequis et configurations avant de lancer la prospection',
              'Personnaliser le template avec les données spécifiques du prospect',
              'Créer la fiche prospect dans /documents et planifier la date de relance (J+3)',
              'Enregistrer les notes de qualification dans le CRM Minerva',
            ].map((step, idx) => (
              <label
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!checkedSteps[`step-${idx}`]}
                  onChange={(e) =>
                    setCheckedSteps((prev) => ({ ...prev, [`step-${idx}`]: e.target.checked }))
                  }
                  className="w-3.5 h-3.5 mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className={cn('font-medium', checkedSteps[`step-${idx}`] && 'line-through text-zinc-400')}>
                  {step}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </PageFadeIn>
  );
}
