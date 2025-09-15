'use client';

import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { TrackInfo } from '@/types';

interface MusicPlayerProps {
  track: TrackInfo;
  isPlaying: boolean;
  onPlay: (track: TrackInfo) => void;
  onPause: () => void;
}

export default function MusicPlayer({ track, isPlaying, onPlay, onPause }: MusicPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(track.duration);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="space-y-4">
        {/* Album Art */}
        <div className="flex justify-center">
          <div className="relative">
            <img 
              src={track.thumbnailUrl} 
              alt={track.title}
              className="w-24 h-24 rounded-lg shadow-md"
            />
            <div className="absolute inset-0 rounded-lg bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
              <button 
                onClick={() => isPlaying ? onPause() : onPlay(track)}
                className="w-10 h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-gray-800" />
                ) : (
                  <Play className="w-5 h-5 text-gray-800 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{track.title}</h3>
          <p className="text-sm text-gray-600 truncate">{track.artist}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
            <SkipBack className="w-5 h-5 text-gray-600" />
          </button>
          
          <button 
            onClick={() => isPlaying ? onPause() : onPlay(track)}
            className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-tactile hover:shadow-soft hover:scale-105 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
            <SkipForward className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
