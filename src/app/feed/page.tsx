'use client';

import { useState } from 'react';
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

export default function FeedPage() {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveToPlaylistModalOpen, setIsSaveToPlaylistModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedWaveId, setSelectedWaveId] = useState<string>('');

  const handlePlay = (trackId: string) => {
    const track = dummyTracks.find(t => t.id === trackId);
    if (track) {
      setCurrentTrack(track);
      setIsPlaying(true);
      toast.success(`${track.title} 재생 시작`);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    toast.success('재생 일시정지');
  };

  const handleLike = (waveId: string) => {
    toast.success('좋아요!');
  };

  const handleComment = (waveId: string) => {
    setSelectedWaveId(waveId);
    setIsCommentSheetOpen(true);
  };

  const handleSave = (waveId: string) => {
    setIsSaveToPlaylistModalOpen(true);
  };

  const handleShare = (waveId: string) => {
    setSelectedWaveId(waveId);
    setIsShareModalOpen(true);
  };

  const handleCreateWave = (waveData: any) => {
    const newWave: Wave = {
      id: String(Date.now()),
      user: {
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
      track: waveData.track || dummyTracks[0],
      comment: waveData.comment || '',
      moodEmoji: waveData.moodEmoji || '🎵',
      moodText: waveData.moodText || '음악',
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
      timestamp: new Date().toISOString(),
    };
    
    dummyWaves.unshift(newWave);
    toast.success('웨이브가 발행되었습니다!');
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
      {/* Desktop Header */}
      <header className="hidden lg:block bg-sk4-white border-b border-sk4-gray px-sk4-lg py-sk4-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="sk4-text-large-title">파도</h1>
          <div className="flex items-center space-x-sk4-md">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="sk4-action-button"
            >
              <svg className="w-5 h-5 text-sk4-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsCreateWaveModalOpen(true)}
              className="sk4-action-button bg-sk4-orange text-sk4-white hover:bg-opacity-90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-sk4-white border-b border-sk4-gray px-sk4-md py-sk4-md sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-sk4-md">
            <div className="w-8 h-8 bg-sk4-orange flex items-center justify-center">
              <span className="text-sk4-white font-medium text-sk4-sm">W</span>
            </div>
            <h1 className="sk4-text-large-title">WAVE</h1>
          </div>
          <div className="flex items-center space-x-sk4-md">
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="sk4-action-button"
            >
              <svg className="w-5 h-5 text-sk4-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            <button 
              onClick={() => setIsCreateWaveModalOpen(true)}
              className="sk4-action-button bg-sk4-orange text-sk4-white hover:bg-opacity-90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-sk4-md py-sk4-lg space-y-sk4-lg">
        {/* Radio Display */}
        <RadioDisplay />

        {/* Filter Tabs */}
        <div className="flex space-x-sk4-sm overflow-x-auto pb-sk4-sm">
          <button className="px-sk4-md py-sk4-sm sk4-text-sm font-medium bg-sk4-orange text-sk4-white">
            전체
          </button>
          <button className="px-sk4-md py-sk4-sm sk4-text-sm font-medium bg-sk4-white text-sk4-dark-gray border border-sk4-gray hover:bg-sk4-light-gray">
            친구만
          </button>
          <button className="px-sk4-md py-sk4-sm sk4-text-sm font-medium bg-sk4-white text-sk4-dark-gray border border-sk4-gray hover:bg-sk4-light-gray">
            팔로잉
          </button>
          <button className="px-sk4-md py-sk4-sm sk4-text-sm font-medium bg-sk4-white text-sk4-dark-gray border border-sk4-gray hover:bg-sk4-light-gray">
            인기 웨이브
          </button>
        </div>

        {/* Wave Feed */}
        <div className="space-y-sk4-sm">
          {dummyWaves.map((wave) => (
            <WaveCard
              key={wave.id}
              wave={wave}
              onLike={handleLike}
              onComment={handleComment}
              onSave={handleSave}
              onShare={handleShare}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </div>

      <Navigation onCreateWave={() => setIsCreateWaveModalOpen(true)} />

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
        comments={[]}
        onAddComment={() => {}}
        onLikeComment={() => {}}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        wave={dummyWaves.find(w => w.id === selectedWaveId) || dummyWaves[0]}
      />

      <SaveToPlaylistModal
        isOpen={isSaveToPlaylistModalOpen}
        onClose={() => setIsSaveToPlaylistModalOpen(false)}
        track={dummyTracks[0]}
        playlists={dummyPlaylists}
        onSaveToPlaylist={() => {}}
        onCreatePlaylist={handleCreateNewPlaylist}
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