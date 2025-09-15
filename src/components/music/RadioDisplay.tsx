'use client';

import { useState, useEffect } from 'react';
import { Radio, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function RadioDisplay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [frequency, setFrequency] = useState(91.7);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="sk4-radio-display p-sk4-md h-32 sm:h-36 md:h-40">
      {/* Dot Matrix Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-sk4-radio-text rounded-sm"></div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-between h-full">
        {/* Left Side - Station Info */}
        <div className="flex items-center space-x-sk4-sm">
          <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-sk4-radio-text" />
          <div>
            <div className="sk4-text-xs sm:sk4-text-sm font-sk4-mono text-sk4-white">WAVE RADIO</div>
            <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">FM {frequency.toFixed(1)}</div>
          </div>
        </div>
        
        {/* Center - Stats Display */}
        <div className="text-center">
          <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text mb-1">TODAY'S STATS</div>
          <div className="flex space-x-sk4-md text-center">
            <div>
              <div className="sk4-text-sm sm:sk4-text-lg font-sk4-mono text-sk4-white">32</div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">WAVES</div>
            </div>
            <div>
              <div className="sk4-text-sm sm:sk4-text-lg font-sk4-mono text-sk4-white">48</div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">TRACKS</div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Time & Signal */}
        <div className="text-right">
          <div className="sk4-text-xs sm:sk4-text-sm font-sk4-mono text-sk4-white">{formatTime(currentTime)}</div>
          <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">{formatDate(currentTime)}</div>
          <div className="flex items-center justify-end space-x-1 mt-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text ml-1">LIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}