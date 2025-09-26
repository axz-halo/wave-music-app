'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import supabase from '@/lib/supabaseClient';
import { parseYouTubeId, parseYouTubePlaylistId } from '@/lib/youtube';
import { Music, Upload, Play, Users, Clock, ExternalLink } from 'lucide-react';

export default function StationPage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadUrl, setUploadUrl] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [urlType, setUrlType] = useState<'video' | 'playlist' | 'unknown'>('unknown');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadStep, setUploadStep] = useState<number>(0);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      if (!supabase) return;
      
      const { data, error } = await supabase
        .from('station_playlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading playlists:', error);
        return;
      }

      // 사용자 정보를 별도로 가져오기
      const playlistsWithUsers = await Promise.all(
        (data || []).map(async (playlist) => {
          try {
            if (!supabase) {
              return {
                ...playlist,
                user: { id: playlist.user_id, nickname: '익명', profile_image: null }
              };
            }
            
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, nickname, profile_image')
              .eq('id', playlist.user_id)
              .single();
            
            return {
              ...playlist,
              user: userData || { id: playlist.user_id, nickname: '익명', profile_image: null }
            };
          } catch (userError) {
            console.error('Error fetching user data:', userError);
            return {
              ...playlist,
              user: { id: playlist.user_id, nickname: '익명', profile_image: null }
            };
          }
        })
      );

      setPlaylists(playlistsWithUsers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectUrlType = (url: string) => {
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
  };

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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUploadUrl(newUrl);
    detectUrlType(newUrl);
  };

  const handleUpload = async () => {
    if (!preview || uploading) return;

    console.log('🚀 Upload started');
    setUploading(true);
    setUploadStep(1);
    setUploadProgress('업로드를 시작합니다...');

    try {
      // 1단계: 인증 확인
      console.log('🔐 Step 1: Checking authentication');
      setUploadStep(1);
      setUploadProgress('사용자 인증을 확인하고 있습니다...');
      
      if (!supabase) {
        console.error('❌ Supabase client not available');
        throw new Error('Supabase client not available');
      }

      console.log('📡 Getting session...');
      const session = await supabase.auth.getSession();
      console.log('Session result:', session);
      
      if (!session.data.session?.access_token) {
        console.error('❌ No authentication token found');
        throw new Error('No authentication token found');
      }
      
      console.log('✅ Authentication successful');

      // 2단계: 데이터 처리
      console.log('🎵 Step 2: Processing YouTube data');
      setUploadStep(2);
      setUploadProgress('YouTube 데이터를 처리하고 있습니다...');

      console.log('📤 Sending request to API...');
      const response = await fetch('/api/station/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session.access_token}`
        },
        body: JSON.stringify({
          url: uploadUrl,
          type: urlType,
          preview
        })
      });

      console.log('📥 API response received:', response.status);

      // 3단계: 응답 처리
      console.log('⚡ Step 3: Processing server response');
      setUploadStep(3);
      setUploadProgress('서버에서 응답을 처리하고 있습니다...');

      const result = await response.json();
      console.log('📋 API result:', result);

      if (result.success) {
        // 4단계: 완료
        console.log('✅ Step 4: Upload completed successfully');
        setUploadStep(4);
        setUploadProgress('업로드가 완료되었습니다!');
        
        setTimeout(() => {
          alert('업로드가 성공적으로 완료되었습니다!');
          loadPlaylists();
          setUploadUrl('');
          setPreview(null);
          setUrlType('unknown');
          setIsUploadModalOpen(false);
          setUploadStep(0);
          setUploadProgress('');
        }, 1000);
      } else {
        console.error('❌ Upload failed:', result.error);
        setUploadStep(0);
        setUploadProgress('');
        alert(`업로드 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      setUploadStep(0);
      setUploadProgress('');
      alert('업로드 중 오류가 발생했습니다');
    } finally {
      console.log('🏁 Upload process finished');
      setUploading(false);
    }
  };

  const handlePlaylistClick = (playlist: any) => {
    setSelectedPlaylist(playlist);
    setIsDetailModalOpen(true);
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: string | number): string => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    } else if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toString();
  };

  return (
    <>
      <div className="min-h-screen bg-sk4-off-white pb-20 lg:pb-0 lg:ml-56">
        {/* Header - SK4 디자인 시스템 */}
        <header className="hidden lg:block bg-sk4-white border-b border-sk4-gray px-sk4-lg py-sk4-md sticky top-0 z-30 shadow-minimal">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-sk4-md">
              <div className="w-8 h-8 bg-sk4-orange rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-sk4-white" />
              </div>
              <h1 className="sk4-text-large-title text-sk4-charcoal">Station</h1>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="sk4-action-button bg-sk4-orange text-sk4-white hover:bg-opacity-90 transition-all duration-200 flex items-center space-x-sk4-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="sk4-text-sm">업로드</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-sk4-md py-sk4-lg">
          {/* Mobile Upload Button */}
          <div className="lg:hidden mb-sk4-lg">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full sk4-action-button bg-sk4-orange text-sk4-white hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center space-x-sk4-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="sk4-text-base">YouTube 업로드</span>
            </button>
          </div>

          {/* Welcome Section */}
          <div className="bg-sk4-white rounded-xl shadow-minimal border border-sk4-gray p-sk4-lg mb-sk4-lg">
            <div className="flex items-center space-x-sk4-md mb-sk4-md">
              <div className="w-12 h-12 bg-sk4-orange rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-sk4-white" />
              </div>
              <div>
                <h2 className="sk4-text-lg font-semibold text-sk4-charcoal">Smart Upload</h2>
                <p className="sk4-text-sm text-sk4-dark-gray">YouTube 링크 하나로 모든 것이 자동 처리됩니다</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-sk4-md">
              <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg">
                <div className="w-8 h-8 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 text-sk4-white" />
                </div>
                <div>
                  <p className="sk4-text-xs font-medium text-sk4-charcoal">비디오 업로드</p>
                  <p className="sk4-text-xs text-sk4-dark-gray">단일 비디오를 플레이리스트로</p>
                </div>
              </div>
              <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg">
                <div className="w-8 h-8 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-sk4-white" />
                </div>
                <div>
                  <p className="sk4-text-xs font-medium text-sk4-charcoal">플레이리스트</p>
                  <p className="sk4-text-xs text-sk4-dark-gray">전체 플레이리스트 가져오기</p>
                </div>
              </div>
              <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg">
                <div className="w-8 h-8 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-sk4-white" />
                </div>
                <div>
                  <p className="sk4-text-xs font-medium text-sk4-charcoal">채널 정보</p>
                  <p className="sk4-text-xs text-sk4-dark-gray">구독자 수, 프로필 이미지</p>
                </div>
              </div>
            </div>
          </div>

          {/* Playlists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-sk4-lg">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-sk4-white rounded-xl shadow-minimal border border-sk4-gray p-sk4-md animate-pulse">
                  <div className="aspect-square bg-sk4-light-gray rounded-lg mb-sk4-md"></div>
                  <div className="h-4 bg-sk4-light-gray rounded mb-2"></div>
                  <div className="h-3 bg-sk4-light-gray rounded w-2/3"></div>
                </div>
              ))
            ) : playlists.length === 0 ? (
              <div className="col-span-full text-center py-sk4-xl">
                <div className="w-20 h-20 bg-sk4-light-gray rounded-full flex items-center justify-center mx-auto mb-sk4-md">
                  <Music className="w-8 h-8 text-sk4-medium-gray" />
                </div>
                <h3 className="sk4-text-lg font-medium text-sk4-charcoal mb-2">플레이리스트가 없습니다</h3>
                <p className="sk4-text-sm text-sk4-dark-gray mb-sk4-md">YouTube 비디오나 플레이리스트를 업로드해서 시작하세요</p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="sk4-action-button bg-sk4-orange text-sk4-white hover:bg-opacity-90 transition-all duration-200"
                >
                  <span className="sk4-text-sm">첫 업로드하기</span>
                </button>
              </div>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => handlePlaylistClick(playlist)}
                  className="bg-sk4-white rounded-xl shadow-minimal border border-sk4-gray p-sk4-md cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <div className="aspect-square bg-sk4-light-gray rounded-lg mb-sk4-md overflow-hidden shadow-minimal relative group">
                    <img
                      src={playlist.thumbnail_url || '/placeholder.png'}
                      alt={playlist.title}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Play className="w-8 h-8 text-sk4-white" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-sk4-charcoal mb-1 line-clamp-2 sk4-text-sm">{playlist.title}</h3>
                    <p className="sk4-text-xs text-sk4-dark-gray mb-2">{playlist.channel_title}</p>
                    
                    <div className="flex items-center justify-between sk4-text-xs text-sk4-medium-gray">
                      <span className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-sk4-orange rounded-full mr-sk4-xs"></span>
                        {playlist.tracks?.length || 0}곡
                      </span>
                      <span>{playlist.user?.nickname || '익명'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Navigation />

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-sk4-white rounded-t-xl border-t border-sk4-gray p-sk4-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-sk4-md">
              <div className="flex items-center space-x-sk4-sm">
                <div className="w-8 h-8 bg-sk4-orange rounded-lg flex items-center justify-center">
                  <Upload className="w-4 h-4 text-sk4-white" />
                </div>
                <h3 className="sk4-text-lg font-semibold text-sk4-charcoal">Smart Upload</h3>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
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

              {/* 업로드 진행 상태 표시 */}
              {uploading && (
                <div className="bg-sk4-light-gray rounded-lg p-sk4-md mb-sk4-md">
                  <div className="flex items-center justify-between mb-sk4-sm">
                    <span className="sk4-text-sm font-medium text-sk4-charcoal">업로드 진행 중</span>
                    <span className="sk4-text-xs text-sk4-dark-gray">{uploadStep}/4</span>
                  </div>
                  
                  {/* 진행 바 */}
                  <div className="w-full bg-sk4-gray rounded-full h-2 mb-sk4-sm">
                    <div 
                      className="bg-sk4-orange h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(uploadStep / 4) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* 단계별 상태 */}
                  <div className="space-y-1">
                    {[
                      { step: 1, text: '사용자 인증 확인', icon: '🔐' },
                      { step: 2, text: 'YouTube 데이터 처리', icon: '🎵' },
                      { step: 3, text: '서버 응답 처리', icon: '⚡' },
                      { step: 4, text: '업로드 완료', icon: '✅' }
                    ].map((item) => (
                      <div key={item.step} className={`flex items-center space-x-sk4-sm sk4-text-xs ${
                        uploadStep >= item.step ? 'text-sk4-orange' : 'text-sk4-medium-gray'
                      }`}>
                        <span className={uploadStep >= item.step ? 'opacity-100' : 'opacity-50'}>
                          {uploadStep > item.step ? '✅' : item.icon}
                        </span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-sk4-sm sk4-text-xs text-sk4-dark-gray">
                    {uploadProgress}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)} />
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
                onClick={() => setIsDetailModalOpen(false)}
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
                  
                  {/* 채널 정보 표시 */}
                  {selectedPlaylist.channel_info && (
                    <div className="flex items-center space-x-sk4-md mb-sk4-md p-sk4-sm bg-sk4-light-gray rounded-lg">
                      <img
                        src={selectedPlaylist.channel_info.profileImage}
                        alt={selectedPlaylist.channel_info.title}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="sk4-text-xs font-medium text-sk4-charcoal">{selectedPlaylist.channel_info.title}</p>
                        <div className="flex items-center space-x-sk4-sm sk4-text-xs text-sk4-dark-gray">
                          <span>구독자 {formatNumber(selectedPlaylist.channel_info.subscriberCount)}명</span>
                          <span>•</span>
                          <span>영상 {formatNumber(selectedPlaylist.channel_info.videoCount)}개</span>
                        </div>
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
                  {selectedPlaylist.tracks?.map((track: any, index: number) => (
                    <div key={track.id} className="flex items-center space-x-sk4-md p-sk4-sm rounded-lg hover:bg-sk4-light-gray transition-all duration-200">
                      <span className="sk4-text-xs text-sk4-medium-gray w-8">{index + 1}</span>
                      <img
                        src={track.thumbnail_url || 'https://img.youtube.com/vi/default/mqdefault.jpg'}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover shadow-minimal"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sk4-charcoal truncate sk4-text-sm">{track.title}</p>
                        <p className="sk4-text-xs text-sk4-dark-gray truncate">{track.artist}</p>
                        {track.timestamp && (
                          <p className="sk4-text-xs text-sk4-orange">⏱️ {track.timestamp}</p>
                        )}
                        {track.video_type && (
                          <p className="sk4-text-xs text-sk4-medium-gray">🎵 {track.video_type}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-sk4-sm">
                        <span className="sk4-text-xs text-sk4-medium-gray">
                          {track.duration > 0 ? 
                            `${Math.floor(track.duration / 60)}:${String(track.duration % 60).padStart(2, '0')}` : 
                            '--:--'
                          }
                        </span>
                        {track.youtube_url && (
                          <a
                            href={track.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-sk4-light-gray rounded transition-all duration-200"
                          >
                            <ExternalLink className="w-4 h-4 text-sk4-orange" />
                          </a>
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
