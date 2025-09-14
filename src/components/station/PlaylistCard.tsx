'use client';

import Link from 'next/link';
import { Playlist } from '@/types';

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <Link href={`/station/${playlist.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 hover:shadow-md transition">
        <div className="aspect-square w-full overflow-hidden rounded-lg mb-3">
          <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
        <h3 className="font-semibold text-gray-900 truncate">{playlist.title}</h3>
        <p className="text-xs text-gray-500 truncate">{playlist.creator.nickname} • {playlist.tracks.length}곡</p>
      </div>
    </Link>
  );
}


