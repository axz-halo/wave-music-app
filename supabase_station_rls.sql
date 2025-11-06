-- =====================================================
-- Supabase Station RLS (Row Level Security) Policies
-- =====================================================
-- station_playlists 테이블에 대한 보안 정책 설정
-- 사용자별로 자신의 Station만 삭제/공유할 수 있도록 제한
-- 
-- 사용 방법:
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- 1. RLS 활성화
ALTER TABLE public.station_playlists ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 제거 (있는 경우)
DROP POLICY IF EXISTS "Users can view all stations" ON public.station_playlists;
DROP POLICY IF EXISTS "Users can insert their own stations" ON public.station_playlists;
DROP POLICY IF EXISTS "Users can update their own stations" ON public.station_playlists;
DROP POLICY IF EXISTS "Users can delete their own stations" ON public.station_playlists;

-- 3. SELECT 정책: 모든 사용자가 Station을 조회할 수 있음
CREATE POLICY "Users can view all stations" 
ON public.station_playlists 
FOR SELECT 
USING (true);

-- 4. INSERT 정책: 인증된 사용자만 자신의 Station을 생성할 수 있음
CREATE POLICY "Users can insert their own stations" 
ON public.station_playlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. UPDATE 정책: 소유자만 자신의 Station을 수정할 수 있음
-- (is_shared, shared_at 필드 업데이트 등)
CREATE POLICY "Users can update their own stations" 
ON public.station_playlists 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. DELETE 정책: 소유자만 자신의 Station을 삭제할 수 있음
CREATE POLICY "Users can delete their own stations" 
ON public.station_playlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- 관련 테이블 RLS 정책 (선택사항)
-- =====================================================

-- station_likes 테이블 RLS 정책 (있는 경우)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'station_likes') THEN
    ALTER TABLE public.station_likes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view all station likes" ON public.station_likes;
    DROP POLICY IF EXISTS "Users can insert their own station likes" ON public.station_likes;
    DROP POLICY IF EXISTS "Users can delete their own station likes" ON public.station_likes;
    
    CREATE POLICY "Users can view all station likes" 
    ON public.station_likes 
    FOR SELECT 
    USING (true);
    
    CREATE POLICY "Users can insert their own station likes" 
    ON public.station_likes 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own station likes" 
    ON public.station_likes 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- station_comments 테이블 RLS 정책 (있는 경우)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'station_comments') THEN
    ALTER TABLE public.station_comments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view all station comments" ON public.station_comments;
    DROP POLICY IF EXISTS "Users can insert their own station comments" ON public.station_comments;
    DROP POLICY IF EXISTS "Users can update their own station comments" ON public.station_comments;
    DROP POLICY IF EXISTS "Users can delete their own station comments" ON public.station_comments;
    
    CREATE POLICY "Users can view all station comments" 
    ON public.station_comments 
    FOR SELECT 
    USING (true);
    
    CREATE POLICY "Users can insert their own station comments" 
    ON public.station_comments 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own station comments" 
    ON public.station_comments 
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own station comments" 
    ON public.station_comments 
    FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 정책 확인 쿼리
-- =====================================================
-- 다음 쿼리로 정책이 제대로 설정되었는지 확인할 수 있습니다:
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies 
-- WHERE tablename = 'station_playlists' 
-- AND schemaname = 'public';

-- =====================================================
-- 완료!
-- 이제 Station 삭제/공유 권한이 소유자에게만 제한됩니다.
-- =====================================================

