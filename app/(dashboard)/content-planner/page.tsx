'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import {
  Share2,
  Plus,
  Calendar,
  Video,
  Kanban as KanbanIcon,
  Smartphone,
  Eye,
  Download,
  Copy,
  Sparkles,
  Search,
  X,
  CheckCircle2,
  Clock,
  Film,
  Zap,
} from 'lucide-react';
import { ContentPost } from '@/lib/types';
import { DonutChart } from '@/components/charts/DonutChart';


export default function ContentPlannerPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar' | 'storage'>('kanban');
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial Posts
  const [posts, setPosts] = useState<ContentPost[]>([
    {
      id: 'post-1',
      client_id: 'client-apex-roofing',
      client_name: 'Apex Roofing',
      title: 'Reel 60s : Avant / Après Réfection Toiture Commerciale',
      format: 'Reel 60s',
      platform: 'Instagram',
      scheduled_date: '2026-08-14',
      status: 'Publié',
      thumbnail_url: '/icon.svg',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      script_notes: 'HOOK : "Ne remplacez pas votre toiture avant d’avoir vu cette vidéo..."\nCTA : Commentez "TOITURE" pour une soumission gratuite.',
      metrics_views: 14200,
      metrics_clicks: 430,
    },
    {
      id: 'post-2',
      client_id: 'client-apex-roofing',
      client_name: 'Apex Roofing',
      title: 'Carrousel IG : Les 5 erreurs d’isolation l’été au Québec',
      format: 'Carrousel IG',
      platform: 'Instagram',
      scheduled_date: '2026-08-18',
      status: 'Enregistré',
      thumbnail_url: '/icon.svg',
      script_notes: 'Slide 1: Erreur 1 - Ignorer l’aération du soffite.\nSlide 2: Erreur 2 - Choisir le mauvais pare-vapeur.',
      metrics_views: 0,
      metrics_clicks: 0,
    },
    {
      id: 'post-3',
      client_id: 'client-sante-moderne',
      client_name: 'Clinique Santé Moderne',
      title: 'Reel TikTok : Démonstration Soin Visage Hydro-Peel',
      format: 'Reel 60s',
      platform: 'TikTok',
      scheduled_date: '2026-08-20',
      status: 'Rédigé',
      thumbnail_url: '/icon.svg',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      script_notes: 'HOOK : "Le soin秘密 que les cliniques de Montréal ne veulent pas que vous sachiez."',
      metrics_views: 0,
      metrics_clicks: 0,
    },
  ]);

  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newClient, setNewClient] = useState('Apex Roofing');
  const [newFormat, setNewFormat] = useState<ContentPost['format']>('Reel 60s');
  const [newPlatform, setNewPlatform] = useState<ContentPost['platform']>('Instagram');
  const [newDate, setNewDate] = useState('2026-08-25');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newScript, setNewScript] = useState('');

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let finalVideoUrl = newVideoUrl;
    if (newVideoUrl.startsWith('http')) {
      try {
        const res = await fetch('/api/media/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUrl: newVideoUrl, title: newTitle }),
        });
        const data = await res.json();
        if (data.success) {
          finalVideoUrl = data.downloadUrl;
        }
      } catch (err) {
        console.error('Error processing video download:', err);
      }
    }

    const created: ContentPost = {
      id: `post-${Date.now()}`,
      client_id: 'client-apex-roofing',
      client_name: newClient,
      title: newTitle,
      format: newFormat,
      platform: newPlatform,
      scheduled_date: newDate,
      status: 'Idéation',
      thumbnail_url: '/icon.svg',
      video_url: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      script_notes: newScript,
      metrics_views: 0,
      metrics_clicks: 0,
    };

    setPosts([created, ...posts]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewVideoUrl('');
    setNewScript('');
  };

  const handleStatusMove = (postId: string, newStatus: ContentPost['status']) => {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, status: newStatus });
    }
  };

  const KANBAN_STAGES: ContentPost['status'][] = ['Idéation', 'Rédigé', 'Enregistré', 'Publié'];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
              Social Reels Studio & Contenus
            </h1>
            <Badge variant="lime">Video Asset Downloader Engine</Badge>
          </div>
          <p className="text-sm text-mv-ink-soft mt-1">
            Studio centralisé de création, prévisualisation 9:16 mobile, téléchargement `.mp4` et diffusion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="flex items-center bg-mv-cream-soft border border-mv-border rounded-xl p-1 text-xs">
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
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-bold cursor-pointer ${
                viewMode === 'calendar' ? 'bg-mv-green text-white shadow-mv-sm' : 'text-mv-ink-soft hover:text-mv-ink'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendrier
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

      {/* Platform Distribution Chart */}
      <DonutChart
        title="Répartition des Contenus Vidéo par Plateforme"
        subtitle="Distribution de la stratégie de publication sociale"
        data={[
          { label: 'Instagram Reels', value: 12, color: '#167f5b' },
          { label: 'TikTok', value: 8, color: '#dfff5f' },
          { label: 'YouTube Shorts', value: 5, color: '#ab7d1f' },
          { label: 'LinkedIn Video', value: 3, color: '#0e5a40' },
        ]}
      />

      {/* STORAGE MEDIA EXPLORER VIEW */}

      {viewMode === 'storage' && (
        <StorageBrowser defaultBucket="academy-media" title="Bibliothèque Vidéos & Assets" />
      )}

      {/* KANBAN WORKFLOW VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {KANBAN_STAGES.map((stage) => {
            const stagePosts = posts.filter((p) => p.status === stage);
            return (
              <div key={stage} className="bg-mv-cream-soft/60 border border-mv-border rounded-2xl p-4 space-y-3 min-w-[260px]">
                <div className="flex items-center justify-between border-b border-mv-border pb-2.5">
                  <span className="font-extrabold text-xs text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stage === 'Publié'
                          ? 'bg-mv-green'
                          : stage === 'Enregistré'
                          ? 'bg-mv-warm'
                          : stage === 'Rédigé'
                          ? 'bg-mv-amber'
                          : 'bg-mv-ink-faint'
                      }`}
                    />
                    {stage}
                  </span>
                  <span className="text-[11px] font-mono text-mv-ink-soft bg-mv-surface px-2 py-0.5 rounded-full border border-mv-border font-bold">
                    {stagePosts.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stagePosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => setSelectedPost(post)}
                      className="p-3.5 rounded-xl bg-mv-surface border border-mv-border hover:border-mv-green transition-all shadow-mv-sm space-y-3 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="green">{post.client_name}</Badge>
                        <span className="text-[10px] font-mono text-mv-ink-faint">{post.scheduled_date}</span>
                      </div>

                      <div className="font-bold text-xs text-mv-ink leading-snug group-hover:text-mv-green transition-colors">
                        {post.title}
                      </div>

                      {post.video_url && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center border border-mv-border">
                          <Film className="w-6 h-6 text-mv-warm animate-pulse" />
                          <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                            9:16 Reel
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-mv-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-mv-ink-soft flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-mv-warm" /> {post.platform || post.format}
                        </span>

                        <select
                          value={post.status}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusMove(post.id, e.target.value as ContentPost['status']);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] bg-mv-cream border border-mv-border rounded px-1.5 py-0.5 font-semibold text-mv-ink focus:outline-none cursor-pointer"
                        >
                          {KANBAN_STAGES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
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

      {/* MONTHLY CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-extrabold text-sm text-mv-ink uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-mv-green" />
              Calendrier Éditorial Août 2026
            </h3>
            <span className="text-xs text-mv-ink-soft font-mono">14 au 28 Août 2026</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-mv-ink-soft mb-2">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 14 }).map((_, i) => {
              const dayNum = 14 + i;
              const dateStr = `2026-08-${dayNum}`;
              const dayPosts = posts.filter((p) => p.scheduled_date === dateStr);
              return (
                <div key={i} className="min-h-[100px] p-2 bg-mv-cream-soft border border-mv-border rounded-xl flex flex-col justify-between">
                  <span className="font-bold text-[11px] text-mv-ink-faint text-right">{dayNum}</span>
                  <div className="space-y-1">
                    {dayPosts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPost(p)}
                        className="p-1 rounded bg-mv-green/10 border border-mv-green/30 text-[10px] font-bold text-mv-green truncate cursor-pointer hover:bg-mv-green hover:text-white transition-all"
                      >
                        {p.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 9:16 SMARTPHONE REEL INSPECTOR DRAWER */}
      {selectedPost && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-mv-surface border-l border-mv-border h-full max-w-md w-full p-6 overflow-y-auto space-y-6 shadow-mv-lg animate-mv-scale-in flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-mv-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-mv-green" />
                    <h3 className="text-base font-extrabold text-mv-ink">Reel Video Inspector 9:16</h3>
                  </div>
                  <p className="text-xs text-mv-ink-soft mt-0.5">{selectedPost.client_name}</p>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 9:16 Video Player Component */}
              {selectedPost.video_url ? (
                <VideoAssetPlayer
                  src={selectedPost.video_url}
                  poster={selectedPost.thumbnail_url}
                  title={selectedPost.title}
                  initialAspectRatio="9:16"
                  showDownloadButton={true}
                />
              ) : (
                <div className="p-8 text-center border border-dashed border-mv-border rounded-2xl bg-mv-cream-soft text-xs text-mv-ink-soft">
                  Aucun fichier vidéo associé. Importez une vidéo ci-dessous.
                </div>
              )}

              {/* Script Notes & Hook */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-mv-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-mv-green" />
                  Script Video & Notes Hook
                </label>
                <textarea
                  readOnly
                  value={selectedPost.script_notes || 'Aucun script saisi pour ce Reel.'}
                  rows={4}
                  className="w-full bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-xs text-mv-ink focus:outline-none font-mono"
                />
              </div>

              {/* Metrics Showcase */}
              {selectedPost.metrics_views ? (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-mv-green-tint border border-mv-green/30 text-xs">
                  <div>
                    <span className="text-[10px] text-mv-ink-soft uppercase font-bold">Vues Cumulées</span>
                    <p className="font-extrabold text-sm text-mv-green">{selectedPost.metrics_views.toLocaleString('fr-CA')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-mv-ink-soft uppercase font-bold">Clics Bio / Form</span>
                    <p className="font-extrabold text-sm text-mv-green">{selectedPost.metrics_clicks}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-mv-border flex items-center justify-between gap-3">
              <select
                value={selectedPost.status}
                onChange={(e) => handleStatusMove(selectedPost.id, e.target.value as ContentPost['status'])}
                className="bg-mv-cream border border-mv-border rounded-xl px-3 py-2 text-xs font-bold text-mv-ink focus:outline-none cursor-pointer"
              >
                {KANBAN_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <Button variant="outline" size="sm" onClick={() => setSelectedPost(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: + PLANIFIER UN REEL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-mv-lg animate-mv-scale-in">
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
                  <label className="font-bold text-mv-ink">Client Minerva</label>
                  <select
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
                  >
                    <option value="Apex Roofing">Apex Roofing</option>
                    <option value="Clinique Santé Moderne">Clinique Santé Moderne</option>
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
                <label className="font-bold text-mv-ink">URL de la Vidéo (Service Downloader yt-dlp)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=... ou URL MP4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green font-mono"
                />
                <span className="text-[10px] text-mv-ink-faint">
                  Le service Downloader téléchargera automatiquement le fichier MP4 dans le stockage.
                </span>
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
