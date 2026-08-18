'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  X,
  Sparkles,
  Edit3,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  generateMilestoneEmailHtml,
  generateGmailComposeUrl,
  sendEmailViaResend,
} from '@/lib/services/email-service';
import type { ProjectMilestone } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

interface MilestoneEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: ProjectMilestone | null;
  clientName?: string;
  clientEmail?: string;
}

export function MilestoneEmailModal({
  isOpen,
  onClose,
  milestone,
  clientName = 'Toitures Beauchemin',
  clientEmail = 'contact@toituresbeauchemin.ca',
}: MilestoneEmailModalProps) {
  const [recipient, setRecipient] = useState(clientEmail);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');

  useEffect(() => {
    if (milestone) {
      const generated = generateMilestoneEmailHtml({
        clientName,
        milestoneTitle: milestone.title,
        milestoneDescription: milestone.description || undefined,
        deliverableUrl: (milestone as any).deliverable_url || undefined,
        portalUrl: 'https://minerva-trequista.vercel.app/portal/tasks',
      });
      setSubject(generated.subject);
      setHtmlContent(generated.html);
      setTextContent(generated.text);
      setRecipient(clientEmail);
      setSentSuccess(false);
      setErrorMessage(null);
    }
  }, [milestone, clientName, clientEmail]);

  if (!isOpen || !milestone) return null;

  const handleSendResend = async () => {
    if (!recipient.trim()) {
      setErrorMessage('Veuillez renseigner l’adresse email du client.');
      return;
    }
    setSending(true);
    setErrorMessage(null);

    const result = await sendEmailViaResend({
      to: recipient.trim(),
      subject,
      html: htmlContent,
      text: textContent,
    });

    setSending(false);
    if (result.success) {
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
        setSentSuccess(false);
      }, 2000);
    } else {
      setErrorMessage(result.error || 'Erreur lors de l’envoi de l’email.');
    }
  };

  const handleOpenGmail = () => {
    const gmailUrl = generateGmailComposeUrl({
      to: recipient.trim(),
      subject,
      body: textContent,
    });
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-lg w-full p-4 space-y-3.5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-zinc-900">
                Notifier le client par email
              </h3>
              <p className="text-[10.5px] text-zinc-400">
                Jalon : <span className="text-zinc-700 font-medium">{milestone.title}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {sentSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Email envoyé avec succès au client ({recipient}) !</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-2.5 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Recipient & Subject Inputs */}
        <div className="space-y-2 text-xs">
          <div>
            <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
              Destinataire
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="ex: client@entreprise.ca"
              className="w-full h-8 px-2.5 mt-0.5 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
                Objet de l'email
              </label>
              <button
                type="button"
                onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
                className="text-[10.5px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                {mode === 'preview' ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{mode === 'preview' ? 'Modifier le texte' : 'Aperçu'}</span>
              </button>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-8 px-2.5 mt-0.5 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Message Content Preview or Edit */}
        {mode === 'preview' ? (
          <div className="p-3 rounded bg-zinc-50 border border-zinc-200 text-xs space-y-2 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider" style={MONO}>
              Aperçu du message formaté :
            </div>
            <div className="text-zinc-700 whitespace-pre-line leading-relaxed font-sans text-[11.5px]">
              {textContent}
            </div>
          </div>
        ) : (
          <textarea
            value={textContent}
            onChange={(e) => {
              setTextContent(e.target.value);
              setHtmlContent(`<p style="white-space: pre-line;">${e.target.value}</p>`);
            }}
            rows={5}
            className="w-full p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded text-zinc-900 focus:bg-white focus:outline-none focus:border-emerald-600"
          />
        )}

        {/* Action Buttons: Resend vs Gmail */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={handleOpenGmail}
            className="h-8 px-3 text-xs font-medium border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
            <span>Ouvrir dans Gmail</span>
          </button>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleSendResend}
              disabled={sending}
              className="h-8 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Send className="w-3 h-3" />
              <span>{sending ? 'Envoi en cours…' : 'Envoyer via Resend'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
