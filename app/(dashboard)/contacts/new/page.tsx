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
  Sparkles,
  Loader2,
} from 'lucide-react';
import { addContact } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';
import { SECTOR_OPTIONS } from '@/lib/constants/contacts';
import { UserAvatar } from '@/components/ui/user-avatar';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
      {children}
      {optional && <span className="ml-1 text-[9px] font-normal text-zinc-400 lowercase">(optionnel)</span>}
    </label>
  );
}

const inputClass =
  'w-full h-8 px-2.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors';

export default function NewContactPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [fetchingIg, setFetchingIg] = useState(false);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [sector, setSector] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
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

  const handleFetchInstagram = async () => {
    if (!instagramUrl.trim()) {
      toastError('Compte requis', 'Veuillez saisir un nom d\'utilisateur ou un lien Instagram.');
      return;
    }

    setFetchingIg(true);
    try {
      const res = await fetch('/api/instagram/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: instagramUrl.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        toastError('Erreur d\'importation', json.error || 'Impossible d\'importer ce profil.');
        return;
      }

      const data = json.data;
      if (data) {
        if (!fullName.trim()) setFullName(data.fullName || data.username);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.biography && !bio.trim()) setBio(data.biography);
        if (data.websiteUrl && !websiteUrl.trim()) setWebsiteUrl(data.websiteUrl);
        setInstagramUrl(`https://instagram.com/${data.username}`);
        toastSuccess('Profil Instagram importé', `@${data.username} a été chargé avec succès.`);
      }
    } catch {
      toastError('Erreur réseau', 'Impossible de contacter le service d\'importation.');
    } finally {
      setFetchingIg(false);
    }
  };

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
      avatar_url: avatarUrl.trim() || null,
      bio: bio.trim() || null,
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
            <FieldLabel optional>Entreprise</FieldLabel>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel optional>Poste</FieldLabel>
            <input type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel optional>Courriel professionnel</FieldLabel>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <FieldLabel optional>Téléphone</FieldLabel>
            <input type="tel" placeholder="514 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2">
            <FieldLabel optional>Secteur d&apos;activité</FieldLabel>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className={cn(inputClass, 'cursor-pointer appearance-none')}>
              <option value="">Sélectionner…</option>
              {SECTOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <FieldLabel optional>Biographie / Présentation</FieldLabel>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio du profil ou notes générales…"
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Réseaux sociaux & Import Instagram */}
        <div className="pt-0.5">
          <FieldLabel>Réseaux sociaux & web</FieldLabel>

          {/* Bannière d'importation rapide Instagram */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-zinc-800 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                Compte Instagram
              </label>
              <button
                type="button"
                onClick={handleFetchInstagram}
                disabled={fetchingIg || !instagramUrl.trim()}
                className="h-6 px-2 text-[11px] font-medium bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
              >
                {fetchingIg ? (
                  <Loader2 className="w-3 h-3 animate-spin text-pink-700" />
                ) : (
                  <Sparkles className="w-3 h-3 text-pink-600" />
                )}
                {fetchingIg ? 'Importation…' : '⚡ Importer depuis Instagram'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="@nomdutilisateur ou https://instagram.com/..."
                className={cn(inputClass, 'bg-white')}
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Entrez le compte Instagram et cliquez sur « Importer » pour pré-remplir le nom, la photo et la bio.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <Linkedin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="LinkedIn" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative">
              <Twitter className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="X / Twitter" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative">
              <Facebook className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="Facebook" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
            </div>
            <div className="relative col-span-3">
              <Globe className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="url" placeholder="Site web (https://…)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={cn(inputClass, 'h-7 pl-6')} />
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
          <UserAvatar
            name={fullName || 'Contact'}
            src={avatarUrl || null}
            size="md"
            className="rounded-md shrink-0 ring-1 ring-zinc-200"
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-zinc-900 truncate">{fullName || 'Nom du contact'}</div>
            <div className="text-[11px] text-zinc-500 font-mono truncate" style={MONO}>
              {[roleTitle, company].filter(Boolean).join(' · ') || 'Poste · Entreprise'}
            </div>
          </div>
        </div>

        {bio && (
          <div className="text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-md border border-zinc-100 italic line-clamp-3">
            « {bio} »
          </div>
        )}

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
