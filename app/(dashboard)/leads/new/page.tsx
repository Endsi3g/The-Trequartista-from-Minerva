'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, Building2, Mail, User as UserIcon, DollarSign, Sparkles } from 'lucide-react';
import { addLead } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';

const SERVICE_SUGGESTIONS = [
  'Gestion Réseaux & Reels',
  'Refonte Site Web',
  'SEO & Google My Business',
  'Publicité Meta & Google',
  'Stratégie de contenu complète',
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewLeadPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [newCompanyName, setNewCompanyName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newService, setNewService] = useState('Gestion Réseaux & Reels');
  const [newMrr, setNewMrr] = useState<number>(1500);
  const [newOneTime, setNewOneTime] = useState<number>(500);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactEmail.trim()) return;
    setSaving(true);

    const lead = await addLead({
      client_name: newCompanyName || newContactName,
      company_name: newCompanyName,
      contact_name: newContactName || newContactEmail.split('@')[0],
      contact_email: newContactEmail.trim(),
      service_requested: newService,
      score_grade: 'A',
      status: 'Nouveau',
      stage: 'nouveau',
      mrr_value: newMrr,
      one_time_value: newOneTime,
      probability_pct: 10,
      notes: [],
    });

    setSaving(false);

    if (!lead) {
      toastError('Erreur', 'Impossible de créer ce lead. Réessayez.');
      return;
    }

    // Fire-and-forget: notify the team's subscribed devices. A missing
    // VAPID config or a failed send should never block lead creation.
    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Nouveau lead',
        body: `${lead.company_name || lead.contact_name} vient d'entrer dans le pipeline.`,
        url: '/leads',
        preferenceKey: 'new_leads_enabled',
      }),
    }).catch(() => {});

    router.push('/leads');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
      </Link>

      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Lead</h1>
        <p className="text-sm text-mv-ink-soft mt-1">Ajoute une opportunité au pipeline CRM.</p>
      </div>

      <form onSubmit={handleCreateLead} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left: sectioned form */}
        <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Entreprise & contact</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom de l&apos;entreprise</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Apex Roofing Studio"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du contact</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Jean Dupont"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Courriel du contact</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="jean@apex.com"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Service demandé</SectionLabel>
            <div>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  list="service-suggestions"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
                <datalist id="service-suggestions">
                  {SERVICE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Valeur estimée</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">MRR estimé (CAD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={newMrr}
                    onChange={(e) => setNewMrr(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-mv-ink mb-1.5">Frais de démarrage (CAD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={newOneTime}
                    onChange={(e) => setNewOneTime(Number(e.target.value))}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink font-mono focus:outline-none focus:border-mv-green transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href="/leads" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Création…' : 'Créer le lead'}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={newCompanyName || newContactName || 'Nouveau lead'} size="lg" shape="rounded" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-mv-ink truncate">{newCompanyName || 'Nom de l’entreprise'}</div>
                <div className="text-[11px] text-mv-ink-soft truncate">{newContactName || 'Contact à définir'}</div>
              </div>
              <span className="ml-auto inline-flex items-center justify-center w-6 h-6 rounded-full bg-mv-green-tint text-mv-green text-[11px] font-bold border border-mv-green/30 shrink-0">
                A
              </span>
            </div>
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Service</span>
              <span className="text-xs font-semibold text-mv-ink text-right truncate max-w-[160px]">{newService}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">MRR estimé</span>
              <span className="font-mono font-bold text-mv-green text-sm">{newMrr.toLocaleString('fr-CA')} $</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Frais de démarrage</span>
              <span className="font-mono font-semibold text-mv-ink text-sm">{newOneTime.toLocaleString('fr-CA')} $</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border bg-mv-blue-bg text-mv-blue border-mv-blue/30">
              <span className="w-1.5 h-1.5 rounded-full bg-mv-blue" /> Nouveau
            </span>
          </div>
          <p className="text-[11px] text-mv-ink-faint leading-relaxed">
            Voici comment ce lead apparaîtra dans le pipeline une fois créé.
          </p>
        </div>
      </form>
    </div>
  );
}
