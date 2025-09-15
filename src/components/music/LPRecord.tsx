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
      {/* Outer Record - Simple Circle */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border border-sk4-medium-gray`}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        {onPlay && (
          <button
            onClick={onPlay}
            className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <Play className={`${iconSizeClasses[size]} text-sk4-white`} />
          </button>
        )}
      </div>
    </div>
  );
}