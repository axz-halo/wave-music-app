'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { TrackInfo } from '@/types';

interface SimplePlayerProps {
  track: TrackInfo | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onClose: () => void;
}

export default function SimplePlayer({ 
  track, 
  isPlaying, 
  onPlay, 
  onPause, 
  onClose 
}: SimplePlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!track) return;

    // YouTube IFrame API 로드
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // API 준비 대기
    const checkYT = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer();
      } else {
        setTimeout(checkYT, 100);
      }
    };
    checkYT();
  }, [track]);

  const initializePlayer = () => {
    if (!track || !iframeRef.current) return;

    const videoId = track.externalId;
    if (!videoId) return;

    // 기존 플레이어 제거
    if (iframeRef.current.contentWindow) {
      iframeRef.current.src = '';
    }

    // 새 플레이어 생성
    const player = new window.YT.Player(iframeRef.current, {
      height: isExpanded ? '315' : '80',
      width: isExpanded ? '560' : '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 0,
      },
      events: {
        onReady: (event: any) => {
          console.log('YouTube player ready');
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            onPlay();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            onPause();
          }
        },
      },
    });
  };

  if (!track) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${
      isExpanded ? 'w-96 h-80' : 'w-80 h-20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <img
            src={track.thumbnailUrl}
            alt={track.title}
            className="w-8 h-8 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{track.title}</p>
            <p className="text-xs text-gray-500 truncate">{track.artist}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Maximize2 className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Player */}
      <div className="relative">
        <div
          ref={iframeRef}
          className="w-full"
          style={{ height: isExpanded ? '200px' : '60px' }}
        />
        
        {/* Play/Pause Overlay for collapsed view */}
        {!isExpanded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isPlaying ? onPause : onPlay}
              className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}





