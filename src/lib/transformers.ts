import { Wave, User, TrackInfo } from '@/types';
import { WaveData } from '@/services/waveService';
import { AuthService } from '@/services/authService';
import { IMAGE_URLS } from '@/lib/constants';

/**
 * Transform raw wave data from database to Wave type
 */
export async function transformWaveData(waves: WaveData[]): Promise<Wave[]> {
  if (!waves || waves.length === 0) {
    return [];
  }

  // Extract unique user IDs
  const userIds = Array.from(new Set(waves.map(w => w.user_id).filter(Boolean)));
  
  // Batch fetch user profiles
  const userMap = await AuthService.getProfiles(userIds);

  // Transform waves with user data
  return waves.map(wave => transformSingleWave(wave, userMap));
}

/**
 * Transform a single wave with optional user map for performance
 */
export function transformSingleWave(
  wave: WaveData, 
  userMap?: Map<string, User>
): Wave {
  const defaultUser: User = {
    id: wave.user_id || '00000000-0000-0000-0000-000000000000',
    nickname: '사용자',
    profileImage: IMAGE_URLS.DEFAULT_AVATAR('Unknown'),
    email: '',
    followers: 0,
    following: 0,
    preferences: {
      genres: [],
      notifications: {
        newWaves: true,
        comments: true,
        challenges: true,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const user = userMap?.get(wave.user_id) || defaultUser;

  const track: TrackInfo = {
    id: wave.track_info?.id || wave.track_info?.externalId || 'unknown',
    title: wave.track_info?.title || 'Unknown',
    artist: wave.track_info?.artist || '',
    platform: (wave.track_info?.platform as 'youtube' | 'apple' | 'spotify') || 'youtube',
    externalId: wave.track_info?.externalId || '',
    thumbnailUrl: wave.track_info?.thumbnailUrl || `https://img.youtube.com/vi/${wave.track_info?.externalId}/mqdefault.jpg`,
    duration: wave.track_info?.duration || 0,
  };

  return {
    id: wave.id,
    user,
    track,
    comment: wave.comment || '',
    moodEmoji: wave.mood_emoji || '',
    moodText: wave.mood_text || '',
    timestamp: wave.created_at,
    likes: wave.likes || 0,
    comments: wave.comments || 0,
    saves: wave.saves || 0,
    shares: wave.shares || 0,
  };
}

/**
 * Format time ago helper
 */
export function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  return `${Math.floor(diffInSeconds / 31536000)}년 전`;
}

/**
 * Format numbers with K/M suffix
 */
export function formatNumber(num: string | number): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  
  if (isNaN(n)) return '0';
  
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1) + 'M';
  } else if (n >= 1000) {
    return (n / 1000).toFixed(1) + 'K';
  }
  return n.toString();
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get YouTube thumbnail URL with fallback sizes
 */
export function getYouTubeThumbnail(
  videoId: string, 
  size: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'
): string {
  const sizes = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };
  
  return `https://img.youtube.com/vi/${videoId}/${sizes[size]}.jpg`;
}

