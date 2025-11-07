export interface User {
  id: string;
  nickname: string;
  profileImage?: string;
  email: string;
  youtubeChannelUrl?: string;
  followers: number;
  following: number;
  preferences: {
    genres: string[];
    notifications: {
      newWaves: boolean;
      comments: boolean;
      challenges: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album?: string;
  platform: 'youtube' | 'spotify' | 'apple';
  externalId: string;
  thumbnailUrl: string;
  duration: number;
  previewUrl?: string;
}

export interface Wave {
  id: string;
  user: User;
  track: TrackInfo;
  comment: string;
  moodEmoji: string;
  moodText: string;
  timestamp: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Playlist {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  creator: User;
  tracks: TrackInfo[];
  isPublic: boolean;
  isCollaborative: boolean;
  likes: number;
  saves: number;
  plays: number;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Station (공유 가능한 플레이리스트)
export interface Station {
  id: string;
  slug: string;
  title: string;
  description?: string;
  user: User;
  tracks: TrackInfo[];
  thumbnailUrl?: string;
  channelTitle?: string;
  channelId?: string;
  channelInfo?: {
    title: string;
    profileImage: string;
    subscriberCount: number;
    videoCount: number;
  };
  isShared: boolean;
  sharedAt?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

// Feed에 표시될 통합 아이템 타입
export type FeedItem = 
  | { type: 'wave'; data: Wave; timestamp: string }
  | { type: 'station'; data: Station; timestamp: string };

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: User;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  votingEndDate: string;
  targetTrackCount: number;
  currentTrackCount: number;
  participants: number;
  rules: {
    genres: string[];
    moods: string[];
    allowDuplicates: boolean;
    votingMethod: 'like' | 'rating' | 'ranking';
  };
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ChallengeSubmission {
  id: string;
  challenge: Challenge;
  user: User;
  track: TrackInfo;
  reason: string;
  votes: number;
  rank?: number;
  submittedAt: string;
}
