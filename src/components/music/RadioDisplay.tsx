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
    <div className="bg-sk4-white border border-sk4-gray overflow-hidden">
      {/* Top Section - Dark Radio Display */}
      <div className="bg-sk4-radio-bg text-sk4-white p-sk4-md">
        <div className="flex items-center justify-between mb-sk4-md">
          <div className="sk4-text-sm font-sk4-mono">WAVE RADIO</div>
          <div className="flex items-center space-x-sk4-sm">
            <div className="sk4-text-sm font-sk4-mono">{frequency.toFixed(1)} MHZ</div>
            <div className={`w-2 h-2 bg-sk4-orange rounded-full ${isLive ? 'animate-pulse' : 'opacity-50'}`}></div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="sk4-text-lg font-sk4-mono mb-sk4-sm">
            {isPlaying ? `♪ ${currentTrack}` : 'Select a track to play'}
          </div>
          <div className="sk4-text-sm font-sk4-mono text-sk4-radio-text">
            {isPlaying ? 'NOW PLAYING' : 'VARIOUS ARTISTS'}
          </div>
        </div>
      </div>
      
      {/* Bottom Section - Control Buttons */}
      <div className="bg-sk4-white p-sk4-md">
        <div className="flex justify-center space-x-sk4-md">
          {/* Previous Button */}
          <button className="w-12 h-12 bg-sk4-light-gray border border-sk4-gray flex items-center justify-center hover:bg-sk4-gray transition-colors duration-200">
            <div className="flex items-center space-x-1">
              <div className="w-1 h-3 bg-sk4-dark-gray"></div>
              <div className="w-1 h-3 bg-sk4-dark-gray"></div>
              <SkipBack className="w-3 h-3 text-sk4-dark-gray" />
            </div>
          </button>
          
          {/* Play/Pause Button */}
          <button 
            onClick={handlePlayPause}
            className="w-12 h-12 bg-sk4-orange flex items-center justify-center hover:bg-opacity-90 transition-all duration-200"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-sk4-white" />
            ) : (
              <Play className="w-4 h-4 text-sk4-white ml-0.5" />
            )}
          </button>
          
          {/* Next Button */}
          <button className="w-12 h-12 bg-sk4-light-gray border border-sk4-gray flex items-center justify-center hover:bg-sk4-gray transition-colors duration-200">
            <div className="flex items-center space-x-1">
              <SkipForward className="w-3 h-3 text-sk4-dark-gray" />
              <div className="w-1 h-3 bg-sk4-dark-gray"></div>
              <div className="w-1 h-3 bg-sk4-dark-gray"></div>
            </div>
          </button>
        </div>
        
        {/* Today's Stats as Button Row */}
        <div className="mt-sk4-md">
          <div className="sk4-text-xs font-sk4-mono text-sk4-dark-gray text-center mb-sk4-sm">TODAY'S STATS</div>
          <div className="flex justify-center space-x-sk4-md">
            {/* Waves Button */}
            <button className="w-16 h-12 bg-sk4-light-gray border border-sk4-gray flex flex-col items-center justify-center hover:bg-sk4-gray transition-colors duration-200">
              <div className="sk4-text-sm font-sk4-mono text-sk4-charcoal">{waveCount}</div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-dark-gray">WAVES</div>
            </button>
            
            {/* Tracks Button */}
            <button className="w-16 h-12 bg-sk4-light-gray border border-sk4-gray flex flex-col items-center justify-center hover:bg-sk4-gray transition-colors duration-200">
              <div className="sk4-text-sm font-sk4-mono text-sk4-charcoal">{trackCount}</div>
              <div className="sk4-text-xs font-sk4-mono text-sk4-dark-gray">TRACKS</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}