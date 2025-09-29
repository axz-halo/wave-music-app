import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseYouTubeId, parseYouTubePlaylistId } from '@/lib/youtube';

// 비디오 ID 추출 함수
function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Station upload started - DEBUG VERSION');
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('🔍 Request URL:', req.url);
    
    // Service Role Key로 직접 클라이언트 생성 (RLS 우회)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Database configuration missing');
      return NextResponse.json({ 
        success: false, 
        errorCode: 'CONFIG_ERROR_001',
        message: '🚨 CONFIG: System configuration issue detected',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('✅ Database configuration confirmed');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 사용자 인증 확인을 위한 일반 클라이언트
    const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // 인증 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'AUTH_MISSING_002',
        message: '🚨 AUTH: Authentication required - no token provided',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'AUTH_INVALID_003',
        message: '🚨 AUTH: Authentication token invalid or expired',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    // ✅ GUARANTEED PROFILE SOLUTION (Never fails)
    console.log('🔍 GUARANTEED profile creation start');
    
    // 기본 프로필 (항상 성공)
    const GUARANTEED_PROFILE = {
      id: user.id,
      nickname: user.user_metadata?.full_name || 
               user.user_metadata?.name || 
               user.email?.split('@')[0] || 
               '사용자',
      email: user.email || null,
      avatar_url: user.user_metadata?.avatar_url || null
    };
    
    let profile = GUARANTEED_PROFILE; // 항상 성공하는 기본값부터 시작
    
    console.log(`✅ GUARANTEED profile ready for user: ${user.id}`);
    
    // 실제로 데이터베이스에서 프로필 확인 및 생성
    try {
      const { data: existingProfile, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id, nickname, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!findError && existingProfile) {
        profile = existingProfile;
        console.log('✅ Found existing profile in DB');
      } else {
        console.log('ℹ️ No existing profile, creating new one...');
        
    // 실제로 데이터베이스에 프로필 생성
               const { data: newProfile, error: insertError } = await supabaseAdmin
                 .from('profiles')
                 .insert(GUARANTEED_PROFILE)
                 .select()
                 .single();

               if (!insertError && newProfile) {
                 profile = newProfile;
                 console.log('✅ Created new profile in DB:', profile.id);
               } else {
                 console.log('⚠️ Failed to create profile, using in-memory:', insertError?.message);
                 profile = GUARANTEED_PROFILE;
               }
      }
    } catch (dbError: any) {
      console.log('ℹ️ DB operation failed, using guaranteed default:', dbError.message);
      profile = GUARANTEED_PROFILE;
    }
    
    // 프로필 최종 보장
    if (!profile?.id) {
      profile = { ...GUARANTEED_PROFILE };
    }

    console.log('✅ Profile ready:', {
      id: profile.id,
      nickname: profile.nickname
    });

    const { url, type, preview } = await req.json();
    
    if (!url || !type || !preview) {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'MISSING_DATA',
        message: 'Required data missing'
      }, { status: 400 });
    }

    let playlistData: any;
    let tracks: any[] = [];

    // 배치 처리 큐에 추가 (실시간 처리 대신)
    console.log('📋 Adding to batch processing queue...');

    const { data: pendingPlaylist, error: queueError } = await supabaseAdmin
      .from('pending_playlists')
      .insert({
        playlist_url: url,
        user_id: profile.id,
        status: 'pending'
      })
      .select()
      .single();

    if (queueError) {
      console.error('❌ Failed to add to batch queue:', queueError);
      return NextResponse.json({
        success: false,
        errorCode: 'QUEUE_ERROR',
        message: '배치 처리 큐에 추가하는 중 오류가 발생했습니다'
      }, { status: 500 });
    }

    console.log('✅ Added to batch processing queue:', pendingPlaylist.id);

    // 즉시 응답 (배치 처리 예정)
    return NextResponse.json({
      success: true,
      message: '플레이리스트가 배치 처리 큐에 추가되었습니다. 1-2시간 내에 처리됩니다.',
      playlistId: pendingPlaylist.id,
      estimatedTime: '1-2시간',
      status: 'pending'
    });
      // 플레이리스트 처리 - Python 크롤러 사용
      const playlistId = parseYouTubePlaylistId(url);
      if (!playlistId) {
        return NextResponse.json({
          success: false,
          errorCode: 'INVALID_PLAYLIST_URL',
          message: 'Invalid YouTube playlist URL provided'
        }, { status: 400 });
      }

      try {
        console.log('Processing playlist with Python scraper:', playlistId);

        // Python 크롤러로 플레이리스트 처리
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/youtube/python-scraper`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistId: playlistId,
            type: 'playlist'
          })
        });

        const scrapeData = await scrapeResponse.json();
        console.log('Playlist scraping result:', scrapeData);

        // 배치 처리용 기본 플레이리스트 정보 사용 (실시간 크롤링 대신)
        tracks = [{
          id: playlistId,
          title: preview.title,
          artist: preview.channelTitle,
          thumbnail_url: preview.thumbnail,
          duration: 0,
          youtube_url: url,
          order: 1,
          timestamp: '00:00',
          video_type: 'Playlist'
        }];

        // 플레이리스트 정보 설정
        playlistData = {
          playlist_id: playlistId,
          title: preview.title,
          description: preview.description,
          thumbnail_url: preview.thumbnail,
          channel_title: preview.channelTitle,
          channel_id: null,
          channel_info: null,
          tracks: tracks,
          user_id: profile.id,
          created_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error fetching playlist items:', error);
        // 플레이리스트 아이템을 가져오지 못해도 기본 정보로 저장
        tracks = [{
          id: playlistId,
          title: preview.title,
          artist: preview.channelTitle,
          thumbnail_url: preview.thumbnail,
          duration: 0,
          youtube_url: url,
          order: 1
        }];
      }

      playlistData = {
        playlist_id: playlistId,
        title: preview.title,
        description: `플레이리스트: ${preview.title}`,
        thumbnail_url: preview.thumbnail,
        channel_title: preview.channelTitle,
        channel_id: null,
        channel_info: null,
        tracks: tracks,
        user_id: profile.id, // 사용자 ID를 profile에서 가져옴
        created_at: new Date().toISOString()
      };
    } else {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'INVALID_TYPE',
        message: 'Invalid URL type provided'
      }, { status: 400 });
    }

    // 데이터베이스에 저장
    console.log('💾 Saving playlist...');
    console.log('✅ User ID confirmed:', profile.id);

    // 데이터베이스에 저장
    const { data: savedPlaylist, error: saveError } = await supabaseAdmin
      .from('station_playlists')
      .insert(playlistData)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Save error details:', saveError);
      console.error('📋 Error code:', saveError.code);
      console.error('📋 Error message:', saveError.message);
      
      // 더 자세한 에러 정보 포함
      return NextResponse.json({ 
        success: false,
        errorCode: 'SAVE_ERROR',
        message: 'Failed to save playlist data',
        details: {
          code: saveError.code,
          message: saveError.message,
          hint: saveError.hint,
          user_id: profile.id
        }
      }, { status: 500 });
    }

    console.log('✅ Playlist saved successfully:', savedPlaylist?.id);

    return NextResponse.json({
      success: true,
      playlist: savedPlaylist,
      message: type === 'video' ? '비디오가 플레이리스트로 저장되었습니다' : '플레이리스트가 저장되었습니다',
      trackCount: tracks.length
    });

  } catch (error: any) {
    console.error('🚨 CRITICAL ERROR in station upload:', error);
    console.error('🚨 Error stack:', error.stack);
    console.error('🚨 Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({ 
      success: false,
      errorCode: 'CRITICAL_SYSTEM_ERROR',
      message: '🚨 CRITICAL: System encountered unexpected error',
      timestamp: new Date().toISOString(),
      errorId: Math.random().toString(36).substring(7),
      details: error?.message || 'Unknown critical system error',
      fullError: error.toString()
    }, { status: 500 });
  }
}
