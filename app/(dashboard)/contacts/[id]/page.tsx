'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
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
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonText, Skeleton } from '@/components/ui/skeleton';
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

const CHANNEL_LABEL: Record<ContactNote['channel'], string> = { note: 'Note', sms: 'SMS envoyé', email: 'Courriel envoyé' };
const CHANNEL_VARIANT: Record<ContactNote['channel'], 'neutral' | 'blue' | 'purple'> = { note: 'neutral', sms: 'blue', email: 'purple' };
const PREFERRED_METHOD_LABEL = Object.fromEntries(CONTACT_PREFERRED_METHOD_OPTIONS.map((o) => [o.value, o.label]));

const SOCIAL_LINKS: Array<{ key: keyof Contact; icon: typeof Linkedin; label: string }> = [
  { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn' },
  { key: 'instagram_url', icon: Instagram, label: 'Instagram' },
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

  const handleAddNote = async () => {
    if (!id || !userId || !noteBody.trim()) return;
    setSavingNote(true);
    const note = await addContactNote({ contact_id: id, body: noteBody.trim(), channel: 'note', created_by: userId });
    setSavingNote(false);
    if (note) {
      setNoteBody('');
      setNotes((prev) => [note, ...prev]);
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

  const handleClearFollowUp = async () => {
    if (!contact) return;
    await updateContact(contact.id, { follow_up_date: null, follow_up_note: null });
    setContact({ ...contact, follow_up_date: null, follow_up_note: null });
  };

  const handleStatusChange = async (status: Contact['status']) => {
    if (!contact) return;
    setContact({ ...contact, status });
    await updateContact(contact.id, { status });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-6">
        <SkeletonText className="w-40 h-2.5" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <SkeletonText className="w-1/3 h-6" />
        </div>
        <Skeleton className="w-full h-40 rounded-2xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <p className="text-sm font-bold text-mv-ink">Contact introuvable.</p>
        <Link href="/contacts" className="text-xs text-mv-green hover:underline">Retour aux contacts</Link>
      </div>
    );
  }

  const activeSocials = SOCIAL_LINKS.filter((s) => contact[s.key]);
  const followUpDue = contact.follow_up_date && new Date(contact.follow_up_date).getTime() <= Date.now();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <Link href="/contacts" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux contacts
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar src={contact.avatar_url} name={contact.full_name} size="lg" shape="rounded" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-mv-ink font-display truncate">{contact.full_name}</h1>
              {contact.source === 'self_submitted' && (
                <Badge variant="blue">Soumis via le lien public</Badge>
              )}
              {contact.converted_to_lead_id && (
                <Link href={`/leads/${contact.converted_to_lead_id}`}>
                  <Badge variant="green"><ArrowRightLeft className="w-3 h-3" /> Voir le lead</Badge>
                </Link>
              )}
            </div>
            {(contact.role_title || contact.company) && (
              <p className="text-xs text-mv-ink-soft flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5" />
                {[contact.role_title, contact.company].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={contact.status}
            onChange={(e) => handleStatusChange(e.target.value as Contact['status'])}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-mv-border bg-mv-cream-soft text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
          >
            {CONTACT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {!contact.converted_to_lead_id && (
            <Button variant="secondary" size="sm" onClick={handleConvert} disabled={converting} icon={<ArrowRightLeft className="w-3.5 h-3.5" />}>
              {converting ? 'Conversion…' : 'Convertir en Lead'}
            </Button>
          )}
          <button onClick={handleDelete} className="p-2 rounded-lg text-mv-ink-faint hover:text-mv-red hover:bg-mv-red-bg transition-colors cursor-pointer" title="Supprimer">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/40 transition-colors">
            <Phone className="w-3.5 h-3.5" /> Appeler
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/40 transition-colors">
            <Mail className="w-3.5 h-3.5" /> Courriel (app externe)
          </a>
        )}
        {contact.phone && (
          <button onClick={() => setSmsOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-green text-white text-xs font-bold hover:bg-mv-green-dark transition-colors cursor-pointer">
            <MessageSquare className="w-3.5 h-3.5" /> Envoyer un SMS
          </button>
        )}
        {contact.email && (
          <button onClick={() => setEmailOpen((v) => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-green text-white text-xs font-bold hover:bg-mv-green-dark transition-colors cursor-pointer">
            <Send className="w-3.5 h-3.5" /> Envoyer un courriel
          </button>
        )}
        {activeSocials.map(({ key, icon: Icon, label }) => (
          <a
            key={key}
            href={contact[key] as string}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mv-cream-soft border border-mv-border text-xs font-bold text-mv-ink hover:border-mv-green/40 transition-colors"
          >
            <Icon className="w-3.5 h-3.5" /> {label} <ExternalLink className="w-3 h-3 text-mv-ink-faint" />
          </a>
        ))}
      </div>

      {smsOpen && (
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 space-y-3">
          <label className="block text-xs font-bold text-mv-ink">Message SMS à {contact.phone}</label>
          <textarea rows={3} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3 text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSmsOpen(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleSendSms} disabled={sendingSms || !smsMessage.trim()} icon={sendingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}>
              {sendingSms ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </div>
      )}

      {emailOpen && (
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 space-y-3">
          <label className="block text-xs font-bold text-mv-ink">Courriel à {contact.email}</label>
          <input type="text" placeholder="Objet" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-2.5 text-sm text-mv-ink focus:outline-none focus:border-mv-green" />
          <textarea rows={4} placeholder="Message" value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3 text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none" />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleSendEmail} disabled={sendingEmail || !emailSubject.trim() || !emailMessage.trim()} icon={sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}>
              {sendingEmail ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </div>
      )}

      {/* Meeting context + follow-up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(contact.met_at_event || contact.met_at_location || contact.met_at_date) && (
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 space-y-2">
            <h3 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Rencontré</h3>
            {contact.met_at_event && <p className="text-sm text-mv-ink font-semibold">{contact.met_at_event}</p>}
            <div className="flex items-center gap-3 text-xs text-mv-ink-soft">
              {contact.met_at_location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {contact.met_at_location}</span>}
              {contact.met_at_date && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(contact.met_at_date + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
          </div>
        )}

        {contact.follow_up_date && (
          <div className={`border rounded-2xl p-4 space-y-2 ${followUpDue ? 'bg-mv-red-bg border-mv-red/30' : 'bg-mv-surface border-mv-border'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-mv-ink-soft">
                <Bell className="w-3.5 h-3.5" /> Rappel {followUpDue && '(dû)'}
              </h3>
              <button onClick={handleClearFollowUp} className="text-[10px] text-mv-ink-faint hover:text-mv-ink underline cursor-pointer">Effacer</button>
            </div>
            <p className="text-sm font-semibold text-mv-ink">
              {new Date(contact.follow_up_date + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {contact.follow_up_note && <p className="text-xs text-mv-ink-soft">{contact.follow_up_note}</p>}
          </div>
        )}
      </div>

      {/* Réseautage -- answers from the public self-submission form */}
      {(contact.how_can_i_help || contact.biggest_problem || contact.open_to_collaborate !== null || contact.preferred_contact_method) && (
        <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 space-y-3">
          <h3 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Réseautage</h3>
          {contact.how_can_i_help && (
            <div>
              <p className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wide">Comment l&apos;aider</p>
              <p className="text-sm text-mv-ink whitespace-pre-wrap">{contact.how_can_i_help}</p>
            </div>
          )}
          {contact.biggest_problem && (
            <div>
              <p className="text-[10.5px] font-bold text-mv-ink-faint uppercase tracking-wide">Plus gros problème</p>
              <p className="text-sm text-mv-ink whitespace-pre-wrap">{contact.biggest_problem}</p>
            </div>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            {contact.open_to_collaborate !== null && (
              <Badge variant={contact.open_to_collaborate ? 'green' : 'neutral'}>
                {contact.open_to_collaborate ? 'Ouvert à collaborer' : 'Pas ouvert à collaborer pour l’instant'}
              </Badge>
            )}
            {contact.preferred_contact_method && (
              <span className="text-xs text-mv-ink-soft">
                Préfère être recontacté par : <strong className="text-mv-ink">{PREFERRED_METHOD_LABEL[contact.preferred_contact_method]}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes timeline */}
      <div className="bg-mv-surface border border-mv-border rounded-2xl p-4 space-y-4">
        <h3 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest">Historique</h3>
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Ajouter une note (appel, rencontre, suivi…)"
            className="flex-1 rounded-xl bg-mv-cream-soft border border-mv-border p-2.5 text-sm text-mv-ink focus:outline-none focus:border-mv-green resize-none"
          />
          <Button variant="primary" size="sm" onClick={handleAddNote} disabled={savingNote || !noteBody.trim()}>
            {savingNote ? '…' : 'Ajouter'}
          </Button>
        </div>
        {notes.length === 0 ? (
          <p className="text-xs text-mv-ink-faint italic">Aucun historique pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="flex items-start gap-3 text-xs">
                <Badge variant={CHANNEL_VARIANT[note.channel]} className="shrink-0 mt-0.5">{CHANNEL_LABEL[note.channel]}</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-mv-ink whitespace-pre-wrap">{note.body}</p>
                  <p className="text-[10.5px] text-mv-ink-faint mt-1">
                    {note.author_name || 'Équipe'} · {new Date(note.created_at).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
