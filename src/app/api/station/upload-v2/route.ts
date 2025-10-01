import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseYouTubePlaylistId, parseYouTubeId } from '@/lib/youtube';

const YT_API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

interface PlaylistMetadata {
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  channelId: string;
  channelInfo: any;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: number;
  youtube_url: string;
  platform: string;
}

/**
 * Production-ready playlist upload route
 * Works 100% serverless without Python dependency
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Upload-v2 started');
    
    const { url, type } = await req.json();
    console.log('📝 Request:', { url, type });
    
    // Database configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🔑 Config check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing environment variables');
      return NextResponse.json({ 
        success: false, 
        message: 'Database configuration missing',
        debug: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey,
          hasAnonKey: !!supabaseAnonKey
        }
      }, { status: 500 });
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No auth header or invalid format');
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required - no token provided' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError?.message);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid authentication token',
        error: authError?.message
      }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    if (type === 'playlist') {
      return await handlePlaylistUpload(url, user.id, supabaseAdmin);
    } else if (type === 'video') {
      return await handleVideoUpload(url, user.id, supabaseAdmin);
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid upload type' 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to process upload',
      errorDetails: error.toString(),
      errorStack: error.stack?.split('\n').slice(0, 3).join('\n')
    }, { status: 500 });
  }
}

/**
 * Handle playlist upload with full track extraction
 */
async function handlePlaylistUpload(url: string, userId: string, supabaseAdmin: any) {
  const playlistId = parseYouTubePlaylistId(url);
  
  if (!playlistId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid playlist URL' 
    }, { status: 400 });
  }

  console.log('📋 Processing playlist:', playlistId);

  try {
    // 1. Fetch playlist metadata
    const playlistMeta = await fetchPlaylistMetadata(playlistId);
    console.log('✅ Fetched metadata:', playlistMeta.title);

    // 2. Fetch all playlist items (with pagination)
    const items = await fetchAllPlaylistItems(playlistId);
    console.log('✅ Fetched', items.length, 'items');

    // 3. Process videos in batches
    const tracks = await batchProcessVideos(items);
    console.log('✅ Processed', tracks.length, 'tracks');

    // 4. Save to database using admin client
    const { data, error } = await supabaseAdmin
      .from('station_playlists')
      .insert({
        playlist_id: playlistId,
        title: playlistMeta.title,
        description: playlistMeta.description,
        thumbnail_url: playlistMeta.thumbnail,
        channel_title: playlistMeta.channelTitle,
        channel_id: playlistMeta.channelId,
        channel_info: playlistMeta.channelInfo,
        tracks: tracks,
        user_id: userId,
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      throw new Error('Failed to save playlist to database');
    }

    console.log('✅ Saved to database:', data.id);

    return NextResponse.json({
      success: true,
      message: `Successfully added playlist with ${tracks.length} tracks`,
      playlist: data,
      tracksCount: tracks.length
    });

  } catch (error: any) {
    console.error('❌ Playlist processing error:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: `Playlist processing failed: ${error.message}`,
      errorType: 'PLAYLIST_ERROR',
      details: error.toString()
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

  try {
    // Fetch video details
    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videoUrl.searchParams.set('part', 'snippet,contentDetails');
    videoUrl.searchParams.set('id', videoId);
    videoUrl.searchParams.set('key', YT_API_KEY);

    const res = await fetch(videoUrl.toString());
    const data = await res.json();
    const video = data.items?.[0];

    if (!video) {
      throw new Error('Video not found');
    }

    // Try to extract tracklist from description and comments
    console.log('🔍 Checking for tracklist in video...');
    const tracklist = await extractTracklistFromVideo(videoId, video.snippet.description);

    if (tracklist.length > 0) {
      // Found tracklist - search YouTube for each track
      console.log(`✅ Found ${tracklist.length} tracks, searching YouTube for each...`);
      
      const tracksWithLinks = await searchYouTubeForTracks(tracklist);
      console.log(`✅ Added YouTube links to ${tracksWithLinks.length} tracks`);
      
      // Fetch channel info
      const channelInfo = await fetchChannelInfo(video.snippet.channelId);
      
      const { data: savedData, error } = await supabaseAdmin
        .from('station_playlists')
        .insert({
          playlist_id: `tracklist_${videoId}`,
          title: video.snippet.title,
          description: `Extracted from: ${video.snippet.title}`,
          thumbnail_url: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
          channel_title: video.snippet.channelTitle,
          channel_id: video.snippet.channelId,
          channel_info: channelInfo,
          tracks: tracksWithLinks,
          user_id: userId,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Extracted ${tracklist.length} tracks from video`,
        playlist: savedData,
        tracksCount: tracklist.length,
        type: 'tracklist'
      });
    } else {
      // No tracklist - save as single video
      console.log('ℹ️  No tracklist found, saving as single video');
      
      const track = {
        id: videoId,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        thumbnail_url: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
        duration: parseDuration(video.contentDetails.duration),
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: 'youtube'
      };

      const { data: savedData, error } = await supabaseAdmin
        .from('station_playlists')
        .insert({
          playlist_id: `video_${videoId}`,
          title: video.snippet.title,
          description: video.snippet.description || '',
          thumbnail_url: track.thumbnail_url,
          channel_title: video.snippet.channelTitle,
          channel_id: video.snippet.channelId,
          tracks: [track],
          user_id: userId,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Video added successfully',
        playlist: savedData
      });
    }

  } catch (error: any) {
    console.error('❌ Video processing error:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      message: `Video processing failed: ${error.message}`,
      errorType: 'VIDEO_ERROR',
      details: error.toString()
    }, { status: 500 });
  }
}

/**
 * Fetch playlist metadata
 */
async function fetchPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata> {
  const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('id', playlistId);
  url.searchParams.set('key', YT_API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Playlist not found');
  }

  const playlist = data.items[0];
  const channelId = playlist.snippet.channelId;

  // Fetch channel info
  const channelInfo = await fetchChannelInfo(channelId);

  return {
    title: playlist.snippet.title,
    description: playlist.snippet.description || '',
    thumbnail: playlist.snippet.thumbnails.medium?.url || playlist.snippet.thumbnails.default?.url,
    channelTitle: playlist.snippet.channelTitle,
    channelId: channelId,
    channelInfo: channelInfo
  };
}

/**
 * Fetch channel information
 */
async function fetchChannelInfo(channelId: string) {
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', channelId);
    url.searchParams.set('key', YT_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        title: channel.snippet.title,
        profileImage: channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
        subscriberCount: channel.statistics.subscriberCount || '0',
        videoCount: channel.statistics.videoCount || '0',
        description: channel.snippet.description || ''
      };
    }
  } catch (error) {
    console.error('Error fetching channel info:', error);
  }

  return {
    title: 'Unknown Channel',
    profileImage: '',
    subscriberCount: '0',
    videoCount: '0',
    description: ''
  };
}

/**
 * Fetch all playlist items with pagination
 */
async function fetchAllPlaylistItems(playlistId: string) {
  let items: any[] = [];
  let nextPageToken = '';
  let page = 0;
  const maxPages = 10; // Safety limit (500 videos max)

  do {
    console.log(`📄 Fetching page ${page + 1}...`);
    
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', YT_API_KEY);
    
    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken);
    }

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`YouTube API error: ${errorData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    
    items.push(...(data.items || []));
    nextPageToken = data.nextPageToken || '';
    page++;

  } while (nextPageToken && page < maxPages);

  return items;
}

/**
 * Process videos in batches (YouTube API limit: 50 per request)
 */
async function batchProcessVideos(items: any[]): Promise<Track[]> {
  const tracks: Track[] = [];
  const batchSize = 50;

  for (let i = 0; i < items.length; i += batchSize) {
    console.log(`🎵 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}...`);
    
    const batch = items.slice(i, i + batchSize);
    const videoIds = batch
      .map(item => item.contentDetails?.videoId)
      .filter(Boolean)
      .join(',');

    if (!videoIds) continue;

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoIds);
    url.searchParams.set('key', YT_API_KEY);

    const res = await fetch(url.toString());
    
    if (!res.ok) {
      console.error('Error fetching video details:', res.statusText);
      continue;
    }

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
 * Extract tracklist from video description and comments
 */
async function extractTracklistFromVideo(videoId: string, description: string) {
  // 1. Try description first
  const descriptionTracks = parseTracklistFromText(description);
  
  if (descriptionTracks.length >= 3) {
    console.log(`✅ Found ${descriptionTracks.length} tracks in description`);
    return descriptionTracks;
  }

  // 2. Try comments
  try {
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YT_API_KEY}`;
    const res = await fetch(commentsUrl);
    const data = await res.json();

    if (data.items) {
      for (const comment of data.items) {
        const commentText = comment.snippet.topLevelComment.snippet.textDisplay.replace(/<[^>]*>/g, '');
        const commentTracks = parseTracklistFromText(commentText);
        
        if (commentTracks.length >= 3) {
          console.log(`✅ Found ${commentTracks.length} tracks in comments`);
          return commentTracks;
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Could not fetch comments:', error);
  }

  return [];
}

/**
 * Search YouTube for each track and add links
 */
async function searchYouTubeForTracks(tracks: any[]) {
  const tracksWithLinks = await Promise.all(
    tracks.map(async (track, index) => {
      try {
        // Search YouTube for the track
        const searchQuery = `${track.artist} ${track.title}`;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=10&maxResults=1&key=${YT_API_KEY}`;
        
        const res = await fetch(searchUrl);
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const video = data.items[0];
          const videoId = video.id.videoId;
          
          // Get video duration
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YT_API_KEY}`;
          const detailsRes = await fetch(videoDetailsUrl);
          const detailsData = await detailsRes.json();
          
          if (detailsData.items && detailsData.items.length > 0) {
            const videoDetails = detailsData.items[0];
            
            return {
              ...track,
              youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail_url: videoDetails.snippet.thumbnails.medium?.url || 
                            videoDetails.snippet.thumbnails.default?.url ||
                            `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
              duration: parseDuration(videoDetails.contentDetails.duration),
              video_type: determineVideoType(videoDetails.snippet.title)
            };
          }
        }
        
        // Fallback if search fails
        return {
          ...track,
          youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          thumbnail_url: track.thumbnail_url,
          duration: 0
        };
        
      } catch (error) {
        console.error(`Error searching for track ${track.title}:`, error);
        return track;
      }
    })
  );
  
  return tracksWithLinks;
}

/**
 * Determine video type from title
 */
function determineVideoType(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('official video') || lowerTitle.includes('m/v') || lowerTitle.includes('mv')) {
    return 'Official MV';
  } else if (lowerTitle.includes('audio') || lowerTitle.includes('오디오')) {
    return 'Audio';
  } else if (lowerTitle.includes('live') || lowerTitle.includes('라이브')) {
    return 'Live';
  } else if (lowerTitle.includes('performance') || lowerTitle.includes('퍼포먼스')) {
    return 'Performance';
  }
  
  return 'Music Video';
}

/**
 * Parse tracklist from text using timestamp patterns
 */
function parseTracklistFromText(text: string) {
  const tracks: any[] = [];
  
  // Find all timestamps and extract tracks between them
  const timestampPattern = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
  const matches = [];
  let match;
  
  while ((match = timestampPattern.exec(text)) !== null) {
    matches.push({ timestamp: match[1], index: match.index });
  }
  
  // Extract track info between timestamps
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    const startIndex = current.index;
    const endIndex = next ? next.index : text.length;
    const trackText = text.substring(startIndex, endIndex).trim();
    
    // Remove timestamp and parse artist - title
    const cleanText = trackText.replace(current.timestamp, '').trim();
    const parts = cleanText.split(/\s*[-–—]\s*/);
    
    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' - ').trim();
      
      // Validate
      if (artist && title && artist.length > 1 && title.length > 1 && 
          artist.length < 100 && title.length < 100 &&
          !artist.match(/^https?:\/\//)) {
        
        tracks.push({
          id: `track_${i + 1}`,
          title: title,
          artist: artist,
          timestamp: current.timestamp,
          thumbnail_url: `https://img.youtube.com/vi/default/mqdefault.jpg`,
          duration: 0,
          youtube_url: '',
          platform: 'youtube',
          trackNumber: i + 1
        });
      }
    }
  }
  
  return tracks;
}

/**
 * Parse ISO 8601 duration to seconds
 */
function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

