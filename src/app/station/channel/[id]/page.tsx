'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { dummyUsers, dummyPlaylists } from '@/lib/dummy-data';
import PlaylistCard from '@/components/station/PlaylistCard';
import Navigation from '@/components/layout/Navigation';

export default function ChannelDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const channel = useMemo(() => dummyUsers.find(u => u.id === id) || dummyUsers[0], [id]);
  const channelPlaylists = useMemo(() => dummyPlaylists, []); // demo: reuse

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0 lg:ml-56">
      <header className="hidden lg:block bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{channel.nickname}</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center space-x-4">
          <img src={channel.profileImage || '/default-avatar.png'} alt={channel.nickname} className="w-20 h-20 rounded-full object-cover" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{channel.nickname}</h2>
            <p className="text-sm text-gray-600">구독자 {channel.followers.toLocaleString()}명 • 팔로잉 {channel.following.toLocaleString()}명</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">주 장르: {channel.preferences?.genres?.[0] || 'Various'}</span>
              {channel.youtubeChannelUrl && (
                <a target="_blank" rel="noopener noreferrer" href={channel.youtubeChannelUrl} className="px-2 py-1 rounded bg-blue-50 text-blue-700">YouTube 채널</a>
              )}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">플레이리스트</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {channelPlaylists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
    <Navigation />
    </>
  );
}


