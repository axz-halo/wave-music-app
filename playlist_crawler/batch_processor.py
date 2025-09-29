#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WAVE 앱 배치 크롤링 프로세서
로컬에서 주기적으로 실행되어 YouTube 플레이리스트를 크롤링하고 Supabase에 저장
"""

import os
import sys
import json
import time
import schedule
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# 프로젝트 루트 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from youtube_playlist_scraper import YouTubePlaylistScraper
from database_manager import DatabaseManager

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/batch_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class BatchProcessor:
    """배치 크롤링 프로세서"""

    def __init__(self):
        self.scraper = YouTubePlaylistScraper(headless=True)
        self.db = DatabaseManager()
        self.processing = False

    def process_pending_playlists(self):
        """대기 중인 플레이리스트들을 처리"""
        if self.processing:
            logger.info("이미 처리 중입니다. 중복 실행을 방지합니다.")
            return

        self.processing = True
        logger.info("배치 처리 시작...")

        try:
            # 대기 중인 플레이리스트 조회
            pending_playlists = self.db.get_pending_playlists()

            if not pending_playlists:
                logger.info("처리할 플레이리스트가 없습니다.")
                return

            logger.info(f"처리할 플레이리스트 {len(pending_playlists)}개 발견")

            for playlist in pending_playlists:
                try:
                    self._process_single_playlist(playlist)
                except Exception as e:
                    logger.error(f"플레이리스트 {playlist['id']} 처리 실패: {str(e)}")
                    self.db.update_playlist_status(
                        playlist['id'],
                        'failed',
                        str(e)
                    )

        except Exception as e:
            logger.error(f"배치 처리 중 오류 발생: {str(e)}")
        finally:
            self.processing = False

    def _process_single_playlist(self, playlist: Dict):
        """단일 플레이리스트 처리"""
        playlist_id = playlist['id']
        url = playlist['playlist_url']

        logger.info(f"플레이리스트 {playlist_id} 처리 시작: {url}")

        # 상태를 processing으로 변경
        self.db.update_playlist_status(playlist_id, 'processing')

        try:
            # YouTube 크롤링 실행
            result = self.scraper.scrape_playlist(url)

            if not result.get('success', False):
                raise Exception(f"크롤링 실패: {result.get('error', 'Unknown error')}")

            # 트랙 정보 추출
            tracks = result.get('tracks', [])
            if not tracks:
                raise Exception("크롤링된 트랙이 없습니다.")

            # 채널 정보 추출
            channel_info = result.get('channel_info', {})

            # 처리된 트랙을 데이터베이스에 저장
            self.db.save_processed_tracks(playlist_id, tracks)

            # 원본 플레이리스트 정보 구성
            playlist_data = {
                'playlist_id': f"batch_{playlist_id}",
                'title': result.get('title', 'Unknown Playlist'),
                'description': result.get('description', ''),
                'thumbnail_url': result.get('thumbnail_url', ''),
                'channel_title': channel_info.get('name', ''),
                'channel_id': channel_info.get('channel_id', ''),
                'channel_info': channel_info,
                'tracks': tracks,
                'user_id': playlist['user_id'],
                'created_at': datetime.now().isoformat()
            }

            # station_playlists에 저장
            self.db.save_station_playlist(playlist_data)

            # 처리 완료로 상태 변경
            self.db.update_playlist_status(playlist_id, 'completed')

            logger.info(f"플레이리스트 {playlist_id} 처리 완료: {len(tracks)}개 트랙")

        except Exception as e:
            logger.error(f"플레이리스트 {playlist_id} 처리 실패: {str(e)}")

            # 재시도 로직
            current_retries = playlist.get('retry_count', 0) + 1
            max_retries = playlist.get('max_retries', 3)

            if current_retries < max_retries:
                self.db.update_playlist_status(
                    playlist_id,
                    'pending',
                    str(e),
                    current_retries
                )
                logger.info(f"플레이리스트 {playlist_id} 재시도 대기 중 ({current_retries}/{max_retries})")
            else:
                self.db.update_playlist_status(
                    playlist_id,
                    'failed',
                    str(e),
                    current_retries
                )
                logger.error(f"플레이리스트 {playlist_id} 최대 재시도 횟수 초과")

    def run_scheduler(self):
        """스케줄러 실행"""
        logger.info("배치 프로세서 스케줄러 시작")

        # 2시간마다 실행
        schedule.every(2).hours.do(self.process_pending_playlists)

        # 매분마다 체크 (스케줄 실행)
        while True:
            schedule.run_pending()
            time.sleep(60)

    def run_once(self):
        """한 번만 실행 (테스트용)"""
        logger.info("배치 프로세서 단일 실행")
        self.process_pending_playlists()


def main():
    """메인 실행 함수"""
    # 로그 디렉토리 생성
    os.makedirs('logs', exist_ok=True)

    processor = BatchProcessor()

    if len(sys.argv) > 1 and sys.argv[1] == '--once':
        # 단일 실행 모드
        processor.run_once()
    else:
        # 스케줄러 모드
        try:
            processor.run_scheduler()
        except KeyboardInterrupt:
            logger.info("배치 프로세서 종료")
        finally:
            processor.scraper.close()


if __name__ == "__main__":
    main()
