'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, Minimize2, X, List } from 'lucide-react';
import { TrackInfo } from '@/types';

interface UnifiedPlayerProps {
  track: TrackInfo | null;
  playlist?: TrackInfo[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onTrackSelect?: (track: TrackInfo) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function UnifiedPlayer({ 
  track, 
  playlist = [],
  onClose,
  onNext,
  onPrevious,
  onTrackSelect
}: UnifiedPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      console.log('YouTube API already loaded');
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      console.log('YouTube API script already exists');
      return;
    }

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API will call this function when ready
    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API ready');
    };
  }, []);

  // Initialize player when track changes
  useEffect(() => {
    if (!track) return;

    // Wait for YouTube API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        console.log('YouTube API not ready yet, retrying...');
        setTimeout(initPlayer, 100);
        return;
      }

      // Use externalId directly if it's a YouTube video ID, otherwise try to extract from URL
      const videoId = track.platform === 'youtube' ? track.externalId : extractVideoId(track.externalId);
      if (!videoId) {
        console.error('Could not extract video ID from:', track.externalId);
        return;
      }

      console.log('Initializing YouTube player with video ID:', videoId);

      // Destroy existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.log('Error destroying existing player:', e);
        }
      }

      // Create new player
      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: (event: any) => {
              console.error('YouTube Player Error:', event.data);
            },
          },
        });
      } catch (error) {
        console.error('Error creating YouTube player:', error);
      }
    };

    initPlayer();

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [track]);

  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // If it's already a video ID (11 characters)
    if (url.length === 11 && !url.includes('/')) {
      return url;
    }
    
    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
      /youtube\.com\/v\/([^&\s]+)/,
      /youtube\.com\/watch\?.*v=([^&\s]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const onPlayerReady = (event: any) => {
    console.log('YouTube Player Ready:', event);
    setIsReady(true);
    setDuration(event.target.getDuration());
    event.target.setVolume(volume);
    event.target.playVideo();
    
    // Start progress tracking
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();
        setCurrentTime(current);
        setProgress((current / total) * 100);
      }
    }, 1000);
  };

  const onPlayerStateChange = (event: any) => {
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (event.data === 1) {
      setIsPlaying(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
    } else if (event.data === 0) {
      // Video ended
      if (onNext) {
        onNext();
      }
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!playerRef.current) return;
    
    setVolume(newVolume);
    playerRef.current.setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    playerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
    setProgress(percentage * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <>
      {/* Mini Player (Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-40 bg-white border-t border-sk4-gray shadow-sk4-medium">
        {/* Progress Bar */}
        <div 
          className="h-1 bg-sk4-light-gray cursor-pointer hover:h-1.5 transition-all"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-sk4-orange transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          {/* Track Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img 
              src={track.thumbnailUrl} 
              alt={track.title}
              className="w-12 h-12 rounded-lg object-cover shadow-sk4-soft"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sk4-charcoal truncate">
                {track.title}
              </p>
              <p className="text-xs text-sk4-dark-gray truncate">
                {track.artist}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 mx-4">
            <button
              onClick={onPrevious}
              disabled={!onPrevious}
              className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors disabled:opacity-30"
            >
              <SkipBack className="w-5 h-5 text-sk4-dark-gray" />
            </button>
            
            <button
              onClick={togglePlay}
              className="p-3 bg-sk4-orange hover:bg-sk4-orange-dark text-white rounded-full transition-all shadow-sk4-soft hover:shadow-sk4-medium"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>
            
            <button
              onClick={onNext}
              disabled={!onNext}
              className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors disabled:opacity-30"
            >
              <SkipForward className="w-5 h-5 text-sk4-dark-gray" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-sk4-dark-gray" />
                ) : (
                  <Volume2 className="w-5 h-5 text-sk4-dark-gray" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 h-1 bg-sk4-light-gray rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ff6600 0%, #ff6600 ${volume}%, #e5e7eb ${volume}%, #e5e7eb 100%)`
                }}
              />
            </div>

            {playlist.length > 0 && (
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors"
              >
                <List className="w-5 h-5 text-sk4-dark-gray" />
              </button>
            )}

            <button
              onClick={() => setShowFullPlayer(!showFullPlayer)}
              className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors"
            >
              {showFullPlayer ? (
                <Minimize2 className="w-5 h-5 text-sk4-dark-gray" />
              ) : (
                <Maximize2 className="w-5 h-5 text-sk4-dark-gray" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-sk4-dark-gray" />
            </button>
          </div>
        </div>
      </div>

      {/* Full Player Modal */}
      {showFullPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-sk4-charcoal rounded-2xl overflow-hidden shadow-sk4-strong">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sk4-dark-gray">
              <h2 className="text-lg font-semibold text-white">Now Playing</h2>
              <button
                onClick={() => setShowFullPlayer(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-black" ref={playerContainerRef}>
              <div id="youtube-player" className="w-full h-full"></div>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">{track.title}</h3>
                <p className="text-sk4-medium-gray">{track.artist}</p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div 
                  className="h-2 bg-sk4-dark-gray rounded-full cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-sk4-orange rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-sk4-medium-gray">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={togglePlay}
                  className="p-4 bg-sk4-orange hover:bg-sk4-orange-dark text-white rounded-full transition-all shadow-sk4-glow"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" fill="currentColor" />
                  ) : (
                    <Play className="w-8 h-8" fill="currentColor" />
                  )}
                </button>
                
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Sidebar */}
      {showPlaylist && playlist.length > 0 && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-sk4-gray shadow-sk4-strong z-40 overflow-y-auto">
          <div className="p-4 border-b border-sk4-gray flex items-center justify-between sticky top-0 bg-white">
            <h3 className="font-semibold text-sk4-charcoal">Playlist ({playlist.length})</h3>
            <button
              onClick={() => setShowPlaylist(false)}
              className="p-2 hover:bg-sk4-light-gray rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-sk4-dark-gray" />
            </button>
          </div>
          <div className="p-2">
            {playlist.map((item, index) => (
              <button
                key={index}
                onClick={() => onTrackSelect?.(item)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  item.id === track.id
                    ? 'bg-sk4-orange/10 border border-sk4-orange'
                    : 'hover:bg-sk4-light-gray'
                }`}
              >
                <img 
                  src={item.thumbnailUrl} 
                  alt={item.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-sk4-charcoal truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-sk4-dark-gray truncate">
                    {item.artist}
                  </p>
                </div>
                {item.id === track.id && (
                  <div className="w-2 h-2 bg-sk4-orange rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

