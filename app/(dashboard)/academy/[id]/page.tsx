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
  Maximize2,
  Minimize2,
  Lightbulb,
  ChevronRight,
  Target,
  Building2,
  Zap,
  ExternalLink,
  Info,
  Search,
  Database,
  ShieldCheck,
  GitBranch,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { SopMarkdownRenderer, slugifyHeading } from '@/components/academy/SopMarkdownRenderer';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { YouTubeCuratorModal } from '@/components/academy/YouTubeCuratorModal';
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener for Fullscreen (Escape to exit, F to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(targetTag)) return;

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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

  // Clean markdown content to avoid any duplicate title rendered by ReactMarkdown
  const sanitizedMarkdown = useMemo(() => {
    if (!sop?.content_markdown) return '';
    // Strip leading h1 `# Title` if present since the page header already displays sop.title
    return sop.content_markdown.replace(/^#\s+[^\n]+\n+/, '');
  }, [sop?.content_markdown]);

  // Extract Table of Contents
  const tocItems = useMemo(() => {
    if (!sanitizedMarkdown) return [];
    return extractToc(sanitizedMarkdown);
  }, [sanitizedMarkdown]);

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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAFA] -m-3 sm:-m-4 md:-m-6 lg:-m-8 min-h-full">
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-20 px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <div className="h-6 w-64 bg-zinc-100 rounded animate-pulse" />
            <div className="h-7 w-48 bg-zinc-100 rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-8 items-start">
          <div className="h-64 bg-zinc-100 rounded-lg animate-pulse hidden lg:block" />
          <div className="h-96 bg-zinc-100 rounded-xl animate-pulse" />
          <div className="h-80 bg-zinc-100 rounded-lg animate-pulse hidden lg:block" />
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-4 px-4">
        <Link href="/academy" className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l’académie
        </Link>
        <Card className="p-12 text-center space-y-3 bg-white border-zinc-200 rounded-xl shadow-xs">
          <BookOpen className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
          <p className="text-sm font-bold text-zinc-900">SOP introuvable</p>
          <p className="text-xs text-zinc-500">Ce guide a peut-être été déplacé ou archivé.</p>
        </Card>
      </div>
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
    : sop.id === 'sop-dev-02-framer' || sop.category === 'Design Framer'
    ? `// Configuration Webhook Framer -> Minerva OS (/api/webhooks/roi-event)
{
  "event": "lead_captured",
  "client_id": "tb-toitures-beauchemin",
  "data": {
    "full_name": "Marc Tremblay",
    "email": "marc@toituresbeauchemin.ca",
    "phone": "+1 (514) 555-0199",
    "service_interet": "Refonte Complète Framer",
    "source": "Landing Page Framer Hero CTA"
  }
}`
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
    if (sop.id === 'sop-dev-02-framer' || sop.category === 'Design Framer') {
      return [
        'Structure 6 sections validée (Hero, Preuve, Offres, Bento, Avis, Footer)',
        'Breakpoints Responsive vérifiés (Desktop 1200px, Tablet 810px, Mobile 390px)',
        'Webhook Formulaire testé vers /api/webhooks/roi-event (Status 200)',
        'Titres H1/H2, Métadonnées SEO et Balises OpenGraph configurés',
        'Images et vidéos compressées au format WebP / MP4 léger',
        'Domaine personnalisé relié et certificat SSL actif',
      ];
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
    <div
      className={cn(
        'w-full min-h-screen bg-[#FAFAFA] text-zinc-900',
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : '-m-3 sm:-m-4 md:-m-6 lg:-m-8 min-h-full pb-16'
      )}
    >
      {/* ── Top Bar de la SOP (Style Linear / Raycast dense 28px) ── */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-20 px-6 py-2.5">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Breadcrumb + Titre + Badges */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-sans flex-1 min-w-0">
            <Link
              href="/academy"
              className="hover:text-zinc-900 transition-colors flex items-center gap-1.5 shrink-0 text-zinc-500"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Académie</span>
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold text-zinc-900 truncate">
              {sop.title}
            </span>

            {sop.is_featured && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold shrink-0 ml-1">
                ● Fondatrice
              </span>
            )}

            <span className="text-xs text-zinc-400 font-sans ml-2 shrink-0 hidden sm:inline">
              · {sop.read_time_min || 15} min de lecture
            </span>
          </div>

          {/* Boutons d'actions à droite (Hauteur 28px) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. Action IA */}
            <button
              type="button"
              onClick={handleAiSummary}
              className="h-7 px-2.5 text-xs font-sans border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Synthèse IA exécutive"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span className="hidden sm:inline">Résumé IA</span>
            </button>

            {/* 2. Actions Utilitaires (Groupe d'icônes compact) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Copier le Markdown brut"
              >
                {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleSharePublic}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Partager le guide public"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  'h-7 w-7 rounded-md border border-zinc-200 flex items-center justify-center transition-colors cursor-pointer',
                  isFullscreen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                )}
                title={isFullscreen ? 'Quitter le mode plein écran (Échap ou F)' : 'Activer la vue plein écran (F)'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* 3. Action Principale */}
            <Button
              size="sm"
              onClick={toggleCompleted}
              disabled={saving}
              className={cn(
                'h-7 px-3 text-xs font-sans font-medium rounded-md shadow-xs cursor-pointer transition-all flex items-center gap-1.5',
                completed
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
            >
              {completed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5" />}
              <span>{completed ? 'Appliqué' : 'Marquer appliqué'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Grille Principale 3-Colonnes (CSS Grid Stripe Docs) ── */}
      <div className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-8 items-start">
        {/* COLONNE GAUCHE : Sommaire Sticky */}
        <aside className="hidden lg:block sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2">
          <div className="text-[11px] font-mono uppercase font-semibold text-zinc-400 mb-3 tracking-wider">
            Sommaire
          </div>
          <nav className="space-y-1 text-xs border-l border-zinc-200 pl-3">
            {tocItems.map((item) => {
              const isActive = activeSectionId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToHeading(item.id)}
                  className={cn(
                    'w-full text-left py-1 px-2 rounded-md transition-all truncate block text-xs cursor-pointer font-sans',
                    item.level === 3 && 'pl-4 text-[11.5px]',
                    isActive
                      ? 'font-semibold text-emerald-800 bg-emerald-50/80 -ml-[13px] pl-[11px] border-l-2 border-emerald-600'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60'
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
        </aside>

        {/* COLONNE CENTRALE : Contenu de la SOP */}
        <main className="min-w-0 bg-white border border-zinc-200 rounded-xl p-8 shadow-xs space-y-8">
          {/* Header de la SOP */}
          <div className="space-y-3 border-b border-zinc-100 pb-5">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-medium font-sans">
                <span>{sop.category.includes('Framer') ? '🎨' : '⚡'}</span>
                <span>{sop.category}</span>
              </span>
              {sop.pillar && (
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
                  Spec Pilier : {sop.pillar}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-950 tracking-tight leading-tight">
              {sop.title}
            </h1>

            {sop.description && (
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed border-l-2 border-emerald-600 pl-3.5 py-1 bg-emerald-50/30 rounded-r-lg font-sans">
                {sop.description}
              </p>
            )}

            {/* Accès Piliers direct */}
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
          </div>

          {/* Démonstration Vidéo si existante */}
          {sop.video_url && (
            <div className="rounded-xl border border-zinc-200 p-5 bg-zinc-50/50 space-y-3">
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
            </div>
          )}

          {/* Contenu Markdown Technique Sans Boucle de Boutons IA */}
          <div>
            {sanitizedMarkdown ? (
              <SopMarkdownRenderer content={sanitizedMarkdown} />
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-12 justify-center">
                <Info className="w-4 h-4" />
                <span>Contenu en cours de rédaction.</span>
              </div>
            )}
          </div>

          {/* Actionable Terminal / Script Playbook Box */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                {sop.id === 'sop-dev-02-framer' || sop.category === 'Design Framer' ? (
                  <>
                    <Terminal className="w-4 h-4 text-emerald-600" />
                    <span>Configuration Webhook Framer (Payload JSON /api/webhooks/roi-event)</span>
                  </>
                ) : isTechSop ? (
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
              className="p-4 bg-[#09090b] border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner overflow-x-auto"
              style={MONO}
            >
              {sampleOutreachScript}
            </pre>
          </div>

          {/* Studio de Scripting Cas Client 60s (si SOP Fondatrice) */}
          {(isMasterSop || isPillar4) && (
            <div className="pt-2">
              <CaseStudyScriptStudio
                defaultClientName={isPillar1 ? 'Café Rosemont' : isPillar3 ? 'Toitures Beauchemin' : 'Client Partenaire'}
                defaultPillar={isPillar1 ? 'flow' : isPillar2 ? 'reach' : 'agency'}
              />
            </div>
          )}
        </main>

        {/* COLONNE DROITE : Checklist & Métadonnées Sticky */}
        <aside className="hidden lg:block sticky top-16 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="text-[11px] font-mono uppercase font-semibold text-zinc-500 tracking-wider">
                Checklist de Conformité
              </div>
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

            {/* Progression */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono" style={MONO}>
                <span className="text-zinc-400 text-[10px] uppercase">Progression</span>
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

            {/* Checkboxes interactives */}
            <div className="space-y-2 pt-1 text-xs text-zinc-800">
              {checklistItems.map((step, idx) => {
                const stepKey = `step-${idx}`;
                const isChecked = !!checkedSteps[stepKey];
                return (
                  <label
                    key={idx}
                    className={cn(
                      'flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors shadow-2xs',
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
                <span>Checklist validée à 100%.</span>
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-semibold text-zinc-500 mb-2 tracking-wider border-b border-zinc-100 pb-2">
              Accès Rapides
            </div>

            <div className="space-y-1 text-xs font-sans">
              {isTechSop ? (
                <>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-700" />
                      <span>GitHub Repository & PRs</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">▲</span>
                      <span>Vercel Deployments</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <a
                    href="https://supabase.com/dashboard/project/_/sql"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Supabase Database Console</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <Link
                    href="/tech"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Protocole QA 20-Points</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/team/workload"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
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
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Minerva Reach (/today)</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </a>

                  <Link
                    href="/leads"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pipeline CRM Leads</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/proposals"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Propositions & Devis 50%</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/acquisition"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
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
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      <span>Cockpit Exécutif (/overview)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/clients"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Comptes Clients & Rétention</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/team/workload"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Équilibrage Charge (/workload)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Link>

                  <Link
                    href="/invoices"
                    className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
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

            <div className="pt-2 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateProspectDoc}
                disabled={creatingDoc}
                className="w-full text-xs h-7 text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-50 gap-1.5 cursor-pointer"
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
    </div>
  );
}
