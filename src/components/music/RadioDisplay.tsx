'use client';

import { useState, useEffect } from 'react';
import { Radio, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Signal } from 'lucide-react';

export default function RadioDisplay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [frequency, setFrequency] = useState(91.7);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signalStrength, setSignalStrength] = useState(3);
  const [isLive, setIsLive] = useState(true);
  const [currentTrack, setCurrentTrack] = useState('Dynamite - BTS');
  const [waveCount, setWaveCount] = useState(32);
  const [trackCount, setTrackCount] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate signal fluctuation
      setSignalStrength(Math.floor(Math.random() * 3) + 1);
      // Simulate live status flicker
      setIsLive(Math.random() > 0.1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Simulate real-time stats updates
    const statsTimer = setInterval(() => {
      setWaveCount(prev => prev + Math.floor(Math.random() * 3));
      setTrackCount(prev => prev + Math.floor(Math.random() * 2));
    }, 10000);
    return () => clearInterval(statsTimer);
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleFrequencyChange = (direction: 'up' | 'down') => {
    if (direction === 'up') {
      setFrequency(prev => Math.min(108.0, prev + 0.1));
    } else {
      setFrequency(prev => Math.max(87.5, prev - 0.1));
    }
  };

  return (
    <div className="sk4-radio-display p-sk4-md h-32 sm:h-36 md:h-40 relative overflow-hidden">
      {/* Animated Dot Matrix Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div 
              key={i} 
              className="w-1 h-1 bg-sk4-radio-text rounded-sm animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col justify-center h-full space-y-sk4-sm">
        {/* Top Row: Interactive Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-sk4-sm">
            <button 
              onClick={handlePlayPause}
              className="hover:scale-110 transition-transform duration-200"
            >
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-sk4-radio-text" />
            </button>
            <div className="flex items-center space-x-sk4-sm">
              <button 
                onClick={() => handleFrequencyChange('down')}
                className="sk4-text-xs font-sk4-mono text-sk4-radio-text hover:text-sk4-white transition-colors"
              >
                ▼
              </button>
              <div className="sk4-text-xs font-sk4-mono text-sk4-white">FM {frequency.toFixed(1)}</div>
              <button 
                onClick={() => handleFrequencyChange('up')}
                className="sk4-text-xs font-sk4-mono text-sk4-radio-text hover:text-sk4-white transition-colors"
              >
                ▲
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-sk4-sm">
            <Signal className="w-3 h-3 text-sk4-radio-text" />
            <div className="flex space-x-1">
              {[1, 2, 3].map((bar) => (
                <div 
                  key={bar}
                  className={`w-1 h-${bar} rounded-full transition-all duration-300 ${
                    bar <= signalStrength ? 'bg-green-500' : 'bg-sk4-dark-gray'
                  }`}
                ></div>
              ))}
            </div>
            <div className={`sk4-text-xs font-sk4-mono transition-opacity duration-500 ${
              isLive ? 'text-green-500 opacity-100' : 'text-sk4-dark-gray opacity-50'
            }`}>
              LIVE
            </div>
          </div>
        </div>
        
        {/* Middle Row: Current Track & Time */}
        <div className="text-center">
          <div className="sk4-text-xs font-sk4-mono text-sk4-white truncate px-2">
            {isPlaying ? `♪ ${currentTrack}` : 'WAVE RADIO'}
          </div>
          <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">
            {formatDate(currentTime)} {formatTime(currentTime)}
          </div>
        </div>
        
        {/* Bottom Row: Interactive Stats */}
        <div className="text-center">
          <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text mb-1">Today's Stats</div>
          <div className="flex justify-center space-x-sk4-md">
            <button className="text-center hover:scale-105 transition-transform duration-200">
              <div className="sk4-text-sm sm:sk4-text-lg font-sk4-mono text-sk4-white animate-pulse">
                {waveCount}
              </div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">waves</div>
            </button>
            <div className="w-px h-8 bg-sk4-dark-gray"></div>
            <button className="text-center hover:scale-105 transition-transform duration-200">
              <div className="sk4-text-sm sm:sk4-text-lg font-sk4-mono text-sk4-white animate-pulse">
                {trackCount}
              </div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-radio-text">Tracks</div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Volume Indicator */}
      <div className="absolute bottom-1 right-1 flex items-center space-x-1">
        {volume === 0 ? <VolumeX className="w-2 h-2 text-sk4-dark-gray" /> : <Volume2 className="w-2 h-2 text-sk4-radio-text" />}
        <div className="w-8 h-1 bg-sk4-dark-gray rounded-full overflow-hidden">
          <div 
            className="h-full bg-sk4-radio-text transition-all duration-300"
            style={{ width: `${volume}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}