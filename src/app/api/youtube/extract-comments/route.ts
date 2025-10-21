import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

// YouTube 댓글에서 음원 정보 추출하는 함수
async function extractMusicFromComments(videoId: string): Promise<any[]> {
  try {
    console.log('🎵 Extracting music from comments for video:', videoId);
    
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
      
      // HTML 태그 제거
      text = text.replace(/<[^>]*>/g, '');
      // HTML 엔티티 디코딩
      text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      // 줄바꿈 정리
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      console.log(`📝 Comment ${index + 1} by ${author}:`, text.substring(0, 200) + '...');
      
      // 시간 정보와 함께 음원 정보가 있는 패턴들
      const patterns = [
        // "0:03:17 김승민 - 내 기쁨은 너가 벤틀리를 끄는 거야" 패턴
        /(\d{1,2}:\d{2}:\d{2})\s*([^-\n]+?)\s*-\s*([^\n]+)/g,
        // "0:03:17 김승민 by 내 기쁨은 너가 벤틀리를 끄는 거야" 패턴  
        /(\d{1,2}:\d{2}:\d{2})\s*([^-\n]+?)\s*by\s*([^\n]+)/g,
        // "김승민 - 내 기쁨은 너가 벤틀리를 끄는 거야 (0:03:17)" 패턴
        /([^-\n]+?)\s*-\s*([^\n]+?)\s*\((\d{1,2}:\d{2}:\d{2})\)/g,
        // "김승민 by 내 기쁨은 너가 벤틀리를 끄는 거야 (0:03:17)" 패턴
        /([^-\n]+?)\s*by\s*([^\n]+?)\s*\((\d{1,2}:\d{2}:\d{2})\)/g,
        // "0:03:17 김승민" 패턴 (아티스트만)
        /(\d{1,2}:\d{2}:\d{2})\s*([^-\n]+)/g,
        // "0:03 김승민 - 내 기쁨은 너가 벤틀리를 끄는 거야" 패턴 (분:초)
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*-\s*([^\n]+)/g,
        // "0:03 김승민 by 내 기쁨은 너가 벤틀리를 끄는 거야" 패턴 (분:초)
        /(\d{1,2}:\d{2})\s*([^-\n]+?)\s*by\s*([^\n]+)/g,
      ];

      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          let timeStr, songName, artist;
          
          if (match[3] && match[3].includes(':')) {
            // 시간이 마지막에 있는 패턴
            songName = match[1].trim();
            artist = match[2].trim();
            timeStr = match[3].trim();
          } else {
            // 시간이 처음에 있는 패턴
            timeStr = match[1].trim();
            songName = match[2].trim();
            artist = match[3] ? match[3].trim() : 'Unknown Artist';
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

          // 중복 제거를 위한 키 생성
          const trackKey = `${songName}-${artist}-${seconds}`;
          
          // 이미 있는 트랙인지 확인 (제목과 아티스트가 같고 시간이 비슷한 경우)
          const existingTrack = musicTracks.find(track => 
            track.title === songName && track.artist === artist && Math.abs(track.seconds - seconds) < 10
          );

          if (!existingTrack && songName.length > 2 && artist !== 'Unknown Artist' && seconds > 0) {
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

    console.log('🎵 Starting comment extraction for video:', videoId);
    
    // 댓글에서 음원 정보 추출
    const extractedTracks = await extractMusicFromComments(videoId);
    
    return NextResponse.json({
      success: true,
      videoId: videoId,
      tracksCount: extractedTracks.length,
      tracks: extractedTracks
    });
    
  } catch (error) {
    console.error('Error in extract-comments API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
