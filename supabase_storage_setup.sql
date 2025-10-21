-- =====================================================
-- Supabase Storage Setup for WAVE App
-- =====================================================
-- 프로필 이미지를 위한 Storage 버킷 및 정책 설정
-- 
-- 사용 방법:
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- 1. avatars 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. 공개 읽기 정책
-- 모든 사용자가 프로필 이미지를 볼 수 있도록
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 3. 인증된 사용자 업로드 정책
-- 로그인한 사용자만 프로필 이미지를 업로드할 수 있도록
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- 4. 자신의 파일 업데이트 정책
-- 사용자는 자신의 프로필 이미지만 수정할 수 있도록
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- 5. 자신의 파일 삭제 정책
-- 사용자는 자신의 프로필 이미지만 삭제할 수 있도록
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'profiles'
);

-- 6. 설정 확인
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'avatars';

-- 7. 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- =====================================================
-- 완료! 
-- 이제 프로필 이미지 업로드가 정상적으로 작동합니다.
-- =====================================================

