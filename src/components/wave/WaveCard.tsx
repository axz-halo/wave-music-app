'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share, Play } from 'lucide-react';
import { Wave } from '@/types';
import LPRecord from '@/components/music/LPRecord';

interface WaveCardProps {
  wave: Wave;
  onLike?: (waveId: string) => void;
  onComment?: (waveId: string) => void;
  onSave?: (waveId: string) => void;
  onShare?: (waveId: string) => void;
  onPlay?: (trackId: string) => void;
}

export default function WaveCard({ 
  wave, 
  onLike, 
  onComment, 
  onSave, 
  onShare, 
  onPlay 
}: WaveCardProps) {
  const [isLiked, setIsLiked] = useState(wave.isLiked || false);
  const [isSaved, setIsSaved] = useState(wave.isSaved || false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(wave.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave?.(wave.id);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };

  return (
    <div className="sk4-spotify-wave-card p-sk4-md h-full flex flex-col min-h-[240px] sm:min-h-[260px] sk4-fade-in group overflow-hidden relative">
      
      {/* User Info - Spotify Pattern */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-md relative z-10">
        <div className="relative">
          <img
            src={wave.user.profileImage || '/default-avatar.png'}
            alt={wave.user.nickname}
            className="w-9 h-9 rounded-full border-2 border-sk4-light-gray group-hover:border-sk4-orange transition-all duration-300 group-hover:scale-110"
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-sk4-orange rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="sk4-spotify-subtitle block truncate group-hover:text-sk4-orange transition-colors duration-300">{wave.user.nickname}</span>
          <span className="sk4-spotify-caption">{formatTimeAgo(wave.timestamp)}</span>
        </div>
      </div>

      {/* Music Info - Enhanced Layout */}
      <div className="flex items-center space-x-sk4-md mb-sk4-md cursor-pointer relative z-10" onClick={() => onPlay?.(wave.track.id)}>
        <div className="relative group/play">
          <LPRecord
            src={wave.track.thumbnailUrl}
            alt={wave.track.title}
            size="md"
            onPlay={() => onPlay?.(wave.track.id)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover/play:bg-opacity-30 rounded-full transition-all duration-300">
            <div className="transform scale-0 group-hover/play:scale-100 transition-transform duration-300">
              <Play className="w-7 h-7 text-white drop-shadow-lg" fill="currentColor" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="sk4-spotify-title mb-0.5 truncate group-hover:text-sk4-orange transition-colors duration-300">{wave.track.title}</h3>
          <p className="sk4-spotify-subtitle truncate group-hover:text-sk4-dark-gray transition-colors duration-300">{wave.track.artist}</p>
        </div>
        <div className="text-right bg-sk4-light-gray px-2 py-1 rounded-sk4-soft group-hover:bg-sk4-orange group-hover:text-white transition-all duration-300">
          <span className="sk4-spotify-caption font-medium block">
            {Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}
          </span>
        </div>
      </div>

      {/* Comment - Spotify Pattern */}
      {wave.comment && (
        <div className="mb-sk4-md p-sk4-md bg-sk4-light-gray rounded-sk4-soft border-l-3 border-sk4-orange relative z-10 group-hover:shadow-sk4-soft transition-shadow duration-300">
          <p className="sk4-spotify-subtitle text-sk4-charcoal leading-relaxed line-clamp-2 italic">&ldquo;{wave.comment}&rdquo;</p>
        </div>
      )}

      {/* Mood - Spotify Pattern */}
      {wave.moodEmoji && (
        <div className="flex items-center space-x-sk4-sm mb-sk4-md p-sk4-md bg-sk4-light-gray rounded-sk4-soft relative z-10 group-hover:bg-sk4-orange/10 transition-all duration-300">
          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{wave.moodEmoji}</span>
          <span className="sk4-spotify-subtitle text-sk4-dark-gray">{wave.moodText}</span>
        </div>
      )}

      {/* Actions - Enhanced with better visual hierarchy */}
      <div className="flex items-center justify-between pt-sk4-md border-t border-sk4-gray/50 mt-auto relative z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-3 py-2 rounded-sk4-soft transition-all duration-300 ${
              isLiked
                ? 'bg-sk4-orange text-white shadow-sk4-soft'
                : 'text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-300 ${isLiked ? 'fill-current scale-110' : ''}`} />
            <span className="sk4-spotify-caption font-medium">{wave.likes}</span>
          </button>

          <button
            onClick={() => onComment?.(wave.id)}
            className="flex items-center space-x-2 px-3 py-2 rounded-sk4-soft text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sk4-spotify-caption font-medium">{wave.comments}</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center space-x-2 px-3 py-2 rounded-sk4-soft transition-all duration-300 ${
              isSaved
                ? 'bg-sk4-orange text-white shadow-sk4-soft'
                : 'text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange'
            }`}
          >
            <Bookmark className={`w-4 h-4 transition-transform duration-300 ${isSaved ? 'fill-current scale-110' : ''}`} />
            <span className="sk4-spotify-caption font-medium">{wave.saves}</span>
          </button>
        </div>

        <button
          onClick={() => onShare?.(wave.id)}
          className="p-2 rounded-sk4-soft text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-300"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}