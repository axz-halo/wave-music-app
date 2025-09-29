# WAVE 앱 배치 크롤링 시스템

## 📋 개요

이 시스템은 WAVE 앱의 YouTube 플레이리스트 크롤링을 위한 배치 처리 시스템입니다.

**아키텍처**: App → Supabase → 로컬 컴퓨터 → 크롤링 → Supabase → App

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
cd playlist_crawler
pip install -r requirements.txt
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
YT_API_KEY=your-youtube-api-key
LOG_LEVEL=INFO
```

### 3. 데이터베이스 테이블 생성
`supabase_schema.sql` 파일을 Supabase SQL Editor에서 실행하여 필요한 테이블들을 생성하세요.

**중요**: `pending_playlists`와 `processed_tracks` 테이블이 생성되어야 합니다.

## 🚀 사용법

### 배치 프로세서 실행

#### 1. 스케줄러 모드 (권장)
```bash
python batch_processor.py
```
- 2시간마다 자동으로 대기 중인 플레이리스트를 처리합니다.

#### 2. 단일 실행 모드 (테스트)
```bash
python batch_processor.py --once
```
- 한 번만 실행하고 종료합니다.

### 수동 테스트
```bash
# YouTube 크롤러 테스트
python youtube_playlist_scraper.py

# 특정 URL 테스트
python -c "
from youtube_playlist_scraper import YouTubePlaylistScraper
scraper = YouTubePlaylistScraper()
result = scraper.scrape_playlist('https://www.youtube.com/watch?v=Uwdz7Fh_EHo')
print(f'트랙 수: {len(result.get(\"tracks\", []))}')
"
```

## 📡 API 사용법

### 업로드 API (새로운 배치 시스템)
```javascript
// 플레이리스트 업로드 (배치 처리)
const response = await fetch('/api/station/upload-new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=Uwdz7Fh_EHo',
    type: 'video',
    preview: {
      title: '플레이리스트 제목',
      channelTitle: '채널명',
      thumbnail: '썸네일_URL'
    }
  })
});

// 응답: 배치 큐에 추가됨
{
  "success": true,
  "message": "비디오가 배치 처리 큐에 추가되었습니다. 1-2시간 내에 처리됩니다.",
  "playlistId": "uuid",
  "status": "pending"
}
```

### 배치 상태 확인 API
```javascript
// 배치 처리 상태 확인
const statusResponse = await fetch(`/api/batch/status?id=${playlistId}`);

// 응답 예시
{
  "success": true,
  "status": "completed",
  "tracks_count": 15,
  "tracks": [...],
  "final_playlist": {...}
}
```

## 📊 시스템 플로우

### 사용자 플로우:
1. **사용자**: YouTube 플레이리스트 URL 업로드
2. **앱**: `pending_playlists` 테이블에 저장 (상태: pending)
3. **배치 프로세서**: 2시간마다 대기 중인 플레이리스트 확인
4. **크롤링**: YouTube에서 트랙 정보 추출
5. **저장**: `processed_tracks` 및 `station_playlists`에 저장
6. **사용자**: 처리 완료된 플레이리스트 확인

### 배치 처리 플로우:
```
pending_playlists (status: pending)
    ↓ [2시간마다]
processing (status: processing)
    ↓ [크롤링]
processed_tracks (트랙 정보 저장)
    ↓ [성공시]
station_playlists (최종 저장)
    ↓ [완료]
completed (status: completed)
```

## 🔧 주요 파일 설명

### `batch_processor.py`
- 메인 배치 프로세서
- 스케줄링 및 플레이리스트 처리 로직

### `database_manager.py`
- Supabase 연동
- 데이터베이스 작업 처리

### `youtube_playlist_scraper.py`
- YouTube 크롤링 로직
- 트랙 정보 추출

### `supabase_schema.sql`
- 필요한 데이터베이스 테이블 구조

## 🛠️ 문제 해결

### 일반적인 오류들:

1. **환경 변수 오류**
   - `.env` 파일에 올바른 Supabase 설정 확인

2. **크롤링 실패**
   - YouTube 페이지 구조 변경 가능성
   - VPN이나 프록시 사용 고려

3. **데이터베이스 오류**
   - 테이블 생성 확인
   - 권한 설정 확인

### 로그 확인:
```bash
tail -f logs/batch_processor.log
```

## 📈 모니터링

- **로그 파일**: `logs/batch_processor.log`
- **처리 상태**: Supabase `pending_playlists` 테이블 확인
- **성공률**: `processed_tracks` 테이블의 데이터 확인

## 🔄 업데이트

시스템 업데이트 시:
1. `requirements.txt` 업데이트
2. `supabase_schema.sql` 변경사항 적용
3. 배치 프로세서 재시작

---

**이 시스템으로 WAVE 앱의 크롤링 문제를 효과적으로 해결할 수 있습니다!** 🎵
