import supabase from '@/lib/supabaseClient';
import { AuthService } from './authService';
import { AnalyticsService } from './analyticsService';

export interface StationTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: number;
  youtube_url?: string;
  timestamp?: string;
  video_type?: string;
}

export interface StationPlaylist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url: string;
  channel_title: string;
  channel_id?: string;
  channel_info?: {
    title: string;
    profileImage: string;
    subscriberCount: string | number;
    videoCount: string | number;
  };
  tracks: StationTrack[];
  is_shared?: boolean;
  shared_at?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  created_at: string;
  slug: string;
  user?: {
    id: string;
    nickname: string;
    avatar_url: string | null;
  };
}

export class StationService {
  static async getPlaylists(): Promise<StationPlaylist[]> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('station_playlists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch playlists: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(data.map((p: any) => p.user_id).filter(Boolean)));
    
    // Batch fetch user profiles
    const userMap = await AuthService.getProfiles(userIds);

    // Map playlists with user data
    const playlists: StationPlaylist[] = data.map((playlist: any) => {
      const userProfile = userMap.get(playlist.user_id);
      
      return {
        ...playlist,
        user: userProfile ? {
          id: userProfile.id,
          nickname: userProfile.nickname,
          avatar_url: userProfile.profileImage || null,
        } : {
          id: playlist.user_id,
          nickname: '익명',
          avatar_url: null,
        },
      };
    });

    return playlists;
  }

  static async getPlaylistById(playlistId: string): Promise<StationPlaylist | null> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('station_playlists')
      .select('*')
      .eq('id', playlistId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch playlist: ${error.message}`);
    }

    if (!data) return null;

    // Fetch user profile
    const userMap = await AuthService.getProfiles([data.user_id]);
    const userProfile = userMap.get(data.user_id);

    return {
      ...data,
      user: userProfile ? {
        id: userProfile.id,
        nickname: userProfile.nickname,
        avatar_url: userProfile.profileImage || null,
      } : {
        id: data.user_id,
        nickname: '익명',
        avatar_url: null,
      },
    } as StationPlaylist;
  }

  static async uploadStation(data: {
    url: string;
    type: 'video' | 'playlist';
    preview: any;
    extractComments?: boolean; // 댓글 추출 옵션 추가
  }): Promise<{ 
    success: boolean; 
    message?: string;
    tracksCount?: number;
    playlist?: any;
    type?: string;
  }> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Authentication required');
    }

    // Use the new v2 endpoint for immediate processing
    const response = await fetch('/api/station/upload-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        ...data,
        extractComments: data.extractComments || false, // 댓글 추출 옵션 전달
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    // 로그 기록
    if (result.playlist?.id && session.data.session?.user?.id) {
      await AnalyticsService.logStationUpload(
        session.data.session.user.id, 
        result.playlist.id,
        result.tracksCount
      );
    }

    return result;
  }

  /**
   * Station 삭제하기
   */
  static async deleteStation(playlistId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Station 소유자 확인
    const { data: station, error: fetchError } = await supabase
      .from('station_playlists')
      .select('user_id')
      .eq('id', playlistId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch station: ${fetchError.message}`);
    }

    if (!station || station.user_id !== userId) {
      throw new Error('You can only delete your own stations');
    }

    // Station 삭제
    const { error } = await supabase
      .from('station_playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete station: ${error.message}`);
    }

    // Analytics 로깅
    await AnalyticsService.logActivity({
      userId,
      actionType: 'station_delete',
      targetType: 'station',
      targetId: playlistId,
    });
  }

  /**
   * Station 공유하기
   */
  static async shareStation(playlistId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('station_playlists')
      .update({
        is_shared: true,
        shared_at: new Date().toISOString(),
      })
      .eq('id', playlistId)
      .eq('user_id', userId); // 본인 Station만 공유 가능

    if (error) {
      throw new Error(`Failed to share station: ${error.message}`);
    }

    // 로그 기록
    await AnalyticsService.logStationShare(userId, playlistId);
  }

  /**
   * Station 공유 취소
   */
  static async unshareStation(playlistId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('station_playlists')
      .update({
        is_shared: false,
        shared_at: null,
      })
      .eq('id', playlistId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to unshare station: ${error.message}`);
    }
  }

  /**
   * 공유된 Station 목록 가져오기 (Feed용)
   */
  static async getSharedStations(limit: number = 50): Promise<StationPlaylist[]> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('station_playlists')
      .select('*')
      .eq('is_shared', true)
      .order('shared_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch shared stations: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(data.map((p: any) => p.user_id).filter(Boolean)));
    
    // Batch fetch user profiles
    const userMap = await AuthService.getProfiles(userIds);

    // Map playlists with user data
    const playlists: StationPlaylist[] = data.map((playlist: any) => {
      const userProfile = userMap.get(playlist.user_id);
      
      return {
        ...playlist,
        user: userProfile ? {
          id: userProfile.id,
          nickname: userProfile.nickname,
          avatar_url: userProfile.profileImage || null,
        } : {
          id: playlist.user_id,
          nickname: '익명',
          avatar_url: null,
        },
      };
    });

    return playlists;
  }

  /**
   * Station 좋아요 토글
   */
  static async toggleLike(stationId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // 현재 좋아요 상태 확인
    const { data: existingLike } = await supabase
      .from('station_likes')
      .select('id')
      .eq('station_id', stationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // 좋아요 취소
      const { error } = await supabase
        .from('station_likes')
        .delete()
        .eq('station_id', stationId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to unlike station: ${error.message}`);
      }

      // 로그 기록
      await AnalyticsService.logUnlike(userId, 'station', stationId);

      // 업데이트된 좋아요 수 가져오기
      const { data: station } = await supabase
        .from('station_playlists')
        .select('likes')
        .eq('id', stationId)
        .single();

      return { isLiked: false, likeCount: station?.likes || 0 };
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from('station_likes')
        .insert({ station_id: stationId, user_id: userId });

      if (error) {
        throw new Error(`Failed to like station: ${error.message}`);
      }

      // 로그 기록
      await AnalyticsService.logLike(userId, 'station', stationId);

      // 업데이트된 좋아요 수 가져오기
      const { data: station } = await supabase
        .from('station_playlists')
        .select('likes')
        .eq('id', stationId)
        .single();

      return { isLiked: true, likeCount: station?.likes || 0 };
    }
  }

  /**
   * Station 좋아요 상태 확인
   */
  static async checkLikeStatus(stationId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data } = await supabase
      .from('station_likes')
      .select('id')
      .eq('station_id', stationId)
      .eq('user_id', userId)
      .maybeSingle();

    return !!data;
  }

  /**
   * Station 댓글 추가
   */
  static async addComment(stationId: string, userId: string, content: string): Promise<any> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('station_comments')
      .insert({
        station_id: stationId,
        user_id: userId,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`);
    }

    // 로그 기록
    await AnalyticsService.logComment(userId, 'station', stationId);

    return data;
  }

  /**
   * Station 댓글 목록 가져오기
   */
  static async getComments(stationId: string): Promise<any[]> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('station_comments')
      .select('*')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = Array.from(new Set(data.map((c: any) => c.user_id).filter(Boolean)));
    
    // Batch fetch user profiles
    const userMap = await AuthService.getProfiles(userIds);

    // Map comments with user data
    return data.map((comment: any) => {
      const userProfile = userMap.get(comment.user_id);
      
      return {
        ...comment,
        user: userProfile ? {
          id: userProfile.id,
          nickname: userProfile.nickname,
          profileImage: userProfile.profileImage || null,
        } : {
          id: comment.user_id,
          nickname: '익명',
          profileImage: null,
        },
      };
    });
  }

  /**
   * Station 댓글 삭제
   */
  static async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('station_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId); // 본인 댓글만 삭제 가능

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }
}

