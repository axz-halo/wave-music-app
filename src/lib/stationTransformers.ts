import { Station, User, TrackInfo } from '@/types';
import { StationPlaylist, StationTrack } from '@/services/stationService';

/**
 * StationPlaylist를 Station 타입으로 변환
 */
export function transformStationPlaylist(playlist: StationPlaylist): Station {
  // User 변환
  const user: User = {
    id: playlist.user?.id || playlist.user_id,
    nickname: playlist.user?.nickname || '익명',
    profileImage: playlist.user?.avatar_url || undefined,
    email: '', // StationPlaylist에는 email 정보 없음
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

  // Tracks 변환
  const tracks: TrackInfo[] = (playlist.tracks || []).map((track: StationTrack) => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    platform: 'youtube' as const,
    externalId: track.id,
    thumbnailUrl: track.thumbnail_url,
    duration: track.duration || 0,
  }));

  // Station 객체 생성
  const station: Station = {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description,
    user,
    tracks,
    thumbnailUrl: playlist.thumbnail_url,
    channelTitle: playlist.channel_title,
    channelId: playlist.channel_id,
    channelInfo: playlist.channel_info ? {
      title: playlist.channel_info.title,
      profileImage: playlist.channel_info.profileImage,
      subscriberCount: typeof playlist.channel_info.subscriberCount === 'string' 
        ? parseInt(playlist.channel_info.subscriberCount, 10) 
        : playlist.channel_info.subscriberCount,
      videoCount: typeof playlist.channel_info.videoCount === 'string'
        ? parseInt(playlist.channel_info.videoCount, 10)
        : playlist.channel_info.videoCount,
    } : undefined,
    isShared: playlist.is_shared || false,
    sharedAt: playlist.shared_at,
    likes: playlist.likes || 0,
    comments: playlist.comments || 0,
    shares: playlist.shares || 0,
    createdAt: playlist.created_at,
    updatedAt: playlist.created_at, // StationPlaylist에는 updated_at 없음
  };

  return station;
}

/**
 * 여러 StationPlaylist를 Station 배열로 변환
 */
export function transformStationPlaylists(playlists: StationPlaylist[]): Station[] {
  return playlists.map(transformStationPlaylist);
}



