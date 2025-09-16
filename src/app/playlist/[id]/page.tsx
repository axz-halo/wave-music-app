'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { dummyPlaylists } from '@/lib/dummy-data';

export default function PlaylistDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const playlist = useMemo(()=> dummyPlaylists.find(p=>p.id===id) || dummyPlaylists[0], [id]);

  return (
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">{playlist.title}</h1>
          <button className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white rounded sk4-text-sm">전체 재생</button>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="bg-sk4-white border border-sk4-gray p-sk4-md flex items-center gap-sk4-md">
          <img src={playlist.thumbnailUrl || '/default.jpg'} alt={playlist.title} className="w-28 h-28 rounded object-cover" />
          <div className="min-w-0">
            <p className="sk4-text-sm text-sk4-dark-gray">{playlist.creator.nickname}</p>
            <h2 className="sk4-text-lg font-medium text-sk4-charcoal truncate">{playlist.title}</h2>
            <p className="sk4-text-sm text-sk4-dark-gray">{playlist.tracks.length}곡 • 업데이트 {new Date(playlist.updatedAt).toLocaleDateString()}</p>
          </div>
        </section>

        {/* Tracks */}
        <section className="bg-sk4-white border border-sk4-gray">
          {playlist.tracks.map((t) => (
            <div key={t.id} className="flex items-center gap-sk4-sm px-sk4-md py-sk4-sm border-b border-sk4-gray last:border-0">
              <img src={t.thumbnailUrl} className="w-12 h-12 rounded" alt={t.title} />
              <div className="min-w-0 flex-1">
                <p className="sk4-text-sm text-sk4-charcoal truncate">{t.title}</p>
                <p className="sk4-text-xs text-sk4-dark-gray truncate">{t.artist}</p>
              </div>
              <span className="sk4-text-xs text-sk4-dark-gray">{Math.floor(t.duration/60)}:{String(t.duration%60).padStart(2,'0')}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}


