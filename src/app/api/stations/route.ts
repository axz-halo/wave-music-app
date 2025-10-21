import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ items: [] });
    const { data, error } = await supabase
      .from('station_playlists')
      .select('id, user_id, title, description, thumbnail_url, channel_title, channel_id, channel_info, tracks, likes, comments, shares, is_shared, shared_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}












