import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('playlistId');
    const maxResults = searchParams.get('maxResults') || '50';
    
    if (!playlistId) {
      return NextResponse.json({ error: 'playlistId is required' }, { status: 400 });
    }

    // Get playlist items
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', maxResults);
    url.searchParams.set('key', API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }

    const data = await res.json();
    const items = data.items || [];

    // Extract video IDs for batch video details
    const videoIds = items.map((item: any) => item.contentDetails?.videoId).filter(Boolean);
    
    if (videoIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Get detailed video information
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videosUrl.searchParams.set('part', 'snippet,contentDetails');
    videosUrl.searchParams.set('id', videoIds.join(','));
    videosUrl.searchParams.set('key', API_KEY);

    const videosRes = await fetch(videosUrl.toString());
    if (!videosRes.ok) {
      return NextResponse.json({ error: 'YouTube videos API error' }, { status: 500 });
    }

    const videosData = await videosRes.json();
    const videos = videosData.items || [];

    // Combine playlist item order with video details
    const result = items.map((item: any) => {
      const videoId = item.contentDetails?.videoId;
      const video = videos.find((v: any) => v.id === videoId);
      
      if (!video) return null;

      // Extract duration
      let durationSec = 0;
      try {
        const iso = video.contentDetails?.duration;
        if (iso) {
          const re = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
          const m = iso.match(re);
          if (m) {
            const h = parseInt(m[1] || '0', 10);
            const mnt = parseInt(m[2] || '0', 10);
            const s = parseInt(m[3] || '0', 10);
            durationSec = h * 3600 + mnt * 60 + s;
          }
        }
      } catch {}

      return {
        id: videoId,
        title: video.snippet?.title || 'Unknown',
        artist: video.snippet?.channelTitle || 'Unknown',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: durationSec,
        platform: 'youtube',
        externalId: videoId,
        publishedAt: video.snippet?.publishedAt,
      };
    }).filter(Boolean);

    return NextResponse.json({ items: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}






