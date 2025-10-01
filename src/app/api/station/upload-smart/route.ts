import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseYouTubePlaylistId, parseYouTubeId } from '@/lib/youtube';

const YT_API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

/**
 * Smart Upload Route
 * Automatically detects if a video contains a tracklist and extracts it
 */
export async function POST(req: NextRequest) {
  try {
    const { url, type } = await req.json();
    
    if (!supabaseServer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database not available' 
      }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }

    if (type === 'playlist') {
      // Regular playlist - use existing logic
      return await handlePlaylistUpload(url, user.id);
    } else if (type === 'video') {
      // Smart video detection - check for tracklist
      return await handleSmartVideoUpload(url, user.id);
    }

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to process upload'
    }, { status: 500 });
  }
}

/**
 * Smart video upload - detects and extracts tracklists
 */
async function handleSmartVideoUpload(url: string, userId: string) {
  const videoId = parseYouTubeId(url);
  
  if (!videoId) {
    return NextResponse.json({ 
      success: false, 
      message: 'Invalid video URL' 
    }, { status: 400 });
  }

  console.log('🎵 Smart processing video:', videoId);

  try {
    // 1. Fetch video details
    const videoDetails = await fetchVideoDetails(videoId);
    
    // 2. Try to extract tracklist
    console.log('🔍 Checking for tracklist...');
    const tracklist = await extractTracklist(videoId, videoDetails);
    
    if (tracklist.length > 0) {
      console.log(`✅ Found ${tracklist.length} tracks in video`);
      
      // Save as multi-track playlist
      const { data, error } = await supabaseServer!
        .from('station_playlists')
        .insert({
          playlist_id: `tracklist_${videoId}`,
          title: videoDetails.title,
          description: `Extracted from: ${videoDetails.title}`,
          thumbnail_url: videoDetails.thumbnail,
          channel_title: videoDetails.channelTitle,
          channel_id: videoDetails.channelId,
          channel_info: videoDetails.channelInfo,
          tracks: tracklist,
          user_id: userId,
          status: 'completed',
          metadata: {
            source: 'tracklist_extraction',
            originalVideoId: videoId,
            extractedFrom: 'description_or_comments'
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: `Extracted ${tracklist.length} tracks from video`,
        playlist: data,
        tracksCount: tracklist.length,
        type: 'tracklist'
      });
    } else {
      console.log('ℹ️  No tracklist found, saving as single video');
      
      // Save as single video
      const track = {
        id: videoId,
        title: videoDetails.title,
        artist: videoDetails.channelTitle,
        thumbnail_url: videoDetails.thumbnail,
        duration: videoDetails.duration,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        platform: 'youtube'
      };

      const { data, error } = await supabaseServer!
        .from('station_playlists')
        .insert({
          playlist_id: `video_${videoId}`,
          title: videoDetails.title,
          description: videoDetails.description,
          thumbnail_url: videoDetails.thumbnail,
          channel_title: videoDetails.channelTitle,
          channel_id: videoDetails.channelId,
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
        playlist: data,
        type: 'single_video'
      });
    }

  } catch (error: any) {
    console.error('❌ Smart upload error:', error);
    throw error;
  }
}

/**
 * Fetch video details
 */
async function fetchVideoDetails(videoId: string) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YT_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  
  // Fetch channel info
  const channelInfo = await fetchChannelInfo(video.snippet.channelId);

  return {
    title: video.snippet.title,
    description: video.snippet.description || '',
    channelTitle: video.snippet.channelTitle,
    channelId: video.snippet.channelId,
    channelInfo: channelInfo,
    thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
    duration: parseDuration(video.contentDetails.duration)
  };
}

/**
 * Extract tracklist from video description and comments
 */
async function extractTracklist(videoId: string, videoDetails: any) {
  // 1. Try description first
  const descriptionTracks = parseTracklistFromText(videoDetails.description);
  
  if (descriptionTracks.length >= 3) {
    console.log(`✅ Found ${descriptionTracks.length} tracks in description`);
    return descriptionTracks;
  }

  // 2. Try top comments
  try {
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&order=relevance&key=${YT_API_KEY}`;
    const res = await fetch(commentsUrl);
    const data = await res.json();

    if (data.items) {
      // Check top comments for tracklists
      for (const comment of data.items) {
        const commentText = comment.snippet.topLevelComment.snippet.textDisplay;
        const commentTracks = parseTracklistFromText(commentText);
        
        // If we find at least 3 tracks, consider it a valid tracklist
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
 * Parse tracklist from text using multiple patterns
 */
function parseTracklistFromText(text: string) {
  const tracks: any[] = [];
  const lines = text.split('\n');
  
  const patterns = [
    // Timestamp formats: 00:00 Artist - Title or 00:00 - Artist - Title
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+)/,
    /(\d{1,2}:\d{2})\s+(.+?)\s*[-–—]\s*(.+)/,
    // Numbered: 1. Artist - Title
    /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/,
    // Simple: Artist - Title (minimum 3 chars each side)
    /^([^-–—]{3,})\s*[-–—]\s*([^-–—]{3,})$/,
  ];
  
  let trackNumber = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and very short lines
    if (!trimmed || trimmed.length < 5) continue;
    
    // Skip lines that look like section headers or notes
    if (trimmed.match(/^(tracklist|playlist|setlist|credits|follow|subscribe|listen)/i)) {
      continue;
    }
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      
      if (match) {
        let timestamp = '';
        let artist = '';
        let title = '';
        
        if (match.length === 4 && match[1].includes(':')) {
          // Has timestamp
          timestamp = match[1];
          artist = match[2].trim();
          title = match[3].trim();
        } else if (match.length === 3) {
          // No timestamp
          artist = match[1].trim();
          title = match[2].trim();
        }
        
        // Validate track info
        if (artist && title && 
            artist.length > 1 && title.length > 1 &&
            artist.length < 100 && title.length < 100) {
          
          tracks.push({
            id: `track_${trackNumber}`,
            title: title,
            artist: artist,
            timestamp: timestamp,
            thumbnail_url: `https://img.youtube.com/vi/default/mqdefault.jpg`,
            duration: 0, // Will be populated if we search for individual tracks
            youtube_url: '', // Could search YouTube for each track
            platform: 'youtube',
            trackNumber: trackNumber
          });
          
          trackNumber++;
          break; // Move to next line after successful match
        }
      }
    }
  }
  
  return tracks;
}

/**
 * Fetch channel info
 */
async function fetchChannelInfo(channelId: string) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YT_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        title: channel.snippet.title,
        profileImage: channel.snippet.thumbnails.medium?.url || '',
        subscriberCount: channel.statistics.subscriberCount || '0',
        videoCount: channel.statistics.videoCount || '0',
      };
    }
  } catch (error) {
    console.error('Error fetching channel info:', error);
  }

  return {
    title: 'Unknown',
    profileImage: '',
    subscriberCount: '0',
    videoCount: '0',
  };
}

/**
 * Regular playlist upload (existing logic)
 */
async function handlePlaylistUpload(url: string, userId: string) {
  // Same as upload-v2 logic...
  // (Redirect to upload-v2 or duplicate the logic)
  return NextResponse.json({
    success: false,
    message: 'Use upload-v2 for playlist uploads'
  });
}

/**
 * Parse ISO duration
 */
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0') * 3600) + 
         (parseInt(match[2] || '0') * 60) + 
         parseInt(match[3] || '0');
}

