import supabase from '@/lib/supabaseClient';

export interface MoodAnalysis {
  emoji: string;
  text: string;
  percentage: number;
}

export interface ArtistStat {
  artist: string;
  count: number;
  percentage: number;
}

export interface GenreStat {
  genre: string;
  percentage: number;
}

export interface MusicDNA {
  // 무드 분석
  moods: MoodAnalysis[];
  
  // 지수
  influenceScore: number; // 영향력 지수 (좋아요 + 댓글 + 공유)
  explorationScore: number; // 탐험 지수 (아티스트 다양성)
  
  // Top 아티스트
  topArtists: ArtistStat[];
  
  // Top 장르 (임시로 아티스트 기반으로 추정)
  topGenres: GenreStat[];
  
  // 음악 취향 태그
  personalityTags: string[];
  
  // 통계
  totalWaves: number;
  totalSavedTracks: number;
  uniqueArtists: number;
}

/**
 * 사용자의 음악 DNA 분석
 */
export async function analyzeMusicDNA(userId: string): Promise<MusicDNA> {
  if (!supabase) {
    return getDefaultMusicDNA();
  }

  try {
    // 사용자의 Waves 가져오기
    const { data: waves, error: wavesError } = await supabase
      .from('waves')
      .select('*')
      .eq('user_id', userId);

    if (wavesError) {
      console.error('Error fetching waves:', wavesError);
      return getDefaultMusicDNA();
    }

    if (!waves || waves.length === 0) {
      return getDefaultMusicDNA();
    }

    // 저장한 트랙 수
    const { count: savedCount } = await supabase
      .from('wave_saves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 1. 무드 분석
    const moods = analyzeMoods(waves);

    // 2. 영향력 지수 계산
    const influenceScore = calculateInfluenceScore(waves);

    // 3. Top 아티스트 추출
    const topArtists = extractTopArtists(waves);

    // 4. 탐험 지수 계산 (아티스트 다양성)
    const explorationScore = calculateExplorationScore(waves, topArtists);

    // 5. Top 장르 추정 (아티스트 기반)
    const topGenres = estimateTopGenres(topArtists);

    // 6. 음악 취향 태그 생성
    const personalityTags = generatePersonalityTags(moods, topArtists, explorationScore, influenceScore);

    return {
      moods,
      influenceScore,
      explorationScore,
      topArtists: topArtists.slice(0, 5), // Top 5
      topGenres: topGenres.slice(0, 3), // Top 3
      personalityTags,
      totalWaves: waves.length,
      totalSavedTracks: savedCount || 0,
      uniqueArtists: topArtists.length,
    };

  } catch (error) {
    console.error('Error analyzing music DNA:', error);
    return getDefaultMusicDNA();
  }
}

/**
 * 무드 분석
 */
function analyzeMoods(waves: any[]): MoodAnalysis[] {
  const moodCounts: { [key: string]: { emoji: string; count: number } } = {};
  
  waves.forEach(wave => {
    if (wave.mood_emoji && wave.mood_text) {
      const key = wave.mood_text;
      if (!moodCounts[key]) {
        moodCounts[key] = { emoji: wave.mood_emoji, count: 0 };
      }
      moodCounts[key].count++;
    }
  });

  const total = waves.length;
  const moodArray: MoodAnalysis[] = Object.entries(moodCounts)
    .map(([text, data]) => ({
      emoji: data.emoji,
      text,
      percentage: Math.round((data.count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // 최소 4개의 무드 보장
  const defaultMoods = [
    { emoji: '🔥', text: '에너지', percentage: 0 },
    { emoji: '😭', text: '감성', percentage: 0 },
    { emoji: '😌', text: '휴식', percentage: 0 },
    { emoji: '🧠', text: '집중', percentage: 0 },
  ];

  if (moodArray.length === 0) {
    return defaultMoods;
  }

  // 기존 무드와 기본 무드 병합
  const mergedMoods = [...moodArray];
  defaultMoods.forEach(defaultMood => {
    if (!mergedMoods.find(m => m.text === defaultMood.text)) {
      mergedMoods.push(defaultMood);
    }
  });

  return mergedMoods.slice(0, 4);
}

/**
 * 영향력 지수 계산
 */
function calculateInfluenceScore(waves: any[]): number {
  const totalLikes = waves.reduce((sum, wave) => sum + (wave.likes || 0), 0);
  const totalComments = waves.reduce((sum, wave) => sum + (wave.comments || 0), 0);
  const totalShares = waves.reduce((sum, wave) => sum + (wave.shares || 0), 0);
  
  // 가중치 적용: 좋아요 1점, 댓글 2점, 공유 3점
  return totalLikes * 1 + totalComments * 2 + totalShares * 3;
}

/**
 * Top 아티스트 추출
 */
function extractTopArtists(waves: any[]): ArtistStat[] {
  const artistCounts: { [key: string]: number } = {};
  
  waves.forEach(wave => {
    const artist = wave.track_info?.artist || wave.artist || 'Unknown Artist';
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  });

  const total = waves.length;
  return Object.entries(artistCounts)
    .map(([artist, count]) => ({
      artist,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 탐험 지수 계산 (아티스트 다양성)
 */
function calculateExplorationScore(waves: any[], topArtists: ArtistStat[]): number {
  if (waves.length === 0 || topArtists.length === 0) return 0;

  // 아티스트 다양성 비율
  const uniqueArtistRatio = Math.min((topArtists.length / waves.length) * 100, 100);
  
  // Top 아티스트 집중도 (Top 1 아티스트가 차지하는 비율의 역수)
  const top1Concentration = topArtists[0]?.percentage || 100;
  const diversityScore = 100 - top1Concentration;

  // 평균 점수
  return Math.round((uniqueArtistRatio + diversityScore) / 2);
}

/**
 * Top 장르 추정 (아티스트 기반으로 임시 추정)
 */
function estimateTopGenres(topArtists: ArtistStat[]): GenreStat[] {
  // 임시로 아티스트 이름에서 장르 추정
  const genreKeywords: { [key: string]: string[] } = {
    'K-Pop': ['BTS', 'BLACKPINK', 'TWICE', 'IVE', 'aespa', 'STAYC', 'LE SSERAFIM', 'NewJeans', 'BABYMONSTER', 'ILLIT', 'izna', 'ROSÉ', 'IZONE'],
    'Hip-Hop': ['Kendrick', 'Drake', 'Travis', 'Kanye', 'Jay-Z', 'Eminem', '래퍼', 'Rap'],
    'R&B': ['R&B', 'Soul', 'SZA', 'Frank', 'H.E.R.', 'Khalid'],
    'Electronic': ['EDM', 'DJ', 'Electronic', 'Daft', 'Calvin'],
    'Pop': ['Taylor', 'Ariana', 'Billie', 'Dua', 'Ed Sheeran'],
    'Rock': ['Rock', 'Band', 'Metallica', 'Foo Fighters'],
    'Indie': ['Indie', 'Alternative'],
  };

  const genreCounts: { [key: string]: number } = {};

  topArtists.forEach(({ artist, count }) => {
    let matched = false;
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      if (keywords.some(keyword => artist.includes(keyword))) {
        genreCounts[genre] = (genreCounts[genre] || 0) + count;
        matched = true;
        break;
      }
    }
    if (!matched) {
      genreCounts['기타'] = (genreCounts['기타'] || 0) + count;
    }
  });

  const total = topArtists.reduce((sum, a) => sum + a.count, 0);
  return Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * 음악 취향 태그 생성
 */
function generatePersonalityTags(
  moods: MoodAnalysis[],
  topArtists: ArtistStat[],
  explorationScore: number,
  influenceScore: number
): string[] {
  const tags: string[] = [];

  // 탐험 지수 기반
  if (explorationScore >= 70) {
    tags.push('🌏 음악 탐험가');
  } else if (explorationScore >= 50) {
    tags.push('🎭 다채로운 취향');
  } else if (explorationScore < 30) {
    tags.push('💎 확고한 취향');
  }

  // 영향력 기반
  if (influenceScore >= 100) {
    tags.push('⭐ 트렌드 세터');
  } else if (influenceScore >= 50) {
    tags.push('💫 영향력자');
  }

  // 무드 기반
  const topMood = moods[0];
  if (topMood) {
    if (topMood.text.includes('에너지') || topMood.text.includes('운동')) {
      tags.push('🔥 에너지 넘침');
    } else if (topMood.text.includes('휴식') || topMood.text.includes('슬픔')) {
      tags.push('🌙 감성파');
    } else if (topMood.text.includes('집중')) {
      tags.push('🎯 집중형 리스너');
    }
  }

  // 아티스트 기반
  const hasKpop = topArtists.some(a => 
    ['BTS', 'BLACKPINK', 'TWICE', 'IVE', 'aespa', 'STAYC'].some(kpop => a.artist.includes(kpop))
  );
  if (hasKpop) {
    tags.push('🇰🇷 K-Pop 매니아');
  }

  // 활동량 기반
  if (topArtists.reduce((sum, a) => sum + a.count, 0) >= 20) {
    tags.push('🎵 열정적인 리스너');
  }

  return tags.slice(0, 4); // 최대 4개
}

/**
 * 기본 음악 DNA (데이터 없을 때)
 */
function getDefaultMusicDNA(): MusicDNA {
  return {
    moods: [
      { emoji: '🔥', text: '에너지', percentage: 0 },
      { emoji: '😭', text: '감성', percentage: 0 },
      { emoji: '😌', text: '휴식', percentage: 0 },
      { emoji: '🧠', text: '집중', percentage: 0 },
    ],
    influenceScore: 0,
    explorationScore: 0,
    topArtists: [],
    topGenres: [],
    personalityTags: ['🌱 음악 여정을 시작하세요'],
    totalWaves: 0,
    totalSavedTracks: 0,
    uniqueArtists: 0,
  };
}


