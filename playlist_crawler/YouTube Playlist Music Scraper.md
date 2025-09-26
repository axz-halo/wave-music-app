# YouTube Playlist Music Scraper

유튜브 플레이리스트 영상에서 음원 정보를 자동으로 수집하는 Python 스크립트입니다.

## 주요 기능

- **채널 정보 수집**: 채널명, 구독자 수, 프로필 이미지 URL 추출
- **음원 리스트 추출**: 고정 댓글 또는 영상 설명에서 타임스탬프와 함께 음원 정보 파싱
- **유튜브 링크 검색**: 각 음원의 공식 유튜브 링크 자동 검색
- **결과 저장**: CSV 및 JSON 형식으로 구조화된 데이터 저장

## 설치 방법

### 1. 필수 패키지 설치

```bash
pip install -r requirements.txt
```

### 2. Chrome WebDriver 설치

Chrome 브라우저가 설치되어 있어야 하며, ChromeDriver는 자동으로 관리됩니다.

## 사용 방법

### 기본 사용법

```python
from youtube_playlist_scraper import YouTubePlaylistScraper

# 스크래퍼 초기화
scraper = YouTubePlaylistScraper(headless=True)

# 플레이리스트 정보 수집
video_url = "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
results = scraper.scrape_playlist(video_url)

# 결과 저장
scraper.save_results(results, output_dir="./output")

# 브라우저 종료
scraper.close()
```

### 명령줄에서 실행

```bash
python youtube_playlist_scraper.py
```

## 출력 파일

### CSV 파일 (playlist_tracks.csv)
```csv
순번,타임스탬프,아티스트,곡명,유튜브 URL,영상 타입
1,00:01,Hearts2Hearts,Pretty Please,https://www.youtube.com/watch?v=...,뮤직비디오
2,03:25,NCT WISH,Baby Blue,https://www.youtube.com/watch?v=...,뮤직비디오
...
```

### JSON 파일 (playlist_data.json)
```json
{
  "channel_info": {
    "name": "김로라",
    "handle": "@kimrora",
    "subscriber_count": "145K subscribers",
    "profile_image_url": "https://..."
  },
  "tracks": [
    {
      "track_number": 1,
      "timestamp": "00:01",
      "artist": "Hearts2Hearts",
      "title": "Pretty Please",
      "youtube_url": "https://www.youtube.com/watch?v=...",
      "video_type": "뮤직비디오"
    }
  ],
  "total_tracks": 20
}
```

## 클래스 구조

### YouTubePlaylistScraper
메인 스크래퍼 클래스로 다음 메서드를 제공합니다:

- `extract_channel_info(video_url)`: 채널 정보 추출
- `extract_pinned_comment_tracklist()`: 고정 댓글에서 음원 리스트 추출
- `search_youtube_music_link(artist, title)`: 개별 음원의 유튜브 링크 검색
- `scrape_playlist(video_url)`: 전체 플레이리스트 정보 수집
- `save_results(results, output_dir)`: 결과를 파일로 저장

### 데이터 클래스

#### ChannelInfo
```python
@dataclass
class ChannelInfo:
    name: str              # 채널명
    handle: str            # 채널 핸들 (@username)
    subscriber_count: str  # 구독자 수
    profile_image_url: str # 프로필 이미지 URL
```

#### MusicTrack
```python
@dataclass
class MusicTrack:
    track_number: int          # 트랙 번호
    timestamp: str             # 타임스탬프
    artist: str                # 아티스트명
    title: str                 # 곡명
    youtube_url: Optional[str] # 유튜브 URL
    video_type: Optional[str]  # 영상 타입 (뮤직비디오/오디오/라이브)
```

## 수집 과정 로직

1. **페이지 접속**: Selenium을 사용하여 유튜브 영상 페이지에 접속
2. **쿠키 처리**: 자동으로 쿠키 동의 처리
3. **채널 정보 추출**: CSS 선택자를 사용하여 채널명, 구독자 수, 프로필 이미지 추출
4. **댓글 섹션 이동**: 스크롤을 통해 댓글 섹션으로 이동
5. **고정 댓글 확장**: "더보기" 버튼 클릭하여 전체 음원 리스트 표시
6. **텍스트 파싱**: 정규표현식을 사용하여 타임스탬프와 음원 정보 추출
7. **개별 검색**: 각 음원에 대해 유튜브 검색 수행
8. **결과 저장**: 수집된 모든 정보를 CSV 및 JSON 형식으로 저장

## 주의사항

- YouTube의 이용약관을 준수하여 사용하세요
- 과도한 요청으로 인한 차단을 방지하기 위해 검색 간격을 조절합니다
- 네트워크 상태에 따라 실행 시간이 달라질 수 있습니다
- 일부 영상의 경우 고정 댓글이 없을 수 있으므로 영상 설명도 확인합니다

## 라이선스

이 코드는 교육 및 개인 사용 목적으로 제공됩니다.

---
*작성자: Manus AI*
