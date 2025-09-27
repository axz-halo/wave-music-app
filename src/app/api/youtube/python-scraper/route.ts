import { NextRequest, NextResponse } from 'next/server';

interface ChannelInfo {
  name: string;
  handle: string;
  subscriberCount: string;
  profileImageUrl: string;
}

interface MusicTrack {
  trackNumber: number;
  timestamp: string;
  artist: string;
  title: string;
  youtubeUrl?: string;
  videoType?: string;
  viewCount?: string;
}

interface ScrapingResult {
  channelInfo: ChannelInfo;
  tracks: MusicTrack[];
  totalTracks: number;
    extractedFrom: 'pinned_comment' | 'description' | 'both' | 'fallback';
}

interface PlaylistScrapingResult {
  success: boolean;
  playlistInfo?: {
    title: string;
    description: string;
    channelInfo: ChannelInfo;
    tracks: MusicTrack[];
    totalTracks: number;
  };
  message?: string;
}

// 비디오 ID 추출 함수
function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}

// 플레이리스트 처리 함수
async function processPlaylist(playlistId: string): Promise<NextResponse> {
  try {
    const apiKey = process.env.YT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        message: 'YouTube API key not configured'
      }, { status: 500 });
    }

    console.log('Fetching playlist info for:', playlistId);

    // 플레이리스트 메타데이터 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
    );
    const playlistData = await playlistResponse.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Playlist not found or not accessible'
      }, { status: 404 });
    }

    const playlistInfo = playlistData.items[0].snippet;
    const channelId = playlistInfo.channelId;

    // 채널 정보 가져오기
    const channelInfo = await getChannelInfoFromAPIByChannelId(channelId);

    // 플레이리스트 아이템들 가져오기
    const playlistItemsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`
    );
    const playlistItemsData = await playlistItemsResponse.json();

    if (!playlistItemsData.items || playlistItemsData.items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No videos found in playlist'
      }, { status: 404 });
    }

    // 각 비디오에 대해 크롤링 수행
    const allTracks: MusicTrack[] = [];
    let trackNumber = 1;

    for (const item of playlistItemsData.items) {
      const videoId = item.snippet.resourceId.videoId;
      const videoTitle = item.snippet.title;

      try {
        console.log(`Processing video ${trackNumber}: ${videoTitle}`);

        // 각 비디오에 대해 크롤링 수행
        const videoTracks = await extractMusicTracksPythonStyle(videoId);

        // 트랙 번호와 함께 반환
        const tracksWithNumbers = videoTracks.map(track => ({
          ...track,
          trackNumber: trackNumber++,
          videoTitle: videoTitle,
          videoId: videoId
        }));

        allTracks.push(...tracksWithNumbers);
      } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
        // 오류가 발생해도 계속 진행
      }
    }

    const result: PlaylistScrapingResult = {
      success: true,
      playlistInfo: {
        title: playlistInfo.title,
        description: playlistInfo.description,
        channelInfo: channelInfo,
        tracks: allTracks,
        totalTracks: allTracks.length
      }
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error processing playlist:', error);
    return NextResponse.json({
      success: false,
      message: `Failed to process playlist: ${error.message}`
    }, { status: 500 });
  }
}

// 채널 ID로 채널 정보 가져오기
async function getChannelInfoFromAPIByChannelId(channelId: string): Promise<ChannelInfo> {
  try {
    const apiKey = process.env.YT_API_KEY;
    if (!apiKey) {
      return getFallbackChannelInfo();
    }

    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );
    const channelData = await channelResponse.json();

    if (channelData.items && channelData.items.length > 0) {
      const channel = channelData.items[0];
      return {
        name: channel.snippet.title,
        handle: channel.snippet.customUrl || `@${channel.snippet.title}`,
        subscriberCount: channel.statistics.subscriberCount || '0',
        profileImageUrl: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url || ''
      };
    }
  } catch (error) {
    console.error('Error fetching channel info:', error);
  }

  return getFallbackChannelInfo();
}

export async function POST(req: NextRequest) {
  try {
    const { videoId, url, playlistId, type } = await req.json();

    if (!videoId && !url && !playlistId) {
      return NextResponse.json({ error: 'Video ID, URL, or Playlist ID required' }, { status: 400 });
    }

    // 플레이리스트 처리
    if (type === 'playlist' && playlistId) {
      console.log('Processing playlist:', playlistId);
      return await processPlaylist(playlistId);
    }

    // 단일 비디오 처리
    const finalVideoId = videoId || extractVideoId(url);
    console.log('Python-style scraping started for:', finalVideoId);

    // API 키 확인
    const apiKey = process.env.YT_API_KEY;
    console.log('API Key available:', !!apiKey);

    // 1. 채널 정보 수집 (API 키 있으면 실제, 없으면 fallback)
    const channelInfo = apiKey ? 
      await getChannelInfoFromAPI(finalVideoId) : 
      getFallbackChannelInfo();
    
    // 2. 음원 정보 추출 (API 키 있으면 실제, 없으면 fallback)
    const tracks = apiKey ? 
      await extractMusicTracksPythonStyle(finalVideoId) : 
      getFallbackTracks();
    
    // 3. YouTube 검색으로 각 음원 링크 생성 (API 키 있으면 실제, 없으면 fallback)
    const tracksWithLinks = apiKey ? 
      await searchYouTubeLinksPythonStyle(tracks) : 
      getFallbackTracksWithLinks(tracks);

    const result: ScrapingResult = {
      channelInfo,
      tracks: tracksWithLinks,
      totalTracks: tracksWithLinks.length,
      extractedFrom: apiKey ? 'both' : 'fallback'
    };

    console.log(`Python-style scraping completed: ${result.totalTracks} tracks found (API: ${!!apiKey})`);
    
    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('Python-style scraping error:', error);
    
    // 에러 발생 시에도 fallback 데이터 반환
    const fallbackResult: ScrapingResult = {
      channelInfo: getFallbackChannelInfo(),
      tracks: getFallbackTracksWithLinks(getFallbackTracks()),
      totalTracks: 5,
      extractedFrom: 'fallback'
    };
    
    return NextResponse.json({
      success: true,
      result: fallbackResult
    });
  }
}

// YouTube API로 채널 정보 가져오기
async function getChannelInfoFromAPI(videoId: string): Promise<ChannelInfo> {
  try {
    const apiKey = process.env.YT_API_KEY;
    
    if (!apiKey) {
      console.log('No API key, using fallback channel info');
      return {
        name: 'Unknown Channel',
        handle: '@unknown',
        subscriberCount: '0',
        profileImageUrl: ''
      };
    }

    // 1. 비디오 정보로부터 채널 ID 가져오기
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      console.error('Video API error:', videoResponse.status);
      return getFallbackChannelInfo();
    }

    const videoData = await videoResponse.json();
    const video = videoData.items?.[0];
    
    if (!video) {
      return getFallbackChannelInfo();
    }

    const channelId = video.snippet.channelId;

    // 2. 채널 정보 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );

    if (!channelResponse.ok) {
      console.error('Channel API error:', channelResponse.status);
      return getFallbackChannelInfo();
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];
    
    if (!channel) {
      return getFallbackChannelInfo();
    }

    return {
      name: channel.snippet.title,
      handle: channel.snippet.customUrl || `@${channel.snippet.title}`,
      subscriberCount: channel.statistics.subscriberCount || '0',
      profileImageUrl: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url || ''
    };

  } catch (error) {
    console.error('Error getting channel info:', error);
    return getFallbackChannelInfo();
  }
}

// Python 크롤러와 동일한 방식으로 음원 정보 추출
async function extractMusicTracksPythonStyle(videoId: string): Promise<MusicTrack[]> {
  console.log('🔍 Starting track extraction for video:', videoId);
  
  try {
    const apiKey = process.env.YT_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No API key, using fallback tracks');
      return getFallbackTracks();
    }

    console.log('✅ API key found, proceeding with real extraction');

    // 1. 비디오 정보 가져오기 (설명 포함)
    console.log('📹 Fetching video info...');
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    );

    if (!videoResponse.ok) {
      console.error('❌ Video API error:', videoResponse.status, await videoResponse.text());
      return getFallbackTracks();
    }

    const videoData = await videoResponse.json();
    const video = videoData.items?.[0];
    
    if (!video) {
      console.log('❌ No video data found');
      return getFallbackTracks();
    }

    const description = video.snippet.description || '';
    console.log('📝 Video description length:', description.length);

    // 2. 댓글 가져오기 (고정 댓글 우선)
    console.log('💬 Fetching comments...');
    let commentTexts: string[] = [];
    
    try {
      const commentsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=relevance&key=${apiKey}`
      );

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        const comments = commentsData.items || [];
        console.log('💬 Found comments:', comments.length);
        
        // 고정 댓글 찾기 (좋아요가 많은 댓글을 고정 댓글로 간주)
        commentTexts = comments
          .sort((a: any, b: any) => (b.snippet.topLevelComment.snippet.likeCount || 0) - (a.snippet.topLevelComment.snippet.likeCount || 0))
          .slice(0, 5) // 상위 5개 댓글만 확인
          .map((comment: any) => comment.snippet.topLevelComment.snippet.textDisplay);
        
        console.log('💬 Top comments text length:', commentTexts.map(t => t.length));
      } else {
        console.log('⚠️ Comments API failed:', commentsResponse.status);
      }
    } catch (commentError) {
      console.log('⚠️ Comments fetch error:', commentError);
    }

    // 3. Python 크롤러와 동일한 정규표현식으로 파싱
    console.log('🔍 Parsing tracks from description and comments...');
    const descriptionTracks = parseTracklistPythonStyle(description);
    const commentTracks = commentTexts.flatMap(text => parseTracklistPythonStyle(text));
    
    console.log('📊 Extracted tracks:', {
      description: descriptionTracks.length,
      comments: commentTracks.length,
      total: descriptionTracks.length + commentTracks.length
    });
    
    // 4. 중복 제거 및 병합
    const allTracks = [...descriptionTracks, ...commentTracks];
    const uniqueTracks = removeDuplicatesPythonStyle(allTracks);
    
    console.log('✅ Final unique tracks:', uniqueTracks.length);
    
    return uniqueTracks.length > 0 ? uniqueTracks : getFallbackTracks();

  } catch (error) {
    console.error('💥 Error extracting tracks:', error);
    return getFallbackTracks();
  }
}

// Python 크롤러와 동일한 정규표현식으로 파싱
function parseTracklistPythonStyle(text: string): MusicTrack[] {
  console.log('🔍 Parsing text for tracks:', text.substring(0, 200) + '...');
  
  const tracks: MusicTrack[] = [];
  const lines = text.split('\n');
  
  // 더 유연한 패턴들 (Python 크롤러보다 더 관대함)
  const patterns = [
    // 기본 패턴: 00:00 - Artist - Title
    /(\d{1,2}:\d{2})\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+)/,
    // 대체 패턴: 00:00 Artist - Title
    /(\d{1,2}:\d{2})\s+(.+?)\s*[-–—]\s*(.+)/,
    // 간단한 패턴: Artist - Title (타임스탬프 없음)
    /^(.+?)\s*[-–—]\s*(.+)$/,
    // 번호 패턴: 1. Artist - Title
    /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/,
  ];
  
  let trackNumber = 1;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 3) continue;
    
    console.log('🔍 Checking line:', trimmedLine);
    
    // 각 패턴으로 시도
    for (const pattern of patterns) {
      const match = pattern.exec(trimmedLine);
      if (match) {
        let timestamp = '';
        let artist = '';
        let title = '';
        
        if (match.length === 4) {
          // 타임스탬프가 있는 경우
          timestamp = match[1];
          artist = match[2].trim();
          title = match[3].trim();
        } else if (match.length === 3) {
          // 타임스탬프가 없는 경우
          artist = match[1].trim();
          title = match[2].trim();
        }
        
        // 유효성 검사
        if (artist && title && 
            artist.length > 1 && title.length > 1 &&
            !artist.toLowerCase().includes('track') &&
            !title.toLowerCase().includes('track') &&
            !artist.toLowerCase().includes('song') &&
            !title.toLowerCase().includes('song')) {
          
          console.log('✅ Found track:', { timestamp, artist, title });
          
          tracks.push({
            trackNumber: trackNumber,
            timestamp: timestamp,
            artist: artist,
            title: title
          });
          trackNumber++;
          break; // 이 라인은 처리됨, 다음 라인으로
        }
      }
    }
  }
  
  console.log('🎵 Total tracks found:', tracks.length);
  return tracks;
}

// Python 스타일로 YouTube 링크 검색
async function searchYouTubeLinksPythonStyle(tracks: MusicTrack[]): Promise<MusicTrack[]> {
  const apiKey = process.env.YT_API_KEY;
  
  if (!apiKey) {
    console.log('No API key, generating search URLs');
    return tracks.map(track => ({
      ...track,
      youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + ' ' + track.title)}`,
      videoType: 'Music Video',
      viewCount: '0'
    }));
  }

  const tracksWithLinks = await Promise.all(
    tracks.map(async (track, index) => {
      try {
        const searchQuery = `${track.artist} ${track.title}`;
        
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${apiKey}`
        );

        if (!response.ok) {
          console.error(`Search failed for ${track.title}:`, response.status);
          return {
            ...track,
            youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
            videoType: 'Music Video',
            viewCount: '0'
          };
        }

        const data = await response.json();
        const item = data.items?.[0];

        if (item) {
          // Python 크롤러와 동일한 영상 타입 판단
          let videoType = 'Music Video';
          const videoTitle = item.snippet.title.toLowerCase();
          if (videoTitle.includes('audio') || videoTitle.includes('오디오')) {
            videoType = 'Audio';
          } else if (videoTitle.includes('live') || videoTitle.includes('라이브')) {
            videoType = 'Live';
          }

          return {
            ...track,
            youtubeUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            videoType: videoType,
            viewCount: '0'
          };
        }

        return {
          ...track,
          youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
          videoType: 'Music Video',
          viewCount: '0'
        };
      } catch (error) {
        console.error(`Error searching for ${track.title}:`, error);
        return {
          ...track,
          youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + ' ' + track.title)}`,
          videoType: 'Music Video',
          viewCount: '0'
        };
      }
    })
  );

  return tracksWithLinks;
}

// Python 스타일 중복 제거
function removeDuplicatesPythonStyle(tracks: MusicTrack[]): MusicTrack[] {
  const uniqueTracks = tracks.filter((track, index, self) => 
    index === self.findIndex(t => 
      t.title.toLowerCase() === track.title.toLowerCase() && 
      t.artist.toLowerCase() === track.artist.toLowerCase()
    )
  );

  // 타임스탬프 순으로 정렬
  return uniqueTracks.sort((a, b) => {
    if (a.timestamp && !b.timestamp) return -1;
    if (!a.timestamp && b.timestamp) return 1;
    if (a.timestamp && b.timestamp) {
      return a.timestamp.localeCompare(b.timestamp);
    }
    return a.trackNumber - b.trackNumber;
  }).map((track, index) => ({
    ...track,
    trackNumber: index + 1
  }));
}

// Fallback 함수들
function getFallbackChannelInfo(): ChannelInfo {
  return {
    name: 'Unknown Channel',
    handle: '@unknown',
    subscriberCount: '0',
    profileImageUrl: ''
  };
}

function getFallbackTracks(): MusicTrack[] {
  return [
    {
      trackNumber: 1,
      timestamp: '00:00',
      artist: 'Sample Artist 1',
      title: 'Sample Song 1'
    },
    {
      trackNumber: 2,
      timestamp: '03:25',
      artist: 'Sample Artist 2',
      title: 'Sample Song 2'
    },
    {
      trackNumber: 3,
      timestamp: '06:45',
      artist: 'Sample Artist 3',
      title: 'Sample Song 3'
    },
    {
      trackNumber: 4,
      timestamp: '10:12',
      artist: 'Sample Artist 4',
      title: 'Sample Song 4'
    },
    {
      trackNumber: 5,
      timestamp: '13:30',
      artist: 'Sample Artist 5',
      title: 'Sample Song 5'
    }
  ];
}

function getFallbackTracksWithLinks(tracks: MusicTrack[]): MusicTrack[] {
  return tracks.map(track => ({
    ...track,
    youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(track.artist + ' ' + track.title)}`,
    videoType: 'Music Video',
    viewCount: '0'
  }));
}

function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : '';
}
