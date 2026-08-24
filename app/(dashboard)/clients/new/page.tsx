'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, Building2, UploadCloud, Loader2, X, Mail, User as UserIcon, DollarSign, Phone, Globe, Instagram, Facebook, Linkedin, MapPin, Home, CalendarDays, Package, UserCog } from 'lucide-react';
import { addClient, fetchTeamMembers } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { TeamMemberSummary } from '@/lib/types';

const INDUSTRY_SUGGESTIONS = [
  'Bâtiment & Rénovation',
  'Immobilier',
  'Santé & Bien-être',
  'Restauration',
  'Commerce de détail',
  'Services professionnels',
  'Automobile',
];

// Mirrors SERVICE_PACKAGE_TEMPLATES in projects/[id]/roadmap/page.tsx --
// same 5 packages, kept as plain labels here since this page doesn't need
// the milestone-generation phases, just the name for the client's fiche.
const SERVICE_PACKAGES = [
  'Framer Web Design',
  'Acquisition & Ads LeadGen',
  'Growth & Social Reels',
  'SEO Local & Fiche GMB',
  'Audit & Conseil IA',
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewClientPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [mrr, setMrr] = useState(3000);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [servicePackage, setServicePackage] = useState('');
  const [accountManagerId, setAccountManagerId] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);

  useEffect(() => {
    fetchTeamMembers().then(setTeamMembers);
  }, []);

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const filePath = `client-logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await supabase.storage.from('client-assets').upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) {
        toastError('Erreur', "Impossible de téléverser le logo.");
        return;
      }
      const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath);
      setLogoUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !industry) return;
    setSaving(true);

    const newClient = await addClient({
      name,
      industry,
      status: 'Active',
      mrr: Number(mrr),
      health_status: 'Ready',
      contact_name: contactName || 'Contact Principal',
      contact_email: contactEmail || 'contact@client.com',
      contact_phone: contactPhone || undefined,
      website_url: websiteUrl || undefined,
      google_business_url: googleBusinessUrl || undefined,
      instagram_url: instagramUrl || undefined,
      facebook_url: facebookUrl || undefined,
      linkedin_url: linkedinUrl || undefined,
      logo_url: logoUrl,
      address: address || undefined,
      contract_start_date: contractStartDate || undefined,
      service_package: servicePackage || undefined,
      account_manager_id: accountManagerId || undefined,
    });

    setSaving(false);
    if (newClient) {
      router.push('/clients');
    } else {
      toastError('Erreur', "Impossible de créer ce client. Réessayez.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/clients" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux clients
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Client</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Crée une fiche client et son suivi MRR.</p>
      </div>

      <form onSubmit={handleCreateClient} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left: sectioned form */}
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-5">
            <SectionLabel>Identité</SectionLabel>

            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <UserAvatar src={logoUrl} name={name || 'Client'} size="2xl" shape="rounded" />
                <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-mv-green text-white flex items-center justify-center shadow-mv-sm cursor-pointer hover:bg-mv-green-dark transition-colors">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-mv-ink/80 text-white flex items-center justify-center hover:bg-mv-ink cursor-pointer"
                    title="Retirer le logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du client</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apex Toiture"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Secteur d&apos;activité</label>
                  <input
                    type="text"
                    required
                    list="industry-suggestions"
                    placeholder="Ex: Bâtiment & Toiture"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                  <datalist id="industry-suggestions">
                    {INDUSTRY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-mv-ink mb-1.5">Adresse d&apos;affaires</label>
                  <div className="relative">
                    <Home className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="123 rue Principale, Montréal, QC"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Contrat</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">MRR mensuel (CAD)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  value={mrr}
                  onChange={(e) => setMrr(Number(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
              <p className="text-[10.5px] text-mv-ink-faint mt-1.5">Le suivi de l&apos;évolution du MRR se fait ensuite depuis la fiche client.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Forfait de service</label>
                <div className="relative">
                  <Package className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={servicePackage}
                    onChange={(e) => setServicePackage(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">Aucun</option>
                    {SERVICE_PACKAGES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Début du contrat</label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Responsable de compte</label>
              <div className="relative">
                <UserCog className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={accountManagerId}
                  onChange={(e) => setAccountManagerId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer appearance-none"
                >
                  <option value="">Non assigné</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Contact principal</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="David Miller"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Courriel</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="david@client.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="514 555-0100"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Présence web &amp; réseaux (optionnel)</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Site web</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://client.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Fiche Google Business</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://g.page/…"
                    value={googleBusinessUrl}
                    onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Instagram</label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://instagram.com/…"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Facebook</label>
                <div className="relative">
                  <Facebook className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://facebook.com/…"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">LinkedIn</label>
                <div className="relative">
                  <Linkedin className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://linkedin.com/company/…"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/clients" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Créer le client'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar src={logoUrl} name={name || 'Nouveau client'} size="lg" shape="rounded" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-mv-ink truncate">{name || 'Nom du client'}</div>
                <div className="text-[11px] text-mv-ink-soft truncate">
                  <Building2 className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {industry || 'Secteur d’activité'}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">MRR mensuel</span>
              <span className="font-mono font-bold text-mv-green text-sm">{mrr.toLocaleString('fr-CA')} $</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Contact</span>
              <span className="text-xs font-semibold text-mv-ink text-right">
                {contactName || 'À définir'}
              </span>
            </div>
            {servicePackage && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Forfait</span>
                <span className="text-xs font-semibold text-mv-ink text-right truncate max-w-[160px]">{servicePackage}</span>
              </div>
            )}
            {accountManagerId && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-mv-ink-soft">Responsable</span>
                <span className="text-xs font-semibold text-mv-ink text-right">
                  {teamMembers.find((m) => m.id === accountManagerId)?.full_name || '—'}
                </span>
              </div>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border bg-mv-green-tint text-mv-green border-mv-green/30">
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green" /> Active
            </span>
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment cette fiche apparaîtra dans votre répertoire clients une fois créée.
          </p>
        </div>
      </form>
    </div>
  );
}
