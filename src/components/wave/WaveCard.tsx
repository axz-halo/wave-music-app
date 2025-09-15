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
    <div className="bg-cream-50 rounded-large p-4 shadow-soft border border-cream-200 fade-in hover:shadow-tactile transition-all duration-200">
      <div className="space-y-3">
        {/* User Info */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-3">
          <img 
            src={wave.user.profileImage || '/default-avatar.png'} 
            alt={wave.user.nickname}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-beige-800">{wave.user.nickname}</p>
            <p className="text-xs text-beige-600">{formatTimeAgo(wave.timestamp)}</p>
          </div>
        </Link>

        {/* Music Info with LP Record */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Link href={`/wave/${wave.id}`}>
              <img 
                src={wave.track.thumbnailUrl} 
                alt={wave.track.title}
                className="w-12 h-12 rounded-full object-cover shadow-tactile"
              />
            </Link>
            <button 
              onClick={() => onPlay(wave.track)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-3 h-3 text-beige-800 ml-0.5" />
              </div>
            </button>
          </div>
          <Link href={`/wave/${wave.id}`} className="flex-1">
            <h3 className="text-sm font-semibold text-beige-800 truncate">{wave.track.title}</h3>
            <p className="text-xs text-beige-600 truncate">{wave.track.artist}</p>
          </Link>
        </div>

        {/* Comment */}
        <Link href={`/wave/${wave.id}`} className="block">
          <p className="text-sm text-beige-700 leading-relaxed">{wave.comment}</p>
        </Link>

        {/* Mood */}
        <div className="flex items-center space-x-2">
          <span className="text-lg">{wave.moodEmoji}</span>
          <span className="text-xs text-beige-600 bg-cream-200 px-2 py-1 rounded-medium">
            {wave.moodText}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-cream-200">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-all duration-200 ${
                isLiked ? 'text-red-500' : 'text-beige-600 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{wave.likes}</span>
            </button>
            
            <button 
              onClick={() => onComment(wave.id)}
              className="flex items-center space-x-1 text-beige-600 hover:text-primary-500 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs font-medium">{wave.comments}</span>
            </button>
            
            <button 
              onClick={handleSave}
              className={`flex items-center space-x-1 transition-all duration-200 ${
                isSaved ? 'text-primary-500' : 'text-beige-600 hover:text-primary-500'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{wave.saves}</span>
            </button>
          </div>
          
          <button 
            onClick={() => onShare(wave.id)}
            className="w-8 h-8 bg-cream-200 rounded-full flex items-center justify-center hover:bg-cream-300 transition-all duration-200"
          >
            <Share className="w-4 h-4 text-beige-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
