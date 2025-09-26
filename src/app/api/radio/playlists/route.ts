import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

// Ephemeral in-memory store (demo only). Resets on cold start.
type StoredPlaylist = {
  playlistId: string;
  title: string;
  description?: string;
  thumbnails?: any;
  channelTitle?: string;
  channelId?: string;
  createdAt: string;
};

const userPlaylists: StoredPlaylist[] = [];

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function GET() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('radio_playlists')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) return NextResponse.json({ items: data });
    }
    return NextResponse.json({ items: userPlaylists });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const playlistId: string | undefined = body?.playlistId;
    if (!playlistId || typeof playlistId !== 'string') {
      return NextResponse.json({ error: 'playlistId is required' }, { status: 400 });
    }

    // Dedupe
    if (userPlaylists.some((p) => p.playlistId === playlistId)) {
      const existing = userPlaylists.find((p) => p.playlistId === playlistId)!;
      return NextResponse.json({ item: existing, deduped: true }, { status: 200 });
    }

    // Fetch playlist snippet for metadata
    let meta: StoredPlaylist | null = null;
    let tracks: any[] = [];
    
    try {
      // Get playlist metadata
      const url = new URL('https://www.googleapis.com/youtube/v3/playlists');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('id', playlistId);
      url.searchParams.set('key', API_KEY);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const it = data.items?.[0];
        if (it?.snippet) {
          meta = {
            playlistId,
            title: it.snippet.title,
            description: it.snippet.description,
            thumbnails: it.snippet.thumbnails,
            channelTitle: it.snippet.channelTitle,
            channelId: it.snippet.channelId,
            createdAt: new Date().toISOString(),
          };
        }
      }

      // Get playlist tracks
      const tracksRes = await fetch(`${req.nextUrl.origin}/api/youtube/playlist-items?playlistId=${playlistId}&maxResults=50`);
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        tracks = tracksData.items || [];
      }
    } catch {/* ignore fetch errors, fallback below */}

    if (!meta) {
      meta = {
        playlistId,
        title: 'YouTube Playlist',
        description: '',
        thumbnails: undefined,
        createdAt: new Date().toISOString(),
      } as StoredPlaylist;
    }

    if (supabase) {
      await supabase.from('radio_playlists').upsert({
        id: playlistId,
        title: meta.title,
        description: meta.description,
        thumb: meta.thumbnails || null,
        channel: meta.channelTitle || null,
        tracks_json: tracks, // Store tracks as JSON
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ item: { ...meta, tracks }, deduped: false }, { status: 201 });
    }
    {
      userPlaylists.unshift(meta);
      return NextResponse.json({ item: { ...meta, tracks }, deduped: false }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


