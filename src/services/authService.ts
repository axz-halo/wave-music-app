import supabase from '@/lib/supabaseClient';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange, 
  ensureSignedIn,
  SupaUser 
} from '@/lib/authSupa';
import { User } from '@/types';

export interface ProfileData {
  id: string;
  nickname: string;
  avatar_url: string | null;
  email: string | null;
  followers: number;
  following: number;
  created_at: string;
}

export class AuthService {
  static async signIn(): Promise<void> {
    await signInWithGoogle();
  }

  static async signOut(): Promise<void> {
    await signOutUser();
  }

  static onAuthChange(callback: (user: SupaUser | null) => void): () => void {
    return onAuthStateChange(callback);
  }

  static async getCurrentUser(): Promise<SupaUser | null> {
    if (!supabase) return null;
    
    const { data } = await supabase.auth.getSession();
    return data?.session?.user || null;
  }

  static async ensureAuth(): Promise<SupaUser | null> {
    return await ensureSignedIn();
  }

  static async getProfile(userId: string): Promise<User | null> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }

    if (!data) return null;

    const profile = data as ProfileData;

    return {
      id: profile.id,
      nickname: profile.nickname,
      profileImage: profile.avatar_url || undefined,
      email: profile.email || '',
      followers: profile.followers || 0,
      following: profile.following || 0,
      preferences: {
        genres: [],
        notifications: {
          newWaves: true,
          comments: true,
          challenges: true,
        },
      },
      createdAt: profile.created_at,
      updatedAt: profile.created_at,
    };
  }

  static async getProfiles(userIds: string[]): Promise<Map<string, User>> {
    if (!supabase || userIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (error) {
      console.error('Failed to fetch profiles:', error);
      return new Map();
    }

    const profileMap = new Map<string, User>();

    (data as ProfileData[] || []).forEach((profile) => {
      profileMap.set(profile.id, {
        id: profile.id,
        nickname: profile.nickname,
        profileImage: profile.avatar_url || undefined,
        email: profile.email || '',
        followers: profile.followers || 0,
        following: profile.following || 0,
        preferences: {
          genres: [],
          notifications: {
            newWaves: true,
            comments: true,
            challenges: true,
          },
        },
        createdAt: profile.created_at,
        updatedAt: profile.created_at,
      });
    });

    return profileMap;
  }

  static async updateProfile(userId: string, updates: {
    nickname?: string;
    avatar_url?: string;
  }): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }

  static async getOrCreateProfile(user: SupaUser): Promise<ProfileData> {
    if (!supabase || !user?.id) {
      throw new Error('Invalid user data');
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) {
      return existing as ProfileData;
    }

    const nickname = user.user_metadata?.full_name || '사용자';
    const avatar_url = user.user_metadata?.avatar_url || null;
    const email = user.email || null;

    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: user.id, nickname, avatar_url, email })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return data as ProfileData;
  }
}

