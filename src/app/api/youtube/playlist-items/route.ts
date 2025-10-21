import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

// YouTube 댓글에서 음원 정보 추출하는 함수
async function extractMusicFromComments(videoId: string): Promise<any[]> {
  try {
    const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
    commentsUrl.searchParams.set('part', 'snippet,replies');
    commentsUrl.searchParams.set('videoId', videoId);
    commentsUrl.searchParams.set('maxResults', '100');
    commentsUrl.searchParams.set('order', 'relevance');
    commentsUrl.searchParams.set('key', API_KEY);

    const commentsRes = await fetch(commentsUrl.toString());
    if (!commentsRes.ok) {
      console.log('댓글 API 에러:', commentsRes.status);
      return [];
    }

    const commentsData = await commentsRes.json();
    const comments = commentsData.items || [];
    
    const musicTracks: any[] = [];
    
    // 댓글에서 음원 정보 추출
    comments.forEach((comment: any) => {
      const text = comment.snippet?.topLevelComment?.snippet?.textDisplay || '';
      
      // 시간 정보와 함께 음원 정보가 있는 패턴들
      const patterns = [
        // "00:00 Song Name - Artist" 패턴
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*-\s*([^\n]+)/g,
        // "00:00 Song Name by Artist" 패턴  
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*by\s*([^\n]+)/g,
        // "Song Name - Artist (00:00)" 패턴
        /([^-\n]+?)\s*-\s*([^\n]+?)\s*\((\d{1,2}:\d{2})\)/g,
        // "Song Name by Artist (00:00)" 패턴
        /([^-\n]+?)\s*by\s*([^\n]+?)\s*\((\d{1,2}:\d{2})\)/g,
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let timeStr, songName, artist;
          
          if (match[3] && match[3].includes(':')) {
            // 시간이 마지막에 있는 패턴
            songName = match[1].trim();
            artist = match[2].trim();
            timeStr = match[3];
          } else {
            // 시간이 처음에 있는 패턴
            timeStr = match[1];
            songName = match[2].trim();
            artist = match[3].trim();
          }

          // 시간을 초로 변환
          const timeParts = timeStr.split(':');
          const duration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

          musicTracks.push({
            id: `comment_${comment.id}_${musicTracks.length}`,
            title: songName,
            artist: artist,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            duration: duration,
            platform: 'youtube',
            externalId: videoId,
            timestamp: timeStr,
            videoType: 'comment_extracted',
            source: 'comment'
          });
        }
      });
    });

    return musicTracks;
  } catch (error) {
    console.error('댓글에서 음원 추출 에러:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('playlistId');
    const maxResults = searchParams.get('maxResults') || '50';
    const extractComments = searchParams.get('extractComments') === 'true';
    
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
    const playlistTracks = items.map((item: any) => {
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
        videoType: 'playlist_item',
        source: 'playlist'
      };
    }).filter(Boolean);

    let allTracks = [...playlistTracks];

    // 댓글에서 음원 추출이 요청된 경우
    if (extractComments) {
      console.log('🎵 댓글에서 음원 정보 추출 시작...');
      
      // 각 비디오의 댓글에서 음원 정보 추출
      for (const videoId of videoIds.slice(0, 5)) { // 최대 5개 비디오만 처리
        try {
          const commentTracks = await extractMusicFromComments(videoId);
          allTracks = [...allTracks, ...commentTracks];
          console.log(`📝 ${videoId}에서 ${commentTracks.length}개 음원 추출`);
        } catch (error) {
          console.error(`댓글 추출 에러 (${videoId}):`, error);
        }
      }
      
      console.log(`🎶 총 ${allTracks.length}개 트랙 추출 완료`);
    }

    return NextResponse.json({ 
      items: allTracks,
      playlistTracks: playlistTracks.length,
      commentTracks: allTracks.length - playlistTracks.length
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}










