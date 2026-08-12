'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { addLead } from '@/lib/services/supabase-data';

export default function NewLeadPage() {
  const router = useRouter();
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

    await addLead({
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
    router.push('/leads');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/leads" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux leads
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Lead CRM</h1>

      <Card>
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Nom de l&apos;entreprise</label>
            <input
              type="text"
              placeholder="ex: Apex Roofing Studio"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">Nom Contact</label>
              <input
                type="text"
                placeholder="Jean Dupont"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">Email Contact</label>
              <input
                type="email"
                required
                placeholder="jean@apex.com"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-mv-ink">Service demandé</label>
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">MRR Estimé ($)</label>
              <input
                type="number"
                value={newMrr}
                onChange={(e) => setNewMrr(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-mv-ink">Frais de démarrage ($)</label>
              <input
                type="number"
                value={newOneTime}
                onChange={(e) => setNewOneTime(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-mv-cream-soft border border-mv-border rounded-xl text-xs text-mv-ink focus:ring-2 focus:ring-mv-green/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-mv-border flex justify-end gap-3">
            <Link
              href="/leads"
              className="px-4 py-2 bg-mv-cream-soft border border-mv-border text-xs font-bold rounded-xl text-mv-ink hover:bg-mv-border/40 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-mv-green hover:bg-mv-green-dark text-white text-xs font-bold rounded-xl shadow-mv-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Création…' : 'Créer Lead'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
