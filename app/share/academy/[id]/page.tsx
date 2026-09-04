'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Copy,
  Check,
  Share2,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { SopMarkdownRenderer, slugifyHeading } from '@/components/academy/SopMarkdownRenderer';
import { fetchAcademySop } from '@/lib/services/supabase-data';
import type { AcademySOP } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
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

export default function PublicSopSharePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [sop, setSop] = useState<AcademySOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  useEffect(() => {
    if (!rawId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAcademySop(rawId);
        setSop(data);
      } finally {
        setLoading(false);
      }
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

  // Keyboard shortcut listener for Fullscreen
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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAFAFA] text-zinc-900">
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-20 px-6 py-2.5">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between">
            <div className="h-6 w-64 bg-zinc-100 rounded animate-pulse" />
            <div className="h-7 w-32 bg-zinc-100 rounded animate-pulse" />
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
      <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 py-16 px-4 sm:px-6 flex justify-center">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-zinc-200 rounded-xl p-8 shadow-xs">
          <BookOpen className="w-10 h-10 text-zinc-400 mx-auto" />
          <h1 className="text-lg font-bold font-display text-zinc-900">Document introuvable</h1>
          <p className="text-xs text-zinc-500">
            Ce guide ou processus de l'Académie n'est pas accessible ou a été mis à jour.
          </p>
          <Link
            href="/academy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-md border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Consulter l'Académie</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full min-h-screen bg-[#FAFAFA] text-zinc-900',
        isFullscreen && 'fixed inset-0 z-50 overflow-y-auto'
      )}
    >
      {/* ── Top Bar Publique (Style Linear / Raycast dense 28px) ── */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-20 px-6 py-2.5 print:hidden">
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="h-7 px-2.5 text-xs font-sans border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copier le lien public"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-zinc-500" />}
                <span className="hidden sm:inline">{copiedUrl ? 'Lien copié !' : 'Partager'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-7 w-7 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md border border-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Imprimer / Exporter en PDF"
              >
                <Printer className="w-3.5 h-3.5" />
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

            <Link
              href="/academy"
              className="h-7 px-3 text-xs font-sans font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Accéder à l’Académie</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Grille Principale 3-Colonnes (CSS Grid Stripe Docs) ── */}
      <div className="max-w-[1440px] mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-8 items-start">
        {/* COLONNE GAUCHE : Sommaire Sticky */}
        <aside className="hidden lg:block sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 print:hidden">
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
          </div>

          {/* Technical Documentation Content */}
          <div className="prose-container">
            {sanitizedMarkdown ? (
              <SopMarkdownRenderer content={sanitizedMarkdown} />
            ) : (
              <p className="text-xs text-zinc-400 py-12 text-center">Contenu en cours de rédaction.</p>
            )}
          </div>

          {/* Footer Card */}
          <div className="border-t border-zinc-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Minerva — Systèmes &amp; Ingénierie</span>
              </div>
              <p className="text-[11.5px] text-zinc-500">
                Studio-agence hybride à Montréal · Tous droits réservés © {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/academy"
                className="px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
              >
                Toutes les SOPs
              </Link>
              <Link
                href="/company"
                className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Découvrir Minerva</span>
              </Link>
            </div>
          </div>
        </main>

        {/* COLONNE DROITE : Métadonnées & Accès Rapides */}
        <aside className="hidden lg:block sticky top-16 space-y-4 print:hidden">
          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-3">
            <div className="text-[11px] font-mono uppercase font-semibold text-zinc-500 tracking-wider border-b border-zinc-100 pb-2">
              Informations Guide
            </div>

            <div className="space-y-2 text-xs font-sans text-zinc-600">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">Rédacteur</span>
                <span className="font-semibold text-zinc-800 truncate max-w-[120px]">{sop.author || 'Minerva Lead'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">Diffusion</span>
                <span className="text-emerald-700 font-mono font-medium">Standard Public</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono text-[10px] uppercase">Format</span>
                <span className="text-zinc-700 font-mono">SOP Markdown</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-xs space-y-2.5">
            <div className="text-[11px] font-mono uppercase font-semibold text-zinc-500 tracking-wider border-b border-zinc-100 pb-2">
              Accès Rapides
            </div>

            <div className="space-y-1 text-xs font-sans">
              <Link
                href="/academy"
                className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Portail Académie Interne</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </Link>

              <a
                href="https://minervaflow.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-1.5 rounded-md text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Site Officiel Minerva</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
