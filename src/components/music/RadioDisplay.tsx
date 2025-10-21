'use client';

import { useEffect, useState } from 'react';
import { Radio, Users } from 'lucide-react';
import { AnalyticsService } from '@/services/analyticsService';

export default function RadioDisplay() {
  const [now, setNow] = useState(new Date());
  const [todayWaves, setTodayWaves] = useState<number>(0);
  const [todayStations, setTodayStations] = useState<number>(0);
  const [todayStationShares, setTodayStationShares] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [todayLikes, setTodayLikes] = useState<number>(0);
  const [todayComments, setTodayComments] = useState<number>(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    
    const fetchStats = async () => {
      const [stats, userCount] = await Promise.all([
        AnalyticsService.getTodayStats(),
        AnalyticsService.getTotalUserCount(),
      ]);
      
      if (!isCancelled) {
        setTodayWaves(stats.waveUploads);
        setTodayStations(stats.stationUploads);
        setTodayStationShares(stats.stationShares);
        setTodayLikes(stats.likes);
        setTodayComments(stats.comments);
        setTotalUsers(userCount);
      }
    };
    
    fetchStats();
    
    // 15초마다 폴링
    const poll = setInterval(fetchStats, 15000);
    
    return () => { 
      isCancelled = true; 
      clearInterval(poll); 
    };
  }, []);

  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="sk4-radio-display p-sk4-md h-32 sm:h-36 md:h-40 relative overflow-hidden">
      {/* Dot matrix background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-sk4-radio-text" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full space-y-sk4-sm font-sk4-mono">
        {/* Row 1: Icon - Wave Playlist | Live */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-sk4-sm">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-sk4-radio-text" />
            <div className="sk4-text-xs sm:sk4-text-sm text-sk4-white">Wave Playlist</div>
          </div>
          <div className="flex items-center space-x-sk4-sm">
            <div className="flex space-x-1">
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-sk4-orange animate-pulse" />
            </div>
            <div className="sk4-text-xs text-sk4-white">LIVE</div>
          </div>
        </div>

        {/* Row 2: Date & Time */}
        <div className="text-center">
          <div className="sk4-text-sm text-sk4-white">{dateStr}</div>
          <div className="sk4-text-xs text-sk4-radio-text">{timeStr}</div>
        </div>

        {/* Row 3: Today's Stats */}
        <div className="text-center">
          <div className="sk4-text-xs text-sk4-radio-text mb-1">Today's Activity</div>
          <div className="sk4-text-sm text-sk4-white flex items-center justify-center space-x-2 flex-wrap">
            <span>{todayWaves} Waves</span>
            <span className="text-sk4-radio-text">•</span>
            <span>{todayStationShares} Stations</span>
            <span className="text-sk4-radio-text">•</span>
            <span>{todayLikes + todayComments} Interactions</span>
          </div>
          <div className="sk4-text-xs text-sk4-radio-text mt-1 flex items-center justify-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{totalUsers} Members</span>
          </div>
        </div>
      </div>
    </div>
  );
}