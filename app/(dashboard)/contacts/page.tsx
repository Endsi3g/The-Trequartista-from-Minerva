'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Contact as ContactIcon, Search, Plus, AlertTriangle, Building2, ArrowRightLeft } from 'lucide-react';
import { PageFadeIn } from '@/components/ui/page-transition';
import { SkeletonRows } from '@/components/ui/skeleton';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { fetchContacts } from '@/lib/services/supabase-data';
import type { Contact } from '@/lib/types';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

function isFollowUpDue(contact: Contact): boolean {
  if (!contact.follow_up_date) return false;
  return new Date(contact.follow_up_date).getTime() <= Date.now();
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setContacts(await fetchContacts());
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.sector?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const followUpsDue = contacts.filter(isFollowUpDue).length;
  const convertedCount = contacts.filter((c) => c.converted_to_lead_id).length;

  return (
    <PageFadeIn className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* ── Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <ContactIcon className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">Contacts</h1>
        </div>
        <Link
          href="/contacts/new"
          className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau Contact</span>
        </Link>
      </div>

      {/* ── KPI Ribbon ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
        <div className="grid grid-cols-3 divide-x divide-mv-border">
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Contacts</span>
            <div className="text-[20px] font-semibold text-mv-ink tracking-tight leading-none" style={MONO}>
              {loading ? '—' : <AnimatedNumber value={contacts.length} />}
            </div>
          </div>
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Rappels dus</span>
            <div className={cn('text-[20px] font-semibold tracking-tight leading-none', followUpsDue > 0 ? 'text-mv-red' : 'text-mv-ink')} style={MONO}>
              {loading ? '—' : followUpsDue}
            </div>
          </div>
          <div className="px-3.5 py-2.5 h-16 flex flex-col justify-between hover:bg-black/[0.015] transition-colors">
            <span className="text-[11px] font-medium uppercase tracking-wider text-mv-ink-soft">Convertis en Lead</span>
            <div className="text-[20px] font-semibold text-mv-green tracking-tight leading-none" style={MONO}>
              {loading ? '—' : convertedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Toolbar ── */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un contact, une entreprise..."
          className="w-full h-7 pl-7 pr-2 text-[11.5px] rounded-[4px] border border-mv-border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-mv-green transition-colors"
        />
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
            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-black/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-mv-ink truncate">{contact.full_name}</span>
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
                <div className="text-[11px] text-mv-ink-faint font-mono shrink-0" style={MONO}>
                  {contact.email || contact.phone || '—'}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageFadeIn>
  );
}
