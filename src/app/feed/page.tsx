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
      const wave = waves.find(w => w.id === waveId);
      if (!wave) return;

      // Use the new toggle method
      const newIsLiked = await WaveService.toggleLike(waveId, user.id);
      
      // Update local state optimistically
      const currentLikes = wave.likes || 0;
      const newLikes = newIsLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      
      updateWave(waveId, { 
        likes: newLikes,
        isLiked: newIsLiked 
      });
      
      toast.success(newIsLiked ? '좋아요!' : '좋아요 취소!');
    } catch (error) {
      console.error('Failed to like wave:', error);
      toast.error(ERROR_MESSAGES.GENERIC_ERROR);
      throw error; // Re-throw so WaveCard can handle the error
    }
  }, [ensureAuth, updateWave, waves]);

  const handleComment = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;
    
    setSelectedWaveId(waveId);
    setIsCommentSheetOpen(true);
  }, [ensureAuth]);

  const handleSave = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;
    
    try {
      const wave = waves.find(w => w.id === waveId);
      if (!wave) return;

      // Use the new toggle method
      const newIsSaved = await WaveService.toggleSave(waveId, user.id);
      
      // Update local state optimistically
      const currentSaves = wave.saves || 0;
      const newSaves = newIsSaved ? currentSaves + 1 : Math.max(0, currentSaves - 1);
      
      updateWave(waveId, { 
        saves: newSaves,
        isSaved: newIsSaved 
      });
      
      // Open playlist modal for saving to playlist
      if (newIsSaved) {
        setSelectedTrackForSave(wave.track);
        setSelectedWaveIdForSave(waveId);
        setIsSaveToPlaylistModalOpen(true);
      }
      
      toast.success(newIsSaved ? '저장되었습니다!' : '저장 취소!');
    } catch (error) {
      console.error('Failed to save wave:', error);
      toast.error(ERROR_MESSAGES.GENERIC_ERROR);
      throw error; // Re-throw so WaveCard can handle the error
    }
  }, [ensureAuth, updateWave, waves]);

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
        const newCommentCount = (wave.comments || 0) + 1;
        
        // Update database
        await WaveService.updateWave(selectedWaveId, { comments: newCommentCount });
        
        // Update local state
        updateWave(selectedWaveId, { comments: newCommentCount });
      }
    } catch (error) {
      console.error('Failed to update comment count:', error);
      toast.error('댓글 카운트 업데이트 실패');
    }
  }, [selectedWaveId, updateWave]);

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-sk4-off-white pb-24 lg:pb-0 lg:ml-56">
        <ErrorMessage 
          message={error.message} 
          onRetry={refreshWaves}
        />
        <Navigation onCreateWave={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24 lg:pb-0 lg:ml-56">
      {/* Desktop Header - Spotify Style */}
      <header className="hidden lg:block bg-black/90 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center rounded-full shadow-lg">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">WAVE</h1>
                <p className="text-gray-400 text-sm">친구들과 음악을 공유하고 발견하세요</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
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
                className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <div className="flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  웨이브 만들기
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && <LoadingSpinner text="음악을 불러오는 중..." />}

      {/* Mobile Header - Spotify Style */}
      <header className="lg:hidden bg-black/90 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center rounded-full shadow-lg">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">WAVE</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200"
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
              className="p-2 bg-white text-black rounded-full hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Spotify Style */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Radio Display */}
        <div className="mb-8">
          <RadioDisplay />
        </div>

        {/* Popular Waves Section - Spotify Style */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-2xl mb-1">🔥 인기 웨이브</h2>
              <p className="text-gray-400 text-sm">지금 뜨고 있는 음악</p>
            </div>
            <button className="text-gray-400 hover:text-white text-sm font-semibold transition-colors">
              전체보기 →
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory -mx-6 px-6">
            {popularWaves.map((wave, index) => (
              <div 
                key={wave.id} 
                className="min-w-[280px] sm:min-w-[320px] flex-shrink-0 snap-start" 
                style={{ animationDelay: `${index * 100}ms` }}
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

        {/* All Waves Section - Spotify Style */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-bold text-2xl mb-1">✨ 최근 웨이브</h2>
              <p className="text-gray-400 text-sm">친구들의 새로운 음악 발견</p>
            </div>
          </div>

          {waves.length === 0 && !isLoading && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">첫 번째 웨이브를 만들어보세요!</h3>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">좋아하는 음악을 친구들과 공유해보세요</p>
                <button
                  onClick={async () => {
                    const u = await ensureAuth();
                    if (u) setIsCreateWaveModalOpen(true);
                  }}
                  className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    첫 웨이브 만들기
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {waves.map((wave, index) => (
              <div key={wave.id} style={{ animationDelay: `${index * 100}ms` }}>
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


