'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Radio } from 'lucide-react';
import { TrackInfo } from '@/types';

interface RadioDisplayProps {
  track: TrackInfo;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export default function RadioDisplay({ 
  track, 
  isPlaying, 
  onPlay, 
  onPause,
  volume = 80,
  onVolumeChange
}: RadioDisplayProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [frequency, setFrequency] = useState(88.5);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-cream-100 to-beige-100 rounded-medium p-6 shadow-minimal border border-cream-200">
      {/* Radio Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center shadow-minimal">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-beige-800">WAVE Radio</h3>
            <p className="text-sm text-beige-600">FM {frequency.toFixed(1)}</p>
          </div>
        </div>
        
        {/* Live Indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-beige-600 font-medium">LIVE</span>
        </div>
      </div>

      {/* Frequency Display */}
      <div className="bg-cream-200 rounded-medium p-4 mb-6 shadow-neumorphic-inset">
        <div className="text-center">
          <div className="text-3xl font-bold text-beige-800 mb-2">
            {frequency.toFixed(1)} FM
          </div>
          <div className="w-full bg-beige-300 rounded-full h-2 shadow-neumorphic-inset">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((frequency - 88) / 20) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-beige-600 mt-2">
            <span>88.0</span>
            <span>108.0</span>
          </div>
        </div>
      </div>

      {/* Now Playing */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-beige-700 uppercase tracking-wide">Now Playing</h4>
        
        <div className="flex items-center space-x-4">
          {/* LP Record Style Album Art */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-beige-300 to-beige-400 shadow-tactile flex items-center justify-center">
              <img 
                src={track.thumbnailUrl} 
                alt={track.title}
                className="w-16 h-16 rounded-full object-cover shadow-inner"
              />
            </div>
            {/* Record grooves */}
            <div className="absolute inset-0 rounded-full border-2 border-beige-500 opacity-30"></div>
            <div className="absolute inset-1 rounded-full border border-beige-400 opacity-20"></div>
            <div className="absolute inset-2 rounded-full border border-beige-300 opacity-10"></div>
          </div>
          
          <div className="flex-1">
            <h5 className="font-semibold text-beige-800 text-sm">{track.title}</h5>
            <p className="text-xs text-beige-600">{track.artist}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-beige-500">{formatTime(currentTime)}</span>
              <div className="w-1 h-1 bg-beige-400 rounded-full"></div>
              <span className="text-xs text-beige-500">3:45</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-cream-300">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center shadow-tactile hover:shadow-soft transition-all duration-200"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <Volume2 className="w-4 h-4 text-beige-600" />
          <div className="w-20 bg-cream-300 rounded-full h-1 shadow-neumorphic-inset">
            <div 
              className="bg-primary-500 h-1 rounded-full transition-all duration-200"
              style={{ width: `${volume}%` }}
            />
          </div>
          <span className="text-xs text-beige-600 w-6">{volume}</span>
        </div>
      </div>
    </div>
  );
}
