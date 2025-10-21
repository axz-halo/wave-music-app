import supabase from '@/lib/supabaseClient';

export type ActionType = 
  | 'wave_upload' 
  | 'station_upload' 
  | 'station_share'
  | 'station_delete'
  | 'like' 
  | 'unlike'
  | 'comment'
  | 'save'
  | 'unsave';

export type TargetType = 'wave' | 'station';

interface LogActivityParams {
  userId: string;
  actionType: ActionType;
  targetType?: TargetType;
  targetId?: string;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * 활동 로그 기록
   */
  static async logActivity({
    userId,
    actionType,
    targetType,
    targetId,
    metadata
  }: LogActivityParams): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not initialized, skipping analytics log');
      return;
    }

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: userId,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          metadata: metadata || null,
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Wave 업로드 로그
   */
  static async logWaveUpload(userId: string, waveId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'wave_upload',
      targetType: 'wave',
      targetId: waveId,
    });
  }

  /**
   * Station 업로드 로그
   */
  static async logStationUpload(userId: string, stationId: string, trackCount?: number): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'station_upload',
      targetType: 'station',
      targetId: stationId,
      metadata: trackCount ? { track_count: trackCount } : undefined,
    });
  }

  /**
   * Station 공유 로그
   */
  static async logStationShare(userId: string, stationId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'station_share',
      targetType: 'station',
      targetId: stationId,
    });
  }

  /**
   * 좋아요 로그
   */
  static async logLike(userId: string, targetType: TargetType, targetId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'like',
      targetType,
      targetId,
    });
  }

  /**
   * 좋아요 취소 로그
   */
  static async logUnlike(userId: string, targetType: TargetType, targetId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'unlike',
      targetType,
      targetId,
    });
  }

  /**
   * 댓글 로그
   */
  static async logComment(userId: string, targetType: TargetType, targetId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'comment',
      targetType,
      targetId,
    });
  }

  /**
   * 저장 로그
   */
  static async logSave(userId: string, targetType: TargetType, targetId: string): Promise<void> {
    await this.logActivity({
      userId,
      actionType: 'save',
      targetType,
      targetId,
    });
  }

  /**
   * 오늘의 통계 가져오기
   */
  static async getTodayStats(): Promise<{
    waveUploads: number;
    stationUploads: number;
    stationShares: number;
    likes: number;
    comments: number;
  }> {
    if (!supabase) {
      return {
        waveUploads: 0,
        stationUploads: 0,
        stationShares: 0,
        likes: 0,
        comments: 0,
      };
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 병렬로 각 통계 가져오기
      const [waveUploads, stationUploads, stationShares, likes, comments] = await Promise.all([
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action_type', 'wave_upload')
          .gte('created_at', todayISO),
        
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action_type', 'station_upload')
          .gte('created_at', todayISO),
        
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action_type', 'station_share')
          .gte('created_at', todayISO),
        
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action_type', 'like')
          .gte('created_at', todayISO),
        
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact', head: true })
          .eq('action_type', 'comment')
          .gte('created_at', todayISO),
      ]);

      return {
        waveUploads: waveUploads.count || 0,
        stationUploads: stationUploads.count || 0,
        stationShares: stationShares.count || 0,
        likes: likes.count || 0,
        comments: comments.count || 0,
      };
    } catch (error) {
      console.error('Error fetching today stats:', error);
      return {
        waveUploads: 0,
        stationUploads: 0,
        stationShares: 0,
        likes: 0,
        comments: 0,
      };
    }
  }

  /**
   * 전체 회원 수 가져오기
   */
  static async getTotalUserCount(): Promise<number> {
    if (!supabase) {
      return 0;
    }

    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error fetching user count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching user count:', error);
      return 0;
    }
  }
}

