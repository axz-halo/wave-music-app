'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Clock, Users, Trophy } from 'lucide-react';
import ChallengeCard from '@/components/challenge/ChallengeCard';
import Navigation from '@/components/layout/Navigation';
import { dummyChallenges } from '@/lib/dummy-data';

export default function ChallengePage() {
  const [selectedStatus, setSelectedStatus] = useState('진행 중');
  
  const statuses = ['진행 예정', '진행 중', '투표 중', '완료됨'];
  
  const statusColors = {
    '진행 예정': 'bg-gray-500',
    '진행 중': 'bg-green-500',
    '투표 중': 'bg-orange-500',
    '완료됨': 'bg-blue-500',
  };

  const statusTexts = {
    '진행 예정': '진행 예정',
    '진행 중': '진행 중',
    '투표 중': '투표 중',
    '완료됨': '완료됨',
  };

  const filteredChallenges = dummyChallenges.filter(challenge => {
    if (selectedStatus === '진행 중') return challenge.status === 'active';
    if (selectedStatus === '진행 예정') return challenge.status === 'upcoming';
    if (selectedStatus === '투표 중') return challenge.status === 'voting';
    if (selectedStatus === '완료됨') return challenge.status === 'completed';
    return true;
  });

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffInHours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}시간 남음`;
    return `${Math.floor(diffInHours / 24)}일 남음`;
  };

  const getCountdown = (c: typeof dummyChallenges[number]) => {
    if (c.status === 'upcoming') return `시작까지 ${formatTimeRemaining(c.startDate)}`;
    if (c.status === 'active') return `종료까지 ${formatTimeRemaining(c.endDate)}`;
    if (c.status === 'voting') return `투표 마감 ${formatTimeRemaining(c.votingEndDate)}`;
    return '종료됨';
  };

  const getCtaText = (c: typeof dummyChallenges[number]) => {
    if (c.status === 'upcoming') return '상세보기';
    if (c.status === 'active') return '참여하기';
    if (c.status === 'voting') return '투표하기';
    return '결과보기';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">챌린지</h1>
          <Link href="/challenge/create" className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-all duration-200 shadow-tactile">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Status Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Popular Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">인기 챌린지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {dummyChallenges.slice(0, 3).map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                ctaText={getCtaText(challenge)}
                countdownText={getCountdown(challenge)}
                size="md"
              />
            ))}
          </div>
        </div>

        {/* All Challenges */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">전체 챌린지</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                ctaText={getCtaText(challenge)}
                countdownText={getCountdown(challenge)}
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
