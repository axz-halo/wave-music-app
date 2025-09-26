import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ items: [] });
    const { data, error } = await supabase
      .from('stations')
      .select('id, user_id, title, description, track_external_id, track_platform, track_title, track_artist, thumb_url, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}





