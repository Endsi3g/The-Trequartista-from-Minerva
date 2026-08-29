'use client';

import React, { useEffect, useState } from 'react';
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
  FileCode,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchAcademySop } from '@/lib/services/supabase-data';
import type { AcademySOP } from '@/lib/types';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { PageFadeIn } from '@/components/ui/page-transition';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export default function PublicSopSharePage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [sop, setSop] = useState<AcademySOP | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0EDE0] text-zinc-900 py-10 px-4 sm:px-6 flex justify-center">
        <div className="max-w-3xl w-full space-y-4">
          <SkeletonText className="w-32 h-3" />
          <SkeletonText className="w-3/4 h-8" />
          <div className="h-64 bg-white/60 rounded-lg p-6 space-y-3">
            <SkeletonText className="w-full" />
            <SkeletonText className="w-full" />
            <SkeletonText className="w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen bg-[#F0EDE0] text-zinc-900 py-16 px-4 sm:px-6 flex justify-center">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-stone-200/80 rounded-xl p-8 shadow-sm">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h1 className="text-lg font-bold font-serif text-zinc-900">Document introuvable</h1>
          <p className="text-xs text-zinc-500">
            Ce guide ou processus de l'Académie n'est pas accessible ou a été mis à jour.
          </p>
          <Link
            href="/academy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-4 py-2 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Consulter l'Académie</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EDE0] text-zinc-900 antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* ── Public Brand Top Header ── */}
      <header className="sticky top-0 z-30 bg-[#F0EDE0]/90 backdrop-blur-md border-b border-stone-300/70 px-4 sm:px-8 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-xs font-serif shadow-xs">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-serif tracking-tight text-zinc-900">MINERVA</span>
                <span className="text-[10px] uppercase font-mono font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300/60" style={MONO}>
                  Processus Public
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 hidden sm:block">
                Académie &amp; Systèmes Opérationnels
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="h-8 px-3 text-xs font-medium bg-white hover:bg-stone-50 border border-stone-300 rounded-[5px] text-zinc-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Copier le lien public de cette page"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline">Copier le lien</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-medium bg-white hover:bg-stone-50 border border-stone-300 rounded-[5px] text-zinc-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Public Reader Body ── */}
      <main className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-6">
        <PageFadeIn className="space-y-6">
          {/* Article Header Card */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="bg-stone-100 text-stone-700 font-semibold text-[11px] px-2.5 py-0.5 rounded border border-stone-200">
                {sop.category}
              </span>
              <span className="text-zinc-400 font-mono flex items-center gap-1 text-[11px]" style={MONO}>
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{sop.read_time_min || 15} min de lecture</span>
              </span>
              {sop.author && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="text-zinc-500 text-[11px]">Auteur : <strong className="text-zinc-700 font-medium">{sop.author}</strong></span>
                </>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 tracking-tight leading-tight">
              {sop.title}
            </h1>

            {sop.description && (
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed border-l-2 border-emerald-600 pl-3.5 italic bg-emerald-50/30 py-1.5 rounded-r">
                {sop.description}
              </p>
            )}
          </div>

          {/* Markdown Content Container */}
          <article className="bg-white border border-stone-200/90 rounded-xl p-6 sm:p-10 shadow-xs prose prose-zinc max-w-none prose-headings:font-serif prose-headings:tracking-tight prose-a:text-emerald-700 prose-a:underline prose-code:text-emerald-900 prose-code:bg-stone-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl sm:text-2xl font-bold font-serif text-zinc-900 border-b border-stone-200 pb-2.5 mt-8 mb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg sm:text-xl font-bold font-serif text-zinc-850 mt-8 mb-3 flex items-center gap-2">
                    <span className="text-emerald-600">§</span>
                    <span>{children}</span>
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-bold text-zinc-800 mt-6 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed text-zinc-700 my-3">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-1.5 my-3 text-sm text-zinc-700 list-disc list-inside">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="space-y-1.5 my-3 text-sm text-zinc-700 list-decimal list-inside">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm leading-relaxed text-zinc-700">
                    {children}
                  </li>
                ),
                blockquote: ({ children }) => (
                  <div className="relative my-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-200 text-zinc-800 text-sm leading-relaxed not-italic">
                    <div className="font-serif text-zinc-800">{children}</div>
                  </div>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 border border-stone-200 rounded-lg">
                    <table className="w-full text-left text-xs divide-y divide-stone-200">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-stone-50 font-semibold text-zinc-700">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-3.5 py-2.5 font-semibold text-zinc-700">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3.5 py-2 text-zinc-600 border-t border-stone-100">
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  const codeId = Math.random().toString(36).substring(2, 9);
                  const isBlock = Boolean(match) || codeString.includes('\n');

                  if (isBlock) {
                    return (
                      <div className="relative my-4 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 not-prose">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono" style={MONO}>
                          <span>{match ? match[1] : 'code'}</span>
                          <button
                            onClick={() => handleCopyCode(codeString, codeId)}
                            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[10.5px]"
                          >
                            {copiedCodeId === codeId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copier</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-zinc-200" style={MONO}>
                          <code>{codeString}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className="text-xs bg-stone-100 text-zinc-900 px-1 py-0.5 rounded font-mono border border-stone-200" style={MONO} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {sop.content_markdown}
            </ReactMarkdown>
          </article>

          {/* ── Public Footer Card ── */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Minerva Trequartista — Systèmes &amp; Ingénierie</span>
              </div>
              <p className="text-[11.5px] text-zinc-500">
                Agence-studio hybride à Montréal · Tous droits réservés © {new Date().getFullYear()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/academy"
                className="px-3.5 py-1.5 rounded-[5px] bg-stone-100 hover:bg-stone-200 text-zinc-800 text-xs font-medium transition-colors"
              >
                Toutes les SOPs
              </Link>
              <Link
                href="/company"
                className="px-3.5 py-1.5 rounded-[5px] bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Building2 className="w-3 h-3" />
                <span>Découvrir Minerva</span>
              </Link>
            </div>
          </div>
        </PageFadeIn>
      </main>
    </div>
  );
}
