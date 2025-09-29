import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseYouTubeId } from '@/lib/youtube';

// 배치 처리 시스템용 새로운 업로드 API
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Station upload started - BATCH PROCESSING VERSION');

    // 환경 변수 확인
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

    console.log('🔍 User authenticated:', user.id);

    // 사용자 프로필 확인/생성
    const GUARANTEED_PROFILE = {
      id: user.id,
      nickname: user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                '사용자',
      email: user.email || null,
      avatar_url: user.user_metadata?.avatar_url || null
    };

    let profile = GUARANTEED_PROFILE;

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

    console.log('✅ Profile ready:', {
      id: profile.id,
      nickname: profile.nickname
    });

    // 요청 데이터 파싱
    const { url, type, preview } = await req.json();

    if (!url || !type || !preview) {
      return NextResponse.json({
        success: false,
        errorCode: 'MISSING_DATA',
        message: 'Required data missing'
      }, { status: 400 });
    }

    // URL 검증
    let videoId = null;
    let playlistId = null;

    if (type === 'video') {
      videoId = parseYouTubeId(url);
      if (!videoId) {
        return NextResponse.json({
          success: false,
          errorCode: 'INVALID_URL',
          message: 'Invalid YouTube URL provided'
        }, { status: 400 });
      }
    } else if (type === 'playlist') {
      // 플레이리스트 ID 추출 로직 (필요시 추가)
      playlistId = url; // 임시로 전체 URL 사용
    } else {
      return NextResponse.json({
        success: false,
        errorCode: 'INVALID_TYPE',
        message: 'Invalid URL type provided'
      }, { status: 400 });
    }

    // 배치 처리 큐에 추가
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
      message: `${type === 'video' ? '비디오' : '플레이리스트'}가 배치 처리 큐에 추가되었습니다. 1-2시간 내에 처리됩니다.`,
      playlistId: pendingPlaylist.id,
      estimatedTime: '1-2시간',
      status: 'pending'
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
