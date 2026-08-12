'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { VideoUploadField } from '@/components/media/VideoUploadField';
import {
  Plus,
  Calendar,
  Kanban as KanbanIcon,
  X,
  Film,
} from 'lucide-react';
import { ContentPost, Client } from '@/lib/types';
import { DonutChart } from '@/components/charts/DonutChart';
import { fetchContentPosts, addContentPost, fetchClients } from '@/lib/services/supabase-data';

const KANBAN_STAGES: ContentPost['status'][] = ['Idéation', 'Rédigé', 'Enregistré', 'Publié'];
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#167f5b',
  TikTok: '#dfff5f',
  'YouTube Shorts': '#ab7d1f',
  LinkedIn: '#0e5a40',
};

function ContentCard({ post }: { post: ContentPost }) {
  return (
    <Link
      href={`/content-planner/${post.id}`}
      className="block p-3.5 rounded-xl bg-mv-surface border border-mv-border hover:border-mv-green transition-all shadow-mv-sm space-y-3 group"
    >
      <div className="flex items-center justify-between">
        <Badge variant="green">{post.client_name}</Badge>
        <span className="text-[10px] font-mono text-mv-ink-faint">
          {new Date(post.scheduled_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="font-bold text-xs text-mv-ink leading-snug group-hover:text-mv-green transition-colors">
        {post.title}
      </div>
      <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-[11px]">
        <span className="text-mv-ink-soft flex items-center gap-1">
          <Film className="w-3.5 h-3.5 text-mv-warm" /> {post.platform || post.format}
        </span>
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-mv-cream-soft text-mv-ink-soft">
          {post.status}
        </span>
      </div>
    </Link>
  );
}

export default function ContentPlannerPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban' | 'storage'>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    (async () => {
      const [postData, clientData] = await Promise.all([fetchContentPosts(), fetchClients()]);
      setPosts(postData);
      setClients(clientData);
      setLoading(false);
    })();
  }, []);

  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newFormat, setNewFormat] = useState<ContentPost['format']>('Reel 60s');
  const [newPlatform, setNewPlatform] = useState<ContentPost['platform']>('Instagram');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newScript, setNewScript] = useState('');

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClientId) return;

    const created = await addContentPost({
      client_id: newClientId,
      title: newTitle,
      format: newFormat,
      platform: newPlatform,
      scheduled_date: newDate,
      status: 'Idéation',
      thumbnail_url: '',
      video_url: newVideoUrl || undefined,
      script_notes: newScript,
    });

    if (created) {
      setPosts([created, ...posts]);
      setIsModalOpen(false);
      setNewTitle('');
      setNewVideoUrl('');
      setNewScript('');
    }
  };

  const handleStatusMove = (postId: string, newStatus: ContentPost['status']) => {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)));
  };

  const platformDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) {
      const key = p.platform || p.format;
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      color: PLATFORM_COLORS[label] || '#8fc7a9',
    }));
  }, [posts]);

  const calendarDays = useMemo(() => {
    const { year, month } = calendarMonth;
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { date: Date | null; posts: ContentPost[] }[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, posts: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      days.push({ date, posts: posts.filter((p) => p.scheduled_date?.split('T')[0] === dateStr) });
    }
    return days;
  }, [calendarMonth, posts]);

  const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('fr-CA', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Social Reels Studio & Contenus
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Studio centralisé de création, prévisualisation 9:16 mobile et diffusion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                viewMode === 'calendar' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendrier
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                viewMode === 'kanban' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('storage')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                viewMode === 'storage' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Bibliothèque Médias
            </button>
          </div>

          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            + Planifier un Reel
          </Button>
        </div>
      </div>

      {!loading && platformDistribution.length > 0 && (
        <DonutChart
          title="Répartition des Contenus par Plateforme"
          subtitle="Distribution réelle de votre stratégie de publication"
          data={platformDistribution}
        />
      )}

      {viewMode === 'storage' && (
        <StorageBrowser defaultBucket="client-assets" title="Bibliothèque Vidéos & Assets" />
      )}

      {loading ? (
        <div className="text-center py-16 text-sm text-mv-ink-soft">Chargement…</div>
      ) : (
        <>
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
              {KANBAN_STAGES.map((stage) => {
                const stagePosts = posts.filter((p) => p.status === stage);
                return (
                  <div key={stage} className="bg-mv-cream-soft/60 border border-mv-border rounded-2xl p-4 space-y-3 min-w-[260px]">
                    <div className="flex items-center justify-between border-b border-mv-border pb-2.5">
                      <span className="font-extrabold text-xs text-mv-ink uppercase tracking-wider">{stage}</span>
                      <span className="text-[11px] font-mono text-mv-ink-soft bg-mv-surface px-2 py-0.5 rounded-full border border-mv-border font-bold">
                        {stagePosts.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {stagePosts.map((post) => (
                        <ContentCard key={post.id} post={post} />
                      ))}
                      {stagePosts.length === 0 && (
                        <div className="p-4 text-center text-[11px] text-mv-ink-faint border border-dashed border-mv-border rounded-xl">
                          Aucun contenu dans cette étape
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'calendar' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2 capitalize">
                  <Calendar className="w-4 h-4 text-mv-green" />
                  {monthLabel}
                </h3>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    onClick={() =>
                      setCalendarMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))
                    }
                    className="px-2.5 py-1 rounded-lg border border-mv-border hover:bg-mv-cream-soft cursor-pointer"
                  >
                    ←
                  </button>
                  <button
                    onClick={() =>
                      setCalendarMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))
                    }
                    className="px-2.5 py-1 rounded-lg border border-mv-border hover:bg-mv-cream-soft cursor-pointer"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-mv-ink-soft mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) =>
                  day.date === null ? (
                    <div key={i} className="min-h-[110px]" />
                  ) : (
                    <div
                      key={i}
                      className="min-h-[110px] max-h-[160px] p-2 bg-mv-cream-soft border border-mv-border rounded-xl flex flex-col gap-1.5 overflow-hidden"
                    >
                      <span className="font-bold text-[11px] text-mv-ink-faint text-right shrink-0">{day.date.getDate()}</span>
                      <div className="space-y-1 overflow-y-auto flex-1">
                        {day.posts.map((p) => (
                          <Link
                            key={p.id}
                            href={`/content-planner/${p.id}`}
                            className="block p-1 rounded bg-mv-green/10 border border-mv-green/30 text-[10px] font-bold text-mv-green truncate hover:bg-mv-green hover:text-white transition-all"
                          >
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {/* MODAL: + PLANIFIER UN REEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-mv-lg animate-mv-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <h3 className="text-base font-extrabold text-mv-ink">Planifier un Nouveau Reel / Content</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-mv-ink">Titre du Reel / Content</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reel 60s - Remplacement Toiture Commerciale"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-mv-ink">Client</label>
                  <select
                    required
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
                  >
                    <option value="" disabled>
                      {clients.length === 0 ? 'Aucun client' : 'Choisir…'}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-mv-ink">Plateforme Cible</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as ContentPost['platform'])}
                    className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
                  >
                    <option value="Instagram">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="LinkedIn">LinkedIn Video</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-mv-ink">Date planifiée</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div>
                <label className="font-bold text-mv-ink mb-1 block">Vidéo</label>
                <VideoUploadField value={newVideoUrl} onChange={setNewVideoUrl} />
              </div>

              <div>
                <label className="font-bold text-mv-ink">Script & Hook Notes</label>
                <textarea
                  rows={3}
                  placeholder="Saisissez les notes de hook et d'appel à l'action..."
                  value={newScript}
                  onChange={(e) => setNewScript(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Enregistrer & Planifier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
