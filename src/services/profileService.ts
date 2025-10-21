import supabase from '@/lib/supabaseClient';

export class ProfileImageError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ProfileImageError';
  }
}

export class ProfileService {
  /**
   * 이미지 압축
   */
  private static async compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 최대 크기 제한 (1920x1920)
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // 품질 조정
          let quality = 0.9;
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('이미지 압축에 실패했습니다.'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
    });
  }

  /**
   * 프로필 이미지 업로드
   */
  static async uploadProfileImage(userId: string, file: File, options?: { 
    autoCompress?: boolean;
    onProgress?: (progress: number) => void;
  }): Promise<string> {
    if (!supabase) {
      throw new ProfileImageError(
        '서비스 초기화에 실패했습니다. 페이지를 새로고침해주세요.',
        'SUPABASE_NOT_INITIALIZED'
      );
    }

    try {
      // 파일 유효성 검사
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        throw new ProfileImageError(
          `지원하지 않는 이미지 형식입니다. (${file.type.split('/')[1]})\nJPEG, PNG, WebP, GIF만 지원됩니다.`,
          'INVALID_FILE_TYPE'
        );
      }

      options?.onProgress?.(10);

      // 파일 크기가 5MB를 초과하면 자동 압축
      let uploadFile = file;
      if (file.size > 5 * 1024 * 1024) {
        if (options?.autoCompress !== false) {
          try {
            options?.onProgress?.(20);
            uploadFile = await this.compressImage(file, 1);
            options?.onProgress?.(40);
          } catch (compressError) {
            throw new ProfileImageError(
              '이미지가 너무 큽니다. (5MB 초과)\n이미지 압축에 실패했습니다. 더 작은 파일을 선택해주세요.',
              'FILE_TOO_LARGE_COMPRESS_FAILED'
            );
          }
        } else {
          throw new ProfileImageError(
            '이미지 크기는 5MB 이하여야 합니다.',
            'FILE_TOO_LARGE'
          );
        }
      } else {
        options?.onProgress?.(40);
      }

      // 파일 확장자 추출
      const fileExt = uploadFile.name.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      options?.onProgress?.(50);

      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        // Supabase 에러 코드별 처리
        if (error.message.includes('Bucket not found') || error.message.includes('bucket_id')) {
          throw new ProfileImageError(
            'Storage 설정이 완료되지 않았습니다.\n\n해결 방법:\n1. Supabase Dashboard > Storage 메뉴\n2. "avatars" 버킷 생성 (Public 체크)\n3. 업로드 정책 설정 후 재시도',
            'BUCKET_NOT_FOUND'
          );
        } else if (error.message.includes('storage/object-not-found')) {
          throw new ProfileImageError(
            'Storage 버킷을 찾을 수 없습니다.\n관리자에게 문의해주세요.',
            'STORAGE_NOT_FOUND'
          );
        } else if (error.message.includes('storage/unauthorized')) {
          throw new ProfileImageError(
            '업로드 권한이 없습니다.\n다시 로그인해주세요.',
            'UNAUTHORIZED'
          );
        } else if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
          throw new ProfileImageError(
            '파일이 너무 큽니다.\n더 작은 이미지를 선택해주세요.',
            'PAYLOAD_TOO_LARGE'
          );
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new ProfileImageError(
            '네트워크 연결이 불안정합니다.\n인터넷 연결을 확인하고 다시 시도해주세요.',
            'NETWORK_ERROR'
          );
        } else {
          throw new ProfileImageError(
            `업로드 중 오류가 발생했습니다.\n${error.message}`,
            'UPLOAD_ERROR'
          );
        }
      }

      options?.onProgress?.(80);

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new ProfileImageError(
          '이미지 URL 생성에 실패했습니다.\n다시 시도해주세요.',
          'URL_GENERATION_FAILED'
        );
      }

      options?.onProgress?.(100);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      
      // ProfileImageError는 그대로 throw
      if (error instanceof ProfileImageError) {
        throw error;
      }
      
      // 일반 에러 처리
      if (error instanceof Error) {
        throw new ProfileImageError(
          `업로드 중 예상치 못한 오류가 발생했습니다.\n${error.message}`,
          'UNKNOWN_ERROR'
        );
      }
      
      throw new ProfileImageError(
        '업로드 중 알 수 없는 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.',
        'UNKNOWN_ERROR'
      );
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


