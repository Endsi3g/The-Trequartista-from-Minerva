'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { addClient } from '@/lib/services/supabase-data';

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [mrr, setMrr] = useState(3000);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

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
      logo_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=150&auto=format&fit=crop&q=80',
    });

    setSaving(false);
    if (newClient) {
      router.push('/clients');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Link href="/clients" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux clients
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouveau Client</h1>

      <Card>
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-mv-ink mb-1">Nom du Client</label>
            <input
              type="text"
              required
              placeholder="Ex: Apex Roofing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div>
            <label className="block font-bold text-mv-ink mb-1">Secteur d'Activité</label>
            <input
              type="text"
              required
              placeholder="Ex: Bâtiment & Toiture"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-mv-ink mb-1">MRR ($)</label>
              <input
                type="number"
                required
                value={mrr}
                onChange={(e) => setMrr(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <div>
              <label className="block font-bold text-mv-ink mb-1">Contact Nom</label>
              <input
                type="text"
                placeholder="David Miller"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-mv-ink mb-1">Contact Email</label>
            <input
              type="email"
              placeholder="david@client.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-mv-cream-soft border border-mv-border text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <Link href="/clients" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Annuler
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
