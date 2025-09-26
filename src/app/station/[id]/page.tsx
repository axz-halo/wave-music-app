'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import supabase from '@/lib/supabaseClient';
import { ensureSignedIn } from '@/lib/authSupa';
import { useParams } from 'next/navigation';
import { dummyPlaylists } from '@/lib/dummy-data';
import Navigation from '@/components/layout/Navigation';
import SaveToPlaylistModal from '@/components/wave/SaveToPlaylistModal';

export default function StationDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const [playlist, setPlaylist] = useState<any>(() => dummyPlaylists.find(p => p.id === id) || dummyPlaylists[0]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('stations').select('*').eq('id', id).maybeSingle();
      if (data) {
        const p = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          creator: { nickname: '사용자' },
          tracks: data.tracks_json || [],
          thumbnailUrl: data.thumb_url || (data.track_external_id ? `https://img.youtube.com/vi/${data.track_external_id}/mqdefault.jpg` : '/placeholder.png'),
          likes: 0,
          saves: 0,
          plays: 0,
        } as any;
        setPlaylist(p);
        setPreviewId(data.track_external_id || null);
      }
    };
    load();
  }, [id]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);

  const handleGroupSave = async () => {
    try {
      const u = await ensureSignedIn();
      if (!u) return;
      if (!supabase) throw new Error('Supabase not configured');
      const tracks = (playlist.tracks || []).map((t:any) => ({
        externalId: t.externalId,
        title: t.title,
        artist: t.artist,
        thumbnailUrl: t.thumbnailUrl,
        duration: t.duration,
        platform: t.platform || 'youtube',
      }));
      await supabase.from('saved_playlists').insert({
        user_id: u.id,
        source: 'station',
        source_playlist_id: playlist.id,
        title: playlist.title,
        description: playlist.description || null,
        thumb_url: playlist.thumbnailUrl || null,
        tracks_json: tracks,
      });
      toast.success('플레이리스트가 저장되었습니다');
    } catch (e:any) {
      toast.error(e?.message || '저장 실패');
    }
  };

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
            <p className="text-xs text-gray-500 mt-1">{playlist.creator.nickname} • {playlist.tracks?.length || 0}곡</p>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={handleGroupSave} className="px-3 py-1.5 text-xs rounded bg-sk4-orange text-sk4-white">플레이리스트 저장</button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">트랙</h3>
          <ul className="divide-y divide-gray-100">
            {playlist.tracks?.map((t: any, idx: number) => (
              <li key={t.id} className="py-3 flex items-center space-x-3">
                <span className="w-6 text-xs text-gray-500">{idx + 1}</span>
                <img src={t.thumbnailUrl || `https://img.youtube.com/vi/${t.externalId}/mqdefault.jpg`} alt={t.title} className="w-12 h-12 rounded" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate">{t.artist}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <button onClick={() => setPreviewId(t.externalId)} className="px-3 py-1.5 text-xs rounded border border-gray-200 bg-white hover:bg-gray-50">미리듣기</button>
                  <button onClick={() => { setSelectedTrack({ id: t.id, externalId: t.externalId, title: t.title, artist: t.artist, platform: 'youtube', thumbnailUrl: t.thumbnailUrl || `https://img.youtube.com/vi/${t.externalId}/mqdefault.jpg`, duration: t.duration }); setSaveOpen(true); }} className="px-3 py-1.5 text-xs rounded bg-sk4-orange text-sk4-white">저장</button>
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
    <SaveToPlaylistModal 
      isOpen={saveOpen} 
      onClose={() => setSaveOpen(false)} 
      track={selectedTrack || {}} 
      playlists={[]}
      onCreatePlaylist={() => {}}
      onSaveToPlaylist={() => {}}
    />
    </>
  );
}


