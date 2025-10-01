'use client';

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
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const spinner = (
    <div className="flex items-center space-x-sk4-md">
      <div className={`${sizeClasses[size]} border-2 border-sk4-orange border-t-transparent rounded-full animate-spin`} />
      {text && (
        <span className="sk4-text-sm text-sk4-charcoal">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sk4-off-white">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-sk4-lg shadow-sm">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-sk4-xl">
      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-sk4-lg shadow-sm">
        {spinner}
      </div>
    </div>
  );
}

