import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

// YouTube 댓글에서 음원 정보 추출하는 함수
async function extractMusicFromComments(videoId: string): Promise<any[]> {
  try {
    console.log('🎵 Extracting music from comments for video:', videoId);
    
    // 먼저 비디오 정보 가져오기 (채널명 사용을 위해)
    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videoUrl.searchParams.set('part', 'snippet');
    videoUrl.searchParams.set('id', videoId);
    videoUrl.searchParams.set('key', API_KEY);
    
    const videoRes = await fetch(videoUrl.toString());
    let channelTitle = 'Unknown Channel';
    
    if (videoRes.ok) {
      const videoData = await videoRes.json();
      channelTitle = videoData.items?.[0]?.snippet?.channelTitle || 'Unknown Channel';
      console.log(`📺 Channel: ${channelTitle}`);
    }
    
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
    
    console.log(`📝 Found ${comments.length} comments`);
    
    const musicTracks: any[] = [];
    
    // 댓글에서 음원 정보 추출
    comments.forEach((comment: any, index: number) => {
      let text = comment.snippet?.topLevelComment?.snippet?.textDisplay || '';
      const author = comment.snippet?.topLevelComment?.snippet?.authorDisplayName || 'Unknown';
      
      // HTML 태그 제거 (링크 등)
      text = text.replace(/<a[^>]*>/g, '').replace(/<\/a>/g, '');
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<[^>]*>/g, '');
      // HTML 엔티티 디코딩
      text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      // 줄바꿈 정리
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
      
      console.log(`📝 Comment ${index + 1} by ${author}:`, text.substring(0, 200) + '...');
      
      // 각 라인을 개별로 처리
      const lines = text.split('\n');
      
      lines.forEach((lineText: string) => {
        let line = lineText.trim();
        if (!line || line.length < 3) return;
        
        // 시간 패턴 매칭 (시:분:초 또는 분:초)
        const timePattern = /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/;
        const match = line.match(timePattern);
        
        if (match) {
          const timeStr = match[1];
          let content = match[2].trim();
          
          // 중복 제거 (같은 내용이 반복되는 경우, 예: "그때 나는 그때 나는")
          const contentParts = content.split(/\s+/);
          if (contentParts.length >= 4 && contentParts.length % 2 === 0) {
            const half = contentParts.length / 2;
            const firstHalf = contentParts.slice(0, half).join(' ');
            const secondHalf = contentParts.slice(half).join(' ');
            if (firstHalf === secondHalf) {
              content = firstHalf;
            }
          }
          
          // 아티스트와 곡명 분리
          let songName, artist;
          
          if (content.includes(' - ')) {
            const splitParts = content.split(' - ');
            artist = splitParts[0].trim();
            songName = splitParts.slice(1).join(' - ').trim();
          } else if (content.includes(' by ')) {
            const splitParts = content.split(' by ');
            artist = splitParts[0].trim();
            songName = splitParts.slice(1).join(' by ').trim();
          } else {
            // 곡제목만 있는 경우
            songName = content;
            artist = channelTitle; // 채널명을 아티스트로 사용
          }
          
          // 곡명 정리
          songName = songName.trim();
          artist = artist.trim();
          
          // 너무 짧거나 숫자만 있거나 URL인 경우 제외
          if (songName.length < 2 || /^\d+$/.test(songName) || songName.startsWith('http')) {
            return;
          }

          // 시간을 초로 변환
          const timeParts = timeStr.split(':');
          let seconds = 0;
          
          if (timeParts.length === 3) {
            // 시:분:초 형식
            seconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2]);
          } else if (timeParts.length === 2) {
            // 분:초 형식
            seconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          } else {
            // 초만 있는 경우
            seconds = parseInt(timeParts[0]);
          }
          
          // 이미 있는 트랙인지 확인 (제목이 같고 시간이 비슷한 경우)
          const existingTrack = musicTracks.find(track => 
            track.title === songName && Math.abs(track.seconds - seconds) < 10
          );

          if (!existingTrack && seconds >= 0) {
            musicTracks.push({
              id: `comment-${musicTracks.length + 1}`,
              title: songName,
              artist: artist,
              timestamp: timeStr,
              seconds: seconds,
              source: 'comment',
              author: author,
              youtubeUrl: `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`
            });
            
            console.log(`🎵 Found track: ${songName} - ${artist} (${timeStr})`);
          }
        }
      });
    });

    console.log(`🎵 Extracted ${musicTracks.length} tracks from comments`);
    return musicTracks;
    
  } catch (error) {
    console.error('Error extracting music from comments:', error);
    return [];
  }
}

// YouTube 검색으로 트랙 정보 가져오기
async function searchTrackOnYouTube(title: string, artist: string): Promise<any | null> {
  try {
    const searchQuery = `${title} ${artist}`;
    console.log(`🔍 Searching YouTube for: ${searchQuery}`);
    
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', searchQuery);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoCategoryId', '10'); // Music category
    searchUrl.searchParams.set('maxResults', '1');
    searchUrl.searchParams.set('key', API_KEY);

    const response = await fetch(searchUrl.toString());
    if (!response.ok) {
      console.log('YouTube search API error:', response.status);
      return null;
    }

    const data = await response.json();
    const video = data.items?.[0];
    
    if (!video) {
      console.log(`❌ No video found for: ${searchQuery}`);
      return null;
    }

    const videoId = video.id.videoId;
    const snippet = video.snippet;
    
    // 비디오 상세 정보 가져오기 (duration 등)
    const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailUrl.searchParams.set('part', 'contentDetails');
    detailUrl.searchParams.set('id', videoId);
    detailUrl.searchParams.set('key', API_KEY);

    const detailResponse = await fetch(detailUrl.toString());
    let duration = 0;
    
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      const durationStr = detailData.items?.[0]?.contentDetails?.duration;
      if (durationStr) {
        // ISO 8601 duration to seconds
        const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
          const hours = parseInt(match[1] || '0', 10);
          const minutes = parseInt(match[2] || '0', 10);
          const secs = parseInt(match[3] || '0', 10);
          duration = hours * 3600 + minutes * 60 + secs;
        }
      }
    }

    const track = {
      id: videoId,
      title: snippet.title,
      artist: snippet.channelTitle,
      platform: 'youtube',
      externalId: videoId,
      thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
      duration: duration,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      originalTitle: title,
      originalArtist: artist
    };

    console.log(`✅ Found track: ${track.title} - ${track.artist}`);
    return track;
    
  } catch (error) {
    console.error('Error searching track on YouTube:', error);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    
    if (!videoId) {
      return NextResponse.json({ 
        success: false, 
        error: 'videoId parameter is required' 
      }, { status: 400 });
    }

    console.log('🎵 Starting comment extraction and search for video:', videoId);
    
    // 댓글에서 음원 정보 추출
    const extractedTracks = await extractMusicFromComments(videoId);
    
    // 각 추출된 트랙을 YouTube에서 검색
    const searchPromises = extractedTracks.map(async (track) => {
      const searchResult = await searchTrackOnYouTube(track.title, track.artist);
      if (searchResult) {
        return {
          ...searchResult,
          originalTimestamp: track.timestamp,
          originalSeconds: track.seconds,
          source: 'comment'
        };
      }
      return null;
    });

    const searchResults = await Promise.all(searchPromises);
    const playableTracks = searchResults.filter(track => track !== null);
    
    console.log(`🎵 Found ${playableTracks.length} playable tracks out of ${extractedTracks.length} extracted tracks`);
    
    return NextResponse.json({
      success: true,
      videoId: videoId,
      extractedCount: extractedTracks.length,
      playableCount: playableTracks.length,
      tracks: playableTracks
    });
    
  } catch (error) {
    console.error('Error in extract-and-search API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
