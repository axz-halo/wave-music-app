'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share, Play } from 'lucide-react';
import { Wave, TrackInfo } from '@/types';

interface WaveCardProps {
  wave: Wave;
  onLike: (waveId: string) => void;
  onComment: (waveId: string) => void;
  onSave: (waveId: string) => void;
  onShare: (waveId: string) => void;
  onPlay: (track: TrackInfo) => void;
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
    onLike(wave.id);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave(wave.id);
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
    <div className="wave-card p-5 fade-in">
      <div className="space-y-4">
        {/* User Info */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={wave.user.profileImage || '/default-avatar.png'} 
              alt={wave.user.nickname}
              className="w-12 h-12 rounded-full shadow-tactile"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-tactile"></div>
          </div>
          <div className="flex-1">
            <p className="text-hierarchy font-medium">{wave.user.nickname}</p>
            <p className="text-muted">{formatTimeAgo(wave.timestamp)}</p>
          </div>
        </Link>

        {/* Music Info */}
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Link href={`/wave/${wave.id}`}>
              <img 
                src={wave.track.thumbnailUrl} 
                alt={wave.track.title}
                className="w-20 h-20 rounded-medium shadow-tactile"
              />
            </Link>
            <button 
              onClick={() => onPlay(wave.track)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-medium opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-tactile">
                <Play className="w-5 h-5 text-neutral-800 ml-0.5" />
              </div>
            </button>
          </div>
          <Link href={`/wave/${wave.id}`} className="flex-1">
            <h3 className="text-hierarchy-lg font-semibold">{wave.track.title}</h3>
            <p className="text-muted">{wave.track.artist}</p>
          </Link>
        </div>

        {/* Comment */}
        <Link href={`/wave/${wave.id}`} className="block">
          <p className="text-neutral-700 text-sm leading-relaxed">{wave.comment}</p>
          <p className="text-xs text-neutral-400 mt-2">댓글 달기: 카드 하단 말풍선 아이콘 클릭 • 이모지 반응: 하단 이모지 바</p>
        </Link>

        {/* Mood */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-3">
          <span className="text-3xl">{wave.moodEmoji}</span>
          <span className="bg-surface-200 px-4 py-2 rounded-medium text-sm font-medium text-neutral-700 shadow-neumorphic-inset">
            {wave.moodText}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200/50">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                isLiked ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{wave.likes}</span>
            </button>
            
            <button 
              onClick={() => onComment(wave.id)}
              className="flex items-center space-x-2 text-neutral-500 hover:text-primary-500 transition-all duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{wave.comments}</span>
            </button>
            
            <button 
              onClick={handleSave}
              className={`flex items-center space-x-2 transition-all duration-200 ${
                isSaved ? 'text-primary-500' : 'text-neutral-500 hover:text-primary-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{wave.saves}</span>
            </button>
          </div>
          
          {/* Emoji reactions */}
          <div className="flex items-center gap-2">
            <button className="reaction-dot text-lg hover:scale-110 transition-all duration-200">👍</button>
            <button className="reaction-dot text-lg hover:scale-110 transition-all duration-200">🔥</button>
            <button className="reaction-dot text-lg hover:scale-110 transition-all duration-200">😭</button>
            <button className="reaction-dot text-lg hover:scale-110 transition-all duration-200">🎉</button>
          </div>
          
          <button 
            onClick={() => onShare(wave.id)}
            className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile"
          >
            <Share className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
