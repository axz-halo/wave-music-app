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
    <div className="bg-sk4-white border border-sk4-gray p-sk4-md hover:border-sk4-orange hover:shadow-sm sk4-interactive h-full flex flex-col min-h-[240px] sm:min-h-[260px] sk4-slide-in group">
      {/* User Info - Enhanced */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-md">
        <img
          src={wave.user.profileImage || '/default-avatar.png'}
          alt={wave.user.nickname}
          className="w-8 h-8 rounded-full border-2 border-sk4-light-gray group-hover:border-sk4-orange transition-colors duration-200"
        />
        <div className="flex-1 min-w-0">
          <span className="sk4-text-base font-medium text-sk4-charcoal block truncate">{wave.user.nickname}</span>
          <span className="sk4-text-xs text-sk4-medium-gray">{formatTimeAgo(wave.timestamp)}</span>
        </div>
      </div>

      {/* Music Info - Enhanced Layout */}
      <div className="flex items-center space-x-sk4-md mb-sk4-md cursor-pointer" onClick={() => onPlay?.(wave.track.id)}>
        <div className="relative">
          <LPRecord
            src={wave.track.thumbnailUrl}
            alt={wave.track.title}
            size="md"
            onPlay={() => onPlay?.(wave.track.id)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all duration-200">
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="currentColor" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="sk4-text-lg font-semibold text-sk4-charcoal mb-1 truncate group-hover:text-sk4-orange transition-colors duration-200">{wave.track.title}</h3>
          <p className="sk4-text-sm text-sk4-medium-gray truncate">{wave.track.artist}</p>
        </div>
        <div className="text-right">
          <span className="sk4-text-xs text-sk4-medium-gray block">
            {Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}
          </span>
        </div>
      </div>

      {/* Comment - Enhanced */}
      {wave.comment && (
        <div className="mb-sk4-md p-sk4-sm bg-sk4-off-white rounded-lg border-l-2 border-sk4-orange">
          <p className="sk4-text-sm text-sk4-charcoal leading-relaxed line-clamp-2">{wave.comment}</p>
        </div>
      )}

      {/* Mood - Enhanced */}
      {wave.moodEmoji && (
        <div className="flex items-center space-x-sk4-sm mb-sk4-md p-sk4-sm bg-sk4-light-gray rounded-lg">
          <span className="text-xl">{wave.moodEmoji}</span>
          <span className="sk4-text-sm text-sk4-dark-gray font-medium">{wave.moodText}</span>
        </div>
      )}

      {/* Actions - Enhanced with better visual hierarchy */}
      <div className="flex items-center justify-between pt-sk4-md border-t border-sk4-light-gray mt-auto">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLike}
            className={`sk4-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              isLiked
                ? 'bg-sk4-orange text-white shadow-sm'
                : 'text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs font-medium">{wave.likes}</span>
          </button>

          <button
            onClick={() => onComment?.(wave.id)}
            className="sk4-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sk4-text-xs font-medium">{wave.comments}</span>
          </button>

          <button
            onClick={handleSave}
            className={`sk4-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              isSaved
                ? 'bg-sk4-orange text-white shadow-sm'
                : 'text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs font-medium">{wave.saves}</span>
          </button>
        </div>

        <button
          onClick={() => onShare?.(wave.id)}
          className="sk4-btn p-2 text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange rounded-full transition-all duration-200"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}