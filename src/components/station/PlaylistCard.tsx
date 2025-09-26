'use client';

import Link from 'next/link';
import { Playlist } from '@/types';

export default function PlaylistCard({ playlist, variant = 'grid' }: { playlist: Playlist; variant?: 'grid' | 'carousel' }) {
  return (
    <Link href={`/station/${playlist.id}`} className="block h-full">
      <div className={`bg-sk4-white border border-sk4-gray p-3 sk4-interactive h-full flex flex-col sk4-slide-in`}> 
        <div className={`${variant==='carousel' ? 'w-full h-[120px] sm:h-[140px]' : 'aspect-square w-full'} overflow-hidden mb-3`}>
          <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="sk4-text-base text-sk4-charcoal font-medium truncate">{playlist.title}</h3>
          <p className="sk4-text-xs text-sk4-dark-gray truncate">{playlist.creator.nickname} • {playlist.tracks.length}곡</p>
        </div>
      </div>
    </Link>
  );
}


