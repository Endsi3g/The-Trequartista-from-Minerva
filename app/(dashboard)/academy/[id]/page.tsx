'use client';

import React, { useEffect, useState } from 'react';
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
  ChevronRight,
  UtensilsCrossed,
  Target,
  Building2,
  Film,
  Zap,
  ExternalLink,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { createClient } from '@/lib/supabase/client';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
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
import { CaseStudyScriptStudio } from '@/components/academy/CaseStudyScriptStudio';
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

  const handleSharePublic = () => {
    if (!sop) return;
    const shareUrl = `${window.location.origin}/share/academy/${sop.id}`;
    navigator.clipboard.writeText(shareUrl);
    toastSuccess('Lien public copié !', 'Le lien accessible sans compte a été copié dans votre presse-papiers.');
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
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        <SkeletonText className="w-32 h-2.5" />
        <SkeletonText className="w-2/3 h-6" />
        <Skeleton className="w-full h-48 rounded-2xl" />
        <div className="space-y-2 pt-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-full" />
          <SkeletonText className="w-4/5" />
        </div>
      </div>
    );
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

  const isMasterSop = sop.id === 'sop-anti-friction-master';
  const isPillar1 = sop.id === 'sop-restaurant-margin-recovery';
  const isPillar2 = sop.id === 'sop-minerva-reach-playbook';
  const isPillar3 = sop.id === 'sop-agence-prototype-j7';
  const isPillar4 = sop.id === 'sop-mes-inspirations-media';

  const sampleOutreachScript = isPillar1
    ? `Bonjour [Prénom du Proprio],\n\nOn a analysé le menu de [Nom du Restaurant] sur Uber Eats. Sur votre [Plat Signature], vous perdez environ [X] $ par commande en commissions invisibles (estimé à ~[Perte Mensuelle] $/mois).\n\nOn a pris 5 minutes pour recréer vos 5 plats signature dans une interface de commande directe Minerva Flow à 0% de commission — c'est juste pour que vous visualisiez :\n👉 [Lien Démo Personnalisé]\n\nOn a un protocole test de 5 minutes sur imprimante sans risque. Seriez-vous dispo mardi ou mercredi entre 14h30 et 16h pour un café rapide ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : isPillar2
    ? `Bonjour [Prénom],\n\nAvant qu'on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre profil client idéal et qui ont un signal d'achat actif cette semaine :\n👉 [Lien Liste 50 Leads Qualifiés]\n\nC'est notre façon de vous montrer concrètement comment travaille Minerva Reach, sans demander d'accès à vos outils.\n\nSeriez-vous ouvert à échanger 10 minutes cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : `Bonjour [Prénom],\n\nJ’ai analysé le site web de [Entreprise] et votre setup actuel. J'ai identifié 3 endroits où vous perdez du temps ou des devis qualifiés :\n\n1. Optimisation du temps de chargement et passage en architecture Framer native\n2. Système de rappel instantané sur appel manqué (Missed-Call Text-Back)\n3. Automatisation des formulaires de capture avec routage direct vers votre agenda\n\nPas de devis ou de long cahier des charges : on vous livre un prototype fonctionnel dès la Semaine 1 (J+7) pour tester en réel.\n\nSeriez-vous ouvert à un audit vidéo de 3 minutes sans engagement cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`;

  const checklistItems = isMasterSop
    ? [
        'Flow : 3 audits publics proactifs envoyés avec vidéo 60s et démo 0% commission',
        'Flow : 1 protocole test 5-minutes branché en cuisine sur imprimante thermique',
        'Reach : Liste de 50 prospects locaux construite avec signaux d’achat publics',
        'Reach : 10 premiers messages rédigés, validés manuellement et envoyés',
        'Agence : 1 audit de surface 30-min livré sans rendez-vous préalable',
        'Agence : Prototype fonctionnel J+7 présenté et mode solo documenté',
        'Mes Inspirations : 2 vidéos courtes publiées (60-90s) avec chiffre réel en hook',
        'Mes Inspirations : 1 cas client documenté en vidéo avec CTA lié au pilier pertinent',
      ]
    : [
        'Vérifier les prérequis et configurations avant de lancer la prospection',
        'Personnaliser le template avec les données publiques spécifiques du prospect',
        'Créer la fiche prospect dans /documents et planifier la date de relance (J+3)',
        'Enregistrer les notes de qualification et de closing dans le CRM Minerva',
      ];

  return (
    <PageFadeIn className="space-y-4 max-w-4xl mx-auto pb-16">
      {/* ── 1. Top Contextual Breadcrumb & Actions Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium truncate min-w-0">
          <Link href="/academy" className="hover:text-zinc-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3 text-zinc-400" />
            <span>Académie</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="text-zinc-600 truncate">{sop.category}</span>
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="text-zinc-900 font-semibold truncate">{sop.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSharePublic}
            className="h-7 px-2.5 text-xs font-medium border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Copier le lien public accessible sans compte"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Partager le lien public</span>
          </button>

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
            {(sop.is_featured || isMasterSop) && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                FONDATRICE
              </span>
            )}
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

        {/* Quick Action Buttons for Pillars */}
        <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
          {(isMasterSop || isPillar1) && (
            <Link
              href="/minerva-flow"
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-3 h-3 text-amber-600" />
              <span>Ouvrir Démo Minerva-Flow (0%)</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          )}

          {(isMasterSop || isPillar1) && (
            <Link
              href="/audits/new"
              className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3 text-zinc-600" />
              <span>Calculateur Audit Fuite de Marge</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          )}

          {(isMasterSop || isPillar2) && (
            <Link
              href="/leads"
              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Target className="w-3 h-3 text-blue-600" />
              <span>Ouvrir CRM Leads (Reach QC)</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          )}

          {(isMasterSop || isPillar3) && (
            <Link
              href="/projects"
              className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="w-3 h-3 text-emerald-600" />
              <span>Projets & Prototypes J+7</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </Link>
          )}
        </div>
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
          {sop.content_markdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.content_markdown}</ReactMarkdown>
          ) : sop.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.description}</ReactMarkdown>
          ) : (
            <p className="text-zinc-400 italic">Aucun contenu détaillé pour cette SOP pour le moment.</p>
          )}
        </div>

        {/* ── 5. Actionable Outreach Script Callout ── */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Modèle de Script de Prospection / Outreach Réel</span>
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

        {/* ── 6. Studio de Scripting Cas Client 60s (Mes Inspirations) ── */}
        {(isMasterSop || isPillar4) && (
          <div className="pt-2">
            <CaseStudyScriptStudio
              defaultClientName={isPillar1 ? 'Café Rosemont' : isPillar3 ? 'Toitures Beauchemin' : 'Client Partenaire'}
              defaultPillar={isPillar1 ? 'flow' : isPillar2 ? 'reach' : 'agency'}
            />
          </div>
        )}

        {/* ── 7. Step-by-step Interactive Action Checklist ── */}
        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-[6px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <ListChecks className="w-4 h-4 text-emerald-700" />
              <span>Checklist d’Exécution & Contrôle Qualité ({Object.values(checkedSteps).filter(Boolean).length}/{checklistItems.length})</span>
            </div>
            {Object.values(checkedSteps).filter(Boolean).length === checklistItems.length && (
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prêt pour exécution</span>
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs text-zinc-700">
            {checklistItems.map((step, idx) => (
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
                <span className={cn('font-medium leading-relaxed', checkedSteps[`step-${idx}`] && 'line-through text-zinc-400')}>
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
