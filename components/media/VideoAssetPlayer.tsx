'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Copy, Check, Maximize, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VideoAssetPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  initialAspectRatio?: '9:16' | '16:9' | '1:1';
  showDownloadButton?: boolean;
  className?: string;
}

export function VideoAssetPlayer({
  src,
  poster,
  title = 'Reel Asset Video',
  initialAspectRatio = '9:16',
  showDownloadButton = true,
  className = '',
}: VideoAssetPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>(initialAspectRatio);
  const [copied, setCopied] = useState(false);

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
        return 'aspect-[9/16] max-w-[320px] mx-auto';
      case '16:9':
        return 'aspect-video w-full';
      case '1:1':
        return 'aspect-square max-w-[380px] mx-auto';
    }
  };

  return (
    <div className={`relative bg-mv-cream-soft border border-mv-border rounded-2xl overflow-hidden shadow-mv-md group ${className}`}>
      {/* Aspect Ratio Toggles Bar */}
      <div className="bg-mv-surface/90 backdrop-blur-sm border-b border-mv-border px-3 py-1.5 flex items-center justify-between text-xs z-10">
        <span className="font-extrabold text-[11px] text-mv-ink truncate max-w-[180px]">{title}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAspectRatio('9:16')}
            className={`p-1 rounded transition-all cursor-pointer ${
              aspectRatio === '9:16' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink'
            }`}
            title="Format Smartphone 9:16"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAspectRatio('16:9')}
            className={`p-1 rounded transition-all cursor-pointer ${
              aspectRatio === '16:9' ? 'bg-mv-green text-white font-bold' : 'text-mv-ink-soft hover:text-mv-ink'
            }`}
            title="Format Écran 16:9"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Container */}
      <div className={`relative bg-black flex items-center justify-center ${getAspectClass()}`}>
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
