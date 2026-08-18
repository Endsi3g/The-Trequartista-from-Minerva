'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowLeft, Building2, FileText, Sparkles, Utensils } from 'lucide-react';
import { createAudit, updateAudit, fetchClients } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { RestaurantMarginAuditCard } from '@/components/audits/RestaurantMarginAuditCard';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/lib/types';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-extrabold text-mv-ink-soft uppercase tracking-widest mb-3">{children}</h2>;
}

export default function NewAuditPage() {
  const router = useRouter();
  const { toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [prospectName, setProspectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [activeAuditType, setActiveAuditType] = useState<'transcript' | 'restaurant'>('transcript');

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

  const client = clients.find((c) => c.id === clientId);
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/audits" className="text-xs font-semibold text-mv-green hover:underline flex items-center gap-1.5 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Retour aux audits
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">Nouvel Audit</h1>
          <p className="text-sm text-mv-ink-soft mt-1">Sélectionnez le modèle d'audit ou lancez un diagnostic de fuite de marge.</p>
        </div>

        {/* Audit Type Segmented Switcher */}
        <div className="inline-flex p-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveAuditType('transcript')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeAuditType === 'transcript'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-600" />
            <span>Audit Standard (Transcription)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveAuditType('restaurant')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeAuditType === 'restaurant'
                ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit Restauration & Marge</span>
          </button>
        </div>
      </div>

      {activeAuditType === 'restaurant' ? (
        <RestaurantMarginAuditCard />
      ) : (
        <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-6">
          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
            <SectionLabel>Prospect</SectionLabel>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Nom du prospect / de l&apos;entreprise</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-mv-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Toitures Beauchemin"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-mv-ink mb-1.5">Client existant (optionnel)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-mv-cream-soft border border-mv-border text-sm text-mv-ink focus:outline-none focus:border-mv-green transition-colors cursor-pointer"
              >
                <option value="">Aucun — prospect pas encore client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Transcription de l&apos;appel</SectionLabel>
              {wordCount > 0 && <span className="text-[11px] text-mv-ink-faint font-mono">{wordCount} mots</span>}
            </div>
            <p className="text-[11px] text-mv-ink-soft -mt-2">Optionnel — peut être collée plus tard depuis la fiche de l&apos;audit.</p>
            <textarea
              rows={12}
              placeholder="Collez la transcription complète de l'appel de diagnostic ici…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full rounded-xl bg-mv-cream-soft border border-mv-border p-3.5 text-mv-ink font-mono text-[11px] leading-relaxed focus:outline-none focus:border-mv-green transition-colors resize-y"
            />
          </div>

          <div className="flex gap-3">
            <Link href="/audits" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Annuler</Button>
            </Link>
            <Button type="submit" variant="primary" className="flex-1" disabled={saving}>
              {saving ? 'Création…' : "Créer l'audit"}
            </Button>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 bg-mv-surface border border-mv-border rounded-2xl p-6 shadow-mv-sm space-y-4">
          <SectionLabel>Aperçu</SectionLabel>
          <div className="bg-mv-cream-soft border border-mv-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={prospectName || 'Prospect'} src={client?.logo_url} size="lg" shape="rounded" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-mv-ink truncate">{prospectName || 'Nom du prospect'}</div>
                <div className="text-[11px] text-mv-ink-soft truncate">{client?.name || 'Prospect externe'}</div>
              </div>
            </div>
            <div className="pt-3 border-t border-mv-border flex items-center justify-between">
              <span className="text-[11px] text-mv-ink-soft">Transcription</span>
              <span className="text-xs font-semibold text-mv-ink">{wordCount > 0 ? `${wordCount} mots` : 'Aucune'}</span>
            </div>
            <Badge variant={transcript.trim() ? 'green' : 'neutral'}>
              {transcript.trim() ? 'Transcription prête' : 'En attente de transcription'}
            </Badge>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-mv-ink-faint leading-relaxed">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            L&apos;audit IA extraira les points de friction, coûts cachés et compatibilité d&apos;outils dès qu&apos;une transcription sera disponible.
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
