'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share, Play, ExternalLink } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { Wave } from '@/types';
import LPRecord from '@/components/music/LPRecord';
import CommentSheet from '@/components/wave/CommentSheet';
import { WaveService } from '@/services/waveService';
import { ensureSignedIn } from '@/lib/authSupa';
import toast from 'react-hot-toast';

export default function WaveDetailPage() {
  const params = useParams();
  const router = useRouter();
  const waveId = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  
  const [wave, setWave] = useState<Wave | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadWave = async () => {
      if (!supabase || !waveId) return;

      try {
        setIsLoading(true);

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || null;
        setCurrentUserId(userId);

        // Load wave data
        const { data: waveData, error } = await supabase
          .from('waves')
          .select(`
            *,
            user:profiles!waves_user_id_fkey(nickname, avatar_url)
          `)
          .eq('id', waveId)
          .single();

        if (error) {
          console.error('Error loading wave:', error);
          toast.error('Wave를 불러올 수 없습니다.');
          router.push('/feed');
          return;
        }

        if (waveData) {
          const wave: Wave = {
            id: waveData.id,
            user: {
              id: waveData.user_id,
              nickname: waveData.user?.nickname || '익명',
              profileImage: waveData.user?.avatar_url || '/default-avatar.png',
              followers: 0,
              following: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              email: '',
              preferences: {
                genres: [],
                notifications: { newWaves: true, comments: true, challenges: true },
              },
            },
            track: {
              id: waveData.track_info?.id || '',
              title: waveData.track_info?.title || 'Unknown',
              artist: waveData.track_info?.artist || 'Unknown',
              thumbnailUrl: waveData.track_info?.thumbnailUrl || '/placeholder.png',
              duration: waveData.track_info?.duration || 0,
              externalId: waveData.track_info?.externalId || '',
              platform: waveData.track_info?.platform || 'youtube',
            },
            comment: waveData.comment || '',
            moodEmoji: waveData.mood_emoji || null,
            moodText: waveData.mood_text || null,
            likes: waveData.likes || 0,
            comments: waveData.comments || 0,
            saves: waveData.saves || 0,
            shares: waveData.shares || 0,
            timestamp: waveData.created_at,
            isLiked: false, // Will be updated below
            isSaved: false, // Will be updated below
          };

          setWave(wave);
          setLikeCount(wave.likes);
          setSaveCount(wave.saves);

          // Check if user liked/saved this wave
          if (userId) {
            try {
              const [liked, saved] = await Promise.all([
                WaveService.checkLikeStatus(waveId, userId),
                WaveService.checkSaveStatus(waveId, userId)
              ]);
              setIsLiked(liked);
              setIsSaved(saved);
            } catch (error) {
              console.error('Error checking like/save status:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading wave:', error);
        toast.error('Wave를 불러오는 중 오류가 발생했습니다.');
        router.push('/feed');
      } finally {
        setIsLoading(false);
      }
    };

    loadWave();
  }, [waveId, router]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const previousIsLiked = isLiked;
    const previousCount = likeCount;
    const newIsLiked = !isLiked;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    const newCount = newIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLikeCount(newCount);
    
    try {
      await WaveService.toggleLike(waveId, currentUserId);
    } catch (error) {
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
      console.error('Failed to like wave:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleSave = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const previousIsSaved = isSaved;
    const previousCount = saveCount;
    const newIsSaved = !isSaved;
    
    // Optimistic update
    setIsSaved(newIsSaved);
    const newCount = newIsSaved ? saveCount + 1 : Math.max(0, saveCount - 1);
    setSaveCount(newCount);
    
    try {
      await WaveService.toggleSave(waveId, currentUserId);
    } catch (error) {
      // Revert on error
      setIsSaved(previousIsSaved);
      setSaveCount(previousCount);
      console.error('Failed to save wave:', error);
      toast.error('저장 처리에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    if (!wave) return;

    const shareUrl = `${window.location.origin}/wave/${wave.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wave.user.nickname}님이 공유한 Wave`,
          text: `${wave.track.title} - ${wave.track.artist}`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('링크가 클립보드에 복사되었습니다!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        toast.error('링크 복사에 실패했습니다.');
      }
    }
  };

  const handlePlay = () => {
    if (!wave) return;
    // Play functionality can be implemented here
    toast.success('재생 기능은 곧 추가됩니다!');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sk4-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Wave를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!wave) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Wave를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/feed')}
            className="btn-primary"
          >
            피드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Wave 상세</h1>
          </div>
        </div>
      </div>

      {/* Wave Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6">
            <img
              src={wave.user.profileImage}
              alt={wave.user.nickname}
              className="w-12 h-12 rounded-full border-2 border-gray-200"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{wave.user.nickname}</h2>
              <p className="text-sm text-gray-500">{formatTimeAgo(wave.timestamp)}</p>
            </div>
          </div>

          {/* Music Info */}
          <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="relative">
              <LPRecord
                src={wave.track.thumbnailUrl}
                alt={wave.track.title}
                size="lg"
                onPlay={handlePlay}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all duration-300 cursor-pointer">
                <div className="transform scale-0 hover:scale-100 transition-transform duration-300">
                  <Play className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{wave.track.title}</h3>
              <p className="text-gray-600 mb-2">{wave.track.artist}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{Math.floor(wave.track.duration / 60)}:{String(wave.track.duration % 60).padStart(2, '0')}</span>
                <span className="flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>{wave.track.platform}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Comment */}
          {wave.comment && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-sk4-orange">
              <p className="text-gray-800 leading-relaxed">&ldquo;{wave.comment}&rdquo;</p>
            </div>
          )}

          {/* Mood */}
          {wave.moodEmoji && (
            <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{wave.moodEmoji}</span>
              <span className="text-gray-700">{wave.moodText}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isLiked
                    ? 'bg-sk4-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likeCount}</span>
              </button>

              <button
                onClick={() => setIsCommentSheetOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">{wave.comments}</span>
              </button>

              <button
                onClick={handleSave}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isSaved
                    ? 'bg-sk4-orange text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                <span className="font-medium">{saveCount}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
            >
              <Share className="w-4 h-4" />
              <span className="font-medium">공유</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comment Sheet */}
      <CommentSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        waveId={waveId}
        onAfterSubmit={() => {
          // Refresh comment count
          setWave(prev => prev ? { ...prev, comments: (prev.comments || 0) + 1 } : null);
        }}
      />
    </div>
  );
}