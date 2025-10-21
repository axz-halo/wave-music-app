import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults') || '10';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    if (!API_KEY) {
      console.error('YouTube API key not configured');
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // YouTube Data API v3 Search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${API_KEY}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      return NextResponse.json(
        { error: 'YouTube API request failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform to simpler format
    const results = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return NextResponse.json({
      success: true,
      results,
      totalResults: data.pageInfo?.totalResults || 0,
    });

  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}




