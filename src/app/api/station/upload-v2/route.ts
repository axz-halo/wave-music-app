import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseYouTubePlaylistId, parseYouTubeId } from '@/lib/youtube';

const YT_API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: number;
  youtube_url: string;
  platform: string;
  timestamp?: string;
  video_type?: string;
}

/**
 * Production-ready station upload endpoint
 * Supports: YouTube playlists, single videos, and tracklist extraction
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [Upload-v2] Started');
    
    const body = await req.json();
    const { url, type, extractComments = true } = body; // 디폴트로 댓글 추출 활성화
    console.log('📝 [Upload-v2] Request:', { url, type, extractComments });
    
    // === 1. Environment validation ===
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ [Upload-v2] Missing environment variables');
      return NextResponse.json({ 
        success: false, 
        message: 'Server configuration error',
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    // === 2. Authentication ===
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [Upload-v2] No auth header');
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [Upload-v2] Auth failed:', authError?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid authentication' 
      }, { status: 401 });
    }

    console.log('✅ [Upload-v2] User authenticated:', user.id);

    // === 3. Create admin client ===
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // === 4. Route to appropriate handler ===
    if (type === 'playlist') {
      return await handlePlaylistUpload(url, user.id, supabaseAdmin, extractComments);
    } else if (type === 'video') {
      return await handleVideoUpload(url, user.id, supabaseAdmin, extractComments);
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid type. Use "playlist" or "video"' 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ [Upload-v2] Fatal error:', error.message);
    console.error('❌ [Upload-v2] Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: 'Server error occurred',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * YouTube 댓글에서 음원 정보 추출하는 함수
 */
async function extractMusicFromComments(videoId: string): Promise<Track[]> {
  try {
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=100&order=relevance&key=${YT_API_KEY}`;
    
    const commentsRes = await fetch(commentsUrl);
    if (!commentsRes.ok) {
      console.log('댓글 API 에러:', commentsRes.status);
      return [];
    }

    const commentsData = await commentsRes.json();
    const comments = commentsData.items || [];
    
    const musicTracks: Track[] = [];
    
    // 댓글에서 음원 정보 추출
    comments.forEach((comment: any) => {
      const text = comment.snippet?.topLevelComment?.snippet?.textDisplay || '';
      
      // 시간 정보와 함께 음원 정보가 있는 패턴들
      const patterns = [
        // "00:00 Song Name - Artist" 패턴
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*-\s*([^\n]+)/g,
        // "00:00 Song Name by Artist" 패턴  
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*by\s*([^\n]+)/g,
        // "Song Name - Artist (00:00)" 패턴
        /([^-\n]+?)\s*-\s*([^\n]+?)\s*\((\d{1,2}:\d{2})\)/g,
        // "Song Name by Artist (00:00)" 패턴
        /([^-\n]+?)\s*by\s*([^\n]+?)\s*\((\d{1,2}:\d{2})\)/g,
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let timeStr, songName, artist;
          
          if (match[3] && match[3].includes(':')) {
            // 시간이 마지막에 있는 패턴
            songName = match[1].trim();
            artist = match[2].trim();
            timeStr = match[3];
          } else {
            // 시간이 처음에 있는 패턴
            timeStr = match[1];
            songName = match[2].trim();
            artist = match[3].trim();
          }

          // 시간을 초로 변환
          const timeParts = timeStr.split(':');
          const duration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

          musicTracks.push({
            id: `comment_${comment.id}_${musicTracks.length}`,
            title: songName,
            artist: artist,
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            duration: duration,
            youtube_url: `https://www.youtube.com/watch?v=${videoId}&t=${timeStr}`,
            platform: 'youtube',
            timestamp: timeStr,
            video_type: 'comment_extracted'
          });
        }
      });
    });

    return musicTracks;
  } catch (error) {
    console.error('댓글에서 음원 추출 에러:', error);
    return [];
  }
}

/**
 * Handle YouTube playlist upload
 */
async function handlePlaylistUpload(url: string, userId: string, supabaseAdmin: any, extractComments: boolean = false) {
  const playlistId = parseYouTubePlaylistId(url);
  
  if (!playlistId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid playlist URL' 
    }, { status: 400 });
  }

  console.log('📋 [Playlist] Processing:', playlistId);

  try {
    // Fetch playlist metadata and channel info
    const metadata = await fetchPlaylistMetadata(playlistId);
    console.log('✅ [Playlist] Metadata:', metadata.title);

    // Fetch all playlist items
    const items = await fetchAllPlaylistItems(playlistId);
    console.log('✅ [Playlist] Items:', items.length);

    // Process videos
    let tracks = await batchProcessVideos(items);
    console.log('✅ [Playlist] Tracks:', tracks.length);

    // 댓글에서 음원 추출이 요청된 경우
    if (extractComments) {
      console.log('🎵 [Playlist] 댓글에서 음원 정보 추출 및 검색 시작...');
      
      try {
        // 각 비디오의 댓글에서 음원 정보 추출 및 검색 (최대 3개만 처리)
        for (const item of items.slice(0, 3)) {
          const videoId = item.contentDetails?.videoId;
          if (videoId) {
            console.log(`📝 [Playlist] ${videoId} 댓글에서 음원 추출 및 검색 중...`);
            
            try {
              // 새로운 extract-and-search API 사용
              const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube/extract-and-search?videoId=${videoId}`);
              const data = await response.json();
              
              if (data.success && data.tracks) {
                const commentTracks = data.tracks.map((track: any) => ({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  thumbnail_url: track.thumbnailUrl,
                  duration: track.duration,
                  youtube_url: track.youtubeUrl,
                  platform: 'youtube',
                  timestamp: track.originalTimestamp,
                  video_type: 'comment_extracted'
                }));
                
                tracks = [...tracks, ...commentTracks];
                console.log(`✅ [Playlist] ${videoId}에서 ${commentTracks.length}개 재생 가능한 음원 추출`);
              }
            } catch (error) {
              console.error(`❌ [Playlist] 댓글 추출 에러 (${videoId}):`, error);
            }
          }
        }
        
        console.log(`🎶 [Playlist] 총 ${tracks.length}개 트랙 추출 완료`);
      } catch (error) {
        console.error('❌ [Playlist] 댓글 추출 전체 에러:', error);
      }
    }

    // Save to database
    const playlistData = {
      playlist_id: playlistId,
      title: metadata.title,
      description: metadata.description,
      thumbnail_url: metadata.thumbnail,
      channel_title: metadata.channelTitle,
      channel_id: metadata.channelId,
      channel_info: metadata.channelInfo,
      tracks: tracks,
      user_id: userId
    };

    const { data, error } = await supabaseAdmin
      .from('station_playlists')
      .insert(playlistData)
      .select()
      .single();

    if (error) {
      console.error('❌ [Playlist] DB error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ [Playlist] Saved:', data.id);

    return NextResponse.json({
      success: true,
      message: `Successfully added ${tracks.length} tracks`,
      playlist: data,
      tracksCount: tracks.length
    });

  } catch (error: any) {
    console.error('❌ [Playlist] Error:', error.message);
    return NextResponse.json({
      success: false,
      message: `Playlist upload failed: ${error.message}`
    }, { status: 500 });
  }
}

/**
 * Handle single video upload with smart tracklist detection
 */
async function handleVideoUpload(url: string, userId: string, supabaseAdmin: any, extractComments: boolean = true) {
  const videoId = parseYouTubeId(url);
  
  if (!videoId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid video URL' 
    }, { status: 400 });
  }

  console.log('🎵 [Video] Processing:', videoId);

  try {
    // Fetch video details
    const videoDetails = await fetchVideoDetails(videoId);
    console.log('✅ [Video] Details:', videoDetails.title);

    // Try to extract tracklist
    console.log('🔍 [Video] Checking for tracklist...');
    const tracklist = await extractTracklist(videoId, videoDetails.description, videoDetails.channelTitle);

    if (tracklist.length >= 3) {
      // Found tracklist - process as multi-track playlist
      console.log(`✅ [Video] Found ${tracklist.length} tracks`);
      
      // Search YouTube for each track
      const tracksWithLinks = await searchYouTubeForTracks(tracklist);
      console.log(`✅ [Video] Added links to ${tracksWithLinks.length} tracks`);

      const playlistData = {
        playlist_id: `tracklist_${videoId}`,
        title: videoDetails.title,
        description: `Tracklist extracted from: ${videoDetails.title}`,
        thumbnail_url: videoDetails.thumbnail,
        channel_title: videoDetails.channelTitle,
        channel_id: videoDetails.channelId,
        channel_info: videoDetails.channelInfo,
        tracks: tracksWithLinks,
        user_id: userId
      };

      const { data, error } = await supabaseAdmin
        .from('station_playlists')
        .insert(playlistData)
        .select()
        .single();

      if (error) {
        console.error('❌ [Video] DB error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Extracted ${tracklist.length} tracks from video`,
        playlist: data,
        tracksCount: tracklist.length,
        type: 'tracklist'
      });

    } else {
      // No tracklist - save as single video with optional comment extraction
      console.log('ℹ️  [Video] No tracklist, saving as single video');

      let tracks: Track[] = [{
        id: videoId,
        title: videoDetails.title,
        artist: videoDetails.channelTitle,
        thumbnail_url: videoDetails.thumbnail,
        duration: videoDetails.duration,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: 'youtube'
      }];

      // 댓글에서 음원 추출이 요청된 경우
      if (extractComments) {
        console.log('🎵 [Video] 댓글에서 음원 정보 추출 및 검색 시작...');
        
        try {
          // 새로운 extract-and-search API 사용
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube/extract-and-search?videoId=${videoId}`);
          const data = await response.json();
          
          if (data.success && data.tracks) {
            const commentTracks = data.tracks.map((track: any) => ({
              id: track.id,
              title: track.title,
              artist: track.artist,
              thumbnail_url: track.thumbnailUrl,
              duration: track.duration,
              youtube_url: track.youtubeUrl,
              platform: 'youtube',
              timestamp: track.originalTimestamp,
              video_type: 'comment_extracted'
            }));
            
            tracks = [...tracks, ...commentTracks];
            console.log(`✅ [Video] 댓글에서 ${commentTracks.length}개 재생 가능한 음원 추출`);
          }
        } catch (error) {
          console.error('❌ [Video] 댓글 추출 에러:', error);
        }
      }

      const playlistData = {
        playlist_id: `video_${videoId}`,
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnail_url: tracks[0].thumbnail_url,
        channel_title: videoDetails.channelTitle,
        channel_id: videoDetails.channelId,
        channel_info: videoDetails.channelInfo,
        tracks: tracks,
        user_id: userId
      };

      const { data, error } = await supabaseAdmin
        .from('station_playlists')
        .insert(playlistData)
        .select()
        .single();

      if (error) {
        console.error('❌ [Video] DB error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Video added successfully${tracks.length > 1 ? ` with ${tracks.length - 1} additional tracks from comments` : ''}`,
        playlist: data,
        tracksCount: tracks.length
      });
    }

  } catch (error: any) {
    console.error('❌ [Video] Error:', error.message);
    return NextResponse.json({
      success: false,
      message: `Video upload failed: ${error.message}`
    }, { status: 500 });
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Fetch playlist metadata
 */
async function fetchPlaylistMetadata(playlistId: string) {
  const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.items?.[0]) {
    throw new Error('Playlist not found');
  }

  const playlist = data.items[0];
  const channelInfo = await fetchChannelInfo(playlist.snippet.channelId);

  return {
    title: playlist.snippet.title,
    description: playlist.snippet.description || '',
    thumbnail: playlist.snippet.thumbnails.medium?.url || playlist.snippet.thumbnails.default?.url || '',
    channelTitle: playlist.snippet.channelTitle,
    channelId: playlist.snippet.channelId,
    channelInfo
  };
}

/**
 * Fetch all playlist items with pagination
 */
async function fetchAllPlaylistItems(playlistId: string) {
  let allItems: any[] = [];
  let nextPageToken = '';
  let page = 0;
  const maxPages = 10; // Max 500 videos

  do {
    console.log(`📄 [Playlist] Fetching page ${page + 1}...`);
    
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${YT_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'YouTube API error');
    }

    const data = await res.json();
    allItems.push(...(data.items || []));
    nextPageToken = data.nextPageToken || '';
    page++;

  } while (nextPageToken && page < maxPages);

  return allItems;
}

/**
 * Process videos in batches
 */
async function batchProcessVideos(items: any[]): Promise<Track[]> {
  const tracks: Track[] = [];
  const batchSize = 50;
  const totalBatches = Math.ceil(items.length / batchSize);

  console.log(`📦 [Batch] Processing ${items.length} items in ${totalBatches} batches`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const batch = items.slice(i, i + batchSize);
    const videoIds = batch.map(item => item.contentDetails?.videoId).filter(Boolean).join(',');

    if (!videoIds) {
      console.warn(`⚠️  [Batch ${batchNum}/${totalBatches}] No valid video IDs found`);
      continue;
    }

    try {
      console.log(`📦 [Batch ${batchNum}/${totalBatches}] Fetching ${batch.length} videos...`);
      
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ [Batch ${batchNum}/${totalBatches}] API error (${res.status}):`, errorText);
        continue;
      }

      const data = await res.json();
      const videosFound = data.items?.length || 0;
      console.log(`✅ [Batch ${batchNum}/${totalBatches}] Found ${videosFound} videos`);

      for (const video of data.items || []) {
        tracks.push({
          id: video.id,
          title: video.snippet.title,
          artist: video.snippet.channelTitle,
          thumbnail_url: video.snippet.thumbnails.medium?.url || 
                        video.snippet.thumbnails.default?.url || 
                        `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
          duration: parseDuration(video.contentDetails.duration),
          youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
          platform: 'youtube'
        });
      }
    } catch (error: any) {
      console.error(`❌ [Batch ${batchNum}/${totalBatches}] Error:`, error.message);
      continue;
    }
  }

  console.log(`✅ [Batch] Total tracks processed: ${tracks.length}`);
  return tracks;
}

/**
 * Fetch video details
 */
async function fetchVideoDetails(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  const video = data.items?.[0];
  if (!video) {
    throw new Error('Video not found');
  }

  const channelInfo = await fetchChannelInfo(video.snippet.channelId);

  return {
    title: video.snippet.title,
    description: video.snippet.description || '',
    channelTitle: video.snippet.channelTitle,
    channelId: video.snippet.channelId,
    channelInfo,
    thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url || '',
    duration: parseDuration(video.contentDetails.duration)
  };
}

/**
 * Fetch channel information
 */
async function fetchChannelInfo(channelId: string) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error('Channel API error');
    }
    
    const data = await res.json();
    const channel = data.items?.[0];

    if (channel) {
      return {
        title: channel.snippet.title,
        profileImage: channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url || '',
        subscriberCount: channel.statistics.subscriberCount || '0',
        videoCount: channel.statistics.videoCount || '0'
      };
    }
  } catch (error) {
    console.warn('⚠️  [Channel] Could not fetch info:', error);
  }

  return {
    title: 'Unknown Channel',
    profileImage: '',
    subscriberCount: '0',
    videoCount: '0'
  };
}

/**
 * Extract tracklist from description and comments
 */
async function extractTracklist(videoId: string, description: string, channelTitle: string = '') {
  console.log('🔍 [Tracklist] Starting extraction...');
  
  // Try comments first (more likely to have detailed tracklist)
  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YT_API_KEY}`;
    const res = await fetch(url);
    
    if (res.ok) {
      const data = await res.json();
      console.log(`📝 [Tracklist] Found ${data.items?.length || 0} comments`);
      
      for (const item of data.items || []) {
        let commentText = item.snippet.topLevelComment.snippet.textDisplay;
        
        // HTML 태그를 줄바꿈으로 변환 (특히 <br>)
        commentText = commentText.replace(/<br\s*\/?>/gi, '\n');
        commentText = commentText.replace(/<[^>]*>/g, '');
        
        console.log(`🔍 [Tracklist] Parsing comment (${commentText.length} chars)...`);
        const commentTracks = parseTracklistFromText(commentText, channelTitle);
        
        console.log(`📊 [Tracklist] Found ${commentTracks.length} tracks in comment`);
        
        if (commentTracks.length >= 3) {
          console.log(`✅ [Tracklist] Found ${commentTracks.length} tracks in comments`);
          return commentTracks;
        }
      }
    } else {
      console.warn('⚠️  [Tracklist] Comments API error:', res.status);
    }
  } catch (error: any) {
    console.warn('⚠️  [Tracklist] Could not fetch comments:', error.message);
  }

  // Try description as fallback
  console.log('🔍 [Tracklist] Trying description...');
  const descTracks = parseTracklistFromText(description, channelTitle);
  
  if (descTracks.length >= 3) {
    console.log(`✅ [Tracklist] Found ${descTracks.length} tracks in description`);
    return descTracks;
  }

  console.log('❌ [Tracklist] No tracklist found');
  return [];
}

/**
 * Parse tracklist from text using timestamp patterns
 */
function parseTracklistFromText(text: string, channelTitle: string = ''): any[] {
  const tracks: any[] = [];
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  console.log(`📄 [Parse] Processing ${lines.length} lines`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 패턴 1: "시간 곡 정보" 형식 (한 줄에 모두)
    const sameLine = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/);
    
    if (sameLine) {
      const timestamp = sameLine[1];
      let content = sameLine[2].trim();
      
      // HTML 태그 제거
      content = content.replace(/<[^>]*>/g, '').trim();
      
      // 유효성 검사
      if (content.length < 2 || /^\d+$/.test(content) || content.startsWith('http')) {
        continue;
      }
      
      const trackInfo = parseTrackInfo(content, channelTitle);
      if (trackInfo) {
        tracks.push({
          id: `track_${tracks.length + 1}`,
          artist: trackInfo.artist,
          title: trackInfo.title,
          timestamp: timestamp,
          thumbnail_url: '',
          duration: 0,
          youtube_url: '',
          platform: 'youtube'
        });
        console.log(`✅ [Parse] Track ${tracks.length}: ${timestamp} - ${trackInfo.artist} - ${trackInfo.title}`);
      }
    }
    // 패턴 2: "시간" 단독 라인, 다음 줄에 곡 정보
    else if (line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)$/)) {
      const timestamp = line;
      
      // 다음 줄 확인
      if (i + 1 < lines.length) {
        let content = lines[i + 1].trim();
        
        // HTML 태그 제거
        content = content.replace(/<[^>]*>/g, '').trim();
        
        // 유효성 검사
        if (content.length >= 2 && !/^\d+$/.test(content) && !content.startsWith('http') && !content.match(/^\d{1,2}:\d{2}/)) {
          const trackInfo = parseTrackInfo(content, channelTitle);
          if (trackInfo) {
            tracks.push({
              id: `track_${tracks.length + 1}`,
              artist: trackInfo.artist,
              title: trackInfo.title,
              timestamp: timestamp,
              thumbnail_url: '',
              duration: 0,
              youtube_url: '',
              platform: 'youtube'
            });
            console.log(`✅ [Parse] Track ${tracks.length}: ${timestamp} - ${trackInfo.artist} - ${trackInfo.title}`);
            i++; // 다음 줄은 이미 처리했으므로 건너뛰기
          }
        }
      }
    }
  }
  
  console.log(`📊 [Parse] Total tracks found: ${tracks.length}`);
  return tracks;
}

/**
 * 곡 정보에서 아티스트와 제목 분리
 */
function parseTrackInfo(content: string, channelTitle: string): { artist: string; title: string } | null {
  let artist = '';
  let title = '';
  
  // "아티스트 - 곡제목" 형식
  if (content.includes(' - ')) {
    const parts = content.split(/\s*[-–—]\s*/);
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } 
  // "아티스트 by 곡제목" 형식
  else if (content.includes(' by ')) {
    const parts = content.split(/\s+by\s+/i);
    artist = parts[0].trim();
    title = parts.slice(1).join(' by ').trim();
  }
  // "곡제목만" 있는 경우
  else {
    title = content;
    artist = channelTitle || 'Unknown Artist';
  }
  
  // 유효성 검사
  if (title && title.length > 1 && title.length < 200 && 
      artist && artist.length > 0 && artist.length < 200 &&
      !title.startsWith('http') && !artist.startsWith('http')) {
    return { artist, title };
  }
  
  return null;
}

/**
 * Search YouTube for tracks and enrich with data
 */
async function searchYouTubeForTracks(tracks: any[]): Promise<Track[]> {
  console.log(`🔍 [Search] Searching YouTube for ${tracks.length} tracks...`);
  
  const enrichedTracks = await Promise.all(
    tracks.map(async (track, index) => {
      try {
        // Delay to avoid rate limiting (stagger requests)
        await new Promise(resolve => setTimeout(resolve, index * 100));
        
        const query = `${track.artist} ${track.title}`;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=1&key=${YT_API_KEY}`;
        
        const searchRes = await fetch(searchUrl);
        if (!searchRes.ok) {
          console.warn(`⚠️  [Search] Failed for: ${track.title}`);
          return { ...track, youtube_url: '', thumbnail_url: '', duration: 0 };
        }
        
        const searchData = await searchRes.json();
        const video = searchData.items?.[0];
        
        if (!video) {
          return { ...track, youtube_url: '', thumbnail_url: '', duration: 0 };
        }
        
        const foundVideoId = video.id.videoId;
        
        // Get video details for duration
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${foundVideoId}&key=${YT_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        
        if (!detailsRes.ok) {
          return {
            ...track,
            youtube_url: `https://www.youtube.com/watch?v=${foundVideoId}`,
            thumbnail_url: video.snippet.thumbnails.medium?.url || '',
            duration: 0
          };
        }
        
        const detailsData = await detailsRes.json();
        const videoDetails = detailsData.items?.[0];
        
        if (videoDetails) {
          return {
            ...track,
            youtube_url: `https://www.youtube.com/watch?v=${foundVideoId}`,
            thumbnail_url: videoDetails.snippet.thumbnails.medium?.url || 
                          videoDetails.snippet.thumbnails.default?.url || 
                          `https://img.youtube.com/vi/${foundVideoId}/mqdefault.jpg`,
            duration: parseDuration(videoDetails.contentDetails.duration),
            video_type: determineVideoType(videoDetails.snippet.title)
          };
        }
        
        return { ...track, youtube_url: '', thumbnail_url: '', duration: 0 };
        
      } catch (error) {
        console.warn(`⚠️  [Search] Error for ${track.title}:`, error);
        return { ...track, youtube_url: '', thumbnail_url: '', duration: 0 };
      }
    })
  );
  
  return enrichedTracks;
}

/**
 * Determine video type
 */
function determineVideoType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('official') || lower.includes('m/v')) return 'Official MV';
  if (lower.includes('audio') || lower.includes('오디오')) return 'Audio';
  if (lower.includes('live') || lower.includes('라이브')) return 'Live';
  if (lower.includes('performance')) return 'Performance';
  return 'Music Video';
}

/**
 * Parse ISO 8601 duration
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + 
         (parseInt(match[2] || '0') * 60) + 
         parseInt(match[3] || '0');
}
