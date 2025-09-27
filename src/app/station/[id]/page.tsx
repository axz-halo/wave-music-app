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

      // station_playlists 테이블에서 데이터 가져오기
      const { data } = await supabase
        .from('station_playlists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        // 사용자 정보 가져오기
        let creator = { nickname: '사용자', avatar_url: null };
        try {
          const { data: userData } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', data.user_id)
            .single();
          if (userData) {
            creator = userData;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        const p = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          creator: creator,
          tracks: data.tracks || [],
          thumbnailUrl: data.thumbnail_url,
          channelTitle: data.channel_title,
          channelInfo: data.channel_info,
          likes: 0,
          saves: 0,
          plays: 0,
        } as any;
        setPlaylist(p);
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
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            <img src={playlist.thumbnailUrl} alt={playlist.title} className="w-32 h-32 rounded-lg object-cover flex-shrink-0" />

            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{playlist.title}</h2>
              <p className="text-sm text-gray-600 mb-3">{playlist.description || '플레이리스트 설명이 없습니다.'}</p>

              {/* 사용자 정보 */}
              <div className="flex items-center space-x-2 mb-3">
                <img
                  src={playlist.creator.avatar_url || '/default-avatar.png'}
                  alt={playlist.creator.nickname}
                  className="w-6 h-6 rounded-full border border-gray-200"
                />
                <span className="text-sm text-gray-700">업로드: {playlist.creator.nickname}</span>
              </div>

              {/* 채널 정보 */}
              {playlist.channelInfo && (
                <div className="flex items-center space-x-2 mb-3">
                  <img
                    src={playlist.channelInfo.profileImageUrl || '/default-avatar.png'}
                    alt={playlist.channelInfo.name}
                    className="w-6 h-6 rounded-full border border-gray-200"
                  />
                  <div>
                    <span className="text-sm text-gray-700">{playlist.channelInfo.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{playlist.channelInfo.subscriberCount} 구독자</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{playlist.tracks?.length || 0}곡</span>
                <button onClick={handleGroupSave} className="px-4 py-2 text-sm rounded-lg bg-sk4-orange text-white hover:bg-sk4-orange/90 transition-colors">
                  플레이리스트 저장
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">트랙 목록</h3>
          <ul className="space-y-3">
            {playlist.tracks?.map((t: any, idx: number) => (
              <li key={t.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="w-8 text-sm font-medium text-gray-500 text-center">{idx + 1}</span>
                <img
                  src={t.thumbnail_url || `https://img.youtube.com/vi/${t.id}/mqdefault.jpg`}
                  alt={t.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-sm text-gray-600 truncate">{t.artist}</p>
                  {t.timestamp && (
                    <p className="text-xs text-gray-500">{t.timestamp}</p>
                  )}
                </div>
                {t.youtube_url && (
                  <a
                    href={t.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-sk4-orange transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setPreviewId(t.id)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    미리듣기
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrack({
                        id: t.id,
                        externalId: t.id,
                        title: t.title,
                        artist: t.artist,
                        platform: 'youtube',
                        thumbnailUrl: t.thumbnail_url || `https://img.youtube.com/vi/${t.id}/mqdefault.jpg`,
                        duration: t.duration
                      });
                      setSaveOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg bg-sk4-orange text-white hover:bg-sk4-orange/90 transition-colors"
                  >
                    저장
                  </button>
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


