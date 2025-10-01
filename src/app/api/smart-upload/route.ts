import { NextRequest, NextResponse } from 'next/server';
import { parseYouTubeId, parseYouTubePlaylistId, parseYouTubeChannelId } from '@/lib/youtube';
import supabaseServer from '@/lib/supabaseServer';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'DB_NOT_AVAILABLE_003',
        message: '🚨 DB: Database not available - system error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // 클라이언트에서 Authorization 헤더로 JWT 토큰 전송
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        errorCode: 'AUTH_NO_TOKEN_004',
        message: '🚨 AUTH: No token provided - authentication required',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // 토큰으로 사용자 정보 확인
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ 
        success: false, 
        errorCode: 'AUTH_INVALID_TOKEN_005',
        message: '🚨 AUTH: Invalid token - authentication failed',
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    const { url, type, preview } = await req.json();
    
    if (!url || !type) {
      return NextResponse.json({ error: 'URL and type required' }, { status: 400 });
    }

    console.log('Smart upload:', { url, type, userId: user.id });

    switch (type) {
      case 'video':
        return await handleVideoUpload(url, user.id);
        
      case 'playlist':
        return await handlePlaylistUpload(url, user.id, preview);
        
      case 'channel':
        return await handleChannelUpload(url, user.id, preview);
        
      default:
        return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('🚨 SMART UPLOAD CRITICAL ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      errorCode: 'SMART_UPLOAD_CRITICAL_006',
      message: '🚨 CRITICAL: Smart upload system error',
      timestamp: new Date().toISOString(),
      details: error?.message || 'Unknown critical error'
    }, { status: 500 });
  }
}

async function handleVideoUpload(url: string, userId: string) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  const videoId = parseYouTubeId(url);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
  }

  // 비디오 정보 가져오기 - 직접 YouTube API 호출
  const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`);
  const videoData = await videoResponse.json();
  
  if (!videoData.items || videoData.items.length === 0) {
    return NextResponse.json({ error: 'Video not found' }, { status: 400 });
  }

  const video = videoData.items[0];
  const snippet = video.snippet;
  
  // 웨이브로 생성
  const waveData = {
    user_id: userId,
    comment: 'Smart Upload로 추가된 비디오',
    mood_emoji: '🎵',
    mood_text: '업로드됨',
    track_info: {
      id: videoId,
      title: snippet.title,
      artist: snippet.channelTitle,
      platform: 'youtube',
      externalId: videoId,
      thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      duration: 0
    }
  };

  const { data: wave, error } = await supabaseServer
    .from('waves')
    .insert(waveData)
    .select()
    .single();

  if (error) {
    console.error('Wave creation error:', error);
    return NextResponse.json({ 
      success: false, 
      errorCode: 'WAVE_CREATE_ERROR_001',
      message: '🚨 WAVE: Failed to create wave - system error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    type: 'video',
    waveId: wave.id,
    message: '비디오가 웨이브로 추가되었습니다'
  });
}

async function handlePlaylistUpload(url: string, userId: string, preview: any) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  const playlistId = parseYouTubePlaylistId(url);
  if (!playlistId) {
    return NextResponse.json({ error: 'Invalid playlist URL' }, { status: 400 });
  }

  console.log('Processing playlist:', playlistId);

  // 1. 플레이리스트 트랙들 가져오기 - 직접 YouTube API 호출
  const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`);
  const playlistData = await playlistResponse.json();
  
  if (!playlistData.items || playlistData.items.length === 0) {
    return NextResponse.json({ error: 'No tracks found in playlist' }, { status: 400 });
  }

  // 비디오 ID들 추출
  const videoIds = playlistData.items.map((item: any) => item.contentDetails?.videoId).filter(Boolean);
  
  // 비디오 상세 정보 가져오기
  const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`);
  const videosData = await videosResponse.json();
  
  if (!videosData.items) {
    return NextResponse.json({ error: 'Failed to get video details' }, { status: 400 });
  }

  // 2. 채널 정보 저장
  let channelSaved = false;
  try {
    const firstVideo = videosData.items[0];
    if (firstVideo?.snippet?.channelId) {
      await saveChannelInfo(firstVideo.snippet.channelId, firstVideo.snippet.channelTitle);
      channelSaved = true;
    }
  } catch (error) {
    console.error('Channel save error:', error);
  }

  // 3. 플레이리스트를 radio_playlists 테이블에 저장
  const playlistData_db = {
    playlistId: playlistId,
    title: preview?.title || 'Unknown Playlist',
    description: preview?.description || '',
    channelTitle: preview?.channelTitle || videosData.items[0]?.snippet?.channelTitle,
    thumbnails: preview?.thumbnails || { default: { url: `https://img.youtube.com/vi/${videoIds[0]}/mqdefault.jpg` } },
    tracks_json: [],
    created_at: new Date().toISOString(),
    created_by: userId,
  };

  // 4. 각 트랙을 웨이브로 생성하고 플레이리스트에 추가
  const waves = [];
  const tracks = [];
  
  for (let i = 0; i < playlistData.items.length; i++) {
    const item = playlistData.items[i];
    const videoId = item.contentDetails?.videoId;
    const video = videosData.items.find((v: any) => v.id === videoId);
    
    if (!video) continue;

    try {
      // 트랙 정보 생성
      const track = {
        id: videoId,
        title: video.snippet?.title || 'Unknown',
        artist: video.snippet?.channelTitle || 'Unknown',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: parseDuration(video.contentDetails?.duration) || 0,
        platform: 'youtube',
        externalId: videoId,
        publishedAt: video.snippet?.publishedAt,
      };
      
      tracks.push(track);

      // 웨이브 생성
      const waveData = {
        user_id: userId,
        comment: `플레이리스트에서 추가: ${playlistData_db.title}`,
        mood_emoji: '📋',
        mood_text: '플레이리스트',
        track_title: track.title,
        track_artist: track.artist,
        track_platform: 'youtube',
        track_external_id: videoId,
        thumb_url: track.thumbnailUrl,
      };

      const { data: wave, error } = await supabaseServer
        .from('waves')
        .insert(waveData)
        .select()
        .single();

      if (!error && wave) {
        waves.push(wave);
      }
    } catch (error) {
      console.error('Wave creation error for track:', video.snippet?.title, error);
    }
  }

  // 플레이리스트에 트랙 정보 업데이트
  const updatedPlaylistData = {
    ...playlistData_db,
    tracks_json: tracks,
  };

  const { error: playlistError } = await supabaseServer
    .from('radio_playlists')
    .upsert(updatedPlaylistData, { onConflict: 'playlistId' });

  if (playlistError) {
    console.error('Playlist save error:', playlistError);
  }

  return NextResponse.json({ 
    success: true, 
    type: 'playlist',
    tracksAdded: waves.length,
    channelAdded: channelSaved,
    playlistId: playlistId,
    message: `${waves.length}곡이 웨이브로 추가되었습니다`
  });
}

async function handleChannelUpload(url: string, userId: string, preview: any) {
  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }

  const channelId = parseYouTubeChannelId(url);
  if (!channelId) {
    return NextResponse.json({ error: 'Invalid channel URL' }, { status: 400 });
  }

  // 채널 정보 저장
  try {
    await saveChannelInfo(channelId, preview?.title || 'Unknown Channel');
    
    return NextResponse.json({ 
      success: true, 
      type: 'channel',
      message: '채널이 구독되었습니다'
    });
  } catch (error) {
    console.error('Channel save error:', error);
    return NextResponse.json({ error: 'Failed to save channel' }, { status: 500 });
  }
}

async function saveChannelInfo(channelId: string, channelTitle: string) {
  if (!supabaseServer) {
    throw new Error('Database not available');
  }

  const channelData = {
    channelId: channelId,
    title: channelTitle,
    handle: null,
    thumb: `https://img.youtube.com/vi/${channelId}/mqdefault.jpg`,
    subscriber_count: 0,
    video_count: 0,
    view_count: 0,
    playlists_json: [],
    created_at: new Date().toISOString(),
  };

  const { error } = await supabaseServer
    .from('radio_channels')
    .upsert(channelData, { onConflict: 'channelId' });

  if (error) {
    console.error('Channel upsert error:', error);
    throw error;
  }
}

function parseDuration(duration: string): number {
  if (!duration) return 0;
  
  try {
    const re = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const m = duration.match(re);
    if (m) {
      const h = parseInt(m[1] || '0', 10);
      const mnt = parseInt(m[2] || '0', 10);
      const s = parseInt(m[3] || '0', 10);
      return h * 3600 + mnt * 60 + s;
    }
  } catch {}
  
  return 0;
}