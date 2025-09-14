# WAVE - 음악 소셜 플랫폼

WAVE는 친구들과 실시간으로 음악을 공유하고, 새로운 음악을 발견하는 소셜 플랫폼입니다.

## 🎵 주요 기능

### 1. 파도 피드 (Feed)
- 현재 듣고 있는 음악을 실시간으로 공유
- 친구들의 음악 취향 발견
- 좋아요, 댓글, 저장, 공유 기능
- 무드 태그로 감정 표현

### 2. 스테이션 (Station)
- 다양한 플레이리스트 발견
- Hot Stations 캐러셀
- 카테고리별 필터링
- 추천 채널 및 인기 플레이리스트

### 3. 챌린지 (Challenge)
- 음악 테마별 챌린지 참여
- 투표 시스템으로 최고의 플레이리스트 선정
- 실시간 참여 현황 및 결과 확인
- 커뮤니티 기반 음악 발견

### 4. 마이페이지 (Profile)
- 개인 프로필 및 활동 통계
- 음악 DNA 분석
- 내 웨이브 및 플레이리스트 관리
- 팔로워/팔로잉 시스템

## 🛠 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **UI/UX**: iPod/iTunes 감성의 디자인 시스템
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **Styling**: Tailwind CSS with custom iPod-inspired components

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary Blue**: #007AFF (아이팟 블루)
- **Secondary Gray**: #8E8E93 (실버 그레이)
- **Accent Orange**: #FF9500 (오렌지)
- **Background**: #F5F5F5 (연한 그레이)

### 컴포넌트 스타일
- **iPod Container**: 그라데이션 배경, 둥근 모서리, 미묘한 그림자
- **iPod Button**: 그라데이션 버튼, 호버 효과, 그림자
- **iPod Card**: 반투명 배경, 블러 효과, 테두리

## 📱 화면 구성

### 1. 파도 피드 (/feed)
- 헤더: WAVE 로고, 검색/알림 아이콘
- 현재 재생 중 위젯
- 일일 통계 카드
- 필터 버튼 (전체, 친구만, 팔로잉, 인기 웨이브)
- 웨이브 카드 리스트

### 2. 스테이션 (/station)
- 헤더: 스테이션 제목, 검색 아이콘
- Hot Stations 캐러셀
- 카테고리 필터
- 전체 스테이션 그리드

### 3. 챌린지 (/challenge)
- 헤더: 챌린지 제목, 생성 버튼
- 상태별 탭 (진행 예정, 진행 중, 투표 중, 완료됨)
- 인기 챌린지 섹션
- 전체 챌린지 리스트

### 4. 마이페이지 (/profile)
- 프로필 헤더 (아바타, 닉네임, 팔로워/팔로잉)
- 활동 통계
- 음악 DNA 분석
- 내 웨이브 미리보기
- 내 플레이리스트

## 🚀 시작하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

### 프로덕션 실행
```bash
npm start
```

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── feed/              # 파도 피드 페이지
│   ├── station/           # 스테이션 페이지
│   ├── challenge/         # 챌린지 페이지
│   ├── profile/           # 마이페이지
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 홈페이지 (리다이렉트)
├── components/            # 재사용 가능한 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   ├── wave/             # 웨이브 관련 컴포넌트
│   ├── music/            # 음악 플레이어 컴포넌트
│   └── feed/             # 피드 관련 컴포넌트
├── lib/                   # 유틸리티 및 데이터
│   └── dummy-data.ts     # 더미 데이터
├── types/                 # TypeScript 타입 정의
│   └── index.ts          # 공통 타입
└── hooks/                 # 커스텀 훅 (향후 확장)
```

## 🔮 향후 계획

### Phase 1: MVP 기본 기능
- [ ] 사용자 인증 시스템
- [ ] YouTube API 연동
- [ ] 실시간 음악 감지
- [ ] 기본 소셜 기능

### Phase 2: 확장 기능
- [ ] Spotify API 연동
- [ ] 플레이리스트 관리
- [ ] 고급 검색 및 필터링
- [ ] 알림 시스템

### Phase 3: 고급 기능
- [ ] AI 기반 추천 시스템
- [ ] 실시간 채팅
- [ ] 라이브 리스닝 파티
- [ ] 아티스트 공식 계정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**WAVE** - 음악으로 연결되는 새로운 세상 🎵
