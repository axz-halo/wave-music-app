#!/usr/bin/env python3
"""
YouTube Playlist Music Information Scraper
유튜브 플레이리스트 음원 정보 수집 자동화 스크립트

이 스크립트는 유튜브 플레이리스트 영상에서 다음 정보를 수집합니다:
1. 채널 정보 (이름, 구독자 수, 프로필 이미지)
2. 고정 댓글에서 음원 리스트 추출
3. 각 음원의 유튜브 공식 링크 검색
4. 결과를 구조화된 형태로 저장

작성자: Manus AI
"""

import requests
import json
import csv
import re
import time
from typing import List, Dict, Optional
from dataclasses import dataclass
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException


@dataclass
class ChannelInfo:
    """채널 정보를 저장하는 데이터 클래스"""
    name: str
    handle: str
    subscriber_count: str
    profile_image_url: str


@dataclass
class MusicTrack:
    """음원 정보를 저장하는 데이터 클래스"""
    track_number: int
    timestamp: str
    artist: str
    title: str
    youtube_url: Optional[str] = None
    video_type: Optional[str] = None
    view_count: Optional[str] = None


class YouTubePlaylistScraper:
    """유튜브 플레이리스트 음원 정보 수집기"""
    
    def __init__(self, headless: bool = True):
        """
        스크래퍼 초기화
        
        Args:
            headless: 브라우저를 헤드리스 모드로 실행할지 여부
        """
        self.driver = None
        self.headless = headless
        self.setup_driver()
    
    def setup_driver(self):
        """Selenium WebDriver 설정"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
    
    def extract_channel_info(self, video_url: str) -> ChannelInfo:
        """
        유튜브 영상에서 채널 정보 추출
        
        Args:
            video_url: 유튜브 영상 URL
            
        Returns:
            ChannelInfo: 채널 정보 객체
        """
        print(f"채널 정보 수집 중: {video_url}")
        
        self.driver.get(video_url)
        
        # 쿠키 동의 처리
        try:
            reject_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Reject all')]"))
            )
            reject_button.click()
            time.sleep(2)
        except TimeoutException:
            print("쿠키 동의 버튼을 찾을 수 없습니다.")
        
        # 채널명 추출
        try:
            channel_name_element = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "#owner-name a"))
            )
            channel_name = channel_name_element.text
            channel_handle = channel_name_element.get_attribute("href").split("/")[-1]
        except TimeoutException:
            raise Exception("채널명을 찾을 수 없습니다.")
        
        # 구독자 수 추출
        try:
            subscriber_element = self.driver.find_element(
                By.CSS_SELECTOR, "#owner-sub-count"
            )
            subscriber_count = subscriber_element.text
        except NoSuchElementException:
            subscriber_count = "확인 불가"
        
        # 프로필 이미지 URL 추출
        try:
            profile_img_element = self.driver.find_element(
                By.CSS_SELECTOR, "#avatar img"
            )
            profile_image_url = profile_img_element.get_attribute("src")
        except NoSuchElementException:
            profile_image_url = ""
        
        return ChannelInfo(
            name=channel_name,
            handle=channel_handle,
            subscriber_count=subscriber_count,
            profile_image_url=profile_image_url
        )
    
    def extract_pinned_comment_tracklist(self) -> List[MusicTrack]:
        """
        고정 댓글에서 음원 리스트 추출
        
        Returns:
            List[MusicTrack]: 음원 정보 리스트
        """
        print("고정 댓글에서 음원 리스트 추출 중...")
        
        tracks = []
        
        # 댓글 섹션으로 스크롤
        self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
        time.sleep(3)
        
        try:
            # "더보기" 버튼 클릭
            read_more_button = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, "//tp-yt-paper-button[contains(text(), 'Read more') or contains(text(), '더보기')]"))
            )
            read_more_button.click()
            time.sleep(2)
            
            # 고정 댓글 내용 추출
            pinned_comment = self.driver.find_element(
                By.CSS_SELECTOR, "#content-text"
            )
            comment_text = pinned_comment.text
            
            # 타임스탬프와 음원 정보 파싱
            tracks = self.parse_tracklist_from_comment(comment_text)
            
        except (TimeoutException, NoSuchElementException) as e:
            print(f"고정 댓글을 찾을 수 없습니다: {e}")
            
            # 대안: 영상 설명에서 추출 시도
            try:
                description_element = self.driver.find_element(
                    By.CSS_SELECTOR, "#description"
                )
                description_text = description_element.text
                tracks = self.parse_tracklist_from_comment(description_text)
            except NoSuchElementException:
                print("영상 설명에서도 음원 리스트를 찾을 수 없습니다.")
        
        return tracks
    
    def parse_tracklist_from_comment(self, text: str) -> List[MusicTrack]:
        """
        댓글 텍스트에서 음원 리스트 파싱
        
        Args:
            text: 댓글 또는 설명 텍스트
            
        Returns:
            List[MusicTrack]: 파싱된 음원 정보 리스트
        """
        tracks = []
        lines = text.split('\n')
        
        # 타임스탬프와 음원 정보를 찾는 정규표현식
        timestamp_pattern = r'(\d{1,2}:\d{2})'
        track_pattern = r'(\d{1,2}:\d{2})\s*(.+?)\s*-\s*(.+)'
        
        track_number = 1
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 타임스탬프가 포함된 라인 찾기
            timestamp_match = re.search(timestamp_pattern, line)
            if timestamp_match:
                timestamp = timestamp_match.group(1)
                
                # 아티스트와 곡명 분리
                track_match = re.search(track_pattern, line)
                if track_match:
                    artist = track_match.group(2).strip()
                    title = track_match.group(3).strip()
                    
                    tracks.append(MusicTrack(
                        track_number=track_number,
                        timestamp=timestamp,
                        artist=artist,
                        title=title
                    ))
                    track_number += 1
        
        return tracks
    
    def search_youtube_music_link(self, artist: str, title: str) -> Dict[str, str]:
        """
        유튜브에서 음원의 공식 링크 검색
        
        Args:
            artist: 아티스트명
            title: 곡명
            
        Returns:
            Dict: 검색 결과 정보
        """
        search_query = f"{artist} {title}"
        search_url = f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
        
        print(f"검색 중: {search_query}")
        
        self.driver.get(search_url)
        time.sleep(3)
        
        try:
            # 첫 번째 검색 결과 클릭
            first_result = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "#contents ytd-video-renderer:first-child h3 a"))
            )
            
            video_url = first_result.get_attribute("href")
            video_title = first_result.text
            
            # 영상 타입 판단
            video_type = "뮤직비디오"
            if "audio" in video_title.lower() or "오디오" in video_title:
                video_type = "오디오"
            elif "live" in video_title.lower() or "라이브" in video_title:
                video_type = "라이브"
            
            return {
                "youtube_url": video_url,
                "video_type": video_type,
                "video_title": video_title
            }
            
        except TimeoutException:
            print(f"검색 결과를 찾을 수 없습니다: {search_query}")
            return {
                "youtube_url": "",
                "video_type": "",
                "video_title": ""
            }
    
    def scrape_playlist(self, video_url: str) -> Dict:
        """
        플레이리스트 전체 정보 수집
        
        Args:
            video_url: 유튜브 플레이리스트 영상 URL
            
        Returns:
            Dict: 수집된 모든 정보
        """
        print("=== 유튜브 플레이리스트 음원 정보 수집 시작 ===")
        
        # 1. 채널 정보 수집
        channel_info = self.extract_channel_info(video_url)
        print(f"채널 정보 수집 완료: {channel_info.name}")
        
        # 2. 음원 리스트 추출
        tracks = self.extract_pinned_comment_tracklist()
        print(f"음원 리스트 추출 완료: {len(tracks)}곡")
        
        # 3. 각 음원의 유튜브 링크 검색
        print("각 음원의 유튜브 링크 검색 중...")
        for track in tracks:
            search_result = self.search_youtube_music_link(track.artist, track.title)
            track.youtube_url = search_result["youtube_url"]
            track.video_type = search_result["video_type"]
            
            # 검색 간격 조절 (YouTube 제한 방지)
            time.sleep(2)
        
        return {
            "channel_info": channel_info,
            "tracks": tracks,
            "total_tracks": len(tracks)
        }
    
    def save_results(self, results: Dict, output_dir: str = "."):
        """
        수집 결과를 파일로 저장
        
        Args:
            results: 수집된 결과 데이터
            output_dir: 출력 디렉토리
        """
        channel_info = results["channel_info"]
        tracks = results["tracks"]
        
        # CSV 파일로 저장
        csv_filename = f"{output_dir}/playlist_tracks.csv"
        with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['순번', '타임스탬프', '아티스트', '곡명', '유튜브 URL', '영상 타입']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for track in tracks:
                writer.writerow({
                    '순번': track.track_number,
                    '타임스탬프': track.timestamp,
                    '아티스트': track.artist,
                    '곡명': track.title,
                    '유튜브 URL': track.youtube_url or '',
                    '영상 타입': track.video_type or ''
                })
        
        # JSON 파일로 저장
        json_filename = f"{output_dir}/playlist_data.json"
        json_data = {
            "channel_info": {
                "name": channel_info.name,
                "handle": channel_info.handle,
                "subscriber_count": channel_info.subscriber_count,
                "profile_image_url": channel_info.profile_image_url
            },
            "tracks": [
                {
                    "track_number": track.track_number,
                    "timestamp": track.timestamp,
                    "artist": track.artist,
                    "title": track.title,
                    "youtube_url": track.youtube_url,
                    "video_type": track.video_type
                }
                for track in tracks
            ],
            "total_tracks": len(tracks)
        }
        
        with open(json_filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(json_data, jsonfile, ensure_ascii=False, indent=2)
        
        print(f"결과 저장 완료:")
        print(f"- CSV: {csv_filename}")
        print(f"- JSON: {json_filename}")
    
    def close(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()


def main():
    """메인 실행 함수"""
    # 사용 예시
    video_url = "https://www.youtube.com/watch?v=TEaKmMoDmwQ"
    
    scraper = YouTubePlaylistScraper(headless=False)  # 브라우저 창을 보고 싶다면 False
    
    try:
        # 플레이리스트 정보 수집
        results = scraper.scrape_playlist(video_url)
        
        # 결과 저장
        scraper.save_results(results)
        
        print("=== 수집 완료 ===")
        print(f"채널: {results['channel_info'].name}")
        print(f"총 {results['total_tracks']}곡 수집")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    
    finally:
        scraper.close()


if __name__ == "__main__":
    main()
