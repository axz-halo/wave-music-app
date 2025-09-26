#!/usr/bin/env python3
"""
YouTube Playlist Scraper 사용 예시
간단한 실행 예제와 다양한 사용 패턴을 보여줍니다.
"""

from youtube_playlist_scraper import YouTubePlaylistScraper
import json
import os


def example_basic_usage():
    """기본 사용법 예시"""
    print("=== 기본 사용법 예시 ===")
    
    # 스크래퍼 초기화 (브라우저 창 표시)
    scraper = YouTubePlaylistScraper(headless=False)
    
    try:
        # 플레이리스트 URL
        video_url = "https://www.youtube.com/watch?v=TEaKmMoDmwQ"
        
        # 정보 수집
        results = scraper.scrape_playlist(video_url)
        
        # 결과 출력
        channel = results["channel_info"]
        print(f"채널: {channel.name} ({channel.subscriber_count})")
        print(f"수집된 곡 수: {results['total_tracks']}")
        
        # 처음 5곡 출력
        print("\n처음 5곡:")
        for track in results["tracks"][:5]:
            print(f"{track.track_number}. {track.artist} - {track.title}")
        
        # 결과 저장
        scraper.save_results(results, output_dir="./output")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    
    finally:
        scraper.close()


def example_headless_mode():
    """헤드리스 모드 사용 예시"""
    print("=== 헤드리스 모드 사용 예시 ===")
    
    # 백그라운드에서 실행 (브라우저 창 없음)
    scraper = YouTubePlaylistScraper(headless=True)
    
    try:
        video_url = "https://www.youtube.com/watch?v=TEaKmMoDmwQ"
        results = scraper.scrape_playlist(video_url)
        
        # JSON으로만 저장
        output_file = "./playlist_result.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json_data = {
                "channel_info": {
                    "name": results["channel_info"].name,
                    "handle": results["channel_info"].handle,
                    "subscriber_count": results["channel_info"].subscriber_count,
                    "profile_image_url": results["channel_info"].profile_image_url
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
                    for track in results["tracks"]
                ]
            }
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
        print(f"결과가 {output_file}에 저장되었습니다.")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    
    finally:
        scraper.close()


def example_channel_info_only():
    """채널 정보만 수집하는 예시"""
    print("=== 채널 정보만 수집 예시 ===")
    
    scraper = YouTubePlaylistScraper(headless=True)
    
    try:
        video_url = "https://www.youtube.com/watch?v=TEaKmMoDmwQ"
        
        # 채널 정보만 추출
        channel_info = scraper.extract_channel_info(video_url)
        
        print(f"채널명: {channel_info.name}")
        print(f"핸들: {channel_info.handle}")
        print(f"구독자: {channel_info.subscriber_count}")
        print(f"프로필 이미지: {channel_info.profile_image_url}")
        
    except Exception as e:
        print(f"오류 발생: {e}")
    
    finally:
        scraper.close()


def example_batch_processing():
    """여러 플레이리스트 일괄 처리 예시"""
    print("=== 일괄 처리 예시 ===")
    
    # 처리할 플레이리스트 URL 목록
    playlist_urls = [
        "https://www.youtube.com/watch?v=TEaKmMoDmwQ",
        # 추가 URL들을 여기에 넣으세요
    ]
    
    scraper = YouTubePlaylistScraper(headless=True)
    
    try:
        for i, url in enumerate(playlist_urls, 1):
            print(f"\n처리 중 ({i}/{len(playlist_urls)}): {url}")
            
            try:
                results = scraper.scrape_playlist(url)
                
                # 각 플레이리스트별로 별도 폴더에 저장
                output_dir = f"./playlist_{i}"
                os.makedirs(output_dir, exist_ok=True)
                scraper.save_results(results, output_dir)
                
                print(f"완료: {results['total_tracks']}곡 수집")
                
            except Exception as e:
                print(f"플레이리스트 {i} 처리 실패: {e}")
                continue
    
    finally:
        scraper.close()


def example_custom_parsing():
    """커스텀 파싱 로직 예시"""
    print("=== 커스텀 파싱 예시 ===")
    
    scraper = YouTubePlaylistScraper(headless=True)
    
    try:
        video_url = "https://www.youtube.com/watch?v=TEaKmMoDmwQ"
        scraper.driver.get(video_url)
        
        # 쿠키 처리
        import time
        time.sleep(3)
        
        # 커스텀 파싱 로직
        comment_text = """
        00:01 Hearts2Hearts - Pretty Please
        03:25 NCT WISH - Baby Blue
        05:57 Red Velvet - Day 1
        """
        
        tracks = scraper.parse_tracklist_from_comment(comment_text)
        
        print("파싱된 트랙:")
        for track in tracks:
            print(f"{track.timestamp} - {track.artist} - {track.title}")
    
    finally:
        scraper.close()


if __name__ == "__main__":
    # 실행할 예시 선택
    print("YouTube Playlist Scraper 사용 예시")
    print("1. 기본 사용법")
    print("2. 헤드리스 모드")
    print("3. 채널 정보만 수집")
    print("4. 일괄 처리")
    print("5. 커스텀 파싱")
    
    choice = input("\n실행할 예시 번호를 선택하세요 (1-5): ")
    
    if choice == "1":
        example_basic_usage()
    elif choice == "2":
        example_headless_mode()
    elif choice == "3":
        example_channel_info_only()
    elif choice == "4":
        example_batch_processing()
    elif choice == "5":
        example_custom_parsing()
    else:
        print("잘못된 선택입니다.")
