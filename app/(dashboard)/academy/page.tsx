'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StorageBrowser } from '@/components/storage/StorageBrowser';
import { VideoAssetPlayer } from '@/components/media/VideoAssetPlayer';
import { GraduationCap, BookOpen, Clock, ArrowRight, Video, Search, Plus, X, Film, CheckCircle2 } from 'lucide-react';
import { fetchAcademySops, addAcademySop } from '@/lib/services/supabase-data';
import { useToast } from '@/components/providers/ToastProvider';
import { AcademySOP } from '@/lib/types';

export default function AcademyPage() {
  const [sops, setSops] = useState<AcademySOP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSop, setSelectedSop] = useState<AcademySOP | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toastSuccess, toastError } = useToast();

  // Modal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AcademySOP['category']>('Design Framer');
  const [newAuthor, setNewAuthor] = useState('Alex Tremblay');
  const [newReadTime, setNewReadTime] = useState(5);
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    (async () => {
      setSops(await fetchAcademySops());
      setLoading(false);
    })();
    try {
      localStorage.setItem('mv-visited-academy', '1');
    } catch {}
  }, []);

  const filteredSops = sops.filter((sop) => {
    const matchesSearch =
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateSop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = await addAcademySop({
      title: newTitle,
      category: newCategory,
      read_time_min: Number(newReadTime),
      author: newAuthor,
      description: newDescription,
    });

    if (!created) {
      toastError('Erreur', 'Impossible de créer la SOP.');
      return;
    }

    setSops([created, ...sops]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    toastSuccess('SOP créée !', 'Ajoutez une vidéo via la bibliothèque média ci-dessous si besoin.');
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-mv-ink tracking-tight font-display">
            Académie Interne & SOPs Minerva
          </h1>
          <p className="text-sm text-mv-ink-soft mt-1">
            Base de connaissances, tutoriels vidéo interactifs et guides d'exécution standardisés.
          </p>
        </div>

        <Button variant="primary" icon={<BookOpen className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          + Créer une SOP
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-mv-ink-soft" />
              <input
                type="text"
                placeholder="Rechercher une SOP, un sujet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mv-cream-soft border border-mv-border rounded-xl pl-9 pr-4 py-2 text-xs text-mv-ink focus:outline-none focus:border-mv-green"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-xs font-medium text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Design Framer">Design Framer</option>
              <option value="Workflows IA">Workflows IA</option>
              <option value="Campagnes Ads">Campagnes Ads</option>
              <option value="Loi 25 & Compliance">Loi 25 & Compliance</option>
            </select>
          </div>

          <span className="text-xs text-mv-ink-soft font-mono">
            Total SOPs : <strong className="text-mv-green">{filteredSops.length}</strong>
          </span>
        </div>
      </Card>

      {/* SOP Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-sm text-mv-ink-soft">Chargement des SOPs…</div>
      ) : filteredSops.length === 0 ? (
        <Card className="text-center py-16">
          <GraduationCap className="w-8 h-8 text-mv-ink-faint mx-auto mb-3" />
          <p className="text-sm text-mv-ink-soft">
            {sops.length === 0
              ? 'Aucune SOP pour le moment. Créez la première avec le bouton ci-dessus.'
              : 'Aucune SOP ne correspond à cette recherche.'}
          </p>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredSops.map((sop) => (
          <Card key={sop.id} className="flex flex-col justify-between hover:border-mv-green transition-all shadow-mv-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="lime">{sop.category}</Badge>
                <span className="text-[11px] font-mono text-mv-ink-soft flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-mv-green" /> {sop.read_time_min} min
                </span>
              </div>

              <h3 className="font-extrabold text-sm text-mv-ink leading-snug">{sop.title}</h3>
              <p className="text-xs text-mv-ink-soft leading-relaxed line-clamp-3">{sop.description}</p>

              {/* Embedded Video Thumbnail Preview */}
              {sop.video_url && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-mv-border">
                  <Film className="w-8 h-8 text-mv-warm animate-pulse" />
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-white px-2 py-0.5 rounded font-mono font-bold">
                    Tutoriel Vidéo .MP4
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-mv-border flex items-center justify-between text-xs">
              <span className="text-mv-ink-faint font-medium">Par {sop.author}</span>
              <button
                onClick={() => setSelectedSop(sop)}
                className="font-bold text-mv-green hover:underline flex items-center gap-1 cursor-pointer"
              >
                Visionner SOP <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* SOP INSPECTOR & VIDEO PLAYER MODAL */}
      {selectedSop && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-mv-lg animate-mv-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-mv-border pb-4">
              <div>
                <Badge variant="lime" className="mb-1">{selectedSop.category}</Badge>
                <h3 className="text-lg font-extrabold text-mv-ink">{selectedSop.title}</h3>
              </div>
              <button
                onClick={() => setSelectedSop(null)}
                className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSop.video_url && (
              <VideoAssetPlayer
                src={selectedSop.video_url}
                title={selectedSop.title}
                initialAspectRatio="16:9"
                showDownloadButton={true}
              />
            )}

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-mv-ink uppercase tracking-wider">Description & Procédure</h4>
              <p className="text-mv-ink-soft leading-relaxed bg-mv-cream-soft p-4 rounded-xl border border-mv-border font-mono">
                {selectedSop.description}
              </p>
            </div>

            <div className="flex justify-end pt-4 border-t border-mv-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedSop(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SOP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-mv-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-mv-surface border border-mv-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-mv-lg animate-mv-scale-in">
            <div className="flex items-center justify-between border-b border-mv-border pb-3">
              <h3 className="text-base font-extrabold text-mv-ink">Créer une Nouvelle SOP Minerva</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-mv-ink-soft hover:text-mv-ink hover:bg-mv-cream cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSop} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-mv-ink">Titre de la SOP</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Procédure de Validation Qualité Framer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-mv-ink">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as AcademySOP['category'])}
                    className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green cursor-pointer font-medium"
                  >
                    <option value="Design Framer">Design Framer</option>
                    <option value="Workflows IA">Workflows IA</option>
                    <option value="Campagnes Ads">Campagnes Ads</option>
                    <option value="Loi 25 & Compliance">Loi 25 & Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-mv-ink">Temps de lecture (min)</label>
                  <input
                    type="number"
                    min="1"
                    value={newReadTime}
                    onChange={(e) => setNewReadTime(Number(e.target.value))}
                    className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl px-3 py-2 text-mv-ink focus:outline-none focus:border-mv-green"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-mv-ink">Description & Étapes SOP</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Saisissez la description détaillée et les consignes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full mt-1 bg-mv-cream-soft border border-mv-border rounded-xl p-3 text-mv-ink focus:outline-none focus:border-mv-green"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-mv-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Enregistrer SOP
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Storage Media & Video SOPs */}
      <StorageBrowser defaultBucket="academy-media" title="Bibliothèque Média & Vidéos SOPs" />
    </div>
  );
}
