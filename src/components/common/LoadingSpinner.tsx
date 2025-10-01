'use client';

import { Music } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const spinner = (
    <div className="flex flex-col items-center space-y-4">
      {/* Enhanced loading animation */}
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} animate-spin`}>
          <div className="h-full w-full rounded-full border-4 border-sk4-light-gray border-t-sk4-orange"></div>
        </div>
        
        {/* Inner icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Music className={`${iconSizes[size]} text-sk4-orange animate-sk4-pulse`} />
        </div>
        
        {/* Glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-sk4-orange/20 blur-lg animate-sk4-glow-pulse`}></div>
      </div>
      
      {text && (
        <div className="text-center">
          <p className="sk4-text-base text-sk4-charcoal font-semibold mb-2">{text}</p>
          <div className="flex items-center justify-center space-x-1.5">
            <div className="w-2 h-2 bg-sk4-orange rounded-full animate-sk4-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-sk4-orange rounded-full animate-sk4-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-sk4-orange rounded-full animate-sk4-pulse" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sk4-off-white to-white">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-sk4-xl shadow-sk4-medium">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-sk4-xl">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-sk4-xl shadow-sk4-soft">
        {spinner}
      </div>
    </div>
  );
}
