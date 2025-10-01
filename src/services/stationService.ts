import supabase from '@/lib/supabaseClient';
import { AuthService } from './authService';

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
  channel_info?: {
    title: string;
    profileImage: string;
    subscriberCount: string | number;
    videoCount: string | number;
  };
  tracks: StationTrack[];
  created_at: string;
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
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  }
}

