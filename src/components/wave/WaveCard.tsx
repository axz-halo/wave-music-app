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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="space-y-4">
        {/* User Info */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={wave.user.profileImage || '/default-avatar.png'} 
              alt={wave.user.nickname}
              className="w-10 h-10 rounded-full"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">{wave.user.nickname}</p>
            <p className="text-xs text-gray-500">{formatTimeAgo(wave.timestamp)}</p>
          </div>
        </Link>

        {/* Music Info */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Link href={`/wave/${wave.id}`}>
              <img 
                src={wave.track.thumbnailUrl} 
                alt={wave.track.title}
                className="w-16 h-16 rounded-lg shadow-sm"
              />
            </Link>
            <button 
              onClick={() => onPlay(wave.track)}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-800 ml-0.5" />
              </div>
            </button>
          </div>
          <Link href={`/wave/${wave.id}`} className="flex-1">
            <h3 className="font-semibold text-gray-900 text-base">{wave.track.title}</h3>
            <p className="text-sm text-gray-600">{wave.track.artist}</p>
          </Link>
        </div>

        {/* Comment */}
        <Link href={`/wave/${wave.id}`} className="block">
          <p className="text-gray-700 text-sm leading-relaxed">{wave.comment}</p>
          <p className="text-xs text-gray-400 mt-1">댓글 달기: 카드 하단 말풍선 아이콘 클릭 • 이모지 반응: 하단 이모지 바</p>
        </Link>

        {/* Mood */}
        <Link href={`/wave/${wave.id}`} className="flex items-center space-x-2">
          <span className="text-2xl">{wave.moodEmoji}</span>
          <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700">
            {wave.moodText}
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-all hover:scale-105 ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{wave.likes}</span>
            </button>
            
            <button 
              onClick={() => onComment(wave.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 hover:scale-105 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{wave.comments}</span>
            </button>
            
            <button 
              onClick={handleSave}
              className={`flex items-center space-x-1 transition-all hover:scale-105 ${
                isSaved ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">{wave.saves}</span>
            </button>
          </div>
          {/* Emoji reactions (demo) */}
          <div className="hidden lg:flex items-center gap-1 text-xl">
            <button className="hover:scale-110 transition">👍</button>
            <button className="hover:scale-110 transition">🔥</button>
            <button className="hover:scale-110 transition">😭</button>
            <button className="hover:scale-110 transition">🎉</button>
          </div>
          
          <button 
            onClick={() => onShare(wave.id)}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            <Share className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
