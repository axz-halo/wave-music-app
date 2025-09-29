#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase 데이터베이스 매니저
배치 크롤링 시스템과 Supabase 연동
"""

import os
import json
from typing import Dict, List, Optional
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Supabase 데이터베이스 매니저"""

    def __init__(self):
        # 환경 변수에서 Supabase 설정 로드
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not self.supabase_url or not self.supabase_service_key:
            raise ValueError("Supabase 환경 변수가 설정되지 않았습니다.")

        # Service Role Key로 Supabase 클라이언트 생성 (관리자 권한)
        self.supabase: Client = create_client(
            self.supabase_url,
            self.supabase_service_key
        )

        logger.info("DatabaseManager 초기화 완료")

    def get_pending_playlists(self) -> List[Dict]:
        """대기 중인 플레이리스트 조회"""
        try:
            # pending 상태이고 재시도 횟수가 max_retries보다 적은 항목들 조회
            response = self.supabase.table('pending_playlists').select('*').eq('status', 'pending').lt('retry_count', 3).execute()

            playlists = response.data if response.data else []
            logger.info(f"대기 중인 플레이리스트 {len(playlists)}개 조회")

            return playlists

        except Exception as e:
            logger.error(f"대기 플레이리스트 조회 실패: {str(e)}")
            return []

    def update_playlist_status(self, playlist_id: str, status: str, error_message: str = None, retry_count: int = None):
        """플레이리스트 상태 업데이트"""
        try:
            update_data = {'status': status}

            if error_message:
                update_data['error_message'] = error_message

            if retry_count is not None:
                update_data['retry_count'] = retry_count

            if status in ['completed', 'failed']:
                update_data['processed_at'] = 'now()'

            result = self.supabase.table('pending_playlists').update(update_data).eq('id', playlist_id).execute()

            logger.info(f"플레이리스트 {playlist_id} 상태 업데이트: {status}")

        except Exception as e:
            logger.error(f"플레이리스트 상태 업데이트 실패: {str(e)}")

    def save_processed_tracks(self, playlist_id: str, tracks: List[Dict]):
        """처리된 트랙 정보 저장"""
        try:
            # 기존 트랙 삭제 후 새로 저장
            self.supabase.table('processed_tracks').delete().eq('playlist_id', playlist_id).execute()

            track_data = []
            for i, track in enumerate(tracks, 1):
                track_data.append({
                    'playlist_id': playlist_id,
                    'track_number': i,
                    'timestamp': track.get('timestamp', '00:00'),
                    'artist': track.get('artist', ''),
                    'title': track.get('title', ''),
                    'youtube_url': track.get('youtube_url'),
                    'video_type': track.get('video_type', 'Music Video')
                })

            if track_data:
                result = self.supabase.table('processed_tracks').insert(track_data).execute()
                logger.info(f"플레이리스트 {playlist_id}에 {len(track_data)}개 트랙 저장")

        except Exception as e:
            logger.error(f"트랙 저장 실패: {str(e)}")
            raise

    def save_station_playlist(self, playlist_data: Dict):
        """처리된 플레이리스트를 station_playlists에 저장"""
        try:
            result = self.supabase.table('station_playlists').insert(playlist_data).execute()

            logger.info(f"플레이리스트 저장 완료: {playlist_data.get('title', 'Unknown')}")

        except Exception as e:
            logger.error(f"플레이리스트 저장 실패: {str(e)}")
            raise

    def get_playlist_status(self, playlist_id: str) -> Optional[Dict]:
        """플레이리스트 처리 상태 조회"""
        try:
            response = self.supabase.table('pending_playlists').select('*').eq('id', playlist_id).execute()

            if response.data:
                return response.data[0]
            return None

        except Exception as e:
            logger.error(f"플레이리스트 상태 조회 실패: {str(e)}")
            return None

    def get_processed_tracks(self, playlist_id: str) -> List[Dict]:
        """처리된 트랙 정보 조회"""
        try:
            response = self.supabase.table('processed_tracks').select('*').eq('playlist_id', playlist_id).order('track_number').execute()

            tracks = response.data if response.data else []
            logger.info(f"플레이리스트 {playlist_id}의 {len(tracks)}개 트랙 조회")

            return tracks

        except Exception as e:
            logger.error(f"트랙 조회 실패: {str(e)}")
            return []

    def cleanup_old_records(self, days_old: int = 7):
        """오래된 레코드 정리"""
        try:
            # 7일 이상 된 완료된 플레이리스트 삭제
            cutoff_date = 'now() - interval \'{days_old} days\''

            # 완료된 플레이리스트의 관련 데이터 삭제
            self.supabase.table('processed_tracks').delete().lt('created_at', cutoff_date).execute()

            # 완료된 플레이리스트 삭제
            self.supabase.table('pending_playlists').delete().eq('status', 'completed').lt('processed_at', cutoff_date).execute()

            logger.info(f"{days_old}일 이상 된 레코드 정리 완료")

        except Exception as e:
            logger.error(f"레코드 정리 실패: {str(e)}")
