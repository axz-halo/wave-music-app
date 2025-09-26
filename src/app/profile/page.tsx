'use client';

import { useEffect, useState } from 'react';
import { Settings, Edit, Music, Trophy, Bookmark } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { dummyWaves } from '@/lib/dummy-data';
import { onAuthStateChange, signInWithGoogle, signOutUser, getOrCreateProfile } from '@/lib/authSupa';
import supabase from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [myWaves, setMyWaves] = useState<Array<any>>([]);
  const [waveCount, setWaveCount] = useState<number>(0);
  const [savedTracksCount, setSavedTracksCount] = useState<number>(0);
  const [participatedChallenges, setParticipatedChallenges] = useState<number>(0);

  const formatJoinDate = (date: string) => {
    const joinDate = new Date(date);
    return `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 가입`;
  };

  useEffect(() => {
    const unsub = onAuthStateChange(async (u) => {
      if (u) {
        const profile = await getOrCreateProfile({ id: u.id, email: u.email, user_metadata: u.user_metadata });
        setUser(profile || { nickname: u.user_metadata?.full_name || '사용자', email: u.email, profileImage: u.user_metadata?.avatar_url, createdAt: new Date().toISOString(), followers: 0, following: 0 });
        if (supabase) {
          const { count: wc } = await supabase.from('waves').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
          setWaveCount(wc || 0);
          const { count: sc } = await supabase.from('playlist_tracks').select('*', { count: 'exact', head: true }).eq('added_by', u.id);
          setSavedTracksCount(sc || 0);
          const { count: pc } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('user_id', u.id);
          setParticipatedChallenges(pc || 0);
          const { data: waves } = await supabase.from('waves').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(3);
          if (waves) {
            setMyWaves(waves.map((w: any) => ({ id: w.id, track: { title: w.track_title, artist: w.track_artist, thumbnailUrl: w.thumb_url }, moodEmoji: w.mood_emoji, likes: w.likes || 0 })));
          }
        }
      } else {
        setUser(null);
        setWaveCount(0);
        setSavedTracksCount(0);
        setParticipatedChallenges(0);
        setMyWaves([]);
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-cream-100 border-b border-cream-200 px-6 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-beige-800">마이페이지</h1>
          <button className="w-10 h-10 bg-cream-200 rounded-full flex items-center justify-center hover:bg-cream-300 transition-all duration-150 shadow-minimal">
            <Settings className="w-5 h-5 text-beige-600" />
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-40 shadow-minimal">
        <div className="flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">마이페이지</h1>
          <button className="w-9 h-9 bg-cream-200 rounded-full flex items-center justify-center hover:bg-cream-300 transition-all duration-150 shadow-minimal">
            <Settings className="w-5 h-5 text-beige-600" />
          </button>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header - compact */}
        <div className="bg-cream-100 rounded-medium shadow-minimal border border-cream-200 p-4">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <img 
                src={(user?.profileImage) || '/default-avatar.png'} 
                alt={(user?.nickname) || 'user'}
                className="w-20 h-20 rounded-full"
              />
            </div>
            
            <div className="space-y-2">
              {!user ? (
                <>
                  <h2 className="text-hierarchy-lg font-bold text-beige-800">로그인이 필요합니다</h2>
                  <p className="text-sm text-beige-600">Google로 로그인하여 데이터를 동기화하세요</p>
                </>
              ) : (
                <>
                  <h2 className="text-hierarchy-lg font-bold text-beige-800">{user.nickname}</h2>
                  <p className="text-sm text-beige-600">{user.email}</p>
                  <p className="text-xs text-beige-500">{formatJoinDate(user.createdAt)}</p>
                </>
              )}
            </div>

            {/* Follow Stats */}
            {user && (
              <div className="flex justify-center space-x-6">
                <div className="text-center">
                  <p className="text-hierarchy-lg font-bold text-beige-800">{user.followers ?? 0}</p>
                  <p className="text-xs text-beige-600">팔로워</p>
                </div>
                <div className="text-center">
                  <p className="text-hierarchy-lg font-bold text-beige-800">{user.following ?? 0}</p>
                  <p className="text-xs text-beige-600">팔로잉</p>
                </div>
              </div>
            )}

            {/* Edit Profile Button */}
            {!user ? (
              <button onClick={signInWithGoogle} className="w-full py-2 bg-sk4-orange text-sk4-white rounded-medium font-semibold text-sm hover:bg-opacity-90 transition-all duration-150">Google로 로그인</button>
            ) : (
              <button onClick={signOutUser} className="w-full py-2 bg-sk4-orange text-sk4-white rounded-medium font-semibold text-sm hover:bg-opacity-90 transition-all duration-150">로그아웃</button>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">활동 통계</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-sk4-orange/10 rounded-medium mx-auto flex items-center justify-center">
                <Music className="w-5 h-5 text-sk4-orange" />
              </div>
              <p className="text-lg font-bold text-gray-900">{waveCount}</p>
              <p className="text-xs text-gray-600">총 웨이브</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-sk4-orange/10 rounded-medium mx-auto flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-sk4-orange" />
              </div>
              <p className="text-lg font-bold text-gray-900">{savedTracksCount}</p>
              <p className="text-xs text-gray-600">저장한 트랙</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-sk4-orange/10 rounded-medium mx-auto flex items-center justify-center">
                <Trophy className="w-5 h-5 text-sk4-orange" />
              </div>
              <p className="text-lg font-bold text-gray-900">{participatedChallenges}</p>
              <p className="text-xs text-gray-600">참여 챌린지</p>
            </div>
          </div>
        </div>

        {/* Music DNA */}
        <div className="card-neumorphic p-6">
          <h3 className="text-hierarchy-lg font-semibold text-neutral-900 mb-4">나의 음악 DNA</h3>
          <div className="space-y-6">
            {/* Genre Preferences */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-label">선호 장르</span>
                <span className="text-xs text-neutral-500">탐험 지수 78%</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">K-Pop</span>
                  <div className="w-24 bg-neutral-200 rounded-full h-2 shadow-neumorphic-inset">
                    <div className="bg-primary-500 h-2 rounded-full w-3/4 shadow-tactile"></div>
                  </div>
                  <span className="text-xs text-neutral-500 w-8 text-right">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Hip-Hop</span>
                  <div className="w-24 bg-neutral-200 rounded-full h-2 shadow-neumorphic-inset">
                    <div className="bg-primary-500 h-2 rounded-full w-1/2 shadow-tactile"></div>
                  </div>
                  <span className="text-xs text-neutral-500 w-8 text-right">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Electronic</span>
                  <div className="w-24 bg-neutral-200 rounded-full h-2 shadow-neumorphic-inset">
                    <div className="bg-primary-500 h-2 rounded-full w-2/5 shadow-tactile"></div>
                  </div>
                  <span className="text-xs text-neutral-500 w-8 text-right">20%</span>
                </div>
              </div>
            </div>
            
            {/* Mood Analysis */}
            <div>
              <span className="text-label mb-3 block">무드 분석</span>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-2xl mb-2">🔥</div>
                  <p className="text-xs text-neutral-600 font-medium">에너지</p>
                  <p className="text-xs text-neutral-500">40%</p>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-2xl mb-2">😭</div>
                  <p className="text-xs text-neutral-600 font-medium">감성</p>
                  <p className="text-xs text-neutral-500">30%</p>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-2xl mb-2">😌</div>
                  <p className="text-xs text-neutral-600 font-medium">휴식</p>
                  <p className="text-xs text-neutral-500">20%</p>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-2xl mb-2">🧠</div>
                  <p className="text-xs text-neutral-600 font-medium">집중</p>
                  <p className="text-xs text-neutral-500">10%</p>
                </div>
              </div>
            </div>

            {/* Listening Time */}
            <div>
              <span className="text-label mb-3 block">청취 시간대</span>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-hierarchy font-bold text-neutral-900">15%</div>
                  <div className="text-xs text-neutral-600">오전</div>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-hierarchy font-bold text-neutral-900">25%</div>
                  <div className="text-xs text-neutral-600">오후</div>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-hierarchy font-bold text-neutral-900">35%</div>
                  <div className="text-xs text-neutral-600">저녁</div>
                </div>
                <div className="text-center p-3 bg-surface-100 rounded-medium shadow-tactile">
                  <div className="text-hierarchy font-bold text-neutral-900">25%</div>
                  <div className="text-xs text-neutral-600">밤</div>
                </div>
              </div>
            </div>

            {/* Influence Index */}
            <div className="flex justify-between items-center pt-4 border-t border-neutral-200/50">
              <div className="text-center p-4 bg-surface-100 rounded-medium shadow-tactile flex-1 mr-2">
                <div className="text-hierarchy-xl font-bold text-primary-500">78</div>
                <div className="text-xs text-neutral-600">탐험 지수</div>
              </div>
              <div className="text-center p-4 bg-surface-100 rounded-medium shadow-tactile flex-1 ml-2">
                <div className="text-hierarchy-xl font-bold text-green-500">12</div>
                <div className="text-xs text-neutral-600">영향력 지수</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Waves Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">내 웨이브</h3>
            <a href="/profile/waves" className="text-sk4-orange text-sm font-medium">전체보기</a>
          </div>
          <div className="space-y-2">
            {myWaves.map((wave) => (
              <div key={wave.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <img 
                  src={wave.track.thumbnailUrl} 
                  alt={wave.track.title}
                  className="w-10 h-10 rounded-lg shadow-sm"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{wave.track.title}</p>
                  <p className="text-xs text-gray-600 truncate">{wave.track.artist}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{wave.moodEmoji}</span>
                  <span className="text-xs text-gray-500">❤️ {wave.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Playlists */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">내 플레이리스트</h3>
            <a href="/profile/playlists" className="text-sk4-orange text-sm font-medium">전체보기</a>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-sk4-orange/10 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-sk4-orange" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">저장한 트랙</p>
                <p className="text-xs text-gray-600">{savedTracksCount}곡</p>
              </div>
              <span className="text-xs text-gray-500">🔖 {savedTracksCount}</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-sk4-orange/10 rounded-medium flex items-center justify-center">
                <Music className="w-5 h-5 text-sk4-orange" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">저장한 플레이리스트</p>
                <p className="text-xs text-gray-600">0개</p>
              </div>
              <span className="text-xs text-gray-500">📁 0</span>
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
