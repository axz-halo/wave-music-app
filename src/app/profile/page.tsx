'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Edit, Music, Bookmark, User, LogOut, LogIn, Heart, MessageCircle, Share2, Camera } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { onAuthStateChange, signInWithGoogle, signOutUser, getOrCreateProfile } from '@/lib/authSupa';
import supabase from '@/lib/supabaseClient';
import { ProfileCardSkeleton, StatsCardSkeleton, ListSkeleton } from '@/components/common/SkeletonCard';
import { analyzeMusicDNA, MusicDNA } from '@/services/musicDnaService';
import { ProfileService, ProfileImageError } from '@/services/profileService';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [myWaves, setMyWaves] = useState<Array<any>>([]);
  const [waveCount, setWaveCount] = useState<number>(0);
  const [savedTracksCount, setSavedTracksCount] = useState<number>(0);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalComments, setTotalComments] = useState<number>(0);
  const [totalShares, setTotalShares] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [musicDNA, setMusicDNA] = useState<MusicDNA | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lastError, setLastError] = useState<{ message: string; code: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);

  const formatJoinDate = (date: string) => {
    const joinDate = new Date(date);
    return `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 가입`;
  };

  const handleImageClick = () => {
    if (user && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const uploadImage = async (file: File) => {
    if (!user) return;

    setUploadingImage(true);
    setUploadProgress(0);
    setLastError(null);
    setRetryFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 진행 상태 토스트
    const progressToast = toast.loading('이미지 업로드 중...', {
      duration: Infinity,
    });

    try {
      // 이미지 업로드 (자동 압축 포함)
      const imageUrl = await ProfileService.uploadProfileImage(user.id, file, {
        autoCompress: true,
        onProgress: (progress) => {
          setUploadProgress(progress);
          if (progress === 20) {
            toast.loading('이미지 압축 중... 🔄', { id: progressToast });
          } else if (progress === 50) {
            toast.loading('업로드 중... ☁️', { id: progressToast });
          } else if (progress === 80) {
            toast.loading('거의 완료... ✨', { id: progressToast });
          }
        }
      });
      
      // 프로필 업데이트
      await ProfileService.updateProfileImage(user.id, imageUrl);
      
      // 로컬 상태 업데이트
      setUser({ ...user, profileImage: imageUrl });
      setImagePreview(null);
      setRetryFile(null);
      
      toast.success('프로필 이미지가 업데이트되었습니다! 🎉', { id: progressToast });
    } catch (error) {
      console.error('Failed to upload image:', error);
      
      if (error instanceof ProfileImageError) {
        setLastError({ message: error.message, code: error.code });
        
        // 에러 타입별 토스트 알림
        const errorMessages: { [key: string]: { emoji: string; duration: number } } = {
          'INVALID_FILE_TYPE': { emoji: '⚠️', duration: 5000 },
          'FILE_TOO_LARGE': { emoji: '📦', duration: 5000 },
          'FILE_TOO_LARGE_COMPRESS_FAILED': { emoji: '🗜️', duration: 6000 },
          'NETWORK_ERROR': { emoji: '📡', duration: 5000 },
          'UNAUTHORIZED': { emoji: '🔒', duration: 5000 },
          'STORAGE_NOT_FOUND': { emoji: '❌', duration: 6000 },
          'PAYLOAD_TOO_LARGE': { emoji: '📦', duration: 5000 },
        };
        
        const errorConfig = errorMessages[error.code] || { emoji: '❌', duration: 5000 };
        
        toast.error(
          <div>
            <div className="font-semibold mb-1">{errorConfig.emoji} 업로드 실패</div>
            <div className="text-sm whitespace-pre-line">{error.message}</div>
            {['NETWORK_ERROR', 'UNKNOWN_ERROR'].includes(error.code) && (
              <button 
                onClick={() => {
                  toast.dismiss();
                  if (retryFile) uploadImage(retryFile);
                }}
                className="mt-2 text-xs text-sk4-orange font-semibold underline"
              >
                다시 시도
              </button>
            )}
          </div>,
          { 
            id: progressToast,
            duration: errorConfig.duration,
          }
        );
      } else {
        setLastError({ 
          message: '알 수 없는 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.', 
          code: 'UNKNOWN' 
        });
        toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.', { id: progressToast });
      }
      
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 기본 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다. 🖼️');
      return;
    }

    await uploadImage(file);
    
    // input 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetry = () => {
    if (retryFile) {
      uploadImage(retryFile);
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      setLoading(true);
      if (u) {
        const profile = await getOrCreateProfile({ id: u.id, email: u.email, user_metadata: u.user_metadata });
        setUser(profile || { nickname: u.user_metadata?.full_name || '사용자', email: u.email, profileImage: u.user_metadata?.avatar_url, createdAt: new Date().toISOString(), followers: 0, following: 0 });
        if (supabase) {
          // 웨이브 수 조회
          const { count: wc } = await supabase.from('waves').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
          setWaveCount(wc || 0);
          
          // 저장된 웨이브 수 조회 (wave_saves 테이블에서)
          const { count: sc } = await supabase.from('wave_saves').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
          setSavedTracksCount(sc || 0);
          
          // 사용자의 웨이브들에서 총 좋아요, 댓글, 공유 수 계산
          const { data: userWaves } = await supabase.from('waves').select('likes, comments, shares').eq('user_id', u.id);
          if (userWaves) {
            const totalLikesCount = userWaves.reduce((sum, wave) => sum + (wave.likes || 0), 0);
            const totalCommentsCount = userWaves.reduce((sum, wave) => sum + (wave.comments || 0), 0);
            const totalSharesCount = userWaves.reduce((sum, wave) => sum + (wave.shares || 0), 0);
            setTotalLikes(totalLikesCount);
            setTotalComments(totalCommentsCount);
            setTotalShares(totalSharesCount);
          }
          
          // 최근 웨이브 3개 조회
          const { data: waves } = await supabase.from('waves').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(3);
          if (waves) {
            setMyWaves(waves.map((w: any) => ({ 
              id: w.id, 
              track: { 
                title: w.track_info?.title || 'Unknown',
                artist: w.track_info?.artist || 'Unknown',
                thumbnailUrl: w.track_info?.thumbnailUrl || '/placeholder.png'
              }, 
              comment: w.comment || '',
              moodEmoji: w.mood_emoji, 
              moodText: w.mood_text,
              likes: w.likes || 0,
              comments: w.comments || 0,
              shares: w.shares || 0,
              timestamp: w.created_at
            })));
          }
          
          // 음악 DNA 분석
          const dna = await analyzeMusicDNA(u.id);
          setMusicDNA(dna);
        }
      } else {
        setUser(null);
        setWaveCount(0);
        setSavedTracksCount(0);
        setTotalLikes(0);
        setTotalComments(0);
        setTotalShares(0);
        setMyWaves([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-sk4-off-white pb-24 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-white/90 backdrop-blur-md border-b border-sk4-gray/30 sticky top-0 z-40">
        <div className="max-w-4xl xl:max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light flex items-center justify-center rounded-lg shadow-sk4-soft">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sk4-charcoal">마이페이지</h1>
                <p className="text-xs text-sk4-medium-gray">내 프로필과 음악 DNA</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white/90 backdrop-blur-md border-b border-sk4-gray/30 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sk4-orange to-sk4-orange-light flex items-center justify-center rounded-lg shadow-sk4-soft">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sk4-charcoal">마이페이지</h1>
              <p className="text-xs text-sk4-medium-gray">내 프로필</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Header - SK4 Style */}
        {loading ? (
          <ProfileCardSkeleton />
        ) : (
          <div className="sk4-spotify-card p-sk4-lg">
          <div className="text-center space-y-sk4-md">
            <div className="relative inline-block group">
              <img 
                src={imagePreview || user?.profileImage || '/default-avatar.png'} 
                alt={(user?.nickname) || 'user'}
                className={`w-24 h-24 rounded-full border-4 border-sk4-light-gray shadow-sk4-medium object-cover transition-all duration-300 ${
                  uploadingImage ? 'blur-sm' : ''
                }`}
              />
              
              {/* 업로드 진행 상황 */}
              {uploadingImage && (
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/60 flex flex-col items-center justify-center">
                  <div className="relative w-16 h-16">
                    {/* 진행 원형 */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        opacity="0.3"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="white"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadProgress / 100)}`}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 이미지 업로드 버튼 (로그인 시에만 표시) */}
              {user && !uploadingImage && (
                <>
                  <button
                    onClick={handleImageClick}
                    className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-sk4-orange text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sk4-soft">
                    Active
                  </div>
                </>
              )}
              
              {/* 에러 상태 */}
              {lastError && !uploadingImage && (
                <button
                  onClick={handleRetry}
                  className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sk4-soft flex items-center gap-1 transition-colors"
                  title={lastError.message}
                >
                  <span>재시도</span>
                  <span>🔄</span>
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {!user ? (
                <>
                  <h2 className="sk4-spotify-title text-sk4-charcoal">로그인이 필요합니다</h2>
                  <p className="sk4-spotify-subtitle">Google로 로그인하여 데이터를 동기화하세요</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-sk4-charcoal">{user.nickname}</h2>
                  <p className="sk4-spotify-subtitle">{user.email}</p>
                  <p className="sk4-spotify-caption">{formatJoinDate(user.createdAt)}</p>
                </>
              )}
            </div>

            {/* Follow Stats */}
            {user && (
              <div className="flex justify-center space-x-8 pt-sk4-md">
                <div className="text-center">
                  <p className="text-2xl font-bold text-sk4-orange">{user.followers ?? 0}</p>
                  <p className="sk4-spotify-caption">팔로워</p>
                </div>
                <div className="w-px bg-sk4-gray"></div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-sk4-orange">{user.following ?? 0}</p>
                  <p className="sk4-spotify-caption">팔로잉</p>
                </div>
              </div>
            )}

            {/* Auth Button */}
            {!user ? (
              <button 
                onClick={signInWithGoogle} 
                className="mt-4 px-6 py-3 bg-sk4-orange text-white rounded-xl hover:bg-sk4-orange-dark transition-all duration-300 flex items-center justify-center space-x-2 shadow-sk4-soft hover:shadow-sk4-medium font-medium"
              >
                <LogIn className="w-5 h-5" />
                <span>Google로 로그인</span>
              </button>
            ) : (
              <button 
                onClick={signOutUser} 
                className="mt-4 px-6 py-3 bg-white border-2 border-sk4-gray text-sk4-dark-gray rounded-xl hover:bg-sk4-light-gray transition-all duration-300 flex items-center justify-center space-x-2 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </button>
            )}
          </div>
        </div>
        )}

        {/* Activity Stats */}
        {loading ? (
          <StatsCardSkeleton />
        ) : (
          <div className="sk4-spotify-card p-sk4-lg">
          <h3 className="sk4-spotify-title mb-sk4-md">활동 통계</h3>
          <div className="grid grid-cols-2 gap-sk4-md">
            <div className="text-center space-y-sk4-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange/20 to-sk4-orange/10 rounded-lg mx-auto flex items-center justify-center shadow-sk4-soft">
                <Music className="w-6 h-6 text-sk4-orange" />
              </div>
              <p className="text-2xl font-bold text-sk4-charcoal">{waveCount}</p>
              <p className="sk4-spotify-caption">총 웨이브</p>
            </div>
            <div className="text-center space-y-sk4-sm">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange/20 to-sk4-orange/10 rounded-lg mx-auto flex items-center justify-center shadow-sk4-soft">
                <Bookmark className="w-6 h-6 text-sk4-orange" />
              </div>
              <p className="text-2xl font-bold text-sk4-charcoal">{savedTracksCount}</p>
              <p className="sk4-spotify-caption">저장한 트랙</p>
            </div>
          </div>
        </div>
        )}

        {/* Music DNA - Real Data */}
        {!loading && musicDNA && (
          <div className="sk4-spotify-card p-sk4-lg">
            <div className="flex items-center justify-between mb-sk4-md">
              <h3 className="sk4-spotify-title">나의 음악 DNA</h3>
              {musicDNA.totalWaves > 0 && (
                <span className="sk4-spotify-caption text-sk4-orange font-semibold">
                  {musicDNA.uniqueArtists}명의 아티스트 · {musicDNA.totalWaves}개 웨이브
                </span>
              )}
            </div>

            {musicDNA.totalWaves === 0 ? (
              <div className="text-center py-sk4-xl">
                <Music className="w-16 h-16 text-sk4-medium-gray mx-auto mb-sk4-md" />
                <p className="sk4-spotify-subtitle mb-2">음악 DNA를 분석할 데이터가 없습니다</p>
                <p className="sk4-spotify-caption">웨이브를 만들어서 나만의 음악 취향을 기록해보세요!</p>
              </div>
            ) : (
              <div className="space-y-sk4-lg">
                {/* 음악 취향 태그 */}
                {musicDNA.personalityTags.length > 0 && (
                  <div>
                    <span className="sk4-spotify-subtitle mb-sk4-sm block">음악 취향</span>
                    <div className="flex flex-wrap gap-2">
                      {musicDNA.personalityTags.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-2 bg-gradient-to-r from-sk4-orange/20 to-sk4-orange/10 text-sk4-charcoal rounded-full sk4-spotify-caption font-semibold border border-sk4-orange/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top 장르 */}
                {musicDNA.topGenres.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-sk4-sm">
                      <span className="sk4-spotify-subtitle">Top 장르</span>
                    </div>
                    <div className="space-y-sk4-sm">
                      {musicDNA.topGenres.map((genre, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="sk4-spotify-subtitle min-w-[80px]">{genre.genre}</span>
                          <div className="flex-1 mx-sk4-md bg-sk4-light-gray rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-sk4-orange to-sk4-orange-light h-2 rounded-full shadow-sk4-soft transition-all duration-500"
                              style={{ width: `${genre.percentage}%` }}
                            ></div>
                          </div>
                          <span className="sk4-spotify-caption w-12 text-right font-semibold text-sk4-orange">
                            {genre.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 무드 분석 */}
                <div>
                  <span className="sk4-spotify-subtitle mb-sk4-sm block">무드 분석</span>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-sk4-sm">
                    {musicDNA.moods.map((mood, idx) => (
                      <div 
                        key={idx}
                        className="text-center p-sk4-sm bg-sk4-light-gray rounded-lg hover:bg-sk4-orange/10 transition-all duration-300"
                      >
                        <div className="text-2xl mb-2">{mood.emoji}</div>
                        <p className="sk4-spotify-caption font-medium">{mood.text}</p>
                        <p className="sk4-spotify-caption text-sk4-orange font-bold">{mood.percentage}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 아티스트 */}
                {musicDNA.topArtists.length > 0 && (
                  <div className="pt-sk4-md border-t border-sk4-gray">
                    <span className="sk4-spotify-subtitle mb-sk4-sm block">Top 아티스트</span>
                    <div className="space-y-2">
                      {musicDNA.topArtists.slice(0, 5).map((artist, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-sk4-light-gray transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="sk4-spotify-caption text-sk4-medium-gray w-6 text-center font-bold">
                              #{idx + 1}
                            </span>
                            <span className="sk4-spotify-subtitle">{artist.artist}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="sk4-spotify-caption text-sk4-dark-gray">{artist.count}회</span>
                            <span className="sk4-spotify-caption text-sk4-orange font-bold">
                              {artist.percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 지수 */}
                <div className="grid grid-cols-2 gap-sk4-md pt-sk4-md border-t border-sk4-gray">
                  <div className="text-center p-sk4-md bg-gradient-to-br from-sk4-orange/10 to-transparent rounded-lg border border-sk4-orange/20">
                    <div className="text-3xl font-bold text-sk4-orange mb-1">{musicDNA.explorationScore}</div>
                    <div className="sk4-spotify-caption">탐험 지수</div>
                    <div className="sk4-spotify-caption text-xs text-sk4-dark-gray mt-1">
                      {musicDNA.explorationScore >= 70 ? '매우 다양함' : 
                       musicDNA.explorationScore >= 40 ? '적당히 다양함' : '확고한 취향'}
                    </div>
                  </div>
                  <div className="text-center p-sk4-md bg-gradient-to-br from-sk4-orange/10 to-transparent rounded-lg border border-sk4-orange/20">
                    <div className="text-3xl font-bold text-sk4-orange mb-1">{musicDNA.influenceScore}</div>
                    <div className="sk4-spotify-caption">영향력 지수</div>
                    <div className="sk4-spotify-caption text-xs text-sk4-dark-gray mt-1">
                      ❤️ {totalLikes} · 💬 {totalComments}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Waves Preview */}
        {loading ? (
          <div className="sk4-spotify-card p-sk4-lg">
            <div className="h-5 bg-sk4-gray rounded w-24 mb-sk4-md animate-pulse" />
            <ListSkeleton count={3} />
          </div>
        ) : (
          <div className="sk4-spotify-card p-sk4-lg">
          <div className="flex items-center justify-between mb-sk4-md">
            <h3 className="sk4-spotify-title">내 웨이브</h3>
            <a href="/profile/waves" className="text-sk4-orange sk4-spotify-subtitle font-semibold hover:text-sk4-orange-light transition-colors">
              전체보기 →
            </a>
          </div>
          <div className="space-y-sk4-sm">
            {myWaves.length === 0 ? (
              <div className="text-center py-sk4-lg">
                <Music className="w-12 h-12 text-sk4-medium-gray mx-auto mb-sk4-sm" />
                <p className="sk4-spotify-subtitle">아직 웨이브가 없습니다</p>
                <p className="sk4-spotify-caption">첫 웨이브를 만들어보세요!</p>
              </div>
            ) : (
              myWaves.map((wave) => (
                <div key={wave.id} className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg hover:bg-sk4-orange/10 transition-all duration-300 group cursor-pointer">
                  <img 
                    src={wave.track.thumbnailUrl} 
                    alt={wave.track.title}
                    className="w-12 h-12 rounded-lg shadow-sk4-soft group-hover:shadow-sk4-medium transition-shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="sk4-spotify-subtitle truncate group-hover:text-sk4-orange transition-colors">{wave.track.title}</p>
                    <p className="sk4-spotify-caption truncate">{wave.track.artist}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{wave.moodEmoji}</span>
                    <span className="sk4-spotify-caption text-sk4-orange font-semibold">❤️ {wave.likes}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {/* Playlists */}
        {loading ? (
          <div className="sk4-spotify-card p-sk4-lg">
            <div className="h-5 bg-sk4-gray rounded w-32 mb-sk4-md animate-pulse" />
            <ListSkeleton count={2} />
          </div>
        ) : (
          <div className="sk4-spotify-card p-sk4-lg">
          <div className="flex items-center justify-between mb-sk4-md">
            <h3 className="sk4-spotify-title">내 플레이리스트</h3>
            <a href="/profile/playlists" className="text-sk4-orange sk4-spotify-subtitle font-semibold hover:text-sk4-orange-light transition-colors">
              전체보기 →
            </a>
          </div>
          <div className="space-y-sk4-sm">
            <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg hover:bg-sk4-orange/10 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange/20 to-sk4-orange/10 rounded-lg flex items-center justify-center shadow-sk4-soft">
                <Music className="w-6 h-6 text-sk4-orange" />
              </div>
              <div className="flex-1">
                <p className="sk4-spotify-subtitle group-hover:text-sk4-orange transition-colors">저장한 트랙</p>
                <p className="sk4-spotify-caption">{savedTracksCount}곡</p>
              </div>
              <span className="sk4-spotify-caption text-sk4-orange font-semibold">🔖 {savedTracksCount}</span>
            </div>
            <div className="flex items-center space-x-sk4-sm p-sk4-sm bg-sk4-light-gray rounded-lg hover:bg-sk4-orange/10 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-sk4-orange/20 to-sk4-orange/10 rounded-lg flex items-center justify-center shadow-sk4-soft">
                <Bookmark className="w-6 h-6 text-sk4-orange" />
              </div>
              <div className="flex-1">
                <p className="sk4-spotify-subtitle group-hover:text-sk4-orange transition-colors">저장한 플레이리스트</p>
                <p className="sk4-spotify-caption">0개</p>
              </div>
              <span className="sk4-spotify-caption text-sk4-orange font-semibold">📁 0</span>
            </div>
          </div>
        </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
