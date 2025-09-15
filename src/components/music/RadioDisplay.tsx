'use client';

import { useState } from 'react';
import { Radio, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function RadioDisplay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [frequency] = useState(91.7);

  return (
    <div className="sk4-radio-display p-sk4-lg">
      {/* Radio Header */}
      <div className="flex items-center justify-between mb-sk4-md">
        <div className="flex items-center space-x-sk4-sm">
          <div className="w-8 h-8 bg-sk4-orange flex items-center justify-center">
            <Radio className="w-4 h-4 text-sk4-white" />
          </div>
          <div>
            <h3 className="sk4-text-lg font-medium">WAVE Radio</h3>
            <p className="sk4-text-sm text-sk4-radio-text">FM {frequency.toFixed(1)}</p>
          </div>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-sk4-md">
        <button className="sk4-action-button">
          <SkipBack className="w-4 h-4 text-sk4-radio-text" />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="sk4-action-button w-12 h-12">
          {isPlaying ? (
            <Pause className="w-6 h-6 text-sk4-radio-text" />
          ) : (
            <Play className="w-6 h-6 text-sk4-radio-text" />
          )}
        </button>
        <button className="sk4-action-button">
          <SkipForward className="w-4 h-4 text-sk4-radio-text" />
        </button>
      </div>

      {/* Volume Slider */}
      <div className="flex items-center space-x-sk4-sm mt-sk4-md">
        {volume === 0 ? (
          <VolumeX className="w-4 h-4 text-sk4-radio-text" />
        ) : (
          <Volume2 className="w-4 h-4 text-sk4-radio-text" />
        )}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-1 bg-sk4-dark-gray appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--sk4-radio-text) ${volume}%, var(--sk4-dark-gray) ${volume}%)`,
          }}
        />
      </div>
    </div>
  );
}