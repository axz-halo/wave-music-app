'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface LPRecordProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  isPlaying?: boolean;
  onPlay?: () => void;
  className?: string;
}

export default function LPRecord({ 
  src, 
  alt, 
  size = 'md', 
  isPlaying = false, 
  onPlay,
  className = '' 
}: LPRecordProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-25 h-25', // 100px
    md: 'w-30 h-30', // 120px  
    lg: 'w-35 h-35', // 140px
  };

  const centerSizeClasses = {
    sm: 'w-3 h-3', // 12px center hole
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Record - Perfect Circle */}
      <div className={`${sizeClasses[size]} sk4-lp-record ${isPlaying ? 'playing' : ''}`}>
        {/* Album Art */}
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
        
        {/* Center Hole */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${centerSizeClasses[size]} bg-sk4-white rounded-full`}></div>
        
        {/* Groove Lines - 3 concentric circles */}
        <div className="absolute inset-0 rounded-full">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-sk4-dark-gray border-opacity-8 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 border border-sk4-dark-gray border-opacity-8 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 border border-sk4-dark-gray border-opacity-8 rounded-full"></div>
        </div>
        
        {/* Play/Pause Overlay */}
        {onPlay && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-full transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`${centerSizeClasses[size]} bg-sk4-white rounded-full flex items-center justify-center`}>
              {isPlaying ? (
                <Pause className={`${iconSizeClasses[size]} text-sk4-charcoal ml-0.5`} />
              ) : (
                <Play className={`${iconSizeClasses[size]} text-sk4-charcoal ml-0.5`} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}