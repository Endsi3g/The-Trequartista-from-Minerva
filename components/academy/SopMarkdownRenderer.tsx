'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

interface SopMarkdownRendererProps {
  content: string;
  className?: string;
}

export function SopMarkdownRenderer({ content, className }: SopMarkdownRendererProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (text: string, id: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  return (
    <div className={cn('prose prose-zinc max-w-none text-zinc-900', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);
            return (
              <h1
                id={id}
                className="text-xl sm:text-2xl font-bold font-display text-zinc-950 border-b border-zinc-200 pb-3 mt-6 mb-4 scroll-mt-24"
              >
                {children}
              </h1>
            );
          },
          h2: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);
            return (
              <h2
                id={id}
                className="text-lg sm:text-xl font-bold font-display text-zinc-900 mt-8 mb-3 flex items-center gap-2 border-b border-zinc-100 pb-2 scroll-mt-24 group"
              >
                <span className="text-emerald-600 select-none">§</span>
                <span className="flex-1">{children}</span>
                <a
                  href={`#${id}`}
                  className="opacity-0 group-hover:opacity-100 text-xs font-mono text-zinc-400 hover:text-emerald-600 transition-opacity"
                  title="Lien direct vers cette section"
                >
                  #
                </a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);
            return (
              <h3
                id={id}
                className="text-sm sm:text-base font-semibold text-zinc-850 mt-6 mb-2 text-zinc-900 scroll-mt-24 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
                <span>{children}</span>
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="text-xs sm:text-sm leading-relaxed text-zinc-700 my-3 font-sans">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-3 text-xs sm:text-sm text-zinc-700 list-disc list-inside font-sans pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-1.5 my-3 text-xs sm:text-sm text-zinc-700 list-decimal list-inside font-sans pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-xs sm:text-sm leading-relaxed text-zinc-700">
              {children}
            </li>
          ),
          hr: () => <hr className="my-6 border-zinc-200" />,
          blockquote: ({ children }) => (
            <div className="relative my-4 p-4 rounded-xl bg-zinc-50 border-l-3 border-emerald-600 border border-zinc-200/80 text-zinc-800 text-xs sm:text-sm leading-relaxed font-sans shadow-2xs">
              <div className="text-zinc-700 font-sans">{children}</div>
            </div>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-5 border border-zinc-200 rounded-lg shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-zinc-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-50 font-semibold text-zinc-800 font-sans">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-zinc-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-zinc-600 border-t border-zinc-100 font-sans">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || codeString.includes('\n');
            const codeId = `code-${slugifyHeading(codeString.slice(0, 20)) || 'snippet'}`;

            if (isBlock) {
              const lang = match ? match[1] : 'code';
              return (
                <div className="relative my-5 rounded-xl overflow-hidden border border-zinc-800 bg-[#09090b] text-zinc-100 not-prose shadow-sm">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#18181B] border-b border-zinc-800/80 text-[11px] text-zinc-400 font-mono" style={MONO}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-700 inline-block" />
                      <span className="uppercase font-bold tracking-wider text-emerald-400">{lang}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(codeString, codeId)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer text-[11px]"
                      title="Copier le code"
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
                  {/* Code Body */}
                  <pre
                    className="p-4 text-xs font-mono overflow-x-auto leading-relaxed text-zinc-200 bg-[#09090b] selection:bg-emerald-500/30"
                    style={MONO}
                  >
                    <code>{codeString}</code>
                  </pre>
                </div>
              );
            }

            return (
              <code
                className="text-xs bg-zinc-100 text-zinc-850 px-1.5 py-0.5 rounded font-mono border border-zinc-200 text-[11px]"
                style={MONO}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
