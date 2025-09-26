## 1. 서비스 개요 (웹/Next.js)

### 1.1 서비스 정의
WAVE는 친구들과 실시간으로 듣고 있는 음악을 공유하고, YouTube를 통해 즉시 음악을 발견하고 재생할 수 있는 음악 중심의 소셜 네트워크 서비스입니다. 사용자들이 한 플랫폼 안에서 다양한 음악적 취향을 자연스럽게 발견하고 확장할 수 있도록 돕는 것이 핵심 목표입니다.

### 1.2 핵심 가치 제안
- 실시간 음악 공유: 친구들이 지금 이 순간 듣고 있는 음악을 실시간으로 확인
- 즉시 재생: YouTube 연동으로 추천받은 음악을 바로 들어볼 수 있음
- 취향 발견: 친구들의 다양한 음악 취향을 통해 새로운 장르와 아티스트 발견
- 큐레이션: 개인화된 음악 추천과 친구 기반 추천의 결합

### 1.3 문제 정의와 해결책
- 문제: 음악 발견의 어려움 → 해결: 친구들의 실시간 청취 데이터를 통한 자연스러운 발견
- 문제: 음악 공유의 번거로움 → 해결: 실시간 피드와 YouTube 통합으로 원클릭 공유/재생
- 문제: 음악적 소통의 부재 → 해결: 음악 중심 SNS 기능으로 깊이 있는 소통(댓글/이모지/저장)

### 1.4 대상 플랫폼과 기술 스택
- 웹(우선): Next.js 15(App Router) + TypeScript + Tailwind CSS + Vercel
- 백엔드/데이터: Supabase(Auth, Postgres, Realtime, Storage), RLS 기반 보안 정책
- 외부 API: YouTube Data API(프록시 `/api/youtube/popular`, `/api/youtube/resolve`), 이후 Spotify/Apple Music 순차 연동

### 1.5 최근 변경/구현 현황(요약)
- 디자인 시스템: SK4(Dieter Rams) 전면 적용(그레이스케일+단일 오렌지 키컬러, 플랫 UI)
- 인증/데이터: Firebase → Supabase 전환(구글 OAuth, 테이블/정책 구성)
- 피드(Wave): 카드 심플화, 바텀시트(댓글/저장/업로드), GlobalPlayer, 통계(오늘의 웨이브/저장)
- 스테이션: Hot List 캐러셀, 커뮤니티 추천, 채널 카드(정사각+구독 링크), 스테이션 생성/목록, 상세에서 그룹 저장(supabase.saved_playlists)
- 챌린지: 생성뷰(SK4, 이모지 무드, 썸네일 업로드, 기간 range 키컬러), 상세(만든 사람/빈 상태/카운트다운 헤더)
- 프로필: 기본 아바타, SK4 버튼, 실데이터 통계(총 웨이브/저장한 트랙/참여 챌린지), 내 웨이브 전체보기(`/profile/waves`)
- 배포: Vercel 프로덕션 다수 릴리즈(최신 배포 URL 하단 참조)

## 2. 정보 구조(IA)와 내비게이션

### 2.1 상위 탭 구조
- 파도(Feed) / 스테이션(Station) / 챌린지(Challenge) / 마이페이지(Profile)

### 2.2 라우팅 트리(App Router)
- `/` → 즉시 `/feed`로 리다이렉트
- `/feed`
  - 업로드 모달(클라이언트 상태)
  - 필터 모달(클라이언트 상태)
  - `/wave/[id]` 웨이브 상세
- `/station`
  - `/station/[playlistId]` 플레이리스트 상세
  - `/station/create` 스테이션 생성
- `/challenge`
  - `/challenge/[id]` 챌린지 상세/투표
- `/profile`
  - `/profile/[userId]` 다른 사용자 프로필
  - `/profile/waves` 내 웨이브 전체보기
  - `/profile/playlists` 내 플레이리스트 목록
- `/playlist/[id]` 플레이리스트 상세(저장 항목)
- `/login` 구글 로그인 페이지

### 2.3 레이아웃 패턴
- 모바일: 하단 탭 네비게이션 + 바텀시트 모달
- 데스크톱: 좌측 사이드바(224px) + 상단 헤더 + 중앙 모달
- 반응형 그리드: 1컬럼(모바일) → 2~3컬럼(데스크톱)

## 3. 주요 사용자 플로우

### 3.1 로그인/온보딩
- Google OAuth 로그인 → 최초 로그인 시 프로필 이미지/닉네임 설정
- 약관 동의(필수/선택) 저장: Firestore `users/{uid}` 문서 필드

### 3.2 파도 피드(Feed)
- 오늘 업로드/저장 통계 카드
- 웨이브 카드 목록(무한 스크롤 가능 구조)
- 카드 구성: 사용자/업로드 시점/음원 정보/코멘트/무드/액션(좋아요·댓글·저장·공유)
- 댓글 바텀시트, 공유 모달, 저장 모달 연동

### 3.3 지금 듣는 중 업로드(Quick Upload)
- 트리거: 플로팅 버튼 또는 헤더 버튼
- 입력: YouTube 링크(선택), 코멘트(≤100자), 무드 이모지
- 단축: 자동 포커스, 클립보드 붙여넣기, 드래그&드롭 URL, Enter/Cmd+Enter 제출, 현재 트랙 사용
- 발행: Firestore `waves`에 저장, 피드 상단에 즉시 표시(낙관적 업데이트)

### 3.4 스테이션(Station)
- Hot List 캐러셀(오늘/주/월 인기 플레이리스트) → 클릭 시 즉시 재생
- Channels 목록(프로필/구독자/링크/주 장르)
- 전체 스테이션 그리드(정렬: 조회수/반응 등) + 인피니트 스크롤
- 상세 페이지에서 트랙 리스트와 미리듣기, 내 플레이리스트 저장

### 3.5 챌린지(Challenge)
- 메인: 진행 예정/진행 중/완료 상태 탭 + 인기/추천 섹션
- 카드: 상태 배지/썸네일/참여자/트랙/남은 시간/투표 버튼
- 상세: 업/다운보트로 투표, 결과 집계, 대표곡 카드, 최종 플레이리스트 생성
- 생성 뷰: 제목/이미지/장르·무드/목표 곡 수(10~30)/기간 설정

### 3.6 마이페이지(Profile)
- 내가 공유한 웨이브 목록, 저장한 음악, 음악 DNA 인사이트(향후)

## 4. 데이터 모델(Supabase)

### 4.1 테이블(핵심)
- `profiles`: { id, nickname, avatar_url, email, created_at }
- `waves`: { id, user_id, track_title, track_artist, track_platform, track_external_id, thumb_url, comment, mood_emoji, mood_text, likes, saves, comments, shares, created_at }
- `comments`: { id, target_type('wave'), target_id, user_id, user_nickname, user_image, content, created_at }
- `playlists`: { id, user_id, title, thumb_url, is_public, is_collaborative, created_at }
- `playlist_tracks`: { id, playlist_id, track_title, track_artist, track_platform, track_external_id, thumb_url, duration, added_by, created_at }
- `radio_playlists`: { id, title, description, thumb, channel, created_at }
- `radio_channels`: { id, title, handle, thumb, created_at }
- `challenges`: { id, title, description, creator_id, status, start_date, end_date, voting_end_date, target_track_count, created_at }
- `submissions`: { id, challenge_id, user_id, platform, external_id, reason, created_at }
- `stations`: { id, user_id, title, description, track_external_id, track_platform, track_title, track_artist, thumb_url, created_at }
- `saved_playlists`: { id, user_id, title, description, thumb_url, source, source_playlist_id, tracks_json JSONB, created_at }
- (옵션) `wave_likes`, `wave_saves`: 사용자 단위 dedupe/토글 관리

### 4.2 보안/RLS(요약)
- 기본 원칙: 읽기 대부분 공개, 쓰기는 인증 사용자 자신의 레코드만 허용
- `profiles`: 본인만 업데이트, 모두 읽기
- `waves`/`comments`/`playlist_tracks`: 작성자만 쓰기, 모두 읽기
- `saved_playlists`/`playlists`: 소유자만 읽기/쓰기 또는 공개 설정에 따라 읽기 허용

## 5. 외부 API 연동(웹 우선)

- YouTube Data API: 비디오/플레이리스트/채널 ID 파싱 → 서버 프록시로 메타 조회 → 트랙/채널 스키마 매핑
- 서버 프록시 라우트: `/api/youtube/popular`, `/api/youtube/resolve?type=playlist|channel&id=...`
- 환경변수: `YT_API_KEY`(Vercel에 설정), 코드 내 하드코드 키 제거 권장
- Spotify(후순위): OAuth, 미리듣기 URL, 앨범 아트 보강

## 6. 디자인 토큰(웹)

### SK4 팔레트/타이포(적용 완료)
- 색상: `sk4-white`, `sk4-off-white`, `sk4-light-gray`, `sk4-gray`, `sk4-medium-gray`, `sk4-dark-gray`, `sk4-charcoal`, 포인트 `sk4-orange(#ff6600)`
- 라디오 전용: `sk4-radio-bg(#1a1a1a)`, `sk4-radio-text(#f0c14b)`
- 타이포: 본문 16px 기준 5단계(11/12/13/16/18px), 가중치 400/500, 모노체(SF Mono) 보조
- 레이아웃: 8px 그리드, 플랫(그림자/그라데이션 없음), radius 0 또는 50%
- 애니메이션: LP 회전, hover elevate(translateY(-1px)), 색상 전환(0.2s)

## 7. 접근성/반응형/키보드

- A11y: ARIA role=dialog, focus trap(추가 예정), 키보드 단축키(Enter/Cmd+Enter/Esc)
- Responsive: 모바일 바텀 → 데스크톱 중앙 모달, 1→3컬럼 그리드

## 8. 상태/에러/로딩

- 낙관적 업데이트 + 실패 시 롤백 토스트
- 스켈레톤/빈 상태/에러 안내 컴포넌트 표준화

## 9. 분석/로그(초안)

- 이벤트: wave_publish, wave_like, wave_save, wave_share, station_play, challenge_vote
- 파라미터: { uid, targetId, source, ts }

## 10. 보안/운영(요약)

- .env 로 API 키 관리, Supabase RLS: 읽기 공개/쓰기 인증+필드 검증
- Vercel 프리뷰 브랜치, Sentry 로깅(추가 예정)

## 11. 배포/운영 현황
- 최신 프로덕션: (예) https://wave-2ingcz4b6-halos-projects-24428129.vercel.app
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `YT_API_KEY`
- 백엔드: Supabase 테이블/정책 구성(상세는 4장 참조)

## 12. 남은 작업(우선순위 제안)
1) 스테이션 상세 개별 트랙 저장: SaveToPlaylistModal 재사용하여 트랙 단위 저장
2) 스테이션 생성 메타 고도화: `/api/youtube/resolve`로 비디오 제목/아티스트 자동 채움
3) 채널 캐러셀 실제 데이터화: `/api/radio/channels` 연동(정사각 카드/구독 링크)
4) 챌린지 전체 영속화: 생성/목록/상세/제출을 Supabase로 일원화
5) 프로필 아바타 편집: Supabase Storage 업로드 + `profiles.avatar_url` 반영
6) 분석 이벤트: wave_publish/like/save/share, station_play, challenge_vote 등 클라이언트 로깅

---
본 문서는 2025-09 기준 최신 구현 상태를 반영합니다.
v