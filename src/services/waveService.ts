import supabase from '@/lib/supabaseClient';
import { parseYouTubeId } from '@/lib/youtube';
import { AnalyticsService } from './analyticsService';

export interface WaveData {
  id: string;
  user_id: string;
  track_info: {
    id: string;
    title: string;
    artist: string;
    platform: string;
    externalId: string;
    thumbnailUrl: string;
    duration?: number;
  };
  comment: string;
  mood_emoji: string | null;
  mood_text: string | null;
  created_at: string;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
}

export interface CreateWavePayload {
  youtubeUrl?: string;
  track?: {
    id: string;
    title: string;
    artist: string;
    externalId: string;
    thumbnailUrl: string;
    duration?: number;
  };
  comment?: string;
  moodEmoji?: string;
  moodText?: string;
}

export interface GetWavesOptions {
  limit?: number;
  offset?: number;
  userId?: string;
}

export class WaveService {
  static async getWaves(options: GetWavesOptions = {}): Promise<WaveData[]> {
    const { limit = 100, offset = 0, userId } = options;
    
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    let query = supabase
      .from('waves')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch waves: ${error.message}`);
    }

    return (data as WaveData[]) || [];
  }

  static async getWaveById(waveId: string): Promise<WaveData | null> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('waves')
      .select('*')
      .eq('id', waveId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch wave: ${error.message}`);
    }

    return data as WaveData | null;
  }

  static async createWave(userId: string, payload: CreateWavePayload): Promise<WaveData> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    let track = payload.track || null;

    // Resolve YouTube metadata if URL provided but no track data
    if (!track && payload.youtubeUrl) {
      const resolvedId = parseYouTubeId(payload.youtubeUrl);
      if (resolvedId) {
        try {
          const res = await fetch(`/api/youtube/resolve?type=video&id=${resolvedId}`);
          const meta = await res.json();
          if (meta?.ok) {
            track = {
              id: resolvedId,
              title: meta.title || 'Untitled',
              artist: meta.channelTitle || '',
              externalId: resolvedId,
              thumbnailUrl: meta.thumbnails?.high?.url || 
                           meta.thumbnails?.medium?.url || 
                           meta.thumbnails?.default?.url || 
                           `https://img.youtube.com/vi/${resolvedId}/hqdefault.jpg`,
              duration: typeof meta.duration === 'number' ? meta.duration : 0,
            };
          }
        } catch (err) {
          console.error('Failed to resolve YouTube metadata:', err);
        }
      }
    }

    const finalExternalId = parseYouTubeId(payload.youtubeUrl || '') || track?.externalId || null;

    if (!finalExternalId) {
      throw new Error('No valid track information provided');
    }

    const finalTrack = track || {
      title: 'Unknown',
      artist: '',
      externalId: finalExternalId,
      thumbnailUrl: `https://img.youtube.com/vi/${finalExternalId}/mqdefault.jpg`,
    };

    const insertPayload = {
      user_id: userId,
      comment: payload.comment || '',
      mood_emoji: payload.moodEmoji || null,
      mood_text: payload.moodText || null,
      track_info: {
        id: finalExternalId,
        title: finalTrack.title,
        artist: finalTrack.artist,
        platform: 'youtube',
        externalId: finalExternalId,
        thumbnailUrl: finalTrack.thumbnailUrl,
        duration: ('duration' in finalTrack ? finalTrack.duration : 0) || 0
      }
    };

    const { data, error } = await supabase
      .from('waves')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create wave: ${error.message}`);
    }

    // 로그 기록
    if (data?.id) {
      await AnalyticsService.logWaveUpload(userId, data.id);
    }

    return data as WaveData;
  }

  static async updateWave(waveId: string, updates: { likes?: number; comments?: number; saves?: number; shares?: number; isLiked?: boolean; isSaved?: boolean }): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('waves')
      .update(updates)
      .eq('id', waveId);

    if (error) {
      throw new Error(`Failed to update wave: ${error.message}`);
    }
  }

  static async toggleLike(waveId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Check if user already liked this wave
    const { data: existing } = await supabase
      .from('interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_id', waveId)
      .eq('target_type', 'wave')
      .eq('interaction_type', 'like')
      .maybeSingle();

    if (existing) {
      // Unlike: remove interaction
      await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);
      
      // 로그 기록
      await AnalyticsService.logUnlike(userId, 'wave', waveId);
      return false;
    } else {
      // Like: add interaction
      await supabase
        .from('interactions')
        .insert({
          user_id: userId,
          target_id: waveId,
          target_type: 'wave',
          interaction_type: 'like'
        });
      
      // 로그 기록
      await AnalyticsService.logLike(userId, 'wave', waveId);
      return true;
    }
  }

  static async toggleSave(waveId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    // Check if user already saved this wave
    const { data: existing } = await supabase
      .from('interactions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_id', waveId)
      .eq('target_type', 'wave')
      .eq('interaction_type', 'save')
      .maybeSingle();

    if (existing) {
      // Unsave: remove interaction
      await supabase
        .from('interactions')
        .delete()
        .eq('id', existing.id);
      
      // 로그 기록
      await AnalyticsService.logActivity({
        userId,
        actionType: 'unsave',
        targetType: 'wave',
        targetId: waveId,
      });
      return false;
    } else {
      // Save: add interaction
      await supabase
        .from('interactions')
        .insert({
          user_id: userId,
          target_id: waveId,
          target_type: 'wave',
          interaction_type: 'save'
        });
      
      // 로그 기록
      await AnalyticsService.logSave(userId, 'wave', waveId);
      return true;
    }
  }

  static async incrementLikes(waveId: string): Promise<number> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data: current } = await supabase
      .from('waves')
      .select('likes')
      .eq('id', waveId)
      .maybeSingle();

    const nextLikes = ((current?.likes as number | null) ?? 0) + 1;

    await this.updateWave(waveId, { likes: nextLikes });

    return nextLikes;
  }

  static async deleteWave(waveId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('waves')
      .delete()
      .eq('id', waveId);

    if (error) {
      throw new Error(`Failed to delete wave: ${error.message}`);
    }
  }

  static async checkLikeStatus(waveId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('wave_likes')
      .select('id')
      .eq('wave_id', waveId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Failed to check like status: ${error.message}`);
    }

    return !!data;
  }

  static async checkSaveStatus(waveId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('wave_saves')
      .select('id')
      .eq('wave_id', waveId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Failed to check save status: ${error.message}`);
    }

    return !!data;
  }
}

