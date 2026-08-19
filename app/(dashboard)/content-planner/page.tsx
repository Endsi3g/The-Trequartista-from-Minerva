'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Calendar as CalendarIcon,
  Kanban as KanbanIcon,
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Play,
  Scissors,
  ExternalLink,
  CheckCircle2,
  Clock,
  Instagram,
  Video,
} from 'lucide-react';
import { ContentPost, MinervaContentItem, MinervaContentCategory, OpusClipJob } from '@/lib/types';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import {
  fetchContentPosts,
  updateContentPost,
  fetchMinervaContentItems,
  fetchMinervaContentCategories,
  fetchOpusClipJobs,
} from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { PageFadeIn } from '@/components/ui/page-transition';
import { PaginatedColumn } from '@/components/ui/paginated-column';
import { cn } from '@/lib/utils';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' };
const KANBAN_STAGES: ContentPost['status'][] = ['Idéation', 'Rédigé', 'Enregistré', 'Publié'];

export default function ContentPlannerPage() {
  const router = useRouter();
  const { toastError, toastSuccess } = useToast();
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'storage' | 'minerva'>('calendar');
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [minervaItems, setMinervaItems] = useState<MinervaContentItem[]>([]);
  const [minervaCategories, setMinervaCategories] = useState<MinervaContentCategory[]>([]);
  const [minervaSubView, setMinervaSubView] = useState<'calendar' | 'banque' | 'opus'>('calendar');
  const [opusJobs, setOpusJobs] = useState<OpusClipJob[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pData, mData, cData, oData] = await Promise.all([
        fetchContentPosts(),
        fetchMinervaContentItems(),
        fetchMinervaContentCategories(),
        fetchOpusClipJobs(),
      ]);
      setPosts(pData);
      setMinervaItems(mData);
      setMinervaCategories(cData);
      setOpusJobs(oData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard navigation shortcuts: T (Today), J (Prev month), K (Next month)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key.toLowerCase() === 't') {
        const now = new Date();
        setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
      } else if (e.key.toLowerCase() === 'j') {
        setCalendarMonth((prev) => {
          const d = new Date(prev.year, prev.month - 1, 1);
          return { year: d.getFullYear(), month: d.getMonth() };
        });
      } else if (e.key.toLowerCase() === 'k') {
        setCalendarMonth((prev) => {
          const d = new Date(prev.year, prev.month + 1, 1);
          return { year: d.getFullYear(), month: d.getMonth() };
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute Platform Distribution & Status metrics
  const totalPosts = posts.length;
  const instaPosts = posts.filter((p) => (p.platform || '').toLowerCase().includes('instagram')).length;
  const tiktokPosts = posts.filter((p) => (p.platform || '').toLowerCase().includes('tiktok')).length;
  const ytPosts = posts.filter((p) => (p.platform || '').toLowerCase().includes('youtube')).length;

  const publishedCount = posts.filter((p) => p.status === 'Publié').length;
  const recordedCount = posts.filter((p) => p.status === 'Enregistré').length;
  const draftCount = posts.filter((p) => p.status === 'Idéation' || p.status === 'Rédigé').length;

  // Calendar matrix calculations
  const monthName = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('fr-CA', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calendarMonth.year, calendarMonth.month, 1);
    const lastDayOfMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0);

    // Monday = 0, Sunday = 6
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

    // Previous month padding
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(calendarMonth.year, calendarMonth.month, -i);
      days.push({ date: d, isCurrentMonth: false, dateStr: d.toISOString().split('T')[0] });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(calendarMonth.year, calendarMonth.month, day);
      days.push({ date: d, isCurrentMonth: true, dateStr: d.toISOString().split('T')[0] });
    }

    // Next month padding to fill complete weeks
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calendarMonth.year, calendarMonth.month + 1, i);
      days.push({ date: d, isCurrentMonth: false, dateStr: d.toISOString().split('T')[0] });
    }

    return days;
  }, [calendarMonth]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDropOnDate = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain') || draggedPostId;
    if (!postId) return;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, scheduled_date: targetDateStr } : p))
    );

    const ok = await updateContentPost(postId, { scheduled_date: targetDateStr });
    if (ok) {
      toastSuccess('Date mise à jour', `Réel replanifié pour le ${targetDateStr}.`);
    } else {
      toastError('Erreur', 'Impossible de mettre à jour la date.');
      loadData();
    }
  };

  const handleDropOnStage = async (e: React.DragEvent, newStage: ContentPost['status']) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain') || draggedPostId;
    if (!postId) return;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStage } : p))
    );

    const ok = await updateContentPost(postId, { status: newStage });
    if (ok) {
      toastSuccess('Étape mise à jour', `Le réel est maintenant "${newStage}".`);
    } else {
      toastError('Erreur', 'Impossible de mettre à jour le statut.');
      loadData();
    }
  };

  return (
    <PageFadeIn className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* ── 1. Compact Header Bar ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-[4px] bg-zinc-100 border border-mv-border flex items-center justify-center text-zinc-900 shrink-0">
            <Film className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold text-mv-ink tracking-tight truncate">
              Studio Contenus & Réels
            </h1>
            <span className="text-[11px] text-zinc-400 font-mono" style={MONO}>
              ({posts.length} vidéo{posts.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {/* Right Controls: View Switcher & Action Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented Control à 4 onglets */}
          <div className="flex items-center bg-zinc-100/80 border border-mv-border rounded-[5px] p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'calendar'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <CalendarIcon className="w-3 h-3" />
              <span>Calendrier</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <KanbanIcon className="w-3 h-3" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('storage')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'storage'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <FolderOpen className="w-3 h-3" />
              <span>Médias</span>
            </button>
            <button
              onClick={() => setViewMode('minerva')}
              className={cn(
                'px-2.5 py-1 rounded-[4px] transition-all cursor-pointer flex items-center gap-1',
                viewMode === 'minerva'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Sparkles className="w-3 h-3 text-mv-green" />
              <span>Contenu Minerva</span>
            </button>
          </div>

          <Link
            href="/content-planner/new"
            className="h-7 px-3 rounded-[4px] bg-mv-green hover:bg-emerald-700 text-white text-[11.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Planifier un Réel</span>
          </Link>
        </div>
      </div>

      {/* ── 2. Compact Horizontal Platform Distribution Bar (56px) ── */}
      <div className="bg-mv-surface border border-mv-border rounded-[6px] p-3 shadow-2xs flex flex-col justify-between gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-zinc-500 text-[10.5px]">
              Distribution par Plateforme (Total : {totalPosts})
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]" style={MONO}>
            <span className="text-zinc-500">Montage : <strong className="text-zinc-900">{draftCount}</strong></span>
            <span className="text-zinc-500">Prêt : <strong className="text-emerald-700">{recordedCount}</strong></span>
            <span className="text-zinc-500">Publié : <strong className="text-mv-green">{publishedCount}</strong></span>
          </div>
        </div>

        {/* 6px Segmented Distribution Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-mv-green transition-all"
              style={{ width: `${totalPosts > 0 ? (instaPosts / totalPosts) * 100 : 100}%` }}
              title="Instagram Reels"
            />
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${totalPosts > 0 ? (tiktokPosts / totalPosts) * 100 : 0}%` }}
              title="TikTok"
            />
            <div
              className="h-full bg-zinc-400 transition-all"
              style={{ width: `${totalPosts > 0 ? (ytPosts / totalPosts) * 100 : 0}%` }}
              title="YouTube Shorts"
            />
          </div>
          <div className="flex items-center gap-3 text-[10.5px] text-zinc-500 font-mono shrink-0" style={MONO}>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mv-green" /> Instagram ({totalPosts > 0 ? Math.round((instaPosts / totalPosts) * 100) : 100}%)
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" /> TikTok (0%)
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Views (Calendar / Kanban / Storage / Minerva) ── */}
      {viewMode === 'calendar' ? (
        <div className="bg-mv-surface border border-mv-border rounded-[6px] overflow-hidden shadow-2xs">
          {/* Calendar Month Header & Controls */}
          <div className="p-3 border-b border-mv-border flex items-center justify-between bg-black/[0.01]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-mv-ink capitalize">{monthName}</span>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline" style={MONO}>
                (Raccourcis : T = Aujourd’hui, J/K = Mois préc./suiv.)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setCalendarMonth((prev) => {
                    const d = new Date(prev.year, prev.month - 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="h-7 px-2 rounded-[4px] border border-mv-border bg-white text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Mois précédent (J)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const now = new Date();
                  setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });
                }}
                className="h-7 px-2.5 rounded-[4px] border border-mv-border bg-white text-zinc-700 hover:text-zinc-900 text-xs font-medium transition-colors cursor-pointer"
                title="Aujourd’hui (T)"
              >
                Aujourd’hui
              </button>

              <button
                onClick={() =>
                  setCalendarMonth((prev) => {
                    const d = new Date(prev.year, prev.month + 1, 1);
                    return { year: d.getFullYear(), month: d.getMonth() };
                  })
                }
                className="h-7 px-2 rounded-[4px] border border-mv-border bg-white text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                title="Mois suivant (K)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 7-column Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-mv-border bg-zinc-50/50 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 text-center py-1">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Monolithic Continuous Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-mv-border bg-white">
            {calendarDays.map((dayObj, i) => {
              const dayPosts = posts.filter((p) => p.scheduled_date === dayObj.dateStr);
              const isToday = dayObj.dateStr === todayStr;

              return (
                <div
                  key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(e, dayObj.dateStr)}
                  onDoubleClick={() => router.push(`/content-planner/new?date=${dayObj.dateStr}`)}
                  className={cn(
                    'min-h-[85px] p-1.5 flex flex-col justify-between transition-colors relative group',
                    dayObj.isCurrentMonth ? 'bg-white' : 'bg-zinc-50/60 text-zinc-400',
                    isToday && 'bg-emerald-50/15'
                  )}
                >
                  {/* Top: Day Number (top-left) + Today Marker */}
                  <div className="flex items-center justify-between">
                    {isToday ? (
                      <span className="w-5 h-5 rounded-full bg-mv-green text-white font-semibold text-[10.5px] flex items-center justify-center font-mono" style={MONO}>
                        {dayObj.date.getDate()}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-500 font-medium pl-0.5" style={MONO}>
                        {dayObj.date.getDate()}
                      </span>
                    )}

                    <button
                      onClick={() => router.push(`/content-planner/new?date=${dayObj.dateStr}`)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-mv-green text-[10px] cursor-pointer transition-opacity"
                      title="Ajouter un réel ce jour"
                    >
                      +
                    </button>
                  </div>

                  {/* Micro-Pills of Videos for this day (22px) */}
                  <div className="space-y-1 my-1">
                    {dayPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/content-planner/${post.id}`}
                        draggable
                        onDragStart={(e) => {
                          setDraggedPostId(post.id);
                          e.dataTransfer.setData('text/plain', post.id);
                        }}
                        className="h-[22px] px-1.5 rounded-[4px] border border-emerald-200/70 bg-emerald-50/60 text-emerald-950 text-[10.5px] font-medium flex items-center gap-1 hover:bg-emerald-100 transition-colors truncate cursor-grab"
                      >
                        <Play className="w-2.5 h-2.5 text-mv-green fill-mv-green shrink-0" />
                        <span className="font-mono text-[9px] text-emerald-700 shrink-0" style={MONO}>60s</span>
                        <span className="truncate">{post.title}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-mv-green shrink-0 ml-auto" />
                      </Link>
                    ))}
                  </div>

                  <div />
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ── Kanban View (Large Cards with Full Video Previews) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_STAGES.map((stage) => {
            const stagePosts = posts.filter((p) => p.status === stage);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnStage(e, stage)}
                className="bg-zinc-50/70 border border-mv-border rounded-[6px] flex flex-col min-h-[460px] overflow-hidden"
              >
                <div className="p-2.5 border-b border-mv-border bg-white flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                    {stage}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded" style={MONO}>
                    {stagePosts.length}
                  </span>
                </div>

                <div className="p-2.5 space-y-3 flex-1 overflow-y-auto">
                  <PaginatedColumn
                    items={stagePosts}
                    getKey={(post) => post.id}
                    emptyLabel="Vide"
                    renderItem={(post) => (
                      <div
                        draggable
                        onDragStart={(e) => {
                          setDraggedPostId(post.id);
                          e.dataTransfer.setData('text/plain', post.id);
                        }}
                        className="border border-mv-border bg-white rounded-[6px] p-2.5 shadow-2xs space-y-2 cursor-grab group"
                      >
                        {/* Video Player Preview if URL exists */}
                        {post.video_url ? (
                          <div className="rounded-[4px] overflow-hidden border border-black/10">
                            <VideoAssetPlayer src={post.video_url} title={post.title} initialAspectRatio="16:9" />
                          </div>
                        ) : (
                          <div className="h-20 bg-zinc-100 rounded-[4px] flex items-center justify-center text-zinc-400">
                            <Film className="w-5 h-5 opacity-40" />
                          </div>
                        )}

                        <div>
                          <div className="font-semibold text-xs text-zinc-900 group-hover:text-mv-green transition-colors">
                            <Link href={`/content-planner/${post.id}`}>{post.title}</Link>
                          </div>
                          <div className="text-[10.5px] text-zinc-400 font-mono mt-0.5" style={MONO}>
                            {post.client_name} · {new Date(post.scheduled_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'storage' ? (
        /* ── Storage Browser View ── */
        <StorageBrowser defaultBucket="client-assets" title="Médiathèque & Fichiers Vidéo" />
      ) : (
        /* ── Contenu Minerva & Opus Clip View ── */
        <div className="space-y-4">
          {/* Sub-view Underline Tabs */}
          <div className="flex items-center gap-6 border-b border-mv-border px-1">
            <button
              onClick={() => setMinervaSubView('calendar')}
              className={cn(
                'text-[12px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5',
                minervaSubView === 'calendar'
                  ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendrier Agence</span>
            </button>
            <button
              onClick={() => setMinervaSubView('banque')}
              className={cn(
                'text-[12px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5',
                minervaSubView === 'banque'
                  ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Banque d’Inspiration & Vidéos</span>
            </button>
            <button
              onClick={() => setMinervaSubView('opus')}
              className={cn(
                'text-[12px] font-medium pb-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5',
                minervaSubView === 'opus'
                  ? 'text-zinc-900 border-b-2 border-mv-green font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Pipeline Opus Clip → Drive</span>
            </button>
          </div>

          {/* Sub-View Content */}
          {minervaSubView === 'opus' ? (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-mv-border pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                  Jobs de Découpage IA Opus Clip ({opusJobs.length})
                </span>
                <span className="text-[10.5px] font-mono text-zinc-400" style={MONO}>
                  Export auto vers Google Drive
                </span>
              </div>

              {opusJobs.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Aucun job Opus Clip en cours.</p>
              ) : (
                <div className="space-y-2">
                  {opusJobs.map((j) => (
                    <div key={j.id} className="p-3 border border-mv-border rounded-[4px] bg-black/[0.01] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-zinc-900">{j.title}</div>
                        <div className="text-[10.5px] text-zinc-400 font-mono truncate max-w-sm">{j.source_video_url}</div>
                      </div>
                      <span className="text-[11px] font-medium text-mv-green bg-emerald-50 px-2 py-0.5 rounded">
                        Terminé ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-mv-surface border border-mv-border rounded-[6px] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-mv-border pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-900">
                  Ressources & Vidéos Minerva ({minervaItems.length})
                </span>
                <Link
                  href="/content-planner/minerva/new"
                  className="text-xs font-medium text-mv-green hover:underline flex items-center gap-1"
                >
                  + Ajouter un élément
                </Link>
              </div>

              {minervaItems.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">Aucun contenu d’agence enregistré.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {minervaItems.map((item) => (
                    <div key={item.id} className="p-3 border border-mv-border rounded-[4px] bg-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-zinc-100 rounded text-zinc-600">
                          {item.kind === 'inspiration' ? 'Inspiration' : 'Vidéo Propre'}
                        </span>
                        {item.scheduled_date && (
                          <span className="text-[10px] font-mono text-zinc-400" style={MONO}>
                            {new Date(item.scheduled_date).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-xs text-zinc-900">{item.title}</div>
                      {item.note && <p className="text-[11px] text-zinc-500 line-clamp-2">{item.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </PageFadeIn>
  );
}
