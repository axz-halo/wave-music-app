-- WAVE 앱 Supabase 테이블 초기화 스크립트
-- ⚠️ 주의: 이 스크립트는 모든 데이터를 삭제합니다!
-- 개발 환경에서만 사용하세요.

-- 기존 테이블 및 관련 객체 삭제 (순서 중요)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_waves_updated_at ON public.waves;
DROP TRIGGER IF EXISTS handle_station_playlists_updated_at ON public.station_playlists;
DROP TRIGGER IF EXISTS handle_playlists_updated_at ON public.playlists;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.playlist_tracks CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;
DROP TABLE IF EXISTS public.station_playlists CASCADE;
DROP TABLE IF EXISTS public.waves CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 완료 메시지
SELECT '기존 테이블이 삭제되었습니다. supabase_schema.sql을 실행하여 새 스키마를 생성하세요.' as message;

