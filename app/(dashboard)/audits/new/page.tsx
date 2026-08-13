'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createAudit, updateAudit, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/lib/types';

export default function NewAuditPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [prospectName, setProspectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    fetchClients().then(setClients);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      toastError('Erreur', 'Session expirée.');
      return;
    }

    const audit = await createAudit({
      prospect_name: prospectName,
      client_id: clientId || null,
      created_by: user.id,
    });

    if (!audit) {
      setSaving(false);
      toastError('Erreur', "Impossible de créer l'audit.");
      return;
    }

    if (transcript.trim()) {
      await updateAudit(audit.id, {
        transcript_raw: transcript,
        transcript_source: 'manual_paste',
        status: 'transcript_ready',
      });
    }

    setSaving(false);
    router.push(`/audits/${audit.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/audits" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux audits
      </Link>

      <h1 className="text-2xl font-extrabold text-mv-ink tracking-tight font-display">Nouvel Audit</h1>

      <Card>
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-mv-ink">Nom du prospect / de l'entreprise</label>
            <input
              type="text"
              required
              placeholder="Ex: Toitures Beauchemin"
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
            />
          </div>

          <div>
            <label className="font-bold text-mv-ink">Client existant (optionnel)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="">Aucun -- prospect pas encore client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-mv-ink">Transcription de l'appel (optionnel -- peut être collée plus tard)</label>
            <textarea
              rows={10}
              placeholder="Collez la transcription complète de l'appel de diagnostic ici…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink font-mono text-[11px] focus:outline-none focus:border-mv-green"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
            <Link href="/audits">
              <Button variant="outline" size="sm" type="button">Annuler</Button>
            </Link>
            <Button variant="primary" size="sm" type="submit" disabled={saving}>
              {saving ? 'Création…' : "Créer l'audit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
