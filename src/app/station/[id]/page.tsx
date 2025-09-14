'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { dummyPlaylists } from '@/lib/dummy-data';
import Navigation from '@/components/layout/Navigation';

export default function StationDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const playlist = useMemo(() => dummyPlaylists.find(p => p.id === id) || dummyPlaylists[0], [id]);
  const [previewId, setPreviewId] = useState<string | null>(playlist.tracks[0]?.externalId || null);

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{playlist.title}</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
          <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-28 h-28 rounded-lg object-cover" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{playlist.title}</h2>
            <p className="text-sm text-gray-600">{playlist.description || '플레이리스트 설명이 없습니다.'}</p>
            <p className="text-xs text-gray-500 mt-1">{playlist.creator.nickname} • {playlist.tracks.length}곡 • 좋아요 {playlist.likes} • 저장 {playlist.saves} • 재생 {playlist.plays}</p>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">트랙</h3>
          <ul className="divide-y divide-gray-100">
            {playlist.tracks.map((t, idx) => (
              <li key={t.id} className="py-3 flex items-center space-x-3">
                <span className="w-6 text-xs text-gray-500">{idx + 1}</span>
                <img src={t.thumbnailUrl} alt={t.title} className="w-12 h-12 rounded" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate">{t.artist}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <button onClick={() => setPreviewId(t.externalId)} className="px-3 py-1.5 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50">미리듣기</button>
                  <div className="text-xs text-gray-500">{Math.floor((t.duration || 0)/60)}:{String((t.duration || 0)%60).padStart(2,'0')}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {previewId && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">미리듣기</h3>
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${previewId}`}
                title="YouTube preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        )}
      </div>
    </div>
    <Navigation />
    </>
  );
}


