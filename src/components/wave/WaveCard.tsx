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
    <div className="sk4-feed-card sk4-spacing-md sk4-border-thin">
      <div className="space-y-sk4-md">
        {/* User Info */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-sk4-md">
          <img 
            src={wave.user.profileImage || '/default-avatar.png'} 
            alt={wave.user.nickname}
            className="sk4-user-avatar"
          />
          <div className="flex-1">
            <p className="sk4-text-username">{wave.user.nickname}</p>
            <p className="sk4-text-timestamp">{formatTimeAgo(wave.timestamp)}</p>
          </div>
        </Link>

        {/* Music Info */}
        <div className="flex items-center space-x-sk4-md">
          <LPRecord
            src={wave.track.thumbnailUrl}
            alt={wave.track.title}
            size="md"
            onPlay={() => onPlay?.(wave.track.id)}
          />
          <div className="flex-1">
            <h3 className="sk4-text-track-title">{wave.track.title}</h3>
            <p className="sk4-text-artist">{wave.track.artist}</p>
            <p className="sk4-text-timestamp">{Math.floor((wave.track.duration||0)/60)}:{String((wave.track.duration||0)%60).padStart(2,'0')}</p>
          </div>
        </div>

        {/* Comment */}
        {wave.comment && (
          <p className="sk4-text-base text-sk4-charcoal">{wave.comment}</p>
        )}

        {/* Mood */}
        {wave.moodEmoji && (
          <div className="flex items-center space-x-sk4-sm">
            <span className="text-2xl">{wave.moodEmoji}</span>
            <span className="sk4-text-sm text-sk4-dark-gray">{wave.moodText}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-sk4-sm">
          <div className="flex items-center space-x-sk4-lg">
            <button 
              onClick={handleLike}
              className={`sk4-action-button ${isLiked ? 'active' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-sk4-orange' : 'text-sk4-dark-gray'}`} />
            </button>
            
            <button 
              onClick={() => onComment?.(wave.id)}
              className="sk4-action-button"
            >
              <MessageCircle className="w-4 h-4 text-sk4-dark-gray" />
            </button>
            
            <button 
              onClick={handleSave}
              className={`sk4-action-button ${isSaved ? 'active' : ''}`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-sk4-orange' : 'text-sk4-dark-gray'}`} />
            </button>
          </div>
          
          <button 
            onClick={() => onShare?.(wave.id)}
            className="sk4-action-button"
          >
            <Share className="w-4 h-4 text-sk4-dark-gray" />
          </button>
        </div>
      </div>
    </div>
  );
}