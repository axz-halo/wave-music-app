'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface LPRecordProps {
  src: string;
  alt: string;
  title?: string;
  artist?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LPRecord({ 
  src, 
  alt, 
  title, 
  artist, 
  isPlaying = false, 
  onPlay,
  size = 'md',
  className = ''
}: LPRecordProps) {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const centerSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Record */}
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-beige-300 to-beige-400 shadow-minimal border border-beige-200 relative overflow-hidden transition-transform duration-300 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
        {/* Album Art */}
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
        
        {/* Record Grooves */}
        <div className="absolute inset-0 rounded-full border-2 border-beige-500 opacity-30"></div>
        <div className="absolute inset-1 rounded-full border border-beige-400 opacity-20"></div>
        <div className="absolute inset-2 rounded-full border border-beige-300 opacity-10"></div>
        <div className="absolute inset-3 rounded-full border border-beige-200 opacity-5"></div>
        
        {/* Center Hole */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${centerSizeClasses[size]} rounded-full bg-beige-600 shadow-inner`}></div>
        
        {/* Play/Pause Overlay */}
        {onPlay && (
          <div className={`absolute inset-0 flex items-center justify-center bg-black/20 rounded-full transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className={`${centerSizeClasses[size]} bg-white/90 rounded-full flex items-center justify-center shadow-minimal border border-beige-200`}>
              {isPlaying ? (
                <Pause className={`${iconSizeClasses[size]} text-beige-800 ml-0.5`} />
              ) : (
                <Play className={`${iconSizeClasses[size]} text-beige-800 ml-0.5`} />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Label */}
      {(title || artist) && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center min-w-max">
          {title && <p className="text-xs font-medium text-beige-800 truncate max-w-24">{title}</p>}
          {artist && <p className="text-xs text-beige-600 truncate max-w-24">{artist}</p>}
        </div>
      )}
    </div>
  );
}
