import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const maxResults = searchParams.get('maxResults') || '5';
    
    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    // Get channel's playlists
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('maxResults', maxResults);
    url.searchParams.set('key', API_KEY);

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: 'YouTube API error' }, { status: 500 });
    }

    const data = await res.json();
    const playlists = data.items || [];

    // Get playlist statistics (view counts, etc.)
    const playlistIds = playlists.map((p: any) => p.id).filter(Boolean);
    
    if (playlistIds.length === 0) {
      return NextResponse.json({ playlists: [] });
    }

    // Get detailed playlist information including statistics
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
    detailsUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
    detailsUrl.searchParams.set('id', playlistIds.join(','));
    detailsUrl.searchParams.set('key', API_KEY);

    const detailsRes = await fetch(detailsUrl.toString());
    if (!detailsRes.ok) {
      return NextResponse.json({ error: 'YouTube playlists details API error' }, { status: 500 });
    }

    const detailsData = await detailsRes.json();
    const detailedPlaylists = detailsData.items || [];

    // Combine and sort by view count (most popular first)
    const result = detailedPlaylists.map((playlist: any) => ({
      id: playlist.id,
      title: playlist.snippet?.title || 'Unknown Playlist',
      description: playlist.snippet?.description || '',
      thumbnailUrl: playlist.snippet?.thumbnails?.high?.url || playlist.snippet?.thumbnails?.medium?.url || `https://img.youtube.com/vi/${playlist.id}/hqdefault.jpg`,
      itemCount: playlist.contentDetails?.itemCount || 0,
      viewCount: parseInt(playlist.statistics?.viewCount || '0', 10),
      publishedAt: playlist.snippet?.publishedAt,
      channelTitle: playlist.snippet?.channelTitle,
    })).sort((a: any, b: any) => b.viewCount - a.viewCount);

    return NextResponse.json({ playlists: result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}



