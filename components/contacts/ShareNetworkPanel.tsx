'use client';

import React, { useEffect, useState } from 'react';
import { Share2, Copy, Check, Download, X } from 'lucide-react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

export function ShareNetworkPanel() {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/reseau`
    : '';

  useEffect(() => {
    if (!open || !url) return;
    QRCode.toDataURL(url, { width: 240, margin: 1, color: { dark: '#18181b', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [open, url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'minerva-reseau-qr.png';
    a.click();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 px-3 rounded-[4px] bg-mv-cream-soft border border-mv-border hover:border-mv-green/40 text-mv-ink text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>Partager</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-mv-surface border border-mv-border rounded-2xl shadow-mv-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-mv-ink uppercase tracking-widest">Réseau public</h3>
              <button onClick={() => setOpen(false)} className="text-mv-ink-faint hover:text-mv-ink cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-mv-ink-soft">
              Ce lien ouvre un formulaire public où les entrepreneurs peuvent s&apos;ajouter eux-mêmes à vos contacts.
            </p>

            <div className="flex items-center justify-center bg-mv-cream-soft border border-mv-border rounded-xl p-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code du réseau" width={160} height={160} />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-[10px] text-mv-ink-faint">Génération…</div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={url}
                className="flex-1 min-w-0 h-7 px-2 text-[10.5px] rounded-md border border-mv-border bg-mv-cream-soft text-mv-ink-soft truncate"
              />
              <button
                onClick={handleCopy}
                className={cn(
                  'h-7 px-2 rounded-md border text-[10.5px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors',
                  copied ? 'bg-mv-green text-white border-mv-green' : 'bg-mv-cream-soft border-mv-border text-mv-ink hover:border-mv-green/40'
                )}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="w-full h-7 rounded-md bg-mv-green hover:bg-mv-green-dark text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3" /> Télécharger le QR
            </button>

            <p className="text-[10px] text-mv-ink-faint">
              Programmez ce même lien sur une carte NFC avec n&apos;importe quelle app d&apos;écriture NFC (ex: NFC Tools).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
