'use client';

import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
  ExternalLink,
  Youtube,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function isYouTubeShorts(url: string): boolean {
  return !!url && url.includes('/shorts/');
}

interface VideoAssetPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  initialAspectRatio?: '9:16' | '16:9' | '1:1';
  showDownloadButton?: boolean;
  className?: string;
  isUpcomingPlaceholder?: boolean;
}

export function VideoAssetPlayer({
  src,
  poster,
  title = 'Vidéo Minerva',
  initialAspectRatio,
  showDownloadButton = true,
  className = '',
  isUpcomingPlaceholder = false,
}: VideoAssetPlayerProps) {
  const youtubeId = extractYouTubeVideoId(src);
  const isShorts = isYouTubeShorts(src);

  // Default to 9:16 for Shorts, 16:9 for standard YouTube/videos
  const defaultAspect: '9:16' | '16:9' | '1:1' =
    initialAspectRatio || (isShorts ? '9:16' : '16:9');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(defaultAspect);
  const [copied, setCopied] = useState(false);

  // HTML5 Player controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setProgress((current / total) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(src);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadVideo = () => {
    const sanitizedName = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${sanitizedName}-${Date.now()}.mp4`;

    const a = document.createElement('a');
    a.href = src;
    a.download = filename;
    a.setAttribute('target', '_blank');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[360px] mx-auto';
      case '16:9':
        return 'aspect-video w-full';
      case '1:1':
        return 'aspect-square max-w-[420px] mx-auto';
    }
  };

  // If this is an upcoming placeholder (e.g. for Minerva Reach YouTube demo)
  if (isUpcomingPlaceholder || (!src && !youtubeId)) {
    return (
      <div className={cn('relative bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden p-6 sm:p-8 text-center space-y-4 shadow-mv-md', className)}>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Youtube className="w-6 h-6 text-red-500" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Démonstration Officielle Minerva Reach</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Vidéo Walkthrough en Cours d’Intégration
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            La vidéo YouTube démontrant l’utilisation complète de Minerva Reach et la routine quotidienne sera affichée directement dans ce lecteur dès sa publication.
          </p>
        </div>
      </div>
    );
  }

  // ── YOUTUBE EMBED PLAYER ──
  if (youtubeId) {
    return (
      <div className={cn('relative bg-mv-cream-soft border border-mv-border rounded-2xl overflow-hidden shadow-mv-md group', className)}>
        {/* Aspect Ratio Toggles Bar */}
        <div className="bg-mv-surface/95 backdrop-blur-sm border-b border-mv-border px-3.5 py-2 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2 truncate max-w-[280px]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-extrabold text-[11px] text-mv-ink truncate">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAspectRatio('9:16')}
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer text-xs font-semibold flex items-center gap-1',
                aspectRatio === '9:16' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink bg-mv-surface border border-mv-border'
              )}
              title="Format Vertical 9:16 (Shorts)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">9:16</span>
            </button>
            <button
              onClick={() => setAspectRatio('16:9')}
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer text-xs font-semibold flex items-center gap-1',
                aspectRatio === '16:9' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink bg-mv-surface border border-mv-border'
              )}
              title="Format Écran Large 16:9"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[10px]">16:9</span>
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-mv-surface border border-mv-border hover:border-red-500/50 text-mv-ink-soft hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
              title="Ouvrir sur YouTube"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Video Embed Container */}
        <div className={cn('relative bg-black flex items-center justify-center transition-all', getAspectClass())}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Footer info */}
        <div className="px-3.5 py-2 bg-mv-surface border-t border-mv-border flex items-center justify-between text-[11px] text-mv-ink-soft">
          <div className="flex items-center gap-1.5 font-medium">
            <Youtube className="w-3.5 h-3.5 text-red-600" />
            <span>Lecteur YouTube Minerva Intégré</span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="text-mv-ink-soft hover:text-mv-ink flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Lien copié' : 'Copier lien'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ── HTML5 LOCAL / STORAGE MP4 PLAYER ──
  return (
    <div className={cn('relative bg-mv-cream-soft border border-mv-border rounded-2xl overflow-hidden shadow-mv-md group', className)}>
      {/* Aspect Ratio Toggles Bar */}
      <div className="bg-mv-surface/90 backdrop-blur-sm border-b border-mv-border px-3 py-1.5 flex items-center justify-between text-xs z-10">
        <span className="font-extrabold text-[11px] text-mv-ink truncate max-w-[180px]">{title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={cn(
              'p-1 rounded transition-all cursor-pointer',
              aspectRatio === '9:16' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink'
            )}
            title="Format Smartphone 9:16"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={cn(
              'p-1 rounded transition-all cursor-pointer',
              aspectRatio === '16:9' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink'
            )}
            title="Format Écran 16:9"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className={cn('relative bg-black flex items-center justify-center', getAspectClass())}>
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full h-full object-cover cursor-pointer"
          playsInline
        />

        {/* Center Big Play Button Overlay */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-mv-green/90 text-white flex items-center justify-center shadow-mv-lg hover:scale-110 transition-transform cursor-pointer"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        )}
      </div>

      {/* Bottom Custom Controls Bar */}
      <div className="p-3 bg-mv-surface border-t border-mv-border space-y-2 text-xs">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-mv-border rounded-lg appearance-none cursor-pointer accent-mv-green"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-mv-cream border border-mv-border hover:border-mv-green text-mv-ink cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-mv-green" /> : <Play className="w-4 h-4 text-mv-green" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-mv-cream border border-mv-border hover:border-mv-green text-mv-ink cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-mv-red" /> : <Volume2 className="w-4 h-4 text-mv-ink-soft" />}
            </button>

            {/* Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-mv-cream border border-mv-border rounded px-1.5 py-1 text-[11px] font-bold text-mv-ink focus:outline-none cursor-pointer"
            >
              <option value="0.5">0.5x</option>
              <option value="1.0">1.0x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="px-2 text-[11px] flex items-center gap-1"
              title="Copier URL CDN"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-mv-green" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'URL'}
            </Button>

            {showDownloadButton && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadVideo}
                className="px-2.5 text-[11px] flex items-center gap-1"
                title="Télécharger le fichier .MP4"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger MP4
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
