'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table,
  Sparkles,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  Info,
  Split,
  Eye,
  Edit3,
  Check,
  Copy,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack';
import { fetchDocument, renameDocument } from '@/lib/services/supabase-data';
import type { TeamDocument } from '@/lib/types';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function DocumentEditorPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();

  const [doc, setDoc] = useState<TeamDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'saved' | 'saving'>('saved');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      const data = await fetchDocument(rawId);
      setDoc(data);
      setTitle(data?.title || 'Document sans titre');

      // Check local cache for document text
      const cacheKey = `minerva_doc_content_${rawId}`;
      const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
      if (cached) {
        setContent(cached);
      } else if (rawId === 'doc-minerva-flow-dossier-produit') {
        setContent(`# Minerva Flow — Dossier Produit, Vision & Offre Pilote

## 🌊 Concept en 1 phrase
Minerva Flow est un système de gestion complet pour permettre aux restaurants et cafés de gérer l'ensemble de leurs opérations quotidiennes dans un seul endroit moderne : simple, visuel et performant.

---

## 🎯 Problème résolu
Les restaurants & cafés utilisent souvent de nombreux outils fragmentés, complexes ou peu adaptés à la réalité de leur métier. Flow centralise tout dans un seul espace conçu pour leur réalité.

---

## 👤 ICP (Ideal Customer Profile)
- **Restaurants** (service aux tables, comptoir, rapide)
- **Cafés & Bistrots**
- **Restaurants-cafés**
- **Établissements alimentaires** qui veulent mieux gérer leurs opérations quotidiennes

---

## ⚡ Key Features (Fonctionnalités clés)
- [x] **Saisie des revenus par journée** (chiffre d'affaires en temps réel)
- [x] **Gestion des dépenses & coûts opérationnels**
- [x] **Suivi des marges commerciales & rentabilité**
- [x] **Gestion de l'inventaire & stocks**
- [x] **Gestion des employés & horaires**
- [x] **Rapports et graphiques visuels**
- [x] **Multi-enseignes & multi-points de vente**
- [x] **Accès offre sur mesure**
- [ ] **Commande directe à partir de système d'un QR code**

---

## 🎨 Expérience utilisateur (UX/UI)
- **Interface très fluide et navigable**
- **Graphiques clairs et visuels**
- **Rapports simples à comprendre** sans jargon technique
- **Informations faciles à lire** même pour un utilisateur non technicien
- **Produit pensé pour être partageable en équipe** en invitant d'autres membres utilisateurs

---

## 🚀 Différenciation & Positionnement
- **Focus net :** Se concentrer réellement et uniquement sur la réalité spécifique des restaurants et cafés.
- **Approche visuelle et ergonomique :** Une grande spécialité moderne, pas un générique POS vieillot.
- **Idée stratégique :** Flow doit devenir un produit qui se markete par sa propre qualité — assez fort, beau et fluide pour que les utilisateurs aient envie de le recommander à d'autres restos.

---

## 🗺️ Roadmap (Feuille de route)

### 0–3 mois (Phase Terrain & Feedback)
- Faire tester l'application à des restaurants et cafés pilotes
- Obtenir du feedback réel du terrain
- Perfectionner le produit jusqu'à ce qu'il soit parfaitement adapté aux coups de feu en cuisine

### 3–12 mois (Consolidation & Valeur)
- Renforcer les fonctions les plus utiles
- Stabiliser l'expérience et les intégrations
- Améliorer la valeur commerciale du produit

### 1–3 ans (Échelle & Référence)
- Faire de Flow une référence dans sa niche
- Développer un produit assez fort pour se recommander presque par lui-même
- Créer une solution à la fois opérationnelle, visuelle et stratégique

---

## 💼 Business Model (Modèle Économique)
- **Paiement sur abonnement** (SaaS = mensuel)
- **Tarification accessible** selon le restaurant (minimum et maximum)
- **Flexibilité** selon le besoin, la taille ou le niveau de personnalisation

---

## 📣 Go-to-Market (Stratégie d'Acquisition)
- Démarrage direct auprès des restaurants — boucle de recommandation / bouche-à-oreille
- Qualité du produit comme moteur principal d'acquisition
- Preuve sociale forte : restaurants mis en valeur + expérience réelle
- Démonstrations directes des fonctionnalités clés

---

## 🎁 Offre Pilote (90 jours) — Premiers clients

**Objectif de la phase d'embarquement :** 3 à 5 restaurants et cafés pilotes pour valider le produit et générer les premières études de cas.

| Élément | Détail |
| :--- | :--- |
| **Prix** | **0 $** (gratuit pendant 90 jours) |
| **Engagement** | Retour d'expérience complet et étude de cas (1 à 2 heures de feedback / semaine) |
| **Places disponibles** | 3 à 5 places maximum |
| **Garantie** | Si la valeur n'est pas au rendez-vous après 90 jours, aucun frais, jamais. |

---

### 📝 Mises à jour & Notes d'exécution
- **Mise à jour (15 juillet 2026) :** Le module de commande directe (paiement sur place, sans commission) est à l'essai en mode *Connect-ready* — non pas pour tout remplacer dans l'ancien système, mais pour tester à l'essai sans risque.
- **Positionnement du pilote :** Générateur de meilleure rentabilité + Combiner l'expérience de menu + Commande directe (seulement sur place, 0% commission).
- ⚠️ **Principe "Non pas tout changer" :** Le système est un canal complémentaire, pas un POS total à remplacer immédiatement. Au moment d'imprimer la commande sur place ou via QR code, rien ne saute.
- **Session d'essai (24 juillet 2026) :** Flow — 150/150 remplis, en cas réels et automatisés (parcours complet, numérotation, bag de préparation) avant mise en service réelle.`);
      } else {
        setContent(
          `# ${data?.title || 'Document'}\n\n*Document d'équipe rédigé sur Minerva*\n\n## 1. Objectifs & Contexte\n- Décrire ici les enjeux clés du projet ou du client.\n- Aligner les parties prenantes sur les livrables attendus.\n\n## 2. Plan d'Action & Livrables\n- [x] Cadrage initial et revue des spécifications\n- [ ] Intégration Framer et tests de responsive\n- [ ] Validation client et recette finale\n\n> [!NOTE]\n> Ce document est synchronisé en temps réel avec toute l'équipe.\n\n| Phase | Responsable | Statut |\n| :--- | :--- | :--- |\n| 01. UX/UI | Design | Validé |\n| 02. Build | Tech | En cours |\n| 03. QA | Delivery | À faire |\n`
        );
      }
      setLoading(false);
    })();
  }, [rawId]);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSavedStatus('saving');
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(async () => {
      if (rawId) {
        await renameDocument(rawId, value || 'Document sans titre');
        setSavedStatus('saved');
      }
    }, 500);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setSavedStatus('saving');
    if (typeof window !== 'undefined' && rawId) {
      localStorage.setItem(`minerva_doc_content_${rawId}`, value);
    }
    if (contentDebounce.current) clearTimeout(contentDebounce.current);
    contentDebounce.current = setTimeout(() => {
      setSavedStatus('saved');
    }, 600);
  };

  // Helper to insert markdown formatting at cursor position
  const insertFormatting = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = content;
    const selectedText = currentText.substring(start, end) || placeholder;

    const newText = currentText.substring(0, start) + before + selectedText + after + currentText.substring(end);
    handleContentChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 50);
  };

  const wordCount = useMemo(() => {
    const text = content.trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  }, [content]);

  const charCount = useMemo(() => content.length, [content]);

  const handleExportMarkdown = () => {
    const filename = `${(title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toastSuccess('Export Markdown', `« ${filename} » téléchargé.`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        <SkeletonText className="w-1/2 h-6" />
        <div className="space-y-2 pt-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-full" />
          <SkeletonText className="w-5/6" />
        </div>
        <Skeleton className="w-full h-64 rounded-2xl" />
      </div>
    );
  }

  if (!doc) {
    return (
      <PageFadeIn className="space-y-4 max-w-5xl mx-auto py-8">
        <Link href="/documents" className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux documents
        </Link>
        <div className="bg-mv-surface border border-mv-border rounded-[6px] p-12 text-center space-y-2">
          <FileText className="w-8 h-8 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-800">Document introuvable</p>
          <p className="text-xs text-zinc-400">Ce document a été retiré ou son identifiant est incorrect.</p>
        </div>
      </PageFadeIn>
    );
  }

  const documentId = rawId || doc.id;

  return (
    <PageFadeIn
      className={cn(
        'mx-auto space-y-2.5 pb-12 transition-all',
        isFullscreen ? 'fixed inset-0 z-50 bg-white p-4 max-w-none overflow-y-auto' : 'max-w-7xl'
      )}
    >
      {/* ── 1. Top Navigation, Title & Live Presences ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3.5 py-2 shadow-2xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap print:hidden">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link
            href="/documents"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Documents</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-[3px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
              <FileText className="w-3 h-3" />
            </div>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Document sans titre"
              className="text-[13px] font-semibold text-zinc-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-zinc-400 truncate w-full"
            />
          </div>
        </div>

        {/* Right Tools & Presences */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Saved status indicator */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 border-r border-zinc-200 pr-2 mr-0.5" style={MONO}>
            {savedStatus === 'saving' ? (
              <span className="text-amber-600">● Enregistrement...</span>
            ) : (
              <span className="text-emerald-700 font-medium">✓ Enregistré</span>
            )}
          </div>

          {/* Word / Char Counters */}
          <div className="hidden md:flex items-center gap-1.5 text-[10.5px] font-mono text-zinc-400 border-r border-zinc-200 pr-2 mr-0.5" style={MONO}>
            <span>{wordCount} mots</span>
            <span>·</span>
            <span>{charCount} car.</span>
          </div>

          {/* Segmented View Mode [ Edit | Split | Preview ] */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('edit')}
              className={cn(
                'px-2 py-0.5 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'edit' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
              title="Mode Édition pure"
            >
              <Edit3 className="w-3 h-3" />
              <span className="hidden sm:inline">Éditer</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={cn(
                'px-2 py-0.5 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'split' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
              title="Mode Split (Éditeur + Rendu en direct)"
            >
              <Split className="w-3 h-3" />
              <span className="hidden sm:inline">Split</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-2 py-0.5 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'preview' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500 hover:text-zinc-900'
              )}
              title="Mode Aperçu Final"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Aperçu</span>
            </button>
          </div>

          <RealtimeAvatarStack roomName={`document-presence-${documentId}`} />

          {/* Print / Export / Fullscreen buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
            <button
              onClick={handleExportMarkdown}
              title="Télécharger en Markdown (.md)"
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePrint}
              title="Imprimer / Exporter en PDF"
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Quitter plein écran' : 'Mode Plein Écran'}
              className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Functional Word-like Rich Formatting Toolbar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] px-3 py-1.5 shadow-2xs flex items-center gap-1 text-zinc-600 text-xs overflow-x-auto no-scrollbar print:hidden">
        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <span className="text-[10px] font-mono text-zinc-400 mr-1 hidden sm:inline" style={MONO}>
            Style :
          </span>
          <button
            onClick={() => insertFormatting('# ', '\n', 'Grand Titre')}
            title="Titre 1 (# )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('## ', '\n', 'Sous-Titre')}
            title="Titre 2 (## )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('### ', '\n', 'Section')}
            title="Titre 3 (### )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-semibold cursor-pointer"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Formats (Bold, Italic, Strikethrough, Code) */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <button
            onClick={() => insertFormatting('**', '**', 'texte en gras')}
            title="Gras (**texte**)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-bold cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*', 'texte en italique')}
            title="Italique (*texte*)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 italic cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('~~', '~~', 'texte barré')}
            title="Barré (~~texte~~)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('`', '`', 'code')}
            title="Code en ligne (`code`)"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 font-mono cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lists & Checklists */}
        <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-1.5 mr-1">
          <button
            onClick={() => insertFormatting('- ', '\n', 'Élément de liste')}
            title="Liste à puces (- )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ', '\n', 'Première étape')}
            title="Liste numérotée (1. )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ', '\n', 'Tâche à accomplir')}
            title="Checklist / Tâches (- [ ])"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Structure: Table, Quote, Callout */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => insertFormatting('> ', '\n', 'Citation')}
            title="Citation (> )"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              insertFormatting(
                '\n| Colonne 1 | Colonne 2 | Colonne 3 |\n| :--- | :--- | :--- |\n| Donnée A | Donnée B | Donnée C |\n',
                '',
                ''
              )
            }
            title="Tableau Markdown 3x3"
            className="p-1 rounded hover:bg-zinc-100 text-zinc-700 cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('\n> [!NOTE]\n> ', '\n', 'Information clé ou point d’attention')}
            title="Encadré d'information (> [!NOTE])"
            className="p-1 rounded hover:bg-zinc-100 text-emerald-700 cursor-pointer flex items-center gap-1 text-[11px] font-medium"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Callout</span>
          </button>
        </div>
      </div>

      {/* ── 3. Dual / Split / Preview Live Container ── */}
      <div
        className={cn(
          'bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs',
          viewMode === 'split' && 'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200'
        )}
      >
        {/* Left Side: Markdown Textarea Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="p-4 bg-white print:hidden">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Rédigez votre document en Markdown..."
              className="w-full h-[650px] bg-transparent border-none outline-none resize-none font-mono text-xs sm:text-[12.5px] leading-relaxed text-zinc-800 focus:ring-0"
              style={MONO}
            />
          </div>
        )}

        {/* Right Side: Live Rendered Rich Markdown Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'p-6 bg-zinc-50/50 overflow-y-auto max-h-[680px]',
              viewMode === 'preview' && 'bg-white max-w-4xl mx-auto max-h-none py-8'
            )}
          >
            <div className="prose prose-zinc prose-sm max-w-none text-xs sm:text-[13px] leading-relaxed text-zinc-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*Document vierge. Rédigez votre texte dans la colonne de gauche.*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* ── Print Specific Styles ── */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, .print\\:hidden {
            display: none !important;
          }
          .prose {
            max-width: 100% !important;
            font-size: 11pt !important;
          }
        }
      `}</style>
    </PageFadeIn>
  );
}
