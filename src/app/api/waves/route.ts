import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getCurrentSession } from '@/lib/authSupa';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentSession();
    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized - Please log in first' }, { status: 401 });
    }

    const body = await req.json();
    const { youtubeUrl, track, comment, moodEmoji, moodText } = body;

    if (!track || !track.externalId) {
      return NextResponse.json({ error: 'Track information required' }, { status: 400 });
    }

    const payload: any = {
      user_id: user.id,
      comment: comment || '',
      mood_emoji: moodEmoji || null,
      mood_text: moodText || null,
      track_title: track.title || 'Unknown',
      track_artist: track.artist || '',
      track_platform: 'youtube',
      track_external_id: track.externalId,
      thumb_url: track.thumbnailUrl || `https://img.youtube.com/vi/${track.externalId}/mqdefault.jpg`,
    };

    const { data, error } = await supabase
      .from('waves')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        success: false, 
        errorCode: 'WAVE_CREATE_ERROR_002',
        message: '🚨 WAVE: Failed to create wave - database error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, wave: data });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('waves')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch waves' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, waves: data || [] });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}