'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface CopyButtonProps {
  text: string;
  tooltipText?: string;
  className?: string;
  size?: 'sm' | 'xs';
}

export function CopyButton({
  text,
  tooltipText = 'Copier dans le presse-papier',
  className = '',
  size = 'xs',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const isXs = size === 'xs';

  return (
    <Tooltip content={copied ? 'Copié !' : tooltipText}>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copié' : tooltipText}
        className={`inline-flex items-center justify-center rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer ${
          copied ? 'text-[#0c8c5e] bg-emerald-50' : ''
        } ${className}`}
      >
        {copied ? (
          <Check className={isXs ? 'w-3 h-3 text-[#0c8c5e]' : 'w-3.5 h-3.5 text-[#0c8c5e]'} />
        ) : (
          <Copy className={isXs ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        )}
      </button>
    </Tooltip>
  );
}
