'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Music, Play } from 'lucide-react';
import { Station } from '@/types';
import { IMAGE_URLS } from '@/lib/constants';
import Link from 'next/link';

interface StationFeedCardProps {
  station: Station;
  isLiked?: boolean; // 서버에서 받은 좋아요 상태
  currentUserId?: string | null; // 현재 사용자 ID (소유자 확인용)
  onLike?: (stationId: string) => Promise<{ isLiked: boolean; likeCount: number }>;
  onComment?: (stationId: string) => void;
  onShare?: (stationId: string) => void;
}

export default function StationFeedCard({ 
  station, 
  isLiked: initialIsLiked = false,
  currentUserId,
  onLike, 
  onComment, 
  onShare 
}: StationFeedCardProps) {
  // Check if current user is the owner
  const isOwner = currentUserId && station.user?.id === currentUserId;
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(station.likes || 0);
  const [commentCount, setCommentCount] = useState(station.comments || 0);

  // Update when station prop changes
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(station.likes || 0);
    setCommentCount(station.comments || 0);
  }, [initialIsLiked, station.likes, station.comments]);

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
      const result = await onLike(station.id);
      // Update with server response
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
      console.error('Failed to like station:', error);
    }
  };

  const handleComment = () => {
    onComment?.(station.id);
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
    <div className="sk4-spotify-wave-card p-sk4-md h-full flex flex-col h-[160px] sk4-fade-in group overflow-hidden relative">
      
      {/* Station Badge */}
      <div className="absolute top-2 right-2 z-20">
        <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-sk4-soft">
          <Music className="w-3 h-3" />
          <span>Station</span>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-md relative z-10">
        <div className="relative">
          <img
            src={station.user.profileImage || IMAGE_URLS.DEFAULT_AVATAR(station.user.nickname)}
            alt={station.user.nickname}
            className="w-9 h-9 rounded-full border-2 border-sk4-light-gray group-hover:border-sk4-orange transition-all duration-300 group-hover:scale-110"
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="sk4-spotify-subtitle block truncate group-hover:text-sk4-orange transition-colors duration-300">{station.user.nickname}</span>
          <span className="sk4-spotify-caption">{formatTimeAgo(station.sharedAt || station.createdAt)}</span>
        </div>
      </div>

      {/* Station Info */}
      <Link href={`/station/${station.id}`} className="flex items-center space-x-sk4-md mb-sk4-md cursor-pointer relative z-10 group/link">
        <div className="relative">
          <img
            src={station.thumbnailUrl || '/placeholder.png'}
            alt={station.title}
            className="w-20 h-20 rounded-lg object-cover shadow-sk4-soft group-hover/link:shadow-sk4-medium transition-all duration-300"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover/link:bg-opacity-40 rounded-lg transition-all duration-300">
            <Play className="w-8 h-8 text-white opacity-0 group-hover/link:opacity-100 transform scale-0 group-hover/link:scale-100 transition-all duration-300" fill="currentColor" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="sk4-spotify-title mb-0.5 truncate group-hover/link:text-sk4-orange transition-colors duration-300">{station.title}</h3>
          <p className="sk4-spotify-subtitle truncate group-hover/link:text-sk4-dark-gray transition-colors duration-300">{station.channelTitle}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="sk4-spotify-caption bg-sk4-light-gray px-2 py-0.5 rounded-full">
              {station.tracks?.length || 0}곡
            </span>
            {station.channelInfo && (
              <span className="sk4-spotify-caption text-sk4-dark-gray">
                {station.channelInfo.title}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Description (if exists) */}
      {station.description && (
        <div className="mb-sk4-md p-sk4-md bg-sk4-light-gray rounded-sk4-soft border-l-3 border-blue-500 relative z-10 group-hover:shadow-sk4-soft transition-shadow duration-300">
          <p className="sk4-spotify-subtitle text-sk4-charcoal leading-relaxed line-clamp-2 italic">&ldquo;{station.description}&rdquo;</p>
        </div>
      )}

      {/* Actions */}
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
            onClick={handleComment}
            className="flex items-center space-x-2 px-3 py-2 rounded-sk4-soft text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="sk4-spotify-caption font-medium">{commentCount}</span>
          </button>
        </div>

        {/* Share button - only show for owner (to unshare) */}
        {isOwner && onShare && (
          <button
            onClick={() => onShare(station.id)}
            className="p-2 rounded-sk4-soft text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-300"
            title="공유 취소"
          >
            <Share className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

