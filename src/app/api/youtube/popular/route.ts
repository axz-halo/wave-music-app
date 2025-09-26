import { NextResponse } from 'next/server';

// NOTE: For production, move API key to environment variable!
const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function GET() {
  try {
    // Search popular music playlists (heuristic: topic: music, order by relevance)
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'playlist');
    searchUrl.searchParams.set('q', 'music playlist');
    searchUrl.searchParams.set('maxResults', '10');
    searchUrl.searchParams.set('key', API_KEY);

    const res = await fetch(searchUrl.toString());
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: 'YouTube API error', details: txt }, { status: 500 });
    }
    const data = await res.json();
    const items = (data.items || []).map((it: any) => ({
      playlistId: it.id.playlistId,
      title: it.snippet.title,
      description: it.snippet.description,
      thumbnails: it.snippet.thumbnails,
      channelTitle: it.snippet.channelTitle,
      channelId: it.snippet.channelId,
    }));
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}



