'use client';

import { useState } from 'react';
import { Settings, Edit, Music, Heart, Trophy, Users, Calendar } from 'lucide-react';
import Navigation from '@/components/layout/Navigation';
import { dummyUsers, dummyWaves } from '@/lib/dummy-data';

export default function ProfilePage() {
  const [user] = useState(dummyUsers[0]); // 현재 사용자
  const [myWaves] = useState(dummyWaves.slice(0, 3)); // 내 웨이브 일부

  const stats = [
    { icon: Music, value: 156, label: '총 웨이브' },
    { icon: Heart, value: 1234, label: '받은 좋아요' },
    { icon: Trophy, value: 8, label: '참여한 챌린지' },
  ];

  const formatJoinDate = (date: string) => {
    const joinDate = new Date(date);
    return `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 가입`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>
          <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <img 
                src={user.profileImage || '/default-avatar.png'} 
                alt={user.nickname}
                className="w-24 h-24 rounded-full"
              />
              <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-all">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">{user.nickname}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500">{formatJoinDate(user.createdAt)}</p>
            </div>

            {/* Follow Stats */}
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.followers}</p>
                <p className="text-xs text-gray-600">팔로워</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{user.following}</p>
                <p className="text-xs text-gray-600">팔로잉</p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-all">
              프로필 편집
            </button>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">활동 통계</h3>
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center space-y-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg mx-auto flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Music DNA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">나의 음악 DNA</h3>
          <div className="space-y-4">
            {/* Genre Preferences */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">선호 장르</span>
                <span className="text-xs text-gray-500">탐험 지수 78%</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">K-Pop</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full w-3/4"></div>
                  </div>
                  <span className="text-xs text-gray-500">35%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Hip-Hop</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full w-1/2"></div>
                  </div>
                  <span className="text-xs text-gray-500">25%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Electronic</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full w-2/5"></div>
                  </div>
                  <span className="text-xs text-gray-500">20%</span>
                </div>
              </div>
            </div>
            
            {/* Mood Analysis */}
            <div>
              <span className="text-sm font-medium text-gray-700 mb-2 block">무드 분석</span>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-lg">🔥</div>
                  <p className="text-xs text-gray-600">에너지</p>
                  <p className="text-xs text-gray-500">40%</p>
                </div>
                <div className="text-center">
                  <div className="text-lg">😭</div>
                  <p className="text-xs text-gray-600">감성</p>
                  <p className="text-xs text-gray-500">30%</p>
                </div>
                <div className="text-center">
                  <div className="text-lg">😌</div>
                  <p className="text-xs text-gray-600">휴식</p>
                  <p className="text-xs text-gray-500">20%</p>
                </div>
                <div className="text-center">
                  <div className="text-lg">🧠</div>
                  <p className="text-xs text-gray-600">집중</p>
                  <p className="text-xs text-gray-500">10%</p>
                </div>
              </div>
            </div>

            {/* Listening Time */}
            <div>
              <span className="text-sm font-medium text-gray-700 mb-2 block">청취 시간대</span>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">15%</div>
                  <div className="text-xs text-gray-600">오전</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">25%</div>
                  <div className="text-xs text-gray-600">오후</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">35%</div>
                  <div className="text-xs text-gray-600">저녁</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-900">25%</div>
                  <div className="text-xs text-gray-600">밤</div>
                </div>
              </div>
            </div>

            {/* Influence Index */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">78</div>
                <div className="text-xs text-gray-600">탐험 지수</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">12</div>
                <div className="text-xs text-gray-600">영향력 지수</div>
              </div>
            </div>
          </div>
        </div>

        {/* My Waves Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">내 웨이브</h3>
            <button className="text-blue-600 text-sm font-medium">전체보기</button>
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
            <button className="text-blue-600 text-sm font-medium">전체보기</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">좋아요한 트랙</p>
                <p className="text-xs text-gray-600">24곡</p>
              </div>
              <span className="text-xs text-gray-500">❤️ 156</span>
            </div>
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">저장한 트랙</p>
                <p className="text-xs text-gray-600">18곡</p>
              </div>
              <span className="text-xs text-gray-500">🔖 89</span>
            </div>
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
