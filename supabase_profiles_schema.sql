-- =====================================================
-- Supabase Profiles Table Schema for WAVE App
-- =====================================================
-- 사용자 프로필 테이블 생성 및 설정
-- 
-- 사용 방법:
-- 1. Supabase Dashboard > SQL Editor
-- 2. 이 파일의 내용을 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
-- =====================================================

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '사용자',
  email TEXT,
  avatar_url TEXT,
  youtube_channel_url TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "genres": [],
    "notifications": {
      "newWaves": true,
      "comments": true,
      "challenges": true
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- 3. RLS (Row Level Security) 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로필을 볼 수 있음
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- 인증된 사용자는 자신의 프로필을 생성할 수 있음
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 사용자는 자신의 프로필만 업데이트할 수 있음
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 사용자는 자신의 프로필을 삭제할 수 있음
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);

-- 4. 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 함수: 새 사용자 등록 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '사용자'),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 트리거: auth.users에 새 사용자가 생성되면 자동으로 프로필 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. 설정 확인 쿼리
SELECT 
  id,
  nickname,
  email,
  avatar_url,
  followers,
  following,
  created_at,
  updated_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 완료!
-- profiles 테이블이 생성되었습니다.
-- 
-- 다음 단계:
-- 1. 기존 auth.users가 있다면 수동으로 프로필을 생성해야 합니다:
--    INSERT INTO public.profiles (id, nickname, email)
--    SELECT id, 
--           COALESCE(raw_user_meta_data->>'full_name', '사용자'), 
--           email
--    FROM auth.users
--    WHERE id NOT IN (SELECT id FROM public.profiles);
-- 
-- 2. avatars 스토리지 버킷이 없다면 supabase_storage_setup.sql을 실행하세요.
-- =====================================================

