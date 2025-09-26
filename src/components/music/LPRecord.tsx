'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

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
    sm: 'w-16 h-16', // 64px - 더 작고 심플하게
    md: 'w-20 h-20', // 80px
    lg: 'w-24 h-24', // 96px
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className} ${onPlay ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      {/* Outer Record - Simple Circle */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-sk4-medium-gray sk4-interactive ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        {onPlay && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-full transition-all duration-200 ${isHovered ? 'bg-black/50' : ''}`}>
            <Play className={`${iconSizeClasses[size]} text-sk4-white`} />
          </div>
        )}
      </div>
    </div>
  );
}