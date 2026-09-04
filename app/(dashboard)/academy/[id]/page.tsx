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
  Database,
  ShieldCheck,
  GitBranch,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { SopMarkdownRenderer, slugifyHeading } from '@/components/academy/SopMarkdownRenderer';
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

interface TocItem {
  id: string;
  title: string;
  level: 2 | 3;
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      const title = trimmed.replace(/^##\s+/, '').trim();
      items.push({ id: slugifyHeading(title), title, level: 2 });
    } else if (trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^###\s+/, '').trim();
      items.push({ id: slugifyHeading(title), title, level: 3 });
    }
  }
  return items;
}

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
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [creatingDoc, setCreatingDoc] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

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

  // Extract Table of Contents
  const tocItems = useMemo(() => {
    if (!sop?.content_markdown) return [];
    return extractToc(sop.content_markdown);
  }, [sop?.content_markdown]);

  // Scrollspy for TOC
  useEffect(() => {
    if (tocItems.length === 0) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      let currentId = tocItems[0]?.id || '';
      for (const item of tocItems) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop - 140 <= scrollY) {
          currentId = item.id;
        }
      }
      setActiveSectionId(currentId);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSectionId(id);
    }
  };

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

  const handleResetChecklist = () => {
    setCheckedSteps({});
    if (rawId) {
      try {
        localStorage.removeItem(`minerva_sop_checklist_${rawId}`);
      } catch {}
    }
    toastSuccess('Checklist réinitialisée', 'Toutes les étapes sont remises à zéro.');
  };

  const toggleCompleted = async () => {
    if (!userId || !rawId) return;
    setSaving(true);
    const ok = completed ? await unmarkSopCompleted(userId, rawId) : await markSopCompleted(userId, rawId);
    setSaving(false);
    if (ok) {
      setCompleted(!completed);
      toastSuccess(
        completed ? 'SOP réouverte' : 'SOP complétée !',
        completed ? 'La SOP est marquée à faire.' : 'Bravo pour votre rigueur opérationnelle.'
      );
    }
  };

  const handleCopyMarkdown = () => {
    if (!sop?.content_markdown) return;
    navigator.clipboard.writeText(sop.content_markdown);
    setCopiedMarkdown(true);
    toastSuccess('Markdown copié !', 'Le contenu brut du guide a été copié.');
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleAiSummary = () => {
    if (!sop) return;
    const summaryText = `Synthèse exécutive du guide "${sop.title}" :\n\n- Catégorie : ${sop.category}\n- Objectif : ${sop.description || 'Standard opérationnel Minerva'}\n- Durée : ${sop.read_time_min || 10} min\n- Points clés : ${checklistItems.slice(0, 3).join(' • ')}`;
    navigator.clipboard.writeText(summaryText);
    toastSuccess('Résumé IA prêt !', 'La synthèse exécutive a été copiée dans votre presse-papiers.');
  };

  const handleCopyOutreachScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    toastSuccess('Script copié', 'Le playbook est dans votre presse-papiers.');
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSharePublic = () => {
    if (!sop) return;
    const shareUrl = `${window.location.origin}/share/academy/${sop.id}`;
    navigator.clipboard.writeText(shareUrl);
    toastSuccess('Lien public copié !', 'Le lien accessible sans compte a été copié.');
  };

  const handleCreateProspectDoc = async () => {
    setCreatingDoc(true);
    try {
      const defaultTitle = `Note de Travail — ${sop?.title || 'Nouveau Document'}`;
      const doc = await addDocument(defaultTitle, userId || null);
      if (doc) {
        toastSuccess('Document créé', 'Ouverture de votre fiche de travail...');
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

  // Robust block computation for Notion AI toolbar
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
      <div className="max-w-7xl mx-auto space-y-6 py-8 px-4">
        <div className="h-10 w-64 bg-zinc-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-6">
          <div className="h-64 bg-zinc-100 rounded-xl animate-pulse hidden lg:block" />
          <div className="h-96 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-zinc-100 rounded-xl animate-pulse hidden lg:block" />
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <PageFadeIn className="max-w-4xl mx-auto py-12 space-y-4 px-4">
        <Link href="/academy" className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l’académie
        </Link>
        <Card className="p-12 text-center space-y-3 bg-white border-zinc-200 rounded-xl shadow-xs">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
          <p className="text-sm font-bold text-zinc-900">SOP introuvable</p>
          <p className="text-xs text-zinc-500">Ce guide a peut-être été déplacé ou archivé.</p>
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

  const isTechSop =
    sop.target_workspace === 'tech' ||
    sop.category === 'IA & Ingénierie' ||
    sop.category === 'Support & QA' ||
    sop.id.startsWith('sop-dev') ||
    sop.id.startsWith('sop-tech');

  const isManagingSop =
    sop.target_workspace === 'managing' ||
    sop.category === 'Gestion de compte' ||
    sop.id.startsWith('sop-mng');

  const effectiveWorkspace = isTechSop
    ? 'tech'
    : isManagingSop
    ? 'managing'
    : isReachSop
    ? 'reach'
    : 'prospection';

  // Dynamic Actionable Script Template
  const sampleOutreachScript = sop.script_template
    ? sop.script_template
    : isTechSop
    ? `// Protocole Terminal Minerva Standard\ngit checkout main && git pull origin main\ngit checkout -b feat/nom-de-branche\nnpm run dev\n// Vérification stricte TypeScript obligatoire\nnpx tsc --noEmit\ngit commit -m "feat(module): description conforme"\ngit push -u origin feat/nom-de-branche`
    : isPillar1
    ? `Bonjour [Prénom du Proprio],\n\nOn a analysé le menu de [Nom du Restaurant] sur Uber Eats. Sur votre [Plat Signature], vous perdez environ [X] $ par commande en commissions invisibles (estimé à ~[Perte Mensuelle] $/mois).\n\nOn a pris 5 minutes pour recréer vos 5 plats signature dans une interface de commande directe Minerva Flow à 0% de commission — c'est juste pour que vous visualisiez :\n👉 [Lien Démo Personnalisé]\n\nOn a un protocole test de 5 minutes sur imprimante sans risque. Seriez-vous dispo mardi ou mercredi entre 14h30 et 16h pour un café rapide ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : isPillar2 || isReachSop
    ? `Bonjour [Prénom],\n\nAvant qu'on se parle, on a identifié 50 entreprises à Montréal qui correspondent exactement à votre profil client idéal et qui ont un signal d'achat actif cette semaine :\n👉 [Lien Liste 50 Leads Qualifiés]\n\nC'est notre façon de vous montrer concrètement comment travaille Minerva Reach, sans demander d'accès à vos outils.\n\nSeriez-vous ouvert à échanger 10 minutes cette semaine ?\n\nBien à vous,\n[Votre Prénom] — Minerva`
    : isManagingSop
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
    if (isTechSop) {
      return [
        'Migration SQL avec RLS multi-tenant testée',
        'Typage TypeScript strict (zéro any)',
        'Service Supabase avec gestion d’erreurs et fallback gracieux',
        'Composant UI conforme aux tokens 1px et tabular-nums',
        'Route App Router & navigation clavier testées',
        'Protocole QA 20-points & npx tsc --noEmit validés',
      ];
    }
    if (isManagingSop) {
      return [
        'Vérifier le statut d’onboarding des nouveaux clients sous 48h',
        'Contrôler la balance de facturation Stripe et les taxes TPS/TVQ',
        'Vérifier la charge d’équipe sur /team/workload (cible 75%-85%)',
        'Tenir la revue de performance mensuelle avec le propriétaire ou gérant',
      ];
    }
    if (effectiveWorkspace === 'prospection') {
      return [
        'Ouvrir Minerva Reach (/today) et vérifier le quota du jour (30 à 50 prospects)',
        'Qualifier les fiches commerces avec signaux publics (avis Google, Instagram)',
        'Personnaliser le template d’accroche selon la faille observée (commissions 30%)',
        'Déclencher la proposition avec acompte 50% sur Minerva Trequartista (/proposals)',
      ];
    }
    return [
      'Vérifier les prérequis et configurations avant de lancer l’action',
      'Personnaliser le template avec les données spécifiques du projet',
      'Créer la fiche de suivi dans /documents et planifier la date de relance',
      'Enregistrer les notes de qualification et d’avancement dans le système',
    ];
  })();

  const checkedCount = Object.values(checkedSteps).filter(Boolean).length;
  const isAllChecked = checkedCount === checklistItems.length && checklistItems.length > 0;

  return (
    <PageFadeIn className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      {/* ── 1. Top Navigation Strip & Actions Toolbar (42px) ── */}
      <div className="h-[42px] bg-white border border-zinc-200 rounded-lg px-3 shadow-2xs flex items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Badges */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium truncate min-w-0">
          <Link
            href="/academy"
            className="hover:text-zinc-900 transition-colors flex items-center gap-1 font-mono text-[11px] shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span>Académie</span>
          </Link>
          <span className="text-zinc-300 font-mono">/</span>
          <span className="text-zinc-500 font-mono text-[11px] truncate hidden sm:inline">{sop.category}</span>
          <span className="text-zinc-300 font-mono hidden sm:inline">/</span>
          <span className="text-zinc-900 font-semibold truncate text-xs">{sop.title}</span>

          {/* Badges */}
          <div className="hidden md:flex items-center gap-1.5 pl-2 shrink-0">
            {sop.is_featured && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                ● Fondatrice
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded">
              ⏱ {sop.read_time_min || 8} min lecture
            </span>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-1.5 py-0.2 rounded uppercase">
              {effectiveWorkspace}
            </span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="h-7 px-2.5 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded-md text-zinc-700 font-sans inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copier le Markdown brut"
          >
            {copiedMarkdown ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-400" />}
            <span className="hidden sm:inline">{copiedMarkdown ? 'Copié !' : 'Copier MD'}</span>
          </button>

          <button
            type="button"
            onClick={handleAiSummary}
            className="h-7 px-2.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md border border-zinc-200 font-sans inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Synthèse IA"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span className="hidden sm:inline">Résumé IA</span>
          </button>

          <button
            type="button"
            onClick={handleSharePublic}
            className="h-7 px-2 text-xs border border-zinc-200 bg-white hover:bg-zinc-50 rounded-md text-zinc-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
            title="Partager le guide public"
          >
            <Share2 className="w-3 h-3" />
          </button>

          <Button
            size="sm"
            onClick={toggleCompleted}
            disabled={saving}
            className={cn(
              'h-7 px-3 text-xs font-medium rounded-md shadow-xs cursor-pointer transition-all gap-1.5',
              completed
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
            <span>{completed ? 'Appliqué' : 'Marquer comme appliqué'}</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Split-View 3-Colonnes Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-6 items-start">
        {/* ── 2A. Colonne Gauche : Sommaire & Table of Contents (Sticky) ── */}
        <aside className="hidden lg:block sticky top-6 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Sur cette page
              </span>
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums">
                {tocItems.length} sections
              </span>
            </div>

            <nav className="space-y-1 text-xs font-sans">
              {tocItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToHeading(item.id)}
                    className={cn(
                      'w-full text-left py-1 px-2 rounded-md transition-all truncate block text-xs cursor-pointer',
                      item.level === 3 && 'pl-4 text-[11.5px]',
                      isActive
                        ? 'border-l-2 border-emerald-600 font-semibold text-emerald-800 bg-emerald-50/60'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    )}
                    title={item.title}
                  >
                    {item.title}
                  </button>
                );
              })}

              {tocItems.length === 0 && (
                <p className="text-xs text-zinc-400 italic py-2">Sommaire en cours de génération...</p>
              )}
            </nav>
          </div>

          {/* Quick Info Badge Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-3.5 shadow-2xs space-y-2 text-[11px] text-zinc-500 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-[10px] uppercase">Rédigé par</span>
              <span className="font-semibold text-zinc-800 truncate max-w-[120px]">{sop.author || 'Minerva Lead'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-mono text-[10px] uppercase">Statut</span>
              <span className="text-emerald-700 font-mono font-medium">v2.29 Production</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
              <span className="text-zinc-400 font-mono text-[10px] uppercase">Espace</span>
              <span className="capitalize text-zinc-700 font-medium">{effectiveWorkspace}</span>
            </div>
          </div>
        </aside>

        {/* ── 2B. Colonne Centrale : Contenu Technique & Snippets Réels ── */}
        <main className="min-w-0 space-y-6">
          {/* Header Card */}
          <Card className="bg-white border-zinc-200 rounded-xl p-6 sm:p-8 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="neutral" className="text-xs font-semibold">
                {sop.category}
              </Badge>
              <Badge
                variant={
                  effectiveWorkspace === 'prospection'
                    ? 'green'
                    : effectiveWorkspace === 'tech'
                    ? 'blue'
                    : 'amber'
                }
                className="text-xs font-bold uppercase tracking-wider"
              >
                {effectiveWorkspace}
              </Badge>
              {sop.is_featured && (
                <Badge variant="green" className="text-xs font-bold uppercase tracking-wider">
                  FONDATRICE
                </Badge>
              )}
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1 ml-auto" style={MONO}>
                <Clock className="w-3.5 h-3.5" />
                <span>{sop.read_time_min || 8} min</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-950 tracking-tight leading-tight">
              {sop.title}
            </h1>

            {sop.description && (
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed border-l-2 border-emerald-600 pl-3.5 py-1 bg-emerald-50/30 rounded-r-lg font-sans">
                {sop.description}
              </p>
            )}

            {/* Quick Pillar Links */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
              {isTechSop && (
                <>
                  <Link
                    href="/tech"
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Protocole QA 20-Points</span>
                  </Link>
                  <Link
                    href="/team/workload"
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Charge Équipe (/workload)</span>
                  </Link>
                </>
              )}

              {effectiveWorkspace === 'prospection' && (
                <>
                  <a
                    href="https://minerva-os-lite-desktop.vercel.app/today"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                    <span>Minerva Reach (/today)</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                  <Link
                    href="/flow"
                    className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    <span>Minerva Flow (SaaS)</span>
                  </Link>
                </>
              )}

              {isManagingSop && (
                <>
                  <Link
                    href="/overview"
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-600" />
                    <span>Cockpit Exécutif (/overview)</span>
                  </Link>
                  <Link
                    href="/team/workload"
                    className="px-3 py-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Équilibrage Charge (/workload)</span>
                  </Link>
                </>
              )}
            </div>
          </Card>

          {/* Embedded Video Section if present */}
          {sop.video_url && (
            <Card className="bg-white border-zinc-200 rounded-xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Démonstration Vidéo & Walkthrough</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsYouTubeModalOpen(true)}
                  className="text-[11px] h-7 gap-1 text-zinc-600 cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>Vidéos de formation</span>
                </Button>
              </div>
              <VideoAssetPlayer src={sop.video_url} title={sop.title} />
            </Card>
          )}

          {/* Notion AI Toolbar */}
          {activeBlocks.length > 0 && (
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex items-center justify-between gap-4">
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

          {/* Technical Documentation Content (ReactMarkdown Engine) */}
          <Card className="bg-white border-zinc-200 rounded-xl p-6 sm:p-8 shadow-2xs">
            {sop.content_markdown ? (
              <SopMarkdownRenderer content={sop.content_markdown} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-12 justify-center">
                <Info className="w-4 h-4" />
                <span>Contenu en cours de rédaction.</span>
              </div>
            )}
          </Card>

          {/* Actionable Terminal / Script Playbook Box */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                {isTechSop ? (
                  <>
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>Protocole Terminal Recommandé</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Modèle de Script / Playbook d’Action Prêt à l’Emploi</span>
                  </>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyOutreachScript(sampleOutreachScript)}
                className="text-xs bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50 gap-1.5 cursor-pointer h-7"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                <span>{copiedScript ? 'Copié !' : 'Copier'}</span>
              </Button>
            </div>

            <pre
              className="p-4 bg-[#0E0E10] border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto"
              style={MONO}
            >
              {sampleOutreachScript}
            </pre>
          </div>

          {/* Studio de Scripting Cas Client 60s (if master sop) */}
          {(isMasterSop || isPillar4) && (
            <div className="pt-2">
              <CaseStudyScriptStudio
                defaultClientName={isPillar1 ? 'Café Rosemont' : isPillar3 ? 'Toitures Beauchemin' : 'Client Partenaire'}
                defaultPillar={isPillar1 ? 'flow' : isPillar2 ? 'reach' : 'agency'}
              />
            </div>
          )}
        </main>

        {/* ── 2C. Colonne Droite : QA Sidebar & Ressources Contextuelles (Sticky) ── */}
        <aside className="sticky top-6 space-y-5">
          {/* Interactive Checklist Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4.5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                {isTechSop ? 'Contrôle Qualité Feature' : 'Checklist d’Exécution'}
              </span>
              <button
                type="button"
                onClick={handleResetChecklist}
                className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Réinitialiser les cases cochées"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Progress status */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono" style={MONO}>
                <span className="text-zinc-500 text-[11px]">Progression</span>
                <span className="font-semibold text-zinc-900 text-xs">
                  {checkedCount}/{checklistItems.length} validés
                </span>
              </div>
              <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${checklistItems.length > 0 ? (checkedCount / checklistItems.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 text-xs text-zinc-800">
              {checklistItems.map((step, idx) => {
                const stepKey = `step-${idx}`;
                const isChecked = !!checkedSteps[stepKey];
                return (
                  <label
                    key={idx}
                    className={cn(
                      'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors shadow-2xs',
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-200 text-zinc-500'
                        : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleStepToggle(stepKey, e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className={cn('text-xs font-sans leading-snug', isChecked && 'line-through text-zinc-400')}>
                      {step}
                    </span>
                  </label>
                );
              })}
            </div>

            {isAllChecked && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Prêt pour validation / homologué.</span>
              </div>
            )}
          </div>

          {/* Contextual Resources Card */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4.5 shadow-2xs space-y-3">
            <div className="border-b border-zinc-100 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                Ressources Rapides
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-sans">
              {isTechSop ? (
                <>
                  <a
                    href="https://supabase.com/dashboard/project/_/sql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supabase Database Console</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">▲</span>
                      <span>Vercel Deployments</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <Link
                    href="/tech"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ouvrir Protocole QA 20-Points</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/team/workload"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Équilibrage Charge (/workload)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </>
              ) : effectiveWorkspace === 'prospection' ? (
                <>
                  <a
                    href="https://minerva-os-lite-desktop.vercel.app/today"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Minerva Reach (/today)</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <Link
                    href="/leads"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pipeline CRM Leads</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/proposals"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Propositions & Devis 50%</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/acquisition"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Fiches Google Maps & Scraping</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/overview"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Cockpit Exécutif (/overview)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/clients"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Comptes Clients & Rétention</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/team/workload"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Équilibrage Charge (/workload)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/invoices"
                    className="flex items-center justify-between p-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Facturation Stripe & MRR</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>
                </>
              )}
            </div>

            {/* Button to create document */}
            <div className="pt-2 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateProspectDoc}
                disabled={creatingDoc}
                className="w-full text-xs h-8 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-50 gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Fiche de travail</span>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* YouTube Curator Modal */}
      <YouTubeCuratorModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        defaultCategory={effectiveWorkspace === 'tech' ? 'tech' : effectiveWorkspace === 'managing' ? 'managing' : 'prospection'}
      />
    </PageFadeIn>
  );
}
