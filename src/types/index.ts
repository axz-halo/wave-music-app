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
