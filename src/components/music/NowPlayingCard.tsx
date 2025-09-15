'use client';

import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share } from 'lucide-react';
import { TrackInfo } from '@/types';

interface NowPlayingCardProps {
  track: TrackInfo;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress?: number;
  duration?: number;
}

export default function NowPlayingCard({ 
  track, 
  isPlaying, 
  onPlay, 
  onPause, 
  onNext, 
  onPrevious,
  progress = 0,
  duration = 180
}: NowPlayingCardProps) {
  const [volume, setVolume] = useState(80);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (progress / duration) * 100;

  return (
    <div className="now-playing-card">
      {/* Album Art with Gradient Background */}
      <div className="relative mb-6">
        <div 
          className="w-32 h-32 mx-auto rounded-large shadow-tactile overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #ff5500, #ff8a00, #ffb366)`
          }}
        >
          <img 
            src={track.thumbnailUrl} 
            alt={track.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Play/Pause Overlay */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-large opacity-0 hover:opacity-100 transition-all duration-200"
        >
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-tactile">
            {isPlaying ? (
              <Pause className="w-8 h-8 text-neutral-800 ml-0.5" />
            ) : (
              <Play className="w-8 h-8 text-neutral-800 ml-1" />
            )}
          </div>
        </button>
      </div>

      {/* Track Info */}
      <div className="text-center mb-6">
        <h2 className="text-hierarchy-lg font-semibold text-neutral-900 mb-1">{track.title}</h2>
        <p className="text-muted">{track.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-500 mt-2">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-6 mb-6">
        <button 
          onClick={onPrevious}
          className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile"
        >
          <SkipBack className="w-5 h-5 text-neutral-700" />
        </button>
        
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-all duration-200 shadow-tactile"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-1" />
          )}
        </button>
        
        <button 
          onClick={onNext}
          className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile"
        >
          <SkipForward className="w-5 h-5 text-neutral-700" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3 mb-4">
        <Volume2 className="w-4 h-4 text-neutral-500" />
        <div className="flex-1 relative">
          <div className="slider-track">
            <div 
              className="progress-fill"
              style={{ width: `${volume}%` }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-xs text-neutral-500 w-8">{volume}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-8">
        <button className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile">
          <Heart className="w-5 h-5 text-neutral-600" />
        </button>
        <button className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile">
          <Share className="w-5 h-5 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}
