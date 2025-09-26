'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import PlaylistCard from '@/components/station/PlaylistCard';
import Navigation from '@/components/layout/Navigation';

export default function ChannelDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [meta, setMeta] = useState<{ title: string; handle?: string; thumb?: any } | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(()=>{
    // Fetch minimal channel meta via internal resolve API
    fetch(`/api/youtube/resolve?type=channel&id=${id}`).then(r=>r.json()).then(d=>{
      if (d?.ok) setMeta({ title: d.title, handle: d.handle, thumb: d.thumbnails });
    }).catch(()=>{});
    // Placeholder: fetch top playlists — in real scenario use YouTube Data API search/list
    fetch('/api/youtube/popular').then(r=>r.json()).then(d=>{
      if (Array.isArray(d.items)) setPlaylists(d.items.slice(0,5));
    }).catch(()=>{});
  }, [id]);

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{meta?.title || '채널'}</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
          <img src={meta?.thumb?.medium?.url || meta?.thumb?.default?.url || '/default-avatar.png'} alt={meta?.title || ''} className="w-20 h-20 rounded-full object-cover" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{meta?.title || '채널'}</h2>
            <div className="mt-2 flex items-center gap-2 text-xs">
              {meta?.handle && (
                <a target="_blank" rel="noopener noreferrer" href={`https://www.youtube.com/${meta.handle}`} className="px-2 py-1 rounded bg-sk4-orange/10 text-sk4-orange">YouTube 채널</a>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">플레이리스트</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {playlists.map((p:any) => (
              <PlaylistCard key={p.playlistId} playlist={{
                id: p.playlistId,
                title: p.title,
                description: p.description,
                creator: { 
                  id: 'yt', 
                  nickname: meta?.title || '채널', 
                  profileImage: meta?.thumb?.default?.url || '',
                  followers: 0,
                  following: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  email: '',
                  preferences: { genres: [], notifications: { newWaves: true, comments: true, challenges: true } },
                },
                tracks: [],
                isPublic: true,
                isCollaborative: false,
                likes: 0,
                saves: 0,
                plays: 0,
                thumbnailUrl: p.thumbnails?.medium?.url || p.thumbnails?.default?.url,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }} />
            ))}
          </div>
        </section>
      </div>
    </div>
    <Navigation />
    </>
  );
}


