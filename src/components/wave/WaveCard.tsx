'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, Share, Play, Trash2 } from 'lucide-react';
import { Wave } from '@/types';
import LPRecord from '@/components/music/LPRecord';

interface WaveCardProps {
  wave: Wave;
  onLike?: (waveId: string) => void;
  onComment?: (waveId: string) => void;
  onSave?: (waveId: string) => void;
  onShare?: (waveId: string) => void;
  onPlay?: (trackId: string) => void;
  onDelete?: (waveId: string) => void;
  currentUserId?: string; // 현재 로그인한 사용자 ID
}

export default function WaveCard({ 
  wave, 
  onLike, 
  onComment, 
  onSave, 
  onShare, 
  onPlay,
  onDelete,
  currentUserId
}: WaveCardProps) {
  const [isLiked, setIsLiked] = useState(wave.isLiked || false);
  const [isSaved, setIsSaved] = useState(wave.isSaved || false);
  const [likeCount, setLikeCount] = useState(wave.likes || 0);
  const [saveCount, setSaveCount] = useState(wave.saves || 0);

  // Sync local state with wave props
  useEffect(() => {
    setIsLiked(wave.isLiked || false);
    setIsSaved(wave.isSaved || false);
    setLikeCount(wave.likes || 0);
    setSaveCount(wave.saves || 0);
  }, [wave.isLiked, wave.isSaved, wave.likes, wave.saves]);

  const handleLike = async () => {
    if (!onLike) return;

    const previousIsLiked = isLiked;
    const previousCount = likeCount;
    const newIsLiked = !isLiked;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLikeCount(newCount);
    
    try {
      await onLike(wave.id);
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
      console.error('Failed to like wave:', error);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    const previousIsSaved = isSaved;
    const previousCount = saveCount;
    const newIsSaved = !isSaved;
    
    // Optimistic update
    setIsSaved(newIsSaved);
    const newCount = newIsSaved ? saveCount + 1 : Math.max(0, saveCount - 1);
    setSaveCount(newCount);
    
    try {
      await onSave(wave.id);
    } catch (error) {
      // Revert on error
      setIsSaved(previousIsSaved);
      setSaveCount(previousCount);
      console.error('Failed to save wave:', error);
    }
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
    <div className="sk4-spotify-wave-card p-sk4-md h-full flex flex-col min-h-[160px] sk4-fade-in group overflow-hidden relative">
      {/* Wave ID for debugging */}
      <div className="absolute top-2 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
        ID: {wave.id.slice(0, 8)}
      </div>
      
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
          <Link href={`/wave/${wave.id}`} className="block">
            <span className="sk4-spotify-subtitle block truncate group-hover:text-sk4-orange transition-colors duration-300 cursor-pointer">{wave.user.nickname}</span>
          </Link>
          <span className="sk4-spotify-caption">{formatTimeAgo(wave.timestamp)}</span>
        </div>
      </div>

      {/* Music Info - Enhanced Layout */}
      <div className="flex items-center space-x-sk4-md mb-sk4-md cursor-pointer relative z-10" onClick={() => {
        console.log('WaveCard play clicked:', {
          trackId: wave.track.id,
          externalId: wave.track.externalId,
          platform: wave.track.platform,
          title: wave.track.title,
          artist: wave.track.artist
        });
        onPlay?.(wave.track.id);
      }}>
        <div className="relative group/play">
          <LPRecord
            src={wave.track.thumbnailUrl}
            alt={wave.track.title}
            size="md"
            onPlay={() => {
              console.log('LPRecord play clicked:', {
                trackId: wave.track.id,
                externalId: wave.track.externalId,
                platform: wave.track.platform
              });
              onPlay?.(wave.track.id);
            }}
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
            <span className="sk4-spotify-caption font-medium">{likeCount}</span>
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
            <span className="sk4-spotify-caption font-medium">{saveCount}</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onShare?.(wave.id)}
            className="p-2 rounded-sk4-soft text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-300"
          >
            <Share className="w-4 h-4" />
          </button>
          
          {/* Delete button - only show for wave owner */}
          {onDelete && currentUserId && wave.user?.id === currentUserId && (
            <button
              onClick={() => {
                if (window.confirm('정말로 이 Wave를 삭제하시겠습니까?')) {
                  onDelete(wave.id);
                }
              }}
              className="p-2 rounded-sk4-soft text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}