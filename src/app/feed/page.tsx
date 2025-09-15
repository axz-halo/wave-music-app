
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import WaveCard from '@/components/wave/WaveCard';
import MusicPlayer from '@/components/music/MusicPlayer';
import DailyStats from '@/components/feed/DailyStats';
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
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | undefined>(dummyTracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Modal states
  const [isCreateWaveModalOpen, setIsCreateWaveModalOpen] = useState(false);
  const [isCommentSheetOpen, setIsCommentSheetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveToPlaylistModalOpen, setIsSaveToPlaylistModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Selected wave for modals
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  
  // Comments state
  const [comments, setComments] = useState([
    {
      id: '1',
      user: { nickname: '김음악', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
      content: '이 곡 정말 좋네요! 🎵',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 5,
      isLiked: false,
    },
    {
      id: '2',
      user: { nickname: '박플레이', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
      content: '무드가 딱 맞아요 😌',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      likes: 3,
      isLiked: true,
    },
  ]);

  const handlePlay = (track: TrackInfo) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleLike = (waveId: string) => {
    const idx = dummyWaves.findIndex(w => w.id === waveId);
    if (idx >= 0) {
      const w = dummyWaves[idx];
      w.isLiked = !w.isLiked;
      w.likes += w.isLiked ? 1 : -1;
      setComments((c)=>c); // trigger update without server
    }
    toast.success('좋아요 반영됨');
  };

  const handleComment = (waveId: string) => {
    const wave = dummyWaves.find(w => w.id === waveId);
    setSelectedWave(wave || null);
    setIsCommentSheetOpen(true);
  };

  const handleSave = (waveId: string) => {
    const wave = dummyWaves.find(w => w.id === waveId);
    if (wave) {
      wave.isSaved = !wave.isSaved;
      wave.saves += wave.isSaved ? 1 : -1;
      setCurrentTrack(wave.track);
      setIsSaveToPlaylistModalOpen(true);
    }
    toast('플레이리스트 저장 준비');
  };

  const handleCreateNewPlaylist = (title: string) => {
    const newPlaylist = {
      id: String(Date.now()),
      title,
      description: '',
      creator: {
        id: '1',
        nickname: '김음악',
        email: 'kim@example.com',
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        followers: 156,
        following: 89,
        preferences: { 
          genres: ['K-Pop', 'Hip-Hop'], 
          notifications: { newWaves: true, comments: true, challenges: true }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  const handleSaveToExistingPlaylist = (playlistId: string, track: TrackInfo) => {
    const playlist = dummyPlaylists.find(p => p.id === playlistId);
    if (playlist && !playlist.tracks.some(t => t.id === track.id)) {
      playlist.tracks.push(track);
      toast.success('플레이리스트에 저장되었습니다!');
    } else {
      toast.error('이미 저장된 곡입니다.');
    }
  };

  const handleShare = (waveId: string) => {
    const wave = dummyWaves.find(w => w.id === waveId);
    if (wave) wave.shares += 1;
    setSelectedWave(wave || null);
    setIsShareModalOpen(true);
    toast.success('공유 옵션 열림');
  };

  const handleCreateWave = (waveData: any) => {
    console.log('Creating wave:', waveData);
    // 실제로는 API 호출로 웨이브 생성
  };

  const handleAddComment = (content: string) => {
    const newComment = {
      id: Date.now().toString(),
      user: { nickname: '나', profileImage: '/default-avatar.png' },
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };
    setComments(prev => [newComment, ...prev]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
        : comment
    ));
  };


  const handleApplyFilters = (filters: any) => {
    console.log('Applying filters:', filters);
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-surface-100 border-b border-neutral-200/50 px-6 py-4 sticky top-0 z-30 shadow-soft">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-neutral-900">파도</h1>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            <button className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-all duration-200 shadow-tactile">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-surface-100 border-b border-neutral-200/50 px-4 py-4 sticky top-0 z-40 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-medium flex items-center justify-center shadow-tactile">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <h1 className="text-hierarchy-xl font-semibold text-neutral-900">WAVE</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="w-10 h-10 bg-surface-100 rounded-full flex items-center justify-center hover:bg-surface-200 transition-all duration-200 shadow-tactile"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </button>
            <button className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-all duration-200 shadow-tactile">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-4 space-y-4 lg:space-y-6">
        {/* Music Player */}
        {currentTrack && (
          <MusicPlayer 
            track={currentTrack} 
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        )}

        {/* Daily Stats */}
        <div className="fade-in">
          <DailyStats />
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-3 overflow-x-auto pb-2">
          <button className="px-5 py-3 rounded-medium text-sm font-medium transition-all duration-200 whitespace-nowrap bg-primary-500 text-white shadow-tactile">
            전체
          </button>
          <button className="px-5 py-3 rounded-medium text-sm font-medium transition-all duration-200 whitespace-nowrap bg-surface-100 text-neutral-700 shadow-tactile hover:bg-surface-200">
            친구만
          </button>
          <button className="px-5 py-3 rounded-medium text-sm font-medium transition-all duration-200 whitespace-nowrap bg-surface-100 text-neutral-700 shadow-tactile hover:bg-surface-200">
            팔로잉
          </button>
          <button className="px-5 py-3 rounded-medium text-sm font-medium transition-all duration-200 whitespace-nowrap bg-surface-100 text-neutral-700 shadow-tactile hover:bg-surface-200">
            인기 웨이브
          </button>
        </div>

        {/* Wave Feed */}
        <div className="space-y-5">
          {dummyWaves.map((wave, index) => (
            <div key={wave.id} className="slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
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
      </div>

      {/* Navigation */}
      <Navigation onCreateWave={() => setIsCreateWaveModalOpen(true)} />

      {/* Modals */}
      <CreateWaveModal
        isOpen={isCreateWaveModalOpen}
        onClose={() => setIsCreateWaveModalOpen(false)}
        onSubmit={handleCreateWave}
        initialTrack={currentTrack}
      />

      <CommentSheet
        isOpen={isCommentSheetOpen}
        onClose={() => setIsCommentSheetOpen(false)}
        waveId={selectedWave?.id || ''}
        comments={comments}
        onAddComment={handleAddComment}
        onLikeComment={handleLikeComment}
      />

      {selectedWave && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          wave={selectedWave}
        />
      )}

      {currentTrack && (
        <SaveToPlaylistModal
          isOpen={isSaveToPlaylistModalOpen}
          onClose={() => setIsSaveToPlaylistModalOpen(false)}
          track={currentTrack}
          playlists={dummyPlaylists.map(p => ({
            id: p.id,
            title: p.title,
            tracks: p.tracks,
          }))}
          onSaveToPlaylist={handleSaveToExistingPlaylist}
          onCreatePlaylist={handleCreateNewPlaylist}
        />
      )}

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={{
          timeRange: 'all',
          mood: [],
          genre: [],
          userType: 'all',
          sortBy: 'latest',
        }}
      />
    </div>
  );
}
