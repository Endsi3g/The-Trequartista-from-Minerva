'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CalendarDays,
  MapPin,
  Bell,
  Check,
} from 'lucide-react';
import { addContact } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';

const SECTOR_OPTIONS = [
  'Restauration & Café',
  'Bâtiment & Rénovation',
  'Immobilier',
  'SaaS & Technologie',
  'Santé & Bien-être',
  'Commerce de détail',
  'Services professionnels',
  'Automobile',
  'Autre',
];

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{children}</label>;
}

const inputClass =
  'w-full h-8 px-2.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors';

export default function NewContactPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [sector, setSector] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [metAtEvent, setMetAtEvent] = useState('');
  const [metAtLocation, setMetAtLocation] = useState('');
  const [metAtDate, setMetAtDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const contact = await addContact({
      full_name: fullName.trim(),
      company: company.trim() || null,
      role_title: roleTitle.trim() || null,
      sector: sector.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      linkedin_url: linkedinUrl.trim() || null,
      instagram_url: instagramUrl.trim() || null,
      twitter_url: twitterUrl.trim() || null,
      facebook_url: facebookUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      met_at_event: metAtEvent.trim() || null,
      met_at_location: metAtLocation.trim() || null,
      met_at_date: metAtDate || null,
      follow_up_date: followUpDate || null,
      follow_up_note: followUpNote.trim() || null,
      created_by: user.id,
    });

    setSaving(false);
    if (contact) {
      router.push(`/contacts/${contact.id}`);
    } else {
      toastError('Erreur', 'Impossible de créer ce contact. Réessayez.');
    }
  };

  // Keyboard shortcuts: ⌘+Enter / Ctrl+Enter to submit, Esc to cancel.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCreate();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/contacts');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, company, roleTitle, sector, email, phone, linkedinUrl, instagramUrl, twitterUrl, facebookUrl, websiteUrl, metAtEvent, metAtLocation, metAtDate, followUpDate, followUpNote]);

  const daysUntilFollowUp = followUpDate
    ? Math.round((new Date(followUpDate + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
    : null;

  const initials = fullName.trim() ? fullName.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '?';

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 items-start pb-8">
      {/* ── Left: Structured Form (2/3 width) ── */}
      <form
        onSubmit={handleCreate}
        className="lg:col-span-2 border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-3.5"
      >
        <div>
          <Link href="/contacts" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Contacts
          </Link>
          <h1 className="text-[15px] font-semibold text-zinc-900">Nouveau Contact CRM</h1>
        </div>

        {/* Identité */}
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <FieldLabel>Nom complet</FieldLabel>
            <input
              type="text"
              required
              autoFocus
              placeholder="Marie Tremblay"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel>Entreprise</FieldLabel>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Poste</FieldLabel>
            <input type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Courriel professionnel</FieldLabel>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel>Téléphone</FieldLabel>
            <input type="tel" placeholder="514 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2">
            <FieldLabel>Secteur d&apos;activité</FieldLabel>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className={cn(inputClass, 'cursor-pointer appearance-none')}>
              <option value="">Sélectionner…</option>
              {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="pt-0.5">
          <FieldLabel>Réseaux sociaux & web</FieldLabel>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <Linkedin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="LinkedIn" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative">
              <Instagram className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="Instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative">
              <Twitter className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="X / Twitter" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative">
              <Facebook className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative col-span-2">
              <Globe className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="https://…" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
          </div>
        </div>

        {/* Contexte & rappel */}
        <div className="pt-0.5">
          <FieldLabel>Contexte de rencontre & suivi</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <input type="text" placeholder="Événement" value={metAtEvent} onChange={(e) => setMetAtEvent(e.target.value)} className={inputClass} />
            </div>
            <div className="relative">
              <MapPin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" placeholder="Lieu" value={metAtLocation} onChange={(e) => setMetAtLocation(e.target.value)} className={cn(inputClass, 'pl-6')} />
            </div>
            <div className="relative">
              <CalendarDays className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="date" value={metAtDate} onChange={(e) => setMetAtDate(e.target.value)} className={cn(inputClass, 'pl-6')} title="Date de rencontre" />
            </div>
            <div className="relative">
              <Bell className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className={cn(inputClass, 'pl-6')} title="Date du rappel" />
            </div>
            <div className="col-span-2">
              <input type="text" placeholder="Note du rappel (ex: relancer pour une démo)" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </form>

      {/* ── Right: Live Preview & Actions (1/3 width) ── */}
      <div className="lg:sticky lg:top-4 border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 text-white font-mono text-xs flex items-center justify-center shrink-0" style={MONO}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-zinc-900 truncate">{fullName || 'Nom du contact'}</div>
            <div className="text-[11px] text-zinc-500 font-mono truncate" style={MONO}>
              {[roleTitle, company].filter(Boolean).join(' · ') || 'Poste · Entreprise'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[70px_1fr] text-[11px] font-mono gap-y-1.5 text-zinc-600 border-t border-zinc-100 pt-3" style={MONO}>
          <span>Courriel</span>
          <span className="text-zinc-900 truncate">{email || '—'}</span>
          <span>Téléphone</span>
          <span className="text-zinc-900 truncate">{phone || '—'}</span>
          <span>Secteur</span>
          <span className="text-zinc-900 truncate">{sector || '—'}</span>
          <span>Rappel</span>
          <span className="text-zinc-900 truncate">
            {followUpDate
              ? `${new Date(followUpDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} (${daysUntilFollowUp !== null && daysUntilFollowUp >= 0 ? `J+${daysUntilFollowUp}` : 'passé'})`
              : '—'}
          </span>
        </div>

        <div className="pt-1 space-y-1.5">
          <button
            type="button"
            onClick={() => router.push('/contacts')}
            className="h-8 w-full text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
          >
            Annuler (Échap)
          </button>
          <button
            type="button"
            onClick={() => handleCreate()}
            disabled={saving || !fullName.trim()}
            className="h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Enregistrement…' : 'Créer le contact (⌘ + Entrée)'}
          </button>
        </div>
      </div>
    </div>
  );
}
