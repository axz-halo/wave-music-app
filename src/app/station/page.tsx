'use client';

import { useState, useCallback, useMemo } from 'react';
import { Music, Upload, Play, Users, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

// Components
import Navigation from '@/components/layout/Navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';

// Hooks
import { useStations } from '@/hooks/useStations';

// Services & Utils
import { StationService, StationPlaylist } from '@/services/stationService';
import { parseYouTubeId, parseYouTubePlaylistId } from '@/lib/youtube';
import { formatNumber } from '@/lib/transformers';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants';

type UrlType = 'video' | 'playlist' | 'unknown';

interface PreviewData {
  type: string;
  id: string;
  title: string;
  channelTitle?: string;
  thumbnail?: string;
  duration?: number;
  itemCount?: number;
}

export default function StationPage() {
  const { playlists, isLoading, error, refreshPlaylists } = useStations();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<StationPlaylist | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [urlType, setUrlType] = useState<UrlType>('unknown');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const detectUrlType = useCallback((url: string) => {
    if (!url.trim()) {
      setUrlType('unknown');
      setPreview(null);
      return;
    }

    const videoId = parseYouTubeId(url);
    const playlistId = parseYouTubePlaylistId(url);

    if (playlistId) {
      setUrlType('playlist');
      fetchPlaylistPreview(playlistId);
    } else if (videoId) {
      setUrlType('video');
      fetchVideoPreview(videoId);
    } else {
      setUrlType('unknown');
      setPreview(null);
    }
  }, []);

  const fetchVideoPreview = async (videoId: string) => {
    try {
      const response = await fetch(`/api/youtube/resolve?type=video&id=${videoId}`);
      const data = await response.json();
      
      if (data.ok) {
        setPreview({
          type: 'video',
          id: videoId,
          title: data.title,
          channelTitle: data.channelTitle,
          thumbnail: data.thumbnails?.medium?.url || data.thumbnails?.default?.url,
          duration: data.duration,
        });
      } else {
        setPreview(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreview(null);
    }
  };

  const fetchPlaylistPreview = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/youtube/resolve?type=playlist&id=${playlistId}`);
      const data = await response.json();
      
      if (data.ok) {
        setPreview({
          type: 'playlist',
          id: playlistId,
          title: data.title,
          channelTitle: data.channelTitle,
          thumbnail: data.thumbnails?.medium?.url || data.thumbnails?.default?.url,
          itemCount: data.itemCount,
        });
      } else {
        setPreview(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setPreview(null);
    }
  };

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUploadUrl(newUrl);
    detectUrlType(newUrl);
  }, [detectUrlType]);

  const handleUpload = async () => {
    if (!preview || uploading) return;

    setUploading(true);
    setUploadProgress('처리 시작 중...');

    try {
      // Show different messages based on type
      if (urlType === 'playlist') {
        setUploadProgress('📋 플레이리스트 정보 가져오는 중...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
        
        setUploadProgress('🎵 트랙 정보 처리 중...');
      } else {
        setUploadProgress('🎵 비디오 정보 처리 중...');
      }

      const result: {
        success: boolean;
        message?: string;
        tracksCount?: number;
        playlist?: any;
        type?: string;
      } = await StationService.uploadStation({
        url: uploadUrl,
        type: urlType as 'video' | 'playlist',
        preview,
      });

      if (urlType === 'playlist' && result.tracksCount) {
        setUploadProgress(`✅ ${result.tracksCount}개 트랙 추가 완료!`);
      } else {
        setUploadProgress('✅ 업로드 완료!');
      }
      
      setTimeout(() => {
        refreshPlaylists();
        setUploadUrl('');
        setPreview(null);
        setUrlType('unknown');
        setIsUploadModalOpen(false);
        setUploadProgress('');
        
        if (result.tracksCount) {
          toast.success(`${result.tracksCount}개 트랙이 추가되었습니다!`, {
            duration: 3000,
            icon: '🎉'
          });
        } else {
          toast.success(SUCCESS_MESSAGES.UPLOAD_SUCCESS);
        }
      }, 1000);
    } catch (error: any) {
      setUploadProgress('');
      const errorMessage = error.message || ERROR_MESSAGES.UPLOAD_FAILED;
      toast.error(errorMessage, {
        duration: 4000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handlePlaylistClick = useCallback((playlist: StationPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsDetailModalOpen(true);
  }, []);

  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
    setUploadUrl('');
    setPreview(null);
    setUrlType('unknown');
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedPlaylist(null);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
        <ErrorMessage 
          message={error.message} 
          onRetry={refreshPlaylists}
        />
        <Navigation />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black pb-20 lg:pb-0 lg:ml-56">
        {/* Header - Spotify Style */}
        <header className="hidden lg:block bg-black/90 backdrop-blur-xl border-b border-gray-800/50 shadow-2xl sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center rounded-full shadow-lg">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-white font-bold text-xl">Station</h1>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>업로드</span>
              </button>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && <LoadingSpinner text="플레이리스트를 불러오는 중..." />}

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Mobile Upload Button */}
          <div className="lg:hidden mb-8">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full bg-white text-black py-3 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>YouTube 업로드</span>
            </button>
          </div>

          {/* Welcome Section - Spotify Style */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Smart Upload</h2>
                <p className="text-gray-400 text-sm">YouTube 링크 하나로 모든 것이 자동 처리됩니다</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">비디오 업로드</p>
                  <p className="text-gray-400 text-xs">단일 비디오를 플레이리스트로</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">플레이리스트</p>
                  <p className="text-gray-400 text-xs">전체 플레이리스트 가져오기</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">채널 정보</p>
                  <p className="text-gray-400 text-xs">구독자 수, 프로필 이미지</p>
                </div>
              </div>
            </div>
          </div>

          {/* Playlists Grid - Spotify Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 animate-pulse">
                  <div className="aspect-square bg-gray-800 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-800 rounded mb-2"></div>
                  <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                </div>
              ))
            ) : playlists.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Music className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">플레이리스트가 없습니다</h3>
                <p className="text-gray-400 mb-6">YouTube 비디오나 플레이리스트를 업로드해서 시작하세요</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  첫 업로드하기
                </button>
              </div>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handlePlaylistClick(playlist)}
                  className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 cursor-pointer hover:bg-gray-800/50 transition-all duration-200 hover:scale-105 group"
                >
                  <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden shadow-lg relative">
                    <img
                      src={playlist.thumbnail_url || '/placeholder.png'}
                      alt={playlist.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white mb-1 line-clamp-2 text-sm">{playlist.title}</h3>
                    
                    {playlist.channel_info ? (
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={playlist.channel_info.profileImage}
                          alt={playlist.channel_info.title}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <p className="text-xs text-gray-400 truncate">{playlist.channel_info.title}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mb-2">{playlist.channel_title}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                        {playlist.tracks?.length || 0}곡
                      </span>
                      {playlist.channel_info?.subscriberCount && (
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {formatNumber(playlist.channel_info.subscriberCount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Navigation />

      {/* Hidden upload trigger for navigation */}
      <button
        data-upload-trigger
        onClick={() => setIsUploadModalOpen(true)}
        className="hidden"
      />

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeUploadModal} />
          <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-xl border-t border-sk4-gray p-sk4-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-sk4-md">
              <div className="flex items-center space-x-sk4-sm">
                <div className="w-8 h-8 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-sk4-white" />
                </div>
                <h3 className="sk4-text-lg font-semibold text-sk4-charcoal">Smart Upload</h3>
              </div>
              <button 
                onClick={closeUploadModal}
                className="w-8 h-8 rounded-full bg-sk4-light-gray hover:bg-sk4-gray flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-5 h-5 text-sk4-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-sk4-md">
              <div>
                <label className="block sk4-text-sm font-medium text-sk4-charcoal mb-sk4-sm">
                  YouTube 링크
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={handleUrlChange}
                  placeholder="비디오 또는 플레이리스트 링크를 입력하세요"
                  className="w-full p-sk4-md border border-sk4-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-sk4-orange sk4-text-sm bg-sk4-white"
                />
                
                {urlType !== 'unknown' && (
                  <div className="mt-sk4-sm flex items-center space-x-sk4-sm">
                    <div className={`w-2 h-2 rounded-full ${urlType === 'video' ? 'bg-sk4-orange' : 'bg-blue-500'}`}></div>
                    <span className="sk4-text-xs text-sk4-dark-gray">
                      {urlType === 'video' ? '비디오' : '플레이리스트'} 감지됨
                    </span>
                  </div>
                )}
              </div>

              {preview && (
                <div className="border border-sk4-gray rounded-lg p-sk4-md bg-sk4-light-gray">
                  <div className="flex items-start space-x-sk4-md">
                    <img
                      src={preview.thumbnail}
                      alt={preview.title}
                      className="w-16 h-16 rounded-lg object-cover shadow-minimal"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sk4-charcoal mb-1 line-clamp-2">{preview.title}</h4>
                      <p className="sk4-text-sm text-sk4-dark-gray mb-2">{preview.channelTitle}</p>
                      <div className="flex items-center space-x-sk4-sm sk4-text-xs text-sk4-dark-gray">
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-sk4-xs ${preview.type === 'video' ? 'bg-sk4-orange' : 'bg-blue-500'}`}></span>
                          {preview.type === 'video' ? '비디오' : '플레이리스트'}
                        </span>
                        {preview.type === 'video' && preview.duration && (
                          <span>
                            {Math.floor(preview.duration / 60)}:{String(preview.duration % 60).padStart(2, '0')}
                          </span>
                        )}
                        {preview.type === 'playlist' && preview.itemCount && (
                          <span>{preview.itemCount}곡</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="bg-sk4-light-gray rounded-lg p-sk4-md mb-sk4-md flex items-center justify-center">
                  <div className="flex items-center space-x-sk4-sm">
                    <div className="w-4 h-4 border-2 border-sk4-orange border-t-transparent rounded-full animate-spin"></div>
                    <span className="sk4-text-sm text-sk4-charcoal">{uploadProgress || '업로드 중...'}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!preview || uploading}
                className="w-full sk4-action-button bg-sk4-orange text-sk4-white disabled:bg-sk4-medium-gray disabled:cursor-not-allowed flex items-center justify-center space-x-sk4-sm transition-all duration-200"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-sk4-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="sk4-text-sm">처리 중...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span className="sk4-text-sm">업로드</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedPlaylist && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeDetailModal} />
          <div className="absolute inset-4 bg-sk4-white rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-sk4-lg border-b border-sk4-gray bg-sk4-off-white">
              <div className="flex items-center space-x-sk4-md">
                <div className="w-10 h-10 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-sk4-white" />
                </div>
                <div>
                  <h2 className="sk4-text-lg font-semibold text-sk4-charcoal">{selectedPlaylist.title}</h2>
                  <p className="sk4-text-sm text-sk4-dark-gray">{selectedPlaylist.channel_title}</p>
                </div>
              </div>
              <button 
                onClick={closeDetailModal}
                className="w-8 h-8 rounded-full bg-sk4-light-gray hover:bg-sk4-gray flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-5 h-5 text-sk4-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-sk4-lg">
              <div className="flex items-start space-x-sk4-lg mb-sk4-lg">
                <img
                  src={selectedPlaylist.thumbnail_url}
                  alt={selectedPlaylist.title}
                  className="w-32 h-32 rounded-lg object-cover shadow-minimal"
                />
                <div className="flex-1">
                  <h3 className="sk4-text-lg font-semibold text-sk4-charcoal mb-2">{selectedPlaylist.title}</h3>
                  <p className="sk4-text-sm text-sk4-dark-gray mb-2">{selectedPlaylist.channel_title}</p>
                  
                  {selectedPlaylist.channel_info && (
                    <div className="mb-sk4-md">
                      <div className="flex items-center justify-between p-sk4-md bg-gradient-to-r from-sk4-light-gray to-sk4-off-white rounded-lg border border-sk4-gray hover:border-sk4-orange transition-all duration-300 group">
                        <div className="flex items-center space-x-sk4-md flex-1">
                          <img
                            src={selectedPlaylist.channel_info.profileImage}
                            alt={selectedPlaylist.channel_info.title}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sk4-soft group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="sk4-text-base font-semibold text-sk4-charcoal truncate group-hover:text-sk4-orange transition-colors">
                              {selectedPlaylist.channel_info.title}
                            </p>
                            <div className="flex items-center space-x-sk4-sm sk4-text-xs text-sk4-dark-gray mt-1">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {formatNumber(selectedPlaylist.channel_info.subscriberCount)}명
                              </span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Music className="w-3 h-3 mr-1" />
                                {formatNumber(selectedPlaylist.channel_info.videoCount)}개
                              </span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`https://www.youtube.com/channel/${selectedPlaylist.channel_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-sk4-md p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 hover:scale-110 shadow-sk4-soft"
                          title="YouTube 채널 방문"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-sk4-lg sk4-text-xs text-sk4-medium-gray">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-sk4-orange rounded-full mr-sk4-xs"></span>
                      {selectedPlaylist.tracks?.length || 0}곡
                    </span>
                    <span className="flex items-center">
                      <span className="w-4 h-4 rounded-full bg-sk4-orange mr-sk4-xs"></span>
                      업로드: {selectedPlaylist.user?.nickname || '익명'}
                    </span>
                    <span>{new Date(selectedPlaylist.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="sk4-text-base font-semibold text-sk4-charcoal mb-sk4-md">트랙 목록</h4>
                <div className="space-y-2">
                  {selectedPlaylist.tracks?.map((track, index) => (
                    <div key={track.id} className="flex items-center space-x-sk4-md p-sk4-sm rounded-lg hover:bg-sk4-light-gray transition-all duration-200 group">
                      <span className="sk4-text-xs text-sk4-medium-gray w-8">{index + 1}</span>
                      <div className="relative">
                        <img
                          src={track.thumbnail_url || 'https://img.youtube.com/vi/default/mqdefault.jpg'}
                          alt={track.title}
                          className="w-12 h-12 rounded object-cover shadow-minimal"
                        />
                        {track.youtube_url && !track.youtube_url.includes('/results?') && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" fill="white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sk4-charcoal truncate sk4-text-sm">{track.title}</p>
                        <p className="sk4-text-xs text-sk4-dark-gray truncate">{track.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {track.timestamp && (
                            <span className="sk4-text-xs text-sk4-orange">⏱️ {track.timestamp}</span>
                          )}
                          {track.video_type && (
                            <span className="sk4-text-xs text-sk4-medium-gray px-2 py-0.5 bg-sk4-light-gray rounded">
                              {track.video_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-sk4-sm">
                        <span className="sk4-text-xs text-sk4-medium-gray">
                          {track.duration > 0 ? 
                            `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : 
                            '--:--'
                          }
                        </span>
                        {track.youtube_url && (
                          <>
                            {track.youtube_url.includes('/results?') ? (
                              <a
                                href={track.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-sk4-orange hover:text-white rounded-full transition-all duration-200"
                                title="YouTube에서 검색"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <a
                                href={track.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-sk4-orange text-white hover:bg-sk4-orange-dark rounded-full transition-all duration-200"
                                title="YouTube에서 재생"
                              >
                                <Play className="w-4 h-4" fill="white" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

