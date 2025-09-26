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
    console.log('🚀 Station upload started');
    
    // Service Role Key로 직접 클라이언트 생성 (RLS 우회)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Database configuration missing');
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 프로필 생성 - 실패 불가능한 마지막 방어선
    console.log('🔍 Starting user profile processing');
    
    let profile;
    
    // 1단계: 기본값으로 디폴트 프로필 보장
    const defaultProfile = {
      id: user.id,
      nickname: user.user_metadata?.full_name || 
               user.user_metadata?.name || 
               user.email?.split('@')[0] || 
               '사용자',
      email: user.email || null,
      avatar_url: user.user_metadata?.avatar_url || null
    };
    
    console.log(`🔐 Creating guaranteed profile for user: ${user.id}`);
    
    try {
      // 예: 기존 프로필 시도 최대 1회
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, nickname, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        profile = existingProfile;
        console.log('✅ EXISTING PROFILE FOUND');
      } else {
        // 없으면 실시간 생성 - 버블 복사로 안전화
        try {
          const { data: newProfile } = await supabaseAdmin
            .from('profiles')
            .insert(defaultProfile)
            .select('id, nickname, email, avatar_url')
            .single();
          
          profile = newProfile;
          console.log('✅ PROFILE CREATED NEW');
        } catch (createError: any) {
          console.warn('⚠️ Profile create failed', createError);
          // 이미 했기 때문에 다시 조회 시도
          const retry = await supabaseAdmin
            .from('profiles')
            .select()
            .eq('id', user.id)
            .single();
          
          profile = retry.data || defaultProfile;
          console.log('🎯 FALLBACK PROFILE ENSURED');
        }
      }
    } catch (outerError: any) {
      console.warn('Outermost DB layer failed; hard using default');
      profile = defaultProfile;
    }
    
    // 최후 필수 체크
    if (!profile || !profile?.id) {
      profile = { ...defaultProfile };
    }

    console.log('✅ Profile ready:', {
      id: profile.id,
      nickname: profile.nickname
    });

    const { url, type, preview } = await req.json();
    
    if (!url || !type || !preview) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    let playlistData: any;
    let tracks: any[] = [];

    if (type === 'video') {
      // 단일 비디오를 플레이리스트로 처리
      const videoId = parseYouTubeId(url);
      if (!videoId) {
        return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      }

      // 고급 음원 크롤링 시도
      let extractedTracks = [];
      let advancedChannelInfo = null;
      
      try {
        console.log('Python-style scraping started...');
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/youtube/python-scraper`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: videoId,
            url: url
          })
        });
        
        const scrapeData = await scrapeResponse.json();
        if (scrapeData.success && scrapeData.result) {
          const result = scrapeData.result;
          extractedTracks = result.tracks.map((track: any) => ({
            id: track.youtubeUrl ? extractVideoId(track.youtubeUrl) : `track_${track.trackNumber}`,
            title: track.title,
            artist: track.artist,
            thumbnail_url: null, // YouTube Search API에서 가져올 수 있음
            duration: 0,
            youtube_url: track.youtubeUrl || null,
            order: track.trackNumber,
            timestamp: track.timestamp,
            video_type: track.videoType
          }));
          
          // 고급 채널 정보 사용
          advancedChannelInfo = {
            id: result.channelInfo.name,
            title: result.channelInfo.name,
            handle: result.channelInfo.handle,
            subscriberCount: result.channelInfo.subscriberCount,
            videoCount: '0',
            profileImage: result.channelInfo.profileImageUrl
          };
          
          console.log('Python-style scraping completed:', {
            tracks: extractedTracks.length,
            channel: result.channelInfo.name,
            extractedFrom: result.extractedFrom
          });
        }
      } catch (error) {
        console.error('Error in Python-style scraping:', error);
      }
      
      // 추출된 음원이 있으면 사용, 없으면 기본 비디오 정보 사용
      if (extractedTracks.length > 0) {
        tracks = extractedTracks;
      } else {
        tracks = [{
          id: videoId,
          title: preview.title,
          artist: preview.channelTitle,
          thumbnail_url: preview.thumbnail,
          duration: preview.duration || 0,
          youtube_url: url,
          order: 1
        }];
      }

      // 채널 정보 수집 (고급 크롤링에서 가져온 정보 우선 사용)
      let channelInfo = advancedChannelInfo;
      
      if (!channelInfo) {
        try {
          console.log('Fetching channel info...');
          const channelResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/youtube/resolve?type=channel&id=${preview.channelId || preview.channelTitle}`);
          const channelData = await channelResponse.json();
          
          if (channelData.ok) {
            channelInfo = {
              id: channelData.channelId,
              title: channelData.title,
              handle: channelData.handle,
              subscriberCount: channelData.subscriberCount,
              videoCount: channelData.videoCount,
              profileImage: channelData.thumbnails?.medium?.url || channelData.thumbnails?.default?.url
            };
            console.log('Channel info collected:', channelInfo);
          }
        } catch (error) {
          console.error('Error fetching channel info:', error);
        }
      }

      playlistData = {
        playlist_id: `single_${videoId}`,
        title: preview.title,
        description: `단일 비디오: ${preview.title}`,
        thumbnail_url: preview.thumbnail,
        channel_title: preview.channelTitle,
        channel_id: channelInfo?.id || null,
        channel_info: channelInfo,
        tracks: tracks,
        user_id: profile.id, // 사용자 ID를 profile에서 가져옴
        created_at: new Date().toISOString()
      };

    } else if (type === 'playlist') {
      // 플레이리스트 처리
      const playlistId = parseYouTubePlaylistId(url);
      if (!playlistId) {
        return NextResponse.json({ error: 'Invalid YouTube playlist URL' }, { status: 400 });
      }

      try {
        // YouTube Data API 직접 호출
        const apiKey = process.env.YT_API_KEY;
        if (!apiKey) {
          throw new Error('YouTube API key not configured');
        }

        console.log('Fetching playlist items for:', playlistId);
        const playlistItemsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
        );
        
        const playlistItemsData = await playlistItemsResponse.json();
        console.log('Playlist items response:', playlistItemsData);

        if (playlistItemsData.items && playlistItemsData.items.length > 0) {
          tracks = playlistItemsData.items.map((item: any, index: number) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle || preview.channelTitle,
            thumbnail_url: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            duration: 0, // YouTube API v3에서는 별도 호출 필요
            youtube_url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            order: index + 1
          }));
          console.log('Successfully fetched tracks:', tracks.length);
        } else {
          console.log('No playlist items found, using fallback');
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
      return NextResponse.json({ error: 'Invalid URL type' }, { status: 400 });
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
        error: `Failed to save playlist: ${saveError.details || saveError.message}`,
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
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Unknown error',
      details: error 
    }, { status: 500 });
  }
}
