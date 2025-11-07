-- WAVE 앱 Supabase 테이블 구조 업데이트 스크립트
-- 반응 기능(likes, comments, saves)을 위한 필드 추가

-- 1. waves 테이블에 카운트 필드들 추가
ALTER TABLE public.waves 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT false;

-- 2. comments 테이블 생성 (댓글 기능용)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('wave', 'playlist', 'station_playlist')),
    target_id UUID NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_nickname TEXT NOT NULL,
    user_image TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. interactions 테이블 생성 (좋아요, 저장 등 상호작용)
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
CREATE INDEX IF NOT EXISTS idx_waves_likes ON public.waves(likes DESC);
CREATE INDEX IF NOT EXISTS idx_waves_comments ON public.waves(comments DESC);
CREATE INDEX IF NOT EXISTS idx_waves_saves ON public.waves(saves DESC);
CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_target ON public.interactions(target_type, target_id);

-- 4. station_playlists 테이블에 slug 컬럼 추가 (고유 식별자)
ALTER TABLE public.station_playlists
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 고유 인덱스 생성 (NULL 허용이지만 값이 있는 경우엔 유일 값 유지)
CREATE UNIQUE INDEX IF NOT EXISTS station_playlists_slug_key ON public.station_playlists(slug);

-- 기존 데이터에 slug 채우기 (title 기반 + 고유 ID suffix)
UPDATE public.station_playlists
SET slug = LOWER(
        REGEXP_REPLACE(
            COALESCE(NULLIF(title, ''), 'station'),
            '[^a-zA-Z0-9]+',
            '-',
            'g'
        )
    )
    || '-' || RIGHT(id::text, 6)
WHERE (slug IS NULL OR slug = '');

-- slug는 필수 필드로 유지
ALTER TABLE public.station_playlists
ALTER COLUMN slug SET NOT NULL;

-- 기존 데이터에 대한 기본값 설정
UPDATE public.waves 
SET 
    likes = COALESCE(likes, 0),
    comments = COALESCE(comments, 0),
    saves = COALESCE(saves, 0),
    shares = COALESCE(shares, 0),
    is_liked = COALESCE(is_liked, false),
    is_saved = COALESCE(is_saved, false)
WHERE likes IS NULL OR comments IS NULL OR saves IS NULL OR shares IS NULL;

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- waves 테이블 정책
DROP POLICY IF EXISTS "Users can view all waves" ON public.waves;
DROP POLICY IF EXISTS "Users can insert their own waves" ON public.waves;
DROP POLICY IF EXISTS "Users can update their own waves" ON public.waves;
DROP POLICY IF EXISTS "Users can delete their own waves" ON public.waves;

CREATE POLICY "Users can view all waves" ON public.waves
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own waves" ON public.waves
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own waves" ON public.waves
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own waves" ON public.waves
    FOR DELETE USING (auth.uid() = user_id);

-- comments 테이블 정책
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

CREATE POLICY "Users can view all comments" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- interactions 테이블 정책
DROP POLICY IF EXISTS "Users can view all interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON public.interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON public.interactions;

CREATE POLICY "Users can view all interactions" ON public.interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own interactions" ON public.interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" ON public.interactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" ON public.interactions
    FOR DELETE USING (auth.uid() = user_id);

-- 트리거 함수: 댓글 추가 시 waves.comments 카운트 증가
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.waves 
        SET comments = comments + 1 
        WHERE id = NEW.target_id AND NEW.target_type = 'wave';
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.waves 
        SET comments = GREATEST(comments - 1, 0) 
        WHERE id = OLD.target_id AND OLD.target_type = 'wave';
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 댓글 카운트 자동 업데이트
DROP TRIGGER IF EXISTS trigger_increment_comment_count ON public.comments;
CREATE TRIGGER trigger_increment_comment_count
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

-- 트리거 함수: 좋아요/저장 추가 시 waves 카운트 증가
CREATE OR REPLACE FUNCTION increment_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'wave' THEN
            IF NEW.interaction_type = 'like' THEN
                UPDATE public.waves SET likes = likes + 1 WHERE id = NEW.target_id;
            ELSIF NEW.interaction_type = 'save' THEN
                UPDATE public.waves SET saves = saves + 1 WHERE id = NEW.target_id;
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'wave' THEN
            IF OLD.interaction_type = 'like' THEN
                UPDATE public.waves SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.target_id;
            ELSIF OLD.interaction_type = 'save' THEN
                UPDATE public.waves SET saves = GREATEST(saves - 1, 0) WHERE id = OLD.target_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거: 상호작용 카운트 자동 업데이트
DROP TRIGGER IF EXISTS trigger_increment_interaction_count ON public.interactions;
CREATE TRIGGER trigger_increment_interaction_count
    AFTER INSERT OR DELETE ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION increment_interaction_count();









