-- WAVE 앱 Supabase 테이블 구조 수정 스크립트
-- 현재 코드와 일치하도록 필드명 수정

-- 1. profiles 테이블 (사용자 프로필) - 필드명 수정
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname VARCHAR(20) NOT NULL,
    profile_image TEXT, -- avatar_url -> profile_image로 변경
    email TEXT,
    followers INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. waves 테이블 (음악 웨이브) - 기존 구조 유지
CREATE TABLE IF NOT EXISTS public.waves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    track_info JSONB NOT NULL,
    comment TEXT,
    mood_emoji TEXT,
    mood_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. station_playlists 테이블 (스테이션 플레이리스트) - 현재 코드와 일치
CREATE TABLE IF NOT EXISTS public.station_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    channel_title TEXT,
    channel_id TEXT,
    channel_info JSONB,
    tracks JSONB NOT NULL DEFAULT '[]',
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. playlists 테이블 (일반 플레이리스트)
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT true,
    is_collaborative BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. playlist_tracks 테이블 (플레이리스트 트랙)
CREATE TABLE IF NOT EXISTS public.playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    track_info JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. interactions 테이블 (좋아요, 저장 등 상호작용)
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('wave', 'playlist', 'station_playlist')),
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'save', 'follow')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_id, target_type, interaction_type)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_waves_user_id ON public.waves(user_id);
CREATE INDEX IF NOT EXISTS idx_waves_created_at ON public.waves(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_station_playlists_user_id ON public.station_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_station_playlists_created_at ON public.station_playlists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_creator_id ON public.playlists(creator_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON public.playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_target ON public.interactions(target_id, target_type);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 RLS 정책
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- waves 테이블 RLS 정책
DROP POLICY IF EXISTS "Waves are viewable by everyone" ON public.waves;
CREATE POLICY "Waves are viewable by everyone" ON public.waves
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own waves" ON public.waves;
CREATE POLICY "Users can insert their own waves" ON public.waves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own waves" ON public.waves;
CREATE POLICY "Users can update their own waves" ON public.waves
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own waves" ON public.waves;
CREATE POLICY "Users can delete their own waves" ON public.waves
    FOR DELETE USING (auth.uid() = user_id);

-- station_playlists 테이블 RLS 정책
DROP POLICY IF EXISTS "Station playlists are viewable by everyone" ON public.station_playlists;
CREATE POLICY "Station playlists are viewable by everyone" ON public.station_playlists
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own station playlists" ON public.station_playlists;
CREATE POLICY "Users can insert their own station playlists" ON public.station_playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own station playlists" ON public.station_playlists;
CREATE POLICY "Users can update their own station playlists" ON public.station_playlists
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own station playlists" ON public.station_playlists;
CREATE POLICY "Users can delete their own station playlists" ON public.station_playlists
    FOR DELETE USING (auth.uid() = user_id);

-- playlists 테이블 RLS 정책
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON public.playlists;
CREATE POLICY "Public playlists are viewable by everyone" ON public.playlists
    FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can insert their own playlists" ON public.playlists;
CREATE POLICY "Users can insert their own playlists" ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can update their own playlists" ON public.playlists;
CREATE POLICY "Users can update their own playlists" ON public.playlists
    FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can delete their own playlists" ON public.playlists;
CREATE POLICY "Users can delete their own playlists" ON public.playlists
    FOR DELETE USING (auth.uid() = creator_id);

-- playlist_tracks 테이블 RLS 정책
DROP POLICY IF EXISTS "Playlist tracks are viewable by playlist viewers" ON public.playlist_tracks;
CREATE POLICY "Playlist tracks are viewable by playlist viewers" ON public.playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE id = playlist_id 
            AND (is_public = true OR creator_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert tracks to their own playlists" ON public.playlist_tracks;
CREATE POLICY "Users can insert tracks to their own playlists" ON public.playlist_tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE id = playlist_id 
            AND creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update tracks in their own playlists" ON public.playlist_tracks;
CREATE POLICY "Users can update tracks in their own playlists" ON public.playlist_tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE id = playlist_id 
            AND creator_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON public.playlist_tracks;
CREATE POLICY "Users can delete tracks from their own playlists" ON public.playlist_tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.playlists 
            WHERE id = playlist_id 
            AND creator_id = auth.uid()
        )
    );

-- interactions 테이블 RLS 정책
DROP POLICY IF EXISTS "Interactions are viewable by everyone" ON public.interactions;
CREATE POLICY "Interactions are viewable by everyone" ON public.interactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
CREATE POLICY "Users can insert their own interactions" ON public.interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
CREATE POLICY "Users can update their own interactions" ON public.interactions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;
CREATE POLICY "Users can delete their own interactions" ON public.interactions
    FOR DELETE USING (auth.uid() = user_id);

-- 함수: 사용자 프로필 자동 생성 (profile_image 필드명 수정)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname, email, profile_image)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '사용자'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: 새 사용자 가입 시 프로필 자동 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: updated_at 자동 업데이트
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_waves_updated_at
    BEFORE UPDATE ON public.waves
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_station_playlists_updated_at
    BEFORE UPDATE ON public.station_playlists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 완료 메시지
SELECT 'WAVE 앱 데이터베이스 스키마가 현재 코드와 일치하도록 수정되었습니다!' as message;

