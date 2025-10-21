'use client';

import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

// Components
import WaveCard from '@/components/wave/WaveCard';
import StationFeedCard from '@/components/station/StationFeedCard';
import RadioDisplay from '@/components/music/RadioDisplay';
import Navigation from '@/components/layout/Navigation';
import CreateWaveModal from '@/components/wave/CreateWaveModal';
import CommentSheet from '@/components/wave/CommentSheet';
import ShareModal from '@/components/wave/ShareModal';
import SaveToPlaylistModal from '@/components/wave/SaveToPlaylistModal';
import UnifiedPlayer from '@/components/music/UnifiedPlayer';
import SimplePlayer from '@/components/music/SimplePlayer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import OnboardingTutorial from '@/components/onboarding/OnboardingTutorial';
import { useOnboarding } from '@/hooks/useOnboarding';

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
  const { ensureAuth, user } = useAuth();
  
  // Onboarding
  const { showTutorial, completeOnboarding } = useOnboarding();

  // Player State
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [playlist, setPlaylist] = useState<TrackInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Modal States
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveToPlaylistModalOpen, setIsSaveToPlaylistModalOpen] = useState(false);

  // Selected Items
  const [selectedWaveId, setSelectedWaveId] = useState<string>('');
  const [selectedTrackForSave, setSelectedTrackForSave] = useState<TrackInfo | null>(null);
  const [selectedWaveIdForSave, setSelectedWaveIdForSave] = useState<string | null>(null);

  // Memoized popular waves
  const popularWaves = useMemo(() => waves.slice(0, 5), [waves]);
  
  // Memoized feed items (all waves and stations combined)
  const feedItems = useMemo(() => {
    return waves.map(wave => ({
      type: 'wave' as const,
      data: wave,
      timestamp: new Date().toISOString() // 임시로 현재 시간 사용
    }));
  }, [waves]);
  
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
    
    console.log('🎵 Found track:', found);
    
    if (found) {
      console.log('🎵 Setting current track:', {
        id: found.id,
        externalId: found.externalId,
        platform: found.platform,
        title: found.title,
        artist: found.artist
      });
      setCurrentTrack(found);
      setShowPlayer(true);
      setIsPlaying(true);
      console.log('🎵 Current track set successfully');
    } else {
      console.log('❌ Track not found for ID:', trackId);
    }
  }, [waves]);

  const handleNext = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    }
  }, [currentTrack, playlist]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
    }
  }, [currentTrack, playlist]);

  const handleTrackSelect = useCallback((track: TrackInfo) => {
    setCurrentTrack(track);
  }, []);

  const handleStationLike = useCallback(async (stationId: string) => {
    // Station like handler - placeholder
    console.log('Station like:', stationId);
  }, []);

  const handleStationComment = useCallback(async (stationId: string) => {
    // Station comment handler - placeholder
    console.log('Station comment:', stationId);
  }, []);

  const handleStationShare = useCallback(async (stationId: string) => {
    // Station share handler - placeholder
    console.log('Station share:', stationId);
  }, []);

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

  const handleDelete = useCallback(async (waveId: string) => {
    const user = await ensureAuth();
    if (!user) return;

    try {
      await WaveService.deleteWave(waveId);
      await refreshWaves();
      toast.success('Wave가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete wave:', error);
      toast.error('Wave 삭제에 실패했습니다.');
    }
  }, [ensureAuth, refreshWaves]);

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
    <div className="min-h-screen bg-sk4-off-white pb-24 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white/90 backdrop-blur-md border-b border-sk4-gray/30 sticky top-0 z-40">
        <div className="max-w-4xl xl:max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light flex items-center justify-center rounded-lg shadow-sk4-soft">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-sk4-charcoal">WAVE</h1>
                <p className="text-xs text-sk4-medium-gray">친구들과 음악 공유</p>
              </div>
            </div>
            <button
              onClick={async () => { 
                const u = await ensureAuth(); 
                if (u) setIsCreateWaveModalOpen(true); 
              }}
              className="flex items-center px-4 py-2.5 bg-sk4-orange text-white rounded-xl hover:bg-sk4-orange-dark transition-colors shadow-sk4-soft"
            >
              <Plus className="w-5 h-5 mr-2" />
              웨이브 만들기
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/90 backdrop-blur-md border-b border-sk4-gray/30 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light flex items-center justify-center rounded-lg shadow-sk4-soft">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sk4-charcoal">WAVE</h1>
              <p className="text-xs text-sk4-medium-gray">친구들과 음악 공유</p>
            </div>
          </div>
          <button
            onClick={async () => { 
              const u = await ensureAuth(); 
              if (u) setIsCreateWaveModalOpen(true); 
            }}
            className="p-2.5 bg-sk4-orange text-white rounded-lg shadow-sk4-soft"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-sk4-sm sm:px-sk4-md py-sk4-md sm:py-sk4-lg">
        {/* Loading State */}
        {isLoading ? (
          <LoadingSpinner text="음악을 불러오는 중..." />
        ) : (
          <>
            {/* Radio Display */}
            <div className="mb-sk4-lg">
              <RadioDisplay />
            </div>

            {/* Popular Waves Section */}
            <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-sk4-charcoal flex items-center">
                <span className="text-2xl mr-2">🔥</span>
                인기 웨이브
              </h2>
              <p className="text-sm text-sk4-medium-gray mt-1">지금 뜨고 있는 음악</p>
            </div>
          </div>
          <div className="flex space-x-sk4-md overflow-x-auto scrollbar-hide pb-sk4-sm snap-x snap-mandatory -mx-sk4-sm px-sk4-sm">
            {popularWaves.map((wave, index) => (
              <div 
                key={wave.id} 
                className="w-[calc(100vw-3rem)] sm:w-[320px] lg:w-[340px] max-w-[400px] flex-shrink-0 snap-start sk4-slide-in" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <WaveCard 
                  wave={wave} 
                  onLike={handleLike} 
                  onComment={handleComment} 
                  onSave={handleSave} 
                  onShare={handleShare} 
                  onPlay={handlePlay}
                  onDelete={handleDelete}
                  currentUserId={user?.id}
                />
              </div>
            ))}
          </div>
        </section>

        {/* All Waves Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-sk4-charcoal flex items-center">
                <span className="text-2xl mr-2">✨</span>
                최근 웨이브
              </h2>
              <p className="text-sm text-sk4-medium-gray mt-1">친구들의 새로운 음악 발견</p>
            </div>
          </div>

          {feedItems.length === 0 && !isLoading && (
            <div className="bg-gradient-to-br from-white to-sk4-off-white border-2 border-dashed border-sk4-orange/30 rounded-2xl p-sk4-xl text-center sk4-scale-in">
              <div className="mb-sk4-md">
                <div className="w-20 h-20 bg-gradient-to-br from-sk4-orange/20 to-sk4-orange/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-sk4-float">
                  <svg className="w-10 h-10 text-sk4-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="sk4-spotify-title mb-2 text-sk4-charcoal">첫 번째 웨이브를 만들어보세요!</h3>
                <p className="sk4-spotify-subtitle mb-sk4-lg max-w-sm mx-auto">좋아하는 음악을 친구들과 공유해보세요</p>
                <button
                  onClick={async () => {
                    const u = await ensureAuth();
                    if (u) setIsCreateWaveModalOpen(true);
                  }}
                  className="sk4-spotify-btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <div className="relative flex items-center">
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    첫 웨이브 만들기
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* List View for Feed Items */}
          <div className="space-y-4">
            {feedItems.map((item, index) => (
              <div 
                key={`${item.type}-${item.data.id}`}
                className="sk4-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {item.type === 'wave' ? (
                  <WaveCard 
                    wave={item.data} 
                    onLike={handleLike}
                    onComment={handleComment}
                    onSave={handleSave}
                    onShare={handleShare}
                    onPlay={handlePlay}
                    onDelete={handleDelete}
                    currentUserId={user?.id}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </section>
          </>
        )}
      </div>

      <Navigation onCreateWave={async () => {
        const u = await ensureAuth();
        if (u) setIsCreateWaveModalOpen(true);
      }} />
      
      <SimplePlayer 
        track={currentTrack} 
        isPlaying={isPlaying}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClose={() => {
          setShowPlayer(false);
          setCurrentTrack(null);
          setIsPlaying(false);
        }}
      />

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

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        isOpen={showTutorial}
        onClose={() => completeOnboarding()}
        onComplete={() => completeOnboarding()}
      />
    </div>
  );
}



