'use client';

import { useEffect, useCallback } from 'react';
import supabase from '@/lib/supabaseClient';
import { useAuth } from './useAuth';

interface RealtimeUpdatesOptions {
  onWaveUpdate?: (payload: any) => void;
  onStationUpdate?: (payload: any) => void;
  onNewWave?: (payload: any) => void;
  onNewStation?: (payload: any) => void;
}

export function useRealtimeUpdates(options: RealtimeUpdatesOptions = {}) {
  const { ensureAuth } = useAuth();

  const handleWaveUpdate = useCallback((payload: any) => {
    console.log('📡 실시간 웨이브 업데이트:', payload);
    options.onWaveUpdate?.(payload);
  }, [options]);

  const handleStationUpdate = useCallback((payload: any) => {
    console.log('📡 실시간 스테이션 업데이트:', payload);
    options.onStationUpdate?.(payload);
  }, [options]);

  const handleNewWave = useCallback((payload: any) => {
    console.log('📡 새로운 웨이브:', payload);
    options.onNewWave?.(payload);
  }, [options]);

  const handleNewStation = useCallback((payload: any) => {
    console.log('📡 새로운 스테이션:', payload);
    options.onNewStation?.(payload);
  }, [options]);

  useEffect(() => {
    if (!supabase) return;

    // 웨이브 실시간 구독
    const wavesChannel = supabase
      .channel('waves_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waves'
        },
        handleWaveUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'waves'
        },
        handleNewWave
      )
      .subscribe();

    // 스테이션 실시간 구독
    const stationsChannel = supabase
      .channel('stations_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'station_playlists'
        },
        handleStationUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'station_playlists'
        },
        handleNewStation
      )
      .subscribe();

    // 좋아요 실시간 구독
    const likesChannel = supabase
      .channel('likes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wave_likes'
        },
        (payload) => {
          console.log('📡 실시간 좋아요 업데이트:', payload);
          // 좋아요 변경 시 웨이브 카운트 업데이트
          handleWaveUpdate(payload);
        }
      )
      .subscribe();

    // 댓글 실시간 구독
    const commentsChannel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wave_comments'
        },
        (payload) => {
          console.log('📡 실시간 댓글 업데이트:', payload);
          // 댓글 변경 시 웨이브 카운트 업데이트
          handleWaveUpdate(payload);
        }
      )
      .subscribe();

    // 정리 함수
    return () => {
      wavesChannel.unsubscribe();
      stationsChannel.unsubscribe();
      likesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [handleWaveUpdate, handleStationUpdate, handleNewWave, handleNewStation]);

  return {
    isConnected: true, // Supabase Realtime 연결 상태 (간단한 구현)
  };
}


