import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { videoId, description, comments } = await req.json();
    
    console.log('Extracting audio info from video:', videoId);
    
    // 음원 정보 추출 로직
    const audioInfo = extractAudioInfo(description, comments);
    
    // YouTube에서 각 음원 검색
    const tracks = await Promise.all(
      audioInfo.map(async (audio) => {
        try {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(audio.title + ' ' + audio.artist)}&type=video&maxResults=1&key=${process.env.YT_API_KEY}`;
          const response = await fetch(searchUrl);
          const data = await response.json();
          
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
              id: item.id.videoId,
              title: audio.title,
              artist: audio.artist,
              thumbnail_url: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
              duration: 0, // YouTube Search API에서는 duration을 제공하지 않음
              youtube_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              order: audio.order
            };
          }
        } catch (error) {
          console.error('Error searching for track:', audio.title, error);
        }
        
        // 검색 실패 시 원본 정보로 반환
        return {
          id: `audio_${Date.now()}_${audio.order}`,
          title: audio.title,
          artist: audio.artist,
          thumbnail_url: null,
          duration: 0,
          youtube_url: null,
          order: audio.order
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      tracks: tracks.filter(track => track.title && track.artist),
      extractedCount: audioInfo.length,
      foundCount: tracks.filter(track => track.youtube_url).length
    });
    
  } catch (error: any) {
    console.error('Audio extraction error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to extract audio info' 
    }, { status: 500 });
  }
}

// 음원 정보 추출 함수
function extractAudioInfo(description: string, comments: string[]): Array<{title: string, artist: string, order: number}> {
  const audioInfo: Array<{title: string, artist: string, order: number}> = [];
  
  // 설명에서 음원 정보 추출
  if (description) {
    // 다양한 패턴으로 음원 정보 추출
    const patterns = [
      /(\d+[:：]\d+)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+?)(?:\n|$)/g, // 1:23 - Artist - Title
      /(\d+[:：]\d+)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+?)(?:\n|$)/g, // 1:23 - Title - Artist
      /(\d+[:：]\d+)\s*[-–—]\s*(.+?)(?:\n|$)/g, // 1:23 - Title
      /^(\d+[:：]\d+)\s*(.+?)\s*[-–—]\s*(.+?)$/gm, // 시작에 시간
      /(.+?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(\d+[:：]\d+)/g, // Title - Artist - Time
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        try {
          const timeStr = match[1];
          const title = match[2]?.trim();
          const artist = match[3]?.trim();
          
          if (title && (artist || timeStr.includes(':'))) {
            audioInfo.push({
              title: title,
              artist: artist || 'Unknown Artist',
              order: audioInfo.length + 1
            });
          }
        } catch (error) {
          console.error('Error parsing audio info:', error);
        }
      }
    });
  }
  
  // 댓글에서 음원 정보 추출
  if (comments && Array.isArray(comments)) {
    comments.forEach(comment => {
      const text = typeof comment === 'string' ? comment : (comment as any)?.text || '';
      
      // 댓글에서 음원 정보 패턴 찾기
      const commentPatterns = [
        /(.+?)\s*[-–—]\s*(.+?)(?:\n|$)/g,
        /^(.+?)\s*[-–—]\s*(.+?)$/gm,
      ];
      
      commentPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const title = match[1]?.trim();
          const artist = match[2]?.trim();
          
          if (title && artist && title.length > 1 && artist.length > 1) {
            audioInfo.push({
              title: title,
              artist: artist,
              order: audioInfo.length + 1
            });
          }
        }
      });
    });
  }
  
  // 중복 제거
  const uniqueAudioInfo = audioInfo.filter((audio, index, self) => 
    index === self.findIndex(a => a.title === audio.title && a.artist === audio.artist)
  );
  
  console.log('Extracted audio info:', uniqueAudioInfo);
  return uniqueAudioInfo;
}
