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
  ChevronRight,
  Target,
  Building2,
  Zap,
  ExternalLink,
  Info,
  Youtube,
  Search,
} from 'lucide-react';
import { BlockEditor } from '@/components/documents/BlockEditor';
import { AiPageToolbar } from '@/components/documents/AiPageToolbar';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { YouTubeCuratorModal } from '@/components/academy/YouTubeCuratorModal';
import { createClient } from '@/lib/supabase/client';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import {
  fetchAcademySop,
  fetchCompletedSopIds,
  markSopCompleted,
  unmarkSopCompleted,
  addDocument,
} from '@/lib/services/supabase-data';
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks';
import type { AcademySOP } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { CaseStudyScriptStudio } from '@/components/academy/CaseStudyScriptStudio';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);

  // Interactive Checklist steps with localStorage persistence
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!rawId) return;
    try {
      const saved = localStorage.getItem(`minerva_sop_checklist_${rawId}`);
      if (saved) {
        setCheckedSteps(JSON.parse(saved));
      }
    } catch {}

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

  const handleStepToggle = (key: string, val: boolean) => {
    setCheckedSteps((prev) => {
      const updated = { ...prev, [key]: val };
      if (rawId) {
        try {
          localStorage.setItem(`minerva_sop_checklist_${rawId}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

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
    toastSuccess('Script copié', 'Le script est dans votre presse-papiers.');
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

  // Robust block computation: fallback to markdownToBlocks when content_json is missing or empty
  const activeBlocks = useMemo(() => {
    if (!sop) return [];
    if (sop.content_json?.blocks && sop.content_json.blocks.length > 0) {
      return sop.content_json.blocks;
    }
    if (sop.content_markdown) {
      return markdownToBlocks(sop.content_markdown);
    }
    return [];
  }, [sop]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <SkeletonText className="w-32 h-3" />
        <SkeletonText className="w-2/3 h-8" />
        <Skeleton className="w-full h-48 rounded-xl" />
        <div className="space-y-3 pt-4">
          <SkeletonText className="w-full h-4" />
          <SkeletonText className="w-full h-4" />
          <SkeletonText className="w-4/5 h-4" />
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <PageFadeIn className="max-w-4xl mx-auto py-12 space-y-4">
        <Link href="/academy" className="text-xs font-medium text-mv-green hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l’académie
        </Link>
        <Card className="p-12 text-center space-y-3 bg-mv-surface border-mv-border rounded-xl">
          <BookOpen className="w-8 h-8 text-mv-ink-faint mx-auto opacity-50" />
          <p className="text-sm font-bold text-mv-ink">SOP introuvable</p>
          <p className="text-xs text-mv-ink-soft">Ce guide a peut-être été déplacé ou archivé.</p>
        </Card>
      </PageFadeIn>
    );
  }

  const isMasterSop = sop.title.startsWith('Système Anti-Friction');
  const isPillar1 = sop.title.startsWith('Pilier 1 (Flow)');
  const isPillar2 = sop.title.startsWith('Pilier 2 (Reach)');
  const isPillar3 = sop.title.startsWith('Pilier 3 (Agence)');
  const isPillar4 = sop.title.startsWith('Pilier 4');
  const isReachSop =
    sop.pillar === 'reach' ||
    sop.title.toLowerCase().includes('reach') ||
    (sop.description && sop.description.toLowerCase().includes('reach'));

  // Dynamic Actionable Script Template
  const sampleOutreachScript = sop.script_template
    ? sop.script_template
    : isPillar1
    ? `Bonjour [Prénom du Proprio],\n\nOn a analysé le menu de [Nom du Restaurant] sur Uber Eats. Sur votre [Plat Signature], vous perdez environ [X] $ par commande en commissions invisibles (estimé à ~[Perte Mensuelle] $/mois).\n\nOn a pris 5 minutes pour recréer vos 5 plats signature dans une interface de commande directe Minerva Flow à 0% de commission — c'est juste pour que vous visualisiez :\n👉 [Lien Démo Personnalisé]\n\nOn a un protocole test de 5 minutes sur imprimante sans risque. Seriez-vous dispo mardi ou mercredi entre 14h30 et 16h pour un café rapide ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : isPillar2 || isReachSop
    ? `Bonjour [Prénom],\n\nAvant qu'on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre profil client idéal et qui ont un signal d'achat actif cette semaine :\n👉 [Lien Liste 50 Leads Qualifiés]\n\nC'est notre façon de vous montrer concrètement comment travaille Minerva Reach, sans demander d'accès à vos outils.\n\nSeriez-vous ouvert à échanger 10 minutes cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : sop.target_workspace === 'tech'
    ? `// Protocole Terminal Minerva\ngit checkout -b feat/nom-de-branche\nnpm run dev\n// Vérification stricte TypeScript obligatoire\nnpx tsc --noEmit\ngit commit -m "feat(module): description claire"\ngit push -u origin feat/nom-de-branche`
    : sop.target_workspace === 'managing'
    ? `Bonjour [Prénom du Client],\n\nBienvenue dans l'écosystème Minerva ! Votre espace de travail est prêt.\nVoici les 3 étapes de votre onboarding express :\n1. Validation de vos accès et configurateur Flow\n2. Cadrage du premier jalon opérationnel J+7\n3. Ligne directe de support d'urgence\n\nNous restons à votre entière disposition pour le lancement opérationnel.\n\nBien à vous,\nL'Équipe Managing Minerva`
    : `Bonjour [Prénom],\n\nJ’ai analysé le site web de [Entreprise] et votre setup actuel. J'ai identifié 3 endroits où vous perdez du temps ou des devis qualifiés :\n\n1. Optimisation du temps de chargement et passage en architecture Framer native\n2. Système de rappel instantané sur appel manqué (Missed-Call Text-Back)\n3. Automatisation des formulaires de capture avec routage direct vers votre agenda\n\nPas de devis ou de long cahier des charges : on vous livre un prototype fonctionnel dès la Semaine 1 (J+7) pour tester en réel.\n\nSeriez-vous ouvert à un audit vidéo de 3 minutes sans engagement cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`;

  // Dynamic Checklist Items with robust fallback
  const checklistItems: string[] = (() => {
    if (sop.checklist_items && Array.isArray(sop.checklist_items) && sop.checklist_items.length > 0) {
      return sop.checklist_items;
    }
    // Extract checkbox lines from markdown if present: - [ ] Step or - [x] Step
    if (sop.content_markdown) {
      const extracted: string[] = [];
      const lines = sop.content_markdown.split('\n');
      for (const l of lines) {
        const match = l.trim().match(/^-\s*\[([ xX])\]\s*(.*)$/);
        if (match && match[2]) {
          extracted.push(match[2].trim());
        }
      }
      if (extracted.length > 0) return extracted;
    }
    if (isMasterSop) {
      return [
        'Flow : 3 audits publics proactifs envoyés avec vidéo 60s et démo 0% commission',
        'Flow : 1 protocole test 5-minutes branché en cuisine sur imprimante thermique',
        'Reach : Liste de 50 prospects locaux construite avec signaux d’achat publics',
        'Reach : 10 premiers messages rédigés, validés manuellement et envoyés',
        'Agence : 1 audit de surface 30-min livré sans rendez-vous préalable',
        'Agence : Prototype fonctionnel J+7 présenté et mode solo documenté',
        'Mes Inspirations : 2 vidéos courtes publiées (60-90s) avec chiffre réel en hook',
        'Mes Inspirations : 1 cas client documenté en vidéo avec CTA lié au pilier pertinent',
      ];
    }
    if (sop.target_workspace === 'prospection') {
      return [
        'Ouvrir Minerva Reach (/today) et vérifier le quota du jour (30 à 50 prospects)',
        'Qualifier les fiches commerces avec signaux publics (avis Google, Instagram)',
        'Personnaliser le template d’accroche selon la faille observée (commissions 30%)',
        'Déclencher la proposition avec acompte 50% sur Minerva Trequartista (/proposals)',
      ];
    }
    if (sop.target_workspace === 'managing') {
      return [
        'Vérifier le statut d’onboarding des nouveaux clients sous 48h',
        'Contrôler la balance de facturation Stripe et les taxes TPS/TVQ',
        'Vérifier la charge d’équipe sur /team/workload (cible 75%-85%)',
        'Tenir la revue de performance mensuelle avec le propriétaire ou gérant',
      ];
    }
    if (sop.target_workspace === 'tech') {
      return [
        'Synchroniser la branche main (git checkout main && git pull)',
        'Créer la branche dédiée (feat/... ou fix/...)',
        'Exécuter npx tsc --noEmit avec 0 erreur',
        'Valider le protocole d’assurance qualité 20-points avant merge',
      ];
    }
    return [
      'Vérifier les prérequis et configurations avant de lancer l’action',
      'Personnaliser le template avec les données spécifiques du projet',
      'Créer la fiche de suivi dans /documents et planifier la date de relance',
      'Enregistrer les notes de qualification et d’avancement dans le système',
    ];
  })();

  const workspaceCategory = (sop.target_workspace === 'tech'
    ? 'tech'
    : sop.target_workspace === 'managing'
    ? 'managing'
    : isReachSop
    ? 'reach'
    : 'prospection') as 'prospection' | 'managing' | 'tech' | 'reach';

  return (
    <PageFadeIn className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* ── 1. Top Contextual Breadcrumb & Actions Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-mv-ink-soft font-medium truncate min-w-0">
          <Link href="/academy" className="hover:text-mv-ink transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5 text-mv-ink-faint" />
            <span>Académie</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-mv-ink-faint shrink-0" />
          <span className="text-mv-ink-soft truncate">{sop.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-mv-ink-faint shrink-0" />
          <span className="text-mv-ink font-bold truncate">{sop.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsYouTubeModalOpen(true)}
            className="text-xs bg-mv-surface border-mv-border text-red-700 hover:bg-red-50 hover:border-red-200 gap-1.5 cursor-pointer"
            title="Dénicher ou prévisualiser des vidéos YouTube"
          >
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>Vidéos YouTube</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSharePublic}
            className="text-xs bg-mv-surface border-mv-border text-mv-ink hover:bg-black/[0.04] gap-1.5 cursor-pointer"
            title="Copier le lien public accessible sans compte"
          >
            <Share2 className="w-3.5 h-3.5 text-mv-ink-soft" />
            <span>Partager</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateProspectDoc}
            disabled={creatingDoc}
            className="text-xs bg-mv-surface border-mv-border text-mv-ink hover:bg-black/[0.04] gap-1.5 cursor-pointer disabled:opacity-50"
            title="Créer un document vierge dans /documents"
          >
            <FileText className="w-3.5 h-3.5 text-mv-green" />
            <span>+ Doc de travail</span>
          </Button>

          <Button
            size="sm"
            onClick={toggleCompleted}
            disabled={saving}
            className={cn(
              'text-xs font-semibold gap-1.5 cursor-pointer transition-all',
              completed
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-mv-green hover:bg-mv-green/90 text-white shadow-xs'
            )}
          >
            {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
            <span>{completed ? 'SOP Complétée' : 'Marquer comme lu'}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Visual Header Card ── */}
      <Card className="bg-mv-surface border-mv-border rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="neutral" className="text-xs font-semibold">
              {sop.category}
            </Badge>
            {sop.target_workspace && (
              <Badge
                variant={
                  sop.target_workspace === 'prospection'
                    ? 'green'
                    : sop.target_workspace === 'tech'
                    ? 'blue'
                    : 'amber'
                }
                className="text-xs font-bold uppercase tracking-wider"
              >
                {sop.target_workspace}
              </Badge>
            )}
            {(sop.is_featured || isMasterSop) && (
              <Badge variant="green" className="text-xs font-bold uppercase tracking-wider">
                FONDATRICE
              </Badge>
            )}
            <span className="text-xs font-mono text-mv-ink-faint flex items-center gap-1.5" style={MONO}>
              <Clock className="w-3.5 h-3.5 text-mv-ink-faint" />
              <span>{sop.read_time_min || 10} min de lecture</span>
            </span>
          </div>

          <div className="text-xs text-mv-ink-soft flex items-center gap-1.5">
            <span className="text-mv-ink-faint">Rédigé par :</span>
            <strong className="text-mv-ink font-semibold">{sop.author || 'Équipe Minerva'}</strong>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-mv-ink tracking-tight leading-tight">
          {sop.title}
        </h1>

        {sop.description && (
          <p className="text-xs sm:text-sm text-mv-ink-soft leading-relaxed border-l-2 border-mv-green pl-3.5 py-1 bg-mv-cream-soft rounded-r-lg">
            {sop.description}
          </p>
        )}

        {/* Quick Pillar Action Buttons */}
        <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
          {(isMasterSop || isPillar1 || sop.target_workspace === 'prospection') && (
            <Link
              href="/flow"
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Minerva Flow (SaaS)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          )}

          {(isMasterSop || isPillar2 || isReachSop || sop.target_workspace === 'prospection') && (
            <a
              href="https://minerva-os-lite-desktop.vercel.app/today"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Minerva Reach (/today)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          )}

          {(isMasterSop || isPillar3 || sop.target_workspace === 'tech') && (
            <Link
              href="/projects"
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Projets & Prototypes</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          )}

          {sop.target_workspace === 'managing' && (
            <Link
              href="/team/workload"
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Équilibrage Équipe (/workload)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          )}
        </div>
      </Card>

      {/* ── 3. Embedded Universal Video Player (YouTube, Shorts or HTML5) ── */}
      {sop.video_url ? (
        <Card className="bg-mv-surface border-mv-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-mv-ink">
              <Sparkles className="w-4 h-4 text-mv-green" />
              <span>Démonstration Vidéo & Walkthrough</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsYouTubeModalOpen(true)}
              className="text-[11px] h-7 gap-1 text-mv-ink-soft cursor-pointer"
            >
              <Search className="w-3 h-3" />
              <span>Chercher d’autres vidéos</span>
            </Button>
          </div>
          <VideoAssetPlayer src={sop.video_url} title={sop.title} />
        </Card>
      ) : isReachSop ? (
        /* Upcoming Minerva Reach Demo Video Slot */
        <Card className="bg-mv-surface border-mv-border rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-mv-ink">
              <Youtube className="w-4 h-4 text-red-600" />
              <span>Démonstration Vidéo Minerva Reach</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsYouTubeModalOpen(true)}
              className="text-[11px] h-7 gap-1 text-red-700 bg-red-50 border-red-200 cursor-pointer"
            >
              <Search className="w-3 h-3 text-red-600" />
              <span>Explorer des vidéos de formation</span>
            </Button>
          </div>
          <VideoAssetPlayer src="" title="Minerva Reach Walkthrough" isUpcomingPlaceholder />
        </Card>
      ) : null}

      {/* ── 3.5 Notion AI Actions on this SOP ── */}
      {activeBlocks.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50/60 via-zinc-50/60 to-transparent dark:from-emerald-950/20 dark:via-zinc-900/40 p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between gap-4">
          <AiPageToolbar
            blocks={activeBlocks}
            documentTitle={sop.title}
            onApplyBlocks={async (newBlocks) => {
              try {
                await addDocument(
                  `Extrait IA : ${sop.title}`,
                  userId || null,
                  {
                    category: 'sop',
                    contentJson: { blocks: newBlocks },
                  }
                );
                toastSuccess('Document d\'équipe créé avec le contenu IA extrait !');
              } catch {
                toastError('Erreur', 'Impossible de créer le document.');
              }
            }}
          />
        </div>
      )}

      {/* ── 4. Main Content (BlockEditor, Notion-like display) ── */}
      <Card className="bg-mv-surface border-mv-border rounded-xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="text-mv-ink leading-relaxed">
          {activeBlocks.length > 0 ? (
            <BlockEditor blocks={activeBlocks} onChange={() => {}} readOnly workspaceContext="academy" />
          ) : (
            <div className="flex items-center gap-2 text-xs text-mv-ink-faint py-8 justify-center">
              <Info className="w-3.5 h-3.5" />
              <span>Contenu en cours de rédaction.</span>
            </div>
          )}
        </div>

        {/* ── 5. Actionable Outreach / Command Script Callout ── */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-mv-ink">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>
                {sop.target_workspace === 'tech'
                  ? 'Commandes & Protocole Terminal Recommandé'
                  : 'Modèle de Script / Playbook d’Action Prêt à l’Emploi'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyOutreachScript(sampleOutreachScript)}
              className="text-xs bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100 gap-1.5 cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
              <span>{copiedScript ? 'Copié !' : 'Copier'}</span>
            </Button>
          </div>

          <pre className="p-4 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed shadow-2xs" style={MONO}>
            {sampleOutreachScript}
          </pre>
        </div>

        {/* ── 6. Studio de Scripting Cas Client 60s ── */}
        {(isMasterSop || isPillar4) && (
          <div className="pt-2">
            <CaseStudyScriptStudio
              defaultClientName={isPillar1 ? 'Café Rosemont' : isPillar3 ? 'Toitures Beauchemin' : 'Client Partenaire'}
              defaultPillar={isPillar1 ? 'flow' : isPillar2 ? 'reach' : 'agency'}
            />
          </div>
        )}

        {/* ── 7. Interactive Action Checklist (Starts 0/N, Unchecked, Persistent) ── */}
        <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
              <ListChecks className="w-4 h-4 text-emerald-700" />
              <span>
                Checklist d’Exécution & Contrôle Qualité ({Object.values(checkedSteps).filter(Boolean).length}/{checklistItems.length})
              </span>
            </div>
            {Object.values(checkedSteps).filter(Boolean).length === checklistItems.length && checklistItems.length > 0 && (
              <Badge variant="green" className="text-xs font-semibold gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Prêt pour exécution</span>
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-xs text-zinc-800">
            {checklistItems.map((step, idx) => {
              const stepKey = `step-${idx}`;
              const isChecked = !!checkedSteps[stepKey];
              return (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white border border-emerald-100 cursor-pointer hover:bg-emerald-50/60 transition-colors shadow-2xs"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleStepToggle(stepKey, e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <span className={cn('font-medium leading-relaxed', isChecked && 'line-through text-zinc-400')}>
                    {step}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </Card>

      {/* YouTube Curator Modal */}
      <YouTubeCuratorModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        defaultCategory={workspaceCategory}
      />
    </PageFadeIn>
  );
}
