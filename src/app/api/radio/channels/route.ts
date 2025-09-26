import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

type StoredChannel = {
  channelId: string;
  title: string;
  thumbnails?: any;
  handle?: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  playlists?: any[];
  createdAt: string;
};

const userChannels: StoredChannel[] = [];

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

export async function GET() {
  if (supabase) {
    const { data, error } = await supabase
      .from('radio_channels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) return NextResponse.json({ items: data });
  }
  return NextResponse.json({ items: userChannels });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channelId: string | undefined = body?.channelId;
    const channelInfo: any = body?.channelInfo;
    const playlists: any[] = body?.playlists || [];
    
    if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 400 });

    const exists = userChannels.find((c) => c.channelId === channelId);
    if (exists) return NextResponse.json({ item: exists, deduped: true }, { status: 200 });

    let meta: StoredChannel | null = null;
    
    // Use provided channel info or fetch from API
    if (channelInfo) {
      meta = {
        channelId,
        title: channelInfo.title,
        thumbnails: channelInfo.thumbnails,
        handle: channelInfo.handle,
        subscriberCount: channelInfo.subscriberCount,
        videoCount: channelInfo.videoCount,
        viewCount: channelInfo.viewCount,
        playlists: playlists,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Fallback to API fetch
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/channels');
        url.searchParams.set('part', 'snippet,statistics');
        url.searchParams.set('id', channelId);
        url.searchParams.set('key', API_KEY);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const item = data.items?.[0];
          const snippet = item?.snippet;
          const stats = item?.statistics;
          if (snippet) {
            meta = {
              channelId,
              title: snippet.title,
              thumbnails: snippet.thumbnails,
              handle: snippet.customUrl,
              subscriberCount: stats?.subscriberCount || '0',
              videoCount: stats?.videoCount || '0',
              viewCount: stats?.viewCount || '0',
              playlists: [],
              createdAt: new Date().toISOString(),
            };
          }
        }
      } catch {}
    }

    if (!meta) {
      meta = { 
        channelId, 
        title: 'YouTube Channel', 
        playlists: [],
        createdAt: new Date().toISOString() 
      } as StoredChannel;
    }

    if (supabase) {
      await supabase.from('radio_channels').upsert({
        id: channelId,
        title: meta.title,
        handle: meta.handle || null,
        thumb: meta.thumbnails || null,
        subscriber_count: meta.subscriberCount || '0',
        video_count: meta.videoCount || '0',
        view_count: meta.viewCount || '0',
        playlists_json: meta.playlists || [],
        created_at: new Date().toISOString(),
      });
      return NextResponse.json({ item: meta, deduped: false }, { status: 201 });
    }
    {
      userChannels.unshift(meta);
      return NextResponse.json({ item: meta, deduped: false }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}


