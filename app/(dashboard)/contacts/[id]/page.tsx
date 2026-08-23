'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CalendarDays,
  MapPin,
  Bell,
  ArrowRightLeft,
  Trash2,
  Send,
  MessageSquare,
  Loader2,
  ExternalLink,
  Pencil,
  Copy,
  Check,
  Building2,
  FileText,
  Sparkles,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import {
  fetchContact,
  fetchContactNotes,
  addContactNote,
  deleteContact,
  updateContact,
  convertContactToLead,
} from '@/lib/services/supabase-data';
import type { Contact, ContactNote } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { CONTACT_STATUS_OPTIONS, CONTACT_PREFERRED_METHOD_OPTIONS } from '@/lib/constants/contacts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

const PREFERRED_METHOD_LABEL = Object.fromEntries(CONTACT_PREFERRED_METHOD_OPTIONS.map((o) => [o.value, o.label]));

const SOCIAL_ACTIONS: Array<{ key: keyof Contact; icon: typeof Linkedin; label: string }> = [
  { key: 'instagram_url', icon: Instagram, label: 'Instagram' },
  { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn' },
  { key: 'twitter_url', icon: Twitter, label: 'Twitter / X' },
  { key: 'facebook_url', icon: Facebook, label: 'Facebook' },
  { key: 'website_url', icon: Globe, label: 'Site web' },
];

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastSuccess, toastError } = useToast();
  const confirmDialog = useConfirm();

  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [smsOpen, setSmsOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [converting, setConverting] = useState(false);
  const [copiedOpener, setCopiedOpener] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [c, n] = await Promise.all([fetchContact(id), fetchContactNotes(id)]);
    setContact(c);
    setNotes(n);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, [load]);

  const handleCopyOpener = () => {
    if (!contact?.follow_up_note) return;
    navigator.clipboard.writeText(contact.follow_up_note);
    setCopiedOpener(true);
    toastSuccess('Opener copié !', 'Le message d\'accroche est dans le presse-papiers.');
    setTimeout(() => setCopiedOpener(false), 2000);
  };

  const handleMarkContacted = async () => {
    if (!contact) return;
    await handleStatusChange('rencontre_proposee');
    toastSuccess('Statut mis à jour', 'Le contact est maintenant noté comme « Rencontre proposée ».');
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !userId || !noteBody.trim()) return;
    setSavingNote(true);
    const note = await addContactNote({ contact_id: id, body: noteBody.trim(), channel: 'note', created_by: userId });
    setSavingNote(false);
    if (note) {
      setNoteBody('');
      setNotes((prev) => [note, ...prev]);
      toastSuccess('Note ajoutée');
    } else {
      toastError('Erreur', "Impossible d'enregistrer la note.");
    }
  };

  const handleSendSms = async () => {
    if (!id || !smsMessage.trim()) return;
    setSendingSms(true);
    try {
      const res = await fetch(`/api/contacts/${id}/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: smsMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError('Envoi impossible', data.error || 'Erreur inconnue.');
        return;
      }
      toastSuccess('SMS envoyé');
      setSmsMessage('');
      setSmsOpen(false);
      load();
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendEmail = async () => {
    if (!id || !emailSubject.trim() || !emailMessage.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/contacts/${id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: emailSubject.trim(), message: emailMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError('Envoi impossible', data.error || 'Erreur inconnue.');
        return;
      }
      toastSuccess('Courriel envoyé');
      setEmailSubject('');
      setEmailMessage('');
      setEmailOpen(false);
      load();
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le serveur.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConvert = async () => {
    if (!contact || !userId) return;
    setConverting(true);
    const lead = await convertContactToLead(contact, userId);
    setConverting(false);
    if (lead) {
      toastSuccess('Contact converti en lead');
      router.push(`/leads/${lead.id}`);
    } else {
      toastError('Erreur', 'Impossible de convertir ce contact en lead.');
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    const ok = await confirmDialog({
      title: 'Supprimer ce contact ?',
      message: `« ${contact.full_name} » sera supprimé définitivement, avec son historique de notes.`,
      confirmLabel: 'Supprimer',
      variant: 'danger',
    });
    if (!ok) return;
    await deleteContact(contact.id);
    router.push('/contacts');
  };

  const handleStatusChange = async (newStatus: Contact['status']) => {
    if (!contact) return;
    setContact({ ...contact, status: newStatus });
    await updateContact(contact.id, { status: newStatus });
  };

  // Keyboard shortcut: ⌘+Enter to submit note
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4 py-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="text-sm font-semibold text-zinc-900">Contact introuvable.</p>
        <Link href="/contacts" className="text-xs text-emerald-600 hover:underline">
          ← Retour aux contacts
        </Link>
      </div>
    );
  }

  const initials = contact.full_name.trim()
    ? contact.full_name
        .trim()
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const followUpDue = contact.follow_up_date && new Date(contact.follow_up_date).getTime() <= Date.now();
  const daysUntilFollowUp = contact.follow_up_date
    ? Math.round(
        (new Date(contact.follow_up_date + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) /
          86400000
      )
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-3.5 pb-16">
      {/* ── 1. Top Strip & Compact Header ── */}
      <div className="space-y-2">
        <Link
          href="/contacts"
          className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Réseau & Contacts
        </Link>

        <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Identité */}
          <div className="flex items-center gap-3 min-w-0">
            {contact.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={contact.avatar_url}
                alt={contact.full_name}
                className="w-8 h-8 rounded-md object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-md bg-zinc-900 text-white font-mono text-xs font-semibold flex items-center justify-center shrink-0"
                style={MONO}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[18px] font-semibold text-zinc-900 tracking-tight truncate">
                  {contact.full_name}
                </h1>
                {contact.source === 'self_submitted' && (
                  <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
                    Lien public
                  </span>
                )}
                {contact.converted_to_lead_id && (
                  <Link
                    href={`/leads/${contact.converted_to_lead_id}`}
                    className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-emerald-100 transition-colors"
                  >
                    <ArrowRightLeft className="w-2.5 h-2.5" /> Lead converti
                  </Link>
                )}
              </div>
              <div className="text-[12px] text-zinc-500 font-mono truncate" style={MONO}>
                {[contact.role_title, contact.company].filter(Boolean).join(' · ') || 'Contact sans titre'}
              </div>
            </div>
          </div>

          {/* Contrôles à droite */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="h-7 px-2.5 text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Pencil className="w-3 h-3 text-zinc-400" />
              <span>Modifier</span>
            </Link>

            <select
              value={contact.status}
              onChange={(e) => handleStatusChange(e.target.value as Contact['status'])}
              className="h-7 px-2 text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
            >
              {CONTACT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {!contact.converted_to_lead_id && (
              <button
                type="button"
                onClick={handleConvert}
                disabled={converting}
                className="h-7 px-2.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{converting ? 'Conversion…' : 'Convertir en Lead'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDelete}
              className="h-7 w-7 border border-zinc-200 bg-white hover:bg-red-50 hover:border-red-200 text-zinc-400 hover:text-red-600 rounded-md flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              title="Supprimer ce contact"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bandeau d'Actions Rapides Connecté (Quick Actions Bar) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="h-7 px-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Phone className="w-3 h-3 text-zinc-500" />
              <span>Appeler</span>
            </a>
          )}
          {contact.phone && (
            <button
              type="button"
              onClick={() => {
                setSmsOpen((v) => !v);
                setEmailOpen(false);
              }}
              className={cn(
                'h-7 px-2.5 border text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer',
                smsOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
              )}
            >
              <MessageSquare className="w-3 h-3 text-zinc-500" />
              <span>SMS</span>
            </button>
          )}
          {contact.email && (
            <button
              type="button"
              onClick={() => {
                setEmailOpen((v) => !v);
                setSmsOpen(false);
              }}
              className={cn(
                'h-7 px-2.5 border text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer',
                emailOpen
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
              )}
            >
              <Mail className="w-3 h-3 text-zinc-500" />
              <span>Courriel</span>
            </button>
          )}

          {SOCIAL_ACTIONS.map(({ key, icon: Icon, label }) => {
            const link = contact[key];
            if (!link) return null;
            return (
              <a
                key={key}
                href={link as string}
                target="_blank"
                rel="noreferrer"
                className="h-7 px-2.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-md flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Icon className="w-3 h-3 text-zinc-500" />
                <span>{label}</span>
                <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
              </a>
            );
          })}
        </div>
      </div>

      {/* ── 2. Layout 2-Colonnes Monolithique (Split-View) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* ── COLONNE GAUCHE (1/3) : Fiche d'Informations & Réseautage ── */}
        <div className="lg:col-span-1 border border-zinc-200 rounded-lg p-4 bg-white shadow-2xs space-y-4">
          {/* Bio Instagram / Description */}
          {contact.bio && (
            <div className="text-xs text-zinc-700 bg-zinc-50/90 p-2.5 rounded-md border border-zinc-100 italic leading-relaxed">
              « {contact.bio} »
            </div>
          )}

          {/* Section Contexte de Rencontre & Coordonnées */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-1.5">
              Contexte & Coordonnées
            </h2>

            <div className="grid grid-cols-[90px_1fr] text-xs gap-y-2 font-mono" style={MONO}>
              <span className="text-zinc-400">Courriel</span>
              <span className="text-zinc-800 truncate select-all">{contact.email || '—'}</span>

              <span className="text-zinc-400">Téléphone</span>
              <span className="text-zinc-800 truncate select-all">{contact.phone || '—'}</span>

              <span className="text-zinc-400">Secteur</span>
              <span className="text-zinc-800 truncate">{contact.sector || '—'}</span>

              <span className="text-zinc-400">Événement</span>
              <span className="text-zinc-800 truncate">{contact.met_at_event || '—'}</span>

              <span className="text-zinc-400">Lieu</span>
              <span className="text-zinc-800 truncate">{contact.met_at_location || '—'}</span>

              <span className="text-zinc-400">Rencontré le</span>
              <span className="text-zinc-800 truncate">
                {contact.met_at_date
                  ? new Date(contact.met_at_date + 'T00:00:00').toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>

              <span className="text-zinc-400">Canal favori</span>
              <span className="text-zinc-800 truncate">
                {contact.preferred_contact_method
                  ? PREFERRED_METHOD_LABEL[contact.preferred_contact_method]
                  : '—'}
              </span>

              <span className="text-zinc-400">Statut collab</span>
              <span className="text-zinc-800 truncate flex items-center gap-1.5">
                {contact.open_to_collaborate === true ? (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10.5px] border border-emerald-200">
                    ● Ouvert à collaborer
                  </span>
                ) : contact.open_to_collaborate === false ? (
                  <span className="text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded text-[10.5px]">
                    Non ouvert
                  </span>
                ) : (
                  '—'
                )}
              </span>
            </div>
          </div>

          {/* Section Opener & Rappel de Relance */}
          {(contact.follow_up_note || contact.follow_up_date) && (
            <div
              className={cn(
                'rounded-md p-3 border space-y-2',
                followUpDue
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                  : 'bg-zinc-50/80 border-zinc-200 text-zinc-900'
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1 font-mono">
                  <Bell className="w-3 h-3 text-amber-600" />
                  {followUpDue ? 'Rappel dû aujourd\'hui' : 'Rappel programmé'}
                </span>
                {contact.follow_up_date && (
                  <span className="text-[10px] font-mono text-zinc-500" style={MONO}>
                    {new Date(contact.follow_up_date + 'T00:00:00').toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    ({daysUntilFollowUp !== null && daysUntilFollowUp >= 0 ? `J+${daysUntilFollowUp}` : 'dû'})
                  </span>
                )}
              </div>

              {contact.follow_up_note && (
                <div className="bg-white border border-zinc-200/80 rounded p-2 text-xs font-mono text-zinc-800 whitespace-pre-wrap select-all">
                  {contact.follow_up_note}
                </div>
              )}

              <div className="flex items-center justify-end gap-1.5 pt-1">
                {contact.follow_up_note && (
                  <button
                    type="button"
                    onClick={handleCopyOpener}
                    className="h-6 px-2 text-[11px] font-medium bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedOpener ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedOpener ? 'Copié' : 'Copier l\'opener'}</span>
                  </button>
                )}
                {contact.status === 'a_contacter' && (
                  <button
                    type="button"
                    onClick={handleMarkContacted}
                    className="h-6 px-2 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Marquer contacté</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section Besoins & Synergies (Questionnaire de Réseautage) */}
          {(contact.how_can_i_help || contact.biggest_problem) && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-100">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Besoins & Synergies
              </h2>

              {contact.how_can_i_help && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                    Comment l&apos;aider
                  </span>
                  <div className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded border border-zinc-100 whitespace-pre-wrap">
                    {contact.how_can_i_help}
                  </div>
                </div>
              )}

              {contact.biggest_problem && (
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
                    Plus gros problème
                  </span>
                  <div className="text-xs text-zinc-700 bg-zinc-50 p-2 rounded border border-zinc-100 whitespace-pre-wrap">
                    {contact.biggest_problem}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE (2/3) : Timeline d'Activité & Prise de Notes ── */}
        <div className="lg:col-span-2 border border-zinc-200 rounded-lg p-4 bg-white shadow-2xs flex flex-col min-h-[520px] space-y-3.5">
          {/* Tiroir d'envoi SMS inline (conditionnel) */}
          {smsOpen && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Nouveau SMS à {contact.phone}
                </span>
                <button
                  type="button"
                  onClick={() => setSmsOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Fermer
                </button>
              </div>
              <textarea
                rows={2}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Rédigez votre SMS…"
                className="w-full text-xs bg-white border border-zinc-200 rounded-md p-2 text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSmsOpen(false)}
                  className="h-7 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={sendingSms || !smsMessage.trim()}
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {sendingSms ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>{sendingSms ? 'Envoi…' : 'Envoyer SMS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tiroir d'envoi Courriel inline (conditionnel) */}
          {emailOpen && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  Nouveau Courriel à {contact.email}
                </span>
                <button
                  type="button"
                  onClick={() => setEmailOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-700"
                >
                  Fermer
                </button>
              </div>
              <input
                type="text"
                placeholder="Objet"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full h-8 text-xs bg-white border border-zinc-200 rounded-md px-2.5 text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
              />
              <textarea
                rows={3}
                placeholder="Corps du message…"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full text-xs bg-white border border-zinc-200 rounded-md p-2 text-zinc-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 resize-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEmailOpen(false)}
                  className="h-7 px-2.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                  className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>{sendingEmail ? 'Envoi…' : 'Envoyer Courriel'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Saisie rapide de note de suivi (Top Input) */}
          <form onSubmit={handleAddNote} className="space-y-2 border-b border-zinc-100 pb-3.5">
            <div className="relative">
              <textarea
                rows={2}
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                onKeyDown={handleNoteKeyDown}
                placeholder="Ajouter une note de suivi (appel, rencontre, prochaine étape)…"
                className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-zinc-400 font-mono" style={MONO}>
                Raccourci : ⌘ + Entrée
              </span>
              <button
                type="submit"
                disabled={savingNote || !noteBody.trim()}
                className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                <span>{savingNote ? 'Enregistrement…' : 'Ajouter (⌘ + Entrée)'}</span>
              </button>
            </div>
          </form>

          {/* Fil d'Activité Structuré (Activity Feed) */}
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Fil d&apos;Activité ({notes.length})
              </h2>
            </div>

            {notes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-zinc-400">
                <FileText className="w-6 h-6 mb-1 text-zinc-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-zinc-500">Aucune activité enregistrée</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Utilisez le champ ci-dessus pour consigner un appel ou une note.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notes.map((note) => {
                  const isSms = note.channel === 'sms';
                  const isEmail = note.channel === 'email';
                  const Icon = isSms ? MessageSquare : isEmail ? Mail : FileText;
                  const iconColor = isSms
                    ? 'text-blue-600 bg-blue-50 border-blue-200'
                    : isEmail
                    ? 'text-purple-600 bg-purple-50 border-purple-200'
                    : 'text-zinc-600 bg-zinc-100 border-zinc-200';

                  return (
                    <div
                      key={note.id}
                      className="p-3 bg-zinc-50/60 hover:bg-zinc-50 border border-zinc-200/80 rounded-md transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-5 h-5 rounded flex items-center justify-center border text-[10px]',
                              iconColor
                            )}
                          >
                            <Icon className="w-3 h-3" />
                          </span>
                          <span className="text-xs font-semibold text-zinc-800">
                            {note.author_name || 'Équipe'}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-zinc-400 font-mono" style={MONO}>
                          {new Date(note.created_at).toLocaleDateString('fr-CA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed pl-6">
                        {note.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
