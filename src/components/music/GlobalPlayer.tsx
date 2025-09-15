'use client';

import { X } from 'lucide-react';
import { TrackInfo } from '@/types';

interface GlobalPlayerProps {
  track: TrackInfo | null;
  onClose: () => void;
}

export default function GlobalPlayer({ track, onClose }: GlobalPlayerProps) {
  if (!track) return null;

  const videoId = track.externalId;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-sk4-white border border-sk4-gray shadow-lg rounded p-sk4-sm w-[320px]">
        <div className="flex items-center justify-between mb-sk4-sm">
          <div className="truncate sk4-text-sm text-sk4-charcoal">{track.title}</div>
          <button onClick={onClose} className="sk4-text-xs text-sk4-dark-gray hover:text-sk4-charcoal"> <X className="w-4 h-4" /> </button>
        </div>
        <div className="w-full aspect-video rounded overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`}
            title={track.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}


