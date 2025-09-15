'use client';

import { useEffect, useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import { dummyWaves } from '@/lib/dummy-data';

export default function RadioDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { todayWaves, todaySaves } = useMemo(() => {
    let waves = 0;
    let saves = 0;
    for (const w of dummyWaves) {
      const t = new Date(w.timestamp);
      if (t >= today) {
        waves += 1;
        saves += w.saves || 0;
      }
    }
    return { todayWaves: waves, todaySaves: saves };
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
              <div className="w-1 h-1 rounded-full bg-green-500" />
              <div className="w-1 h-1 rounded-full bg-green-500" />
              <div className="w-1 h-1 rounded-full bg-green-500" />
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
          <div className="sk4-text-xs text-sk4-radio-text mb-1">Today's Stats</div>
          <div className="sk4-text-sm text-sk4-white">
            {todayWaves} waves | {todaySaves} Tracks
          </div>
        </div>
      </div>
    </div>
  );
}