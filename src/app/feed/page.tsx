'use client';

import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

// Components
import WaveCard from '@/components/wave/WaveCard';
import RadioDisplay from '@/components/music/RadioDisplay';
import Navigation from '@/components/layout/Navigation';
import CreateWaveModal from '@/components/wave/CreateWaveModal';
import CommentSheet from '@/components/wave/CommentSheet';
import ShareModal from '@/components/wave/ShareModal';
import SaveToPlaylistModal from '@/components/wave/SaveToPlaylistModal';
import FilterModal from '@/components/feed/FilterModal';
import GlobalPlayer from '@/components/music/GlobalPlayer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// Hooks
import { useWaves } from '@/hooks/useWaves';
import { useAuth } from '@/hooks/useAuth';

// Services
import { WaveService } from '@/services/waveService';

// Types & Constants
import { TrackInfo, Wave } from '@/types';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';
import { dummyPlaylists, dummyTracks } from '@/lib/dummy-data';

export default function FeedPage() {
  // Hooks
  const { waves, isLoading, error, updateWave, refreshWaves } = useWaves();
  const { ensureAuth } = useAuth();

  // Player State
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);

  // Modal States
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveToPlaylistModalOpen, setIsSaveToPlaylistModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Selected Items
  const [selectedWaveId, setSelectedWaveId] = useState<string>('');
  const [selectedTrackForSave, setSelectedTrackForSave] = useState<TrackInfo | null>(null);
  const [selectedWaveIdForSave, setSelectedWaveIdForSave] = useState<string | null>(null);

  // Memoized popular waves
  const popularWaves = useMemo(() => waves.slice(0, 5), [waves]);
  
  // Selected wave for modals
  const selectedWave = useMemo(
    () => waves.find(w => w.id === selectedWaveId) || null,
    [waves, selectedWaveId]
  );

  // Handlers
  const handlePlay = useCallback((trackId: string) => {
    console.log('🎵 handlePlay called with trackId:', trackId);
    
    const found = waves.find(w => w.track.id === trackId)?.track || 
                  dummyTracks.find(t => t.id === trackId) || 
                  null;
    
    if (found) {
      setCurrentTrack(found);
      console.log('🎵 Current track set successfully');
    } else {
      console.log('❌ Track not found for ID:', trackId);
    }
  }, [waves]);

  const handleLike = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;

    try {
      const newLikes = await WaveService.incrementLikes(waveId);
      updateWave(waveId, { likes: newLikes });
      toast.success('좋아요!');
    } catch (error) {
      console.error('Failed to like wave:', error);
      toast.error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }, [ensureAuth, updateWave]);

  const handleComment = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;
    
    setSelectedWaveId(waveId);
    setIsCommentSheetOpen(true);
  }, [ensureAuth]);

  const handleSave = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;
    
    const wave = waves.find(w => w.id === waveId);
    if (wave) {
      setSelectedTrackForSave(wave.track);
      setSelectedWaveIdForSave(waveId);
      setIsSaveToPlaylistModalOpen(true);
    }
  }, [ensureAuth, waves]);

  const handleShare = useCallback((waveId: string) => {
    setSelectedWaveId(waveId);
    setIsShareModalOpen(true);
  }, []);

  const handleCreateWave = useCallback(async (waveData: any) => {
    const user = await ensureAuth();
    if (!user) return;

    try {
      await WaveService.createWave(user.id, waveData);
      toast.success(SUCCESS_MESSAGES.WAVE_CREATED);
      await refreshWaves();
      setIsCreateWaveModalOpen(false);
    } catch (error) {
      console.error('Failed to create wave:', error);
      toast.error(ERROR_MESSAGES.GENERIC_ERROR);
    }
  }, [ensureAuth, refreshWaves]);

  const handleCreateNewPlaylist = useCallback((name: string, description?: string) => {
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
  }, []);

  const handleSaveToPlaylist = useCallback(async (playlistId: string, track: any) => {
    console.log('Saving track to playlist:', playlistId, track);
    toast.success(SUCCESS_MESSAGES.PLAYLIST_SAVED);
    
    if (selectedWaveIdForSave) {
      try {
        const wave = await WaveService.getWaveById(selectedWaveIdForSave);
        if (wave) {
          await WaveService.updateWave(selectedWaveIdForSave, { 
            saves: (wave.saves ?? 0) + 1 
          });
          updateWave(selectedWaveIdForSave, { saves: (wave.saves ?? 0) + 1 });
        }
      } catch (error) {
        console.error('Failed to update save count:', error);
      }
    }
  }, [selectedWaveIdForSave, updateWave]);

  const handleCommentSubmit = useCallback(async () => {
    if (!selectedWaveId) return;
    
    try {
      const wave = await WaveService.getWaveById(selectedWaveId);
      if (wave) {
        updateWave(selectedWaveId, { comments: (wave.comments || 0) + 1 });
      }
    } catch (error) {
      console.error('Failed to update comment count:', error);
    }
  }, [selectedWaveId, updateWave]);

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
        <ErrorMessage 
          message={error.message} 
          onRetry={refreshWaves}
        />
        <Navigation onCreateWave={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
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
                onClick={async () => { 
                  const u = await ensureAuth(); 
                  if (u) setIsCreateWaveModalOpen(true); 
                }}
                className="sk4-btn px-4 py-2.5 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                웨이브 만들기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && <LoadingSpinner text="음악을 불러오는 중..." />}

      {/* Mobile Header */}
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
              onClick={async () => { 
                const u = await ensureAuth(); 
                if (u) setIsCreateWaveModalOpen(true); 
              }}
              className="sk4-btn p-2.5 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-sk4-sm sm:px-sk4-md py-sk4-md sm:py-sk4-lg">
        {/* Radio Display */}
        <div className="mb-sk4-lg">
          <RadioDisplay />
        </div>

        {/* Popular Waves Section */}
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
            {popularWaves.map((wave, index) => (
              <div 
                key={wave.id} 
                className="min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-start" 
                style={{ animationDelay: `${index * 50}ms` }}
              >
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

        {/* All Waves Section */}
        <section>
          <div className="flex items-center justify-between mb-sk4-md">
            <div>
              <h2 className="sk4-text-lg font-semibold text-sk4-charcoal mb-1">최근 웨이브</h2>
              <p className="sk4-text-xs text-sk4-medium-gray">친구들의 새로운 음악 발견</p>
            </div>
          </div>

          {waves.length === 0 && !isLoading && (
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
                  onClick={async () => {
                    const u = await ensureAuth();
                    if (u) setIsCreateWaveModalOpen(true);
                  }}
                  className="sk4-btn px-6 py-3 bg-gradient-to-r from-sk4-orange to-sk4-orange/90 text-white font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 웨이브 만들기
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-sk4-md sm:gap-sk4-lg">
            {waves.map((wave, index) => (
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

      <Navigation onCreateWave={async () => {
        const u = await ensureAuth();
        if (u) setIsCreateWaveModalOpen(true);
      }} />
      
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
        onAfterSubmit={handleCommentSubmit}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wave={selectedWave || waves[0]}
      />

      <SaveToPlaylistModal
        isOpen={isSaveToPlaylistModalOpen}
        onClose={() => setIsSaveToPlaylistModalOpen(false)}
        track={selectedTrackForSave || dummyTracks[0]}
        playlists={dummyPlaylists}
        onCreatePlaylist={handleCreateNewPlaylist}
        onSaveToPlaylist={handleSaveToPlaylist}
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

