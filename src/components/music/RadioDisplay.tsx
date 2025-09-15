'use client';

import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';

interface RadioDisplayProps {
  frequency?: number;
  isLive?: boolean;
  className?: string;
}

export default function RadioDisplay({ 
  frequency = 88.5, 
  isLive = true,
  className = '' 
}: RadioDisplayProps) {
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

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`sk4-radio-display ${className}`}>
      {/* Dot Matrix Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-20 grid-rows-8 h-full w-full">
          {Array.from({ length: 160 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-sk4-radio-text rounded-sm"></div>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-between w-full px-sk4-md">
        {/* Left Side - Station Info */}
        <div className="flex items-center space-x-sk4-md">
          <Radio className="w-5 h-5 text-sk4-radio-text" />
          <div>
            <div className="text-sk4-sm font-sk4-mono">WAVE RADIO</div>
            <div className="text-sk4-xs font-sk4-mono">FM {frequency.toFixed(1)}</div>
          </div>
        </div>
        
        {/* Center - Time Display */}
        <div className="text-center">
          <div className="text-sk4-sm font-sk4-mono">{formatTime(currentTime)}</div>
          <div className="text-sk4-xs font-sk4-mono">LIVE</div>
        </div>
        
        {/* Right Side - Signal Indicator */}
        <div className="flex items-center space-x-sk4-sm">
          <div className="flex space-x-1">
            <div className={`w-1 h-1 rounded-sk4-circle ${isLive ? 'bg-green-500' : 'bg-sk4-dark-gray'}`}></div>
            <div className={`w-1 h-1 rounded-sk4-circle ${isLive ? 'bg-green-500' : 'bg-sk4-dark-gray'}`}></div>
            <div className={`w-1 h-1 rounded-sk4-circle ${isLive ? 'bg-green-500' : 'bg-sk4-dark-gray'}`}></div>
          </div>
          <div className="text-sk4-xs font-sk4-mono">SIGNAL</div>
        </div>
      </div>
    </div>
  );
}
