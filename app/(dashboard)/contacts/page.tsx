'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Contact as ContactIcon, Search, Plus, AlertTriangle, Building2, ArrowRightLeft, Check, CheckCircle2 } from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { SkeletonRows } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ShareNetworkPanel } from '@/components/contacts/ShareNetworkPanel';
import { fetchContacts, updateContact } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { CONTACT_STATUS_OPTIONS, STALE_CONTACT_REMINDER_DAYS } from '@/lib/constants/contacts';
import type { Contact } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_MAP = Object.fromEntries(CONTACT_STATUS_OPTIONS.map((o) => [o.value, o]));

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function isFollowUpDue(contact: Contact): boolean {
  if (contact.status !== 'a_contacter') return false;
  if (contact.follow_up_date) return new Date(contact.follow_up_date).getTime() <= Date.now();
  // No follow-up date set -- fall back to age since creation, otherwise a
  // contact never manually scheduled is never flagged no matter how old.
  const staleThreshold = Date.now() - STALE_CONTACT_REMINDER_DAYS * 24 * 60 * 60 * 1000;
  return new Date(contact.created_at).getTime() <= staleThreshold;
}

export default function ContactsPage() {
  const { toastSuccess, toastError } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'due' | 'contacted' | 'converted'>('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setContacts(await fetchContacts());
      setLoading(false);
    })();
  }, []);

  const followUpsDue = contacts.filter(isFollowUpDue).length;
  const contactedCount = contacts.filter((c) => c.status === 'contacte').length;
  const convertedCount = contacts.filter((c) => c.converted_to_lead_id).length;

  const filtered = useMemo(() => {
    let result = contacts;
    if (filterMode === 'due') {
      result = result.filter(isFollowUpDue);
    } else if (filterMode === 'contacted') {
      result = result.filter((c) => c.status === 'contacte');
    } else if (filterMode === 'converted') {
      result = result.filter((c) => Boolean(c.converted_to_lead_id));
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.sector?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.instagram_url?.toLowerCase().includes(q) ||
        c.bio?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery, filterMode]);

  return (
    <PageFadeIn className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* ── Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <ContactIcon className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">Contacts & Réseau</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareNetworkPanel />
          <Link
            href="/contacts/new"
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Contact</span>
          </Link>
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-mv-border">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={cn(
              'px-3.5 py-2.5 h-16 flex flex-col justify-between text-left transition-colors cursor-pointer',
              filterMode === 'all' ? 'bg-zinc-100/70 font-semibold' : 'hover:bg-black/[0.015]'
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Tous les contacts</span>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {loading ? '—' : <AnimatedNumber value={contacts.length} />}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'due' ? 'all' : 'due')}
            className={cn(
              'px-3.5 py-2.5 h-16 flex flex-col justify-between text-left transition-colors cursor-pointer',
              filterMode === 'due' ? 'bg-red-50/70 font-semibold' : 'hover:bg-black/[0.015]'
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft flex items-center gap-1">
              Rappels dus {followUpsDue > 0 && <span className="w-2 h-2 rounded-full bg-mv-red animate-pulse" />}
            </span>
            <div className={cn('text-[20px] font-semibold tracking-tight leading-none', followUpsDue > 0 ? 'text-mv-red' : 'text-mv-ink')} style={MONO}>
              {loading ? '—' : followUpsDue}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'contacted' ? 'all' : 'contacted')}
            className={cn(
              'px-3.5 py-2.5 h-16 flex flex-col justify-between text-left transition-colors cursor-pointer',
              filterMode === 'contacted' ? 'bg-blue-50/70 font-semibold' : 'hover:bg-black/[0.015]'
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Contactés</span>
            <div className="text-[20px] font-semibold text-blue-700 tracking-tight leading-none" style={MONO}>
              {loading ? '—' : contactedCount}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode(filterMode === 'converted' ? 'all' : 'converted')}
            className={cn(
              'px-3.5 py-2.5 h-16 flex flex-col justify-between text-left transition-colors cursor-pointer',
              filterMode === 'converted' ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-black/[0.015]'
            )}
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Convertis en Lead</span>
            <div className="text-[20px] font-semibold text-mv-green tracking-tight leading-none" style={MONO}>
              {loading ? '—' : convertedCount}
            </div>
          </button>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un contact, compte Instagram, bio..."
            className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'due', 'contacted', 'converted'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={cn(
                'px-2.5 py-1 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer',
                filterMode === mode
                  ? 'bg-zinc-900 text-white'
                  : 'bg-mv-cream-soft border border-mv-border text-zinc-600 hover:bg-zinc-100'
              )}
            >
              {mode === 'all' && 'Tous'}
              {mode === 'due' && `À relancer (${followUpsDue})`}
              {mode === 'contacted' && `Contactés (${contactedCount})`}
              {mode === 'converted' && `Convertis (${convertedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <SkeletonRows count={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] py-12 text-center space-y-2">
          <p className="text-xs text-mv-ink-soft">
            {contacts.length === 0 ? 'Aucun contact pour le moment.' : 'Aucun contact ne correspond à cette recherche.'}
          </p>
          {contacts.length === 0 && (
            <Link href="/contacts/new" className="text-xs font-bold text-mv-green hover:underline">
              Ajouter le premier contact →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs divide-y divide-mv-border">
          {filtered.map((contact) => {
            const dueSoon = isFollowUpDue(contact);
            const statusInfo = STATUS_MAP[contact.status || 'a_contacter'];
            const isContacted = contact.status === 'contacte';
            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-black/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <UserAvatar src={contact.avatar_url} name={contact.full_name} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-mv-ink truncate">{contact.full_name}</span>
                      {statusInfo && <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>}
                      {contact.source === 'self_submitted' && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-mv-blue bg-mv-blue-bg px-1.5 py-0.5 rounded-full">
                          Auto-soumis
                        </span>
                      )}
                      {contact.converted_to_lead_id && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mv-green bg-mv-green-tint px-1.5 py-0.5 rounded-full">
                          <ArrowRightLeft className="w-2.5 h-2.5" /> Lead
                        </span>
                      )}
                      {dueSoon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-mv-red bg-mv-red-bg px-1.5 py-0.5 rounded-full">
                          <AlertTriangle className="w-2.5 h-2.5" /> Rappel dû
                        </span>
                      )}
                    </div>
                    {(contact.company || contact.role_title) && (
                      <div className="text-[11.5px] text-mv-ink-soft flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {[contact.role_title, contact.company].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-[11px] text-mv-ink-faint font-mono hidden sm:block" style={MONO}>
                    {contact.email || contact.phone || '—'}
                  </div>
                  {!isContacted && !contact.converted_to_lead_id ? (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContacts((prev) =>
                          prev.map((c) => (c.id === contact.id ? { ...c, status: 'contacte' } : c))
                        );
                        const ok = await updateContact(contact.id, { status: 'contacte' });
                        if (ok) {
                          toastSuccess('Contact mis à jour', `${contact.full_name} est désormais marqué comme contacté.`);
                        } else {
                          toastError('Erreur', 'Impossible de mettre à jour le statut.');
                        }
                      }}
                      className="h-6 px-2 text-[10.5px] font-mono font-medium rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      title="Marquer comme contacté"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Marquer contacté</span>
                    </button>
                  ) : isContacted ? (
                    <span className="h-6 px-2 text-[10.5px] font-mono font-medium rounded border border-zinc-200 bg-zinc-50 text-zinc-600 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-zinc-400" />
                      <span>Contacté</span>
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}
