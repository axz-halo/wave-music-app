/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  YOUTUBE_BASE_URL: 'https://www.youtube.com',
  YOUTUBE_API_BASE: 'https://www.googleapis.com/youtube/v3',
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

// Image URLs
export const IMAGE_URLS = {
  DEFAULT_AVATAR: '/default-avatar.png',
  DEFAULT_PLAYLIST: '/placeholder.png',
  YOUTUBE_THUMBNAIL: (videoId: string, size = 'mqdefault') => 
    `https://img.youtube.com/vi/${videoId}/${size}.jpg`,
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  FEED: '/feed',
  STATION: '/station',
  STATION_CREATE: '/station/create',
  CHALLENGE: '/challenge',
  CHALLENGE_CREATE: '/challenge/create',
  PROFILE: '/profile',
  PROFILE_WAVES: '/profile/waves',
  PROFILE_PLAYLISTS: '/profile/playlists',
  LOGIN: '/login',
  WAVE: (id: string) => `/wave/${id}`,
  PLAYLIST: (id: string) => `/playlist/${id}`,
  STATION_DETAIL: (id: string) => `/station/${id}`,
  CHALLENGE_DETAIL: (id: string) => `/challenge/${id}`,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  WAVES: '/api/waves',
  STATIONS: '/api/stations',
  STATION_UPLOAD: '/api/station/upload',
  CHALLENGES: '/api/challenges',
  YOUTUBE_RESOLVE: '/api/youtube/resolve',
  YOUTUBE_PLAYLIST_ITEMS: '/api/youtube/playlist-items',
  YOUTUBE_CHANNEL_PLAYLISTS: '/api/youtube/channel-playlists',
  RADIO_CHANNELS: '/api/radio/channels',
  RADIO_PLAYLISTS: '/api/radio/playlists',
} as const;

// Platform Types
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  SPOTIFY: 'spotify',
  APPLE: 'apple',
} as const;

// Wave Moods
export const MOODS = [
  { emoji: '😊', text: '행복해요', value: 'happy' },
  { emoji: '😢', text: '슬퍼요', value: 'sad' },
  { emoji: '😌', text: '평온해요', value: 'calm' },
  { emoji: '🔥', text: '열정적이에요', value: 'energetic' },
  { emoji: '😴', text: '졸려요', value: 'sleepy' },
  { emoji: '💪', text: '동기부여 됐어요', value: 'motivated' },
  { emoji: '🎉', text: '신나요', value: 'excited' },
  { emoji: '🤔', text: '생각에 잠겨요', value: 'thoughtful' },
] as const;

// Genre Options
export const GENRES = [
  'K-Pop',
  'Pop',
  'Rock',
  'Hip-Hop',
  'R&B',
  'Jazz',
  'Classical',
  'Electronic',
  'Indie',
  'Country',
  'Latin',
  'Blues',
] as const;

// Challenge Status
export const CHALLENGE_STATUS = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  VOTING: 'voting',
  COMPLETED: 'completed',
} as const;

// Time Ranges for Filters
export const TIME_RANGES = [
  { label: '전체', value: 'all' },
  { label: '오늘', value: 'today' },
  { label: '이번 주', value: 'week' },
  { label: '이번 달', value: 'month' },
] as const;

// Sort Options
export const SORT_OPTIONS = [
  { label: '최신순', value: 'latest' },
  { label: '인기순', value: 'popular' },
  { label: '댓글 많은 순', value: 'comments' },
] as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: '로그인이 필요합니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  INVALID_URL: '올바른 URL을 입력해주세요',
  UPLOAD_FAILED: '업로드에 실패했습니다',
  LOAD_FAILED: '데이터를 불러오는데 실패했습니다',
  GENERIC_ERROR: '오류가 발생했습니다',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WAVE_CREATED: '웨이브가 발행되었습니다!',
  PLAYLIST_SAVED: '플레이리스트에 저장되었습니다!',
  UPLOAD_SUCCESS: '업로드가 완료되었습니다!',
  PROFILE_UPDATED: '프로필이 업데이트되었습니다!',
} as const;

// UI Constants
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 1024,
  DESKTOP_SIDEBAR_WIDTH: 224,
  WAVE_CARD_MIN_HEIGHT: 240,
  ANIMATION_DELAY_INCREMENT: 50,
  DEBOUNCE_DELAY: 300,
} as const;

// Validation Rules
export const VALIDATION = {
  MIN_COMMENT_LENGTH: 1,
  MAX_COMMENT_LENGTH: 500,
  MIN_PLAYLIST_NAME_LENGTH: 1,
  MAX_PLAYLIST_NAME_LENGTH: 100,
  MIN_CHALLENGE_TITLE_LENGTH: 3,
  MAX_CHALLENGE_TITLE_LENGTH: 100,
} as const;

