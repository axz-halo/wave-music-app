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
    <div className="bg-sk4-white border border-sk4-gray p-sk4-md hover:border-sk4-medium-gray sk4-interactive h-full flex flex-col min-h-[220px] sm:min-h-[240px] sk4-slide-in">
      {/* User Info - Compact */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
        <img 
          src={wave.user.profileImage || '/default-avatar.png'} 
          alt={wave.user.nickname}
          className="w-6 h-6 rounded-full border border-sk4-gray"
        />
        <span className="sk4-text-base font-medium">{wave.user.nickname}</span>
        <span className="sk4-text-xs text-sk4-dark-gray">•</span>
        <span className="sk4-text-xs text-sk4-dark-gray">{formatTimeAgo(wave.timestamp)}</span>
      </div>

      {/* Music Info - Horizontal Layout */}
      <div className="flex items-center space-x-sk4-md mb-sk4-sm">
        <LPRecord
          src={wave.track.thumbnailUrl}
          alt={wave.track.title}
          size="sm"
          onPlay={() => onPlay?.(wave.track.id)}
        />
        <div className="flex-1 min-w-0">
          <h3 className="sk4-text-lg font-medium truncate">{wave.track.title}</h3>
          <p className="sk4-text-sm text-sk4-dark-gray truncate">{wave.track.artist}</p>
        </div>
        <span className="sk4-text-xs text-sk4-dark-gray">{Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}</span>
      </div>

      {/* Comment - Only if exists */}
      {wave.comment && (
        <p className="sk4-text-sm text-sk4-charcoal mb-sk4-sm leading-relaxed line-clamp-2">{wave.comment}</p>
      )}

      {/* Mood - Inline with comment */}
      {wave.moodEmoji && (
        <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
          <span className="text-lg">{wave.moodEmoji}</span>
          <span className="sk4-text-xs text-sk4-dark-gray">{wave.moodText}</span>
        </div>
      )}

      {/* Actions - Simplified */}
      <div className="flex items-center justify-between pt-sk4-sm border-t border-sk4-light-gray mt-auto">
        <div className="flex items-center space-x-sk4-md">
          <button 
            onClick={handleLike}
            className={`sk4-btn flex items-center space-x-1 px-2 py-1 rounded ${
              isLiked 
                ? 'bg-sk4-orange bg-opacity-10 text-sk4-orange sk4-pulse' 
                : 'text-sk4-dark-gray hover:bg-sk4-light-gray'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs">{wave.likes}</span>
          </button>
          
          <button 
            onClick={() => onComment?.(wave.id)}
            className="sk4-btn flex items-center space-x-1 px-2 py-1 rounded text-sk4-dark-gray hover:bg-sk4-light-gray"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sk4-text-xs">{wave.comments}</span>
          </button>
          
          <button 
            onClick={handleSave}
            className={`sk4-btn flex items-center space-x-1 px-2 py-1 rounded ${
              isSaved 
                ? 'bg-sk4-orange bg-opacity-10 text-sk4-orange sk4-pulse' 
                : 'text-sk4-dark-gray hover:bg-sk4-light-gray'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs">{wave.saves}</span>
          </button>
        </div>
        
        <button 
          onClick={() => onShare?.(wave.id)}
          className="sk4-btn p-1 text-sk4-dark-gray hover:bg-sk4-light-gray rounded"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}