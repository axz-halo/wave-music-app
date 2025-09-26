'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Clock, Users, Trophy } from 'lucide-react';
import ChallengeCard from '@/components/challenge/ChallengeCard';
import Navigation from '@/components/layout/Navigation';
import { dummyChallenges } from '@/lib/dummy-data';
import supabase from '@/lib/supabaseClient';
import FeaturedChallengeBanner from '@/components/challenge/FeaturedChallengeBanner';

export default function ChallengePage() {
  const [selectedStatus, setSelectedStatus] = useState('진행 중');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const load = async () => {
      if (!supabase) { setItems(dummyChallenges as any); setLoading(false); return; }
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!data) { setItems(dummyChallenges as any); setLoading(false); return; }
      const mapped = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description || '',
        creator: { id: c.creator_id || '0', nickname: '사용자', profileImage: '/default-avatar.png', email: '', followers: 0, following: 0, preferences: { genres: [], notifications: { newWaves: true, comments: true, challenges: true } }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        status: c.status || 'upcoming',
        startDate: c.start_date || new Date().toISOString(),
        endDate: c.end_date || new Date().toISOString(),
        votingEndDate: c.voting_end_date || c.end_date || new Date().toISOString(),
        targetTrackCount: c.target_track_count || 20,
        currentTrackCount: c.current_track_count || 0,
        participants: c.participants || 0,
        rules: c.rules || { genres: [], moods: [], allowDuplicates: false, votingMethod: 'like' },
        thumbnailUrl: c.thumbnail_url || '/default-challenge.jpg',
        createdAt: c.created_at,
      }));
      setItems(mapped);
      setLoading(false);
    };
    load();
  }, []);

  const source = items.length ? items : (dummyChallenges as any);

  const filteredChallenges = source.filter((challenge: any) => {
    if (selectedStatus === '진행 중') return challenge.status === 'active';
    if (selectedStatus === '진행 예정') return challenge.status === 'upcoming';
    if (selectedStatus === '투표 중') return challenge.status === 'voting';
    if (selectedStatus === '완료됨') return challenge.status === 'completed';
    return true;
  });

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return '마감됨';
    const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));
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
      <header className="hidden lg:block bg-sk4-white border-b border-sk4-gray px-6 py-4 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-hierarchy-2xl font-semibold text-beige-800">챌린지</h1>
          <Link href="/challenge/create" className="px-sk4-md py-sk4-sm bg-sk4-orange text-sk4-white sk4-text-sm font-medium rounded hover:bg-opacity-90 transition-all duration-200">
            챌린지 만들기
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden bg-sk4-white border-b border-sk4-gray px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-hierarchy-xl font-semibold text-beige-800">챌린지</h1>
          <Link href="/challenge/create" className="w-9 h-9 bg-sk4-orange rounded-full flex items-center justify-center text-sk4-white hover:bg-opacity-90 transition-all duration-200">
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <div className="max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Featured Top 3 Carousel - upcoming & active only */}
        <section>
          <div className="flex space-x-sk4-sm overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-sk4-sm" style={{height: '180px'}}>
            {source.filter((c:any)=>c.status==='upcoming' || c.status==='active').slice(0,5).map((c:any)=> (
              <div key={c.id} className="min-w-[300px] h-full snap-start">
                <FeaturedChallengeBanner challenge={c} />
              </div>
            ))}
          </div>
        </section>
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

        {/* 완료된 챌린지 */}
        <div>
          <h2 className="text-hierarchy-lg font-semibold text-beige-800 mb-4">완료된 챌린지</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {source.filter((c:any)=>c.status==='completed').map((challenge:any) => (
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
            {filteredChallenges.map((challenge: any) => (
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
