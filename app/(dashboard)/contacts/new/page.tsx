'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Building2,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { addContact } from '@/lib/services/supabase-data';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/providers/ToastProvider';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/contacts" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux contacts
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Contact</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Ajoutez une personne rencontrée à votre carnet de relations.</p>
      </div>

      <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Identité</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom complet</label>
              <div className="relative">
                <User className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Marie Tremblay"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Entreprise</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Poste</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Secteur</label>
                <input
                  type="text"
                  placeholder="Restauration, tech, immobilier…"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Courriel</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  placeholder="514 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Réseaux sociaux (optionnel)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">LinkedIn</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" placeholder="https://linkedin.com/in/…" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Instagram</label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" placeholder="https://instagram.com/…" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Twitter / X</label>
                <div className="relative">
                  <Twitter className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" placeholder="https://x.com/…" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Facebook</label>
                <div className="relative">
                  <Facebook className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" placeholder="https://facebook.com/…" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Site web</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="url" placeholder="https://…" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Contexte de rencontre</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Événement</label>
                <input type="text" placeholder="Ex: Salon Restaurants Québec" value={metAtEvent} onChange={(e) => setMetAtEvent(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Lieu</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input type="text" value={metAtLocation} onChange={(e) => setMetAtLocation(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Date de la rencontre</label>
              <div className="relative">
                <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="date" value={metAtDate} onChange={(e) => setMetAtDate(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Rappel de suivi (optionnel)</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Date du rappel</label>
              <div className="relative">
                <Bell className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Note du rappel</label>
              <textarea
                rows={2}
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="Relancer pour proposer une démo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/contacts" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer le contact'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={fullName || 'Contact'} size="lg" shape="rounded" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-mv-ink truncate">{fullName || 'Nom du contact'}</div>
                <div className="text-[11px] text-mv-ink-soft truncate">
                  {[roleTitle, company].filter(Boolean).join(' · ') || 'Poste · Entreprise'}
                </div>
              </div>
            </div>
            {metAtEvent && (
              <div className="pt-3 border-t border-mv-border flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Rencontré à</span>
                <span className="text-xs font-semibold text-mv-ink truncate max-w-[160px]">{metAtEvent}</span>
              </div>
            )}
            {followUpDate && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Rappel</span>
                <span className="text-xs font-semibold text-mv-ink">
                  {new Date(followUpDate + 'T00:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment ce contact apparaîtra une fois créé. Vous pourrez lui envoyer un SMS ou un courriel, et le convertir en lead depuis sa fiche.
          </p>
        </div>
      </form>
    </div>
  );
}
