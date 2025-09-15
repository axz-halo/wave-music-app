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
    <div className="sk4-radio-display p-sk4-lg">
      {/* Dot Matrix Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-sk4-radio-text rounded-sm"></div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-sk4-lg">
          <div className="flex items-center space-x-sk4-md">
            <Radio className="w-5 h-5 text-sk4-radio-text" />
            <div>
              <div className="sk4-text-sm font-sk4-mono text-sk4-white">WAVE RADIO</div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">FM {frequency.toFixed(1)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="sk4-text-sm font-sk4-mono text-sk4-white">{formatTime(currentTime)}</div>
            <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Stats Display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text mb-sk4-sm">TODAY'S STATS</div>
            <div className="grid grid-cols-2 gap-sk4-md text-center">
              <div>
                <div className="sk4-text-lg font-sk4-mono text-sk4-white">32</div>
                <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">WAVES</div>
              </div>
              <div>
                <div className="sk4-text-lg font-sk4-mono text-sk4-white">48</div>
                <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">TRACKS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-sk4-md mb-sk4-md">
          <button className="sk4-action-button">
            <SkipBack className="w-4 h-4 text-sk4-radio-text" />
          </button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="sk4-action-button w-12 h-12">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-sk4-radio-text" />
            ) : (
              <Play className="w-6 h-6 text-sk4-radio-text" />
            )}
          </button>
          <button className="sk4-action-button">
            <SkipForward className="w-4 h-4 text-sk4-radio-text" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-sk4-sm">
          {volume === 0 ? <VolumeX className="w-4 h-4 text-sk4-radio-text" /> : <Volume2 className="w-4 h-4 text-sk4-radio-text" />}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="flex-1 h-1 bg-sk4-dark-gray appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--sk4-radio-text) ${volume}%, var(--sk4-dark-gray) ${volume}%)`
            }}
          />
        </div>

        {/* Signal Indicator */}
        <div className="flex items-center justify-center mt-sk4-sm">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
          </div>
          <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text ml-sk4-sm">LIVE</div>
        </div>
      </div>
    </div>
  );
}