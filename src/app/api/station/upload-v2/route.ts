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
    const { url, type } = body;
    console.log('📝 [Upload-v2] Request:', { url, type });
    
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
      return await handlePlaylistUpload(url, user.id, supabaseAdmin);
    } else if (type === 'video') {
      return await handleVideoUpload(url, user.id, supabaseAdmin);
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
 * Handle YouTube playlist upload
 */
async function handlePlaylistUpload(url: string, userId: string, supabaseAdmin: any) {
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
    const tracks = await batchProcessVideos(items);
    console.log('✅ [Playlist] Tracks:', tracks.length);

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
async function handleVideoUpload(url: string, userId: string, supabaseAdmin: any) {
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
    const tracklist = await extractTracklist(videoId, videoDetails.description);

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
      // No tracklist - save as single video
      console.log('ℹ️  [Video] No tracklist, saving as single video');

      const track: Track = {
        id: videoId,
        title: videoDetails.title,
        artist: videoDetails.channelTitle,
        thumbnail_url: videoDetails.thumbnail,
        duration: videoDetails.duration,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: 'youtube'
      };

      const playlistData = {
        playlist_id: `video_${videoId}`,
        title: videoDetails.title,
        description: videoDetails.description,
        thumbnail_url: track.thumbnail_url,
        channel_title: videoDetails.channelTitle,
        channel_id: videoDetails.channelId,
        channel_info: videoDetails.channelInfo,
        tracks: [track],
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
        message: 'Video added successfully',
        playlist: data,
        tracksCount: 1
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

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const videoIds = batch.map(item => item.contentDetails?.videoId).filter(Boolean).join(',');

    if (!videoIds) continue;

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    
    if (!res.ok) continue;

    const data = await res.json();

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
  }

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
async function extractTracklist(videoId: string, description: string) {
  // Try description first
  const descTracks = parseTracklistFromText(description);
  
  if (descTracks.length >= 3) {
    console.log(`✅ [Tracklist] Found ${descTracks.length} in description`);
    return descTracks;
  }

  // Try comments
  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YT_API_KEY}`;
    const res = await fetch(url);
    
    if (res.ok) {
      const data = await res.json();
      
      for (const item of data.items || []) {
        const commentText = item.snippet.topLevelComment.snippet.textDisplay.replace(/<[^>]*>/g, '');
        const commentTracks = parseTracklistFromText(commentText);
        
        if (commentTracks.length >= 3) {
          console.log(`✅ [Tracklist] Found ${commentTracks.length} in comments`);
          return commentTracks;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  [Tracklist] Could not fetch comments');
  }

  return [];
}

/**
 * Parse tracklist from text using timestamp patterns
 */
function parseTracklistFromText(text: string): any[] {
  const tracks: any[] = [];
  const timestampPattern = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
  const matches: { timestamp: string; index: number }[] = [];
  
  let match;
  while ((match = timestampPattern.exec(text)) !== null) {
    matches.push({ timestamp: match[1], index: match.index });
  }
  
  // Extract track between timestamps
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const trackText = text.substring(current.index, next?.index || text.length).trim();
    const cleanText = trackText.replace(current.timestamp, '').trim();
    const parts = cleanText.split(/\s*[-–—]\s*/);
    
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' - ').trim();
      
      if (artist && title && 
          artist.length > 1 && artist.length < 100 && 
          title.length > 1 && title.length < 100 &&
          !artist.startsWith('http')) {
        
        tracks.push({
          id: `track_${i + 1}`,
          artist,
          title,
          timestamp: current.timestamp,
          thumbnail_url: '',
          duration: 0,
          youtube_url: '',
          platform: 'youtube'
        });
      }
    }
  }
  
  return tracks;
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
