import { z } from 'zod';

/**
 * Validation schemas using Zod
 */

// Wave Schemas
export const createWaveSchema = z.object({
  youtubeUrl: z.string().url().optional(),
  track: z.object({
    id: z.string(),
    title: z.string(),
    artist: z.string(),
    externalId: z.string(),
    thumbnailUrl: z.string().url(),
    duration: z.number().optional(),
  }).optional(),
  comment: z.string().max(500).optional(),
  moodEmoji: z.string().optional(),
  moodText: z.string().optional(),
}).refine(
  (data) => data.youtubeUrl || data.track,
  { message: 'Either youtubeUrl or track must be provided' }
);

export type CreateWaveInput = z.infer<typeof createWaveSchema>;

// Station Upload Schema
export const stationUploadSchema = z.object({
  url: z.string().url('올바른 URL을 입력해주세요'),
  type: z.enum(['video', 'playlist']),
  preview: z.object({
    type: z.string(),
    id: z.string(),
    title: z.string(),
    channelTitle: z.string().optional(),
    thumbnail: z.string().url().optional(),
    duration: z.number().optional(),
    itemCount: z.number().optional(),
  }),
});

export type StationUploadInput = z.infer<typeof stationUploadSchema>;

// Profile Update Schema
export const profileUpdateSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(200).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Playlist Create Schema
export const createPlaylistSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(100, '제목은 100자 이하여야 합니다'),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  isCollaborative: z.boolean().default(false),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;

// Challenge Create Schema
export const createChallengeSchema = z.object({
  title: z.string().min(3, '제목은 3자 이상이어야 합니다').max(100),
  description: z.string().min(10, '설명은 10자 이상이어야 합니다').max(1000),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  votingEndDate: z.string().datetime(),
  targetTrackCount: z.number().min(1).max(50),
  rules: z.object({
    genres: z.array(z.string()).optional(),
    moods: z.array(z.string()).optional(),
    allowDuplicates: z.boolean().default(false),
    votingMethod: z.enum(['like', 'rating', 'ranking']).default('like'),
  }),
  thumbnailUrl: z.string().url().optional(),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;

// Comment Schema
export const createCommentSchema = z.object({
  targetType: z.enum(['wave', 'challenge', 'playlist']),
  targetId: z.string().uuid(),
  content: z.string().min(1, '댓글을 입력해주세요').max(500, '댓글은 500자 이하여야 합니다'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// YouTube URL Validation
export const youtubeUrlSchema = z.string().refine(
  (url) => {
    const videoRegex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/;
    const playlistRegex = /[?&]list=([A-Za-z0-9_-]+)/;
    return videoRegex.test(url) || playlistRegex.test(url);
  },
  { message: '올바른 YouTube URL을 입력해주세요' }
);

/**
 * Validation helper functions
 */
export function validateYouTubeUrl(url: string): boolean {
  return youtubeUrlSchema.safeParse(url).success;
}

export function validateCreateWave(data: unknown): CreateWaveInput {
  return createWaveSchema.parse(data);
}

export function validateStationUpload(data: unknown): StationUploadInput {
  return stationUploadSchema.parse(data);
}

export function validateProfileUpdate(data: unknown): ProfileUpdateInput {
  return profileUpdateSchema.parse(data);
}

export function validateCreatePlaylist(data: unknown): CreatePlaylistInput {
  return createPlaylistSchema.parse(data);
}

export function validateCreateChallenge(data: unknown): CreateChallengeInput {
  return createChallengeSchema.parse(data);
}

export function validateCreateComment(data: unknown): CreateCommentInput {
  return createCommentSchema.parse(data);
}

