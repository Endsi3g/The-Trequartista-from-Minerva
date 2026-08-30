'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Loader2,
  Sparkles,
  User,
  HelpCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { fetchContact, updateContact } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { cn } from '@/lib/utils';
import { SECTOR_OPTIONS, CONTACT_STATUS_OPTIONS, CONTACT_PREFERRED_METHOD_OPTIONS } from '@/lib/constants/contacts';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { Contact } from '@/lib/types';

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

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toastSuccess, toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingIg, setFetchingIg] = useState(false);

  // Form states
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
  const [status, setStatus] = useState<Contact['status']>('a_contacter');
  const [howCanIHelp, setHowCanIHelp] = useState('');
  const [biggestProblem, setBiggestProblem] = useState('');
  const [openToCollaborate, setOpenToCollaborate] = useState<'true' | 'false' | ''>('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await fetchContact(id);
    if (!data) {
      toastError('Erreur', 'Contact introuvable.');
      router.push('/contacts');
      return;
    }

    setFullName(data.full_name || '');
    setCompany(data.company || '');
    setRoleTitle(data.role_title || '');
    setSector(data.sector || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setAvatarUrl(data.avatar_url || '');
    setBio(data.bio || '');
    setLinkedinUrl(data.linkedin_url || '');
    setInstagramUrl(data.instagram_url || '');
    setTwitterUrl(data.twitter_url || '');
    setFacebookUrl(data.facebook_url || '');
    setWebsiteUrl(data.website_url || '');
    setMetAtEvent(data.met_at_event || '');
    setMetAtLocation(data.met_at_location || '');
    setMetAtDate(data.met_at_date ? data.met_at_date.slice(0, 10) : '');
    setFollowUpDate(data.follow_up_date ? data.follow_up_date.slice(0, 10) : '');
    setFollowUpNote(data.follow_up_note || '');
    setStatus(data.status || 'a_contacter');
    setHowCanIHelp(data.how_can_i_help || '');
    setBiggestProblem(data.biggest_problem || '');
    setOpenToCollaborate(
      data.open_to_collaborate === true ? 'true' : data.open_to_collaborate === false ? 'false' : ''
    );
    setPreferredContactMethod(data.preferred_contact_method || '');
    setLoading(false);
  }, [id, router, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFetchInstagram = async () => {
    if (!instagramUrl.trim()) {
      toastError('Compte requis', 'Veuillez renseigner un nom d\'utilisateur ou un lien Instagram.');
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
        toastError('Erreur d\'importation', json.error || 'Impossible d\'importer ce profil Instagram.');
        return;
      }

      const data = json.data;
      if (data) {
        if (!fullName.trim() || fullName === id) {
          setFullName(data.fullName || data.username);
        }
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.biography && !bio.trim()) setBio(data.biography);
        if (data.websiteUrl && !websiteUrl.trim()) setWebsiteUrl(data.websiteUrl);
        setInstagramUrl(`https://instagram.com/${data.username}`);
        toastSuccess('Profil Instagram importé', `@${data.username} a été chargé.`);
      }
    } catch {
      toastError('Erreur réseau', 'Impossible de joindre le service d\'importation.');
    } finally {
      setFetchingIg(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !fullName.trim()) return;

    setSaving(true);
    const ok = await updateContact(id, {
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
      status,
      how_can_i_help: howCanIHelp.trim() || null,
      biggest_problem: biggestProblem.trim() || null,
      open_to_collaborate: openToCollaborate === 'true' ? true : openToCollaborate === 'false' ? false : null,
      preferred_contact_method: (preferredContactMethod as Contact['preferred_contact_method']) || null,
    });

    setSaving(false);
    if (ok) {
      toastSuccess('Contact mis à jour', 'Toutes les modifications ont été enregistrées.');
      router.push(`/contacts/${id}`);
    } else {
      toastError('Erreur', 'Impossible d\'enregistrer les modifications.');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push(`/contacts/${id}`);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, fullName, company, roleTitle, sector, email, phone, avatarUrl, bio, linkedinUrl, instagramUrl, twitterUrl, facebookUrl, websiteUrl, metAtEvent, metAtLocation, metAtDate, followUpDate, followUpNote, status, howCanIHelp, biggestProblem, openToCollaborate, preferredContactMethod, router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 lg:col-span-2 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const daysUntilFollowUp = followUpDate
    ? Math.round((new Date(followUpDate + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
    : null;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 items-start pb-8">
      {/* ── Formulaire principal (2/3 largeur) ── */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-2 border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <Link
              href={`/contacts/${id}`}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-0.5 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Retour à la fiche
            </Link>
            <h1 className="text-[15px] font-semibold text-zinc-900">Modifier le contact</h1>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Contact['status'])}
            className="h-8 px-2.5 text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-md text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
          >
            {CONTACT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Section Identité & Photo ── */}
        <div>
          <h2 className="text-xs font-bold text-zinc-900 mb-2">Identité & Bio</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2">
              <FieldLabel>Nom complet</FieldLabel>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Alexandre Dubois"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel optional>Entreprise</FieldLabel>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ex: Minerva Studio"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel optional>Titre / Poste</FieldLabel>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Ex: Fondateur & Directeur"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel optional>Courriel</FieldLabel>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alexandre@exemple.com"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel optional>Téléphone</FieldLabel>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="514 555-0100"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <FieldLabel optional>Secteur d&apos;activité</FieldLabel>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className={cn(inputClass, 'cursor-pointer appearance-none')}
              >
                <option value="">Sélectionner un secteur…</option>
                {SECTOR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <FieldLabel optional>URL de la photo de profil</FieldLabel>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <FieldLabel optional>Biographie / Présentation</FieldLabel>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio issue d'Instagram ou résumé du profil…"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Section Réseaux sociaux & Import Instagram ── */}
        <div className="border-t border-zinc-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-zinc-900">Réseaux sociaux & Web</h2>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-lg mb-3">
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
                {fetchingIg ? 'Importation…' : 'Actualiser depuis Instagram'}
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
              Cliquez sur « Actualiser » pour synchroniser automatiquement la photo, le nom, la bio et le site web.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Linkedin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                placeholder="LinkedIn"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className={cn(inputClass, 'pl-6')}
              />
            </div>
            <div className="relative">
              <Twitter className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                placeholder="X / Twitter"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className={cn(inputClass, 'pl-6')}
              />
            </div>
            <div className="relative">
              <Facebook className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                placeholder="Facebook"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                className={cn(inputClass, 'pl-6')}
              />
            </div>
            <div className="relative">
              <Globe className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                placeholder="Site web (https://...)"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={cn(inputClass, 'pl-6')}
              />
            </div>
          </div>
        </div>

        {/* ── Section Rencontre & Suivi ── */}
        <div className="border-t border-zinc-100 pt-3">
          <h2 className="text-xs font-bold text-zinc-900 mb-2">Contexte de rencontre & Suivi</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel optional>Événement</FieldLabel>
              <input
                type="text"
                placeholder="Ex: Conférence MTL Tech"
                value={metAtEvent}
                onChange={(e) => setMetAtEvent(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel optional>Lieu</FieldLabel>
              <div className="relative">
                <MapPin className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ex: Montréal"
                  value={metAtLocation}
                  onChange={(e) => setMetAtLocation(e.target.value)}
                  className={cn(inputClass, 'pl-6')}
                />
              </div>
            </div>
            <div>
              <FieldLabel optional>Date de rencontre</FieldLabel>
              <div className="relative">
                <CalendarDays className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={metAtDate}
                  onChange={(e) => setMetAtDate(e.target.value)}
                  className={cn(inputClass, 'pl-6')}
                />
              </div>
            </div>
            <div>
              <FieldLabel optional>Date du rappel</FieldLabel>
              <div className="relative">
                <Bell className="w-3 h-3 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className={cn(inputClass, 'pl-6')}
                />
              </div>
            </div>
            <div className="col-span-2">
              <FieldLabel optional>Note de relance / Opener (Message d&apos;accroche)</FieldLabel>
              <textarea
                rows={2}
                placeholder="Ex: Proposer un café pour discuter du projet vidéo mentionné…"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Section Questionnaire de Networking (Optionnel) ── */}
        <div className="border-t border-zinc-100 pt-3">
          <h2 className="text-xs font-bold text-zinc-900 mb-2">Détails de collaboration & Networking</h2>
          <div className="space-y-2">
            <div>
              <FieldLabel optional>Comment puis-je l&apos;aider ?</FieldLabel>
              <textarea
                rows={2}
                value={howCanIHelp}
                onChange={(e) => setHowCanIHelp(e.target.value)}
                placeholder="Ce que nous pouvons apporter à ce contact…"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors resize-none"
              />
            </div>
            <div>
              <FieldLabel optional>Son plus grand défi / problème</FieldLabel>
              <textarea
                rows={2}
                value={biggestProblem}
                onChange={(e) => setBiggestProblem(e.target.value)}
                placeholder="Les besoins ou freins identifiés…"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <FieldLabel optional>Ouvert à collaborer ?</FieldLabel>
                <select
                  value={openToCollaborate}
                  onChange={(e) => setOpenToCollaborate(e.target.value as any)}
                  className={cn(inputClass, 'cursor-pointer')}
                >
                  <option value="">Non spécifié</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
              <div>
                <FieldLabel optional>Moyen de contact préféré</FieldLabel>
                <select
                  value={preferredContactMethod}
                  onChange={(e) => setPreferredContactMethod(e.target.value)}
                  className={cn(inputClass, 'cursor-pointer')}
                >
                  <option value="">Non spécifié</option>
                  {CONTACT_PREFERRED_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Sidebar Récapitulatif & Actions (1/3 largeur) ── */}
      <div className="lg:sticky lg:top-4 border border-zinc-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar
            name={fullName || 'Contact'}
            src={avatarUrl || null}
            size="md"
            className="rounded-md shrink-0 ring-1 ring-zinc-200"
          />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-zinc-900 truncate">
              {fullName || 'Nom du contact'}
            </div>
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

        <div className="grid grid-cols-[75px_1fr] text-[11px] font-mono gap-y-1.5 text-zinc-600 border-t border-zinc-100 pt-3" style={MONO}>
          <span>Courriel</span>
          <span className="text-zinc-900 truncate">{email || '—'}</span>
          <span>Téléphone</span>
          <span className="text-zinc-900 truncate">{phone || '—'}</span>
          <span>Secteur</span>
          <span className="text-zinc-900 truncate">{sector || '—'}</span>
          <span>Statut</span>
          <span className="text-zinc-900 truncate">
            {CONTACT_STATUS_OPTIONS.find((s) => s.value === status)?.label || status}
          </span>
          <span>Rappel</span>
          <span className="text-zinc-900 truncate">
            {followUpDate
              ? `${new Date(followUpDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })} (${daysUntilFollowUp !== null && daysUntilFollowUp >= 0 ? `J+${daysUntilFollowUp}` : 'passé'})`
              : '—'}
          </span>
        </div>

        {followUpNote && (
          <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-md border border-amber-200/60 font-mono">
            <div className="font-semibold text-[10px] text-amber-800 uppercase mb-0.5">Opener prévu :</div>
            {followUpNote}
          </div>
        )}

        <div className="pt-2 space-y-1.5">
          <button
            type="button"
            onClick={() => router.push(`/contacts/${id}`)}
            className="h-8 w-full text-xs text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
          >
            Annuler (Échap)
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || !fullName.trim()}
            className="h-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? 'Enregistrement…' : 'Enregistrer (⌘ + Entrée)'}
          </button>
        </div>
      </div>
    </div>
  );
}
