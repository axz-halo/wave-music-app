-- Wave 저장 기능을 위한 테이블들
-- wave_saves 테이블 생성
CREATE TABLE IF NOT EXISTS wave_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wave_id UUID REFERENCES public.waves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (wave_id, user_id) -- 한 사용자는 한 Wave에 한 번만 저장 가능
);

-- wave_likes 테이블 생성 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS wave_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wave_id UUID REFERENCES public.waves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (wave_id, user_id) -- 한 사용자는 한 Wave에 한 번만 좋아요 가능
);

-- wave_comments 테이블 생성 (이미 있다면 무시)
CREATE TABLE IF NOT EXISTS wave_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wave_id UUID REFERENCES public.waves(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE wave_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_comments ENABLE ROW LEVEL SECURITY;

-- wave_saves RLS 정책
CREATE POLICY "Enable read access for all users on wave_saves"
  ON wave_saves FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users on wave_saves"
  ON wave_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users on their own wave_saves"
  ON wave_saves FOR DELETE
  USING (auth.uid() = user_id);

-- wave_likes RLS 정책
CREATE POLICY "Enable read access for all users on wave_likes"
  ON wave_likes FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users on wave_likes"
  ON wave_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users on their own wave_likes"
  ON wave_likes FOR DELETE
  USING (auth.uid() = user_id);

-- wave_comments RLS 정책
CREATE POLICY "Enable read access for all users on wave_comments"
  ON wave_comments FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users on wave_comments"
  ON wave_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users on their own wave_comments"
  ON wave_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_wave_saves_wave_id ON wave_saves(wave_id);
CREATE INDEX IF NOT EXISTS idx_wave_saves_user_id ON wave_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_wave_likes_wave_id ON wave_likes(wave_id);
CREATE INDEX IF NOT EXISTS idx_wave_likes_user_id ON wave_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_wave_comments_wave_id ON wave_comments(wave_id);
CREATE INDEX IF NOT EXISTS idx_wave_comments_user_id ON wave_comments(user_id);

-- waves 테이블에 카운트 필드 추가 (이미 있다면 무시)
ALTER TABLE waves ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE waves ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;
ALTER TABLE waves ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0;
ALTER TABLE waves ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- 카운트 업데이트 함수들
CREATE OR REPLACE FUNCTION update_wave_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.waves
    SET likes = likes + 1
    WHERE id = NEW.wave_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.waves
    SET likes = GREATEST(0, likes - 1)
    WHERE id = OLD.wave_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_wave_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.waves
    SET saves = saves + 1
    WHERE id = NEW.wave_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.waves
    SET saves = GREATEST(0, saves - 1)
    WHERE id = OLD.wave_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_wave_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.waves
    SET comments = comments + 1
    WHERE id = NEW.wave_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.waves
    SET comments = GREATEST(0, comments - 1)
    WHERE id = OLD.wave_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trg_update_wave_likes_count ON wave_likes;
CREATE TRIGGER trg_update_wave_likes_count
AFTER INSERT OR DELETE ON wave_likes
FOR EACH ROW EXECUTE FUNCTION update_wave_likes_count();

DROP TRIGGER IF EXISTS trg_update_wave_saves_count ON wave_saves;
CREATE TRIGGER trg_update_wave_saves_count
AFTER INSERT OR DELETE ON wave_saves
FOR EACH ROW EXECUTE FUNCTION update_wave_saves_count();

DROP TRIGGER IF EXISTS trg_update_wave_comments_count ON wave_comments;
CREATE TRIGGER trg_update_wave_comments_count
AFTER INSERT OR DELETE ON wave_comments
FOR EACH ROW EXECUTE FUNCTION update_wave_comments_count();





