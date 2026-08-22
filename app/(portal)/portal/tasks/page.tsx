'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  Send,
  AlertCircle,
  FileText,
  Play,
  Figma,
  Globe,
  Sliders,
  ChevronRight,
  LayoutGrid,
  List,
  Calendar,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchClientWorkItems,
  approveClientWorkItem,
  requestClientWorkItemRevision,
  fetchClientActivityLogs,
} from '@/lib/services/supabase-data';
import type { ClientWorkItem, ClientActivityLog, Client } from '@/lib/types';
import { PageFadeIn } from '@/components/ui/page-transition';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };

type ViewMode = 'kanban' | 'list';
type CategoryFilter = 'all' | 'Design & UX' | 'Développement' | 'SEO & Ads' | 'Contenu Vidéo' | 'Automation & IA';

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Toutes les catégories' },
  { id: 'Design & UX', label: '🎨 Design & UX' },
  { id: 'Développement', label: '💻 Développement' },
  { id: 'Contenu Vidéo', label: '🎬 Vidéo & Reels' },
  { id: 'SEO & Ads', label: '🚀 SEO & Ads' },
  { id: 'Automation & IA', label: '⚡ Automation & IA' },
];

export default function PortalTasksPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [noClientLinked, setNoClientLinked] = useState(false);
  const [items, setItems] = useState<ClientWorkItem[]>([]);
  const [logs, setLogs] = useState<ClientActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  // Interactive revision modal
  const [revisionItem, setRevisionItem] = useState<ClientWorkItem | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Success toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).maybeSingle();
      if (!profile?.client_id) {
        setNoClientLinked(true);
        setLoading(false);
        return;
      }
      const currentClientId = profile.client_id;
      setClientId(currentClientId);

      const { data: clientData } = await supabase.from('clients').select('*').eq('id', currentClientId).maybeSingle();
      setClient(clientData as Client);

      const [workItems, activityLogs] = await Promise.all([
        fetchClientWorkItems(currentClientId),
        fetchClientActivityLogs(currentClientId),
      ]);

      setItems(workItems);
      setLogs(activityLogs);
      setLoading(false);
    })();
  }, []);

  // Supabase Realtime channel subscription for instant status sync -- both
  // work items AND the activity feed, so the "Synchronisation temps réel
  // active" badge below is actually true instead of decorative.
  useEffect(() => {
    if (!clientId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`portal-tasks-realtime-${clientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `client_id=eq.${clientId}` },
        async () => {
          const updated = await fetchClientWorkItems(clientId);
          setItems(updated);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'client_activity_log', filter: `client_id=eq.${clientId}` },
        async () => {
          const updated = await fetchClientActivityLogs(clientId);
          setLogs(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (categoryFilter === 'all') return items;
    return items.filter((it) => it.category === categoryFilter);
  }, [items, categoryFilter]);

  // Metric stats
  const stats = useMemo(() => {
    const total = items.length || 1;
    const done = items.filter((i) => i.status === 'done').length;
    const inReview = items.filter((i) => i.status === 'in_review').length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const pct = Math.round((done / total) * 100);
    return { total, done, inReview, inProgress, pct };
  }, [items]);

  // Handle client approval -- optimistic on the work item itself (cheap to
  // revert), but the activity log is only updated from the real DB row
  // (via fetchClientActivityLogs / the realtime subscription above), never
  // a locally-fabricated entry.
  const handleApprove = async (item: ClientWorkItem) => {
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, status: 'done', client_feedback: 'Validé par le client' } : it))
    );

    const ok = await approveClientWorkItem(item.id, clientId, item.title, client?.name || 'Client');
    if (!ok) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      setActionNotice(`Erreur : « ${item.title} » n’a pas pu être validé. Réessayez.`);
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }
    setActionNotice(`Livrable « ${item.title} » validé avec succès.`);
    setTimeout(() => setActionNotice(null), 4000);
    setLogs(await fetchClientActivityLogs(clientId));
  };

  // Handle revision request submission
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionItem || !revisionFeedback.trim() || submittingRevision) return;

    const feedbackText = revisionFeedback.trim();
    const targetItem = revisionItem;
    setSubmittingRevision(true);

    setItems((prev) =>
      prev.map((it) =>
        it.id === targetItem.id
          ? { ...it, status: 'in_progress', client_feedback: feedbackText }
          : it
      )
    );

    const ok = await requestClientWorkItemRevision(targetItem.id, clientId, feedbackText, targetItem.title, client?.name || 'Client');
    if (ok) {
      setActionNotice(`Ajustement transmis à l’équipe Minerva pour « ${targetItem.title} ».`);
      setLogs(await fetchClientActivityLogs(clientId));
    } else {
      setItems((prev) => prev.map((it) => (it.id === targetItem.id ? targetItem : it)));
      setActionNotice(`Erreur : l’ajustement n’a pas pu être transmis. Réessayez.`);
    }
    setTimeout(() => setActionNotice(null), 4000);

    setSubmittingRevision(false);
    setRevisionItem(null);
    setRevisionFeedback('');
  };

  const getDeliverableIcon = (type?: string | null) => {
    switch (type) {
      case 'figma':
        return <Figma className="w-3.5 h-3.5 text-purple-600" />;
      case 'framer':
        return <Globe className="w-3.5 h-3.5 text-blue-600" />;
      case 'video':
        return <Play className="w-3.5 h-3.5 text-rose-600" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getDeliverableLabel = (type?: string | null) => {
    switch (type) {
      case 'figma':
        return 'Maquette Figma';
      case 'framer':
        return 'Prototype Framer';
      case 'video':
        return 'Vidéo Reel 4K';
      case 'pdf':
        return 'Document PDF';
      default:
        return 'Livrable en ligne';
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-zinc-400 font-mono">Chargement des livrables et tâches…</div>;
  }

  if (noClientLinked) {
    return (
      <div className="py-20 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
        <p className="text-sm font-semibold text-zinc-800">Aucun compte client associé</p>
        <p className="text-xs text-zinc-500">Contactez votre équipe Minerva pour lier votre accès à votre dossier client.</p>
      </div>
    );
  }

  return (
    <PageFadeIn className="space-y-4 pb-16">
      {/* ── 1. Header Context with Live Production Status ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium mb-0.5">
            <Link href="/portal" className="hover:text-zinc-900 transition-colors">
              Portail
            </Link>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">{client?.name || 'Votre entreprise'}</span>
            <span>/</span>
            <span className="text-emerald-700 font-semibold">⚡ Avancement & Livrables</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-semibold text-zinc-900">
              Travail en cours & Approbation des livrables
            </h1>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shrink-0" style={MONO}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Production Continue</span>
            </span>
          </div>
        </div>

        {/* View Switcher (Kanban vs Liste) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60 h-7 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-2.5 py-0.5 rounded flex items-center gap-1.5 transition-all cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Tableau Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-2.5 py-0.5 rounded flex items-center gap-1.5 transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <List className="w-3 h-3" />
              <span>Liste & Jalons</span>
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center space-y-1.5">
          <FileText className="w-6 h-6 text-zinc-300 mx-auto" />
          <p className="text-sm font-semibold text-zinc-700">Aucun travail en cours pour l’instant</p>
          <p className="text-xs text-zinc-400">Les tâches liées à votre projet apparaîtront ici dès que l’équipe Minerva les aura créées.</p>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-emerald-900 text-white text-xs px-3.5 py-2 rounded-lg flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-300 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 2. Progress Ribbon & Category Filter Pills ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-zinc-400" style={MONO}>Progression globale</div>
            <div className="text-base font-bold font-mono text-zinc-900 flex items-center gap-2" style={MONO}>
              <span>{stats.pct}%</span>
              <div className="flex-1 bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.pct}%` }} />
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-amber-50/50 border border-amber-200/60 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-amber-700 font-semibold" style={MONO}>À votre validation</div>
            <div className="text-base font-bold font-mono text-amber-900" style={MONO}>
              {stats.inReview} livrable{stats.inReview > 1 ? 's' : ''} prêt{stats.inReview > 1 ? 's' : ''}
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/60 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-zinc-400" style={MONO}>En cours d'exécution</div>
            <div className="text-base font-bold font-mono text-zinc-900" style={MONO}>
              {stats.inProgress} tâche active
            </div>
          </div>

          <div className="p-2.5 rounded-md bg-emerald-50/40 border border-emerald-200/60 space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-emerald-700 font-semibold" style={MONO}>Complétés & validés</div>
            <div className="text-base font-bold font-mono text-emerald-800" style={MONO}>
              {stats.done} / {stats.total} jalons
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-zinc-100 text-xs">
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Catégorie :
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                'h-6 px-2 text-[11px] rounded transition-all cursor-pointer whitespace-nowrap font-medium',
                categoryFilter === cat.id
                  ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                  : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Main Split View: Kanban/List + Live Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Column (3/4): Kanban or List View */}
        <div className="lg:col-span-3 space-y-4">
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-start">
              {/* Column 1: À faire */}
              <div className="bg-zinc-100/70 border border-zinc-200 rounded-lg p-2.5 space-y-2.5 min-h-[380px]">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-zinc-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                    <span className="text-[11.5px] font-semibold text-zinc-700">À faire</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-zinc-200 text-zinc-500" style={MONO}>
                    {filteredItems.filter((i) => i.status === 'todo').length}
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredItems
                    .filter((i) => i.status === 'todo')
                    .map((item) => (
                      <div key={item.id} className="bg-white border border-zinc-200 rounded-md p-3 shadow-2xs space-y-2 hover:border-zinc-300 transition-colors">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-zinc-400" style={MONO}>{item.category}</span>
                          {item.due_date && (
                            <span className="font-mono text-zinc-500 flex items-center gap-1" style={MONO}>
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              {item.due_date}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-900 leading-snug">{item.title}</h4>
                        {item.description && <p className="text-[11px] text-zinc-500 leading-relaxed">{item.description}</p>}
                        <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10.5px] text-zinc-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-zinc-400" />
                            <span>{item.assignee_name}</span>
                          </span>
                          <span className="text-zinc-400">Planifié</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 2: En cours */}
              <div className="bg-blue-50/30 border border-blue-200/60 rounded-lg p-2.5 space-y-2.5 min-h-[380px]">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-blue-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11.5px] font-semibold text-blue-900">En cours de production</span>
                  </div>
                  <span className="text-[10px] font-mono bg-white px-1.5 py-0.2 rounded border border-blue-200 text-blue-700 font-bold" style={MONO}>
                    {filteredItems.filter((i) => i.status === 'in_progress').length}
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredItems
                    .filter((i) => i.status === 'in_progress')
                    .map((item) => (
                      <div key={item.id} className="bg-white border border-blue-200/80 rounded-md p-3 shadow-2xs space-y-2 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            {item.category}
                          </span>
                          {item.due_date && (
                            <span className="font-mono text-zinc-500 flex items-center gap-1" style={MONO}>
                              <Clock className="w-3 h-3 text-blue-500" />
                              {item.due_date}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-900 leading-snug">{item.title}</h4>
                        {item.description && <p className="text-[11px] text-zinc-500 leading-relaxed">{item.description}</p>}

                        {item.deliverable_url && (
                          <div className="pt-1">
                            <a
                              href={item.deliverable_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-medium text-blue-700 hover:underline flex items-center gap-1"
                            >
                              {getDeliverableIcon(item.deliverable_type)}
                              <span>Aperçu du travail en cours ({getDeliverableLabel(item.deliverable_type)})</span>
                            </a>
                          </div>
                        )}

                        <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10.5px]">
                          <span className="flex items-center gap-1 text-zinc-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span>{item.assignee_name}</span>
                          </span>
                          <span className="text-[9.5px] font-mono text-blue-600 font-bold" style={MONO}>Actif</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 3: En attente de validation client (Highlighted) */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-lg p-2.5 space-y-2.5 min-h-[380px]">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-amber-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-[11.5px] font-bold text-amber-950">⚠️ Votre validation</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded" style={MONO}>
                    {filteredItems.filter((i) => i.status === 'in_review').length}
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredItems
                    .filter((i) => i.status === 'in_review')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border-2 border-amber-300 rounded-md p-3 shadow-xs space-y-2.5 hover:border-amber-400 transition-all"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">
                            {item.category}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Livrable Prêt
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-zinc-900 leading-snug">{item.title}</h4>
                          {item.description && <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{item.description}</p>}
                        </div>

                        {/* Deliverable preview link */}
                        {item.deliverable_url && (
                          <div className="p-2 rounded bg-zinc-50 border border-zinc-200">
                            <a
                              href={item.deliverable_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-zinc-900 hover:text-emerald-700 flex items-center justify-between gap-1 group"
                            >
                              <span className="flex items-center gap-1.5">
                                {getDeliverableIcon(item.deliverable_type)}
                                <span>{getDeliverableLabel(item.deliverable_type)}</span>
                              </span>
                              <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-emerald-600" />
                            </a>
                          </div>
                        )}

                        {/* Interactive Client Action Buttons */}
                        <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(item)}
                            className="flex-1 h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] rounded transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Valider</span>
                          </button>
                          <button
                            onClick={() => setRevisionItem(item)}
                            className="h-7 px-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 font-medium text-[11px] rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Demander une modification"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Ajuster</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 4: Livré & Validé */}
              <div className="bg-emerald-50/20 border border-emerald-200/50 rounded-lg p-2.5 space-y-2.5 min-h-[380px]">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-emerald-200/60">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11.5px] font-semibold text-emerald-950">Livré & Validé</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded" style={MONO}>
                    {filteredItems.filter((i) => i.status === 'done').length}
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredItems
                    .filter((i) => i.status === 'done')
                    .map((item) => (
                      <div key={item.id} className="bg-white border border-zinc-200 rounded-md p-3 shadow-2xs space-y-2 opacity-90 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-zinc-500" style={MONO}>{item.category}</span>
                          <span className="font-mono text-emerald-700 font-bold flex items-center gap-0.5" style={MONO}>
                            <Check className="w-3 h-3" /> Validé
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-zinc-900 leading-snug line-through text-zinc-700">{item.title}</h4>
                        {item.deliverable_url && (
                          <a
                            href={item.deliverable_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10.5px] font-medium text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            {getDeliverableIcon(item.deliverable_type)}
                            <span>Consulter le fichier final</span>
                          </a>
                        )}
                        {item.client_feedback && (
                          <div className="text-[10.5px] text-zinc-500 bg-zinc-50 p-1.5 rounded italic">
                            « {item.client_feedback} »
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            /* List / Milestones View */
            <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-zinc-50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider grid grid-cols-12 gap-2">
                <div className="col-span-5">Tâche & Livrable</div>
                <div className="col-span-2">Catégorie</div>
                <div className="col-span-2">Spécialiste</div>
                <div className="col-span-1">Échéance</div>
                <div className="col-span-2 text-right">Statut / Action</div>
              </div>

              {filteredItems.map((item) => (
                <div key={item.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-zinc-50/70 transition-colors">
                  <div className="col-span-5 space-y-1">
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : item.status === 'in_review' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                      ) : item.status === 'in_progress' ? (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                      )}
                      <span>{item.title}</span>
                    </div>
                    {item.description && <p className="text-[11px] text-zinc-500">{item.description}</p>}
                    {item.deliverable_url && (
                      <a
                        href={item.deliverable_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10.5px] font-medium text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        {getDeliverableIcon(item.deliverable_type)}
                        <span>{getDeliverableLabel(item.deliverable_type)}</span>
                      </a>
                    )}
                  </div>

                  <div className="col-span-2 text-zinc-600 font-mono text-[11px]" style={MONO}>
                    <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200 text-[10px]">
                      {item.category}
                    </span>
                  </div>

                  <div className="col-span-2 text-zinc-600 text-[11px]">
                    <div className="font-medium text-zinc-900">{item.assignee_name}</div>
                    <div className="text-[10px] text-zinc-400">{item.assignee_role || 'Équipe Minerva'}</div>
                  </div>

                  <div className="col-span-1 text-zinc-500 font-mono text-[11px]" style={MONO}>
                    {item.due_date || '—'}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {item.status === 'in_review' ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(item)}
                          className="h-6 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10.5px] rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Valider</span>
                        </button>
                        <button
                          onClick={() => setRevisionItem(item)}
                          className="h-6 px-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10.5px] rounded transition-colors cursor-pointer"
                          title="Demander une modification"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                      </div>
                    ) : item.status === 'done' ? (
                      <span className="text-[10.5px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded" style={MONO}>
                        ✓ Validé
                      </span>
                    ) : item.status === 'in_progress' ? (
                      <span className="text-[10.5px] font-mono text-blue-700 font-medium bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded" style={MONO}>
                        En cours
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded" style={MONO}>
                        À faire
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1/4): Live Activity Stream */}
        <div className="bg-white border border-zinc-200 rounded-lg p-3.5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div className="text-[12px] font-semibold text-zinc-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Journal des actions en direct</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Synchronisation temps réel active" />
          </div>

          <div className="space-y-3 text-xs">
            {logs.length === 0 ? (
              <p className="text-[11px] text-zinc-400 text-center py-4">Aucune activité pour l’instant.</p>
            ) : (
            logs.map((log) => (
              <div key={log.id} className="relative pl-3.5 border-l border-zinc-200 space-y-0.5">
                <span
                  className={cn(
                    'absolute -left-[4.5px] top-1 w-2 h-2 rounded-full',
                    log.action_type === 'task_completed'
                      ? 'bg-emerald-500'
                      : log.action_type === 'deliverable_submitted'
                      ? 'bg-amber-500'
                      : log.action_type === 'revision_requested'
                      ? 'bg-rose-500'
                      : 'bg-blue-500'
                  )}
                />
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono" style={MONO}>
                  <span className="font-semibold text-zinc-700">{log.actor_name}</span>
                  <span>{new Date(log.created_at).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-semibold text-zinc-900 text-[11.5px]">{log.title}</div>
                <div className="text-[10.5px] text-zinc-500 leading-relaxed">{log.description}</div>
              </div>
            ))
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 text-center">
            <Link
              href="/portal/questions"
              className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center justify-center gap-1"
            >
              <span>Ouvrir la messagerie d’équipe</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4. Client Revision Request Modal ── */}
      {revisionItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-zinc-200 rounded-lg shadow-xl max-w-md w-full p-4 space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <h3 className="text-[13px] font-semibold text-zinc-900">
                  Demander un ajustement
                </h3>
              </div>
              <button
                onClick={() => setRevisionItem(null)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-zinc-800">{revisionItem.title}</div>
              <div className="text-[11px] text-zinc-400">
                Spécialiste assigné : {revisionItem.assignee_name} ({revisionItem.category})
              </div>
            </div>

            <form onSubmit={handleSubmitRevision} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10.5px] font-semibold uppercase text-zinc-500 tracking-wider">
                  Vos remarques ou modifications souhaitées
                </label>
                <textarea
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  placeholder="Ex : Pourriez-vous éclaircir le fond de la bannière et modifier le titre pour mettre en avant l'estimation gratuite sous 24h ?"
                  rows={4}
                  className="w-full text-xs p-2.5 border border-zinc-200 rounded-md bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:border-emerald-600"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRevisionItem(null)}
                  className="h-8 px-3 text-xs font-medium border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 text-zinc-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision || !revisionFeedback.trim()}
                  className="h-8 px-3.5 text-xs font-semibold bg-zinc-900 hover:bg-black text-white rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{submittingRevision ? 'Transmission…' : 'Transmettre à l’équipe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageFadeIn>
  );
}
