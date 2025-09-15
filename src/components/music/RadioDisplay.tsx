'use client';

import { useEffect, useState } from 'react';

export default function RadioDisplay() {
  const [waveCount, setWaveCount] = useState(32);
  const [trackCount, setTrackCount] = useState(48);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaveCount(prev => prev + Math.floor(Math.random() * 3));
      setTrackCount(prev => prev + Math.floor(Math.random() * 2));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-sk4-white border border-sk4-gray overflow-hidden">
      {/* Top: WAVE RADIO banner */}
      <div className="relative bg-sk4-radio-bg text-sk4-white px-sk4-md py-sk4-md border-b border-sk4-gray">
        {/* Subtle dot-matrix texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-24 grid-rows-6 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-sk4-radio-text"></div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <span className="font-sk4-mono sk4-text-lg tracking-wider">WAVE RADIO</span>
        </div>
      </div>

      {/* Bottom: Today's Stats */}
      <div className="px-sk4-md py-sk4-md">
        <div className="text-center sk4-text-xs font-sk4-mono text-sk4-dark-gray mb-sk4-sm">TODAY'S STATS</div>
        <div className="grid grid-cols-2 gap-sk4-md max-w-xs mx-auto">
          <div className="bg-sk4-white border border-sk4-gray px-sk4-md py-sk4-sm text-center">
            <div className="font-sk4-mono sk4-text-lg text-sk4-charcoal">{waveCount}</div>
            <div className="font-sk4-mono sk4-text-xs text-sk4-dark-gray mt-1">WAVES</div>
          </div>
          <div className="bg-sk4-white border border-sk4-gray px-sk4-md py-sk4-sm text-center">
            <div className="font-sk4-mono sk4-text-lg text-sk4-charcoal">{trackCount}</div>
            <div className="font-sk4-mono sk4-text-xs text-sk4-dark-gray mt-1">TRACKS</div>
          </div>
        </div>
      </div>
    </div>
  );
}