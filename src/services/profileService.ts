import supabase from '@/lib/supabaseClient';

export class ProfileService {
  /**
   * 프로필 이미지 업로드
   */
  static async uploadProfileImage(userId: string, file: File): Promise<string> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // 파일 확장자 추출
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  /**
   * 프로필 이미지 업데이트
   */
  static async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_image: imageUrl })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  }

  /**
   * 프로필 정보 업데이트
   */
  static async updateProfile(userId: string, data: {
    nickname?: string;
    profile_image?: string;
  }): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
}


