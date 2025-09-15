'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Share2, Bookmark, Music, Users, Calendar } from 'lucide-react';

interface DailyStats {
  sharedWaves: number;
  savedTracks: number;
  activeUsers: number;
  newPlaylists: number;
}

export default function RadioDisplay() {
  const [stats, setStats] = useState<DailyStats>({
    sharedWaves: 0,
    savedTracks: 0,
    activeUsers: 0,
    newPlaylists: 0,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        sharedWaves: Math.floor(Math.random() * 50) + 20,
        savedTracks: Math.floor(Math.random() * 100) + 30,
        activeUsers: Math.floor(Math.random() * 200) + 50,
        newPlaylists: Math.floor(Math.random() * 20) + 5,
      });
    }, 1000);

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="sk4-radio-display p-sk4-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-sk4-lg">
        <div className="flex items-center space-x-sk4-sm">
          <div className="w-8 h-8 bg-sk4-orange flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-sk4-white" />
          </div>
          <div>
            <h3 className="sk4-text-lg font-medium text-sk4-white">오늘의 통계</h3>
            <p className="sk4-text-sm text-sk4-radio-text">{formatDate(currentTime)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="sk4-text-sm text-sk4-radio-text">{formatTime(currentTime)}</div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mt-1"></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-sk4-md">
        {/* Shared Waves */}
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray">
          <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
            <Share2 className="w-4 h-4 text-sk4-orange" />
            <span className="sk4-text-xs text-sk4-radio-text">공유된 웨이브</span>
          </div>
          <div className="sk4-text-lg font-medium text-sk4-white">{stats.sharedWaves}</div>
          <div className="sk4-text-xs text-sk4-radio-text">오늘</div>
        </div>

        {/* Saved Tracks */}
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray">
          <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
            <Bookmark className="w-4 h-4 text-sk4-orange" />
            <span className="sk4-text-xs text-sk4-radio-text">저장된 트랙</span>
          </div>
          <div className="sk4-text-lg font-medium text-sk4-white">{stats.savedTracks}</div>
          <div className="sk4-text-xs text-sk4-radio-text">오늘</div>
        </div>

        {/* Active Users */}
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray">
          <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
            <Users className="w-4 h-4 text-sk4-orange" />
            <span className="sk4-text-xs text-sk4-radio-text">활성 사용자</span>
          </div>
          <div className="sk4-text-lg font-medium text-sk4-white">{stats.activeUsers}</div>
          <div className="sk4-text-xs text-sk4-radio-text">현재</div>
        </div>

        {/* New Playlists */}
        <div className="bg-sk4-charcoal bg-opacity-30 rounded p-sk4-sm border border-sk4-dark-gray">
          <div className="flex items-center space-x-sk4-sm mb-sk4-sm">
            <Music className="w-4 h-4 text-sk4-orange" />
            <span className="sk4-text-xs text-sk4-radio-text">새 플레이리스트</span>
          </div>
          <div className="sk4-text-lg font-medium text-sk4-white">{stats.newPlaylists}</div>
          <div className="sk4-text-xs text-sk4-radio-text">오늘</div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center justify-center mt-sk4-md">
        <div className="flex items-center space-x-sk4-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="sk4-text-xs text-sk4-radio-text">실시간 업데이트</span>
        </div>
      </div>
    </div>
  );
}