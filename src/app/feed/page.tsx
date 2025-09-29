'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import WaveCard from '@/components/wave/WaveCard';
import RadioDisplay from '@/components/music/RadioDisplay';
import Navigation from '@/components/layout/Navigation';
import CreateWaveModal from '@/components/wave/CreateWaveModal';
import CommentSheet from '@/components/wave/CommentSheet';
import ShareModal from '@/components/wave/ShareModal';
import SaveToPlaylistModal from '@/components/wave/SaveToPlaylistModal';
import FilterModal from '@/components/feed/FilterModal';
import EmptyState from '@/components/feed/EmptyState';
import { dummyWaves, dummyTracks, dummyPlaylists } from '@/lib/dummy-data';
import { TrackInfo, Wave } from '@/types';
import GlobalPlayer from '@/components/music/GlobalPlayer';
import { ensureSignedIn } from '@/lib/authSupa';
import supabase from '@/lib/supabaseClient';
import { parseYouTubeId } from '@/lib/youtube';

export default function FeedPage() {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveToPlaylistModalOpen, setIsSaveToPlaylistModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedWaveId, setSelectedWaveId] = useState<string>('');
  const [selectedTrackForSave, setSelectedTrackForSave] = useState<TrackInfo | null>(null);
  const [selectedWaveIdForSave, setSelectedWaveIdForSave] = useState<string | null>(null);
  const [waves, setWaves] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const hydratedRef = useRef<Set<string>>(new Set());

  const handlePlay = (trackId: string) => {
    console.log('🎵 handlePlay called with trackId:', trackId);
    
    // 먼저 Supabase 웨이브에서 찾기
    let found = null;
    if (waves.length > 0) {
      found = waves.find(w => w.track.id === trackId)?.track;
      console.log('🎵 Searching in Supabase waves:', waves.length, 'waves');
    }
    
    // Supabase에서 찾지 못했다면 더미 웨이브에서 찾기
    if (!found) {
      found = dummyWaves.find(w => w.track.id === trackId)?.track;
      console.log('🎵 Searching in dummy waves:', dummyWaves.length, 'waves');
    }
    
    // 웨이브에서 찾지 못했다면 더미 트랙에서 직접 찾기
    if (!found) {
      found = dummyTracks.find(t => t.id === trackId) || null;
      console.log('🎵 Searching in dummy tracks:', dummyTracks.length, 'tracks');
    }
    
    console.log('🎵 Found track:', found);
    if (found) {
      setCurrentTrack(found);
      console.log('🎵 Current track set successfully');
    } else {
      console.log('❌ Track not found for ID:', trackId);
      console.log('Available Supabase tracks:', waves.map(w => ({ id: w.track.id, title: w.track.title })));
      console.log('Available dummy tracks:', dummyTracks.map(t => ({ id: t.id, title: t.title })));
    }
  };

  // Load waves from Supabase with profile join (2-step)
  useEffect(() => {
    const initializeWaves = async () => {
      try {
        setIsLoading(true);
        if (!supabase) {
          console.log('Supabase not available, using dummy data');
          setWaves(dummyWaves);
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from('waves')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (data) {
          const userIds = Array.from(new Set((data as any[]).map((w:any)=>w.user_id).filter(Boolean)));
          let userMap: Record<string, { nickname?: string; avatar_url?: string }> = {};
          if (userIds.length) {
            try {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id,nickname,avatar_url')
                .in('id', userIds);
              (profs || []).forEach((p:any)=>{ userMap[p.id] = { nickname: p.nickname, avatar_url: p.avatar_url }; });
            } catch {}
          }
          const mapped = data.map((w: any) => ({
            id: w.id,
            user: {
              id: w.user_id || '00000000-0000-0000-0000-000000000000',
              nickname: userMap[w.user_id]?.nickname || '사용자',
              profileImage: userMap[w.user_id]?.avatar_url || '/default-avatar.png',
              followers: 0,
              following: 0,
              preferences: { genres: [], notifications: { newWaves: true, comments: true, challenges: true } },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              email: '',
            },
            track: {
              id: w.track_external_id || 'yt',
              title: w.track_title || 'Unknown',
              artist: w.track_artist || '',
              platform: 'youtube',
              externalId: w.track_external_id || '',
              thumbnailUrl: w.thumb_url || `https://img.youtube.com/vi/${w.track_external_id}/mqdefault.jpg`,
              duration: 0,
            },
            comment: w.comment || '',
            moodEmoji: w.mood_emoji || '',
            moodText: w.mood_text || '',
            timestamp: w.created_at,
            likes: w.likes || 0,
            comments: w.comments || 0,
            saves: w.saves || 0,
            shares: w.shares || 0,
          }));
          setWaves(mapped);
        }
      } catch (error) {
        console.error('Error loading waves:', error);
        setWaves(dummyWaves);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWaves();
  }, []);

  // Separate useEffect for realtime subscription
  useEffect(() => {
    if (!supabase) return;

    const ch = (supabase as any)
      .channel('feed-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: 'target_type=eq.wave' }, (payload: any) => {
        const waveId = payload.new?.target_id;
        if (!waveId) return;
        setWaves(prev => {
          const list = prev.length ? [...prev] : [];
          const idx = list.findIndex(w => w.id === waveId);
          if (idx >= 0) list[idx] = { ...list[idx], comments: (list[idx].comments || 0) + 1 };
          return list;
        });
      })
      .subscribe();

    return () => {
      try {
        (supabase as any).removeChannel(ch);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
    };
  }, [supabase]);

  const handlePause = () => {
    setIsPlaying(false);
    toast.success('재생 일시정지');
  };

  const handleLike = async (waveId: string) => {
    const u = await ensureSignedIn();
    if (!u || !supabase) return;
    const { data: current } = await supabase
      .from('waves')
      .select('likes')
      .eq('id', waveId)
      .maybeSingle();
    const next = ((current?.likes as number | null) ?? 0) + 1;
    await supabase.from('waves').update({ likes: next }).eq('id', waveId);
    toast.success('좋아요!');
    const source = waves.length ? waves.slice() : dummyWaves.slice();
    const idx = source.findIndex(w => w.id === waveId);
    if (idx >= 0) {
      source[idx] = { ...source[idx], likes: next };
      setWaves(source);
    }
  };

  const handleComment = async (waveId: string) => {
    const u = await ensureSignedIn();
    if (!u) return;
    setSelectedWaveId(waveId);
    setIsCommentSheetOpen(true);
  };

  const handleSave = async (waveId: string) => {
    const u = await ensureSignedIn();
    if (!u) return;
    const wave = (waves.length ? waves : dummyWaves).find(w => w.id === waveId);
    if (wave) setSelectedTrackForSave(wave.track);
    setSelectedWaveIdForSave(waveId);
    setIsSaveToPlaylistModalOpen(true);
  };

  const handleShare = (waveId: string) => {
    setSelectedWaveId(waveId);
    setIsShareModalOpen(true);
  };

  const handleCreateWave = async (waveData: any) => {
    const u = await ensureSignedIn();
    if (!u || !supabase) return;
    let track = waveData.track || null;
    // Resolve YouTube metadata if URL provided
    if (!track && waveData.youtubeUrl) {
      const resolvedId = parseYouTubeId(waveData.youtubeUrl);
      if (resolvedId) {
        try {
          const res = await fetch(`/api/youtube/resolve?type=video&id=${resolvedId}`);
          const meta = await res.json();
          if (meta?.ok) {
            track = {
              id: resolvedId,
              title: meta.title || 'Untitled',
              artist: meta.channelTitle || '',
              platform: 'youtube',
              externalId: resolvedId,
              thumbnailUrl: meta.thumbnails?.high?.url || meta.thumbnails?.medium?.url || meta.thumbnails?.default?.url || `https://img.youtube.com/vi/${resolvedId}/hqdefault.jpg`,
              duration: typeof meta.duration === 'number' ? meta.duration : 0,
            } as any;
          }
        } catch {}
      }
    }
    const finalExternalId = parseYouTubeId(waveData.youtubeUrl || '') || (track?.externalId ?? null);
    const payload: any = {
      user_id: u.id,
      comment: waveData.comment || '',
      mood_emoji: waveData.moodEmoji || null,
      mood_text: waveData.moodText || null,
    };
    if (finalExternalId) {
      const finalTrack = track || {
        title: 'Unknown',
        artist: '',
        externalId: finalExternalId,
        thumbnailUrl: `https://img.youtube.com/vi/${finalExternalId}/mqdefault.jpg`,
      };
      payload.track_title = finalTrack.title;
      payload.track_artist = finalTrack.artist;
      payload.track_platform = 'youtube';
      payload.track_external_id = finalExternalId;
      payload.thumb_url = finalTrack.thumbnailUrl;
    }
    await supabase.from('waves').insert(payload);
    toast.success('웨이브가 발행되었습니다!');
    // reload list
    const { data } = await supabase
      .from('waves')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) {
      const mapped = data.map((w: any) => ({
        id: w.id,
        user: {
          id: w.user_id || '00000000-0000-0000-0000-000000000000',
          nickname: '사용자',
          profileImage: '/default-avatar.png',
          followers: 0,
          following: 0,
          preferences: { genres: [], notifications: { newWaves: true, comments: true, challenges: true } },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          email: '',
        },
        track: {
          id: w.track_external_id || 'yt',
          title: w.track_title || 'Unknown',
          artist: w.track_artist || '',
          platform: 'youtube',
          externalId: w.track_external_id || '',
          thumbnailUrl: w.thumb_url || `https://img.youtube.com/vi/${w.track_external_id}/mqdefault.jpg`,
          duration: 0,
        },
        comment: w.comment || '',
        moodEmoji: w.mood_emoji || '',
        moodText: w.mood_text || '',
        timestamp: w.created_at,
        likes: w.likes || 0,
        comments: w.comments || 0,
        saves: w.saves || 0,
        shares: w.shares || 0,
      }));
      setWaves(mapped);
    }
  };

  const handleCreateNewPlaylist = (name: string, description?: string) => {
    const newPlaylist = {
      id: String(dummyPlaylists.length + 1),
      title: name,
      description: description || undefined,
      creator: {
        id: '1',
        nickname: '나',
        profileImage: '/default-avatar.png',
        followers: 0,
        following: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        email: 'me@example.com',
        preferences: {
          genres: ['K-Pop'],
          notifications: { newWaves: true, comments: true, challenges: true },
        },
      },
      tracks: [],
      isPublic: true,
      isCollaborative: false,
      likes: 0,
      saves: 0,
      plays: 0,
      thumbnailUrl: 'https://via.placeholder.com/150?text=New+Playlist',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dummyPlaylists.unshift(newPlaylist);
    toast.success('새 플레이리스트가 생성되었습니다!');
  };

  return (
    <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header - Enhanced */}
      <header className="hidden lg:block bg-white/95 backdrop-blur-sm border-b border-sk4-gray shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl xl:max-w-6xl mx-auto px-sk4-lg py-sk4-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-sk4-md">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange to-sk4-orange/80 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <div>
                <h1 className="sk4-text-xl font-bold text-sk4-charcoal">WAVE</h1>
                <p className="sk4-text-xs text-sk4-medium-gray">친구들과 음악을 공유하고 발견하세요</p>
              </div>
            </div>
            <div className="flex items-center space-x-sk4-md">
              <div className="hidden xl:block text-right">
                <p className="sk4-text-sm font-medium text-sk4-charcoal">오늘의 발견</p>
                <p className="sk4-text-xs text-sk4-medium-gray">새로운 음악과 친구들</p>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="sk4-btn p-2.5 text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-200"
                title="필터"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
              </button>
              <button
                onClick={async () => { const u = await ensureSignedIn(); if (!u) return; setIsCreateWaveModalOpen(true); }}
                className="sk4-btn px-4 py-2.5 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                웨이브 만들기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State - Enhanced */}
      {isLoading && (
        <div className="flex justify-center items-center py-sk4-xl">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-sk4-lg shadow-sm">
            <div className="flex items-center space-x-sk4-md">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-sk4-orange border-t-transparent"></div>
              <span className="sk4-text-sm text-sk4-charcoal">음악을 불러오는 중...</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header - Enhanced */}
      <header className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-sk4-gray shadow-sm px-sk4-md py-sk4-md sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-sk4-md">
            <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange/80 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="sk4-text-lg font-bold text-sk4-charcoal">WAVE</h1>
              <p className="sk4-text-xs text-sk4-medium-gray">친구들과 음악 공유</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="sk4-btn p-2 text-sk4-medium-gray hover:bg-sk4-light-gray hover:text-sk4-orange transition-all duration-200"
              title="필터"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            <button
              onClick={async () => { const u = await ensureSignedIn(); if (!u) return; setIsCreateWaveModalOpen(true); }}
              className="sk4-btn p-2.5 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Enhanced Layout */}
      <div className="max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-sk4-sm sm:px-sk4-md py-sk4-md sm:py-sk4-lg">
        {/* Radio Display - Enhanced */}
        <div className="mb-sk4-lg">
          <RadioDisplay />
        </div>

        {/* Popular Waves Section - Enhanced */}
        <section className="mb-sk4-xl">
          <div className="flex items-center justify-between mb-sk4-md">
            <div>
              <h2 className="sk4-text-lg font-semibold text-sk4-charcoal mb-1">🔥 인기 웨이브</h2>
              <p className="sk4-text-xs text-sk4-medium-gray">지금 뜨고 있는 음악</p>
            </div>
            <button className="sk4-text-xs text-sk4-orange hover:text-sk4-orange/80 transition-colors duration-200">
              전체보기
            </button>
          </div>
          <div className="flex space-x-sk4-md overflow-x-auto scrollbar-hide pb-sk4-sm snap-x snap-mandatory">
            {(waves.length ? waves : dummyWaves).slice(0,5).map((wave, index)=> (
              <div key={wave.id} className="min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start" style={{ animationDelay: `${index * 50}ms` }}>
                <WaveCard wave={wave} onLike={handleLike} onComment={handleComment} onSave={handleSave} onShare={handleShare} onPlay={handlePlay} />
              </div>
            ))}
          </div>
        </section>

        {/* All Waves Section - Enhanced */}
        <section>
          <div className="flex items-center justify-between mb-sk4-md">
            <div>
              <h2 className="sk4-text-lg font-semibold text-sk4-charcoal mb-1">최근 웨이브</h2>
              <p className="sk4-text-xs text-sk4-medium-gray">친구들의 새로운 음악 발견</p>
            </div>
          </div>

          {waves.length === 0 && dummyWaves.length === 0 && (
            <div className="bg-gradient-to-br from-sk4-light-gray to-sk4-off-white border border-sk4-gray p-sk4-xl text-center">
              <div className="mb-sk4-md">
                <div className="w-16 h-16 bg-sk4-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-sk4-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="sk4-text-base font-medium text-sk4-charcoal mb-2">첫 번째 웨이브를 만들어보세요!</h3>
                <p className="sk4-text-sm text-sk4-medium-gray mb-sk4-md">좋아하는 음악을 친구들과 공유해보세요</p>
                <button
                  onClick={() => setIsCreateWaveModalOpen(true)}
                  className="sk4-btn px-6 py-3 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 웨이브 만들기
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-sk4-md sm:gap-sk4-lg">
            {(waves.length ? waves : dummyWaves).map((wave, index) => (
              <div key={wave.id} className="sk4-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
                <WaveCard
                  wave={wave}
                  onLike={handleLike}
                  onComment={handleComment}
                  onSave={handleSave}
                  onShare={handleShare}
                  onPlay={handlePlay}
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <Navigation onCreateWave={() => {}} />
      <GlobalPlayer track={currentTrack} onClose={() => setCurrentTrack(null)} />

      {/* Modals */}
      <CreateWaveModal
        isOpen={isCreateWaveModalOpen}
        onClose={() => setIsCreateWaveModalOpen(false)}
        onSubmit={handleCreateWave}
      />

      <CommentSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        waveId={selectedWaveId}
        onAfterSubmit={async ()=>{
          if (!selectedWaveId || !supabase) return;
          const source = waves.length ? waves.slice() : dummyWaves.slice();
          const idx = source.findIndex(w=>w.id===selectedWaveId);
          if (idx>=0) {
            const current = source[idx];
            const { count } = await supabase
              .from('comments')
              .select('*', { count:'exact', head:true })
              .eq('target_type','wave')
              .eq('target_id', selectedWaveId);
            source[idx] = { ...current, comments: count || (current.comments||0)+1 };
            setWaves(source);
          }
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wave={dummyWaves.find(w => w.id === selectedWaveId) || dummyWaves[0]}
      />

      <SaveToPlaylistModal
        isOpen={isSaveToPlaylistModalOpen}
        onClose={() => setIsSaveToPlaylistModalOpen(false)}
        track={selectedTrackForSave || dummyTracks[0]}
        playlists={dummyPlaylists}
        onCreatePlaylist={handleCreateNewPlaylist}
        onSaveToPlaylist={async (playlistId: string, track: any) => {
          // 플레이리스트에 트랙 저장 로직
          console.log('Saving track to playlist:', playlistId, track);
          toast.success('플레이리스트에 저장되었습니다!');
          
          // 웨이브 저장 수 업데이트
          if (selectedWaveIdForSave && supabase) {
            const { data: w } = await supabase
              .from('waves')
              .select('id, saves')
              .eq('id', selectedWaveIdForSave)
              .maybeSingle();
            if (w) {
              const source = waves.length ? waves.slice() : dummyWaves.slice();
              const idx = source.findIndex(x => x.id === w.id);
              if (idx >= 0) {
                source[idx] = { ...source[idx], saves: (w.saves ?? 0) + 1 };
                setWaves(source);
              }
            }
          }
        }}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={() => {}}
        currentFilters={{
          timeRange: 'all',
          mood: [],
          genre: [],
          userType: 'all',
          sortBy: 'latest'
        }}
      />
    </div>
  );
}