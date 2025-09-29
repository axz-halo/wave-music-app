import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 배치 처리 상태 확인 API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('id');

    if (!playlistId) {
      return NextResponse.json({
        success: false,
        errorCode: 'MISSING_ID',
        message: 'Playlist ID is required'
      }, { status: 400 });
    }

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        errorCode: 'CONFIG_ERROR',
        message: 'System configuration issue'
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 배치 처리 상태 조회
    const { data: statusData, error: statusError } = await supabaseAdmin
      .from('pending_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (statusError) {
      return NextResponse.json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: 'Playlist not found in batch queue'
      }, { status: 404 });
    }

    // 처리된 트랙 정보 조회
    const { data: tracksData, error: tracksError } = await supabaseAdmin
      .from('processed_tracks')
      .select('*')
      .eq('playlist_id', playlistId)
      .order('track_number');

    let tracks = [];
    if (!tracksError && tracksData) {
      tracks = tracksData;
    }

    // 최종 플레이리스트 정보 조회 (처리가 완료된 경우)
    let finalPlaylist = null;
    if (statusData.status === 'completed') {
      const { data: playlistData, error: playlistError } = await supabaseAdmin
        .from('station_playlists')
        .select('*')
        .eq('user_id', statusData.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!playlistError && playlistData && playlistData.length > 0) {
        finalPlaylist = playlistData[0];
      }
    }

    return NextResponse.json({
      success: true,
      status: statusData.status,
      created_at: statusData.created_at,
      processed_at: statusData.processed_at,
      error_message: statusData.error_message,
      retry_count: statusData.retry_count,
      tracks_count: tracks.length,
      tracks: tracks,
      final_playlist: finalPlaylist,
      estimated_time: '1-2시간'
    });

  } catch (error: any) {
    console.error('Error checking batch status:', error);
    return NextResponse.json({
      success: false,
      errorCode: 'SYSTEM_ERROR',
      message: 'Failed to check batch status'
    }, { status: 500 });
  }
}
