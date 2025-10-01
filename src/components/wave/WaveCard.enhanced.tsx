'use client';

import { useState, useCallback, memo } from 'react';
import { Heart, MessageCircle, Bookmark, Share, Play } from 'lucide-react';
import { Wave } from '@/types';
import LPRecord from '@/components/music/LPRecord';
import { formatTimeAgo, formatDuration } from '@/lib/transformers';

interface WaveCardProps {
  wave: Wave;
  onLike?: (waveId: string) => void;
  onComment?: (waveId: string) => void;
  onSave?: (waveId: string) => void;
  onShare?: (waveId: string) => void;
  onPlay?: (trackId: string) => void;
}

function WaveCard({ 
  wave, 
  onLike, 
  onComment, 
  onSave, 
  onShare, 
  onPlay 
}: WaveCardProps) {
  const [isLiked, setIsLiked] = useState(wave.isLiked || false);
  const [isSaved, setIsSaved] = useState(wave.isSaved || false);

  const handleLike = useCallback(() => {
    setIsLiked(prev => !prev);
    onLike?.(wave.id);
  }, [wave.id, onLike]);

  const handleSave = useCallback(() => {
    setIsSaved(prev => !prev);
    onSave?.(wave.id);
  }, [wave.id, onSave]);

  const handleComment = useCallback(() => {
    onComment?.(wave.id);
  }, [wave.id, onComment]);

  const handleShare = useCallback(() => {
    onShare?.(wave.id);
  }, [wave.id, onShare]);

  const handlePlay = useCallback(() => {
    onPlay?.(wave.track.id);
  }, [wave.track.id, onPlay]);

  return (
    <div className="bg-sk4-white border border-sk4-gray p-sk4-md hover:border-sk4-orange hover:shadow-sm sk4-interactive h-full flex flex-col min-h-[240px] sm:min-h-[260px] sk4-slide-in group">
      {/* User Info */}
      <div className="flex items-center space-x-sk4-sm mb-sk4-md">
        <img
          src={wave.user.profileImage || '/default-avatar.png'}
          alt={wave.user.nickname}
          className="w-8 h-8 rounded-full border-2 border-sk4-light-gray group-hover:border-sk4-orange transition-colors duration-200"
        />
        <div className="flex-1 min-w-0">
          <span className="sk4-text-base font-medium text-sk4-charcoal block truncate">
            {wave.user.nickname}
          </span>
          <span className="sk4-text-xs text-sk4-medium-gray">
            {formatTimeAgo(wave.timestamp)}
          </span>
        </div>
      </div>

      {/* Music Info */}
      <div 
        className="flex items-center space-x-sk4-md mb-sk4-md cursor-pointer" 
        onClick={handlePlay}
      >
        <div className="relative">
          <LPRecord
            src={wave.track.thumbnailUrl}
            alt={wave.track.title}
            size="md"
            onPlay={handlePlay}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all duration-200">
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="currentColor" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="sk4-text-lg font-semibold text-sk4-charcoal mb-1 truncate group-hover:text-sk4-orange transition-colors duration-200">
            {wave.track.title}
          </h3>
          <p className="sk4-text-sm text-sk4-medium-gray truncate">
            {wave.track.artist}
          </p>
        </div>
        <div className="text-right">
          <span className="sk4-text-xs text-sk4-medium-gray block">
            {formatDuration(wave.track.duration || 0)}
          </span>
        </div>
      </div>

      {/* Comment */}
      {wave.comment && (
        <div className="mb-sk4-md p-sk4-sm bg-sk4-off-white rounded-lg border-l-2 border-sk4-orange">
          <p className="sk4-text-sm text-sk4-charcoal leading-relaxed line-clamp-2">
            {wave.comment}
          </p>
        </div>
      )}

      {/* Mood */}
      {wave.moodEmoji && (
        <div className="flex items-center space-x-sk4-sm mb-sk4-md p-sk4-sm bg-sk4-light-gray rounded-lg">
          <span className="text-xl">{wave.moodEmoji}</span>
          <span className="sk4-text-sm text-sk4-dark-gray font-medium">
            {wave.moodText}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-sk4-md border-t border-sk4-light-gray mt-auto">
        <div className="flex items-center space-x-1">
          <button
            onClick={handleLike}
            className={`sk4-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              isLiked
                ? 'bg-sk4-orange text-white shadow-sm'
                : 'text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange'
            }`}
            aria-label={isLiked ? '좋아요 취소' : '좋아요'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs font-medium">{wave.likes}</span>
          </button>

          <button
            onClick={handleComment}
            className="sk4-btn flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange transition-all duration-200"
            aria-label="댓글"
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
            aria-label={isSaved ? '저장 취소' : '저장'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="sk4-text-xs font-medium">{wave.saves}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="sk4-btn p-2 text-sk4-medium-gray hover:bg-sk4-off-white hover:text-sk4-orange rounded-full transition-all duration-200"
          aria-label="공유"
        >
          <Share className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(WaveCard, (prevProps, nextProps) => {
  return (
    prevProps.wave.id === nextProps.wave.id &&
    prevProps.wave.likes === nextProps.wave.likes &&
    prevProps.wave.comments === nextProps.wave.comments &&
    prevProps.wave.saves === nextProps.wave.saves &&
    prevProps.wave.shares === nextProps.wave.shares &&
    prevProps.wave.isLiked === nextProps.wave.isLiked &&
    prevProps.wave.isSaved === nextProps.wave.isSaved
  );
});

