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
    <div className="min-h-screen bg-cream-50 pb-20 lg:pb-0 lg:ml-56">
      {/* Desktop Header */}
      <header className="hidden lg:block bg-cream-100 border-b border-cream-200 px-6 py-4 sticky top-0 z-30 shadow-minimal">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-beige-800">챌린지</h1>
          <Link href="/challenge/create" className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white sk4-text-sm font-medium rounded hover:bg-opacity-90 transition-all duration-200">
            챌린지 만들기
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-cream-100 border-b border-cream-200 px-4 py-4 sticky top-0 z-40 shadow-minimal">
        <div className="flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">챌린지</h1>
          <Link href="/challenge/create" className="w-9 h-9 bg-sk4-orange rounded-full flex items-center justify-center text-sk4-white hover:bg-opacity-90 transition-all duration-200">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Status Tabs */}
        <div className="bg-cream-100 rounded-medium p-1 shadow-minimal border border-cream-200">
          <div className="flex justify-around">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-sk4-md py-sk4-sm rounded sk4-text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-sk4-orange text-sk4-white'
                    : 'bg-sk4-light-gray text-sk4-charcoal hover:bg-sk4-gray'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Challenges */}
        <div>
          <h2 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">인기 챌린지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
          <h2 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">전체 챌린지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
