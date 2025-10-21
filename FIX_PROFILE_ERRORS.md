# 프로필 이미지 업로드 오류 수정 가이드

## 🔍 발견된 문제들

### 1. ❌ 404 Error: `/rest/v1/users` 테이블이 존재하지 않음
- **원인**: `ProfileService`가 `users` 테이블을 참조하지만, 실제로는 `profiles` 테이블을 사용해야 함
- **해결**: ✅ 코드에서 `users` → `profiles` 테이블 참조로 수정 완료

### 2. ❌ 404 Error: `default-avatar.png` 파일이 없음
- **원인**: 기본 아바타 이미지가 `/public` 폴더에 없음
- **해결**: ✅ UI Avatars API를 사용한 동적 아바타로 대체

### 3. ❌ `profiles` 테이블이 Supabase에 없을 수 있음
- **원인**: 데이터베이스 스키마가 완전히 설정되지 않음
- **해결**: ✅ `supabase_profiles_schema.sql` 파일 생성 완료

## 📋 수정 완료 항목

### ✅ 코드 수정
1. **ProfileService** (`src/services/profileService.ts`)
   - `from('users')` → `from('profiles')` 변경
   - `profile_image` → `avatar_url` 필드명 변경

2. **Profile Page** (`src/app/profile/page.tsx`)
   - 기본 아바타를 UI Avatars API로 변경 (동적으로 사용자 이름 기반 아바타 생성)
   - 프로필 업데이트 시 `avatar_url` 필드 동기화

### ✅ 새 파일 생성
- `supabase_profiles_schema.sql`: 완전한 프로필 테이블 스키마

## 🚀 Supabase 설정 단계

### Step 1: Profiles 테이블 생성
1. Supabase Dashboard 접속: https://app.supabase.com
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. `supabase_profiles_schema.sql` 파일 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭

이 스크립트는 다음을 수행합니다:
- ✅ `profiles` 테이블 생성
- ✅ 필요한 인덱스 생성
- ✅ Row Level Security (RLS) 정책 설정
- ✅ 자동 프로필 생성 트리거 (새 사용자 가입 시)
- ✅ `updated_at` 자동 업데이트 트리거

### Step 2: Storage 버킷 설정 (이미 했다면 스킵)
1. Supabase Dashboard의 **SQL Editor** 에서
2. `supabase_storage_setup.sql` 파일 내용을 복사하여 붙여넣기
3. **Run** 버튼 클릭

이 스크립트는 다음을 수행합니다:
- ✅ `avatars` 버킷 생성 (public)
- ✅ 업로드/삭제/수정 정책 설정

### Step 3: 기존 사용자 프로필 마이그레이션 (필요한 경우)
만약 이미 가입한 사용자가 있다면, 다음 SQL을 실행하여 프로필을 생성하세요:

```sql
-- 기존 auth.users에서 프로필이 없는 사용자들의 프로필 생성
INSERT INTO public.profiles (id, nickname, email, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', '사용자') as nickname,
  email,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
```

### Step 4: 설정 확인
다음 쿼리로 설정이 올바른지 확인:

```sql
-- 1. profiles 테이블 확인
SELECT * FROM public.profiles LIMIT 5;

-- 2. avatars 버킷 확인
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- 3. RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 🧪 테스트

### 1. 로그아웃 후 다시 로그인
```
1. 앱에서 로그아웃
2. Google로 다시 로그인
3. 프로필 페이지에서 아바타가 표시되는지 확인
```

### 2. 프로필 이미지 업로드 테스트
```
1. 프로필 페이지 접속
2. 프로필 이미지에 마우스 호버
3. 카메라 아이콘 클릭
4. 이미지 선택 (JPEG, PNG, WebP, GIF - 5MB 이하)
5. 업로드 진행 상황 확인
6. 성공 메시지 확인
```

### 3. 브라우저 콘솔 확인
개발자 도구 (F12) → Console 탭에서 더 이상 404 에러가 없는지 확인:
- ❌ `rest/v1/users` 에러 → 없어야 함
- ❌ `default-avatar.png` 에러 → 없어야 함
- ✅ 프로필 이미지 URL이 Supabase storage URL이어야 함

## 📊 에러 해결 체크리스트

- [ ] `supabase_profiles_schema.sql` 실행 완료
- [ ] `supabase_storage_setup.sql` 실행 완료 (이미 했다면 체크)
- [ ] 기존 사용자 프로필 마이그레이션 완료 (필요한 경우)
- [ ] 브라우저에서 앱 새로고침 (Ctrl+Shift+R / Cmd+Shift+R)
- [ ] 로그아웃 후 재로그인
- [ ] 프로필 이미지 업로드 테스트
- [ ] 브라우저 콘솔에 에러 없음 확인

## 🔧 추가 트러블슈팅

### 여전히 404 에러가 발생한다면:

#### 1. Supabase URL 확인
```bash
# .env.local 파일 확인
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 2. 브라우저 캐시 클리어
- Chrome: Ctrl+Shift+Delete (Mac: Cmd+Shift+Delete)
- "캐시된 이미지 및 파일" 선택 후 삭제

#### 3. Supabase Dashboard에서 직접 확인
```sql
-- profiles 테이블이 존재하는지 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- avatars 버킷 확인
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

#### 4. RLS 정책 문제
만약 "permission denied" 에러가 발생한다면:
```sql
-- RLS 정책 재설정
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 그 다음 supabase_profiles_schema.sql을 다시 실행
```

## 📝 변경 사항 요약

### 파일 수정:
1. ✅ `src/services/profileService.ts` - 테이블명 및 필드명 수정
2. ✅ `src/app/profile/page.tsx` - 기본 아바타 처리 개선

### 새 파일:
1. ✅ `supabase_profiles_schema.sql` - 프로필 테이블 스키마
2. ✅ `FIX_PROFILE_ERRORS.md` - 이 문서

### Supabase에서 실행해야 할 SQL:
1. ✅ `supabase_profiles_schema.sql`
2. ✅ `supabase_storage_setup.sql` (이미 했다면 스킵)
3. ✅ 기존 사용자 마이그레이션 쿼리 (필요한 경우)

---

## ✨ 완료!

모든 단계를 완료했다면 프로필 이미지 업로드가 정상적으로 작동할 것입니다.

문제가 계속되면 브라우저 콘솔의 에러 메시지를 확인하고 위의 트러블슈팅 섹션을 참고하세요.

